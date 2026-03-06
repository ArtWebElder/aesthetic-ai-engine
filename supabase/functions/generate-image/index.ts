/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { selectProvider } from "./providers/registry.ts";
import { preprocessSubjectImage, preprocessSubjectBase64 } from "./preprocess/subject.ts";
import { ReplicateFluxKontextProvider } from "./providers/replicateFluxKontext.ts";
import { fetchUrlAsBase64 } from "./utils/base64.ts";

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
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
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

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, enc.encode(data));
  return `${data}.${b64url(new Uint8Array(signature))}`;
}

async function getGoogleAccessToken(serviceAccount: { client_email: string; private_key: string }) {
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
  strictIdentity?: boolean;
  identityStrength?: number;
  styleStrength?: number;
  subjectImageUrl?: string;
  subjectBase64?: string;      // data URI ou base64 raw — alternativa ao URL
  styleRefImageUrl?: string;
  referenceImages?: Array<{
    url?: string;
    role?: string;
    weight?: number;
    lockRealism?: boolean;
  }>;
};

type ParsedReferenceImage = {
  url: string;
  role: "subject" | "style";
  weight: number;
  lockRealism: boolean;
};

type ParsedRequest = {
  prompt: string;
  negativePrompt: string | null;
  width: number;
  height: number;
  seed: number | null;
  module: string | null;
  strictIdentity: boolean;
  identityStrength: number | null;
  styleStrength: number | null;
  subjectImageUrl: string | null;
  subjectBase64: string | null;  // alternativa ao URL
  referenceImages: ParsedReferenceImage[];
};

type VertexAttemptError = {
  endpoint: string;
  payloadKind: string;
  status?: number;
  details: string;
};

type VertexSuccess = {
  base64: string;
  endpoint: string;
  payloadKind: string;
  raw: unknown;
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function parseJsonSafe(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function uint8ToBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function parseReferenceRole(role: string | undefined): "subject" | "style" {
  return role === "subject" ? "subject" : "style";
}

function parseReferenceImages(body: Partial<GenerateBody>): ParsedReferenceImage[] {
  const rows = Array.isArray(body.referenceImages) ? body.referenceImages : [];
  const parsed = rows
    .map((row) => {
      const url = typeof row?.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      if (!/^https?:\/\//i.test(url)) return null;
      const role = parseReferenceRole(typeof row?.role === "string" ? row.role.trim() : undefined);
      const weight = Number.isFinite(Number(row?.weight))
        ? clampInt(Number(row?.weight), 0, 100)
        : role === "subject"
        ? 90
        : 55;
      return {
        url,
        role,
        weight,
        lockRealism: Boolean(row?.lockRealism),
      } as ParsedReferenceImage;
    })
    .filter((row): row is ParsedReferenceImage => Boolean(row));

  const subjectImageUrl =
    typeof body.subjectImageUrl === "string" ? body.subjectImageUrl.trim() : "";
  if (subjectImageUrl && /^https?:\/\//i.test(subjectImageUrl)) {
    parsed.unshift({ url: subjectImageUrl, role: "subject", weight: 90, lockRealism: true });
  }

  const styleRefImageUrl =
    typeof body.styleRefImageUrl === "string" ? body.styleRefImageUrl.trim() : "";
  if (styleRefImageUrl && /^https?:\/\//i.test(styleRefImageUrl)) {
    parsed.unshift({ url: styleRefImageUrl, role: "style", weight: 55, lockRealism: true });
  }

  const dedup = new Map<string, ParsedReferenceImage>();
  for (const entry of parsed) {
    dedup.set(`${entry.role}:${entry.url}`, entry);
  }
  return Array.from(dedup.values()).slice(0, 4);
}

function parseRequestBody(raw: unknown): { ok: true; data: ParsedRequest } | { ok: false; error: string; details: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "bad_request", details: "Body must be a JSON object." };
  }

  const body = raw as Partial<GenerateBody>;
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return { ok: false, error: "bad_request", details: "Field 'prompt' is required." };
  if (prompt.length > 8000) return { ok: false, error: "bad_request", details: "Field 'prompt' is too long." };

  const widthRaw = Number(body.width ?? 1080);
  const heightRaw = Number(body.height ?? 1350);
  if (!Number.isFinite(widthRaw) || !Number.isFinite(heightRaw)) {
    return { ok: false, error: "bad_request", details: "Fields 'width' and 'height' must be numbers." };
  }

  const width = clampInt(widthRaw, 256, 4096);
  const height = clampInt(heightRaw, 256, 4096);

  const negativePrompt = typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : null;

  const seedRaw = body.seed;
  const seed = Number.isFinite(Number(seedRaw)) ? clampInt(Number(seedRaw), 0, 2_147_483_647) : null;

  const module = typeof body.module === "string" && body.module.trim() ? body.module.trim().slice(0, 80) : null;
  const strictIdentity = body.strictIdentity === true;
  const identityStrength = Number.isFinite(Number(body.identityStrength))
    ? clampInt(Number(body.identityStrength), 0, 100)
    : null;
  const styleStrength = Number.isFinite(Number(body.styleStrength))
    ? clampInt(Number(body.styleStrength), 0, 100)
    : null;
  const subjectImageUrl =
    typeof body.subjectImageUrl === "string" && /^https?:\/\//i.test(body.subjectImageUrl.trim())
      ? body.subjectImageUrl.trim()
      : null;
  const subjectBase64 =
    typeof body.subjectBase64 === "string" && body.subjectBase64.trim().length > 0
      ? body.subjectBase64.trim()
      : null;
  const referenceImages = parseReferenceImages(body);

  return {
    ok: true,
    data: {
      prompt,
      negativePrompt,
      width,
      height,
      seed,
      module,
      strictIdentity,
      identityStrength,
      styleStrength,
      subjectImageUrl,
      subjectBase64,
      referenceImages,
    },
  };
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string; byteLength: number }> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`reference_fetch_failed: ${resp.status} ${url}`);
  }
  const mime = String(resp.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!mime.startsWith("image/")) {
    throw new Error(`reference_not_image: ${url}`);
  }
  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error(`reference_empty: ${url}`);
  if (bytes.byteLength > 20 * 1024 * 1024) {
    throw new Error(`reference_too_large: ${url}`);
  }
  return { base64: uint8ToBase64(bytes), mime, byteLength: bytes.byteLength };
}

