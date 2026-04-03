/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Gemini analysis + Nano Banana Pro generation pipeline.
// Primary: Nano Banana Pro (google/nano-banana-pro)
// Fallback: Flux Kontext Pro (black-forest-labs/flux-kontext-pro)
// When analysis from analyze-creative is provided, uses fullPrompt as base.

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

interface AnalysisData {
  fullPrompt?: string;
  texts?: Array<{ type: string; content: string; position?: string }>;
  colors?: string[];
  layout?: string;
  style?: string;
  [key: string]: unknown;
}

interface GenerateBody {
  reference_image: string;
  subject_image?: string;
  text_replacements?: TextReplacement[];
  color_palette?: string[];
  variation?: number;
  extra_instructions?: string;
  format?: string;
  model?: "nano-banana" | "flux-kontext";
  analysis?: AnalysisData;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pickAspectRatio(format: string | undefined): string {
  const map: Record<string, string> = {
    "1:1": "1:1", "4:5": "4:5", "9:16": "9:16", "16:9": "16:9",
  };
  return map[format ?? ""] || "1:1";
}

function ensureDataUri(b64: string): string {
  return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

/** Resolve the final text for each item: use replacement if changed, else original */
function resolveAllTexts(body: GenerateBody): Array<{ type: string; text: string }> {
  const replacements = body.text_replacements || [];
  // Build a map of original→replacement
  const repMap = new Map<string, string>();
  for (const r of replacements) {
    if (r.original && r.replacement) repMap.set(r.original, r.replacement);
  }
  // Start from analysis texts if available, then overlay replacements
  const analysisTexts = body.analysis?.texts || [];
  if (analysisTexts.length > 0) {
    return analysisTexts.map(t => ({
      type: t.type,
      text: repMap.get(t.content) || t.content,
    }));
  }
  // Fallback: just use replacements as final texts
  return replacements.filter(r => r.replacement).map(r => ({
    type: 'text',
    text: r.replacement,
  }));
}

/**
 * Build prompt using Gemini analysis as foundation.
 * Structured sections: layout, subject, texts, colors, variation, output rules.
 */
function buildAnalysisPrompt(body: GenerateBody): string {
  const analysis = body.analysis!;
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const sections: string[] = [];

  // Header
  if (body.subject_image) {
    sections.push("Recreate this advertisement exactly as described below, using the product/person from the second input image as the main subject.");
  } else {
    sections.push("Recreate this advertisement exactly as described below.");
  }

  // LAYOUT AND COMPOSITION
  sections.push(
    `LAYOUT AND COMPOSITION:\n${analysis.fullPrompt || "Professional advertisement with clean layout, balanced typography, and commercial-grade visual quality."}`
  );

  // SUBJECT REPLACEMENT
  if (body.subject_image) {
    sections.push(
      `SUBJECT REPLACEMENT:\nThe main subject in the final image MUST be the exact product/person shown in the second input image. Copy every detail from it: exact shape, colors, textures, proportions, branding. Do NOT generate a new subject — use the second image as-is and integrate it into the scene from the first image with natural lighting, shadows, and scale.`
    );
  }

  // EXACT TEXT CONTENT — list ALL texts
  const allTexts = resolveAllTexts(body);
  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => {
      const label = t.type.charAt(0).toUpperCase() + t.type.slice(1);
      return `${label}: "${t.text}"`;
    }).join("\n");
    sections.push(
      `EXACT TEXT CONTENT (render these texts exactly as written, with perfect spelling):\n${textLines}`
    );
  }

  // COLOR PALETTE
  if (body.color_palette && body.color_palette.length > 0) {
    const c = body.color_palette;
    const assignments: string[] = [];
    if (c[0]) assignments.push(`Primary/Background: ${c[0]}`);
    if (c[1]) assignments.push(`Secondary/Accents: ${c[1]}`);
    if (c[2]) assignments.push(`Highlights: ${c[2]}`);
    if (c[3]) assignments.push(`Text primary: ${c[3]}`);
    if (c[4]) assignments.push(`Text secondary: ${c[4]}`);
    sections.push(
      `COLOR PALETTE (MANDATORY — override the original colors):\n${assignments.join("\n")}\nThese colors MUST replace the original color scheme. Do not keep the original colors.`
    );
  }

