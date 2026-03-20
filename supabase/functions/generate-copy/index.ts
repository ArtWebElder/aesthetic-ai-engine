/// <reference lib="deno.ns" />

// CREATYNG — Edge Function: generate-copy
// Gera copy profissional (headline, CTA, preço) com Gemini 2.5 Flash.
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

const COPY_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

interface CopyBody {
  productName: string;
  productPrice?: string;
  currency?: string;
  targetAudience?: string;
  tone?: string;
  language?: string;
  referenceAnalysis?: Record<string, unknown>;
  additionalContext?: string;
}

interface CopyResult {
  headline: string;
  subheadline?: string;
  priceFormatted: string;
  priceBadgeText?: string;
  cta: string;
  tagline?: string;
  confidence: number;
}

const CURRENCY_FORMATS: Record<string, { symbol: string; locale: string }> = {
  BRL: { symbol: "R$", locale: "pt-BR" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  MXN: { symbol: "$", locale: "es-MX" },
  ARS: { symbol: "$", locale: "es-AR" },
};

function buildCopyPrompt(body: CopyBody): string {
  const currency = body.currency || "BRL";
  const lang = body.language || "pt-BR";
  const tone = body.tone || "premium";
  const audience = body.targetAudience || "general consumers";
  const currencyInfo = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.BRL;

  const sceneContext = body.referenceAnalysis
    ? `Contexto visual da referência: ${(body.referenceAnalysis as Record<string, unknown>).sceneDescription || "professional product photography"}`
    : "";

  return `Você é um copywriter sênior especializado em anúncios visuais (banners, social ads, e-commerce).

Regras ESTRITAS:
- Headline: MÁXIMO 4 palavras. Impactante, memorável. Não genérico.
- Subheadline: MÁXIMO 8 palavras. Complementa o headline.
- CTA: MÁXIMO 3 palavras. Verbo de ação. CAPS.
- priceBadgeText: frase curta antes do preço (ex: "A partir de", "Por apenas", "Special offer"). MÁXIMO 3 palavras.
- tagline: frase de impacto opcional, MÁXIMO 6 palavras.
- Preço: formatar com símbolo "${currencyInfo.symbol}" e separadores corretos para locale "${currencyInfo.locale}".
- Adapte o tom ao público-alvo e ao estilo da referência visual.
- Se o tom é "premium" ou "elegante": menos é mais, sofisticação, exclusividade.
- Se o tom é "urgente": escassez, valor, ação imediata.
- Se o tom é "jovem" ou "divertido": linguagem descontraída, energia.
- Se o tom é "minimalista": extremamente conciso, clean.
- NÃO use clichês como "Qualidade incomparável" ou "O melhor do mercado".
- confidence: número de 0 a 1 indicando quão bem o copy se encaixa no contexto.
- RESPONDA APENAS em JSON válido, sem markdown, sem backticks.

Produto: ${body.productName}
${body.productPrice ? `Preço: ${body.productPrice} ${currency}` : "Preço: não informado"}
Público: ${audience}
Tom: ${tone}
Idioma: ${lang}
${sceneContext}
${body.additionalContext ? `Instruções extras: ${body.additionalContext}` : ""}

Responda com este JSON exato:
{
  "headline": "...",
  "subheadline": "...",
  "priceFormatted": "...",
  "priceBadgeText": "...",
  "cta": "...",
  "tagline": "...",
  "confidence": 0.0
}`;
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
    console.error("[GenerateCopy] No JSON object found in text:", text.slice(0, 300));
    return null;
  }

  text = jsonMatch[0];
  text = text.replace(/,\s*([}\]])/g, "$1");
  text = text.replace(/\/\/[^\n]*/g, "");

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (err) {
    console.error("[GenerateCopy] JSON.parse failed:", err);
    return null;
  }
}

function normalizeCopyResult(raw: Record<string, unknown>, body: CopyBody): CopyResult {
  const currency = body.currency || "BRL";
  const currencyInfo = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.BRL;

  // Format price if raw priceFormatted is missing
  let priceFormatted = (raw.priceFormatted as string) || "";
  if (!priceFormatted && body.productPrice) {
    const num = parseFloat(body.productPrice);
    if (!isNaN(num)) {
      priceFormatted = num.toLocaleString(currencyInfo.locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });
    } else {
      priceFormatted = `${currencyInfo.symbol} ${body.productPrice}`;
    }
  }

  return {
    headline: (raw.headline as string) || body.productName,
    subheadline: (raw.subheadline as string) || undefined,
    priceFormatted,
    priceBadgeText: (raw.priceBadgeText as string) || undefined,
    cta: (raw.cta as string) || "SAIBA MAIS",
    tagline: (raw.tagline as string) || undefined,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
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
    console.error("[GenerateCopy] GEMINI_API_KEY not set in Edge Function secrets");
    return json({ error: "missing_api_key", details: "GEMINI_API_KEY not configured server-side." }, 500, cors);
  }

  let body: CopyBody;
  try {
    body = await req.json() as CopyBody;
  } catch {
    return json({ error: "invalid_json", details: "Request body must be valid JSON." }, 400, cors);
  }

  if (!body.productName) {
    return json({ error: "missing_product_name", details: "productName is required." }, 400, cors);
  }

  const prompt = buildCopyPrompt(body);
  console.log("[GenerateCopy] Starting copy generation...");
  console.log("[GenerateCopy] Product:", body.productName, "| Tone:", body.tone || "premium", "| Lang:", body.language || "pt-BR");

  // Cascading model fallback
  for (const model of COPY_MODELS) {
    console.log(`[GenerateCopy] Trying model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
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
        console.warn(`[GenerateCopy] ${model} HTTP ${response.status}: ${err.slice(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`[GenerateCopy] ${model} returned empty response`);
        continue;
      }

      console.log(`[GenerateCopy] === RAW RESPONSE ===`, text.slice(0, 500));

      const parsed = extractJSON(text);
      if (parsed) {
        const result = normalizeCopyResult(parsed, body);
        console.log(`[GenerateCopy] ${model} OK — headline: "${result.headline}", cta: "${result.cta}"`);
        return json({ copy: result }, 200, cors);
      }

      console.warn(`[GenerateCopy] ${model} JSON parse failed — trying next model...`);
    } catch (err) {
      console.warn(`[GenerateCopy] ${model} error:`, err);
      continue;
    }
  }

  // Fallback: return basic copy without AI
  console.warn("[GenerateCopy] All models failed — returning fallback copy.");
  const currency = body.currency || "BRL";
  const currencyInfo = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.BRL;
  let fallbackPrice = "";
  if (body.productPrice) {
    const num = parseFloat(body.productPrice);
    if (!isNaN(num)) {
      fallbackPrice = num.toLocaleString(currencyInfo.locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });
    } else {
      fallbackPrice = `${currencyInfo.symbol} ${body.productPrice}`;
    }
  }

  return json({
    copy: {
      headline: body.productName,
      subheadline: undefined,
      priceFormatted: fallbackPrice,
      priceBadgeText: body.productPrice ? "Por apenas" : undefined,
      cta: "SAIBA MAIS",
      tagline: undefined,
      confidence: 0.1,
    } satisfies CopyResult,
    fallback: true,
  }, 200, cors);
});
