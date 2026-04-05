// src/features/editor/wizard/RefinementChat.tsx
// CREATYNG — Chat de refinamento pós-geração.
// Usa Edge Function chat-creative (server-side Gemini) — sem VITE_GEMINI_API_KEY.

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Sparkles, RefreshCw, Bot, CheckCircle2, XCircle } from "lucide-react";
import { parseChat } from "../engine/chatParser";
import { applyCommand, type RefinementOverrides } from "../engine/chatApply";
import { applyCommandWithAI } from "../engine/chatCompositionAI";
import type { CreatygnComposition } from "@/types/composition";
import { supabase } from "@/services/supabaseClient";
import { useWizardStore } from "@/stores/useWizardStore";

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

interface ChatAction {
  type: "update_texts" | "update_colors" | "regenerate";
  data: Record<string, unknown>;
}

interface ChatMessage {
  role: "user" | "system";
  text: string;
  confirmRegenerate?: boolean;
}

export interface ChatContext {
  analysis?: unknown;
  currentTexts?: Array<{ type: string; content: string }>;
  currentColors?: string[];
}

async function callChatCreative(
  message: string,
  ctx: ChatContext,
): Promise<{ reply: string; action: ChatAction | null }> {
  const body = {
    message,
    context: {
      analysis: ctx.analysis,
      current_texts: ctx.currentTexts,
      current_colors: ctx.currentColors,
    },
  };
  console.log("[RefinementChat] Calling chat-creative:", { messageLength: message.length, bodyKeys: Object.keys(body), hasContext: !!ctx.analysis });
  try {
    const { data, error } = await supabase.functions.invoke("chat-creative", { body });
    console.log("[RefinementChat] chat-creative response:", { data: JSON.stringify(data)?.substring(0, 500), error });
    if (error || !data) {
      console.warn("[RefinementChat] chat-creative error:", error);
      return { reply: "IA indisponível. Tente novamente.", action: null };
    }
    return { reply: data.reply ?? "OK", action: data.action ?? null };
  } catch (e) {
    console.warn("[RefinementChat] invoke error:", e);
    return { reply: "Erro ao contatar IA. Tente novamente.", action: null };
  }
}

interface RefinementChatProps {
  overrides: RefinementOverrides;
  onOverridesChange: (overrides: RefinementOverrides) => void;
  onRegenerate: () => void;
  composition?: CreatygnComposition | null;
  onCompositionChange?: (c: CreatygnComposition) => void;
  /** Mensagem externa (pill click) */
  externalMessage?: string | null;
  onExternalMessageConsumed?: () => void;
  /** Contexto do criativo para IA server-side */
  context?: ChatContext;
  /** Callbacks de ação da IA */
  onTextsUpdate?: (texts: Array<{ type: string; content: string }>) => void;
  onColorsUpdate?: (colors: string[]) => void;
}

