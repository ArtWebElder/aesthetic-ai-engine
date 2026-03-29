/// <reference lib="deno.ns" />
// supabase/functions/create-asaas-subscription/index.ts
// CREATYNG — Edge Function: create-asaas-subscription
// Creates a recurring Pix subscription via Asaas API.
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

const PLANS: Record<string, { value: number; credits: number; name: string }> = {
  pro:  { value: 49.90,  credits: 500,  name: "Creatyng Pro" },
  team: { value: 149.90, credits: 2000, name: "Creatyng Team" },
};

async function asaasFetch(
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${ASAAS_BASE}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey,
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

async function findOrCreateCustomer(
  apiKey: string,
  email: string,
  name: string,
  cpfCnpj: string
): Promise<string> {
  const searchRes = await asaasFetch(`/customers?email=${encodeURIComponent(email)}`, apiKey);
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length > 0) {
      const existing = searchData.data[0];
      if (!existing.cpfCnpj && cpfCnpj) {
        await asaasFetch(`/customers/${existing.id}`, apiKey, {
          method: "PUT",
          body: JSON.stringify({ cpfCnpj }),
        }).catch(() => {});
      }
      return existing.id;
    }
  }

  const createRes = await asaasFetch("/customers", apiKey, {
    method: "POST",
    body: JSON.stringify({
      name: name || email.split("@")[0],
      email,
      cpfCnpj,
      notificationDisabled: false,
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.text();
    throw new Error(`Asaas customer create failed (${createRes.status}): ${errBody}`);
  }

  const customer = await createRes.json();
  return customer.id;
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
      console.error("[create-asaas-subscription] ASAAS_API_KEY not configured");
      return json({ error: "pix_not_configured" }, 500, cors);
    }

    console.log("[create-asaas-subscription] starting for user auth");

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
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      userEmail.split("@")[0];

    // ── Parse body ──
    const body = await req.json();
    const planId = String(body.plan || "");
    const cpfCnpj = String(body.cpfCnpj || "").replace(/\D/g, "");

    console.log(`[create-asaas-subscription] user=${userId} plan=${planId} cpfLen=${cpfCnpj.length}`);

    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      console.error(`[create-asaas-subscription] invalid cpfCnpj length: ${cpfCnpj.length}`);
      return json({ error: "cpf_required", detail: "CPF (11 digits) or CNPJ (14 digits) is required" }, 400, cors);
    }

    const planConfig = PLANS[planId];
    if (!planConfig) {
      return json({ error: "invalid_plan", valid: Object.keys(PLANS) }, 400, cors);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Save CPF/CNPJ to profile ──
    await adminClient
      .from("profiles")
      .update({ cpf_cnpj: cpfCnpj })
      .eq("id", userId)
      .catch(() => {});

    // ── Check if user already has an active Asaas subscription ──
    const { data: profile } = await adminClient
      .from("profiles")
      .select("asaas_subscription_id, asaas_customer_id")
      .eq("id", userId)
      .single();

    if (profile?.asaas_subscription_id) {
      return json({ error: "already_subscribed", detail: "Cancel current subscription first" }, 409, cors);
    }

    // ── Find or create Asaas customer ──
    let customerId: string;
    try {
      if (profile?.asaas_customer_id) {
        customerId = profile.asaas_customer_id;
        console.log(`[create-asaas-subscription] reusing existing customer=${customerId}`);
      } else {
        console.log(`[create-asaas-subscription] creating customer for email=${userEmail} cpf=${cpfCnpj.slice(0,3)}***`);
        customerId = await findOrCreateCustomer(asaasApiKey, userEmail, userName, cpfCnpj);
        console.log(`[create-asaas-subscription] customer created=${customerId}`);
      }
    } catch (err) {
      console.error(`[create-asaas-subscription] customer creation failed:`, String(err));
      return json({ error: "customer_create_failed", detail: String(err) }, 502, cors);
    }

    // ── Create Asaas subscription ──
    const nextCycleDay = new Date();
    nextCycleDay.setDate(nextCycleDay.getDate() + 1);
    const nextDueDateStr = nextCycleDay.toISOString().split("T")[0];

    const subRes = await asaasFetch("/subscriptions", asaasApiKey, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: planConfig.value,
        cycle: "MONTHLY",
        description: `${planConfig.name} — ${planConfig.credits} créditos/mês`,
        externalReference: userId,
        nextDueDate: nextDueDateStr,
      }),
    });

    if (!subRes.ok) {
      const errBody = await subRes.text();
      console.error(`[create-asaas-subscription] Asaas error ${subRes.status}:`, errBody);
      return json({ error: "subscription_create_failed", detail: errBody }, 502, cors);
    }

    const subscription = await subRes.json();
    const asaasSubId = subscription.id;

    console.log(`[create-asaas-subscription] created sub=${asaasSubId} for user=${userId} plan=${planId}`);

    // ── Update profile ──
    await adminClient
      .from("profiles")
      .update({
        asaas_customer_id: customerId,
        asaas_subscription_id: asaasSubId,
        plan: planId,
        plan_credits: planConfig.credits,
        plan_renews_at: nextCycleDay.toISOString(),
      })
      .eq("id", userId);

    // ── Update total credits ──
    const { data: updatedProfile } = await adminClient
      .from("profiles")
      .select("plan_credits, bonus_credits")
      .eq("id", userId)
      .single();

    const total = (updatedProfile?.plan_credits ?? 0) + (updatedProfile?.bonus_credits ?? 0);
    await adminClient
      .from("profiles")
      .update({ credits: total })
      .eq("id", userId);

    // ── Insert credit_history ──
    await adminClient
      .from("credit_history")
      .insert({
        user_id: userId,
        amount: planConfig.credits,
        type: "subscription",
        description: `${planConfig.name} — assinatura Pix`,
        reference_id: asaasSubId,
      });

    return json({
      success: true,
      subscription_id: asaasSubId,
      plan: planId,
      credits: planConfig.credits,
    }, 200, cors);
  } catch (err) {
    console.error("[create-asaas-subscription] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
