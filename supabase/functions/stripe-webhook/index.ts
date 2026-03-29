/// <reference lib="deno.ns" />
// supabase/functions/stripe-webhook/index.ts
// CREATYNG — Edge Function: stripe-webhook
// Recebe webhooks do Stripe, verifica assinatura, processa checkout.session.completed/expired.
//
// Env vars:
//   STRIPE_WEBHOOK_SECRET — whsec_...
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// ── Stripe signature verification via Web Crypto (Deno) ──

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",").reduce(
    (acc, part) => {
      const [key, val] = part.split("=");
      if (key === "t") acc.timestamp = val;
      if (key === "v1") acc.signatures.push(val);
      return acc;
    },
    { timestamp: "", signatures: [] as string[] }
  );

  if (!parts.timestamp || parts.signatures.length === 0) return false;

  // Reject timestamps older than 5 minutes
  const tolerance = 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(parts.timestamp)) > tolerance) return false;

  const signedPayload = `${parts.timestamp}.${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  const expectedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return parts.signatures.some((sig) => sig === expectedHex);
}

// ── Call send-email Edge Function ──

async function callSendEmail(
  supabaseUrl: string,
  serviceKey: string,
  to: string,
  template: string,
  data: Record<string, unknown>
) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ to, template, data }),
    });
    if (!res.ok) {
      console.warn(`[stripe-webhook] send-email returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[stripe-webhook] send-email call failed:", err);
  }
}

// ── Helper: get bonus_credits for a user ──

async function getBonus(
  client: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { data } = await client
    .from("profiles")
    .select("bonus_credits")
    .eq("id", userId)
    .single();
  return data?.bonus_credits ?? 0;
}

// ── Main handler ──

