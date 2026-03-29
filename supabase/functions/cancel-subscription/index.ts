/// <reference lib="deno.ns" />
// supabase/functions/cancel-subscription/index.ts
// CREATYNG — Edge Function: cancel-subscription
// Cancels the user's Stripe subscription at period end.
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Get subscription ID ──
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return json({ error: "no_active_subscription" }, 400, cors);
    }

    const subId = profile.stripe_subscription_id;
    console.log(`[cancel-subscription] user=${user.id} subscription=${subId}`);

    // ── Cancel at period end via Stripe API ──
    const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "cancel_at_period_end=true",
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error(`[cancel-subscription] Stripe error ${stripeRes.status}:`, errBody);
      return json({ error: "stripe_error", detail: errBody }, 502, cors);
    }

    const subscription = await stripeRes.json();
    const cancelAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    console.log(`[cancel-subscription] will cancel at ${cancelAt}`);

    return json({ success: true, cancel_at: cancelAt }, 200, cors);
  } catch (err) {
    console.error("[cancel-subscription] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
