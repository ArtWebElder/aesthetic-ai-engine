/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Generate a creative using Flux Kontext Pro via Replicate.
// Takes a reference image + optional subject + text replacements + variation level.

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

const REPLICATE_OWNER = "black-forest-labs";
const REPLICATE_MODEL = "flux-kontext-pro";
const REPLICATE_TIMEOUT_MS = 120_000;
const REPLICATE_POLL_MS = 1_500;

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
}

function pickAspectRatio(format: string | undefined): string {
  const map: Record<string, string> = {
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "16:9": "16:9",
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
      "Preserve the exact text positioning, font styles, decorative elements, and color scheme."
    );
  } else if (variation <= 60) {
    parts.push(
      "Create a similar image inspired by this reference, keeping the overall style, layout structure, and visual language but with creative freedom. " +
      "Maintain the same mood and professional quality."
    );
  } else {
    parts.push(
      "Create a new image loosely inspired by this reference, reimagining the concept with significant creative freedom. " +
      "Keep the same general category and purpose but explore new compositions, colors, and visual approaches."
    );
  }

  // Subject replacement
  if (body.subject_image) {
    parts.push(
      "Replace the main person/product in the image with the provided subject photo. " +
      "Preserve the subject's exact appearance, pose integration, and natural lighting match with the scene."
    );
  }

  // Text replacements
  if (body.text_replacements && body.text_replacements.length > 0) {
    const replacements = body.text_replacements
      .filter(r => r.original && r.replacement)
      .map(r => `"${r.original}" → "${r.replacement}"`)
      .join("; ");
    if (replacements) {
      parts.push(`Change the following texts in the image: ${replacements}. Maintain the same font style, size, and position for each replaced text.`);
    }
  }

  // Color palette
  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`Adjust the color palette to use these colors: ${body.color_palette.join(", ")}. Apply them to backgrounds, accents, and decorative elements while keeping text readable.`);
  }

  // Extra instructions
  if (body.extra_instructions && body.extra_instructions.trim()) {
    parts.push(body.extra_instructions.trim());
  }

  // Quality directive
  parts.push("Output must be high quality, professional advertisement grade, sharp details, proper contrast.");

  return parts.join("\n\n");
}

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
    const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
    if (!token) {
      return json({ error: "missing_api_token", details: "REPLICATE_API_TOKEN not configured." }, 500, cors);
    }

    let body: GenerateBody;
    try {
      body = await req.json() as GenerateBody;
    } catch {
      return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
    }

    if (!body.reference_image || typeof body.reference_image !== "string") {
      return json({ error: "missing_reference", details: "Field 'reference_image' (base64 or data URI) is required." }, 400, cors);
    }

    // Ensure reference_image is a data URI
    const refImage = body.reference_image.startsWith("data:")
      ? body.reference_image
      : `data:image/png;base64,${body.reference_image}`;

    const prompt = buildPrompt(body);
    const aspectRatio = pickAspectRatio(body.format);

    console.log(`[generate-creative] Variation: ${body.variation ?? 30} | Format: ${aspectRatio} | Prompt length: ${prompt.length}`);
    console.log(`[generate-creative] Text replacements: ${body.text_replacements?.length ?? 0} | Subject: ${body.subject_image ? "yes" : "no"} | Colors: ${body.color_palette?.length ?? 0}`);

    // Build Replicate input
    const replicateInput: Record<string, unknown> = {
      prompt,
      input_image: refImage,
      aspect_ratio: aspectRatio,
    };

    // If subject_image provided, include as prompt instruction (Kontext doesn't have a separate subject input)
    // The subject is referenced in the prompt; Kontext handles image editing based on the input_image + prompt.
    // For true subject swaps, the subject_image needs to be passed as a separate reference.
    // Kontext Pro accepts input_image as the base — we pass the reference as input and describe the subject swap in prompt.

    const createUrl = `https://api.replicate.com/v1/models/${REPLICATE_OWNER}/${REPLICATE_MODEL}/predictions`;

    console.log(`[generate-creative] Calling Replicate: ${createUrl}`);

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
      console.error(`[generate-creative] Replicate create failed (${createResp.status}):`, createText.slice(0, 300));
      return json({
        error: "replicate_create_failed",
        details: createText.slice(0, 300),
        status: createResp.status,
      }, 502, cors);
    }

    let last: Record<string, unknown>;
    try {
      last = JSON.parse(createText) as Record<string, unknown>;
    } catch {
      return json({ error: "replicate_invalid_response", details: "Could not parse Replicate response." }, 502, cors);
    }

    const pollUrl = String((last.urls as Record<string, string>)?.get ?? "").trim();
    if (!pollUrl) {
      return json({ error: "replicate_no_poll_url", details: "Replicate did not return a polling URL." }, 502, cors);
    }

    console.log(`[generate-creative] Prediction created. Polling: ${pollUrl}`);

    // Poll for completion
    const startedAt = Date.now();
    while (Date.now() - startedAt < REPLICATE_TIMEOUT_MS) {
      const status = String(last?.status ?? "");

      if (status === "succeeded") break;
      if (status === "failed" || status === "canceled") {
        const errMsg = String(last?.error ?? "Unknown error").slice(0, 300);
        console.error(`[generate-creative] Replicate ${status}:`, errMsg);
        return json({ error: `replicate_${status}`, details: errMsg }, 502, cors);
      }

      await sleep(REPLICATE_POLL_MS);

      const pollResp = await fetch(pollUrl, {
        headers: { authorization: `Token ${token}` },
      });
      if (!pollResp.ok) {
        const pollErr = await pollResp.text();
        console.error(`[generate-creative] Poll failed (${pollResp.status}):`, pollErr.slice(0, 200));
        continue;
      }
      const pollText = await pollResp.text();
      try {
        last = JSON.parse(pollText) as Record<string, unknown>;
      } catch {
        continue;
      }
    }

    if (String(last?.status ?? "") !== "succeeded") {
      console.error("[generate-creative] Replicate timeout after", Math.round((Date.now() - startedAt) / 1000), "s");
      return json({ error: "replicate_timeout", details: "Generation timed out after 120s." }, 504, cors);
    }

    const outputUrl = pickOutputUrl(last);
    if (!outputUrl) {
      return json({ error: "replicate_no_output", details: "Replicate returned no output image." }, 502, cors);
    }

    const durationMs = Date.now() - startedAt;
    console.log(`[generate-creative] Success in ${Math.round(durationMs / 1000)}s — output: ${outputUrl.slice(0, 80)}...`);

    return json({
      image: outputUrl,
      prompt_used: prompt,
      model: `${REPLICATE_OWNER}/${REPLICATE_MODEL}`,
      duration_ms: durationMs,
      variation: body.variation ?? 30,
      format: aspectRatio,
    }, 200, cors);
  } catch (err) {
    console.error("[generate-creative] Unexpected error:", err);
    return json({ error: "internal_error", details: String((err as Error)?.message ?? err) }, 500, cors);
  }
});