function pickClosestAspectRatio(width: number, height: number): "1:1" | "4:5" | "9:16" | "16:9" {
  const target = width / height;
  const options: Array<{ ratio: "1:1" | "4:5" | "9:16" | "16:9"; value: number }> = [
    { ratio: "1:1", value: 1 },
    { ratio: "4:5", value: 4 / 5 },
    { ratio: "9:16", value: 9 / 16 },
    { ratio: "16:9", value: 16 / 9 },
  ];

  let best = options[0];
  let diff = Math.abs(target - best.value);
  for (let i = 1; i < options.length; i++) {
    const d = Math.abs(target - options[i].value);
    if (d < diff) {
      best = options[i];
      diff = d;
    }
  }
  return best.ratio;
}

function extractBase64FromVertex(raw: unknown): string | null {
  const j = raw as any;
  return (
    j?.predictions?.[0]?.bytesBase64Encoded ??
    j?.predictions?.[0]?.image?.bytesBase64Encoded ??
    j?.predictions?.[0]?.imageBytes ??
    j?.predictions?.[0]?.bytesBase64 ??
    null
  );
}

function buildVertexPayloads(input: ParsedRequest, aspectRatio: string): Array<{ kind: string; payload: Record<string, unknown> }> {
  const baseParams: Record<string, unknown> = {
    sampleCount: 1,
    aspectRatio,
  };

  if (input.negativePrompt) baseParams.negativePrompt = input.negativePrompt;
  if (input.seed !== null) baseParams.seed = input.seed;

  const withSizeParams: Record<string, unknown> = {
    ...baseParams,
    width: input.width,
    height: input.height,
  };

  const instanceWithNegative: Record<string, unknown> = { prompt: input.prompt };
  if (input.negativePrompt) instanceWithNegative.negativePrompt = input.negativePrompt;

  return [
    {
      kind: "aspect_ratio_parameters",
      payload: { instances: [{ prompt: input.prompt }], parameters: baseParams },
    },
    {
      kind: "aspect_ratio_instance_negative",
      payload: { instances: [instanceWithNegative], parameters: { sampleCount: 1, aspectRatio, ...(input.seed !== null ? { seed: input.seed } : {}) } },
    },
    {
      kind: "width_height_fallback",
      payload: { instances: [{ prompt: input.prompt }], parameters: withSizeParams },
    },
  ];
}