export function RefinementChat({
  overrides,
  onOverridesChange,
  onRegenerate,
  composition,
  onCompositionChange,
  externalMessage,
  onExternalMessageConsumed,
  context = {},
  onTextsUpdate,
  onColorsUpdate,
}: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: '✨ Ajuste seu criativo!\n• "muda headline pra SUPER PROMOÇÃO"\n• "cor vermelha"\n• "muda preço pra 39,90"\n• "texto maior"',
    },
  ]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatCount = useWizardStore((s) => s.chatCount);
  const incrementChatCount = useWizardStore((s) => s.incrementChatCount);
  const MAX_CHATS = 9;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processMessage = useCallback(async (commandText: string) => {
    if (!commandText.trim()) return;

    // Check chat limit
    if (chatCount >= MAX_CHATS) {
      setMessages(prev => [...prev,
        { role: "user", text: commandText },
        { role: "system", text: `🤖 Limite de ${MAX_CHATS} refinamentos atingido. Regenere o criativo (12cr) pra continuar refinando.`, confirmRegenerate: true },
      ]);
      return;
    }
    incrementChatCount();

    const userMsg: ChatMessage = { role: "user", text: commandText };

    // 1. Try local regex parse first (fast path)
    const parsedCheck = parseChat(commandText);

    if (parsedCheck.type === "regenerate_image") {
      setMessages((prev) => [...prev, userMsg, { role: "system", text: "🔄 Regenerando imagem..." }]);
      onRegenerate();
      return;
    }

    if (composition && onCompositionChange && parsedCheck.type === "unknown") {
      // 2. Try AI composition edit (frontend Gemini)
      setMessages((prev) => [...prev, userMsg, { role: "system", text: "✨ Processando..." }]);
      setAiLoading(true);
      try {
        const result = await applyCommandWithAI(composition, commandText);
        if (result.description.startsWith("✅")) {
          onCompositionChange(result.composition);
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { role: "system", text: result.description };
            return msgs;
          });
          setAiLoading(false);
          return;
        }
        // applyCommandWithAI didn't understand → fall through to chat-creative
        console.log("[RefinementChat] applyCommandWithAI failed, falling through to chat-creative");
      } catch {
        console.log("[RefinementChat] applyCommandWithAI threw, falling through to chat-creative");
      }
      // userMsg already added — update placeholder and continue to chat-creative
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "system", text: "✨ Consultando IA..." };
        return msgs;
      });
      try {
        const { reply, action } = await callChatCreative(commandText, context);
        if (action) {
          if (action.type === "update_texts" && onTextsUpdate) {
            const texts = (action.data?.texts as Array<{ type: string; content: string }>) ?? [];
            if (texts.length > 0) { onTextsUpdate(texts); setMessages((prev) => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: "system", text: `✅ ${reply}` }; return msgs; }); setAiLoading(false); return; }
          }
          if (action.type === "update_colors" && onColorsUpdate) {
            const colors = (action.data?.colors as string[]) ?? [];
            if (colors.length > 0) { onColorsUpdate(colors); setMessages((prev) => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: "system", text: `✅ ${reply}` }; return msgs; }); setAiLoading(false); return; }
          }
          if (action.type === "regenerate") {
            setMessages((prev) => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: "system", text: `🤖 ${reply}`, confirmRegenerate: true }; return msgs; });
            setAiLoading(false); return;
          }
        }
        setMessages((prev) => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: "system", text: `🤖 ${reply}` }; return msgs; });
      } catch {
        setMessages((prev) => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: "system", text: "❌ Erro ao contatar IA." }; return msgs; });
      }
      setAiLoading(false);
      return;
    }

    // 3. Known local command
    if (parsedCheck.type !== "unknown") {
      const newOverrides = applyCommand(parsedCheck, overrides);
      onOverridesChange(newOverrides);
      setMessages((prev) => [...prev, userMsg, { role: "system", text: `✅ ${parsedCheck.description}` }]);
      return;
    }

    // 4. Unknown → call chat-creative edge function (server-side Gemini)
    setMessages((prev) => [...prev, userMsg, { role: "system", text: "✨ Consultando IA..." }]);
    setAiLoading(true);
    try {
      const { reply, action } = await callChatCreative(commandText, context);

      if (action) {
        if (action.type === "update_texts" && onTextsUpdate) {
          const texts = (action.data?.texts as Array<{ type: string; content: string }>) ?? [];
          if (texts.length > 0) {
            onTextsUpdate(texts);
            setMessages((prev) => {
              const msgs = [...prev];
              msgs[msgs.length - 1] = { role: "system", text: `✅ ${reply}` };
              return msgs;
            });
            return;
          }
        }
        if (action.type === "update_colors" && onColorsUpdate) {
          const colors = (action.data?.colors as string[]) ?? [];
          if (colors.length > 0) {
            onColorsUpdate(colors);
            setMessages((prev) => {
              const msgs = [...prev];
              msgs[msgs.length - 1] = { role: "system", text: `✅ ${reply}` };
              return msgs;
            });
            return;
          }
        }
        if (action.type === "regenerate") {
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { role: "system", text: `🤖 ${reply}`, confirmRegenerate: true };
            return msgs;
          });
          return;
        }
      }

      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "system", text: `🤖 ${reply}` };
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
  }, [composition, onCompositionChange, onRegenerate, onOverridesChange, overrides, context, onTextsUpdate, onColorsUpdate]);

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

  function handleConfirmRegenerate() {
    setMessages((prev) => prev.map((m) => m.confirmRegenerate ? { ...m, confirmRegenerate: false } : m));
    onRegenerate();
  }

  function handleCancelRegenerate() {
    setMessages((prev) => prev.map((m) => m.confirmRegenerate ? { ...m, confirmRegenerate: false } : m));
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
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <div style={{
                maxWidth: "85%", padding: "8px 12px", borderRadius: "12px 12px 12px 2px",
                background: "#ffffff", color: "#141417", fontSize: 13, lineHeight: 1.45,
                border: "1px solid rgba(20,20,23,0.06)", whiteSpace: "pre-line", fontFamily: "inherit",
                display: "flex", alignItems: "flex-start", gap: parsed.icon ? 6 : 0,
              }}>
                {parsed.icon && (
                  <span style={{ color: parsed.color, marginTop: 2, flexShrink: 0 }}>{parsed.icon}</span>
                )}
                <span>{parsed.body}</span>
              </div>
              {msg.confirmRegenerate && (
                <div style={{ display: "flex", gap: 6, paddingLeft: 4 }}>
                  <button
                    onClick={handleConfirmRegenerate}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #ff713d, #FF9B70)", color: "#fff",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Confirmar (12 créditos)
                  </button>
                  <button
                    onClick={handleCancelRegenerate}
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: "1px solid rgba(20,20,23,0.12)", background: "#fff",
                      color: "#8e8e96", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Counter + Input */}
      <div style={{ flexShrink: 0, fontSize: 10, color: chatCount >= MAX_CHATS ? '#EF4444' : '#8e8e96', textAlign: 'center', padding: '4px 0 0', background: '#f5f5f3' }}>
        {chatCount}/{MAX_CHATS} refinamentos
      </div>
      <div style={{
        flexShrink: 0, display: "flex", gap: 8, padding: "6px 12px 10px",
        borderTop: "1px solid rgba(20,20,23,0.08)",
        background: "#f5f5f3",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiLoading}
          placeholder="Digite uma mensagem..."
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
