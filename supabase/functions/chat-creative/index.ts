/// <reference lib="deno.ns" />
// supabase/functions/chat-creative/index.ts
// CREATYNG — Chat pós-geração: ajustes de texto, cor e regeneração via Gemini server-side.

import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
];

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function buildSystemPrompt(context: Record<string, unknown>): string {
  const texts = Array.isArray(context.current_texts)
    // deno-lint-ignore no-explicit-any
    ? (context.current_texts as any[]).map((t) => `${t.type}: "${t.content}"`).join(", ")
    : "N/A";
  const colors = Array.isArray(context.current_colors)
    ? (context.current_colors as string[]).join(", ")
    : "N/A";
  const analysis = context.analysis as Record<string, unknown> | null ?? {};
  const style = String(analysis.style ?? "N/A");
  const layout = String(analysis.layout ?? "N/A");

  return `Você é o assistente criativo do Creatyng. O usuário acabou de gerar um criativo e quer fazer ajustes.

Contexto do criativo atual:
- Textos: ${texts}
- Cores: ${colors}
- Estilo original: ${style}
- Layout original: ${layout}

Você pode responder com uma das seguintes ações em JSON:

1. Alterar textos:
{ "action": "update_texts", "data": { "texts": [{"type": "title", "content": "NOVO TEXTO"}] }, "reply": "Atualizei o título para NOVO TEXTO." }

2. Alterar cores:
{ "action": "update_colors", "data": { "colors": ["#FF0000", "#000000", "#FFFFFF", "#333333", "#666666"] }, "reply": "Atualizei a paleta para tons vermelhos." }

3. Regenerar imagem (mudanças de layout/estilo/fundo/subject):
{ "action": "regenerate", "data": { "reason": "mudança de layout" }, "reply": "Para essa alteração preciso regenerar a imagem (12 créditos). Deseja continuar?" }

4. Responder perguntas ou dar dicas (sem ação):
{ "action": null, "reply": "Sua resposta aqui." }

REGRAS CRÍTICAS:
- Retorne SEMPRE JSON válido com os campos "action" e "reply"
- Responda SEMPRE em português brasileiro
- Seja conciso e direto
- Para mudanças simples (trocar texto, ajustar cor): use update_texts ou update_colors
- Para mudanças estruturais (layout, estilo, fundo, trocar subject): use regenerate e mencione os 12 créditos
- Nunca invente textos — use exatamente o que o usuário pediu`;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
  if (!apiKey) return json({ reply: "IA não configurada.", action: null }, 200, cors);

  let body: { message: string; context?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400, cors);
  }

  const { message, context = {} } = body;
  if (!message?.trim()) return json({ error: "message required" }, 400, cors);

  const systemPrompt = buildSystemPrompt(context);

  const geminiPayload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: message }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  const bodyStr = JSON.stringify(geminiPayload);
  let rawText = "";
  let modelUsed = "";

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      console.log(`[chat-creative] Trying model: ${model}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: bodyStr,
      });
      if (!res.ok) {
        console.warn(`[chat-creative] ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (rawText) { modelUsed = model; break; }
      console.warn(`[chat-creative] ${model} empty text`);
    } catch (e) {
      console.warn(`[chat-creative] ${model} error:`, e);
    }
  }

  if (!rawText) {
    return json({ reply: "IA indisponível no momento. Tente novamente.", action: null }, 200, cors);
  }

  console.log(`[chat-creative] Model used: ${modelUsed}`);

  let parsed: { action?: string | null; data?: unknown; reply?: string } = {};
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(rawText);
  } catch {
    return json({ reply: rawText.slice(0, 500), action: null }, 200, cors);
  }

  return json({
    reply: parsed.reply ?? "Feito!",
    action: parsed.action ? { type: parsed.action, data: parsed.data ?? {} } : null,
  }, 200, cors);
});
