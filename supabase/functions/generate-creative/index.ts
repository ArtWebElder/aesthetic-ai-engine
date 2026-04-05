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

function buildPrompt(body: GenerateBody): string {
  const analysis = body.analysis;
  const variation = Math.max(0, Math.min(100, body.variation ?? 30));
  const sections: string[] = [];

  // ── LAYER 1: Base instruction (always present) ──
  sections.push(
    `You are a professional advertising creative cloner. Your task is to CLONE the visual template of the reference image, replacing specific content while keeping the overall design structure.

CRITICAL RULES:
1. CLONE the template structure: Keep the EXACT same layout grid, element positioning, background shapes, decorative elements, and visual hierarchy from the reference image.
2. REPLACE the main subject: Swap the main product/person in the reference with the provided subject photo (if given). Place it in the SAME position and approximate size as the original.
3. USE ONLY the texts provided below. Do NOT copy any text from the reference image.
4. The output must look like a PROFESSIONAL advertisement ready for social media.
5. Do NOT add elements that don't exist in the reference (no extra decorations, shapes, or visual elements).
6. MAINTAIN the same visual style: if the reference has geometric shapes, keep geometric shapes. If organic blobs, keep organic blobs. If gradients, keep gradients.
7. Do NOT reproduce any watermarks, brand logos, or stock photo marks from the reference.
8. WATERMARKS: The reference image may contain watermarks (semi-transparent text/logos repeated across the image, typically from stock image sites like Designi, Freepik, Shutterstock, Adobe Stock, etc). You MUST completely IGNORE and REMOVE all watermarks. The generated image must be CLEAN with NO watermarks whatsoever. Do not reproduce any semi-transparent diagonal text overlays.

Generate the image directly. Do not use function calls or tools.`
  );

  // ── LAYER 2: Variation level (conditional) ──
  if (variation <= 5) {
    sections.push(
      `VARIATION: 0% — EXACT CLONE MODE
Reproduce the reference layout PIXEL-PERFECT. Same positions, sizes, proportions.
Keep the EXACT same background style, shapes, gradients, and decorative elements.
Keep the EXACT same color scheme unless specific colors are overridden below.
The ONLY differences: the subject (if provided), the texts, and any overridden colors.
This must look like the SAME template with different content plugged in.
IGNORE any watermarks in the reference. Clone everything EXCEPT watermarks.`
    );
  } else if (variation <= 30) {
    sections.push(
      `VARIATION: ${variation}% — SLIGHT VARIATION
Start from the exact reference layout and make SMALL creative adjustments.
Keep the same overall structure, grid, and element positions.
You may slightly adjust: element sizes (±10%), spacing, decorative element styles.
Do NOT change the fundamental layout or add/remove major elements.`
    );
  } else if (variation <= 70) {
    sections.push(
      `VARIATION: ${variation}% — MODERATE VARIATION
Use the reference as strong INSPIRATION but allow creative freedom.
Keep the same type of layout (centered stays centered, split stays split).
You may rearrange elements, change sizes, adjust the visual style.
Keep the same mood and professional quality.`
    );
  } else {
    sections.push(
      `VARIATION: ${variation}% — HIGH VARIATION
Use the reference only as loose inspiration for the overall mood.
Create a fresh layout while maintaining the same advertising goal.
Full creative freedom on layout, composition, and style.`
    );
  }

  // ── LAYER 2b: Layout & style info from analysis (only structure, NOT content) ──
  if (analysis) {
    const layoutDesc = analysis.layout || "";
    const styleDesc = analysis.style || "";
    if (layoutDesc || styleDesc) {
      sections.push(
        `REFERENCE LAYOUT & STYLE (clone this structure, NOT the content):\n${layoutDesc ? `Layout: ${layoutDesc}` : ""}${layoutDesc && styleDesc ? "\n" : ""}${styleDesc ? `Style: ${styleDesc}` : ""}`
      );
    }
  }

  // ── LAYER 3: Texts (always present if there are texts) ──
  const allTexts = resolveAllTexts(body);
  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => `- ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}: "${t.text}"`).join("\n");
    sections.push(
      `TEXTS TO INCLUDE IN THE IMAGE (use ONLY these, NO other text):\n${textLines}\nAny text visible in the reference that is NOT listed above must be COMPLETELY ABSENT.`
    );
  } else {
    sections.push("Do NOT include any text in the generated image.");
  }

  // ── LAYER 4: Colors (conditional — only if user changed colors) ──
  const userColors = body.color_palette || [];
  if (userColors.length > 0 && (!analysis || colorsChanged(analysis.colors, userColors))) {
    const labels = ["Primary", "Secondary", "Accent", "Text primary", "Text secondary"];
    const colorLines = userColors.slice(0, 5).map((c, i) => `- ${labels[i] || `Color ${i + 1}`}: ${c}`).join("\n");
    sections.push(
      `COLOR OVERRIDE: Use these specific colors instead of the reference colors:\n${colorLines}\nThese colors are MANDATORY. Replace ALL original colors with these.`
    );
  }

  // ── LAYER 5: Subject (conditional) ──
  if (body.subject_image) {
    sections.push(
      `SUBJECT REPLACEMENT: Replace the main product/person in the reference with the provided subject photo.
Place it in the SAME position as the original main element. Maintain approximately the SAME size.
The subject must be the focal point, just like in the reference. Keep it realistic.`
    );
  }

  // ── LAYER 6: Format ──
  const userFormat = body.format || "1:1";
  sections.push(`OUTPUT: Generate this image in ${userFormat} aspect ratio at high resolution.`);

  // ── LAYER 7: Extra instructions (if any) ──
  if (body.extra_instructions?.trim()) {
    sections.push(`ADDITIONAL USER INSTRUCTIONS: ${body.extra_instructions.trim()}`);
  }

  return sections.join("\n\n");
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
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
    },
    toolConfig: {
      functionCallingConfig: {
        mode: "NONE",
      },
    },
  });

  const parsedBody = JSON.parse(requestBody);
  console.log(`[generate-creative] Calling API`, {
    model: GEMINI_MODEL,
    promptLength: prompt.length,
    partsCount: parts.length,
    bodyKeys: Object.keys(parsedBody),
    hasToolConfig: !!parsedBody.toolConfig,
    functionCallingMode: parsedBody.toolConfig?.functionCallingConfig?.mode,
    responseModalities: parsedBody.generationConfig?.responseModalities,
  });

  // Simple retry: same model, 3 attempts max (MALFORMED_FUNCTION_CALL is intermittent)
  const MAX_ATTEMPTS = 3;
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[generate-creative] Attempt ${attempt}/${MAX_ATTEMPTS}, model: ${GEMINI_MODEL}`);

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
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 3000));
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

      // MALFORMED_FUNCTION_CALL: model tried to use internal tool instead of generating inline
      if (finishReason === "MALFORMED_FUNCTION_CALL") {
        const finishMsg = parsed?.candidates?.[0]?.finishMessage ?? "";
        console.warn(`[generate-creative] Attempt ${attempt} MALFORMED_FUNCTION_CALL: ${String(finishMsg).slice(0, 200)}`);
        lastError = "no_image: Modelo tentou function call ao invés de gerar imagem.";
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      // Log unexpected finishReason
      if (finishReason && finishReason !== "STOP") {
        console.warn(`[generate-creative] Attempt ${attempt} unexpected finishReason: ${finishReason}`, {
          finishMessage: String(parsed?.candidates?.[0]?.finishMessage ?? "").slice(0, 300),
        });
      }

      const imageB64 = extractImageBase64(parsed);
      if (!imageB64) {
        console.warn(`[generate-creative] Attempt ${attempt} no image: ${JSON.stringify(parsed).slice(0, 300)}`);
        lastError = "no_image: Gemini não retornou imagem.";
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 3000));
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
        if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 3000));
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
    const hasAnalysis = Boolean(body.analysis);
    if (!body.removed_texts) body.removed_texts = [];

    console.log(`[generate-creative] Request received`, {
      hasSubject,
      hasAnalysis,
      variation: body.variation ?? 30,
      format: body.format || "1:1",
      textsCount: body.active_texts?.length ?? body.text_replacements?.length ?? 0,
      model: GEMINI_MODEL,
    });

    const prompt = buildPrompt(body);
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
