/// <reference lib="deno.ns" />
// supabase/functions/create-subscription/index.ts
// CREATYNG — Edge Function: create-subscription
// Creates a Stripe Checkout Session in subscription mode for Pro/Team plans.
//
// Env vars:
//   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

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

const PLANS: Record<string, { amountCents: number; credits: number; name: string }> = {
  pro:  { amountCents: 4990,  credits: 500,  name: "Creatyng Pro" },
  team: { amountCents: 14990, credits: 2000, name: "Creatyng Team" },
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

    if (!stripeSecretKey) {
      return json({ error: "stripe_not_configured" }, 500, cors);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let user;
    try {
      const { data, error: authError } = await userClient.auth.getUser();
      user = data?.user;
      if (authError || !user) {
        return json({ error: "unauthorized", detail: authError?.message }, 401, cors);
      }
    } catch (e) {
      return json({ error: "auth_error", detail: String(e) }, 401, cors);
    }

    const userId = user.id;
    const userEmail = user.email || "";

    // ── Parse body ──
    const body = await req.json();
    const planId = String(body.plan || "");

    if (!PLANS[planId]) {
      return json({ error: "invalid_plan", valid: Object.keys(PLANS) }, 400, cors);
    }

    const plan = PLANS[planId];
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Find or create Stripe Customer ──
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const custBody = new URLSearchParams({
        email: userEmail,
        "metadata[user_id]": userId,
      });

      const custRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: custBody.toString(),
      });

      if (!custRes.ok) {
        const errBody = await custRes.text();
        console.error("[create-subscription] Stripe customer create failed:", errBody);
        return json({ error: "customer_create_failed" }, 502, cors);
      }

      const customer = await custRes.json();
      stripeCustomerId = customer.id;

      // Save to profile
      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);
    }

    console.log(`[create-subscription] user=${userId} plan=${planId} customer=${stripeCustomerId}`);

    // ── Create Stripe Checkout Session (subscription mode) ──
    const checkoutBody = new URLSearchParams({
      mode: "subscription",
      customer: stripeCustomerId!,
      "line_items[0][price_data][currency]": "brl",
      "line_items[0][price_data][unit_amount]": String(plan.amountCents),
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": plan.name,
      "line_items[0][quantity]": "1",
      success_url: "https://aesthetic-ai-engine.vercel.app/app/billing?subscription=success",
      cancel_url: "https://aesthetic-ai-engine.vercel.app/app/billing?subscription=cancelled",
      "metadata[user_id]": userId,
      "metadata[plan]": planId,
      "metadata[credits]": String(plan.credits),
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan]": planId,
      "subscription_data[metadata][credits]": String(plan.credits),
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutBody.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error(`[create-subscription] Stripe error ${stripeRes.status}:`, errBody);
      return json({ error: "stripe_error", status: stripeRes.status, detail: errBody }, 502, cors);
    }

    const session = await stripeRes.json();
    console.log(`[create-subscription] session created: ${session.id}`);

    return json({ url: session.url }, 200, cors);
  } catch (err) {
    console.error("[create-subscription] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
