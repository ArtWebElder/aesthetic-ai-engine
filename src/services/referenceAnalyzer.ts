// src/services/referenceAnalyzer.ts
// CREATYNG — Analisa imagem de referência via Edge Function (analyze-reference).
// A análise roda server-side com GEMINI_API_KEY correto (AI Studio key).
// Frontend envia imagens via Supabase Edge Function (mesma abordagem do generateService.ts).

import type { ReferenceAnalysis } from "@/types/preset";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

export async function analyzeReference(
  referenceImage: string,
  subjectImage: string,
  texts: { headline: string; price?: string; cta?: string; contact?: string },
): Promise<ReferenceAnalysis> {
  console.log("[ReferenceAnalyzer] Starting analysis via Edge Function...");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[ReferenceAnalyzer] Supabase not configured — returning fallback.");
    return buildFallbackAnalysis(texts);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-reference`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        referenceImage,
        subjectImage,
        texts,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[ReferenceAnalyzer] Edge Function HTTP ${response.status}:`, errData);
      console.warn("[ReferenceAnalyzer] Returning fallback analysis.");
      return buildFallbackAnalysis(texts);
    }

    const data = await response.json();

    if (data.fallback) {
      console.warn("[ReferenceAnalyzer] Edge Function returned fallback (all models failed).");
    }

    const analysis = data.analysis as ReferenceAnalysis;
    console.log("[ReferenceAnalyzer] Analysis received:", {
      sceneDescription: analysis.sceneDescription?.slice(0, 200),
      mood: analysis.style?.mood,
      fallback: data.fallback || false,
    });

    return analysis;
  } catch (err) {
    console.warn("[ReferenceAnalyzer] Edge Function error:", err);
    console.warn("[ReferenceAnalyzer] Returning fallback analysis.");
    return buildFallbackAnalysis(texts);
  }
}

/**
 * Fallback analysis when Edge Function is unavailable.
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
