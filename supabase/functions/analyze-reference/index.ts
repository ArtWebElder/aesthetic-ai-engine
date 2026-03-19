/// <reference lib="deno.ns" />

// CREATYNG — Edge Function: analyze-reference
// Analisa imagem de referência com Gemini Flash (cascading model fallback).
// Roda server-side para usar GEMINI_API_KEY correto (AI Studio key).

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin: string | null) {
  const allowOrigin = origin ?? "*";
  return {
    "access-control-allow-origin": allowOrigin === "null" ? "*" : allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    vary: "Origin",
  };
}

const ANALYSIS_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
];

const ANALYSIS_PROMPT = `You are an expert advertisement designer and art director. Analyze this reference creative/advertisement image in extreme detail.

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

interface AnalyzeBody {
  referenceImage: string;  // base64 (with or without data URI prefix)
  subjectImage: string;    // base64 (with or without data URI prefix)
  texts?: {
    headline?: string;
    price?: string;
    cta?: string;
    contact?: string;
  };
}

function extractJSON(raw: string): Record<string, unknown> | null {
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // continue to extraction
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[AnalyzeRef] No JSON object found in text:", text.slice(0, 300));
    return null;
  }

  text = jsonMatch[0];
  text = text.replace(/,\s*([}\]])/g, "$1");
  text = text.replace(/\/\/[^\n]*/g, "");

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (err) {
    console.error("[AnalyzeRef] JSON.parse failed:", err);
    return null;
  }
}

function normalizeAnalysis(
  raw: Record<string, unknown>,
  texts: { headline?: string; price?: string; cta?: string; contact?: string },
) {
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

function buildFallbackAnalysis(
  texts: { headline?: string; price?: string; cta?: string; contact?: string },
) {
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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed", details: "Use POST" }, 405, cors);
  }

  const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
  if (!apiKey) {
    console.error("[AnalyzeRef] GEMINI_API_KEY not set in Edge Function secrets");
    return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured server-side." }, 500, cors);
  }

  let body: AnalyzeBody;
  try {
    body = await req.json() as AnalyzeBody;
  } catch {
    return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
  }

  if (!body.referenceImage || !body.subjectImage) {
    return json({ error: "missing_images", details: "referenceImage and subjectImage are required." }, 400, cors);
  }

  const texts = body.texts || {};
  const cleanRef = body.referenceImage.replace(/^data:image\/\w+;base64,/, "");
  const cleanSub = body.subjectImage.replace(/^data:image\/\w+;base64,/, "");

  console.log("[AnalyzeRef] Starting analysis...");
  console.log("[AnalyzeRef] Models (cascade):", ANALYSIS_MODELS.join(", "));
  console.log("[AnalyzeRef] API key present:", Boolean(apiKey), apiKey ? `(${apiKey.slice(0, 8)}...)` : "");

  // Cascading model fallback
  for (const model of ANALYSIS_MODELS) {
    console.log(`[AnalyzeRef] Trying model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
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
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[AnalyzeRef] ${model} HTTP ${response.status}: ${err.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[AnalyzeRef] ${model} returned empty response`);
        continue;
      }

      console.log(`[AnalyzeRef] === FULL RAW RESPONSE ===`, text.slice(0, 500));

      const parsed = extractJSON(text);
      if (parsed) {
        const descLen = parsed.sceneDescription?.toString().length || 0;
        console.log(`[AnalyzeRef] ${model} parsed OK — sceneDescription: ${descLen} chars, mood: ${(parsed.style as Record<string, unknown>)?.mood}`);
        if (descLen < 50) {
          console.warn(`[AnalyzeRef] ${model} sceneDescription too short (${descLen} chars) — trying next model...`);
          continue;
        }
        const result = normalizeAnalysis(parsed, texts);
        console.log(`[AnalyzeRef] sceneDescription:`, result.sceneDescription.slice(0, 200));
        return json({ analysis: result }, 200, cors);
      }

      console.warn(`[AnalyzeRef] ${model} JSON parse failed — trying next model...`);
    } catch (err) {
      console.warn(`[AnalyzeRef] ${model} error:`, err);
      continue;
    }
  }

  console.warn("[AnalyzeRef] All models failed — returning fallback analysis.");
  return json({ analysis: buildFallbackAnalysis(texts), fallback: true }, 200, cors);
});
