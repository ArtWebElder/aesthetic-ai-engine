/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Multi-model creative generation.
// Supports: Flux Kontext Pro (Replicate) + Imagen 4 (Gemini API).

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

/**
 * Short, direct prompt for Flux Kontext Pro.
 * Flux works best with concise instructions (< 200 words).
 */
function buildFluxPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  if (variation <= 20) {
    parts.push("Recreate this exact advertisement with the same layout, colors, and typography. Keep all text sharp and legible.");
  } else if (variation <= 60) {
    parts.push("Create a similar advertisement inspired by this reference. Keep the same style and mood with some creative variation.");
  } else {
    parts.push("Reimagine this advertisement concept with significant creative freedom. Same purpose, new design.");
  }

  if (body.subject_image) {
    parts.push("Replace the main subject with the provided photo.");
  }

  if (body.text_replacements && body.text_replacements.length > 0) {
    const changes = body.text_replacements
      .filter(r => r.original && r.replacement && r.original !== r.replacement)
      .map(r => `Change text '${r.original}' to '${r.replacement}'.`);
    if (changes.length > 0) {
      parts.push(changes.join(" "));
    }
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`Use these colors: ${body.color_palette.join(", ")}.`);
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  parts.push("All text must be perfectly sharp and readable. Professional quality.");

  return parts.join(" ");
}

/**
 * Detailed prompt for Imagen 4.
 * Imagen 4 handles longer, structured prompts well.
 */
function buildImagen4Prompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  if (variation <= 20) {
    parts.push(
      "Recreate this advertisement image exactly, preserving the same layout, typography, colors, composition, and visual treatment."
    );
  } else if (variation <= 60) {
    parts.push(
      "Create a similar advertisement inspired by this reference, keeping the style, layout, and visual language with some creative freedom."
    );
  } else {
    parts.push(
      "Create a new advertisement inspired by this reference, reimagining the concept with creative freedom while keeping the same purpose."
    );
  }

  if (body.subject_image) {
    parts.push("Replace the main product/person with the provided subject photo, integrating it naturally with matching lighting and scale.");
  }

  if (body.text_replacements && body.text_replacements.length > 0) {
    const changes = body.text_replacements
      .filter(r => r.original && r.replacement && r.original !== r.replacement);
    if (changes.length > 0) {
      parts.push("Text changes:");
      for (const r of changes) {
        parts.push(`- "${r.original}" → "${r.replacement}"`);
      }
    }
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`Color palette: ${body.color_palette.join(", ")}. Apply to backgrounds, accents, and decorative elements.`);
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  parts.push("All text must be perfectly legible with clean edges and proper kerning. Professional advertisement quality, sharp details.");

  return parts.join("\n\n");
}

// ── Flux Kontext Pro (Replicate) ───────────────────────────────────────────────

const REPLICATE_OWNER = "black-forest-labs";
const REPLICATE_MODEL = "flux-kontext-pro";
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

