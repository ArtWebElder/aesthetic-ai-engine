/// <reference lib="deno.ns" />
// supabase/functions/generate-creative/index.ts
// CREATYNG — Engine v2: Google Generative AI (gemini-3-pro-image-preview)
// Direct API call — no Replicate, no polling. Fast and cheap.

import { corsHeaders } from "../_shared/cors.ts";

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
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
  analysis?: AnalysisData;
  active_texts?: Array<{ type: string; content: string }>;
  removed_texts?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function stripBase64Prefix(b64: string): string {
  return b64.replace(/^data:image\/\w+;base64,/, "");
}

function detectMime(b64: string): string {
  if (b64.startsWith("data:image/png")) return "image/png";
  if (b64.startsWith("data:image/webp")) return "image/webp";
  return "image/jpeg";
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function resolveAllTexts(body: GenerateBody): Array<{ type: string; text: string }> {
  // If active_texts is provided (user's current text list, excluding removed), use it directly
  if (body.active_texts && body.active_texts.length > 0) {
    return body.active_texts
      .filter(t => t.content && t.content.trim())
      .map(t => ({ type: t.type, text: t.content }));
  }
  // Fallback to legacy text_replacements logic
  const replacements = body.text_replacements || [];
  const repMap = new Map<string, string>();
  for (const r of replacements) {
    if (r.original && r.replacement) repMap.set(r.original, r.replacement);
  }
  const analysisTexts = body.analysis?.texts || [];
  if (analysisTexts.length > 0) {
    return analysisTexts.map(t => ({
      type: t.type,
      text: repMap.get(t.content) || t.content,
    }));
  }
  return replacements.filter(r => r.replacement).map(r => ({
    type: "text",
    text: r.replacement,
  }));
}

function colorsChanged(analysisColors: unknown, userColors: string[]): boolean {
  if (!Array.isArray(analysisColors)) return true;
  const orig = (analysisColors as string[]).map(c => c.toLowerCase());
  const user = userColors.map(c => c.toLowerCase());
  for (let i = 0; i < user.length; i++) {
    if (i >= orig.length || orig[i] !== user[i]) return true;
  }
  return false;
}

function buildAnalysisPrompt(body: GenerateBody): string {
  const analysis = body.analysis!;
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const sections: string[] = [];

  // ── HIGH PRIORITY: Watermark removal ──
  sections.push(
    `IMPORTANT: Do NOT reproduce any watermarks, brand logos, stock photo marks, or attribution text from the reference image. These must be completely removed from the output. If the reference contains visible watermarks or repeated logo patterns, ignore them entirely.`
  );

  // ── HIGH PRIORITY: Format override ──
  const userFormat = body.format || "1:1";
  sections.push(
    `OUTPUT FORMAT: Generate this image in ${userFormat} aspect ratio. This is MANDATORY regardless of the reference image format or aspect ratio.`
  );

  // ── HIGH PRIORITY: Color override when user changed colors ──
  if (body.color_palette && body.color_palette.length > 0 && colorsChanged(analysis.colors, body.color_palette)) {
    const c = body.color_palette;
    const a: string[] = [];
    if (c[0]) a.push(`Background/Primary: ${c[0]}`);
    if (c[1]) a.push(`Accents/Secondary: ${c[1]}`);
    if (c[2]) a.push(`Highlights: ${c[2]}`);
    if (c[3]) a.push(`Primary text color: ${c[3]}`);
    if (c[4]) a.push(`Secondary text color: ${c[4]}`);
    sections.push(
      `IMPORTANT COLOR OVERRIDE: The following colors MUST be used regardless of the reference image colors:\n${a.join("\n")}\nReplace ALL original colors with these new colors. This is mandatory even at 0% variation.`
    );
  }

  // ── Main instruction ──
  if (body.subject_image) {
    sections.push("Recreate this advertisement exactly as described below, using the product/person from the second input image as the main subject.");
  } else {
    sections.push("Recreate this advertisement exactly as described below.");
  }

  sections.push(
    `LAYOUT AND COMPOSITION:\n${analysis.fullPrompt || "Professional advertisement with clean layout, balanced typography, and commercial-grade visual quality."}`
  );

  if (body.subject_image) {
    sections.push(
      `SUBJECT REPLACEMENT:\nThe main subject in the final image MUST be the exact product/person shown in the second input image. Copy every detail: exact shape, colors, textures, proportions. Do NOT generate a new subject — use the second image as-is and integrate it into the scene from the first image.`
    );
  }

  // ── Texts: only user's active texts (removed texts are excluded) ──
  const allTexts = resolveAllTexts(body);
  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => {
      const label = t.type.charAt(0).toUpperCase() + t.type.slice(1);
      return `${label}: "${t.text}"`;
    }).join("\n");
    let textInstruction = `EXACT TEXT CONTENT (render these texts exactly as written, with perfect spelling):\n${textLines}\nThese are the ONLY texts that should appear in the final image. Any text from the reference image that is NOT in this list must be completely removed. This includes small text, watermarks, URLs, phone numbers, addresses, social media handles, and any other text not explicitly listed above. If a text is not in this list, it must NOT appear.`;
    if (body.removed_texts && body.removed_texts.length > 0) {
      textInstruction += `\n\nFORBIDDEN TEXTS (must NOT appear anywhere in the image):\n${body.removed_texts.map(t => `- "${t}"`).join("\n")}\nThese texts were explicitly removed by the user. They must be completely absent from the generated image.`;
    }
    sections.push(textInstruction);
  } else {
    sections.push("TEXT: Do NOT include any text, labels, phone numbers, or watermarks in the generated image.");
  }

  let vDesc: string;
  if (variation <= 5) vDesc = "EXACT COPY MODE: You must reproduce the reference image as EXACTLY as possible. Keep the EXACT same layout, composition, positioning, proportions, sizes, background style, gradients, and decorative elements. The ONLY changes allowed are: replacing the subject (if provided) and using the specified texts and colors. Do NOT reinterpret, reimagine, or creatively alter ANY aspect of the layout. Think of this as a template swap: same template, different content.";
  else if (variation <= 30) vDesc = "Minor creative adjustments allowed but maintain the core layout and structure.";
  else if (variation <= 60) vDesc = "Moderate creative freedom. Keep the general concept but reimagine details.";
  else vDesc = "Full creative reinterpretation. Use the reference as loose inspiration only.";
  sections.push(`VARIATION LEVEL: ${variation}%\n${vDesc}`);

  if (body.extra_instructions?.trim()) {
    sections.push(`ADDITIONAL INSTRUCTIONS:\n${body.extra_instructions.trim()}`);
  }

  sections.push("OUTPUT REQUIREMENTS:\n- Professional advertisement quality\n- All text must be perfectly legible, sharp, and correctly spelled\n- No watermarks, no signatures, no AI artifacts\n- Clean, commercial-ready output");

  return sections.join("\n\n");
}

