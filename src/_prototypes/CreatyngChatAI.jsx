import { useState, useEffect, useRef } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", purple: "#7C3AED", cyan: "#06B6D4",
};

const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoArrowL = (p) => <Ico size={18} {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Ico>;
const IcoSend = (p) => <Ico size={18} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Ico>;
const IcoSparkle = (p) => <Ico size={16} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoDownload = (p) => <Ico size={18} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoRefresh = (p) => <Ico size={16} {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></Ico>;
const IcoZoomIn = (p) => <Ico size={16} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Ico>;
const IcoShare = (p) => <Ico size={16} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Ico>;
const IcoType = (p) => <Ico size={15} {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Ico>;
const IcoPalette = (p) => <Ico size={15} {...p}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.4-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></Ico>;
const IcoMove = (p) => <Ico size={15} {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></Ico>;
const IcoImage = (p) => <Ico size={15} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoDollar = (p) => <Ico size={15} {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Ico>;
const IcoWand = (p) => <Ico size={15} {...p}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M11 6.2L9.7 5"/><path d="M11 11.8L9.7 13"/><line x1="12" y1="22" x2="2" y2="12"/></Ico>;
const IcoChevL = (p) => <Ico size={14} {...p}><polyline points="15 18 9 12 15 6"/></Ico>;
const IcoChevR = (p) => <Ico size={14} {...p}><polyline points="9 18 15 12 9 6"/></Ico>;
const IcoClock = (p) => <Ico size={12} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico>;
const IcoCheck = (p) => <Ico size={14} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoInfo = (p) => <Ico size={13} {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Ico>;

/* ─── MOCK VERSIONS ─── */
const versions = [
  { id: 1, label: "Original", time: "14:32", gradient: ["#ff713d","#FFB088"] },
  { id: 2, label: "Texto ajustado", time: "14:35", gradient: ["#ff713d","#FF8855"] },
  { id: 3, label: "Cor atualizada", time: "14:38", gradient: ["#E8612F","#FFB088"] },
];

/* ─── MOCK MESSAGES ─── */
const initMessages = [
  { id: 1, role: "system", text: "Criativo gerado com sucesso! Use o chat para refinar. Cada mensagem consome 1 crédito." },
  { id: 2, role: "user", text: "Muda o texto do headline para \"MEGA PROMOÇÃO DE VERÃO\"" },
  { id: 3, role: "ai", text: "Pronto! Atualizei o headline para \"MEGA PROMOÇÃO DE VERÃO\". O texto foi centralizado e ajustado para caber no espaço disponível.", credit: 1 },
  { id: 4, role: "user", text: "A cor de fundo tá muito escura, pode clarear um pouco?" },
  { id: 5, role: "ai", text: "Clareei o fundo em 15%. O contraste com o texto foi mantido para boa legibilidade. Quer ajustar mais?", credit: 1 },
];

/* ─── QUICK ACTIONS ─── */
const quickActions = [
  { label: "Trocar cor", icon: IcoPalette, color: C.purple },
  { label: "Editar texto", icon: IcoType, color: C.accent },
  { label: "Mover elementos", icon: IcoMove, color: C.cyan },
  { label: "Trocar fundo", icon: IcoImage, color: "#10B981" },
  { label: "Ajustar preço", icon: IcoDollar, color: "#F59E0B" },
  { label: "Auto-melhorar", icon: IcoWand, color: "#EC4899" },
];

/* ─── SUGGESTION CHIPS ─── */
const suggestions = [
  "Aumenta o tamanho do preço",
  "Adiciona efeito de sombra no texto",
  "Muda a fonte para algo mais bold",
  "Remove o badge do canto",
  "Centraliza melhor o produto",
];

/* ─── MESSAGE BUBBLE ─── */
function Message({ msg }) {
  if (msg.role === "system") return (
    <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: `${C.cyan}0A`, border: `1px solid ${C.cyan}20` }}>
        <IcoInfo stroke={C.cyan} />
        <span style={{ fontSize: 11.5, color: C.cyan, fontWeight: 500 }}>{msg.text}</span>
      </div>
    </div>
  );

  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div style={{ maxWidth: "80%" }}>
        <div style={{
          padding: "11px 15px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : C.white,
          color: isUser ? "#fff" : C.text1, fontSize: 13, lineHeight: 1.5,
          border: isUser ? "none" : `1px solid ${C.border}`,
          boxShadow: isUser ? `0 2px 8px ${C.accent}25` : "0 1px 3px rgba(0,0,0,.03)",
        }}>
          {!isUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IcoSparkle size={10} style={{ color: "#fff" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>Creatyng AI</span>
            </div>
          )}
          {msg.text}
        </div>
        {/* Credit indicator for AI messages */}
        {msg.credit && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, justifyContent: "flex-start" }}>
            <IcoSparkle size={10} style={{ color: C.text4 }} />
            <span style={{ fontSize: 10, color: C.text4 }}>-{msg.credit} crédito</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function ChatAIPanel() {
  const [messages, setMessages] = useState(initMessages);
  const [input, setInput] = useState("");
  const [activeVersion, setActiveVersion] = useState(3);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, {
        id: Date.now() + 1, role: "ai", credit: 1,
        text: `Ajuste aplicado! "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}" foi processado com sucesso. A versão foi atualizada no preview.`,
      }]);
    }, 1500);
  };

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.06)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", height: "100vh", display: "flex", flexDirection: "column", color: C.text1, background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:2px}
        @keyframes fdUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes typing{0%,100%{opacity:.3}50%{opacity:1}}
        input:focus{outline:none}input::placeholder{color:${C.text4}}
      `}</style>

      {/* TOP BAR */}
      <header style={{
        height: 52, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`, background: C.white, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: C.text2, fontWeight: 500 }}>
            <IcoArrowL /> Voltar
          </button>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Burger Artesanal</span>
          <span style={{ padding: "2px 8px", borderRadius: 5, background: `${C.accent}12`, color: C.accent, fontSize: 10.5, fontWeight: 600 }}>Food/Pop</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: C.bg, fontSize: 11.5, color: C.text3 }}>
            <IcoSparkle size={12} style={{ color: C.accent }} />
            <span style={{ fontWeight: 600, color: C.accent }}>218</span> créditos
          </div>
          <button style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.text2, fontFamily: "inherit" }}><IcoShare />Compartilhar</button>
          <button style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}><IcoDownload size={14} />Exportar</button>
        </div>
      </header>

      {/* MAIN SPLIT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ═══ LEFT: PREVIEW ═══ */}
        <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: `${gridSvg}, ${C.bg}` }}>
          {/* Preview area */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
            {/* Fake creative preview */}
            <div style={{
              width: 340, height: 340, borderRadius: 16,
              background: `linear-gradient(145deg, ${versions.find(v => v.id === activeVersion)?.gradient[0]}, ${versions.find(v => v.id === activeVersion)?.gradient[1]})`,
              position: "relative", overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
              animation: ready ? "fdUp 400ms ease both" : "none",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
              {/* Fake text layers */}
              <div style={{ position: "absolute", top: 24, left: 24, right: 24, zIndex: 2 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Hamburgueria Premium</div>
              </div>
              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, zIndex: 2 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 6, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>MEGA PROMOÇÃO DE VERÃO</div>
                <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 6, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>R$ 29,90</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", top: "25%", right: "15%", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            </div>

            {/* Zoom controls */}
            <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 4 }}>
              <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoZoomIn /></button>
            </div>
          </div>

          {/* Version timeline */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: C.white }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Versões ({versions.length})</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text4 }}><IcoChevL /></button>
                <button style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text4 }}><IcoChevR /></button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {versions.map(v => (
                <button key={v.id} onClick={() => setActiveVersion(v.id)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                  border: activeVersion === v.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: activeVersion === v.id ? C.accentPale : C.white, fontFamily: "inherit",
                  transition: "all 150ms", flex: 1,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 7, background: `linear-gradient(135deg,${v.gradient[0]},${v.gradient[1]})`, flexShrink: 0 }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: activeVersion === v.id ? 600 : 500, color: activeVersion === v.id ? C.accent : C.text1 }}>{v.label}</div>
                    <div style={{ fontSize: 10, color: C.text4, display: "flex", alignItems: "center", gap: 3 }}><IcoClock />{v.time}</div>
                  </div>
                  {activeVersion === v.id && <IcoCheck stroke={C.accent} style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: CHAT ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IcoSparkle size={13} style={{ color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Assistente de Refinamento</div>
                <div style={{ fontSize: 10.5, color: C.success, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.success }} />Online
                </div>
              </div>
            </div>
            <button style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text3, fontFamily: "inherit" }}>
              <IcoRefresh />Regerar tudo
            </button>
          </div>

          {/* Quick actions bar */}
          <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.6)", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => sendMessage(a.label)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.white, cursor: "pointer",
                fontFamily: "inherit", fontSize: 11.5, color: C.text2, fontWeight: 500,
                whiteSpace: "nowrap", transition: "all 130ms", flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; e.currentTarget.style.background = `${a.color}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; e.currentTarget.style.background = C.white; }}
              >
                <a.icon size={13} />{a.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {messages.map(m => <Message key={m.id} msg={m} />)}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IcoSparkle size={9} style={{ color: "#fff" }} />
                </div>
                <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: C.white, borderRadius: "14px 14px 14px 4px", border: `1px solid ${C.border}` }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: C.text4,
                      animation: `typing 1s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion chips */}
          <div style={{ padding: "0 18px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.slice(0, 3).map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{
                padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", fontFamily: "inherit",
                fontSize: 11, color: C.text3, transition: "all 130ms",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}
              >{s}</button>
            ))}
          </div>

          {/* Input area */}
          <div style={{ padding: "10px 18px 16px", borderTop: `1px solid ${C.border}`, background: C.white }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: C.bg,
              transition: "border 150ms",
            }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                placeholder="Descreva o ajuste que quer fazer..."
                style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontFamily: "inherit", color: C.text1 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 5, background: `${C.accent}0A`, fontSize: 10, color: C.accent, fontWeight: 500, flexShrink: 0 }}>
                <IcoSparkle size={10} style={{ color: C.accent }} />1 crédito
              </div>
              <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{
                width: 34, height: 34, borderRadius: 9, border: "none",
                background: input.trim() ? `linear-gradient(135deg,${C.accent},${C.accentLight})` : "rgba(20,20,23,0.06)",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: input.trim() ? "#fff" : C.text4, transition: "all 180ms",
              }}><IcoSend size={15} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "0 2px" }}>
              <span style={{ fontSize: 10, color: C.text4 }}>Enter para enviar · Cada mensagem = 1 crédito</span>
              <span style={{ fontSize: 10, color: C.text4 }}>Powered by Gemini Flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