Deno.serve(async (req: Request) => {
  // Stripe sends POST only; respond 200 to anything else
  if (req.method !== "POST") {
    return json({ received: true }, 200);
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
      return json({ error: "webhook_not_configured" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Verify signature ──
    const rawBody = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";

    const valid = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!valid) {
      console.warn("[stripe-webhook] invalid signature");
      return json({ error: "invalid_signature" }, 401);
    }

    const event = JSON.parse(rawBody);
    console.log(`[stripe-webhook] event=${event.type} id=${event.id}`);

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── checkout.session.completed ──
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata || {};
      const userId = meta.user_id;

      // ── Subscription checkout ──
      if (session.mode === "subscription") {
        const plan = meta.plan; // "pro" | "team"
        const credits = parseInt(meta.credits, 10);
        const subscriptionId = session.subscription;

        if (!userId || !plan || !credits) {
          console.error("[stripe-webhook] subscription missing metadata:", meta);
          return json({ received: true, warning: "missing_metadata" }, 200);
        }

        console.log(`[stripe-webhook] subscription activated — user=${userId} plan=${plan} credits=${credits}`);

        const renewsAt = new Date();
        renewsAt.setDate(renewsAt.getDate() + 30);

        // Update profile with subscription info
        const { error: updateErr } = await adminClient
          .from("profiles")
          .update({
            plan,
            plan_credits: credits,
            stripe_subscription_id: subscriptionId,
            plan_renews_at: renewsAt.toISOString(),
            credits: credits + (await getBonus(adminClient, userId)),
          })
          .eq("id", userId);

        if (updateErr) {
          console.error("[stripe-webhook] profile update failed:", updateErr.message);
        }

        // Insert credit_history
        await adminClient.from("credit_history").insert({
          user_id: userId,
          amount: credits,
          type: "purchase",
          description: `Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)} ativado — ${credits} créditos`,
          reference_id: subscriptionId,
        });

        // Send email
        const { data: profile } = await adminClient
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          await callSendEmail(supabaseUrl, supabaseServiceKey, profile.email, "plan-activated", {
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            credits,
          });
        }

        return json({ received: true, processed: "subscription_activated" }, 200);
      }

      // ── One-time payment checkout ──
      const paymentId = meta.payment_id;
      const credits = parseInt(meta.credits, 10);

      if (!userId || !paymentId || !credits) {
        console.error("[stripe-webhook] missing metadata:", meta);
        return json({ received: true, warning: "missing_metadata" }, 200);
      }

      console.log(
        `[stripe-webhook] completed — user=${userId} payment=${paymentId} credits=${credits}`
      );

      // 1. Update payment → paid
      const { error: updateErr } = await adminClient
        .from("payments")
        .update({
          status: "paid",
          external_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (updateErr) {
        console.error("[stripe-webhook] payment update failed:", updateErr.message);
      }

      // 2. Insert credit_history (positive amount, type purchase)
      const { error: historyErr } = await adminClient
        .from("credit_history")
        .insert({
          user_id: userId,
          amount: credits,
          type: "purchase",
          description: `Stripe checkout — ${credits} créditos`,
          reference_id: session.id,
        });

      if (historyErr) {
        console.error("[stripe-webhook] credit_history insert failed:", historyErr.message);
      }

      // 3. Add credits to bonus_credits + credits
      const { data: profile } = await adminClient
        .from("profiles")
        .select("credits, bonus_credits, email")
        .eq("id", userId)
        .single();

      const currentBonus = profile?.bonus_credits ?? 0;
      const currentCredits = profile?.credits ?? 0;

      const { error: creditErr } = await adminClient
        .from("profiles")
        .update({
          bonus_credits: currentBonus + credits,
          credits: currentCredits + credits,
        })
        .eq("id", userId);

      if (creditErr) {
        console.error("[stripe-webhook] credits update failed:", creditErr.message);
      }

      console.log(
        `[stripe-webhook] bonus_credits ${currentBonus} → ${currentBonus + credits}`
      );

      // 4. Send confirmation email
      if (profile?.email) {
        const amountFormatted = (session.amount_total / 100).toFixed(2).replace(".", ",");
        await callSendEmail(supabaseUrl, supabaseServiceKey, profile.email, "payment-ok", {
          amount: amountFormatted,
          credits,
        });
      }

      return json({ received: true, processed: "checkout.session.completed" }, 200);
    }

    // ── invoice.payment_succeeded (subscription renewal) ──
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      // Only process subscription renewals (not the initial invoice)
      if (invoice.billing_reason !== "subscription_cycle") {
        return json({ received: true, skipped: "not_renewal" }, 200);
      }

      const customerId = invoice.customer;
      if (!customerId) {
        return json({ received: true, warning: "no_customer" }, 200);
      }

      // Find user by stripe_customer_id
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, plan, email, bonus_credits")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) {
        console.warn(`[stripe-webhook] no profile for customer=${customerId}`);
        return json({ received: true, warning: "profile_not_found" }, 200);
      }

      const planCredits = profile.plan === "team" ? 2000 : profile.plan === "pro" ? 500 : 0;
      if (planCredits === 0) {
        return json({ received: true, warning: "free_plan" }, 200);
      }

      const renewsAt = new Date();
      renewsAt.setDate(renewsAt.getDate() + 30);

      // Reset plan_credits, keep bonus_credits, update total
      await adminClient
        .from("profiles")
        .update({
          plan_credits: planCredits,
          credits: planCredits + (profile.bonus_credits ?? 0),
          plan_renews_at: renewsAt.toISOString(),
        })
        .eq("id", profile.id);

      await adminClient.from("credit_history").insert({
        user_id: profile.id,
        amount: planCredits,
        type: "purchase",
        description: `Renovação plano ${profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} — ${planCredits} créditos`,
        reference_id: invoice.id,
      });

      console.log(`[stripe-webhook] renewal — user=${profile.id} plan=${profile.plan} credits=${planCredits}`);

      if (profile.email) {
        const amountFormatted = (invoice.amount_paid / 100).toFixed(2).replace(".", ",");
        await callSendEmail(supabaseUrl, supabaseServiceKey, profile.email, "payment-ok", {
          amount: amountFormatted,
          credits: planCredits,
        });
      }

      return json({ received: true, processed: "invoice.payment_succeeded" }, 200);
    }

    // ── customer.subscription.deleted (cancellation) ──
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, email, bonus_credits")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profile) {
        console.warn(`[stripe-webhook] no profile for customer=${customerId} (subscription.deleted)`);
        return json({ received: true, warning: "profile_not_found" }, 200);
      }

      console.log(`[stripe-webhook] subscription deleted — user=${profile.id}`);

      await adminClient
        .from("profiles")
        .update({
          plan: "free",
          plan_credits: 0,
          stripe_subscription_id: null,
          plan_renews_at: null,
          credits: profile.bonus_credits ?? 0,
        })
        .eq("id", profile.id);

      if (profile.email) {
        await callSendEmail(supabaseUrl, supabaseServiceKey, profile.email, "credits-low", {
          reason: "Plan cancelled — reverted to Free",
        });
      }

      return json({ received: true, processed: "customer.subscription.deleted" }, 200);
    }

    // ── checkout.session.expired ──
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const meta = session.metadata || {};
      const paymentId = meta.payment_id;

      if (paymentId) {
        console.log(`[stripe-webhook] expired — payment=${paymentId}`);

        await adminClient
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);
      }

      return json({ received: true, processed: "checkout.session.expired" }, 200);
    }

    // ── Other events — acknowledge but don't process ──
    return json({ received: true }, 200);
  } catch (err) {
    console.error("[stripe-webhook] unexpected error:", err);
    // Always return 200 to Stripe to prevent retries on our bugs
    return json({ received: true, error: String(err) }, 200);
  }
});
