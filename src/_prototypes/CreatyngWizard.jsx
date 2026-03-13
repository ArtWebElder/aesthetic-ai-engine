import { useState, useEffect, useRef, useCallback } from "react";

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
const IcoUpload = (p) => <Ico size={32} {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></Ico>;
const IcoImage = (p) => <Ico {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoX = (p) => <Ico size={16} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const IcoArrowR = (p) => <Ico size={18} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ico>;
const IcoArrowL = (p) => <Ico size={18} {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Ico>;
const IcoCheck = (p) => <Ico size={16} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoSparkle = (p) => <Ico {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoCamera = (p) => <Ico size={22} {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
const IcoPalette = (p) => <Ico size={22} {...p}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.4-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></Ico>;
const IcoStar = (p) => <Ico size={22} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>;
const IcoLayers = (p) => <Ico size={22} {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ico>;
const IcoDownload = (p) => <Ico size={16} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoSend = (p) => <Ico size={16} {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Ico>;
const IcoExpand = (p) => <Ico size={16} {...p}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></Ico>;
const IcoShare = (p) => <Ico size={16} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Ico>;
const IcoType = (p) => <Ico size={16} {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Ico>;
const IcoPhone = (p) => <Ico size={16} {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></Ico>;
const IcoDollar = (p) => <Ico size={16} {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Ico>;
const IcoTag = (p) => <Ico size={16} {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Ico>;

/* ─── PRESETS ─── */
const presets = [
  { id: "food-pop", title: "Food / Pop", desc: "Cena cinematográfica com iluminação profissional e ingredientes.", credits: 5, gradient: ["#ff713d","#FFB088"], icon: IcoCamera, tag: "Popular" },
  { id: "pop-design", title: "Pop Design", desc: "Subject isolado com fundo vibrante e tipografia gigante.", credits: 8, gradient: ["#7C3AED","#C084FC"], icon: IcoPalette, tag: "Novo" },
  { id: "editorial", title: "Editorial", desc: "Layout sofisticado estilo revista premium.", credits: 6, gradient: ["#1E293B","#64748B"], icon: IcoLayers, tag: "Em breve", disabled: true },
  { id: "neon", title: "Neon Glow", desc: "Efeito néon com brilhos e atmosfera noturna.", credits: 7, gradient: ["#06B6D4","#818CF8"], icon: IcoStar, tag: "Em breve", disabled: true },
];

/* ─── GENERATION STAGES ─── */
const genStages = [
  { label: "Analisando sua imagem...", dur: 1500 },
  { label: "Construindo prompt de 6 camadas...", dur: 1200 },
  { label: "Gemini gerando cena cinematográfica...", dur: 3000 },
  { label: "Aplicando tipografia profissional...", dur: 1000 },
  { label: "Renderizando composição final...", dur: 800 },
  { label: "Finalizando seu criativo!", dur: 500 },
];

/* ─── STEP HEADER ─── */
const stepNames = ["Upload", "Estilo", "Textos", "Gerando", "Resultado"];

/* ─── MAIN ─── */
export default function Wizard() {
  const [step, setStep] = useState(0);
  const [trans, setTrans] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preset, setPreset] = useState(null);
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [cta, setCta] = useState("Peça agora!");
  const [genStage, setGenStage] = useState(0);
  const [genDone, setGenDone] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const go = (dir) => { setTrans(true); setTimeout(() => { setStep(s => s + dir); setTrans(false); }, 180); };

  // Generation simulation
  useEffect(() => {
    if (step !== 3) return;
    setGenStage(0); setGenDone(false);
    let current = 0;
    const advance = () => {
      if (current >= genStages.length - 1) { setGenDone(true); setTimeout(() => go(1), 600); return; }
      current++;
      setGenStage(current);
      setTimeout(advance, genStages[current].dur);
    };
    setTimeout(advance, genStages[0].dur);
  }, [step]);

  const canNext = () => {
    if (step === 0) return uploaded;
    if (step === 1) return !!preset;
    if (step === 2) return headline.trim().length > 0;
    return true;
  };

  const totalSteps = 5;
  const progress = step === 3 ? ((genStage + 1) / genStages.length) * 100 : ((step + 1) / totalSteps) * 100;
  const selectedPreset = presets.find(p => p.id === preset);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  const sendChat = (text) => {
    if (!text.trim()) return;
    setChatMsgs(m => [...m, { role: "user", text }]);
    setChatInput("");
    setTimeout(() => {
      setChatMsgs(m => [...m, { role: "ai", text: `Ajuste "${text.slice(0, 30)}..." aplicado com sucesso!`, credit: 1 }]);
    }, 1200);
  };

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: "100vh", background: `radial-gradient(ellipse 600px 400px at 50% 5%, rgba(255,113,61,0.06) 0%, transparent 60%), ${gridSvg}, ${C.bg}`, display: "flex", flexDirection: "column", color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:2px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse2{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px ${C.accent}33}50%{box-shadow:0 0 40px ${C.accent}55}}
        @keyframes typing{0%,100%{opacity:.3}50%{opacity:1}}
        input:focus,textarea:focus{outline:none}input::placeholder,textarea::placeholder{color:${C.text4}}
      `}</style>

      {/* TOP BAR */}
      <header style={{ height: 52, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>C</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Creatyng</span>
          <span style={{ color: C.text4, fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Nova Criação</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: C.bg, fontSize: 11.5, color: C.text3 }}>
            <IcoSparkle size={12} style={{ color: C.accent }} /><span style={{ fontWeight: 600, color: C.accent }}>221</span> créditos
          </div>
        </div>
      </header>

      {/* STEP INDICATORS */}
      <div style={{ padding: "16px 24px 0", maxWidth: 700, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
          {stepNames.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: i < step ? C.accent : i === step ? C.accent : "rgba(20,20,23,0.06)",
                color: i <= step ? "#fff" : C.text4, transition: "all 300ms",
              }}>{i < step ? <IcoCheck size={12} stroke="#fff" /> : i + 1}</div>
              <span style={{ fontSize: 11.5, fontWeight: i === step ? 600 : 400, color: i <= step ? C.text1 : C.text4, display: i > 2 && step < 3 ? "none" : "block" }}>{s}</span>
              {i < stepNames.length - 1 && <div style={{ flex: 1, height: 1.5, borderRadius: 1, background: i < step ? C.accent : "rgba(20,20,23,0.06)", transition: "background 400ms", marginLeft: 4 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "8px 24px 24px", opacity: trans ? 0 : 1, transform: trans ? "translateY(6px)" : "", transition: "all 180ms" }}>
        <div style={{ width: "100%", maxWidth: 700 }}>

          {/* ═══ STEP 0: UPLOAD ═══ */}
          {step === 0 && (
            <div style={{ animation: "fdUp 400ms ease both" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Suba a foto do seu produto</h2>
              <p style={{ fontSize: 13.5, color: C.text2, marginBottom: 24 }}>A imagem que você enviar será o protagonista do criativo.</p>

              {!uploaded ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); setUploaded(true); }}
                  onClick={() => setUploaded(true)}
                  style={{
                    height: 280, borderRadius: 18, cursor: "pointer",
                    border: `2px dashed ${dragging ? C.accent : C.borderStrong}`,
                    background: dragging ? C.accentPale : C.white,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 12, transition: "all 200ms", color: dragging ? C.accent : C.text3,
                  }}
                >
                  <IcoUpload />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Arraste a foto aqui ou clique para selecionar</div>
                  <div style={{ fontSize: 12 }}>PNG, JPG ou WebP · Máximo 10MB</div>
                </div>
              ) : (
                <div style={{ position: "relative", animation: "scIn 300ms ease both" }}>
                  <div style={{
                    height: 280, borderRadius: 18, overflow: "hidden",
                    background: `linear-gradient(135deg, ${C.accent}15, ${C.accentLight}15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${C.accent}`,
                  }}>
                    <div style={{ width: 140, height: 140, borderRadius: 16, background: `linear-gradient(145deg, ${C.accent}, ${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 30px ${C.accent}30` }}>
                      <IcoImage size={48} stroke="rgba(255,255,255,0.7)" />
                    </div>
                  </div>
                  <button onClick={() => setUploaded(false)} style={{
                    position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 8,
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                  }}><IcoX /></button>
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <IcoCheck size={16} stroke={C.success} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.success }}>produto_burger.jpg — 2.4 MB</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 1: PRESET ═══ */}
          {step === 1 && (
            <div style={{ animation: "fdUp 400ms ease both" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Escolha o estilo do criativo</h2>
              <p style={{ fontSize: 13.5, color: C.text2, marginBottom: 24 }}>Cada estilo tem um visual e custo de créditos diferente.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {presets.map((p, i) => {
                  const sel = preset === p.id;
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => !p.disabled && setPreset(p.id)} disabled={p.disabled} style={{
                      borderRadius: 14, overflow: "hidden", cursor: p.disabled ? "default" : "pointer",
                      border: sel ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                      background: C.white, opacity: p.disabled ? 0.5 : 1,
                      transition: "all 180ms", fontFamily: "inherit", textAlign: "left", padding: 0,
                      animation: `scIn 300ms ${i * 50}ms ease both`,
                    }}>
                      <div style={{ height: 100, background: `linear-gradient(135deg,${p.gradient[0]},${p.gradient[1]})`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={32} stroke="rgba(255,255,255,0.3)" />
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)" }} />
                        {p.tag && <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 10, fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)" }}>{p.tag}</div>}
                        {sel && <div style={{ position: "absolute", top: 8, left: 8, width: 22, height: 22, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><IcoCheck size={13} stroke="#fff" /></div>}
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: sel ? C.accent : C.text1 }}>{p.title}</span>
                          <span style={{ fontSize: 11, color: C.text3, background: C.bg, padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{p.credits} créditos</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.4 }}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ STEP 2: TEXTS ═══ */}
          {step === 2 && (
            <div style={{ animation: "fdUp 400ms ease both" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Configure os textos</h2>
              <p style={{ fontSize: 13.5, color: C.text2, marginBottom: 24 }}>Preencha as informações que aparecerão no criativo.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><IcoType />Headline principal *</label>
                  <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Ex: MEGA PROMOÇÃO DE VERÃO" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 15, fontWeight: 600, fontFamily: "inherit", color: C.text1 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><IcoDollar />Preço</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="R$ 29,90" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 14, fontFamily: "inherit", color: C.text1 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><IcoTag />CTA (chamada)</label>
                  <input value={cta} onChange={e => setCta(e.target.value)} placeholder="Peça agora!" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 14, fontFamily: "inherit", color: C.text1 }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><IcoPhone />Contato (WhatsApp / Instagram)</label>
                  <input value={contact} onChange={e => setContact(e.target.value)} placeholder="@seunegocio ou (63) 99999-0000" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 14, fontFamily: "inherit", color: C.text1 }} />
                </div>
              </div>

              {/* Preview hint */}
              <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: C.accentPale, border: `1px solid ${C.accent}22`, display: "flex", alignItems: "center", gap: 10 }}>
                <IcoSparkle size={16} style={{ color: C.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.text2 }}>O Creatyng vai gerar a tipografia automaticamente com pesos, tamanhos e posições profissionais. Você ajusta depois no chat.</span>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: GENERATING ═══ */}
          {step === 3 && (
            <div style={{ textAlign: "center", paddingTop: 40, animation: "fdUp 400ms ease both" }}>
              {/* Animated orb */}
              <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 32px" }}>
                <div style={{
                  width: 120, height: 120, borderRadius: "50%",
                  background: `conic-gradient(${C.accent}, ${C.accentLight}, ${C.purple}, ${C.accent})`,
                  animation: "spin 2s linear infinite", opacity: 0.15,
                }} />
                <div style={{
                  position: "absolute", inset: 8, borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.accentPale}, ${C.white})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "glow 2s ease-in-out infinite",
                }}>
                  <IcoSparkle size={32} style={{ color: C.accent }} />
                </div>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Criando seu criativo...</h2>

              {/* Stage indicators */}
              <div style={{ maxWidth: 340, margin: "0 auto", textAlign: "left" }}>
                {genStages.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                    opacity: i <= genStage ? 1 : 0.3, transition: "opacity 300ms",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: i < genStage ? C.success : i === genStage ? C.accent : "rgba(20,20,23,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 300ms",
                    }}>
                      {i < genStage ? <IcoCheck size={11} stroke="#fff" /> : i === genStage ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse2 1s infinite" }} /> : null}
                    </div>
                    <span style={{ fontSize: 13, color: i <= genStage ? C.text1 : C.text4, fontWeight: i === genStage ? 600 : 400, transition: "all 300ms" }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Cost note */}
              <div style={{ marginTop: 24, fontSize: 12, color: C.text4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <IcoSparkle size={12} style={{ color: C.text4 }} />-{selectedPreset?.credits || 5} créditos desta geração
              </div>
            </div>
          )}

          {/* ═══ STEP 4: RESULT ═══ */}
          {step === 4 && (
            <div style={{ display: "flex", gap: 20, animation: "fdUp 400ms ease both" }}>
              {/* Preview */}
              <div style={{ flex: "0 0 55%" }}>
                <div style={{
                  borderRadius: 16, overflow: "hidden", position: "relative",
                  background: `linear-gradient(145deg, ${selectedPreset?.gradient[0] || C.accent}, ${selectedPreset?.gradient[1] || C.accentLight})`,
                  aspectRatio: "1", boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />
                  <div style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 2 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{contact || "@seunegocio"}</div>
                  </div>
                  <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 2 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 8, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>{headline || "SEU HEADLINE"}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {price && <span style={{ padding: "5px 14px", borderRadius: 8, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,255,255,0.15)" }}>{price}</span>}
                      {cta && <span style={{ padding: "5px 14px", borderRadius: 8, background: "#fff", color: C.dark, fontSize: 12, fontWeight: 700 }}>{cta}</span>}
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* Action bar */}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><IcoDownload />Exportar</button>
                  <button style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text2 }}><IcoShare /></button>
                </div>
              </div>

              {/* Mini chat */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", minHeight: 400 }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IcoSparkle size={10} style={{ color: "#fff" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Chat de Refinamento</span>
                  </div>
                  <button style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text3, fontFamily: "inherit" }}><IcoExpand />Expandir</button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: "12px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 16, background: `${C.cyan}0A`, border: `1px solid ${C.cyan}20`, fontSize: 11, color: C.cyan, fontWeight: 500 }}>Criativo gerado! Peça ajustes aqui.</span>
                  </div>
                  {chatMsgs.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "85%", padding: "9px 13px", fontSize: 12.5, lineHeight: 1.4,
                        borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                        background: m.role === "user" ? `linear-gradient(135deg,${C.accent},${C.accentLight})` : C.bg,
                        color: m.role === "user" ? "#fff" : C.text1,
                      }}>{m.text}</div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div style={{ padding: "0 14px 6px", display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["Aumenta o preço", "Muda a cor de fundo", "Centraliza o texto"].map((s, i) => (
                    <button key={i} onClick={() => sendChat(s)} style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 10.5, color: C.text3, fontFamily: "inherit", transition: "all 120ms" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}
                    >{s}</button>
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.borderStrong}`, background: C.bg }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat(chatInput)} placeholder="Descreva o ajuste..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 12.5, fontFamily: "inherit", color: C.text1 }} />
                    <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim()} style={{
                      width: 30, height: 30, borderRadius: 8, border: "none",
                      background: chatInput.trim() ? `linear-gradient(135deg,${C.accent},${C.accentLight})` : "rgba(20,20,23,0.06)",
                      cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                      color: chatInput.trim() ? "#fff" : C.text4,
                    }}><IcoSend /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      {step < 3 && (
        <div style={{ padding: "14px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 700, margin: "0 auto", width: "100%" }}>
          {step > 0 ? (
            <button onClick={() => go(-1)} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.borderStrong}`, background: C.white, color: C.text2, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><IcoArrowL />Voltar</button>
          ) : <div />}
          {step < 3 && (
            <button onClick={() => canNext() && (step === 2 ? go(1) : go(1))} disabled={!canNext()} style={{
              padding: "9px 24px", borderRadius: 9, border: "none",
              background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: canNext() ? "pointer" : "default",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
              boxShadow: `0 3px 12px ${C.accent}44`, opacity: canNext() ? 1 : 0.4,
            }}>
              {step === 2 ? (<><IcoSparkle size={15} style={{ color: "#fff" }} />Gerar criativo — {selectedPreset?.credits || 5} créditos</>) : (<>Continuar<IcoArrowR /></>)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