function buildVertexReferencePayload(
  input: ParsedRequest,
  aspectRatio: string,
  refs: Array<{ role: "subject" | "style"; weight: number; lockRealism: boolean; base64: string }>,
): { kind: string; payload: Record<string, unknown> } {
  if (!refs.length) {
    throw new Error("reference_payload_invalid: empty_reference_images");
  }
  const parameters: Record<string, unknown> = {
    sampleCount: 1,
    aspectRatio,
  };
  if (input.negativePrompt) parameters.negativePrompt = input.negativePrompt;
  if (input.seed !== null) parameters.seed = input.seed;

  const instances = [
    {
      prompt: input.prompt,
      referenceImages: refs.map((entry, idx) => ({
        referenceId: idx + 1,
        referenceType:
          entry.role === "subject" ? "REFERENCE_TYPE_SUBJECT" : "REFERENCE_TYPE_STYLE",
        referenceImage: {
          bytesBase64Encoded: entry.base64,
        },
      })),
    },
  ];
  const firstInstance = instances[0] as { referenceImages?: Array<{ referenceImage?: { bytesBase64Encoded?: string } }> };
  if (!Array.isArray(firstInstance.referenceImages) || firstInstance.referenceImages.length === 0) {
    throw new Error("reference_payload_invalid: missing_reference_images");
  }
  for (const entry of firstInstance.referenceImages) {
    const bytes = entry?.referenceImage?.bytesBase64Encoded;
    if (typeof bytes !== "string" || !bytes.trim()) {
      throw new Error("reference_payload_invalid: missing_reference_image_bytes");
    }
  }

  return {
    kind: "reference_images_capability",
    payload: {
      instances,
      parameters,
    },
  };
}

function buildVertexEndpoints(projectId: string, location: string, withReferences = false) {
  const base = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
  if (withReferences) {
    return [`${base}/imagen-3.0-capability-001:predict`];
  }
  return [
    `${base}/imagen-3.0-generate-001:predict`,
    `${base}/imagen-3.0-fast-generate-001:predict`,
    `${base}/imagegeneration@006:predict`,
  ];
}

async function callVertexWithFallback(
  token: string,
  endpoints: string[],
  payloads: Array<{ kind: string; payload: Record<string, unknown> }>,
): Promise<{ ok: true; value: VertexSuccess } | { ok: false; errors: VertexAttemptError[] }> {
  const errors: VertexAttemptError[] = [];

  for (const endpoint of endpoints) {
    for (const item of payloads) {
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(item.payload),
        });

        const text = await resp.text();
        if (!resp.ok) {
          errors.push({ endpoint, payloadKind: item.kind, status: resp.status, details: text.slice(0, 1200) || "vertex_request_failed" });
          continue;
        }

        const parsed = parseJsonSafe(text);
        const b64 = extractBase64FromVertex(parsed);
        if (b64) {
          return {
            ok: true,
            value: {
              base64: b64,
              endpoint,
              payloadKind: item.kind,
              raw: parsed,
            },
          };
        }

        errors.push({ endpoint, payloadKind: item.kind, details: `unexpected_response: ${text.slice(0, 1200)}` });
      } catch (e) {
        errors.push({ endpoint, payloadKind: item.kind, details: String((e as { message?: string })?.message ?? e).slice(0, 1200) });
      }
    }
  }

  return { ok: false, errors };
}

function isCapabilityEndpoint(endpoint: string) {
  return endpoint.includes("/imagen-3.0-capability-001:predict");
}

function normalizeStrictPayloadKind(providerName: string, payloadKind: string) {
  if (providerName === "replicate-flux-kontext-pro") {
    return payloadKind === "replicate_kontext" ? payloadKind : "replicate_kontext";
  }
  return payloadKind;
}

function emptyPreprocessMeta() {
  return {
    flags: {
      alphaComposited: false,
      upscaled: false,
      padded: false,
    },
    hash: null,
    width: null,
    height: null,
  };
}

