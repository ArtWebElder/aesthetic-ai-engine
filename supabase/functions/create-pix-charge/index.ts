/// <reference lib="deno.ns" />
// supabase/functions/create-pix-charge/index.ts
// CREATYNG — Edge Function: create-pix-charge
// Cria cobrança Pix via Asaas API e retorna QR code.
//
// Env vars:
//   ASAAS_API_KEY — access_token da Asaas
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

const ASAAS_BASE = "https://api.asaas.com/v3";

const PACKAGES: Record<string, { value: number; credits: number }> = {
  "100": { value: 9.90, credits: 100 },
  "300": { value: 24.90, credits: 300 },
  "500": { value: 39.90, credits: 500 },
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
  // Search existing customer by email
  const searchRes = await asaasFetch(`/customers?email=${encodeURIComponent(email)}`, apiKey);
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length > 0) {
      const existing = searchData.data[0];
      // Update cpfCnpj if missing on existing customer
      if (!existing.cpfCnpj && cpfCnpj) {
        await asaasFetch(`/customers/${existing.id}`, apiKey, {
          method: "PUT",
          body: JSON.stringify({ cpfCnpj }),
        }).catch(() => {});
      }
      return existing.id;
    }
  }

  // Create new customer with CPF/CNPJ
  const createRes = await asaasFetch("/customers", apiKey, {
    method: "POST",
    body: JSON.stringify({
      name: name || email.split("@")[0],
      email,
      cpfCnpj,
      notificationDisabled: true,
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

    console.log("[create-pix-charge] env:", {
      url: supabaseUrl,
      anonKeyExists: !!supabaseAnonKey,
      serviceKeyExists: !!supabaseServiceKey,
      asaasKeyExists: !!asaasApiKey,
      authHeader: authHeader.substring(0, 20) + "...",
    });

    if (!asaasApiKey) {
      console.error("[create-pix-charge] ASAAS_API_KEY not configured");
      return json({ error: "pix_not_configured" }, 500, cors);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let user;
    try {
      const { data, error: authError } = await userClient.auth.getUser();
      user = data?.user;
      console.log("[create-pix-charge] getUser:", { userId: user?.id, error: authError?.message });
      if (authError || !user) {
        return json({ error: "unauthorized", detail: authError?.message }, 401, cors);
      }
    } catch (e) {
      console.error("[create-pix-charge] getUser CRASHED:", e);
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
    const pkg = String(body.package || "");
    const cpfCnpj = String(body.cpfCnpj || "").replace(/\D/g, "");

    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      return json({ error: "cpf_required", detail: "CPF (11 digits) or CNPJ (14 digits) is required for Pix" }, 400, cors);
    }

    if (!PACKAGES[pkg]) {
      return json({ error: "invalid_package", valid: Object.keys(PACKAGES) }, 400, cors);
    }

    const { value, credits } = PACKAGES[pkg];

    // ── Admin client ──
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Save CPF/CNPJ to profile for next time ──
    await adminClient
      .from("profiles")
      .update({ cpf_cnpj: cpfCnpj })
      .eq("id", userId)
      .then(() => {})
      .catch((e: unknown) => console.warn("[create-pix-charge] cpf_cnpj save failed:", e));

    // ── Create pending payment ──
    const { data: payment, error: paymentError } = await adminClient
      .from("payments")
      .insert({
        user_id: userId,
        provider: "asaas",
        amount_cents: Math.round(value * 100),
        credits,
        status: "pending",
        metadata: { package: pkg },
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("[create-pix-charge] payment insert failed:", paymentError?.message);
      return json({ error: "payment_create_failed", detail: paymentError?.message }, 500, cors);
    }

    const paymentId = payment.id;
    console.log(`[create-pix-charge] user=${userId} package=${pkg} credits=${credits} payment=${paymentId}`);

    // ── Find or create Asaas customer ──
    let customerId: string;
    try {
      customerId = await findOrCreateCustomer(asaasApiKey, userEmail, userName, cpfCnpj);
    } catch (err) {
      console.error("[create-pix-charge] customer error:", err);
      return json({ error: "customer_create_failed", detail: String(err) }, 502, cors);
    }

    // ── Create Pix charge ──
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // expires in 24h
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const chargeRes = await asaasFetch("/payments", asaasApiKey, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value,
        description: `${credits} Créditos Creatyng`,
        externalReference: paymentId,
        dueDate: dueDateStr,
      }),
    });

    if (!chargeRes.ok) {
      const errBody = await chargeRes.text();
      console.error(`[create-pix-charge] Asaas charge error ${chargeRes.status}:`, errBody);

      await adminClient
        .from("payments")
        .update({ status: "failed", metadata: { package: pkg, asaas_error: errBody } })
        .eq("id", paymentId);

      return json({ error: "charge_create_failed", status: chargeRes.status, detail: errBody }, 502, cors);
    }

    const charge = await chargeRes.json();
    const asaasPaymentId = charge.id;

    // ── Update payment with external_id ──
    await adminClient
      .from("payments")
      .update({ external_id: asaasPaymentId })
      .eq("id", paymentId);

    // ── Fetch QR Code ──
    const qrRes = await asaasFetch(`/payments/${asaasPaymentId}/pixQrCode`, asaasApiKey);

    let qrCodeImage = "";
    let qrCodePayload = "";
    let expiration = dueDateStr;

    if (qrRes.ok) {
      const qrData = await qrRes.json();
      qrCodeImage = qrData.encodedImage || "";
      qrCodePayload = qrData.payload || "";
      expiration = qrData.expirationDate || dueDateStr;
    } else {
      console.warn(`[create-pix-charge] QR code fetch failed (${qrRes.status})`);
    }

    console.log(`[create-pix-charge] charge created: ${asaasPaymentId}`);

    return json(
      {
        payment_id: paymentId,
        qr_code_image: qrCodeImage,
        qr_code_payload: qrCodePayload,
        expiration,
      },
      200,
      cors
    );
  } catch (err) {
    console.error("[create-pix-charge] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
