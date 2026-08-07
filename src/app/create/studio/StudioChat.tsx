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
    <div
      className="absolute flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
      style={{
        bottom: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 480,
        maxWidth: 'calc(100% - 140px)',
        zIndex: 150,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
        <div className="flex-shrink-0 flex items-center justify-center w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))]">
          <Sparkles size={13} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-foreground">{t('studio.chat.title')}</div>
          <div className="text-[10px] text-muted-foreground">{t('studio.chat.subtitle')}</div>
        </div>
        <button
          onClick={onClose}
          className="w-[26px] h-[26px] rounded-[7px] border-none bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-center transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-2 p-3"
        style={{ maxHeight: 300, minHeight: 160 }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-[7px] text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-[12px_12px_2px_12px] bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] text-[hsl(var(--brand-foreground))]'
                  : 'rounded-[12px_12px_12px_2px] bg-muted text-foreground'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-1 items-center px-0.5 py-1">
            <span className="text-[10px] text-muted-foreground">{t('studio.chat.thinking')}</span>
            <div className="flex gap-[3px]">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-[5px] h-[5px] rounded-full bg-primary opacity-70"
                  style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5 items-end px-2.5 py-2 border-t border-border">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={t('studio.chat.placeholder')}
          rows={1}
          className="flex-1 bg-muted border border-border rounded-lg px-2.5 py-[7px] text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none font-inherit leading-[1.4] focus:ring-1 focus:ring-ring transition-shadow"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className={`w-8 h-8 rounded-lg border-none flex items-center justify-center flex-shrink-0 transition-all ${
            input.trim() && !isTyping
              ? 'bg-primary text-[hsl(var(--primary-foreground))] cursor-pointer hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
