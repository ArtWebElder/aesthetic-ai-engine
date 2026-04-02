/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Multi-model creative generation.
// Supports: Flux Kontext Pro (single-image), Multi-Image Kontext Pro (subject swap), Imagen 4.

import { corsHeaders } from "../_shared/cors.ts";

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface TextReplacement {
  original: string;
  replacement: string;
}

interface GenerateBody {
  reference_image: string;
  subject_image?: string;
  text_replacements?: TextReplacement[];
  color_palette?: string[];
  variation?: number;
  extra_instructions?: string;
  format?: string;
  model?: "flux-kontext" | "imagen4";
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function pickAspectRatio(format: string | undefined): string {
  const map: Record<string, string> = {
    "1:1": "1:1", "4:5": "4:5", "9:16": "9:16", "16:9": "16:9",
  };
  return map[format ?? ""] || "1:1";
}

function ensureDataUri(b64: string): string {
  return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
}

function stripBase64Prefix(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, "");
}

/** Shared text/color/extra instructions appended to any prompt */
function buildModifiers(body: GenerateBody): string {
  const parts: string[] = [];

  if (body.text_replacements && body.text_replacements.length > 0) {
    const changes = body.text_replacements
      .filter(r => r.original && r.replacement && r.original !== r.replacement)
      .map(r => `Change text '${r.original}' to '${r.replacement}'.`);
    if (changes.length > 0) parts.push(changes.join(" "));
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`Apply this color scheme: ${body.color_palette.join(", ")}.`);
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  return parts.join(" ");
}

/** Short prompt for single-image Flux Kontext Pro (no subject swap) */
function buildFluxSinglePrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  let base: string;

  if (variation <= 20) {
    base = "Recreate this exact advertisement with the same layout, colors, and typography. Keep all text sharp and legible.";
  } else if (variation <= 60) {
    base = "Create a similar advertisement inspired by this reference. Keep the same style and mood with some creative variation.";
  } else {
    base = "Reimagine this advertisement concept with creative freedom. Same purpose, new design.";
  }

  const mods = buildModifiers(body);
  const full = mods ? `${base} ${mods}` : base;
  return `${full} All text must be perfectly sharp and readable. Professional quality.`;
}

/** Prompt for multi-image Flux Kontext Pro (subject swap) */
function buildFluxMultiImagePrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));

  let base: string;
  if (variation <= 20) {
    base = "Recreate the advertisement from image 1, replacing the main product/person with the subject from image 2. Keep identical layout, text positions, typography style, colors, and decorative elements.";
  } else if (variation <= 60) {
    base = "Create a similar advertisement inspired by image 1, but use the subject from image 2 as the main product/person. Keep the same style and mood.";
  } else {
    base = "Create a new advertisement loosely inspired by image 1, featuring the subject from image 2. Creative freedom on layout and style.";
  }

  const mods = buildModifiers(body);
  const full = mods ? `${base} ${mods}` : base;
  return `${full} All text must be perfectly sharp and readable.`;
}

/** Detailed prompt for Imagen 4 */
function buildImagen4Prompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  if (variation <= 20) {
    parts.push("Recreate this advertisement image exactly, preserving the same layout, typography, colors, composition, and visual treatment.");
  } else if (variation <= 60) {
    parts.push("Create a similar advertisement inspired by this reference, keeping the style, layout, and visual language with some creative freedom.");
  } else {
    parts.push("Create a new advertisement inspired by this reference, reimagining the concept with creative freedom while keeping the same purpose.");
  }

  if (body.subject_image) {
    parts.push("Replace the main product/person with the provided subject photo, integrating it naturally with matching lighting and scale.");
  }

  const mods = buildModifiers(body);
  if (mods) parts.push(mods);

  parts.push("All text must be perfectly legible with clean edges. Professional advertisement quality.");

  return parts.join("\n\n");
}

// ── Replicate polling helper ───────────────────────────────────────────────────

const REPLICATE_TIMEOUT_MS = 300_000; // 5 minutes
const REPLICATE_POLL_MS = 2_000;

