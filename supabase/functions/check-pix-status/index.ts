/// <reference lib="deno.ns" />
// supabase/functions/check-pix-status/index.ts
// CREATYNG — Edge Function: check-pix-status
// Polling endpoint para frontend verificar se Pix foi pago.
// Se Asaas confirmar pagamento, processa créditos inline (mesma lógica do webhook).
//
// Env vars:
//   ASAAS_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

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

const ASAAS_BASE = "https://api.asaas.com/v3";

const CONFIRMED_STATUSES = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];

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
      console.warn(`[check-pix-status] send-email returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[check-pix-status] send-email call failed:", err);
  }
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
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

    if (!asaasApiKey) {
      return json({ error: "pix_not_configured" }, 500, cors);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return json({ error: "unauthorized" }, 401, cors);
    }

    // ── Parse body ──
    const body = await req.json();
    const paymentId = body.payment_id as string;

    if (!paymentId) {
      return json({ error: "missing_payment_id" }, 400, cors);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Fetch payment ──
    const { data: payment, error: findErr } = await adminClient
      .from("payments")
      .select("id, user_id, credits, status, external_id, amount_cents")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (findErr || !payment) {
      return json({ error: "payment_not_found" }, 404, cors);
    }

    // Already paid — return immediately
    if (payment.status === "paid") {
      return json({ status: "paid", credits: payment.credits }, 200, cors);
    }

    // Already failed
    if (payment.status === "failed") {
      return json({ status: "failed" }, 200, cors);
    }

    // ── Check Asaas API ──
    if (!payment.external_id) {
      return json({ status: "pending" }, 200, cors);
    }

    const asaasRes = await fetch(`${ASAAS_BASE}/payments/${payment.external_id}`, {
      headers: {
        accept: "application/json",
        access_token: asaasApiKey,
      },
    });

    if (!asaasRes.ok) {
      console.warn(`[check-pix-status] Asaas API returned ${asaasRes.status}`);
      return json({ status: "pending" }, 200, cors);
    }

    const asaasPayment = await asaasRes.json();
    const asaasStatus = asaasPayment.status as string;

    console.log(`[check-pix-status] payment=${paymentId} asaas_status=${asaasStatus}`);

    // ── Not confirmed yet ──
    if (!CONFIRMED_STATUSES.includes(asaasStatus)) {
      const mappedStatus = asaasStatus === "OVERDUE" || asaasStatus === "DELETED" ? "failed" : "pending";

      if (mappedStatus === "failed" && payment.status !== "failed") {
        await adminClient
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", paymentId);
      }

      return json({ status: mappedStatus }, 200, cors);
    }

    // ── Confirmed! Process payment ──
    console.log(`[check-pix-status] confirmed — processing credits for payment=${paymentId}`);

    const { user_id: userId, credits, amount_cents: amountCents } = payment;

    // 1. Update payment → paid
    await adminClient
      .from("payments")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", paymentId);

    // 2. Insert credit_history
    await adminClient
      .from("credit_history")
      .insert({
        user_id: userId,
        amount: credits,
        type: "purchase",
        description: `Pix — ${credits} créditos`,
        reference_id: payment.external_id,
      });

    // 3. Add credits to profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("credits, email")
      .eq("id", userId)
      .single();

    const currentCredits = profile?.credits ?? 0;
    const newCredits = currentCredits + credits;

    await adminClient
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    console.log(`[check-pix-status] credits updated — ${currentCredits} → ${newCredits}`);

    // 4. Send email
    if (profile?.email) {
      const amountFormatted = ((amountCents || 0) / 100).toFixed(2).replace(".", ",");
      await callSendEmail(supabaseUrl, supabaseServiceKey, profile.email, "payment-ok", {
        amount: amountFormatted,
        credits,
      });
    }

    return json({ status: "paid", credits }, 200, cors);
  } catch (err) {
    console.error("[check-pix-status] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
