/// <reference lib="deno.ns" />
// supabase/functions/chat-edit/index.ts
// CREATYNG — Edge Function: aplica comandos de chat ao JSON de composição via Gemini Flash.
// Recebe { composition, command } → retorna { composition } modificado.

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin ?? "*";
  return {
    "access-control-allow-origin": allowOrigin === "null" ? "*" : allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };
}

const SYSTEM_PROMPT = `Você é o motor de design do Creatyng, um SaaS premium de criação visual com IA.

Você recebe um JSON de composição (CreatygnComposition) de um criativo e um comando do usuário em texto livre.
Retorne APENAS o JSON modificado, sem explicação, sem markdown, sem blocos de código. Apenas o JSON puro.

Exemplos de comandos que você deve entender:
- "muda headline pra CAFÉ ARTESANAL" → modifica o texto dos segmentos da camada type: "headline"
- "cor vermelha" → muda cores de accent (badge price/cta, decorative-text color)
- "fonte mais elegante" → muda fontFamily de todos os layers para "Playfair Display"
- "fonte Poppins" / "usa Montserrat" → muda fontFamily de todos os layers para a fonte especificada
- "texto maior" → aumenta fontSize da headline em ~15% (multiplica valores numéricos de vw)
- "texto menor" → diminui fontSize da headline em ~15%
- "estilo premium" → ajusta cores para dourado/escuro, fonte elegante, opacidades refinadas
- "muda subheadline pra X" → modifica o campo text da camada type: "subheadline"
- "muda preço pra 49,90" → modifica o text do elemento type: "price" no badge (formato "R$ 49,90")
- "muda CTA pra COMPRE AGORA" → modifica o text do elemento type: "cta" no badge (uppercase)
- "muda whatsapp pra (11) 99999-9999" → modifica o value do item type: "whatsapp" no contact-bar
- "muda instagram pra @meuperfil" → modifica o value do item type: "instagram" no contact-bar

Regras críticas:
- Retorne APENAS o JSON. Nenhum texto antes ou depois. Sem \`\`\`json ou \`\`\`.
- Não altere a estrutura do JSON — apenas os valores dos campos relevantes.
- Preserve todos os campos que não foram modificados exatamente como estão.
- Se não entender o comando ou ele for ambíguo, retorne o JSON sem modificações.
- Nunca altere campos: version, preset, canvasSize, type, role, id.`;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, headers);
  }

  let body: { composition: unknown; command: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, headers);
  }

  const { composition, command } = body;
  if (!composition || typeof command !== "string" || !command.trim()) {
    return json({ error: "Missing composition or command" }, 400, headers);
  }

  if (!GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY not configured" }, 500, headers);
  }

  const userMessage = JSON.stringify({ composition, command });

  const geminiPayload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const bodyStr = JSON.stringify(geminiPayload);

  // ── Cascading model fallback ──
  let rawText = "";
  let modelUsed = "";
  for (const model of GEMINI_TEXT_MODELS) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      console.log(`[chat-edit] Trying model: ${model}`);
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: bodyStr,
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.warn(`[chat-edit] ${model} HTTP ${geminiRes.status}: ${errText.slice(0, 200)}`);
        continue; // try next model
      }

      const geminiData = await geminiRes.json();
      rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (rawText) {
        modelUsed = model;
        break;
      }
      console.warn(`[chat-edit] ${model} returned empty text`);
    } catch (e) {
      console.warn(`[chat-edit] ${model} fetch error:`, e);
      continue;
    }
  }

  if (!rawText) {
    console.error("[chat-edit] All models failed");
    return json({ error: "All Gemini models failed" }, 502, headers);
  }
  console.log(`[chat-edit] Using response from model: ${modelUsed}`);

  let updatedComposition: unknown;
  try {
    // Extract JSON object from response (handles edge cases where model adds surrounding text)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    updatedComposition = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);
  } catch {
    console.error("[chat-edit] Failed to parse Gemini response as JSON:", rawText.slice(0, 500));
    return json({ error: "Failed to parse AI response" }, 502, headers);
  }

  return new Response(JSON.stringify({ composition: updatedComposition }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
});
