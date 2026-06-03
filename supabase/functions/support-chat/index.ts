/// <reference lib="deno.ns" />
// supabase/functions/support-chat/index.ts
// CREATYNG — Edge Function: support-chat
// AI support assistant. Uses the BACKEND GEMINI_API_KEY (not exposed to the
// browser like a VITE_ var would be). Body: { messages: [{role,text}] } → { text }.

import { corsHeaders } from "../_shared/cors.ts";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"];

const SYSTEM_PROMPT = `Você é o assistente de suporte do Creatyng, um SaaS de criação visual com IA.
Tom: claro, amigável e direto (máx 4 frases). Responda no idioma do usuário (padrão PT-BR).

O QUE É: o usuário escolhe um fluxo (modo), preenche campos simples e recebe um criativo pronto — sem precisar escrever prompt.

MODOS DO STUDIO (e custo em créditos):
- Remover Fundo (grátis): recorta o fundo de uma imagem, direto no navegador.
- Re-color / Mood (grátis): aplica um clima de cor (quente, frio, vívido, dramático, vintage).
- Thumbnail (8 cr): thumbnail 16:9 com o TÍTULO desenhado na imagem pela IA; subject opcional; tem estilos pré-moldados.
- Card de Citação (5 cr): post social com frase em destaque.
- Headshot / Perfil (5 cr): transforma uma selfie em retrato profissional (mantém o rosto).
- Produto em Cena (5 cr): produto real recortado sobre um cenário profissional gerado por IA.
- Clone Criativo (12 cr): clona um anúncio trocando textos, cores e subject.

COMO USAR: na Dashboard escolha um card de feature → escolha o estilo → preencha os campos → "Executar fluxo". No celular dá pra arrastar nodes, pinçar pra dar zoom e usar o menu (☰) pra Dashboard/Desfazer/Auto Layout.

PLANOS: Free (50 créditos), Pro R$49,90/mês (500 cr/mês), Team R$149,90/mês (2000 cr/mês). Há recarga avulsa por Pix ou cartão.

CRÉDITOS: cada geração consome créditos conforme o modo. Para recarregar: Billing → Recarregar créditos.

REGRAS:
- Se for um problema técnico/financeiro específico da conta (pagamento, bug, reembolso) ou algo que você não tem certeza, direcione para support@creatyng.com.
- NUNCA invente preços ou recursos. Na dúvida, seja honesto e ofereça o e-mail de suporte.`;

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ text: "Método inválido." }, 405, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const key = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
    if (!key) {
      return json({ text: "IA de suporte indisponível no momento. Fale com a gente: support@creatyng.com" }, 200, cors);
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Entendido! Sou o assistente do Creatyng. Como posso ajudar?" }] },
      ...messages.map((m: { role?: string; text?: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.text ?? "") }],
      })),
    ];

    let lastErr = "";
    for (const model of MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, generationConfig: { temperature: 0.4, maxOutputTokens: 320 } }),
          },
        );
        if (!r.ok) { lastErr = `${model}: ${r.status} ${(await r.text()).slice(0, 160)}`; continue; }
        const d = await r.json();
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return json({ text: String(text).trim() }, 200, cors);
        lastErr = `${model}: no_text`;
      } catch (e) {
        lastErr = `${model}: ${String(e).slice(0, 120)}`;
      }
    }
    console.error("[support-chat] all models failed:", lastErr);
    return json({ text: "Desculpe, não consegui processar agora. Tente de novo ou fale com support@creatyng.com" }, 200, cors);
  } catch {
    return json({ text: "Erro ao processar. Fale com support@creatyng.com" }, 200, cors);
  }
});
