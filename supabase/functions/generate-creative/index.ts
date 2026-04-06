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
  logo_base64?: string;
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
  // Build set of removed texts for server-side double-protection
  const removedSet = new Set(
    (body.removed_texts || []).map(t => t.toLowerCase().trim())
  );

  function isRemoved(content: string): boolean {
    return removedSet.size > 0 && removedSet.has(content.toLowerCase().trim());
  }

  // If active_texts is provided (user's current text list, excluding removed), use it directly
  if (body.active_texts && body.active_texts.length > 0) {
    return body.active_texts
      .filter(t => t.content && t.content.trim() && !isRemoved(t.content))
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
    return analysisTexts
      .filter(t => !isRemoved(t.content))
      .map(t => ({
        type: t.type,
        text: repMap.get(t.content) || t.content,
      }));
  }
  return replacements
    .filter(r => r.replacement && !isRemoved(r.replacement))
    .map(r => ({ type: "text", text: r.replacement }));
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
9. TEXT QUALITY — CRITICAL: ALL text MUST be PIXEL-PERFECT, SHARP, and CRISP. This is NON-NEGOTIABLE. Small text (phone numbers, addresses, URLs, contact info, footer text) requires EXTRA ATTENTION: render each character clearly and distinctly. Small text must NEVER appear blurry, smeared, melted, distorted, or illegible. If in doubt, make small text SLIGHTLY LARGER rather than risk illegibility. Every single character must be individually distinguishable.
10. PORTUGUESE ACCENTS: Texts may contain Brazilian Portuguese. Reproduce special characters EXACTLY: ç (cedilha curves right), ã/õ (tilde ~), é/ê/á/â/ó/ô/ú (accented vowels). Copy characters exactly from the text list — do NOT approximate or replace accents.

Generate the image directly. Do not use function calls or tools.`
  );

  // ── LAYER 2: Variation level ──
  if (variation <= 5) {
    sections.push(
      `VARIATION: ${variation}% — EXACT CLONE MODE
Reproduce the reference layout as EXACTLY as possible. Near-identical clone.
Keep the EXACT same layout, positioning, proportions, sizes, background style, shapes, gradients.
The ONLY changes: the subject (if provided), the specified texts, and any overridden colors.
Clone everything EXCEPT watermarks (remove those).
DO NOT remove any text zone. ALL texts listed below MUST appear.
SMALL TEXT FIDELITY: Pay EXTREME attention to small/footer text (phone, address, contact info). Each character must be sharp and individually readable. Clone the exact font size, weight, and spacing of small text from the reference. Do NOT let small text become blurry or merge together.`
    );
  } else if (variation <= 20) {
    sections.push(
      `VARIATION: ${variation}% — MINIMAL VARIATION
Start from the EXACT reference layout. Only TINY, SUBTLE adjustments allowed.
Keep the SAME layout structure, grid, element hierarchy, background shapes.
Keep ALL elements in approximately the SAME positions.
Allowed: very slight size (±5%), minor spacing tweaks.
DO NOT remove, add, or significantly reposition any elements.
DO NOT remove any text. ALL texts listed below MUST appear in the image.`
    );
  } else if (variation <= 50) {
    sections.push(
      `VARIATION: ${variation}% — MODERATE VARIATION
Use the reference as a STRONG guide with moderate creative adjustments.
Keep the same layout type, element hierarchy, mood, visual style, and quality.
You may adjust sizes (±15%), spacing, decorative styles.
ALL texts listed below MUST still appear in the image.`
    );
  } else if (variation <= 80) {
    sections.push(
      `VARIATION: ${variation}% — HIGH VARIATION — CREATIVE REDESIGN
You have SIGNIFICANT creative freedom. The reference is LOOSE INSPIRATION only.
- Create a NEW, DIFFERENT layout arrangement. DO NOT copy the reference layout.
- Use a DIFFERENT composition style (if reference is centered, try asymmetric; if cards, try full-bleed).
- Change decorative elements, background style, and visual effects.
- Keep the same advertising purpose and professional quality.
- The result should look like a DIFFERENT designer's take on the same brief.
ALL texts listed below MUST still appear in the image.`
    );
  } else {
    sections.push(
      `VARIATION: ${variation}% — FULL CREATIVE FREEDOM — COMPLETELY NEW DESIGN
