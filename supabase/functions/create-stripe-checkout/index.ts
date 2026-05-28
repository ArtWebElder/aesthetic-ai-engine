/// <reference lib="deno.ns" />
// supabase/functions/create-stripe-checkout/index.ts
// CREATYNG — Edge Function: create-stripe-checkout
// Cria sessão de checkout Stripe para compra de créditos.
//
// Env vars:
//   STRIPE_SECRET_KEY — sk_live_... ou sk_test_...
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function json(
  data: unknown,
  status = 200,
  extra: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

const PACKAGES: Record<string, { amountCents: number; credits: number }> = {
  "100": { amountCents: 990, credits: 100 },
  "300": { amountCents: 2490, credits: 300 },
  "500": { amountCents: 3990, credits: 500 },
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    console.log("[create-stripe-checkout] env:", {
      url: supabaseUrl,
      anonKeyExists: !!supabaseAnonKey,
      serviceKeyExists: !!supabaseServiceKey,
      stripeKeyExists: !!stripeSecretKey,
      authHeader: authHeader.substring(0, 20) + "...",
    });

    if (!stripeSecretKey) {
      console.error("[create-stripe-checkout] STRIPE_SECRET_KEY not configured");
      return json({ error: "stripe_not_configured" }, 500, cors);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let user;
    try {
      const { data, error: authError } = await userClient.auth.getUser();
      user = data?.user;
      console.log("[create-stripe-checkout] getUser:", { userId: user?.id, error: authError?.message });
      if (authError || !user) {
        return json({ error: "unauthorized", detail: authError?.message }, 401, cors);
      }
    } catch (e) {
      console.error("[create-stripe-checkout] getUser CRASHED:", e);
      return json({ error: "auth_error", detail: String(e) }, 401, cors);
    }

    const userId = user.id;

    // ── Parse body ──
    const body = await req.json();
    const pkg = String(body.package || "");

    if (!PACKAGES[pkg]) {
      return json(
        { error: "invalid_package", valid: Object.keys(PACKAGES) },
        400,
        cors
      );
    }

    const { amountCents, credits } = PACKAGES[pkg];

    // ── Admin client ──
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Create pending payment record ──
    const { data: payment, error: paymentError } = await adminClient
      .from("payments")
      .insert({
        user_id: userId,
        provider: "stripe",
        amount_cents: amountCents,
        credits,
        status: "pending",
        metadata: { package: pkg },
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("[create-stripe-checkout] payment insert failed:", paymentError?.message);
      return json({ error: "payment_create_failed", detail: paymentError?.message }, 500, cors);
    }

    const paymentId = payment.id;

    console.log(`[create-stripe-checkout] user=${userId} package=${pkg} credits=${credits} payment=${paymentId}`);

    // ── Create Stripe Checkout Session ──
    const stripeBody = new URLSearchParams({
      mode: "payment",
      currency: "brl",
      "line_items[0][price_data][currency]": "brl",
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][price_data][product_data][name]": `${credits} Créditos Creatyng`,
      "line_items[0][quantity]": "1",
      success_url: "https://app.creatyng.com/app/billing?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://app.creatyng.com/app/billing?cancelled=true",
      client_reference_id: userId,
      "metadata[user_id]": userId,
      "metadata[payment_id]": paymentId,
      "metadata[credits]": String(credits),
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error(`[create-stripe-checkout] Stripe error ${stripeRes.status}:`, errBody);

      // Mark payment as failed
      await adminClient
        .from("payments")
        .update({ status: "failed", metadata: { package: pkg, stripe_error: errBody } })
        .eq("id", paymentId);

      return json({ error: "stripe_error", status: stripeRes.status, detail: errBody }, 502, cors);
    }

    const session = await stripeRes.json();

    // ── Update payment with Stripe session ID ──
    await adminClient
      .from("payments")
      .update({ external_id: session.id })
      .eq("id", paymentId);

    console.log(`[create-stripe-checkout] session created: ${session.id}`);

    return json({ url: session.url }, 200, cors);
  } catch (err) {
    console.error("[create-stripe-checkout] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
