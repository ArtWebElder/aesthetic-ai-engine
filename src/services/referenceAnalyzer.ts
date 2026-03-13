// src/services/referenceAnalyzer.ts
// CREATYNG — Analisa imagem de referência com Gemini 2.5 Pro
// Extrai layout, cores, composição como JSON estruturado para construir prompt de geração.

import type { ReferenceAnalysis } from "@/types/preset";

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) ?? "";
const ANALYSIS_MODEL = "gemini-2.5-pro-preview-06-05";

export async function analyzeReference(
  referenceImage: string,
  subjectImage: string,
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): Promise<ReferenceAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("reference_analyzer_missing_key: VITE_GEMINI_API_KEY not set.");
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
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[ReferenceAnalyzer] Gemini error:", err);
    throw new Error("reference_analysis_failed");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();

  return JSON.parse(clean) as ReferenceAnalysis;
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
