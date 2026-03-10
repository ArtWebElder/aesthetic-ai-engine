// src/features/editor/wizard/RefinementChat.tsx
// CREATYNG — Chat de refinamento pós-geração.
// Path primário: Gemini Flash via Edge Function (chat-edit) — opera diretamente no JSON de composição.
// Path fallback: parseChat() regex local → applyChatToComposition().
// Path AI sem composition: qualquer comando desconhecido → Gemini Flash direto.

import { useState, useRef, useEffect } from "react";
import { parseChat } from "../engine/chatParser";
import { applyCommand, type RefinementOverrides } from "../engine/chatApply";
import { applyCommandWithAI } from "../engine/chatCompositionAI";
import type { CreatygnComposition } from "@/types/composition";

const GEMINI_API_KEY = (import.meta as { env: Record<string, string> }).env.VITE_GEMINI_API_KEY ?? "";

/**
 * Chama Gemini Flash sem composition — retorna resposta de texto livre.
 * Usado quando regex=unknown e não há JSON de composição disponível.
 */
async function callGeminiForHelp(command: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[Chat] VITE_GEMINI_API_KEY não configurado — IA indisponível');
    return "IA não configurada. Verifique VITE_GEMINI_API_KEY.";
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Você é assistente de design do Creatyng. O usuário quer ajustar um criativo visual e enviou: "${command}". Responda em 1-2 linhas em PT-BR, explicando o que faria para atender ao pedido ou pedindo mais detalhes se necessário.` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn('[Chat] Gemini respondeu', res.status);
      return `IA indisponível (${res.status}). Tente novamente.`;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Sem resposta da IA.";
  } catch (e) {
    console.warn('[Chat] Gemini error:', e);
    return "Erro ao contatar a IA. Verifique sua conexão.";
  }
}

interface ChatMessage {
  role: "user" | "system";
  text: string;
}

interface RefinementChatProps {
  overrides: RefinementOverrides;
  onOverridesChange: (overrides: RefinementOverrides) => void;
  onRegenerate: () => void;
  /** Quando fornecido, ativa o path IA que opera diretamente no JSON de composição. */
  composition?: CreatygnComposition | null;
  onCompositionChange?: (c: CreatygnComposition) => void;
}

export function RefinementChat({
  overrides,
  onOverridesChange,
  onRegenerate,
  composition,
  onCompositionChange,
}: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: '✨ Ajuste seu criativo!\n• "muda headline pra SUPER PROMOÇÃO"\n• "cor vermelha"\n• "fonte Poppins"\n• "texto maior"\n• "muda preço pra 39,90"',
    },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || aiLoading) return;

    const commandText = input.trim();
    const userMsg: ChatMessage = { role: "user", text: commandText };
    setInput("");

    console.log('[Chat] composition available:', !!composition);
    console.log('[Chat] onCompositionChange available:', !!onCompositionChange);

    // Comandos de regeneração sempre vão para onRegenerate
    const parsedCheck = parseChat(commandText);
    if (parsedCheck.type === "regenerate_image") {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: "system", text: "🔄 Regenerando imagem..." },
      ]);
      onRegenerate();
      return;
    }

    // ── Path primário: AI opera diretamente no JSON de composição ──────────────
    if (composition && onCompositionChange) {
      const thinkingMsg: ChatMessage = { role: "system", text: "✨ Processando..." };
      setMessages((prev) => [...prev, userMsg, thinkingMsg]);
      setAiLoading(true);

      try {
        const result = await applyCommandWithAI(composition, commandText);

        if (result.description.startsWith("✅")) {
          onCompositionChange(result.composition);
        }

        setMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: "system", text: result.description };
          return msgs;
        });
      } catch {
        setMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: "system", text: "❌ Erro ao aplicar. Tente novamente." };
          return msgs;
        });
      } finally {
        setAiLoading(false);
      }
      return;
    }

    // ── Path fallback com regex: comando reconhecido sem composition JSON ──────
    if (parsedCheck.type !== "unknown") {
      const newOverrides = applyCommand(parsedCheck, overrides);
      onOverridesChange(newOverrides);
      setMessages((prev) => [...prev, userMsg, { role: "system", text: `✅ ${parsedCheck.description}` }]);
      return;
    }

    // ── Path Gemini direto: regex=unknown, sem composition → chama IA mesmo assim ──
    console.log('[Chat] regex=unknown, sem composition — enviando para Gemini Flash direto');
    const thinkingMsg: ChatMessage = { role: "system", text: "✨ Consultando IA..." };
    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setAiLoading(true);

    try {
      const aiResponse = await callGeminiForHelp(commandText);
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "system", text: `🤖 ${aiResponse}` };
        return msgs;
      });
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "system", text: "❌ Erro ao contatar IA." };
        return msgs;
      });
    } finally {
      setAiLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col border border-white/10 rounded-lg bg-black/20 backdrop-blur-sm w-full max-h-72">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}>
            {msg.role === "user" ? (
              <span className="inline-block bg-white/10 rounded-lg px-3 py-1.5 max-w-[85%] text-white/90">
                {msg.text}
              </span>
            ) : (
              <span className="inline-block bg-white/5 rounded-lg px-3 py-1.5 max-w-[85%] text-white/60 whitespace-pre-line">
                {msg.text}
              </span>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-white/10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiLoading}
          placeholder='"muda headline pra OFERTA ESPECIAL"'
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/50 transition-colors disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={aiLoading}
          className="px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors disabled:opacity-40"
        >
          {aiLoading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
