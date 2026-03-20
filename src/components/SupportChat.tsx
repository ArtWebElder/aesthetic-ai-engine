// src/components/SupportChat.tsx
// CREATYNG — Floating AI support chat (Gemini Flash)

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';

const GEMINI_API_KEY = (import.meta as { env: Record<string, string> }).env.VITE_GEMINI_API_KEY ?? '';
const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-2.0-flash-exp',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT = `Você é o assistente de suporte do Creatyng, um SaaS de criação visual com IA.
Responda de forma clara, amigável e concisa (max 3 frases).
O Creatyng permite criar criativos de nível agência: o usuário envia foto do produto, escolhe estilo e a IA gera a composição.
Funcionalidades: Food Pop (5 créditos), Pop Design (8 créditos), Chat de refinamento (1 crédito/ajuste), Exportação gratuita.
Planos: Grátis (100 créditos/mês), Pro (1000 créditos/mês).
Studio: editor de nodes estilo ComfyUI para power users.
Se não souber a resposta, direcione para suporte@creatyng.com.`;

async function callGemini(messages: Message[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'IA não configurada. Entre em contato: suporte@creatyng.com';
  }

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Entendido! Sou o assistente do Creatyng. Como posso ajudar?' }] },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
  ];

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch {
      continue;
    }
  }
  return 'Desculpe, não consegui processar sua pergunta. Tente novamente ou entre em contato: suporte@creatyng.com';
}

export function SupportChat() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const quickQuestions = [
    t('support.quick.first_creative'),
    t('support.quick.credits'),
    t('support.quick.edit_after'),
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const reply = await callGemini(updated);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            transition: 'transform 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={22} color="#fff" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 380, maxHeight: 520, borderRadius: 16,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid hsl(var(--border))',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
          }}>
            <Sparkles size={18} color="#fff" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('support.title')}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Creatyng AI</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                width: 28, height: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 260,
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Sparkles size={28} style={{ color: '#F97316', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>
                  {t('support.placeholder')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 12.5,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.5,
                  background: msg.role === 'user' ? '#F97316' : 'hsl(var(--muted))',
                  color: msg.role === 'user' ? '#fff' : 'hsl(var(--foreground))',
                }}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12,
                background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                  {t('studio.chat.thinking')}...
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px', borderTop: '1px solid hsl(var(--border))',
            display: 'flex', gap: 8,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={t('support.placeholder')}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--input))',
                color: 'hsl(var(--foreground))',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: input.trim() ? '#F97316' : 'hsl(var(--muted))',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms',
              }}
            >
              <Send size={14} color={input.trim() ? '#fff' : 'hsl(var(--muted-foreground))'} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
