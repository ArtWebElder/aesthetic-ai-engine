/// <reference lib="deno.ns" />
// supabase/functions/analyze-creative/index.ts
// CREATYNG — Engine v2: Analyze a reference creative/ad image with Gemini 2.5 Flash.
// Extracts texts, colors, layout, style, avatar, logo, format, and a full reproduction prompt.

import { corsHeaders } from "../_shared/cors.ts";

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

const SYSTEM_PROMPT = `Analise esta imagem de criativo/anúncio e extraia TODOS os elementos em JSON:
1. texts: array de objetos com { type: 'title'|'subtitle'|'label'|'cta'|'price'|'contact'|'background_text'|'watermark', content: 'texto exato', position: 'top-left'|'top-center'|'top-right'|'center-left'|'center'|'center-right'|'bottom-left'|'bottom-center'|'bottom-right' }

Extract ALL text visible in the image, including:
- Main titles and headings (type: title)
- Prices, discounts, promotional text (type: price)
- Small text: contact info, addresses, social media, URLs (type: contact)
- Call-to-action buttons (type: cta)
- IMPORTANT: Large decorative/background text that appears BEHIND the main subject. These are usually brand names, product names, or stylistic text rendered in large bold font as part of the background design. They are often partially obscured by the subject but are an important editable part of the design. Use type: "background_text".
- Watermark or stock photo text (type: watermark)
- Any other readable text (type: label)

2. colors: array de 5 cores dominantes em hex (ex: ['#7C3AED', '#FF713D', ...])
3. layout: descrição textual do layout e composição
4. style: descrição detalhada do estilo visual (iluminação, mood, efeitos, tipografia)
5. hasAvatar: boolean - se tem pessoa/rosto
6. avatarPosition: posição do avatar se existir
7. hasLogo: boolean
8. logoPosition: posição do logo se existir
9. format: '1:1'|'4:5'|'9:16'|'16:9' baseado nas proporções
10. fullPrompt: um prompt detalhado em inglês que, se enviado a um modelo de IA de geração de imagem, reproduziria esta imagem fielmente (incluindo estilo, composição, cores, tipografia, efeitos, tudo)

Responda APENAS com JSON válido, sem markdown, sem explicações.`;

function extractJSON(raw: string): Record<string, unknown> | null {
  const text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch { /* continue */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0].replace(/,\s*([}\]])/g, "$1")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
    if (!apiKey) {
      return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured." }, 500, cors);
    }

    let body: { image?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
    }

    if (!body.image || typeof body.image !== "string") {
      return json({ error: "missing_image", details: "Field 'image' (base64) is required." }, 400, cors);
    }

    // Strip data URI prefix if present
    const cleanBase64 = body.image.replace(/^data:image\/\w+;base64,/, "");
    console.log(`[analyze-creative] Image size: ${Math.round(cleanBase64.length / 1024)}KB`);

    // Try each model with cascading fallback
    for (const model of GEMINI_MODELS) {
      console.log(`[analyze-creative] Trying model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: "image/png", data: cleanBase64 } },
              { text: SYSTEM_PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
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
          console.warn(`[analyze-creative] ${model} HTTP ${response.status}: ${err.slice(0, 200)}`);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`[analyze-creative] ${model} returned empty response`);
          continue;
        }

        console.log(`[analyze-creative] ${model} raw response:`, text.slice(0, 300));

        const parsed = extractJSON(text);
        if (parsed) {
          console.log(`[analyze-creative] ${model} parsed OK — texts: ${Array.isArray(parsed.texts) ? (parsed.texts as unknown[]).length : 0}, colors: ${Array.isArray(parsed.colors) ? (parsed.colors as unknown[]).length : 0}`);
          return json({ analysis: parsed, model }, 200, cors);
        }

        console.warn(`[analyze-creative] ${model} JSON parse failed`);
      } catch (err) {
        console.warn(`[analyze-creative] ${model} error:`, err);
        continue;
      }
    }

    // All models failed
    console.error("[analyze-creative] All models failed");
    return json({ error: "analysis_failed", details: "All Gemini models failed to analyze the image." }, 502, cors);
  } catch (err) {
    console.error("[analyze-creative] Unexpected error:", err);
    return json({ error: "internal_error", details: String((err as Error)?.message ?? err) }, 500, cors);
  }
});
