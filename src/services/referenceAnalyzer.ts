// src/services/referenceAnalyzer.ts
// CREATYNG — Analisa imagem de referência com Gemini Flash (cascading model fallback)
// Extrai layout, cores, composição como JSON estruturado para construir prompt de geração.

import type { ReferenceAnalysis } from "@/types/preset";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) ?? "";
const ANALYSIS_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
];

export async function analyzeReference(
  referenceImage: string,
  subjectImage: string,
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): Promise<ReferenceAnalysis> {
  console.log("[ReferenceAnalyzer] Starting analysis...");
  console.log("[ReferenceAnalyzer] Models (cascade):", ANALYSIS_MODELS.join(", "));
  console.log("[ReferenceAnalyzer] API key present:", Boolean(GEMINI_API_KEY), GEMINI_API_KEY ? `(${GEMINI_API_KEY.slice(0, 8)}...)` : "");
  console.log("[ReferenceAnalyzer] Reference image:", referenceImage ? `${referenceImage.slice(0, 30)}... (${referenceImage.length} chars)` : "EMPTY");
  console.log("[ReferenceAnalyzer] Subject image:", subjectImage ? `${subjectImage.slice(0, 30)}... (${subjectImage.length} chars)` : "EMPTY");
  console.log("[ReferenceAnalyzer] Texts:", JSON.stringify(texts));

  if (!GEMINI_API_KEY) {
    throw new Error("reference_analyzer_missing_key: VITE_GEMINI_API_KEY not set. Add VITE_GEMINI_API_KEY to your .env file.");
  }

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

  // ── Cascading model fallback: try each model in order ──
  for (const model of ANALYSIS_MODELS) {
    console.log(`[ReferenceAnalyzer] Trying model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    // ── Attempt 1: full prompt, temp 0.2 ──
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

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[ReferenceAnalyzer] ${model} HTTP ${response.status}: ${err.slice(0, 200)}`);
        continue; // try next model
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[ReferenceAnalyzer] ${model} returned empty response`);
        continue;
      }

      console.log(`[ReferenceAnalyzer] ${model} raw response:`, text.slice(0, 200));
      const parsed = extractJSON(text);
      if (parsed) {
        console.log(`[ReferenceAnalyzer] ${model} parsed OK:`, parsed.style?.mood, parsed.layout?.productPosition);
        return parsed;
      }

      // ── Attempt 2: stricter prompt, temp 0.1 ──
      console.warn(`[ReferenceAnalyzer] ${model} parse failed — retrying with stricter prompt...`);
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
        console.warn(`[ReferenceAnalyzer] ${model} retry HTTP ${retryResp.status}`);
        continue; // try next model
      }

      const retryData = await retryResp.json();
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (retryText) {
        const retryParsed = extractJSON(retryText);
        if (retryParsed) {
          console.log(`[ReferenceAnalyzer] ${model} retry parsed OK:`, retryParsed.style?.mood);
          return retryParsed;
        }
      }

      console.warn(`[ReferenceAnalyzer] ${model} both attempts failed to parse — trying next model...`);
    } catch (err) {
      console.warn(`[ReferenceAnalyzer] ${model} error:`, err);
      continue; // try next model
    }
  }

  // ── All models exhausted — return fallback ──
  console.warn("[ReferenceAnalyzer] All models failed — returning fallback analysis.");
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