function buildGenericPrompt(body: GenerateBody): string {
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const parts: string[] = [];

  // Watermark removal
  parts.push(`IMPORTANT: Do NOT reproduce any watermarks, brand logos, stock photo marks, or attribution text from the reference image. Remove them entirely.`);

  // Format override
  const userFormat = body.format || "1:1";
  parts.push(`OUTPUT FORMAT: Generate this image in ${userFormat} aspect ratio. This is MANDATORY.`);

  if (body.subject_image) {
    parts.push("Use the style, layout, and design from the first image to create an advertisement. The main subject MUST be the exact product/person from the second image — copy every detail exactly. Do not generate a new subject.");
  } else {
    parts.push("Recreate this advertisement with the same style, layout, and design.");
  }

  if (variation <= 20) parts.push("Keep the layout and design as close as possible to the original.");
  else if (variation > 50) parts.push("Take creative liberties while keeping the general style.");

  const allTexts = resolveAllTexts(body);
  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => `- ${t.type}: "${t.text}"`).join("\n");
    parts.push(`These exact texts must appear in the image:\n${textLines}\nOnly include the texts listed above. Do NOT add any other text.`);
  } else {
    parts.push("Do NOT include any text, labels, or watermarks in the generated image.");
  }

  if (body.color_palette && body.color_palette.length > 0) {
    parts.push(`MANDATORY colors: ${body.color_palette.join(", ")}. Replace the original color scheme entirely.`);
  }

  if (body.extra_instructions?.trim()) parts.push(body.extra_instructions.trim());

  parts.push("All text must be sharp and legible. No watermarks or AI artifacts. Professional quality.");
  return parts.join("\n\n");
}

// ── Google Generative AI ───────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-3-pro-image-preview";
const GEMINI_TIMEOUT_MS = 180_000;

// deno-lint-ignore no-explicit-any
function extractImageBase64(response: any): string | null {
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const data = part?.inlineData?.data ?? part?.inline_data?.data ?? null;
      if (typeof data === "string" && data.length > 100) {
        return data;
      }
    }
  }
  return null;
}

