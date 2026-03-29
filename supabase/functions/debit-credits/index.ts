/// <reference lib="deno.ns" />
// supabase/functions/debit-credits/index.ts
// CREATYNG — Edge Function: debit-credits
// Debits credits atomically: plan_credits first, then bonus_credits.
// Returns remaining_plan, remaining_bonus, remaining (total).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "unauthorized", detail: authError?.message }, 401, cors);
    }

    const userId = user.id;

    const body = await req.json();
    const { amount, description, reference_id } = body as {
      amount?: number;
      description?: string;
      reference_id?: string;
    };

    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return json({ error: "invalid_amount", detail: "amount must be a positive integer" }, 400, cors);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current balances
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("plan_credits, bonus_credits, credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return json({ error: "profile_not_found", detail: profileError?.message }, 404, cors);
    }

    const pc = profile.plan_credits ?? 0;
    const bc = profile.bonus_credits ?? 0;
    const total = pc + bc;

    if (total < amount) {
      return json(
        { error: "insufficient_credits", current: total, required: amount },
        402,
        cors
      );
    }

    // Atomic debit via updated RPC
    const { error: rpcError } = await adminClient.rpc("debit_credits_atomic", {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      if (rpcError.message?.includes("Insufficient credits")) {
        const { data: freshProfile } = await adminClient
          .from("profiles")
          .select("plan_credits, bonus_credits")
          .eq("id", userId)
          .single();

        const freshTotal = (freshProfile?.plan_credits ?? 0) + (freshProfile?.bonus_credits ?? 0);
        return json(
          { error: "insufficient_credits", current: freshTotal, required: amount },
          402,
          cors
        );
      }
      return json({ error: "debit_failed", detail: rpcError.message }, 500, cors);
    }

    // Insert credit_history
    const { error: historyError } = await adminClient
      .from("credit_history")
      .insert({
        user_id: userId,
        amount: -amount,
        type: "debit",
        description: description || null,
        reference_id: reference_id || null,
      });

    if (historyError) {
      console.error("[debit-credits] credit_history insert failed:", historyError.message);
    }

    // Fetch updated balances
    const { data: updatedProfile } = await adminClient
      .from("profiles")
      .select("plan_credits, bonus_credits, credits")
      .eq("id", userId)
      .single();

    const remainingPlan = updatedProfile?.plan_credits ?? 0;
    const remainingBonus = updatedProfile?.bonus_credits ?? 0;
    const remaining = updatedProfile?.credits ?? (remainingPlan + remainingBonus);

    console.log(
      `[debit-credits] user=${userId} debited=${amount} remaining=${remaining} (plan=${remainingPlan} bonus=${remainingBonus}) ref=${reference_id ?? "none"}`
    );

    return json({
      success: true,
      remaining,
      remaining_plan: remainingPlan,
      remaining_bonus: remainingBonus,
    }, 200, cors);
  } catch (err) {
    console.error("[debit-credits] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