function pickOutputUrl(raw: Record<string, unknown>): string | null {
  const output = raw?.output;
  if (typeof output === "string" && output.trim()) return output.trim();
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

async function pollReplicatePrediction(
  pollUrl: string,
  token: string,
  // deno-lint-ignore no-explicit-any
  initial: Record<string, any>,
): Promise<string> {
  let last = initial;
  const startedAt = Date.now();

  while (Date.now() - startedAt < REPLICATE_TIMEOUT_MS) {
    const status = String(last?.status ?? "");
    if (status === "succeeded") break;
    if (status === "failed" || status === "canceled") {
      throw new Error(`replicate_${status}: ${String(last?.error ?? "Unknown error").slice(0, 300)}`);
    }
    await sleep(REPLICATE_POLL_MS);
    const resp = await fetch(pollUrl, { headers: { authorization: `Token ${token}` } });
    if (!resp.ok) continue;
    const text = await resp.text();
    try { last = JSON.parse(text); } catch { continue; }
  }

  if (String(last?.status ?? "") !== "succeeded") {
    throw new Error(`replicate_timeout: timed out after ${Math.round(REPLICATE_TIMEOUT_MS / 1000)}s.`);
  }

  const outputUrl = pickOutputUrl(last);
  if (!outputUrl) throw new Error("replicate_no_output");
  return outputUrl;
}

// ── Flux Kontext Pro — single image (no subject swap) ──────────────────────────

const FLUX_SINGLE_OWNER = "black-forest-labs";
const FLUX_SINGLE_MODEL = "flux-kontext-pro";

async function generateWithFluxSingle(
  prompt: string,
  refImage: string,
  aspectRatio: string,
  token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();
  const modelPath = `${FLUX_SINGLE_OWNER}/${FLUX_SINGLE_MODEL}`;
  const createUrl = `https://api.replicate.com/v1/models/${modelPath}/predictions`;

  console.log(`[flux-single] ${modelPath} | Prompt: ${prompt.length} chars`);

  const resp = await fetch(createUrl, {
    method: "POST",
    headers: { authorization: `Token ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      input: { prompt, input_image: refImage, aspect_ratio: aspectRatio },
    }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`replicate_create_failed (${resp.status}): ${text.slice(0, 300)}`);

  const parsed = JSON.parse(text);
  const pollUrl = String(parsed?.urls?.get ?? "").trim();
  if (!pollUrl) throw new Error("replicate_no_poll_url");

  console.log(`[flux-single] Polling: ${pollUrl}`);
  const outputUrl = await pollReplicatePrediction(pollUrl, token, parsed);

  return { image: outputUrl, model: modelPath, duration_ms: Date.now() - startedAt };
}

// ── Multi-Image Kontext Pro — subject swap ─────────────────────────────────────

const FLUX_MULTI_OWNER = "flux-kontext-apps";
const FLUX_MULTI_MODEL = "multi-image-kontext-pro";

async function generateWithFluxMultiImage(
  prompt: string,
  refImage: string,
  subjectImage: string,
  aspectRatio: string,
  token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();
  const modelPath = `${FLUX_MULTI_OWNER}/${FLUX_MULTI_MODEL}`;
  const createUrl = `https://api.replicate.com/v1/models/${modelPath}/predictions`;

  console.log(`[flux-multi] ${modelPath} | Subject swap mode | Prompt: ${prompt.length} chars`);

  const resp = await fetch(createUrl, {
    method: "POST",
    headers: { authorization: `Token ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      input: {
        prompt,
        input_image_1: refImage,
        input_image_2: subjectImage,
        aspect_ratio: aspectRatio,
      },
    }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`replicate_create_failed (${resp.status}): ${text.slice(0, 300)}`);

  const parsed = JSON.parse(text);
  const pollUrl = String(parsed?.urls?.get ?? "").trim();
  if (!pollUrl) throw new Error("replicate_no_poll_url");

  console.log(`[flux-multi] Polling: ${pollUrl}`);
  const outputUrl = await pollReplicatePrediction(pollUrl, token, parsed);

  return { image: outputUrl, model: modelPath, duration_ms: Date.now() - startedAt };
}

// ── Imagen 4 (Gemini API) ──────────────────────────────────────────────────────

const IMAGEN4_MODEL = "imagen-4.0-generate-001";

async function generateWithImagen4(
  prompt: string,
  refImageBase64: string | null,
  subjectImageBase64: string | null,
  aspectRatio: string,
  apiKey: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN4_MODEL}:predict?key=${encodeURIComponent(apiKey)}`;

  const imagen4AR: Record<string, string> = {
    "1:1": "1:1", "4:5": "3:4", "9:16": "9:16", "16:9": "16:9",
  };

  // deno-lint-ignore no-explicit-any
  const instance: Record<string, any> = { prompt };
  const referenceImages: Array<Record<string, unknown>> = [];

  if (refImageBase64) {
    referenceImages.push({
      referenceImage: { bytesBase64Encoded: stripBase64Prefix(refImageBase64) },
      referenceId: 1,
      referenceType: "REFERENCE_TYPE_STYLE",
    });
  }

  if (subjectImageBase64) {
    referenceImages.push({
      referenceImage: { bytesBase64Encoded: stripBase64Prefix(subjectImageBase64) },
      referenceId: 2,
      referenceType: "REFERENCE_TYPE_SUBJECT",
    });
  }

  if (referenceImages.length > 0) instance.referenceImages = referenceImages;

  console.log(`[imagen4] Refs: ${referenceImages.length} | AR: ${imagen4AR[aspectRatio] || "1:1"} | Prompt: ${prompt.length} chars`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      instances: [instance],
      parameters: {
        sampleCount: 1,
        aspectRatio: imagen4AR[aspectRatio] || "1:1",
        safetyFilterLevel: "block_only_high",
        personGeneration: "allow_adult",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[imagen4] HTTP ${response.status}:`, errText.slice(0, 400));
    throw new Error(`imagen4_http_${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded
    || data?.predictions?.[0]?.image?.bytesBase64Encoded
    || null;

  if (!b64) {
    console.error(`[imagen4] No image:`, JSON.stringify(data).slice(0, 300));
    throw new Error("imagen4_no_image");
  }

  return {
    image: `data:image/png;base64,${b64}`,
    model: IMAGEN4_MODEL,
    duration_ms: Date.now() - startedAt,
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  try {
    let body: GenerateBody;
    try { body = await req.json() as GenerateBody; }
    catch { return json({ error: "invalid_json" }, 400, cors); }

    if (!body.reference_image || typeof body.reference_image !== "string") {
      return json({ error: "missing_reference", details: "Field 'reference_image' is required." }, 400, cors);
    }

    const selectedModel = body.model || "flux-kontext";
    const aspectRatio = pickAspectRatio(body.format);
    const refImage = ensureDataUri(body.reference_image);
    const hasSubject = Boolean(body.subject_image);
    const subjectImage = hasSubject ? ensureDataUri(body.subject_image!) : null;

    // Determine which Flux model to use
    const useMultiImage = selectedModel === "flux-kontext" && hasSubject;
    const effectiveModel = useMultiImage
      ? `${FLUX_MULTI_OWNER}/${FLUX_MULTI_MODEL}`
      : selectedModel === "imagen4"
        ? IMAGEN4_MODEL
        : `${FLUX_SINGLE_OWNER}/${FLUX_SINGLE_MODEL}`;

    console.log(`[generate-creative] Model: ${effectiveModel} | MultiImage: ${useMultiImage} | Subject: ${hasSubject} | Variation: ${body.variation ?? 30} | Format: ${aspectRatio}`);

    let result: { image: string; model: string; duration_ms: number };

    if (selectedModel === "imagen4") {
      // ── Imagen 4 ──
      const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
      if (!apiKey) return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured." }, 500, cors);

      const prompt = buildImagen4Prompt(body);
      result = await generateWithImagen4(prompt, refImage, subjectImage, aspectRatio, apiKey);

    } else if (useMultiImage) {
      // ── Flux Multi-Image Kontext Pro (subject swap) ──
      const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
      if (!token) return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);

      const prompt = buildFluxMultiImagePrompt(body);
      result = await generateWithFluxMultiImage(prompt, refImage, subjectImage!, aspectRatio, token);

    } else {
      // ── Flux Single-Image Kontext Pro ──
      const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
      if (!token) return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);

      const prompt = buildFluxSinglePrompt(body);
      result = await generateWithFluxKontext(prompt, refImage, aspectRatio, token);
    }

    console.log(`[generate-creative] OK — ${result.model} in ${Math.round(result.duration_ms / 1000)}s`);

    return json({
      image: result.image,
      prompt_used: selectedModel === "imagen4" ? buildImagen4Prompt(body) : (useMultiImage ? buildFluxMultiImagePrompt(body) : buildFluxSinglePrompt(body)),
      model: result.model,
      duration_ms: result.duration_ms,
      variation: body.variation ?? 30,
      format: aspectRatio,
      multi_image: useMultiImage,
    }, 200, cors);
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    console.error("[generate-creative] Error:", msg);
    return json({ error: "generation_failed", details: msg.slice(0, 500) }, 502, cors);
  }
});