async function generateWithGemini(
  prompt: string,
  refImageB64: string,
  subjectImageB64: string | null,
  apiKey: string,
): Promise<{ image: string; model: string; duration_ms: number }> {
  const startedAt = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Build parts: text prompt + reference image + optional subject image
  // deno-lint-ignore no-explicit-any
  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: detectMime(refImageB64),
        data: stripBase64Prefix(refImageB64),
      },
    },
  ];

  if (subjectImageB64) {
    parts.push({
      inlineData: {
        mimeType: detectMime(subjectImageB64),
        data: stripBase64Prefix(subjectImageB64),
      },
    });
  }

  const requestBody = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 1.0,
    },
  });

  console.log(`[generate-creative] Calling API`, {
    model: GEMINI_MODEL,
    promptLength: prompt.length,
    partsCount: parts.length,
  });

  // Simple retry: same model, 2 attempts max
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`[generate-creative] Attempt ${attempt}/2, model: ${GEMINI_MODEL}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal: controller.signal,
      });

      if (resp.status === 429) {
        throw new Error("rate_limit: Muitas gerações simultâneas. Aguarde alguns segundos.");
      }

      const text = await resp.text();

      if (!resp.ok) {
        console.warn(`[generate-creative] Attempt ${attempt} HTTP ${resp.status}: ${text.slice(0, 200)}`);
        if (text.includes("SAFETY") || text.includes("blocked") || text.includes("BLOCK")) {
          throw new Error("content_blocked: Conteúdo bloqueado pelo filtro de segurança. Tente ajustar a referência ou instruções.");
        }
        lastError = `HTTP ${resp.status}: ${text.slice(0, 200)}`;
        // Don't retry 400 or 403
        if (resp.status === 400 || resp.status === 403) break;
        if (attempt === 1) await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const parsed = JSON.parse(text);

      console.log(`[generate-creative] Response OK`, {
        partsCount: parsed?.candidates?.[0]?.content?.parts?.length ?? 0,
        finishReason: parsed?.candidates?.[0]?.finishReason,
      });

      const finishReason = parsed?.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY") {
        throw new Error("content_blocked: Conteúdo bloqueado pelo filtro de segurança. Tente ajustar a referência ou instruções.");
      }

      const imageB64 = extractImageBase64(parsed);
      if (!imageB64) {
        console.warn(`[generate-creative] Attempt ${attempt} no image: ${JSON.stringify(parsed).slice(0, 300)}`);
        lastError = "no_image: Gemini não retornou imagem.";
        if (attempt === 1) await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const dataUri = `data:image/png;base64,${imageB64}`;
      const duration_ms = Date.now() - startedAt;
      console.log(`[generate-creative] OK — image ${Math.round(imageB64.length / 1024)}KB in ${Math.round(duration_ms / 1000)}s`);

      return { image: dataUri, model: GEMINI_MODEL, duration_ms };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if ((err as Error).name === "AbortError") {
        lastError = "timeout: Geração excedeu o tempo limite. Tente novamente.";
        console.warn(`[generate-creative] Attempt ${attempt} timed out`);
        if (attempt === 1) await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      // Don't retry content_blocked or rate_limit
      if (msg.startsWith("content_blocked:") || msg.startsWith("rate_limit:")) throw err;
      lastError = msg;
      console.warn(`[generate-creative] Attempt ${attempt} error: ${msg.slice(0, 200)}`);
      if (attempt === 1) await new Promise(r => setTimeout(r, 2000));
      continue;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastError || "no_image: Geração falhou. Tente novamente.");
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

    const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
    if (!apiKey) return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured." }, 500, cors);

    const hasSubject = Boolean(body.subject_image);
    const hasAnalysis = Boolean(body.analysis?.fullPrompt);
    // Protect removed_texts against undefined
    if (!body.removed_texts) body.removed_texts = [];

    console.log(`[generate-creative] Request received`, {
      hasReference: true,
      hasSubject,
      hasAnalysis,
      variation: body.variation ?? 30,
      format: body.format || "1:1",
      textsCount: body.active_texts?.length ?? body.text_replacements?.length ?? 0,
      removedTextsCount: body.removed_texts.length,
      model: GEMINI_MODEL,
    });

    const prompt = hasAnalysis ? buildAnalysisPrompt(body) : buildGenericPrompt(body);
    console.log(`[generate-creative] Prompt length: ${prompt.length}`);

    const result = await generateWithGemini(prompt, body.reference_image, body.subject_image || null, apiKey);

    return json({
      image: result.image,
      prompt_used: prompt,
      model: result.model,
      duration_ms: result.duration_ms,
      variation: body.variation ?? 30,
      format: body.format || "1:1",
      analysis_used: hasAnalysis,
    }, 200, cors);
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    console.error("[generate-creative] Error:", msg);

    // Friendly error responses
    if (msg.startsWith("content_blocked:")) {
      return json({ error: "content_blocked", details: msg.replace("content_blocked: ", "") }, 400, cors);
    }
    if (msg.startsWith("rate_limit:")) {
      return json({ error: "rate_limit", details: msg.replace("rate_limit: ", "") }, 429, cors);
    }
    if (msg.startsWith("timeout:")) {
      return json({ error: "timeout", details: msg.replace("timeout: ", "") }, 504, cors);
    }

    return json({ error: "generation_failed", details: msg.slice(0, 500) }, 502, cors);
  }
});
