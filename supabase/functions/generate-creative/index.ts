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

// ── Prompt builder ─────────────────────────────────────────────────────────────

function pickAspectRatio(format: string | undefined): string {
  const map: Record<string, string> = {
    "1:1": "1:1", "4:5": "4:5", "9:16": "9:16", "16:9": "16:9",
  };
  return map[format ?? ""] || "1:1";
}

function buildPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  // Base instruction based on variation level
  if (variation <= 20) {
    parts.push(
      "Recreate this image exactly, maintaining the same layout, typography style, colors, composition, and overall visual treatment. " +
      "Preserve the exact text positioning, font styles, decorative elements, and color scheme. " +
      "The output should be nearly indistinguishable from the original in terms of design and structure."
    );
  } else if (variation <= 60) {
    parts.push(
      "Create a similar image inspired by this reference, keeping the overall style, layout structure, and visual language but with creative freedom. " +
      "Maintain the same mood, professional quality, and general composition."
    );
  } else {
    parts.push(
      "Create a new image loosely inspired by this reference, reimagining the concept with significant creative freedom. " +
      "Keep the same general category and purpose but explore new compositions, colors, and visual approaches."
    );
  }

  // Subject replacement — explicit and directive
  if (body.subject_image) {
    parts.push(
      "SUBJECT SWAP: Edit this advertisement image. Replace the main product/person visible in the image with the subject from the provided reference photo. " +
      "Keep everything else IDENTICAL: same layout, same text positions, same typography, same colors, same decorative elements, same background. " +
      "The new subject must be integrated naturally with matching lighting, shadows, and scale."
    );
  }

  // Text replacements — per-text specificity
  if (body.text_replacements && body.text_replacements.length > 0) {
    const validReplacements = body.text_replacements.filter(r => r.original && r.replacement);
    if (validReplacements.length > 0) {
      parts.push("TEXT CHANGES (apply these exact replacements, keep same font style, size, weight, and position for each):");
      for (const r of validReplacements) {
        parts.push(`• Change "${r.original}" → "${r.replacement}"`);
      }
    }
  }

  // Color palette — mandatory and specific
  if (body.color_palette && body.color_palette.length > 0) {
    const colors = body.color_palette;
    const assignments: string[] = [];
    if (colors[0]) assignments.push(`background/primary areas: ${colors[0]}`);
    if (colors[1]) assignments.push(`accents and highlights: ${colors[1]}`);
    if (colors[2]) assignments.push(`secondary elements: ${colors[2]}`);
    if (colors[3]) assignments.push(`text color: ${colors[3]}`);
    if (colors[4]) assignments.push(`subtle details: ${colors[4]}`);

    parts.push(
      `MANDATORY COLOR PALETTE: The dominant colors of this image MUST be: ${colors.join(", ")}. ` +
      `Replace the original color scheme with: ${assignments.join("; ")}. ` +
      `Ensure text maintains high contrast and readability against the new background colors.`
    );
  }

  // Text quality directive
  parts.push(
    "CRITICAL TEXT RENDERING: All text in the image MUST be perfectly legible, crisp, and sharp. " +
    "Render text with clean edges, proper kerning, and high contrast against backgrounds. " +
    "Small text must be just as readable as large text. No blurry, distorted, warped, or melted text. " +
    "Every letter must be correctly formed — no missing characters, no extra characters, no misspellings."
  );

  // Extra instructions
  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(`ADDITIONAL INSTRUCTIONS: ${body.extra_instructions.trim()}`);
  }

  // Quality directive
  parts.push(
    "OUTPUT QUALITY: Professional advertisement grade. Sharp details, proper contrast, " +
    "clean edges on all elements, photorealistic where applicable. 8K quality rendering."
  );

  return parts.join("\n\n");
}

// ── Flux Kontext Pro (Replicate) ───────────────────────────────────────────────

const REPLICATE_OWNER = "black-forest-labs";
const REPLICATE_MODEL = "flux-kontext-pro";
const REPLICATE_TIMEOUT_MS = 120_000;
const REPLICATE_POLL_MS = 1_500;

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
  console.log(`[generate-creative:flux] Calling Replicate: ${createUrl}`);

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
    throw new Error("replicate_timeout: Generation timed out after 120s.");
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

async function generateWithImagen4(
  prompt: string,
  refImageBase64: string | null,
  aspectRatio: string,
  apiKey: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();

  // Imagen 4 via Gemini generateImages endpoint (REST predict)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN4_MODEL}:predict?key=${encodeURIComponent(apiKey)}`;

  console.log(`[generate-creative:imagen4] Calling Imagen 4: ${url.split("?")[0]}`);

  // Map aspect ratio to Imagen 4 supported values
  const imagen4AR: Record<string, string> = {
    "1:1": "1:1", "4:5": "3:4", "9:16": "9:16", "16:9": "16:9",
  };

  const requestBody: Record<string, unknown> = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: imagen4AR[aspectRatio] || "1:1",
      safetyFilterLevel: "block_only_high",
      personGeneration: "allow_adult",
    },
  };

  // If reference image is available, include it for style guidance
  if (refImageBase64) {
    const clean = refImageBase64.replace(/^data:image\/\w+;base64,/, "");
    (requestBody.instances as Record<string, unknown>[])[0].referenceImages = [{
      referenceImage: { bytesBase64Encoded: clean },
      referenceType: "REFERENCE_TYPE_STYLE",
    }];
  }

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
    console.error(`[generate-creative:imagen4] HTTP ${response.status}:`, errText.slice(0, 300));
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

  // Return as data URI
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
    const prompt = buildPrompt(body);
    const aspectRatio = pickAspectRatio(body.format);

    // Ensure reference_image is a data URI
    const refImage = body.reference_image.startsWith("data:")
      ? body.reference_image
      : `data:image/png;base64,${body.reference_image}`;

    console.log(`[generate-creative] Model: ${selectedModel} | Variation: ${body.variation ?? 30} | Format: ${aspectRatio} | Prompt: ${prompt.length} chars`);
    console.log(`[generate-creative] Texts: ${body.text_replacements?.length ?? 0} | Subject: ${body.subject_image ? "yes" : "no"} | Colors: ${body.color_palette?.length ?? 0}`);

    let result: { image: string; model: string; duration_ms: number };

    if (selectedModel === "imagen4") {
      // ── Imagen 4 via Gemini API ──
      const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
      if (!apiKey) {
        return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured for Imagen 4." }, 500, cors);
      }
      result = await generateWithImagen4(prompt, refImage, aspectRatio, apiKey);
    } else {
      // ── Flux Kontext Pro (default) ──
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
