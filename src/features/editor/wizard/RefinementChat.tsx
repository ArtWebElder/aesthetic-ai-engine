// src/features/editor/wizard/RefinementChat.tsx
// CREATYNG — Chat de refinamento pós-geração.
// Path primário: Gemini Flash via Edge Function (chat-edit) — opera diretamente no JSON de composição.
// Path fallback: parseChat() regex local → applyChatToComposition().

import { useState, useRef, useEffect } from "react";
import { parseChat } from "../engine/chatParser";
import { applyCommand, type RefinementOverrides } from "../engine/chatApply";
import { applyCommandWithAI } from "../engine/chatCompositionAI";
import type { CreatygnComposition } from "@/types/composition";

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

    // ── Path fallback: regex overrides (quando não há composition JSON) ────────
    if (parsedCheck.type === "unknown") {
      setMessages((prev) => [...prev, userMsg, { role: "system", text: `❓ ${parsedCheck.description}` }]);
      return;
    }

    const newOverrides = applyCommand(parsedCheck, overrides);
    onOverridesChange(newOverrides);
    setMessages((prev) => [...prev, userMsg, { role: "system", text: `✅ ${parsedCheck.description}` }]);
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