function looksLikeBucketMissing(message: string) {
  const m = message.toLowerCase();
  return m.includes("bucket") && (m.includes("not found") || m.includes("does not exist"));
}

function isAlreadyExistsError(message: string) {
  const m = message.toLowerCase();
  return m.includes("already") && m.includes("exist");
}

async function ensurePrivateBucket(supabase: any, bucket: string): Promise<string | null> {
  const { error: getError } = await supabase.storage.getBucket(bucket);
  if (!getError) return null;

  const { error: createError } = await supabase.storage.createBucket(bucket, { public: false });
  if (createError && !isAlreadyExistsError(createError.message)) {
    return createError.message;
  }
  return null;
}

async function updateGenerationError(
  supabase: any,
  generationId: string,
  startedAt: number,
  details: string,
  promptLen: number,
  negativePrompt: string | null,
) {
  await supabase
    .from("generations")
    .update({
      status: "error",
      duration_ms: Date.now() - startedAt,
      error_message: details.slice(0, 1200),
      prompt_len: promptLen,
      negative_prompt: negativePrompt,
    })
    .eq("id", generationId);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed", details: "Use POST." }, 405, headers);

  try {
    let bodyRaw: unknown;
    try {
      bodyRaw = await req.json();
    } catch {
      return json({ error: "bad_request", details: "Invalid JSON body." }, 400, headers);
    }

    const parsed = parseRequestBody(bodyRaw);
    if (!parsed.ok) return json({ error: parsed.error, details: parsed.details }, 400, headers);

    const input = parsed.data;

    // DEBUG TEMPORÁRIO — remover após diagnóstico
    console.log("[DEBUG] payload recebido:", JSON.stringify({
      strictIdentity: input.strictIdentity,
      subjectImageUrl: input.subjectImageUrl,
      subjectBase64: input.subjectBase64 ? "[presente]" : null,
      rawSubjectImageUrl: (bodyRaw as Record<string, unknown>)?.subjectImageUrl ?? "(ausente)",
    }));
    const aspectRatio = pickClosestAspectRatio(input.width, input.height);
    const selectedProvider = selectProvider({ strictIdentity: input.strictIdentity });
    const modeUsed = input.strictIdentity ? "strict_identity" : "legacy";

    const GCP_PROJECT_ID = Deno.env.get("GCP_PROJECT_ID") ?? "";
    const GCP_LOCATION = Deno.env.get("GCP_LOCATION") ?? "us-central1";
    const GCP_SA_KEY_B64 = Deno.env.get("GCP_SA_KEY_B64") ?? "";
    const REPLICATE_API_TOKEN = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
    const STORAGE_BUCKET = Deno.env.get("GENS_BUCKET") ?? Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "generations-private";
    const ttlRaw = Number(Deno.env.get("SIGNED_URL_TTL_SECONDS") ?? "600");
    const signedUrlTtl = Number.isFinite(ttlRaw) ? clampInt(ttlRaw, 60, 86400) : 600;

    if (!SUPABASE_URL) return json({ error: "missing_secret", details: "SUPABASE_URL is required." }, 500, headers);
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "missing_secret", details: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required." }, 500, headers);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const startedAt = Date.now();
    const provider = input.strictIdentity ? selectedProvider.name : "vertex-imagen";
    let generationId = crypto.randomUUID();
    let createdAt = new Date().toISOString();

    {
      const { data, error } = await supabase
        .from("generations")
        .insert({
          id: generationId,
          user_id: null,
          provider,
          bucket: STORAGE_BUCKET,
          path: null,
          signed_url: null,
          mime: null,
          prompt: input.prompt,
          prompt_len: input.prompt.length,
          negative_prompt: input.negativePrompt ?? null,
          width: input.width,
          height: input.height,
          credits_used: 0,
          status: "pending",
          meta: {
            module: input.module,
            negativePrompt: input.negativePrompt,
            seed: input.seed,
            strictIdentity: input.strictIdentity,
            identityStrength: input.identityStrength,
            styleStrength: input.styleStrength,
            modeUsed,
            providerName: selectedProvider.name,
            aspectRatio,
            referenceImagesCount: input.referenceImages.length,
            referenceImages: input.referenceImages.map((entry) => ({
              role: entry.role,
              weight: entry.weight,
              lockRealism: entry.lockRealism,
              url: entry.url,
            })),
          },
        })
        .select("id,created_at")
        .single();

      if (error) {
        return json({ error: "db_error", details: error.message }, 500, headers);
      }

      if (data?.id) generationId = String(data.id);
      if ((data as { created_at?: string } | null)?.created_at) {
        createdAt = String((data as { created_at: string }).created_at);
      }
    }

    const bucketError = await ensurePrivateBucket(supabase, STORAGE_BUCKET);
    if (bucketError) {
      await updateGenerationError(supabase, generationId, startedAt, `bucket_error: ${bucketError}`, input.prompt.length, input.negativePrompt ?? null);
      return json({ error: "storage_bucket_error", details: bucketError }, 500, headers);
    }

    if (input.strictIdentity) {
      if (!input.subjectImageUrl && !input.subjectBase64) {
        const details = "strictIdentity=true requires subjectImageUrl or subjectBase64.";
        await updateGenerationError(supabase, generationId, startedAt, details, input.prompt.length, input.negativePrompt ?? null);
        return json(
          {
            error: "strict_identity_requires_subject",
            details,
            provider: selectedProvider.name,
            meta: {
              providerName: selectedProvider.name,
              modeUsed: "strict_identity",
              strictIdentity: input.strictIdentity,
              identityStrength: input.identityStrength,
              styleStrength: input.styleStrength,
              payloadKind: "strict_identity_missing_subject",
              gemini_failed_then_replicate: false,
              preprocess: emptyPreprocessMeta(),
            },
          },
          400,
          headers,
        );
      }

      let preprocessedSubject: Awaited<ReturnType<typeof preprocessSubjectImage>>;
      try {
        preprocessedSubject = input.subjectBase64
          ? await preprocessSubjectBase64(input.subjectBase64)
          : await preprocessSubjectImage(input.subjectImageUrl!);
      } catch (e) {
        const details = String((e as { message?: string })?.message ?? e).slice(0, 1200);
        await updateGenerationError(supabase, generationId, startedAt, `strict_preprocess_error: ${details}`, input.prompt.length, input.negativePrompt ?? null);
        return json(
          {
            error: "strict_identity_preprocess_failed",
            details,
            provider: selectedProvider.name,
            meta: {
              providerName: selectedProvider.name,
              modeUsed: "strict_identity",
              strictIdentity: input.strictIdentity,
              identityStrength: input.identityStrength,
              styleStrength: input.styleStrength,
              payloadKind: "strict_preprocess_failed",
              gemini_failed_then_replicate: false,
              preprocess: emptyPreprocessMeta(),
            },
          },
          400,
          headers,
        );
      }

      // Fetch style reference images as real base64 (non-fatal — skip on error)
      type StyleRef = { base64: string; mime: string; weight: number; url: string };
      const styleRefEntries = input.referenceImages.filter((r) => r.role === "style" && r.url);
      const styleReferences: StyleRef[] = (
        await Promise.all(
          styleRefEntries.map(async (ref): Promise<StyleRef | null> => {
            try {
              const fetched = await fetchUrlAsBase64(ref.url);
              return { base64: fetched.base64, mime: fetched.mime, weight: ref.weight, url: ref.url };
            } catch {
              return null;
            }
          }),
        )
      ).filter((r): r is StyleRef => r !== null);

      const strictProviderErrors: Array<{ providerName: string; details: string }> = [];
      let fallbackProvider: ReplicateFluxKontextProvider | null = null;
      if (REPLICATE_API_TOKEN) {
        try {
          fallbackProvider = new ReplicateFluxKontextProvider({ token: REPLICATE_API_TOKEN });
        } catch {
          // REPLICATE_FLUX_KONTEXT_PRO_VERSION not set; fallback provider unavailable
        }
      }
      let strictProviderName = selectedProvider.name;
      let strictPayloadKind = "strict_unknown";
      let strictRaw: unknown = null;
      let strictBase64 = "";
      let fallbackAttempted = false;
      let lastProviderName = selectedProvider.name;

      try {
        const result = await selectedProvider.generateImageToImageStrict({
          prompt: input.prompt,
          negativePrompt: input.negativePrompt,
          width: input.width,
          height: input.height,
          seed: input.seed,
          module: input.module,
          strictIdentity: input.strictIdentity,
          identityStrength: input.identityStrength,
          styleStrength: input.styleStrength,
          referenceImagesCount: input.referenceImages.length,
          subjectImage: {
            base64: preprocessedSubject.base64,
            mime: preprocessedSubject.mime,
            dataUrl: preprocessedSubject.dataUrl,
            width: preprocessedSubject.width,
            height: preprocessedSubject.height,
            hash: preprocessedSubject.hash,
          },
          styleReferences: styleReferences.length > 0 ? styleReferences : undefined,
        });
        strictBase64 = result.base64;
        if (!strictBase64.trim()) {
          throw new Error("strict_provider_empty_base64");
        }
        strictPayloadKind = result.payloadKind || "strict_unknown";
        strictRaw = result.raw ?? null;
      } catch (primaryError) {
        strictProviderErrors.push({
          providerName: selectedProvider.name,
          details: String((primaryError as { message?: string })?.message ?? primaryError).slice(0, 1200),
        });
        if (fallbackProvider) {
          fallbackAttempted = true;
          lastProviderName = fallbackProvider.name;
          strictProviderName = fallbackProvider.name;
          try {
            const fallbackResult = await fallbackProvider.generateImageToImageStrict({
              prompt: input.prompt,
              subjectImageBase64: preprocessedSubject.base64,
              subjectImageMime: preprocessedSubject.mime,
              identityStrength: input.identityStrength ?? 90,
              aspectRatio,
              styleReferences: styleReferences.length > 0 ? styleReferences : undefined,
            });
            strictBase64 = fallbackResult.imageBase64;
            if (!strictBase64.trim()) {
              throw new Error("strict_fallback_empty_base64");
            }
            strictPayloadKind = normalizeStrictPayloadKind(
              fallbackProvider.name,
              fallbackResult.meta.payloadKind,
            );
            strictRaw = fallbackResult.meta;
          } catch (fallbackError) {
            strictProviderErrors.push({
              providerName: fallbackProvider.name,
              details: String((fallbackError as { message?: string })?.message ?? fallbackError).slice(0, 1200),
            });
          }
        }

        if (!strictBase64.trim()) {
          const strictDetails = JSON.stringify(strictProviderErrors).slice(0, 1200);
          await updateGenerationError(supabase, generationId, startedAt, `strict_provider_unavailable: ${strictDetails}`, input.prompt.length, input.negativePrompt ?? null);
          return json(
            {
              error: "strict_identity_provider_unavailable",
              details: strictDetails,
              provider: lastProviderName,
              meta: {
                providerName: lastProviderName,
                modeUsed: "strict_identity",
                strictIdentity: true,
                identityStrength: input.identityStrength,
                styleStrength: input.styleStrength,
                payloadKind: "strict_both_failed",
                gemini_failed_then_replicate: fallbackAttempted,
                preprocess: {
                  flags: preprocessedSubject.flags,
                  hash: preprocessedSubject.hash,
                  width: preprocessedSubject.width,
                  height: preprocessedSubject.height,
                },
              },
            },
            503,
            headers,
          );
        }
      }

      const strictMime = "image/png";
      const strictBytes = base64ToUint8(strictBase64);
      const strictPath = `anon/${generationId}.png`;

      let { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(strictPath, strictBytes, {
        contentType: strictMime,
        upsert: true,
        cacheControl: "3600",
      });

      if (uploadError && looksLikeBucketMissing(uploadError.message)) {
        const ensureError = await ensurePrivateBucket(supabase, STORAGE_BUCKET);
        if (!ensureError) {
          const retry = await supabase.storage.from(STORAGE_BUCKET).upload(strictPath, strictBytes, {
            contentType: strictMime,
            upsert: true,
            cacheControl: "3600",
          });
          uploadError = retry.error ?? null;
        }
      }

      if (uploadError) {
        await updateGenerationError(supabase, generationId, startedAt, `storage_upload_error: ${uploadError.message}`, input.prompt.length, input.negativePrompt ?? null);
        return json(
          {
            error: "storage_upload_error",
            details: uploadError.message,
            provider: strictProviderName,
            meta: {
              providerName: strictProviderName,
              modeUsed: "strict_identity",
              strictIdentity: true,
              identityStrength: input.identityStrength,
              styleStrength: input.styleStrength,
              payloadKind: strictPayloadKind || "strict_unknown",
              gemini_failed_then_replicate: fallbackAttempted,
              preprocess: {
                flags: preprocessedSubject.flags,
                hash: preprocessedSubject.hash,
                width: preprocessedSubject.width,
                height: preprocessedSubject.height,
              },
            },
          },
          500,
          headers,
        );
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(strictPath, signedUrlTtl);

      if (signedError || !signedData?.signedUrl) {
        await updateGenerationError(supabase, generationId, startedAt, `signed_url_error: ${String(signedError?.message ?? "missing_signed_url")}`, input.prompt.length, input.negativePrompt ?? null);
        return json(
          {
            error: "signed_url_error",
            details: signedError?.message ?? "missing_signed_url",
            provider: strictProviderName,
            meta: {
              providerName: strictProviderName,
              modeUsed: "strict_identity",
              strictIdentity: true,
              identityStrength: input.identityStrength,
              styleStrength: input.styleStrength,
              payloadKind: strictPayloadKind || "strict_unknown",
              gemini_failed_then_replicate: fallbackAttempted,
              preprocess: {
                flags: preprocessedSubject.flags,
                hash: preprocessedSubject.hash,
                width: preprocessedSubject.width,
                height: preprocessedSubject.height,
              },
            },
          },
          500,
          headers,
        );
      }

      const creditsUsed = 1;
      {
        const { error } = await supabase
          .from("generations")
          .update({
            status: "ok",
            duration_ms: Date.now() - startedAt,
            provider: strictProviderName,
            bucket: STORAGE_BUCKET,
            path: strictPath,
            signed_url: signedData.signedUrl,
            mime: strictMime,
            width: input.width,
            height: input.height,
            prompt: input.prompt,
            prompt_len: input.prompt.length,
            negative_prompt: input.negativePrompt ?? null,
            credits_used: creditsUsed,
            meta: {
              module: input.module,
              negativePrompt: input.negativePrompt,
              seed: input.seed,
              strictIdentity: true,
              identityStrength: input.identityStrength,
              styleStrength: input.styleStrength,
              modeUsed: "strict_identity",
              providerName: strictProviderName,
              referenceImagesCount: input.referenceImages.length,
              payloadKind: strictPayloadKind || "strict_unknown",
              gemini_failed_then_replicate: fallbackAttempted,
              preprocess: {
                flags: preprocessedSubject.flags,
                hash: preprocessedSubject.hash,
                width: preprocessedSubject.width,
                height: preprocessedSubject.height,
              },
              strictProviderRaw: strictRaw,
            },
          })
          .eq("id", generationId);

        if (error) {
          return json(
            {
              error: "db_error",
              details: error.message,
              provider: strictProviderName,
              meta: {
                providerName: strictProviderName,
                modeUsed: "strict_identity",
                strictIdentity: true,
                identityStrength: input.identityStrength,
                styleStrength: input.styleStrength,
                payloadKind: strictPayloadKind || "strict_unknown",
                gemini_failed_then_replicate: fallbackAttempted,
                preprocess: {
                  flags: preprocessedSubject.flags,
                  hash: preprocessedSubject.hash,
                  width: preprocessedSubject.width,
                  height: preprocessedSubject.height,
                },
              },
            },
            500,
            headers,
          );
        }
      }

      return json(
        {
          generationId,
          provider: strictProviderName,
          bucket: STORAGE_BUCKET,
          path: strictPath,
          signedUrl: signedData.signedUrl,
          mime: strictMime,
          width: input.width,
          height: input.height,
          creditsUsed,
          createdAt,
          meta: {
            providerName: strictProviderName,
            modeUsed: "strict_identity",
            strictIdentity: true,
            identityStrength: input.identityStrength,
            styleStrength: input.styleStrength,
            payloadKind: strictPayloadKind || "strict_unknown",
            gemini_failed_then_replicate: fallbackAttempted,
            preprocess: {
              flags: preprocessedSubject.flags,
              hash: preprocessedSubject.hash,
              width: preprocessedSubject.width,
              height: preprocessedSubject.height,
            },
          },
        },
        200,
        headers,
      );
    }

    // Non-strict mode: text-to-image via Replicate Flux Kontext Pro
    let t2iBase64 = "";
    let t2iPayloadKind = "replicate_t2i_unknown";
    const t2iProviderName = selectedProvider.name;

    try {
      const result = await selectedProvider.generateTextToImage({
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        width: input.width,
        height: input.height,
        seed: input.seed,
        module: input.module,
        strictIdentity: false,
        identityStrength: null,
        styleStrength: null,
        referenceImagesCount: input.referenceImages.length,
      });
      t2iBase64 = result.base64;
      t2iPayloadKind = result.payloadKind || "replicate_t2i";
    } catch (e) {
      const details = String((e as { message?: string })?.message ?? e).slice(0, 1200);
      await updateGenerationError(supabase, generationId, startedAt, `t2i_error: ${details}`, input.prompt.length, input.negativePrompt ?? null);
      return json({ error: "t2i_provider_failed", details, provider: t2iProviderName }, 500, headers);
    }

    if (!t2iBase64.trim()) {
      await updateGenerationError(supabase, generationId, startedAt, "t2i_empty_base64", input.prompt.length, input.negativePrompt ?? null);
      return json({ error: "t2i_empty_response", provider: t2iProviderName }, 500, headers);
    }

    const mime = "image/png";
    const imageBytes = base64ToUint8(t2iBase64);
    const path: string = `anon/${generationId}.png`;

    let { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageBytes, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError && looksLikeBucketMissing(uploadError.message)) {
      const ensureError = await ensurePrivateBucket(supabase, STORAGE_BUCKET);
      if (!ensureError) {
        const retry = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageBytes, {
          contentType: mime,
          upsert: true,
          cacheControl: "3600",
        });
        uploadError = retry.error ?? null;
      }
    }

    if (uploadError) {
      await updateGenerationError(supabase, generationId, startedAt, `storage_upload_error: ${uploadError.message}`, input.prompt.length, input.negativePrompt ?? null);
      return json({ error: "storage_upload_error", details: uploadError.message }, 500, headers);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, signedUrlTtl);

    if (signedError || !signedData?.signedUrl) {
      await updateGenerationError(supabase, generationId, startedAt, `signed_url_error: ${String(signedError?.message ?? "missing_signed_url")}`, input.prompt.length, input.negativePrompt ?? null);
      return json({ error: "signed_url_error", details: signedError?.message ?? "missing_signed_url" }, 500, headers);
    }

    const creditsUsed = 1;

    {
      const { error } = await supabase
        .from("generations")
        .update({
          status: "ok",
          duration_ms: Date.now() - startedAt,
          provider: t2iProviderName,
          bucket: STORAGE_BUCKET,
          path,
          signed_url: signedData.signedUrl,
          mime,
          width: input.width,
          height: input.height,
          prompt: input.prompt,
          prompt_len: input.prompt.length,
          negative_prompt: input.negativePrompt ?? null,
          credits_used: creditsUsed,
          meta: {
            module: input.module,
            modeUsed: "text_to_image",
            providerName: t2iProviderName,
            payloadKind: t2iPayloadKind,
            aspectRatio,
            referenceImagesCount: input.referenceImages.length,
            preprocess: emptyPreprocessMeta(),
          },
        })
        .eq("id", generationId);

      if (error) {
        return json({ error: "db_error", details: error.message }, 500, headers);
      }
    }

    return json(
      {
        generationId,
        provider: t2iProviderName,
        bucket: STORAGE_BUCKET,
        path,
        signedUrl: signedData.signedUrl,
        mime,
        width: input.width,
        height: input.height,
        creditsUsed,
        createdAt,
        meta: {
          providerName: t2iProviderName,
          modeUsed: "text_to_image",
          payloadKind: t2iPayloadKind,
          aspectRatio,
          referenceImagesCount: input.referenceImages.length,
          preprocess: emptyPreprocessMeta(),
        },
      },
      200,
      headers,
    );
  } catch (e) {
    return json({ error: "server_error", details: String((e as { message?: string })?.message ?? e) }, 500, headers);
  }
});
