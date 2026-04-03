/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Multi-model creative generation.
// Primary: Nano Banana Pro (google/nano-banana-pro) — best subject swap + text quality
// Fallback: Flux Kontext Pro (black-forest-labs/flux-kontext-pro)

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
  model?: "nano-banana" | "flux-kontext";
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

/** Shared modifiers: text replacements, colors, extra instructions */
function buildModifiers(body: GenerateBody): string {
  const parts: string[] = [];

  if (body.text_replacements && body.text_replacements.length > 0) {
    const changes = body.text_replacements
      .filter(r => r.original && r.replacement && r.original !== r.replacement)
      .map(r => `Change the text '${r.original}' to '${r.replacement}'.`);
    if (changes.length > 0) parts.push(changes.join(" "));
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`Use this color scheme: ${body.color_palette.join(", ")}.`);
  }

  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  return parts.join(" ");
}

// ── Prompt builders ────────────────────────────────────────────────────────────

/** Prompt for Nano Banana Pro (supports multi-image natively) */
function buildNanaBananaPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  if (body.subject_image) {
    // Multi-image: reference (image 1) + subject (image 2)
    parts.push("Use the style, layout, and design from image 1 to create an advertisement featuring the product/person from image 2.");
  } else {
    // Single image: recreate the reference
    parts.push("Use the style, layout, and design from image 1 to create an advertisement.");
  }

  if (variation <= 20) {
    parts.push("Keep the layout and design as close to image 1 as possible.");
  } else if (variation > 50) {
    parts.push("Take creative liberties while keeping the general style.");
  }

  const mods = buildModifiers(body);
  if (mods) parts.push(mods);

  parts.push("All text must be sharp, legible, and professional.");

  return parts.join(" ");
}

/** Prompt for single-image Flux Kontext Pro (fallback) */
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

  const mods = buildModifiers(body);
  const full = mods ? `${base} ${mods}` : base;
  return `${full} All text must be sharp and readable.`;
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

// ── Nano Banana Pro (primary) ──────────────────────────────────────────────────

const NANO_BANANA_MODEL = "google/nano-banana-pro";

async function generateWithNanaBanana(
  prompt: string,
  refImage: string,
  subjectImage: string | null,
  aspectRatio: string,
  token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  // deno-lint-ignore no-explicit-any
  const input: Record<string, any> = {
    prompt,
    image_1: refImage,
    aspect_ratio: aspectRatio,
  };

  if (subjectImage) {
    input.image_2 = subjectImage;
  }

  console.log(`[nano-banana] Subject: ${subjectImage ? "yes (image_2)" : "no"} | Prompt: ${prompt.slice(0, 150)}`);

  const { outputUrl, duration_ms } = await callReplicate(NANO_BANANA_MODEL, input, token);
  return { image: outputUrl, model: NANO_BANANA_MODEL, duration_ms };
}

// ── Flux Kontext Pro (fallback) ────────────────────────────────────────────────

const FLUX_SINGLE_MODEL = "black-forest-labs/flux-kontext-pro";

async function generateWithFlux(
  prompt: string,
  refImage: string,
  aspectRatio: string,
  token: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const { outputUrl, duration_ms } = await callReplicate(FLUX_SINGLE_MODEL, {
    prompt,
    input_image: refImage,
    aspect_ratio: aspectRatio,
  }, token);
  return { image: outputUrl, model: FLUX_SINGLE_MODEL, duration_ms };
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
    if (!token) {
      return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);
    }

    const selectedModel = body.model || "nano-banana";
    const aspectRatio = pickAspectRatio(body.format);
    const refImage = ensureDataUri(body.reference_image);
    const hasSubject = Boolean(body.subject_image);
    const subjectImage = hasSubject ? ensureDataUri(body.subject_image!) : null;

    console.log(`[generate-creative] Model: ${selectedModel} | Subject: ${hasSubject} | Variation: ${body.variation ?? 30} | Format: ${aspectRatio}`);

    let result: { image: string; model: string; duration_ms: number };
    let prompt: string;

    if (selectedModel === "flux-kontext") {
      // ── Flux Kontext Pro (explicit choice) ──
      prompt = buildFluxPrompt(body);
      result = await generateWithFlux(prompt, refImage, aspectRatio, token);
    } else {
      // ── Nano Banana Pro (default) with Flux fallback ──
      prompt = buildNanaBananaPrompt(body);
      try {
        result = await generateWithNanaBanana(prompt, refImage, subjectImage, aspectRatio, token);
      } catch (nanaBananaErr) {
        const errMsg = String((nanaBananaErr as Error)?.message ?? nanaBananaErr);
        console.warn(`[generate-creative] Nano Banana failed: ${errMsg.slice(0, 200)} — falling back to Flux Kontext`);

        prompt = buildFluxPrompt(body);
        result = await generateWithFlux(prompt, refImage, aspectRatio, token);
        result.model = `${result.model} (fallback from nano-banana)`;
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
    }, 200, cors);
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    console.error("[generate-creative] Error:", msg);
    return json({ error: "generation_failed", details: msg.slice(0, 500) }, 502, cors);
  }
});
