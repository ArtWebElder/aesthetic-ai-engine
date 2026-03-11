import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const AI_MOCK_REPLIES = [
  "I'm building that flow for you now. Starting with an Image Upload node connected to BG Removal, then feeding into the AI Scene Gen.",
  "Got it! I'll set up a brand identity flow with Brand Input → Prompt Builder → Image Gen → Typography → Export.",
  "Sure! That's a product photoshoot flow. I'm adding the nodes: Image Upload → Scene Gen → Color Grade → Export.",
  "Let me configure a social post flow for you: Text Input + Image Upload → Prompt Builder → Image Gen → Typography → Export.",
];

interface StudioChatProps {
  open: boolean;
  onClose: () => void;
}

export function StudioChat({ open, onClose }: StudioChatProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hello! Describe what you want to create and I'll build the flow for you automatically.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!open) return null;

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const reply = AI_MOCK_REPLIES[Math.floor(Math.random() * AI_MOCK_REPLIES.length)];
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 68,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 480,
      maxWidth: 'calc(100% - 140px)',
      zIndex: 150,
      background: '#1e1e24',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
      boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={13} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{t('studio.chat.title')}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{t('studio.chat.subtitle')}</div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxHeight: 300,
        minHeight: 160,
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '7px 11px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #ff713d, #FF9B70)'
                : 'rgba(255,255,255,0.08)',
              color: msg.role === 'user' ? '#fff' : '#d1d5db',
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: 4, padding: '4px 2px', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{t('studio.chat.thinking')}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#ff713d',
                  opacity: 0.7,
                  animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: 6,
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={t('studio.chat.placeholder')}
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 12,
            color: '#e5e7eb',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: input.trim() && !isTyping ? '#ff713d' : 'rgba(255,255,255,0.06)',
            color: input.trim() && !isTyping ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
