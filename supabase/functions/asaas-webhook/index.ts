/// <reference lib="deno.ns" />
// supabase/functions/asaas-webhook/index.ts
// CREATYNG — Edge Function: asaas-webhook
// Recebe webhooks da Asaas, valida token, processa pagamentos Pix.
//
// Env vars:
//   ASAAS_WEBHOOK_TOKEN — token de validação do webhook
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

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
      console.warn(`[asaas-webhook] send-email returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[asaas-webhook] send-email call failed:", err);
  }
}

async function processPaymentConfirmed(
  adminClient: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  asaasPaymentId: string
): Promise<{ processed: boolean; detail?: string }> {
  // Find payment by external_id
  const { data: payment, error: findErr } = await adminClient
    .from("payments")
    .select("id, user_id, credits, status, amount_cents")
    .eq("external_id", asaasPaymentId)
    .single();

  if (findErr || !payment) {
    console.warn(`[asaas-webhook] payment not found for external_id=${asaasPaymentId}`);
    return { processed: false, detail: "payment_not_found" };
  }

  // Idempotency: skip if already paid
  if (payment.status === "paid") {
    console.log(`[asaas-webhook] payment ${payment.id} already paid — skipping`);
    return { processed: true, detail: "already_paid" };
  }

  const { id: paymentId, user_id: userId, credits, amount_cents: amountCents } = payment;

  console.log(`[asaas-webhook] confirmed — user=${userId} payment=${paymentId} credits=${credits}`);

  // 1. Update payment → paid
  const { error: updateErr } = await adminClient
    .from("payments")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (updateErr) {
    console.error("[asaas-webhook] payment update failed:", updateErr.message);
  }

  // 2. Insert credit_history
  const { error: historyErr } = await adminClient
    .from("credit_history")
    .insert({
      user_id: userId,
      amount: credits,
      type: "purchase",
      description: `Pix — ${credits} créditos`,
      reference_id: asaasPaymentId,
    });

  if (historyErr) {
    console.error("[asaas-webhook] credit_history insert failed:", historyErr.message);
  }

  // 3. Add credits to profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("credits, email")
    .eq("id", userId)
    .single();

  const currentCredits = profile?.credits ?? 0;
  const newCredits = currentCredits + credits;

  const { error: creditErr } = await adminClient
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", userId);

  if (creditErr) {
    console.error("[asaas-webhook] credits update failed:", creditErr.message);
  }

  console.log(`[asaas-webhook] credits updated — ${currentCredits} → ${newCredits}`);

  // 4. Send confirmation email
  if (profile?.email) {
    const amountFormatted = ((amountCents || 0) / 100).toFixed(2).replace(".", ",");
    await callSendEmail(supabaseUrl, serviceKey, profile.email, "payment-ok", {
      amount: amountFormatted,
      credits,
    });
  }

  return { processed: true };
}

const PLAN_CREDITS: Record<string, number> = {
  pro: 500,
  team: 2000,
};

async function processSubscriptionPayment(
  adminClient: ReturnType<typeof createClient>,
  subscriptionId: string,
  asaasPaymentId: string
): Promise<{ processed: boolean; detail?: string }> {
  // Find user by asaas_subscription_id
  const { data: profile, error: findErr } = await adminClient
    .from("profiles")
    .select("id, plan, plan_credits, bonus_credits, email")
    .eq("asaas_subscription_id", subscriptionId)
    .single();

  if (findErr || !profile) {
    console.warn(`[asaas-webhook] subscription profile not found for sub=${subscriptionId}`);
    return { processed: false, detail: "subscription_profile_not_found" };
  }

  const planCredits = PLAN_CREDITS[profile.plan || "pro"] || 500;
  const bc = profile.bonus_credits ?? 0;
  const nextRenew = new Date();
  nextRenew.setMonth(nextRenew.getMonth() + 1);

  // Reset plan_credits for renewal
  const { error: updateErr } = await adminClient
    .from("profiles")
    .update({
      plan_credits: planCredits,
      credits: planCredits + bc,
      plan_renews_at: nextRenew.toISOString(),
    })
    .eq("id", profile.id);

  if (updateErr) {
    console.error("[asaas-webhook] subscription credit reset failed:", updateErr.message);
  }

  // Insert credit_history
  await adminClient
    .from("credit_history")
    .insert({
      user_id: profile.id,
      amount: planCredits,
      type: "subscription_renewal",
      description: `Asaas Pix — renovação ${profile.plan}`,
      reference_id: asaasPaymentId,
    });

  console.log(`[asaas-webhook] subscription payment confirmed — user=${profile.id} plan=${profile.plan} credits=${planCredits}`);
  return { processed: true };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ received: true }, 200);
  }

  try {
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    if (!webhookToken) {
      console.error("[asaas-webhook] ASAAS_WEBHOOK_TOKEN not configured");
      return json({ error: "webhook_not_configured" }, 500);
    }

    // ── Validate token ──
    const incomingToken = req.headers.get("asaas-access-token") || req.headers.get("access_token") || "";
    if (incomingToken !== webhookToken) {
      console.warn("[asaas-webhook] invalid token");
      return json({ error: "invalid_token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const event = body.event as string;
    const asaasPayment = body.payment;

    console.log(`[asaas-webhook] event=${event} payment=${asaasPayment?.id}`);

    if (!asaasPayment?.id) {
      return json({ received: true, warning: "no_payment_id" }, 200);
    }

    const subscriptionId = asaasPayment.subscription || null;

    // ── PAYMENT_CONFIRMED / PAYMENT_RECEIVED ──
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // Check if this is a subscription payment
      if (subscriptionId) {
        const result = await processSubscriptionPayment(
          adminClient,
          subscriptionId,
          asaasPayment.id
        );
        return json({ received: true, ...result }, 200);
      }

      // One-time Pix payment
      const result = await processPaymentConfirmed(
        adminClient,
        supabaseUrl,
        supabaseServiceKey,
        asaasPayment.id
      );
      return json({ received: true, ...result }, 200);
    }

    // ── PAYMENT_OVERDUE / PAYMENT_DELETED ──
    if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") {
      console.log(`[asaas-webhook] ${event} — marking failed`);

      await adminClient
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("external_id", asaasPayment.id);

      return json({ received: true, processed: event }, 200);
    }

    // ── SUBSCRIPTION_DELETED / SUBSCRIPTION_INACTIVE ──
    if (event === "SUBSCRIPTION_DELETED" || event === "SUBSCRIPTION_INACTIVE") {
      console.log(`[asaas-webhook] ${event} sub=${subscriptionId || body.subscription?.id}`);

      const subId = subscriptionId || body.subscription?.id;
      if (subId) {
        const { data: subProfile } = await adminClient
          .from("profiles")
          .select("id, bonus_credits")
          .eq("asaas_subscription_id", subId)
          .single();

        if (subProfile) {
          const bc = subProfile.bonus_credits ?? 0;
          await adminClient
            .from("profiles")
            .update({
              plan: "free",
              plan_credits: 0,
              credits: bc,
              asaas_subscription_id: null,
              plan_renews_at: null,
            })
            .eq("id", subProfile.id);

          console.log(`[asaas-webhook] subscription cancelled for user=${subProfile.id}`);
        }
      }

      return json({ received: true, processed: event }, 200);
    }

    // ── Other events ──
    return json({ received: true }, 200);
  } catch (err) {
    console.error("[asaas-webhook] unexpected error:", err);
    return json({ received: true, error: String(err) }, 200);
  }
});
