/// <reference lib="deno.ns" />
// supabase/functions/debit-credits/index.ts
// CREATYNG — Edge Function: debit-credits
// Debita créditos do usuário de forma atômica via RPC + insere em credit_history.

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

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    // --- Auth: identify user via Authorization header ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return json({ error: "missing_authorization" }, 401, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (anon key + user's JWT) to identify the caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "unauthorized", detail: authError?.message }, 401, cors);
    }

    const userId = user.id;

    // --- Parse body ---
    const body = await req.json();
    const { amount, description, reference_id } = body as {
      amount?: number;
      description?: string;
      reference_id?: string;
    };

    if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
      return json({ error: "invalid_amount", detail: "amount must be a positive integer" }, 400, cors);
    }

    // --- Admin client for privileged operations ---
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // --- Check current balance ---
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return json(
        { error: "profile_not_found", detail: profileError?.message },
        404,
        cors
      );
    }

    const currentCredits: number = profile.credits ?? 0;

    if (currentCredits < amount) {
      return json(
        {
          error: "insufficient_credits",
          current: currentCredits,
          required: amount,
        },
        402,
        cors
      );
    }

    // --- Atomic debit via RPC ---
    const { error: rpcError } = await adminClient.rpc("debit_credits_atomic", {
      p_user_id: userId,
      p_amount: amount,
    });

    if (rpcError) {
      // RPC raises exception if concurrent debit drained credits
      if (rpcError.message?.includes("Insufficient credits")) {
        // Re-fetch current balance for accurate response
        const { data: freshProfile } = await adminClient
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        return json(
          {
            error: "insufficient_credits",
            current: freshProfile?.credits ?? 0,
            required: amount,
          },
          402,
          cors
        );
      }
      return json(
        { error: "debit_failed", detail: rpcError.message },
        500,
        cors
      );
    }

    // --- Insert credit_history record ---
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
      // Non-blocking: debit already happened, log but don't fail the response
    }

    // --- Fetch remaining balance ---
    const { data: updatedProfile } = await adminClient
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    const remaining = updatedProfile?.credits ?? currentCredits - amount;

    console.log(
      `[debit-credits] user=${userId} debited=${amount} remaining=${remaining} ref=${reference_id ?? "none"}`
    );

    return json({ success: true, remaining }, 200, cors);
  } catch (err) {
    console.error("[debit-credits] unexpected error:", err);
    return json(
      { error: "internal_error", detail: String(err) },
      500,
      cors
    );
  }
});
