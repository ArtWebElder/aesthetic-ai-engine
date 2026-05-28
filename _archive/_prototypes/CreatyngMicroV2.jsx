import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#06B6D4",
  purple: "#7C3AED", cyan: "#06B6D4",
};

const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoX = (p) => <Ico size={18} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;
const IcoCheck = (p) => <Ico size={18} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoAlert = (p) => <Ico size={18} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico>;
const IcoInfo = (p) => <Ico size={18} {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Ico>;
const IcoTrash = (p) => <Ico size={18} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Ico>;
const IcoPlus = (p) => <Ico size={18} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoDownload = (p) => <Ico size={18} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoSparkle = (p) => <Ico size={18} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoFolder = (p) => <Ico size={36} {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Ico>;
const IcoSearch = (p) => <Ico size={36} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const IcoZap = (p) => <Ico {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none"/></Ico>;
const IcoBell = (p) => <Ico {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></Ico>;
const IcoUser = (p) => <Ico {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>;
const IcoSettings = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09"/></Ico>;
const IcoLogout = (p) => <Ico size={16} {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>;
const IcoEdit = (p) => <Ico size={16} {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>;
const IcoCopy = (p) => <Ico size={16} {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Ico>;
const IcoLock = (p) => <Ico size={24} {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></Ico>;
const IcoImage = (p) => <Ico size={16} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoShare = (p) => <Ico size={16} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Ico>;
const IcoMoreH = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Ico>;
const IcoCrown = (p) => <Ico size={20} {...p}><path d="M2 20h20L19 8l-5 5-2-7-2 7-5-5z"/><line x1="2" y1="20" x2="22" y2="20"/></Ico>;

/* ─── BACKDROP ─── */
function Backdrop({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,23,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fdIn 150ms ease both" }}>
      <div onClick={e => e.stopPropagation()} style={{ animation: "mdIn 250ms cubic-bezier(.4,0,.2,1) both" }}>{children}</div>
    </div>
  );
}

/* ─── TOAST ─── */
function Toast({ type, message, onClose }) {
  const cfg = {
    success: { color: C.success, icon: <IcoCheck stroke={C.success} />, label: "Sucesso!" },
    error: { color: C.error, icon: <IcoX stroke={C.error} />, label: "Erro" },
    warning: { color: C.warning, icon: <IcoAlert stroke={C.warning} />, label: "Atenção" },
    info: { color: C.info, icon: <IcoInfo stroke={C.info} />, label: "Info" },
  }[type];
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: C.white, borderRadius: 12, border: `1px solid ${cfg.color}33`, boxShadow: "0 8px 30px rgba(0,0,0,0.1)", minWidth: 320, animation: "toastIn 300ms cubic-bezier(.4,0,.2,1) both" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cfg.color}12`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{cfg.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{cfg.label}</div>
        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{message}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.text4, padding: 2 }}><IcoX /></button>
    </div>
  );
}

/* ─── TOOLTIP ─── */
function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          padding: "6px 12px", borderRadius: 8, background: C.dark, color: "#fff", fontSize: 11.5, fontWeight: 500,
          whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", animation: "fdIn 120ms ease both", zIndex: 50,
        }}>
          {text}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${C.dark}` }} />
        </div>
      )}
    </div>
  );
}

/* ─── DROPDOWN ─── */
function Dropdown({ trigger, items, align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer" }}>{trigger}</div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", [align]: 0, minWidth: 200,
          background: C.white, borderRadius: 12, border: `1px solid ${C.border}`,
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)", padding: "6px", zIndex: 50, animation: "mdIn 180ms ease both",
        }}>
          {items.map((item, i) => item.divider ? (
            <div key={i} style={{ height: 1, background: C.border, margin: "4px 0" }} />
          ) : (
            <button key={i} onClick={() => { setOpen(false); item.onClick?.(); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px",
              borderRadius: 8, border: "none", background: "transparent", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, color: item.danger ? C.error : C.text1,
              fontWeight: 400, transition: "background 100ms", textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger ? `${C.error}08` : "rgba(20,20,23,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {item.icon && <span style={{ color: item.danger ? C.error : C.text3 }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PROGRESS INDICATOR ─── */
function ProgressBar({ progress, label, sublabel, color = C.accent }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px", width: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{progress}%</span>
      </div>
      <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(20,20,23,0.06)" }}>
        <div style={{ width: `${progress}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}AA)`, transition: "width 600ms cubic-bezier(.4,0,.2,1)" }} />
      </div>
      {sublabel && <div style={{ fontSize: 11.5, color: C.text3, marginTop: 6 }}>{sublabel}</div>}
    </div>
  );
}

/* ─── CONFETTI ─── */
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 100, delay: Math.random() * 0.6, dur: 1.5 + Math.random() * 1.5,
    color: [C.accent, C.accentLight, C.purple, C.success, C.cyan, C.warning, "#EC4899"][i % 7],
    size: 4 + Math.random() * 6, rot: Math.random() * 360,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: -10, width: p.size, height: p.size * 0.6,
          background: p.color, borderRadius: 1, transform: `rotate(${p.rot}deg)`,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

/* ─── SKELETON ─── */
function Skeleton({ w = "100%", h = 16, r = 6, style: s }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "rgba(20,20,23,0.06)", position: "relative", overflow: "hidden", ...s }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
    </div>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ icon: Icon, title, desc, action, onAction, color = C.text4 }) {
  return (
    <div style={{
      background: C.white, borderRadius: 18, border: `1px solid ${C.border}`,
      padding: "40px 28px 36px", textAlign: "center", width: 300,
      boxShadow: "0 1px 4px rgba(0,0,0,.03)", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle decorative gradient */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(180deg, ${color}06, transparent)`, borderRadius: "18px 18px 0 0" }} />
      {/* Decorative dots */}
      <div style={{ position: "absolute", top: 18, right: 22, width: 4, height: 4, borderRadius: "50%", background: `${color}20` }} />
      <div style={{ position: "absolute", top: 30, right: 36, width: 3, height: 3, borderRadius: "50%", background: `${color}15` }} />
      <div style={{ position: "absolute", top: 22, left: 28, width: 3, height: 3, borderRadius: "50%", background: `${color}15` }} />

      <div style={{
        width: 60, height: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", color, position: "relative",
        background: `linear-gradient(135deg, ${color}10, ${color}06)`,
        border: `1px solid ${color}12`,
      }}><Icon /></div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, position: "relative" }}>{title}</h3>
      <p style={{ fontSize: 12.5, color: C.text3, lineHeight: 1.55, marginBottom: action ? 20 : 0, position: "relative", maxWidth: 240, margin: action ? "0 auto 20px" : "0 auto" }}>{desc}</p>
      {action && (
        <button onClick={onAction} style={{
          padding: "9px 22px", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
          color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: 6, position: "relative",
          boxShadow: `0 3px 10px ${C.accent}33`, transition: "all 180ms",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}
        >{action}</button>
      )}
    </div>
  );
}

/* ─── MAIN ─── */
export default function MicroV2() {
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [section, setSection] = useState("modals");
  const [uploadProg, setUploadProg] = useState(0);
  const [genProg, setGenProg] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [notifCount, setNotifCount] = useState(3);

  const toast = (type, msg) => { const id = Date.now(); setToasts(t => [...t, { id, type, message: msg }]); };
  const rmToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const simUpload = () => {
    setUploading(true); setUploadProg(0);
    const iv = setInterval(() => {
      setUploadProg(p => { if (p >= 100) { clearInterval(iv); setUploading(false); toast("success", "Upload concluído!"); return 100; } return p + 8; });
    }, 120);
  };
  const simGenerate = () => {
    setGenerating(true); setGenProg(0);
    const iv = setInterval(() => {
      setGenProg(p => { if (p >= 100) { clearInterval(iv); setGenerating(false); toast("success", "Criativo gerado com sucesso!"); return 100; } return p + 3; });
    }, 100);
  };
  const triggerConfetti = () => { setConfetti(true); setTimeout(() => setConfetti(false), 3000); };

  const tabs = [
    { id: "modals", label: "Modais" }, { id: "toasts", label: "Toasts" },
    { id: "tooltips", label: "Tooltips" }, { id: "dropdowns", label: "Dropdowns" },
    { id: "progress", label: "Progress" }, { id: "badges", label: "Badges" },
    { id: "paywall", label: "Paywall" }, { id: "confetti", label: "Confetti" },
    { id: "empty", label: "Empty States" }, { id: "skeletons", label: "Skeletons" },
  ];

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: "100vh", background: C.bg, color: C.text1, padding: 32 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fdIn{from{opacity:0}to{opacity:1}}
        @keyframes mdIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      `}</style>

      <Confetti active={confetti} />

      {/* Toast stack */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => <Toast key={t.id} type={t.type} message={t.message} onClose={() => rmToast(t.id)} />)}
      </div>

      {/* ─── MODALS ─── */}
      {modal === "delete" && (
        <Backdrop onClose={() => setModal(null)}>
          <div style={{ background: C.white, borderRadius: 16, padding: 24, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.error}12`, display: "flex", alignItems: "center", justifyContent: "center", color: C.error }}><IcoTrash /></div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>Excluir projeto</h3><p style={{ fontSize: 12, color: C.text3 }}>Ação irreversível.</p></div>
            </div>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.5 }}>Tem certeza que deseja excluir <strong>"Burger Artesanal"</strong>?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.borderStrong}`, background: C.white, color: C.text2, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={() => { setModal(null); toast("success", "Projeto excluído."); }} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: C.error, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Excluir</button>
            </div>
          </div>
        </Backdrop>
      )}
      {modal === "recharge" && (
        <Backdrop onClose={() => setModal(null)}>
          <div style={{ background: C.white, borderRadius: 20, width: 460, boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden" }}>
            {/* Header gradient banner */}
            <div style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
              padding: "24px 28px 20px", position: "relative", overflow: "hidden",
            }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: -10, left: 40, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <IcoSparkle size={20} style={{ color: "#fff" }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Recarregar créditos</h3>
                  </div>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>Saldo atual: <strong style={{ color: "#fff" }}>221 créditos</strong></p>
                </div>
                <button onClick={() => setModal(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", backdropFilter: "blur(4px)" }}><IcoX /></button>
              </div>
              {/* Credit meter bar */}
              <div style={{ marginTop: 14, position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                  <span>221 usados</span><span>500 total</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)" }}>
                  <div style={{ width: "44%", height: "100%", borderRadius: 3, background: "#fff" }} />
                </div>
              </div>
            </div>

            {/* Package selection */}
            <div style={{ padding: "22px 28px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Escolha seu pacote</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { c: 100, p: "R$ 9,90", per: "R$ 0,099", save: null, color: C.text2 },
                  { c: 300, p: "R$ 24,90", per: "R$ 0,083", save: "17%", color: C.accent, pop: true },
                  { c: 500, p: "R$ 39,90", per: "R$ 0,079", save: "20%", color: C.purple },
                ].map((o, i) => (
                  <button key={i} style={{
                    flex: 1, padding: "16px 12px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                    border: o.pop ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: o.pop ? C.accentPale : C.white,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    position: "relative", transition: "all 150ms",
                  }}
                    onMouseEnter={e => { if (!o.pop) { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                    onMouseLeave={e => { if (!o.pop) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; }}}
                  >
                    {o.save && <div style={{ position: "absolute", top: -9, padding: "2px 8px", borderRadius: 5, background: o.pop ? C.accent : C.purple, color: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.02em" }}>Economize {o.save}</div>}
                    <div style={{ fontSize: 26, fontWeight: 700, color: o.pop ? C.accent : C.text1, lineHeight: 1 }}>{o.c}</div>
                    <div style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>créditos</div>
                    <div style={{ width: "100%", height: 1, background: C.border, margin: "6px 0" }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: o.pop ? C.accent : C.text1 }}>{o.p}</div>
                    <div style={{ fontSize: 10, color: C.text4 }}>{o.per} / crédito</div>
                  </button>
                ))}
              </div>

              {/* Custom amount hint */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", background: C.bg, borderRadius: 10 }}>
                <IcoInfo size={15} stroke={C.text4} />
                <span style={{ fontSize: 11.5, color: C.text3 }}>Precisa de mais? <span style={{ color: C.accent, fontWeight: 600, cursor: "pointer" }}>Entre em contato</span> para pacotes corporativos.</span>
              </div>

              {/* CTA */}
              <button onClick={() => { setModal(null); toast("success", "300 créditos adicionados à sua conta!"); }} style={{
                width: "100%", padding: "13px 0", borderRadius: 11, border: "none", marginTop: 16,
                background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 4px 16px ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 180ms",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 22px ${C.accent}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 16px ${C.accent}44`; }}
              >
                <IcoSparkle size={16} style={{ color: "#fff" }} />
                Adicionar 300 créditos — R$ 24,90
              </button>

              {/* Security note */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 }}>
                <IcoLock size={12} stroke={C.text4} />
                <span style={{ fontSize: 10.5, color: C.text4 }}>Pagamento seguro via Stripe</span>
              </div>
            </div>
          </div>
        </Backdrop>
      )}
      {modal === "export" && (
        <Backdrop onClose={() => setModal(null)}>
          <div style={{ background: C.white, borderRadius: 20, width: 440, boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden" }}>
            {/* Header with preview thumbnail */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark}, #2a2a30)`, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IcoImage size={22} stroke="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Exportar criativo</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Burger Artesanal — 1080×1080px</p>
              </div>
              <button onClick={() => setModal(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}><IcoX /></button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              {/* Format selection */}
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Formato</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {[
                  { fmt: "PNG", desc: "Alta qualidade", size: "~2.4 MB", icon: "◆", rec: true },
                  { fmt: "JPG", desc: "Comprimido", size: "~800 KB", icon: "●" },
                  { fmt: "WebP", desc: "Moderno", size: "~500 KB", icon: "▲" },
                ].map((f, i) => (
                  <button key={i} onClick={() => { setModal(null); toast("success", `Exportado como ${f.fmt}!`); }} style={{
                    flex: 1, padding: "14px 10px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                    border: f.rec ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: f.rec ? C.accentPale : C.white,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all 150ms", position: "relative",
                  }}
                    onMouseEnter={e => { if (!f.rec) { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                    onMouseLeave={e => { if (!f.rec) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; }}}
                  >
                    {f.rec && <div style={{ position: "absolute", top: -8, padding: "2px 8px", borderRadius: 5, background: C.accent, color: "#fff", fontSize: 9, fontWeight: 700 }}>Recomendado</div>}
                    <div style={{ fontSize: 18, fontWeight: 700, color: f.rec ? C.accent : C.text1 }}>{f.fmt}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{f.desc}</div>
                    <div style={{ fontSize: 10, color: C.text4, fontFamily: "monospace" }}>{f.size}</div>
                  </button>
                ))}
              </div>

              {/* Aspect ratio */}
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Proporção</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[
                  { r: "1:1", w: 18, h: 18 }, { r: "9:16", w: 13, h: 20 },
                  { r: "16:9", w: 22, h: 14 }, { r: "4:5", w: 16, h: 20 },
                ].map((a, i) => (
                  <button key={i} style={{
                    flex: 1, padding: "10px 0", borderRadius: 9, border: i === 0 ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: i === 0 ? C.accentPale : C.white, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 150ms",
                  }}
                    onMouseEnter={e => { if (i !== 0) e.currentTarget.style.borderColor = C.borderStrong; }}
                    onMouseLeave={e => { if (i !== 0) e.currentTarget.style.borderColor = C.border; }}
                  >
                    <div style={{ width: a.w, height: a.h, borderRadius: 2, border: `1.5px solid ${i === 0 ? C.accent : C.text4}` }} />
                    <span style={{ fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.accent : C.text2 }}>{a.r}</span>
                  </button>
                ))}
              </div>

              {/* Download info */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: C.text4, fontSize: 10.5 }}>
                <IcoDownload size={13} /><span>0 créditos — export é gratuito</span>
              </div>
            </div>
          </div>
        </Backdrop>
      )}
      {modal === "paywall" && (
        <Backdrop onClose={() => setModal(null)}>
          <div style={{ background: C.white, borderRadius: 20, width: 440, boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden" }}>
            {/* Header gradient */}
            <div style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
              padding: "28px 24px 22px", position: "relative", textAlign: "center", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -15, right: -15, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", bottom: -10, left: 30, width: 45, height: 45, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              <button onClick={() => setModal(null)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", backdropFilter: "blur(4px)" }}><IcoX /></button>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <IcoLock size={24} stroke="#fff" />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Desbloqueie o poder total</h3>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>O <strong style={{ color: "#fff" }}>Chat AI de refinamento</strong> é exclusivo do plano Pro.</p>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>
              {/* What you get */}
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>O que o Pro desbloqueia</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Chat AI ilimitado", icon: IcoSparkle },
                  { label: "Todos os templates", icon: IcoImage },
                  { label: "Sem marca d'água", icon: IcoCheck },
                  { label: "Brand Kit completo", icon: IcoCrown },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    borderRadius: 9, background: C.bg, fontSize: 12.5, color: C.text1, fontWeight: 500,
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.accent }}>
                      <f.icon size={13} />
                    </div>
                    {f.label}
                  </div>
                ))}
              </div>

              {/* Price highlight */}
              <div style={{ background: C.accentPale, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, border: `1px solid ${C.accent}22` }}>
                <div>
                  <div style={{ fontSize: 12, color: C.text3 }}>Plano Pro mensal</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>R$ 49</span>
                    <span style={{ fontSize: 12, color: C.text3 }}>/mês</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.text3 }}>equivale a</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>R$ 0,098 / crédito</div>
                </div>
              </div>

              <button onClick={() => { setModal(null); toast("info", "Redirecionando para o checkout..."); }} style={{
                width: "100%", padding: "13px 0", borderRadius: 11, border: "none",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 4px 16px ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "all 180ms", marginBottom: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              ><IcoCrown size={16} stroke="#fff" />Assinar Pro agora</button>
              <button onClick={() => setModal(null)} style={{ width: "100%", background: "none", border: "none", color: C.text4, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "6px 0" }}>Continuar no plano grátis</button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>C</span></div>
        <span style={{ fontWeight: 700, fontSize: 17 }}>Creatyng</span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 8 }}>Micro-interações v2</span>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 2, background: "rgba(20,20,23,0.04)", borderRadius: 8, padding: 3, marginBottom: 28, flexWrap: "wrap", width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", fontFamily: "inherit",
            background: section === t.id ? C.white : "transparent", color: section === t.id ? C.text1 : C.text3,
            fontWeight: section === t.id ? 600 : 400, fontSize: 12.5, cursor: "pointer",
            boxShadow: section === t.id ? "0 1px 3px rgba(0,0,0,.06)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ SECTIONS ═══ */}
      {section === "modals" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Modais</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 18 }}>Backdrop blur + animação de entrada.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setModal("delete")} style={{ padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C.error}`, background: "transparent", color: C.error, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><IcoTrash size={15} />Excluir projeto</button>
            <button onClick={() => setModal("recharge")} style={{ padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C.accent}`, background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><IcoPlus size={15} />Recarregar</button>
            <button onClick={() => setModal("export")} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><IcoDownload size={15} />Exportar</button>
          </div>
        </div>
      )}

      {section === "toasts" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Toasts</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 18 }}>Auto-dismiss 3.5s. Ícone + título + mensagem.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{ t: "success", l: "Sucesso", m: "Criativo salvo!" }, { t: "error", l: "Erro", m: "Falha na geração." }, { t: "warning", l: "Atenção", m: "12 créditos restantes." }, { t: "info", l: "Info", m: "Nova feature: Multi-formato!" }].map(x => (
              <button key={x.t} onClick={() => toast(x.t, x.m)} style={{ padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C[x.t]}`, background: `${C[x.t]}08`, color: C[x.t], fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{x.l}</button>
            ))}
          </div>
        </div>
      )}

      {section === "tooltips" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Tooltips</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Hover nos elementos abaixo.</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Tooltip text="Criar novo projeto"><button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}><IcoPlus size={15} />Criar</button></Tooltip>
            <Tooltip text="Baixar em PNG, JPG ou WebP"><button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", color: C.text2, display: "flex" }}><IcoDownload size={18} /></button></Tooltip>
            <Tooltip text="Compartilhar via link"><button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", color: C.text2, display: "flex" }}><IcoShare /></button></Tooltip>
            <Tooltip text="221 créditos restantes"><div style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", gap: 5, cursor: "default" }}><IcoSparkle size={15} style={{ color: C.accent }} /><span style={{ fontWeight: 700, color: C.accent, fontSize: 13 }}>221</span></div></Tooltip>
            <Tooltip text="Configurações da conta"><button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", color: C.text2, display: "flex" }}><IcoSettings /></button></Tooltip>
          </div>
        </div>
      )}

      {section === "dropdowns" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Dropdowns</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Clique para abrir. Fecha ao clicar fora.</p>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <Dropdown
              trigger={<div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>R</div>}
              items={[
                { icon: <IcoUser size={16} />, label: "Meu perfil" },
                { icon: <IcoSettings />, label: "Configurações" },
                { icon: <IcoSparkle size={16} style={{ color: C.accent }} />, label: "221 créditos", onClick: () => toast("info", "Vá em Billing para recarregar.") },
                { divider: true },
                { icon: <IcoLogout />, label: "Sair", danger: true },
              ]}
              align="left"
            />
            <Dropdown
              trigger={<button style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", fontSize: 13, color: C.text2 }}><IcoMoreH />Opções do projeto</button>}
              items={[
                { icon: <IcoEdit />, label: "Renomear" },
                { icon: <IcoCopy />, label: "Duplicar" },
                { icon: <IcoDownload size={16} />, label: "Exportar", onClick: () => setModal("export") },
                { icon: <IcoShare />, label: "Compartilhar" },
                { divider: true },
                { icon: <IcoTrash size={16} />, label: "Excluir", danger: true, onClick: () => setModal("delete") },
              ]}
              align="left"
            />
          </div>
        </div>
      )}

      {section === "progress" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Progress Indicators</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Simule upload e geração.</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 20 }}>
            <ProgressBar progress={uploading ? uploadProg : 0} label="Upload da imagem" sublabel={uploading ? "Enviando..." : "Pronto para upload"} color={C.cyan} />
            <ProgressBar progress={generating ? genProg : 0} label="Gerando criativo" sublabel={generating ? "Gemini processando..." : "Aguardando"} color={C.accent} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={simUpload} disabled={uploading} style={{ padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C.cyan}`, background: `${C.cyan}08`, color: C.cyan, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: uploading ? 0.5 : 1 }}>Simular upload</button>
            <button onClick={simGenerate} disabled={generating} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: generating ? 0.5 : 1 }}>Simular geração</button>
          </div>
        </div>
      )}

      {section === "badges" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Notification Badges</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Clique no sino para limpar.</p>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <button onClick={() => setNotifCount(n => Math.max(n - 1, 0))} style={{ position: "relative", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text2 }}>
              <IcoBell size={22} />
              {notifCount > 0 && (
                <div style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: C.error, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.white}`, animation: "pulse 1.5s infinite" }}>{notifCount}</div>
              )}
            </button>
            <button onClick={() => setNotifCount(5)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12.5, color: C.text2, cursor: "pointer", fontFamily: "inherit" }}>Reset ({notifCount})</button>
            <span style={{ fontSize: 12, color: C.text3 }}>Clique no sino para decrementar</span>
          </div>
        </div>
      )}

      {section === "paywall" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Paywall Modal</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 18 }}>Aparece ao tentar usar feature Pro sendo Free.</p>
          <button onClick={() => setModal("paywall")} style={{ padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${C.accent}`, background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}><IcoLock size={15} />Tentar usar Chat AI (Free)</button>
        </div>
      )}

      {section === "confetti" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Confetti Celebration</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 18 }}>Dispara após o primeiro criativo gerado.</p>
          <button onClick={triggerConfetti} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 14px ${C.accent}44` }}><IcoSparkle size={18} style={{ color: "#fff" }} />Celebrar primeiro criativo!</button>
        </div>
      )}

      {section === "empty" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Empty States</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Telas vazias contextuais.</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <EmptyState icon={IcoFolder} title="Nenhum projeto" desc="Crie seu primeiro criativo profissional e ele aparecerá aqui." action={<><IcoPlus size={14} />Criar projeto</>} color={C.accent} />
            <EmptyState icon={IcoZap} title="Créditos esgotados" desc="Seus créditos acabaram este mês. Recarregue para continuar criando." action={<><IcoSparkle size={14} style={{ color: "#fff" }} />Recarregar</>} color={C.warning} />
            <EmptyState icon={IcoSearch} title="Sem resultados" desc="Não encontramos nada com esses filtros. Tente ajustar a busca." color={C.text4} />
          </div>
        </div>
      )}

      {section === "skeletons" && (
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Loading Skeletons</h2><p style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Shimmer contínuo.</p>
          <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", width: 210 }}>
                <Skeleton w="100%" h={115} r={0} /><div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}><Skeleton w="65%" h={13} /><Skeleton w="100%" h={9} /><Skeleton w="40%" h={9} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", maxWidth: 480 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: `1px solid ${C.border}` }}>
                <Skeleton w={32} h={32} r={8} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><Skeleton w="45%" h={11} /><Skeleton w="28%" h={9} /></div><Skeleton w={50} h={22} r={6} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