  // VARIATION LEVEL
  let variationDesc: string;
  if (variation === 0) {
    variationDesc = "This must be an exact recreation. Same layout, same positions, same proportions.";
  } else if (variation <= 30) {
    variationDesc = "Minor creative adjustments allowed but maintain the core layout and structure.";
  } else if (variation <= 60) {
    variationDesc = "Moderate creative freedom. Keep the general concept but reimagine details.";
  } else {
    variationDesc = "Full creative reinterpretation. Use the reference as loose inspiration only.";
  }
  sections.push(`VARIATION LEVEL: ${variation}%\n${variationDesc}`);

  // EXTRA INSTRUCTIONS
  if (body.extra_instructions && body.extra_instructions.trim()) {
    sections.push(`ADDITIONAL INSTRUCTIONS:\n${body.extra_instructions.trim()}`);
  }

  // OUTPUT REQUIREMENTS
  sections.push(
    `OUTPUT REQUIREMENTS:\n- Professional advertisement quality\n- All text must be perfectly legible, sharp, and correctly spelled\n- No watermarks, no signatures, no AI artifacts\n- Clean, commercial-ready output`
  );

  return sections.join("\n\n");
}

/** Generic prompt when no analysis is available */
function buildGenericPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  if (body.subject_image) {
    parts.push("Use the style, layout, and design from the first image to create an advertisement. The main subject MUST be the exact product/person from the second image — copy every detail exactly as it appears. Do not generate a new subject.");
  } else {
    parts.push("Recreate this advertisement with the same style, layout, and design.");
  }

  if (variation <= 20) {
    parts.push("Keep the layout and design as close as possible to the original.");
  } else if (variation > 50) {
    parts.push("Take creative liberties while keeping the general style.");
  }

  // List ALL texts (not just changed ones)
  const allTexts = resolveAllTexts(body);
  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => `- ${t.type}: "${t.text}"`).join("\n");
    parts.push(`These exact texts must appear in the image:\n${textLines}`);
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`MANDATORY colors: ${body.color_palette.join(", ")}. Replace the original color scheme entirely.`);
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  parts.push("All text must be sharp and legible. No watermarks or AI artifacts. Professional quality.");
  return parts.join("\n\n");
}

/** Flux fallback prompt */
function buildFluxPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  let base: string;

  if (variation <= 20) {
    base = "Recreate this exact advertisement with the same layout, colors, and typography.";
  } else if (variation <= 60) {
    base = "Create a similar advertisement inspired by this reference. Keep the same style and mood.";
  } else {
    base = "Reimagine this advertisement concept with creative freedom. Same purpose, new design.";
  }

  if (body.subject_image) {
    base += " Replace the main subject with the provided photo.";
  }

  if (body.text_replacements && body.text_replacements.length > 0) {
    const changes = body.text_replacements
      .filter(r => r.original && r.replacement && r.original !== r.replacement)
      .map(r => `Change '${r.original}' to '${r.replacement}'.`);
    if (changes.length > 0) base += " " + changes.join(" ");
  }

  if (body.color_palette && body.color_palette.length > 0) {
    base += ` Use colors: ${body.color_palette.join(", ")}.`;
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    base += " " + body.extra_instructions.trim();
  }

  return `${base} All text must be sharp and readable.`;
}

// ── Replicate polling ──────────────────────────────────────────────────────────

const REPLICATE_TIMEOUT_MS = 300_000;
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

