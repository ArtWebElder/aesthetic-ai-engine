// src/components/SupportChat.tsx
// CREATYNG — Floating AI support chat (Gemini Flash)

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';

const SUPABASE_URL = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY ?? '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// Calls the support-chat edge function (uses the BACKEND GEMINI_API_KEY — the key
// is never exposed to the browser). The system prompt lives in the function.
async function callSupport(messages: Message[], fallback: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return fallback;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/support-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, text: m.text })) }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return (data?.text as string) || fallback;
  } catch {
    return fallback;
  }
}

export function SupportChat() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable floating button — position persisted; default bottom-right, 60px higher.
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const s = localStorage.getItem('creatyng.fab.pos');
      if (s) { const p = JSON.parse(s); if (typeof p?.x === 'number' && typeof p?.y === 'number') return p; }
    } catch { /* ignore */ }
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { x: w - 24 - 52, y: h - 84 - 52 };
  });
  const posRef = useRef(pos);
  const dragRef = useRef<{ offX: number; offY: number; startX: number; startY: number; moved: boolean } | null>(null);

  const onFabPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { offX: e.clientX - posRef.current.x, offY: e.clientY - posRef.current.y, startX: e.clientX, startY: e.clientY, moved: false };
  };
  const onFabPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6) d.moved = true;
    const np = {
      x: Math.max(4, Math.min(window.innerWidth - 56, e.clientX - d.offX)),
      y: Math.max(4, Math.min(window.innerHeight - 56, e.clientY - d.offY)),
    };
    posRef.current = np; setPos(np);
  };
  const onFabPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (!d.moved) setOpen(true);
    else { try { localStorage.setItem('creatyng.fab.pos', JSON.stringify(posRef.current)); } catch { /* ignore */ } }
    dragRef.current = null;
  };

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
      const reply = await callSupport(updated, t('support.fallback'));
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
      {/* Floating button — draggable; tap (no drag) opens the chat */}
      {!open && (
        <button
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          aria-label={t('support.title')}
          style={{
            position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(var(--brand)), #EA580C)',
            border: 'none', cursor: 'grab', touchAction: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px hsl(var(--brand) / 0.35)',
          }}
        >
          <MessageCircle size={24} color="#fff" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 'min(380px, calc(100vw - 32px))', maxHeight: 'min(520px, calc(100vh - 120px))', borderRadius: 16,
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
            background: 'linear-gradient(135deg, hsl(var(--brand)), #EA580C)',
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
                <Sparkles size={28} style={{ color: 'hsl(var(--brand))', margin: '0 auto 8px' }} />
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
                  background: msg.role === 'user' ? 'hsl(var(--brand))' : 'hsl(var(--muted))',
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
                background: input.trim() ? 'hsl(var(--brand))' : 'hsl(var(--muted))',
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
