/// <reference lib="deno.ns" />

// CREATYNG — Edge Function: analyze-composition
// Analisa imagem gerada com Gemini Vision e gera instruções de composição tipográfica.
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

const COMPOSITION_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

interface CompositionBody {
  generatedImageBase64: string;
  copyData: {
    headline: string;
    subheadline?: string;
    priceFormatted: string;
    priceBadgeText?: string;
    cta: string;
    tagline?: string;
  };
  referenceAnalysis?: Record<string, unknown>;
  canvasWidth: number;
  canvasHeight: number;
}

function buildCompositionPrompt(body: CompositionBody): string {
  const { copyData, canvasWidth, canvasHeight, referenceAnalysis } = body;
  const style = (referenceAnalysis?.style || {}) as Record<string, unknown>;
  const mood = (style.mood as string) || "professional";

  return `You are a senior art director analyzing a generated image to decide the typographic composition.

Analyze the image and determine:
1. Where is the main subject (product)?
2. Which areas have empty space or less important background?
3. What are the dominant colors and overall luminosity?
4. What is the best position for a text block that does NOT obstruct the subject?

Based on this, generate EXACT positioning and style instructions for:
- Headline: "${copyData.headline}"
${copyData.subheadline ? `- Subheadline: "${copyData.subheadline}"` : "- Subheadline: (none)"}
- Price: "${copyData.priceFormatted}"${copyData.priceBadgeText ? ` (badge text: "${copyData.priceBadgeText}")` : ""}
- CTA: "${copyData.cta}"

Canvas: ${canvasWidth}x${canvasHeight}px
Mood/tone: ${mood}

Composition rules:
- Text MUST NEVER cover the main subject
- Visual hierarchy: Headline > Price > CTA > Subheadline
- Text colors MUST have WCAG AA minimum contrast with the region where they'll be placed
- If background is light, use dark text (and vice versa)
- If contrast is insufficient, add a backdrop (subtle gradient or solid with opacity)
- Price with visual badge if the tone is promotional
- CTA should look like a clickable button
- Font suggestions: use common Google Fonts (Inter, Montserrat, Playfair Display, Oswald, Poppins, Raleway, Bebas Neue, Roboto Condensed)
- All positions in pixels, relative to the ${canvasWidth}x${canvasHeight} canvas

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "layout": {
    "textBlockPosition": "top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right",
    "textBlockX": 0,
    "textBlockY": 0,
    "textBlockMaxWidth": 0,
    "textAlign": "left|center|right",
    "verticalAlign": "top|center|bottom"
  },
  "headline": {
    "fontSize": 0,
    "fontWeight": 700,
    "fontFamily": "Inter, sans-serif",
    "color": "#FFFFFF",
    "letterSpacing": 0,
    "textTransform": "uppercase|lowercase|capitalize|none",
    "textShadow": "",
    "marginBottom": 0
  },
  "subheadline": {
    "fontSize": 0,
    "fontWeight": 400,
    "fontFamily": "Inter, sans-serif",
    "color": "#FFFFFF",
    "letterSpacing": 0,
    "textTransform": "none",
    "marginBottom": 0
  },
  "price": {
    "fontSize": 0,
    "fontWeight": 700,
    "color": "#FFFFFF",
    "backgroundColor": "",
    "borderRadius": 0,
    "padding": "",
    "marginBottom": 0,
    "hasBadge": false,
    "badgeStyle": "pill|tag|ribbon|circle"
  },
  "cta": {
    "fontSize": 0,
    "fontWeight": 700,
    "color": "#FFFFFF",
    "backgroundColor": "#ff713d",
    "borderRadius": 8,
    "padding": "12px 32px",
    "textTransform": "uppercase",
    "letterSpacing": 1
  },
  "backdrop": {
    "enabled": false,
    "type": "gradient|solid|blur",
    "css": ""
  },
  "colorPalette": {
    "dominant": "#000000",
    "accent": "#ff713d",
    "text": "#FFFFFF",
    "textSecondary": "#CCCCCC",
    "background": "#000000"
  },
  "ctaShape": {
    "detected": false,
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "dominantColor": "#ff713d",
    "suggestedTextColor": "#FFFFFF"
  }
}

ADDITIONAL — CTA BUTTON SHAPE DETECTION:
- Look for a visual shape in the image that resembles a CTA button (pill, rectangle, gradient shape, glossy 3D element).
- If you find one, set "detected": true and provide the EXACT pixel coordinates (x, y, width, height) relative to the ${canvasWidth}x${canvasHeight} canvas.
- Also identify the dominant color of the shape and suggest a text color with good contrast.
- If no button shape is found, set "detected": false and return zeroes — the Konva renderer will create a Canvas 2D button as fallback.`;
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
    console.error("[AnalyzeComposition] No JSON object found in text:", text.slice(0, 300));
    return null;
  }

  text = jsonMatch[0];
  text = text.replace(/,\s*([}\]])/g, "$1");
  text = text.replace(/\/\/[^\n]*/g, "");

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (err) {
    console.error("[AnalyzeComposition] JSON.parse failed:", err);
    return null;
  }
}

