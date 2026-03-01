/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin: string | null) {
  const allowOrigin = origin ?? "*";
  return {
    "access-control-allow-origin": allowOrigin === "null" ? "*" : allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers":
      "authorization, x-client-info, apikey, content-type, x-requested-with",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    vary: "Origin",
  };
}

function base64ToUint8(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64url(input: Uint8Array) {
  let s = "";
  for (let i = 0; i < input.length; i++) s += String.fromCharCode(input[i]);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwtRS256(payload: Record<string, unknown>, privateKeyPem: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;

  const keyData = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const pkcs8 = base64ToUint8(keyData);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    enc.encode(data),
  );

  const sigB64 = b64url(new Uint8Array(signature));
  return `${data}.${sigB64}`;
}

async function getGoogleAccessToken(serviceAccount: any) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const assertion = await signJwtRS256(payload, serviceAccount.private_key);

  const body = new URLSearchParams();
  body.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  body.set("assertion", assertion);

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`oauth_token_error: ${resp.status} ${t}`);
  }

  return await resp.json() as { access_token: string; expires_in: number; token_type: string };
}

type GenerateBody = {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
  module?: string;
};

function looksLikeBucketMissing(message: string) {
  const m = message.toLowerCase();
  return m.includes("bucket") && (m.includes("not found") || m.includes("does not exist"));
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);

  try {
    const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID") ?? "";
    const GCP_LOCATION = Deno.env.get("GCP_LOCATION") ?? "us-central1";
    const GCP_SA_KEY_B64 = Deno.env.get("GCP_SA_KEY_B64") ?? "";

    if (!GCP_PROJECT_ID) return json({ error: "missing_secret", key: "GCP_PROJECT_ID" }, 500, headers);
    if (!GCP_SA_KEY_B64) return json({ error: "missing_secret", key: "GCP_SA_KEY_B64" }, 500, headers);

    const body = (await req.json()) as GenerateBody;
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) return json({ error: "missing_prompt" }, 400, headers);

    const width = Number(body.width ?? 1080);
    const height = Number(body.height ?? 1350);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY") ??
      "";
    const STORAGE_BUCKET = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "generations-private";
    const SIGNED_URL_TTL_SECONDS = Number(Deno.env.get("SIGNED_URL_TTL_SECONDS") ?? "600");

    if (!SUPABASE_URL) return json({ error: "missing_secret", key: "SUPABASE_URL" }, 500, headers);
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json(
        { error: "missing_secret", key: "SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY" },
        500,
        headers,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const startedAt = Date.now();
    const provider = "vertex-imagen";
    let genId = crypto.randomUUID();
    let createdAt = new Date().toISOString();

    {
      const { data, error } = await supabase
        .from("generations")
        .insert({
          id: genId,
          user_id: null,
          provider,
          bucket: STORAGE_BUCKET,
          path: null,
          signed_url: null,
          prompt,
          width,
          height,
          credits_used: 0,
          status: "pending",
          meta: {
            module: body.module ?? null,
            negativePrompt: body.negativePrompt ?? null,
            seed: body.seed ?? null,
          },
        })
        .select("id,created_at")
        .single();

      if (!error) {
        if (data?.id) genId = String(data.id);
        if ((data as { created_at?: string } | null)?.created_at) {
          createdAt = String((data as { created_at: string }).created_at);
        }
      }
    }

    const serviceAccount = JSON.parse(atob(GCP_SA_KEY_B64));
    const token = await getGoogleAccessToken(serviceAccount);

    const endpoint =
      `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const payload: any = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        width,
        height,
      },
    };

    if (body.negativePrompt) payload.parameters.negativePrompt = body.negativePrompt;
    if (Number.isFinite(body.seed)) payload.parameters.seed = body.seed;

    const aiResp = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const aiText = await aiResp.text();

    if (!aiResp.ok) {
      await supabase
        .from("generations")
        .update({
          status: "error",
          duration_ms: Date.now() - startedAt,
          error_message: aiText.slice(0, 1200),
        })
        .eq("id", genId);

      return json({ error: "vertex_error", status: aiResp.status, details: aiText }, 500, headers);
    }

    const aiJson = JSON.parse(aiText);
    const b64 =
      aiJson?.predictions?.[0]?.bytesBase64Encoded ??
      aiJson?.predictions?.[0]?.image?.bytesBase64Encoded ??
      aiJson?.predictions?.[0]?.imageBytes ??
      null;

    if (!b64) {
      await supabase
        .from("generations")
        .update({
          status: "error",
          duration_ms: Date.now() - startedAt,
          error_message: `unexpected_response: ${aiText.slice(0, 1200)}`,
        })
        .eq("id", genId);

      return json({ error: "unexpected_response", details: aiJson }, 500, headers);
    }

    const mime = "image/png";
    const imageBytes = base64ToUint8(String(b64));
    const path = `anon/${genId}.png`;

    let { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageBytes, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError && looksLikeBucketMissing(uploadError.message)) {
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: false });
      const retry = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageBytes, {
        contentType: mime,
        upsert: true,
        cacheControl: "3600",
      });
      uploadError = retry.error ?? null;
    }

    if (uploadError) {
      await supabase
        .from("generations")
        .update({
          status: "error",
          duration_ms: Date.now() - startedAt,
          error_message: `storage_upload_error: ${uploadError.message.slice(0, 1200)}`,
        })
        .eq("id", genId);

      return json({ error: "storage_upload_error", details: uploadError.message }, 500, headers);
    }

    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, Number.isFinite(SIGNED_URL_TTL_SECONDS) ? SIGNED_URL_TTL_SECONDS : 600);

    if (signedError || !signedData?.signedUrl) {
      await supabase
        .from("generations")
        .update({
          status: "error",
          duration_ms: Date.now() - startedAt,
          error_message: `signed_url_error: ${String(signedError?.message ?? "unknown")}`.slice(0, 1200),
        })
        .eq("id", genId);

      return json(
        { error: "signed_url_error", details: signedError?.message ?? "missing_signed_url" },
        500,
        headers,
      );
    }

    const creditsUsed = 1;

    await supabase
      .from("generations")
      .update({
        status: "ok",
        duration_ms: Date.now() - startedAt,
        provider,
        bucket: STORAGE_BUCKET,
        path,
        signed_url: signedData.signedUrl,
        mime,
        width,
        height,
        credits_used: creditsUsed,
      })
      .eq("id", genId);

    return json(
      {
        generationId: genId,
        provider,
        bucket: STORAGE_BUCKET,
        path,
        signedUrl: signedData.signedUrl,
        mime,
        width,
        height,
        creditsUsed,
        createdAt,
      },
      200,
      headers,
    );
  } catch (e) {
    return json({ error: "server_error", message: String((e as { message?: string })?.message ?? e) }, 500, headers);
  }
});