async function pollReplicate(
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

async function callReplicate(
  modelPath: string,
  input: Record<string, unknown>,
  token: string,
): Promise<{ outputUrl: string; duration_ms: number }> {
  const startedAt = Date.now();
  const createUrl = `https://api.replicate.com/v1/models/${modelPath}/predictions`;
  console.log(`[replicate] ${modelPath} | Input keys: ${Object.keys(input).join(", ")}`);

  const resp = await fetch(createUrl, {
    method: "POST",
    headers: { authorization: `Token ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`replicate_create_failed (${resp.status}): ${text.slice(0, 300)}`);

  const parsed = JSON.parse(text);
  const pollUrl = String(parsed?.urls?.get ?? "").trim();
  if (!pollUrl) throw new Error("replicate_no_poll_url");

  console.log(`[replicate] Polling: ${pollUrl}`);
  const outputUrl = await pollReplicate(pollUrl, token, parsed);
  return { outputUrl, duration_ms: Date.now() - startedAt };
}

// ── Model functions ────────────────────────────────────────────────────────────

const NANO_BANANA_MODEL = "google/nano-banana-pro";
const FLUX_MODEL = "black-forest-labs/flux-kontext-pro";

async function generateWithNanaBanana(
  prompt: string, refImage: string, subjectImage: string | null, aspectRatio: string, token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  // Nano Banana Pro uses "image_input" as an ARRAY (up to 14 images)
  // image_input[0] = reference creative, image_input[1] = subject photo
  const imageInput: string[] = [refImage];
  if (subjectImage) imageInput.push(subjectImage);

  // deno-lint-ignore no-explicit-any
  const input: Record<string, any> = {
    prompt,
    image_input: imageInput,
    aspect_ratio: aspectRatio,
    output_format: "jpg",
    safety_filter_level: "block_only_high",
  };

  console.log(`[nano-banana] image_input: ${imageInput.length} image(s) | Prompt: ${prompt.slice(0, 150)}`);
  console.log(`[nano-banana] Input fields:`, Object.keys(input));

  const { outputUrl, duration_ms } = await callReplicate(NANO_BANANA_MODEL, input, token);
  return { image: outputUrl, model: NANO_BANANA_MODEL, duration_ms };
}

async function generateWithFlux(
  prompt: string, refImage: string, aspectRatio: string, token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const { outputUrl, duration_ms } = await callReplicate(FLUX_MODEL, {
    prompt, input_image: refImage, aspect_ratio: aspectRatio,
  }, token);
  return { image: outputUrl, model: FLUX_MODEL, duration_ms };
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

    const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
    if (!token) return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);

    const selectedModel = body.model || "nano-banana";
    const aspectRatio = pickAspectRatio(body.format);
    const refImage = ensureDataUri(body.reference_image);
    const hasSubject = Boolean(body.subject_image);
    const subjectImage = hasSubject ? ensureDataUri(body.subject_image!) : null;
    const hasAnalysis = Boolean(body.analysis?.fullPrompt);

    console.log(`[generate-creative] Model: ${selectedModel} | HasAnalysis: ${hasAnalysis} | Subject: ${hasSubject} | Variation: ${body.variation ?? 30} | Format: ${aspectRatio}`);
    console.log(`[generate-creative] Text replacements: ${body.text_replacements?.length ?? 0}`);

    let result: { image: string; model: string; duration_ms: number };
    let prompt: string;

    if (selectedModel === "flux-kontext") {
      prompt = buildFluxPrompt(body);
      console.log(`[generate-creative] Prompt length: ${prompt.length} | Mode: flux-direct`);
      result = await generateWithFlux(prompt, refImage, aspectRatio, token);
    } else {
      // Nano Banana with analysis-aware prompt
      prompt = hasAnalysis ? buildAnalysisPrompt(body) : buildGenericPrompt(body);
      console.log(`[generate-creative] Prompt length: ${prompt.length} | Mode: ${hasAnalysis ? "analysis-driven" : "generic"}`);

      try {
        result = await generateWithNanaBanana(prompt, refImage, subjectImage, aspectRatio, token);
      } catch (err) {
        const errMsg = String((err as Error)?.message ?? err);
        console.warn(`[generate-creative] Nano Banana failed: ${errMsg.slice(0, 200)} — falling back to Flux`);
        prompt = buildFluxPrompt(body);
        result = await generateWithFlux(prompt, refImage, aspectRatio, token);
        result.model = `${result.model} (fallback)`;
      }
    }

    console.log(`[generate-creative] OK — ${result.model} in ${Math.round(result.duration_ms / 1000)}s`);

    return json({
      image: result.image,
      prompt_used: prompt,
      model: result.model,
      duration_ms: result.duration_ms,
      variation: body.variation ?? 30,
      format: aspectRatio,
      analysis_used: hasAnalysis,
    }, 200, cors);
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    console.error("[generate-creative] Error:", msg);
    return json({ error: "generation_failed", details: msg.slice(0, 500) }, 502, cors);
  }
});
