// src/features/editor/wizard/RefinementChat.tsx
// CREATYNG — Chat de refinamento pós-geração.
// Interpreta comandos via regex local (zero tokens de IA) e recompõe o criativo instantaneamente.

import { useState, useRef, useEffect } from "react";
import { parseChat } from "../engine/chatParser";
import { applyCommand, type RefinementOverrides } from "../engine/chatApply";

interface ChatMessage {
  role: "user" | "system";
  text: string;
}

interface RefinementChatProps {
  overrides: RefinementOverrides;
  onOverridesChange: (overrides: RefinementOverrides) => void;
  onRegenerate: () => void;
}

export function RefinementChat({ overrides, onOverridesChange, onRegenerate }: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: '✨ Ajuste seu criativo!\n• "muda headline pra SUPER PROMOÇÃO"\n• "cor vermelha"\n• "fonte Poppins"\n• "texto maior"\n• "muda preço pra 39,90"',
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: input };
    const command = parseChat(input);

    if (command.type === "regenerate_image") {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: "system", text: "🔄 Regenerando imagem..." },
      ]);
      setInput("");
      onRegenerate();
      return;
    }

    if (command.type === "unknown") {
      setMessages((prev) => [...prev, userMsg, { role: "system", text: `❓ ${command.description}` }]);
      setInput("");
      return;
    }

    const newOverrides = applyCommand(command, overrides);
    onOverridesChange(newOverrides);
    setMessages((prev) => [...prev, userMsg, { role: "system", text: `✅ ${command.description}` }]);
    setInput("");
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
          placeholder='"muda headline pra OFERTA ESPECIAL"'
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          onClick={handleSend}
          className="px-4 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
