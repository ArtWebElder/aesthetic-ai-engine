// src/services/referenceAnalyzer.ts
// CREATYNG — Analisa imagem de referência com Gemini Flash (cascading model fallback).
// Abordagem: pede descrição verbal RICA + JSON curto com essenciais.
// A descrição verbal vira o prompt de geração (muito mais detalhada que campos JSON).

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

  if (!GEMINI_API_KEY) {
    throw new Error("reference_analyzer_missing_key: VITE_GEMINI_API_KEY not set. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const prompt = `You are an expert advertisement designer and art director. Analyze this reference creative/advertisement image in extreme detail.

The FIRST image is the REFERENCE (the style/layout to copy).
The SECOND image is the PRODUCT (the subject that will be placed in the new creative).

I need TWO things from you. Return ONLY valid JSON (no markdown, no backticks):

{
  "sceneDescription": "Write 4-6 detailed sentences describing EVERYTHING you see in the reference image. Describe: the exact background (colors, textures, gradients, patterns), the lighting setup (direction, color temperature, intensity, shadows), the mood and atmosphere (particles, bokeh, fog, glow, reflections), how the product/subject is positioned and at what scale, any props or decorative elements (ingredients, splashes, leaves, steam, sparkles), the camera angle and depth of field, and any special visual effects. Be EXTREMELY specific — this description will be used as-is to generate a new image. Do NOT be generic. Do NOT say 'professional lighting' — say 'warm key light from upper-left with orange rim light and soft fill from right, creating dramatic shadows'. Do NOT say 'dark background' — say 'deep navy-to-black radial gradient with subtle purple undertones and faint bokeh circles in the upper third'.",

  "style": {
    "mood": "the single most dominant mood word (e.g. luxurious, vibrant, dramatic, cozy, energetic, dark, minimal, warm, neon, editorial)",
    "colorScheme": ["#hex1", "#hex2", "#hex3"],
    "backgroundDescription": "2-3 sentences describing ONLY the background in detail — what would remain if you removed the product"
  },

  "layout": {
    "productPosition": "center|left|right|top|bottom",
    "productSize": "small|medium|large|full",
    "textPosition": "top|bottom|left|right|overlay-bottom|overlay-top"
  },

  "textPlacement": {
    "primaryArea": "bottom-center|bottom-left|bottom-right|top-center|center",
    "backgroundDarknessInTextArea": "light|medium|dark",
    "suggestedTextColor": "#hex"
  }
}

IMPORTANT — sceneDescription guidelines:
- Write as if you're briefing a photographer: "Low-angle shot of [product] on a glossy black surface. Warm amber key light from the left creates a long shadow. Background is a deep teal-to-midnight gradient with out-of-focus city lights creating golden bokeh. Smoke wisps curl up from behind the product. The surface has water droplets catching the light."
- Mention SPECIFIC colors (not "colorful" — say "vibrant orange, electric blue, and lime green")
- Mention SPECIFIC textures (not "textured surface" — say "rough concrete with visible aggregate and hairline cracks")
- Mention SPECIFIC lighting (not "dramatic lighting" — say "single hard spotlight from above-right creating a sharp circular pool of light")
- If there are food elements: describe them precisely (melting cheese strings, caramelized onion rings, fresh basil leaves, sesame seeds)
- If there are effects: describe them precisely (golden glitter particles suspended in air, lens flare from upper-left, wet surface reflections)`;

  const cleanRef = referenceImage.replace(/^data:image\/\w+;base64,/, "");
  const cleanSub = subjectImage.replace(/^data:image\/\w+;base64,/, "");

  // ── Cascading model fallback: try each model in order ──
  for (const model of ANALYSIS_MODELS) {
    console.log(`[ReferenceAnalyzer] Trying model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

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
        temperature: 0.4,
        maxOutputTokens: 3000,
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
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[ReferenceAnalyzer] ${model} returned empty response`);
        continue;
      }

      console.log(`[ReferenceAnalyzer] === FULL RAW RESPONSE ===`, text);

      const parsed = extractJSON(text);
      if (parsed) {
        // Validate the sceneDescription is actually rich
        const descLen = parsed.sceneDescription?.length || 0;
        console.log(`[ReferenceAnalyzer] ${model} parsed OK — sceneDescription: ${descLen} chars, mood: ${parsed.style?.mood}`);
        if (descLen < 50) {
          console.warn(`[ReferenceAnalyzer] ${model} sceneDescription too short (${descLen} chars) — trying next model...`);
          continue;
        }
        const result = normalizeAnalysis(parsed, texts);
        console.log(`[ReferenceAnalyzer] sceneDescription:`, result.sceneDescription);
        return result;
      }

      console.warn(`[ReferenceAnalyzer] ${model} JSON parse failed — trying next model...`);
    } catch (err) {
      console.warn(`[ReferenceAnalyzer] ${model} error:`, err);
      continue;
    }
  }

  console.warn("[ReferenceAnalyzer] All models failed — returning fallback analysis.");
  return buildFallbackAnalysis(texts);
}

/**
 * Normalizes the raw parsed JSON into a full ReferenceAnalysis,
 * filling in any missing fields with sensible defaults.
 */
function normalizeAnalysis(
  raw: Record<string, unknown>,
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): ReferenceAnalysis {
  const style = (raw.style || {}) as Record<string, unknown>;
  const layout = (raw.layout || {}) as Record<string, unknown>;
  const tp = (raw.textPlacement || {}) as Record<string, unknown>;

  return {
    sceneDescription: (raw.sceneDescription as string) || '',
    layout: {
      productPosition: (layout.productPosition as string) || 'center',
      productSize: (layout.productSize as string) || 'large',
      textPosition: (layout.textPosition as string) || 'bottom',
      hasPrice: Boolean(texts.price),
      priceBadgeStyle: texts.price ? 'rounded pill' : '',
    },
    style: {
      mood: (style.mood as string) || 'professional',
      lighting: 'studio',
      colorScheme: (style.colorScheme as string[]) || ['#1a1a2e', '#16213e', '#0f3460'],
      backgroundType: 'scene',
      backgroundDescription: (style.backgroundDescription as string) || '',
    },
    typography: {
      headlineStyle: 'bold-sans',
      headlineSize: 'large',
      headlineColor: (tp.suggestedTextColor as string) || '#FFFFFF',
      ctaStyle: texts.cta ? 'pill' : 'none',
    },
    composition: {
      description: (raw.sceneDescription as string) || '',
      sceneElements: [],
      decorativeElements: [],
    },
    textPlacement: {
      primaryArea: (tp.primaryArea as string) || 'bottom-center',
      availableHeight: (tp.availableHeight as number) || 30,
      backgroundDarknessInTextArea: (tp.backgroundDarknessInTextArea as string) || 'dark',
      suggestedTextColor: (tp.suggestedTextColor as string) || '#FFFFFF',
    },
  };
}

/**
 * Fallback analysis when all Gemini models fail.
 */
function buildFallbackAnalysis(
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): ReferenceAnalysis {
  console.warn("[ReferenceAnalyzer] Using fallback analysis — flow will continue with generic settings.");
  return {
    sceneDescription: "Professional product photography on a clean dark gradient background. Soft studio lighting from above with gentle fill light. The product is centered and prominent, with subtle shadow beneath. Clean, modern aesthetic suitable for e-commerce or social media advertising.",
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
      backgroundDescription: "Professional dark gradient background transitioning from deep navy at the top to near-black at the bottom, with subtle blue-purple undertones and faint ambient light creating a clean, modern aesthetic.",
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
    textPlacement: {
      primaryArea: "bottom-center",
      availableHeight: 30,
      backgroundDarknessInTextArea: "dark",
      suggestedTextColor: "#FFFFFF",
    },
  };
}

/**
 * Robustly extract and parse JSON from Gemini's response text.
 */
function extractJSON(raw: string): Record<string, unknown> | null {
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // continue to extraction
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[ReferenceAnalyzer] No JSON object found in text:", text.slice(0, 300));
    return null;
  }

  text = jsonMatch[0];
  text = text.replace(/,\s*([}\]])/g, "$1");
  text = text.replace(/\/\/[^\n]*/g, "");

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (err) {
    console.error("[ReferenceAnalyzer] JSON.parse failed:", err);
    console.error("[ReferenceAnalyzer] Extracted text:", text.slice(0, 400));
    return null;
  }
}

/**
 * Constrói o prompt de geração baseado na análise da referência.
 * Usa sceneDescription (descrição verbal rica) como base principal.
 */
export function buildGenerationPrompt(
  analysis: ReferenceAnalysis,
  texts: { headline?: string; price?: string; cta?: string },
): string {
  const { style, layout } = analysis;

  // Use sceneDescription as the core — it's the richest part
  const scene = analysis.sceneDescription || analysis.composition?.description || '';

  return `Professional product advertisement photo.

SCENE (copy this style exactly):
${scene}

${style.backgroundDescription ? `BACKGROUND DETAILS: ${style.backgroundDescription}` : ''}
MOOD: ${style.mood}
COLOR PALETTE: ${style.colorScheme.join(", ")}

PRODUCT PLACEMENT:
- Place the product/subject ${layout.productPosition}, ${layout.productSize} size
- The product must be the EXACT product from the subject image
- Maintain the product's real appearance, colors, shape, and details
- Integrate naturally with proper lighting, shadows, and reflections

CRITICAL RULES:
- DO NOT add any text, typography, watermarks, or logos to the image
- The image should look like a professional product photography composition
- Ultra high quality, sharp focus on product, 8K detail
- Leave the bottom 25-30% slightly darker/cleaner for text overlay`;
}