IGNORE the reference layout entirely. Create something COMPLETELY NEW and ORIGINAL.
- Design from scratch as if you never saw the reference.
- Use a completely different layout, composition, typography style, and color distribution.
- Only carry the advertising PURPOSE (what it's selling) from the reference.
- Create an original, professional, eye-catching advertising design.
ALL texts listed below MUST still appear in the image.`
    );
  }
  sections.push(`MANDATORY TEXT RULE: Every text listed in the TEXTS section below MUST appear in the generated image, at ANY variation level. Never omit, skip, or remove any listed text. Text quality must be sharp and readable.`);

  // ── LAYER 2b: Layout & style info from analysis (only structure, NOT content) ──
  // When user changed colors, patch style description to avoid conflicting color instructions
  const userColors = body.color_palette || [];
  const analysisColors = (analysis?.colors as string[]) || [];
  const hasColorOverride = userColors.length > 0 && colorsChanged(analysisColors, userColors);

  if (analysis) {
    const layoutDesc = analysis.layout || "";
    let styleDesc = analysis.style || "";

    // Patch: replace original color references in style description with user's new colors
    if (hasColorOverride && styleDesc) {
      for (let i = 0; i < analysisColors.length && i < userColors.length; i++) {
        if (analysisColors[i] && userColors[i]) {
          styleDesc = styleDesc.replace(new RegExp(analysisColors[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), userColors[i]);
        }
      }
    }

    if (layoutDesc || styleDesc) {
      sections.push(
        `REFERENCE LAYOUT & STYLE (clone this structure, NOT the content):\n${layoutDesc ? `Layout: ${layoutDesc}` : ""}${layoutDesc && styleDesc ? "\n" : ""}${styleDesc ? `Style: ${styleDesc}` : ""}`
      );
    }
  }

  // ── LAYER 3: Texts (always present if there are texts) ──
  const allTexts = resolveAllTexts(body);
  const removedTexts = body.removed_texts || [];

  if (allTexts.length > 0) {
    const textLines = allTexts.map(t => `- ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}: "${t.text}"`).join("\n");
    let textSection = `TEXTS TO INCLUDE IN THE IMAGE — THIS IS THE COMPLETE AND FINAL LIST:\nYou MUST include ALL of the following texts, exactly as written:\n${textLines}\n\nABSOLUTE RULE: The image must contain ONLY the texts listed above and NOTHING ELSE. Any text visible in the reference image that is NOT in this list must be COMPLETELY ABSENT from your output. Do NOT read, copy, or reproduce any text from the reference image — use ONLY the list above.`;

    // Explicitly list removed texts so the AI knows to exclude them
    if (removedTexts.length > 0) {
      const removedLines = removedTexts.map(t => `- "${t}"`).join("\n");
      textSection += `\n\nTEXTS EXPLICITLY REMOVED BY THE USER — DO NOT INCLUDE THESE:\n${removedLines}\nThese texts were intentionally deleted by the user. Even if they appear in the reference image, you MUST NOT reproduce them.`;
    }

    textSection += `\n\nTEXT RENDERING QUALITY — STRICTLY ENFORCED:\n- Large texts (titles, headings): Bold, prominent, perfectly legible.\n- Medium texts (prices, labels): Clear, sharp and readable with correct formatting.\n- Small texts (phone, address, URL, contact info, footer): THIS IS THE HIGHEST PRIORITY FOR TEXT QUALITY. Each individual character MUST be perfectly formed and distinguishable. Rules for small text:\n  * Render at MINIMUM 14px equivalent size — if the reference has smaller text, INCREASE the size slightly\n  * Each letter, number, and symbol must be individually sharp and distinct\n  * NEVER allow characters to blur together, melt, or become smeared\n  * Maintain proper spacing between characters (kerning)\n  * Phone numbers: each digit must be perfectly clear (e.g., "83 0000-0000" — every digit distinct)\n  * Addresses: every word must be fully readable, including accented characters\n  * If you cannot render small text clearly at the reference size, make it 10-20% LARGER\n\nACCENT WARNING: If texts contain Portuguese characters (ç, ã, õ, é, á, ê, â, ó, ô, ú), reproduce them EXACTLY. Wrong accents = wrong spelling in Portuguese.`;

    sections.push(textSection);
  } else {
    sections.push("Do NOT include any text in the generated image. Even if the reference image contains text, generate the image with NO text at all.");
  }

  // ── LAYER 4: Colors (inline mapping — zero conflicting instructions) ──
  if (hasColorOverride) {
    const labels = ["Background/Primary", "Accent/Secondary", "Highlight/Tertiary", "Text primary", "Text secondary"];
    const mappingLines: string[] = [];
    for (let i = 0; i < userColors.length && i < 5; i++) {
      const orig = analysisColors[i] || "auto";
      const label = labels[i] || `Color ${i + 1}`;
      if (userColors[i]) {
        mappingLines.push(`- ${label}: ${orig} → ${userColors[i]}`);
      }
    }
    sections.push(
      `COLOR MAPPING — Replace original colors with these new colors:\n${mappingLines.join("\n")}\n\nApply these replacements to ALL elements: backgrounds, shapes, cards, text, icons, borders, buttons, gradients, decorative elements. No element should keep the original color if a replacement is specified above.\nIMPORTANT: ALL colors listed above MUST appear somewhere in the generated image. If there are more colors than natural elements, apply remaining colors to decorative shapes, gradients, shadows, borders, or background accents.`
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

  // ── LAYER 5b: Logo (conditional) ──
  if (body.logo_base64) {
    const logoImageIdx = body.subject_image ? 4 : 3;
    sections.push(
      `LOGO INSERTION: Image ${logoImageIdx} is the brand logo. Find any logo placeholder in the reference (text like "logoaqui", "logo", generic logo icon, or any branding element) and replace it with this logo. Place the logo in the same position and approximate size as the original placeholder. The logo has transparent background — render it clearly. If there is no logo placeholder, place the logo in an appropriate corner or header area.`
    );
  }

  // ── LAYER 6: Format with layout hints ──
  const userFormat = body.format || "1:1";
  if (userFormat === "9:16") {
    sections.push(`OUTPUT: Generate this image in 9:16 vertical (portrait) aspect ratio.\nIMPORTANT FOR VERTICAL FORMAT: Stack elements vertically. Title at top, main subject in center taking most space, info/price and contact at bottom. Use the full vertical space.`);
  } else if (userFormat === "16:9") {
    sections.push(`OUTPUT: Generate this image in 16:9 horizontal (landscape) aspect ratio.\nIMPORTANT FOR HORIZONTAL FORMAT: Place subject on one side, text/info on the other. Use the full width.`);
  } else if (userFormat === "4:5") {
    sections.push(`OUTPUT: Generate this image in 4:5 vertical aspect ratio. Similar to 1:1 but taller. Maintain the reference layout with slight vertical adjustment.`);
  } else {
    sections.push(`OUTPUT: Generate this image in ${userFormat} aspect ratio at high resolution.`);
  }

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
  logoImageB64: string | null,
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

  if (logoImageB64) {
    parts.push({
      inlineData: {
        mimeType: detectMime(logoImageB64),
        data: stripBase64Prefix(logoImageB64),
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
      activeTextsCount: body.active_texts?.length ?? 0,
      removedTextsCount: body.removed_texts?.length ?? 0,
      textReplacementsCount: body.text_replacements?.length ?? 0,
      model: GEMINI_MODEL,
    });
    if (body.active_texts) console.log(`[generate-creative] Active texts:`, JSON.stringify(body.active_texts));
    if (body.removed_texts?.length) console.log(`[generate-creative] Removed texts:`, JSON.stringify(body.removed_texts));
    const v = body.variation ?? 30;
    console.log(`[generate-creative] Variation block: ${v <= 5 ? 'EXACT' : v <= 20 ? 'MINIMAL' : v <= 50 ? 'MODERATE' : v <= 80 ? 'HIGH' : 'FULL'} (${v}%)`);

    const prompt = buildPrompt(body);
    console.log(`[generate-creative] Prompt length: ${prompt.length}`);
    console.log(`[generate-creative] ===== FULL PROMPT =====`);
    console.log(prompt);
    console.log(`[generate-creative] ===== END PROMPT =====`);

    const result = await generateWithGemini(prompt, body.reference_image, body.subject_image || null, body.logo_base64 || null, apiKey);

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
