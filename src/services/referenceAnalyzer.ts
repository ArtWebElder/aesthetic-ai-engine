// src/services/referenceAnalyzer.ts
// CREATYNG — Analisa imagem de referência com Gemini 2.5 Flash
// Extrai layout, cores, composição como JSON estruturado para construir prompt de geração.

import type { ReferenceAnalysis } from "@/types/preset";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) ?? "";
const ANALYSIS_MODEL = "gemini-2.5-flash";

export async function analyzeReference(
  referenceImage: string,
  subjectImage: string,
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): Promise<ReferenceAnalysis> {
  console.log("[ReferenceAnalyzer] Starting analysis...");
  console.log("[ReferenceAnalyzer] Model:", ANALYSIS_MODEL);
  console.log("[ReferenceAnalyzer] API key present:", Boolean(GEMINI_API_KEY), GEMINI_API_KEY ? `(${GEMINI_API_KEY.slice(0, 8)}...)` : "");
  console.log("[ReferenceAnalyzer] Reference image:", referenceImage ? `${referenceImage.slice(0, 30)}... (${referenceImage.length} chars)` : "EMPTY");
  console.log("[ReferenceAnalyzer] Subject image:", subjectImage ? `${subjectImage.slice(0, 30)}... (${subjectImage.length} chars)` : "EMPTY");
  console.log("[ReferenceAnalyzer] Texts:", JSON.stringify(texts));

  if (!GEMINI_API_KEY) {
    throw new Error("reference_analyzer_missing_key: VITE_GEMINI_API_KEY not set. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ANALYSIS_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const prompt = `You are an expert advertisement designer. Analyze this reference creative image in detail.

I want to recreate a similar creative using a different product (the second image is the product photo).

Return ONLY valid JSON (no markdown, no backticks):

{
  "layout": {
    "productPosition": "center|left|right|top|bottom",
    "productSize": "small|medium|large|full",
    "textPosition": "top|bottom|left|right|overlay-bottom|overlay-top",
    "hasPrice": true/false,
    "priceBadgeStyle": "description if hasPrice"
  },
  "style": {
    "mood": "vibrant|dark|minimal|luxurious|playful|professional|warm|cool",
    "lighting": "bright|moody|neon|natural|dramatic|studio|warm",
    "colorScheme": ["#hex1", "#hex2", "#hex3"],
    "backgroundType": "solid|gradient|scene|blurred|dark|pattern",
    "backgroundDescription": "detailed description of the background, ingredients, props, atmosphere"
  },
  "typography": {
    "headlineStyle": "bold-sans|condensed|display|elegant|handwritten",
    "headlineSize": "small|medium|large|extra-large",
    "headlineColor": "#hex",
    "ctaStyle": "button|badge|text-only|ribbon|pill|none"
  },
  "composition": {
    "description": "Complete description of how ALL elements are arranged. Be very specific about positions, sizes, overlaps, effects. This will be used to generate a new image.",
    "sceneElements": ["list all visible elements: ingredients, steam, sauce splash, leaves, etc"],
    "decorativeElements": ["shadows", "reflections", "bokeh", "particles", "glow", etc]
  }
}

Texts for the new creative:
- Headline: "${texts.headline}"
${texts.price ? `- Price: "${texts.price}"` : ""}
${texts.cta ? `- CTA: "${texts.cta}"` : ""}
${texts.contact ? `- Contact: "${texts.contact}"` : ""}`;

  const cleanRef = referenceImage.replace(/^data:image\/\w+;base64,/, "");
  const cleanSub = subjectImage.replace(/^data:image\/\w+;base64,/, "");

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: cleanRef } },
          { inline_data: { mime_type: "image/jpeg", data: cleanSub } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[ReferenceAnalyzer] Sending request to:", url.split("?")[0]);
  console.log("[ReferenceAnalyzer] Payload size (approx):", JSON.stringify(body).length, "bytes");

  if (!response.ok) {
    const err = await response.text();
    console.error("[ReferenceAnalyzer] Gemini HTTP error:", response.status, response.statusText);
    console.error("[ReferenceAnalyzer] Gemini error body:", err);
    throw new Error(`reference_analysis_failed: HTTP ${response.status} — ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  console.log("[ReferenceAnalyzer] Response candidates:", data.candidates?.length ?? 0);

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("[ReferenceAnalyzer] Empty response from Gemini:", JSON.stringify(data).slice(0, 500));
    throw new Error("reference_analysis_empty: Gemini returned no text content.");
  }

  const text = data.candidates[0].content.parts[0].text;
  console.log("[ReferenceAnalyzer] Raw response (full):", text);

  const parsed = extractJSON(text);
  if (parsed) {
    console.log("[ReferenceAnalyzer] Parsed OK:", parsed.style?.mood, parsed.layout?.productPosition);
    return parsed;
  }

  // ── Retry with stricter prompt and lower temperature ──
  console.warn("[ReferenceAnalyzer] First attempt parse failed — retrying with stricter prompt...");

  const retryBody = {
    contents: [
      {
        parts: [
          {
            text: `Return ONLY a JSON object. No text before or after. No markdown. No backticks. No explanation.

Analyze this reference advertisement image. The second image is the product photo.

JSON schema:
{"layout":{"productPosition":"center|left|right|top|bottom","productSize":"small|medium|large|full","textPosition":"top|bottom|left|right|overlay-bottom|overlay-top","hasPrice":false,"priceBadgeStyle":""},"style":{"mood":"","lighting":"","colorScheme":["#hex"],"backgroundType":"","backgroundDescription":""},"typography":{"headlineStyle":"","headlineSize":"","headlineColor":"#hex","ctaStyle":""},"composition":{"description":"","sceneElements":[],"decorativeElements":[]}}

Headline: "${texts.headline}"`,
          },
          { inline_data: { mime_type: "image/jpeg", data: cleanRef } },
          { inline_data: { mime_type: "image/jpeg", data: cleanSub } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  };

  const retryResp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(retryBody),
  });

  if (!retryResp.ok) {
    const errText = await retryResp.text();
    console.warn("[ReferenceAnalyzer] Retry HTTP error:", retryResp.status, errText.slice(0, 300));
    console.warn("[ReferenceAnalyzer] Returning fallback analysis.");
    return buildFallbackAnalysis(texts);
  }

  const retryData = await retryResp.json();
  const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!retryText) {
    console.error("[ReferenceAnalyzer] Retry returned no text:", JSON.stringify(retryData).slice(0, 500));
    throw new Error("reference_analysis_retry_empty: Gemini returned no text on retry.");
  }

  console.log("[ReferenceAnalyzer] Retry raw response:", retryText);

  const retryParsed = extractJSON(retryText);
  if (retryParsed) {
    console.log("[ReferenceAnalyzer] Retry parsed OK:", retryParsed.style?.mood, retryParsed.layout?.productPosition);
    return retryParsed;
  }

  console.warn("[ReferenceAnalyzer] Both attempts failed to produce valid JSON — returning fallback analysis.");
  console.warn("[ReferenceAnalyzer] Last raw text:", retryText.slice(0, 500));
  return buildFallbackAnalysis(texts);
}

/**
 * Fallback analysis when Gemini fails to return valid JSON.
 * Provides sensible defaults so the flow can continue.
 */
function buildFallbackAnalysis(
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): ReferenceAnalysis {
  console.warn("[ReferenceAnalyzer] Using fallback analysis — flow will continue with generic settings.");
  return {
    layout: {
      productPosition: "center",
      productSize: "large",
      textPosition: "bottom",
      hasPrice: Boolean(texts.price),
      priceBadgeStyle: texts.price ? "rounded pill" : "",
    },
    style: {
      mood: "professional",
      lighting: "studio",
      colorScheme: ["#1a1a2e", "#16213e", "#0f3460"],
      backgroundType: "gradient",
      backgroundDescription: "Professional dark gradient background with subtle light effects, clean and modern aesthetic suitable for product photography",
    },
    typography: {
      headlineStyle: "bold-sans",
      headlineSize: "large",
      headlineColor: "#FFFFFF",
      ctaStyle: texts.cta ? "pill" : "none",
    },
    composition: {
      description: "Product centered on a clean professional background with soft studio lighting and subtle shadow beneath",
      sceneElements: ["soft shadow", "ambient light"],
      decorativeElements: ["subtle gradient", "vignette"],
    },
  };
}

/**
 * Robustly extract and parse JSON from Gemini's response text.
 * Handles: markdown fences, text before/after JSON, comments, trailing commas.
 */
function extractJSON(raw: string): ReferenceAnalysis | null {
  // Step 1: Strip markdown code fences
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Step 2: Try direct parse first (cleanest case)
  try {
    return JSON.parse(text) as ReferenceAnalysis;
  } catch {
    // continue to extraction
  }

  // Step 3: Extract the outermost JSON object from any surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[ReferenceAnalyzer] No JSON object found in text:", text.slice(0, 300));
    return null;
  }

  text = jsonMatch[0];

  // Step 4: Clean common Gemini quirks
  // Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, "$1");
  // Remove single-line comments
  text = text.replace(/\/\/[^\n]*/g, "");

  try {
    return JSON.parse(text) as ReferenceAnalysis;
  } catch (err) {
    console.error("[ReferenceAnalyzer] JSON.parse failed after extraction:", err);
    console.error("[ReferenceAnalyzer] Extracted text:", text.slice(0, 400));
    return null;
  }
}

/**
 * Constrói o prompt de geração baseado na análise da referência.
 */
export function buildGenerationPrompt(
  analysis: ReferenceAnalysis,
  texts: { headline?: string; price?: string; cta?: string },
): string {
  const { style, composition, layout } = analysis;

  return `Professional product advertisement photo.

COMPOSITION: ${composition.description}

BACKGROUND: ${style.backgroundDescription}
MOOD: ${style.mood}, LIGHTING: ${style.lighting}
COLOR PALETTE: ${style.colorScheme.join(", ")}

PRODUCT: Place the product photo ${layout.productPosition}, ${layout.productSize} size.
SCENE ELEMENTS: ${composition.sceneElements.join(", ")}
DECORATIVE EFFECTS: ${composition.decorativeElements.join(", ")}

CRITICAL RULES:
- The product in the photo must be the EXACT product from the subject image
- Maintain the product's real appearance, colors, and details
- DO NOT add any text, typography, watermarks, or logos to the image
- The image should look like a professional product photography composition
- High quality, sharp focus on product, 8K detail`;
}