async function generateWithFluxKontext(
  prompt: string,
  refImage: string,
  aspectRatio: string,
  token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const replicateInput: Record<string, unknown> = {
    prompt,
    input_image: refImage,
    aspect_ratio: aspectRatio,
  };

  const createUrl = `https://api.replicate.com/v1/models/${REPLICATE_OWNER}/${REPLICATE_MODEL}/predictions`;
  console.log(`[generate-creative:flux] Prompt (${prompt.length} chars): ${prompt.slice(0, 200)}`);

  const createResp = await fetch(createUrl, {
    method: "POST",
    headers: {
      authorization: `Token ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ input: replicateInput }),
  });

  const createText = await createResp.text();
  if (!createResp.ok) {
    throw new Error(`replicate_create_failed (${createResp.status}): ${createText.slice(0, 300)}`);
  }

  let last: Record<string, unknown>;
  try {
    last = JSON.parse(createText) as Record<string, unknown>;
  } catch {
    throw new Error("replicate_invalid_response: Could not parse Replicate response.");
  }

  const pollUrl = String((last.urls as Record<string, string>)?.get ?? "").trim();
  if (!pollUrl) throw new Error("replicate_no_poll_url");

  console.log(`[generate-creative:flux] Polling: ${pollUrl}`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < REPLICATE_TIMEOUT_MS) {
    const status = String(last?.status ?? "");
    if (status === "succeeded") break;
    if (status === "failed" || status === "canceled") {
      throw new Error(`replicate_${status}: ${String(last?.error ?? "Unknown error").slice(0, 300)}`);
    }
    await sleep(REPLICATE_POLL_MS);
    const pollResp = await fetch(pollUrl, { headers: { authorization: `Token ${token}` } });
    if (!pollResp.ok) continue;
    const pollText = await pollResp.text();
    try { last = JSON.parse(pollText) as Record<string, unknown>; } catch { continue; }
  }

  if (String(last?.status ?? "") !== "succeeded") {
    throw new Error(`replicate_timeout: Generation timed out after ${Math.round(REPLICATE_TIMEOUT_MS / 1000)}s.`);
  }

  const outputUrl = pickOutputUrl(last);
  if (!outputUrl) throw new Error("replicate_no_output: Replicate returned no output image.");

  return {
    image: outputUrl,
    model: `${REPLICATE_OWNER}/${REPLICATE_MODEL}`,
    duration_ms: Date.now() - startedAt,
  };
}

// ── Imagen 4 (Gemini API) ──────────────────────────────────────────────────────

const IMAGEN4_MODEL = "imagen-4.0-generate-001";

function stripBase64Prefix(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, "");
}

async function generateWithImagen4(
  prompt: string,
  refImageBase64: string | null,
  subjectImageBase64: string | null,
  aspectRatio: string,
  apiKey: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN4_MODEL}:predict?key=${encodeURIComponent(apiKey)}`;
  console.log(`[generate-creative:imagen4] Calling: ${url.split("?")[0]}`);

  const imagen4AR: Record<string, string> = {
    "1:1": "1:1", "4:5": "3:4", "9:16": "9:16", "16:9": "16:9",
  };

  // Build instance with reference images
  // deno-lint-ignore no-explicit-any
  const instance: Record<string, any> = { prompt };

  const referenceImages: Array<Record<string, unknown>> = [];

  // Style reference (the creative being recreated)
  if (refImageBase64) {
    referenceImages.push({
      referenceImage: { bytesBase64Encoded: stripBase64Prefix(refImageBase64) },
      referenceId: 1,
      referenceType: "REFERENCE_TYPE_STYLE",
    });
  }

  // Subject reference (product/person to swap in)
  if (subjectImageBase64) {
    referenceImages.push({
      referenceImage: { bytesBase64Encoded: stripBase64Prefix(subjectImageBase64) },
      referenceId: 2,
      referenceType: "REFERENCE_TYPE_SUBJECT",
    });
  }

  if (referenceImages.length > 0) {
    instance.referenceImages = referenceImages;
  }

  const requestBody = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      aspectRatio: imagen4AR[aspectRatio] || "1:1",
      safetyFilterLevel: "block_only_high",
      personGeneration: "allow_adult",
    },
  };

  console.log(`[generate-creative:imagen4] References: ${referenceImages.length} | AR: ${imagen4AR[aspectRatio] || "1:1"} | Prompt: ${prompt.length} chars`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[generate-creative:imagen4] HTTP ${response.status}:`, errText.slice(0, 400));
    throw new Error(`imagen4_http_${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded
    || data?.predictions?.[0]?.image?.bytesBase64Encoded
    || null;

  if (!b64) {
    console.error(`[generate-creative:imagen4] No image in response:`, JSON.stringify(data).slice(0, 300));
    throw new Error("imagen4_no_image: Imagen 4 returned no image data.");
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

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    let body: GenerateBody;
    try {
      body = await req.json() as GenerateBody;
    } catch {
      return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
    }

    if (!body.reference_image || typeof body.reference_image !== "string") {
      return json({ error: "missing_reference", details: "Field 'reference_image' (base64 or data URI) is required." }, 400, cors);
    }

    const selectedModel = body.model || "flux-kontext";
    const aspectRatio = pickAspectRatio(body.format);

    // Ensure reference_image is a data URI
    const refImage = body.reference_image.startsWith("data:")
      ? body.reference_image
      : `data:image/png;base64,${body.reference_image}`;

    // Build model-specific prompt
    const prompt = selectedModel === "imagen4"
      ? buildImagen4Prompt(body)
      : buildFluxPrompt(body);

    console.log(`[generate-creative] Model: ${selectedModel} | Variation: ${body.variation ?? 30} | Format: ${aspectRatio} | Prompt: ${prompt.length} chars`);

    let result: { image: string; model: string; duration_ms: number };

    if (selectedModel === "imagen4") {
      const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
      if (!apiKey) {
        return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured for Imagen 4." }, 500, cors);
      }
      const subjectImage = body.subject_image || null;
      result = await generateWithImagen4(prompt, refImage, subjectImage, aspectRatio, apiKey);
    } else {
      const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
      if (!token) {
        return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);
      }
      result = await generateWithFluxKontext(prompt, refImage, aspectRatio, token);
    }

    console.log(`[generate-creative] Success — ${result.model} in ${Math.round(result.duration_ms / 1000)}s`);

    return json({
      image: result.image,
      prompt_used: prompt,
      model: result.model,
      duration_ms: result.duration_ms,
      variation: body.variation ?? 30,
      format: aspectRatio,
    }, 200, cors);
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    console.error("[generate-creative] Error:", msg);
    return json({ error: "generation_failed", details: msg.slice(0, 500) }, 502, cors);
  }
});