function buildFallbackComposition(body: CompositionBody): Record<string, unknown> {
  const { canvasWidth, canvasHeight } = body;
  return {
    layout: {
      textBlockPosition: "bottom-left",
      textBlockX: Math.round(canvasWidth * 0.05),
      textBlockY: Math.round(canvasHeight * 0.60),
      textBlockMaxWidth: Math.round(canvasWidth * 0.55),
      textAlign: "left",
      verticalAlign: "bottom",
    },
    headline: {
      fontSize: Math.round(canvasWidth * 0.055),
      fontWeight: 800,
      fontFamily: "Inter, sans-serif",
      color: "#FFFFFF",
      letterSpacing: -1,
      textTransform: "uppercase",
      textShadow: "0 2px 12px rgba(0,0,0,0.5)",
      marginBottom: Math.round(canvasHeight * 0.01),
    },
    subheadline: {
      fontSize: Math.round(canvasWidth * 0.022),
      fontWeight: 400,
      fontFamily: "Inter, sans-serif",
      color: "#CCCCCC",
      letterSpacing: 0,
      textTransform: "none",
      marginBottom: Math.round(canvasHeight * 0.015),
    },
    price: {
      fontSize: Math.round(canvasWidth * 0.035),
      fontWeight: 700,
      color: "#FFFFFF",
      backgroundColor: "rgba(255,113,61,0.9)",
      borderRadius: 8,
      padding: "8px 20px",
      marginBottom: Math.round(canvasHeight * 0.015),
      hasBadge: true,
      badgeStyle: "pill",
    },
    cta: {
      fontSize: Math.round(canvasWidth * 0.018),
      fontWeight: 700,
      color: "#FFFFFF",
      backgroundColor: "#ff713d",
      borderRadius: 8,
      padding: "12px 32px",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    backdrop: {
      enabled: true,
      type: "gradient",
      css: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
    },
    colorPalette: {
      dominant: "#1a1a2e",
      accent: "#ff713d",
      text: "#FFFFFF",
      textSecondary: "#CCCCCC",
      background: "#000000",
    },
    ctaShape: {
      detected: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      dominantColor: "#ff713d",
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
    console.error("[AnalyzeComposition] GEMINI_API_KEY not set in Edge Function secrets");
    return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured server-side." }, 500, cors);
  }

  let body: CompositionBody;
  try {
    body = await req.json() as CompositionBody;
  } catch {
    return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
  }

  if (!body.generatedImageBase64) {
    return json({ error: "missing_image", details: "generatedImageBase64 is required." }, 400, cors);
  }
  if (!body.copyData) {
    return json({ error: "missing_copy_data", details: "copyData is required." }, 400, cors);
  }

  const canvasWidth = body.canvasWidth || 1080;
  const canvasHeight = body.canvasHeight || 1080;
  body.canvasWidth = canvasWidth;
  body.canvasHeight = canvasHeight;

  const prompt = buildCompositionPrompt(body);
  const cleanImage = body.generatedImageBase64.replace(/^data:image\/\w+;base64,/, "");

  console.log("[AnalyzeComposition] Starting composition analysis...");
  console.log("[AnalyzeComposition] Canvas:", canvasWidth, "x", canvasHeight);
  console.log("[AnalyzeComposition] Copy headline:", body.copyData.headline);

  // Cascading model fallback
  for (const model of COMPOSITION_MODELS) {
    console.log(`[AnalyzeComposition] Trying model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { inline_data: { mime_type: "image/png", data: cleanImage } },
            { text: prompt },
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
        console.warn(`[AnalyzeComposition] ${model} HTTP ${response.status}: ${err.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[AnalyzeComposition] ${model} returned empty response`);
        continue;
      }

      console.log(`[AnalyzeComposition] === RAW RESPONSE ===`, text.slice(0, 500));

      const parsed = extractJSON(text);
      if (parsed && parsed.layout) {
        console.log(`[AnalyzeComposition] ${model} parsed OK — position: ${(parsed.layout as Record<string, unknown>).textBlockPosition}`);
        return json({ composition: parsed }, 200, cors);
      }

      console.warn(`[AnalyzeComposition] ${model} JSON parse failed or missing layout — trying next model...`);
    } catch (err) {
      console.warn(`[AnalyzeComposition] ${model} error:`, err);
      continue;
    }
  }

  // Fallback: return safe default composition
  console.warn("[AnalyzeComposition] All models failed — returning fallback composition.");
  return json({ composition: buildFallbackComposition(body), fallback: true }, 200, cors);
});
