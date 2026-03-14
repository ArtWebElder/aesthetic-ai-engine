// src/features/editor/wizard/RefinementChat.tsx
// CREATYNG — Chat de refinamento pós-geração.
// Light theme, contraste correto. Aceita mensagens externas (pill clicks).

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Sparkles, RefreshCw, Bot, CheckCircle2, XCircle } from "lucide-react";
import { parseChat } from "../engine/chatParser";
import { applyCommand, type RefinementOverrides } from "../engine/chatApply";
import { applyCommandWithAI } from "../engine/chatCompositionAI";
import type { CreatygnComposition } from "@/types/composition";

const GEMINI_API_KEY = (import.meta as { env: Record<string, string> }).env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
];

// Map emoji prefix to lucide icon + strip emoji from displayed text
const EMOJI_PREFIX_MAP: Array<{ prefix: string; icon: ReactNode; color: string }> = [
  { prefix: "✨", icon: <Sparkles style={{ width: 12, height: 12, flexShrink: 0 }} />, color: "#ff713d" },
  { prefix: "🔄", icon: <RefreshCw style={{ width: 12, height: 12, flexShrink: 0 }} />, color: "#8e8e96" },
  { prefix: "🤖", icon: <Bot style={{ width: 12, height: 12, flexShrink: 0 }} />, color: "#7C3AED" },
  { prefix: "✅", icon: <CheckCircle2 style={{ width: 12, height: 12, flexShrink: 0 }} />, color: "#10B981" },
  { prefix: "❌", icon: <XCircle style={{ width: 12, height: 12, flexShrink: 0 }} />, color: "#EF4444" },
];

function parseSystemMessage(text: string): { icon: ReactNode | null; color: string; body: string } {
  for (const { prefix, icon, color } of EMOJI_PREFIX_MAP) {
    if (text.startsWith(prefix)) {
      return { icon, color, body: text.slice(prefix.length).trimStart() };
    }
  }
  return { icon: null, color: "#141417", body: text };
}

async function callGeminiForHelp(command: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[Chat] VITE_GEMINI_API_KEY não configurado — IA indisponível');
    return "IA não configurada. Verifique VITE_GEMINI_API_KEY.";
  }

  const bodyStr = JSON.stringify({
    contents: [{ parts: [{ text: `Você é assistente de design do Creatyng. O usuário quer ajustar um criativo visual e enviou: "${command}". Responda em 1-2 linhas em PT-BR.` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
  });

  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      console.log(`[Chat] Trying model: ${model}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.warn(`[Chat] ${model} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        console.log(`[Chat] ${model} responded OK`);
        return text;
      }
      console.warn(`[Chat] ${model} returned empty text`);
    } catch (e) {
      console.warn(`[Chat] ${model} error:`, e);
      continue;
    }
  }

  return "IA indisponível. Todos os modelos falharam. Tente novamente.";
}

interface ChatMessage {
  role: "user" | "system";
  text: string;
}

interface RefinementChatProps {
  overrides: RefinementOverrides;
  onOverridesChange: (overrides: RefinementOverrides) => void;
  onRegenerate: () => void;
  composition?: CreatygnComposition | null;
  onCompositionChange?: (c: CreatygnComposition) => void;
  /** Mensagem externa (pill click) — quando muda para string não-vazia, é enviada como mensagem do user. */
  externalMessage?: string | null;
  /** Chamado após consumir externalMessage para resetar o estado no pai. */
  onExternalMessageConsumed?: () => void;
}

export function RefinementChat({
  overrides,
  onOverridesChange,
  onRegenerate,
  composition,
  onCompositionChange,
  externalMessage,
  onExternalMessageConsumed,
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

  const processMessage = useCallback(async (commandText: string) => {
    if (!commandText.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: commandText };

    const parsedCheck = parseChat(commandText);
    if (parsedCheck.type === "regenerate_image") {
      setMessages((prev) => [...prev, userMsg, { role: "system", text: "🔄 Regenerando imagem..." }]);
      onRegenerate();
      return;
    }

    if (composition && onCompositionChange) {
      setMessages((prev) => [...prev, userMsg, { role: "system", text: "✨ Processando..." }]);
      setAiLoading(true);
      try {
        const result = await applyCommandWithAI(composition, commandText);
        if (result.description.startsWith("✅")) onCompositionChange(result.composition);
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

    if (parsedCheck.type !== "unknown") {
      const newOverrides = applyCommand(parsedCheck, overrides);
      onOverridesChange(newOverrides);
      setMessages((prev) => [...prev, userMsg, { role: "system", text: `✅ ${parsedCheck.description}` }]);
      return;
    }

    console.log('[Chat] regex=unknown — enviando para Gemini Flash direto');
    setMessages((prev) => [...prev, userMsg, { role: "system", text: "✨ Consultando IA..." }]);
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
  }, [composition, onCompositionChange, onRegenerate, onOverridesChange, overrides]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pill clicks from parent
  useEffect(() => {
    if (externalMessage && externalMessage.trim()) {
      processMessage(externalMessage);
      onExternalMessageConsumed?.();
    }
  }, [externalMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!input.trim() || aiLoading) return;
    const text = input.trim();
    setInput("");
    await processMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%", height: "100%",
      background: "#f5f5f3", borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(20,20,23,0.08)",
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  maxWidth: "85%", padding: "8px 12px", borderRadius: "12px 12px 2px 12px",
                  background: "linear-gradient(135deg, #ff713d, #FF9B70)",
                  color: "#ffffff", fontSize: 13, lineHeight: 1.45, fontFamily: "inherit",
                }}>
                  {msg.text}
                </div>
              </div>
            );
          }
          const parsed = parseSystemMessage(msg.text);
          if (parsed.icon) {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "8px 12px", borderRadius: "12px 12px 12px 2px",
                  background: "#ffffff", color: "#141417", fontSize: 13, lineHeight: 1.45,
                  border: "1px solid rgba(20,20,23,0.06)", whiteSpace: "pre-line", fontFamily: "inherit",
                  display: "flex", alignItems: "flex-start", gap: 6,
                }}>
                  <span style={{ color: parsed.color, marginTop: 2, flexShrink: 0 }}>{parsed.icon}</span>
                  <span>{parsed.body}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                maxWidth: "90%", padding: "8px 12px", borderRadius: 9,
                background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.12)",
                color: "#0891b2", fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-line", fontFamily: "inherit",
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, display: "flex", gap: 8, padding: "10px 12px",
        borderTop: "1px solid rgba(20,20,23,0.08)",
        background: "#f5f5f3",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiLoading}
          placeholder='"muda headline pra OFERTA ESPECIAL"'
          style={{
            flex: 1, background: "#ffffff", border: "1px solid rgba(20,20,23,0.1)",
            borderRadius: 8, padding: "8px 12px", color: "#141417",
            fontSize: 13, outline: "none", fontFamily: "inherit",
            opacity: aiLoading ? 0.5 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#ff713d"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(20,20,23,0.1)"; }}
        />
        <button
          onClick={handleSend}
          disabled={aiLoading}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: aiLoading ? "rgba(20,20,23,0.08)" : "linear-gradient(135deg, #ff713d, #FF9B70)",
            color: aiLoading ? "#8e8e96" : "#ffffff", fontSize: 13, fontWeight: 600,
            cursor: aiLoading ? "default" : "pointer", fontFamily: "inherit",
            transition: "all 150ms",
          }}
        >
          {aiLoading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
