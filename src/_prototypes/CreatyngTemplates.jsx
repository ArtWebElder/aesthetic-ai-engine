import { useState, useEffect } from "react";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  cardShadow: "0 1px 3px rgba(20,20,23,0.04)",
  error: "#EF4444",
};

/* ─── ICONS ─── */
const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoHome = (p) => <Ico {...p}><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z"/><polyline points="9 21 9 14 15 14 15 21"/></Ico>;
const IcoGrid = (p) => <Ico {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ico>;
const IcoCompass = (p) => <Ico {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="currentColor" stroke="none"/></Ico>;
const IcoFolder = (p) => <Ico {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Ico>;
const IcoSettings = (p) => <Ico {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.33.55.84.94 1.51 1H21a2 2 0 010 4h-.09c-.67.06-1.18.45-1.51 1z"/></Ico>;
const IcoHelp = (p) => <Ico {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ico>;
const IcoLogout = (p) => <Ico {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>;
const IcoPlus = (p) => <Ico {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoSearch = (p) => <Ico {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const IcoChevL = (p) => <Ico size={15} {...p}><polyline points="15 18 9 12 15 6"/></Ico>;
const IcoChevR = (p) => <Ico size={15} {...p}><polyline points="9 18 15 12 9 6"/></Ico>;
const IcoZap = (p) => <Ico {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.accent} stroke={C.accent}/></Ico>;
const IcoSun = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></Ico>;
const IcoSparkle = (p) => <Ico size={15} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoCamera = (p) => <Ico {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
const IcoPalette = (p) => <Ico {...p}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.4-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></Ico>;
const IcoStar = (p) => <Ico {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>;
const IcoLayers = (p) => <Ico {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ico>;
const IcoFilm = (p) => <Ico {...p}><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></Ico>;
const IcoRefresh = (p) => <Ico {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></Ico>;
const IcoScissors = (p) => <Ico {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></Ico>;
const IcoType = (p) => <Ico {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Ico>;
const IcoArrowR = (p) => <Ico size={16} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ico>;
const IcoMaximize = (p) => <Ico {...p}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></Ico>;
const IcoSmartphone = (p) => <Ico {...p}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></Ico>;
const IcoCopy = (p) => <Ico {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Ico>;

/* ─── TEMPLATES DATA ─── */
const templates = [
  {
    id: "food-pop", title: "Food / Pop", category: "food",
    desc: "Gera cenas cinematográficas com seu produto real. Iluminação profissional, ingredientes voando e tipografia de agência.",
    gradient: ["#ff713d","#FFB088"], icon: IcoCamera, tag: "Popular", credits: 5,
  },
  {
    id: "pop-design", title: "Pop Design", category: "design",
    desc: "Subject isolado com remoção de fundo automática, cores vibrantes e tipografia decorativa gigante.",
    gradient: ["#7C3AED","#C084FC"], icon: IcoPalette, tag: "Novo", credits: 8,
  },
  {
    id: "editorial", title: "Editorial", category: "design",
    desc: "Layout elegante estilo revista premium com composição sofisticada e tipografia refinada.",
    gradient: ["#1E293B","#64748B"], icon: IcoLayers, tag: "Em breve", credits: 6,
  },
  {
    id: "neon", title: "Neon Glow", category: "food",
    desc: "Efeito néon vibrante com brilhos, reflexos e atmosfera noturna para destaque máximo.",
    gradient: ["#06B6D4","#818CF8"], icon: IcoStar, tag: "Em breve", credits: 7,
  },
  {
    id: "ugc-video", title: "UGC Product Video", category: "video",
    desc: "Cria vídeos estilo conteúdo orgânico com pessoas reais apresentando seu produto.",
    gradient: ["#EC4899","#F9A8D4"], icon: IcoFilm, tag: "Em breve", credits: 12,
  },
  {
    id: "ad-cloner", title: "Clone de Anúncio", category: "design",
    desc: "Transforma o anúncio de referência em um criativo novo com a identidade da sua marca.",
    gradient: ["#F59E0B","#FCD34D"], icon: IcoCopy, tag: "Em breve", credits: 10,
  },
  {
    id: "resizer", title: "Multi-Formato", category: "utility",
    desc: "Converte seu criativo para múltiplos formatos e proporções sem regenerar a imagem.",
    gradient: ["#10B981","#6EE7B7"], icon: IcoMaximize, tag: "Em breve", credits: 2,
  },
  {
    id: "statics-reels", title: "Estáticos para Reels", category: "video",
    desc: "Transforma seus criativos estáticos em vídeos com movimento e elementos dinâmicos.",
    gradient: ["#8B5CF6","#DDD6FE"], icon: IcoRefresh, tag: "Em breve", credits: 10,
  },
  {
    id: "mockup", title: "Mockup de Tela", category: "utility",
    desc: "Gera fotos do seu produto ou tela de app em contexto realista com pessoas e cenários.",
    gradient: ["#0EA5E9","#BAE6FD"], icon: IcoSmartphone, tag: "Em breve", credits: 6,
  },
];

const categories = [
  { id: "all", label: "Todos" },
  { id: "food", label: "Food" },
  { id: "design", label: "Design" },
  { id: "video", label: "Vídeo" },
  { id: "utility", label: "Utilidades" },
];

/* ─── TEMPLATE CARD ─── */
function TemplateCard({ t, i, ready }) {
  const [hov, setHov] = useState(false);
  const Icon = t.icon;
  const coming = t.tag === "Em breve";

  return (
    <div
      style={{
        background: C.white, borderRadius: 14, overflow: "hidden",
        border: hov && !coming ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
        boxShadow: C.cardShadow, cursor: coming ? "default" : "pointer",
        transition: "all 200ms ease", opacity: coming ? 0.75 : 1,
        ...(hov && !coming ? { background: `linear-gradient(180deg, ${C.accentPale} 0%, ${C.white} 40%)` } : {}),
        animation: ready ? `scIn 340ms ${60 + i * 40}ms ease both` : "none",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Image area */}
      <div style={{
        height: 155, position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,
      }}>
        {/* Decorative shapes simulating creative previews */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <Icon size={40} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
        </div>
        <div style={{ position: "absolute", top: "20%", right: "15%", width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "10%", width: 35, height: 35, borderRadius: 8, background: "rgba(255,255,255,0.06)", transform: "rotate(15deg)" }} />
        {/* Arrow decoration */}
        <div style={{ position: "absolute", top: "45%", left: "32%", transform: "translate(-50%,-50%) rotate(-15deg)", opacity: 0.15 }}>
          <svg width="60" height="20" viewBox="0 0 60 20" fill="none"><path d="M0 10h50m0 0l-8-8m8 8l-8 8" stroke="#fff" strokeWidth="2"/></svg>
        </div>
        {/* Second element */}
        <div style={{ position: "absolute", top: "45%", right: "12%", transform: "translateY(-50%)", opacity: 0.12 }}>
          <svg width="50" height="65" viewBox="0 0 50 65" fill="none"><rect x="5" y="5" width="40" height="55" rx="4" stroke="#fff" strokeWidth="1.5"/><rect x="15" y="0" width="30" height="45" rx="4" stroke="#fff" strokeWidth="1" opacity=".6"/></svg>
        </div>

        {/* Tag badge */}
        {t.tag && (
          <div style={{
            position: "absolute", top: 10, right: 10, padding: "3px 9px", borderRadius: 6,
            fontSize: 10, fontWeight: 600, zIndex: 2,
            background: t.tag === "Popular" ? C.accent : t.tag === "Novo" ? "#7C3AED" : "rgba(255,255,255,0.15)",
            color: "#fff",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>{t.tag}</div>
        )}

        {/* Glass reflection */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)" }} />
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: C.text1, lineHeight: 1.2 }}>{t.title}</h3>
          {!coming && (
            <span style={{ fontSize: 10.5, color: C.text3, background: C.bg, padding: "2px 7px", borderRadius: 4, fontWeight: 500, whiteSpace: "nowrap" }}>
              {t.credits} créditos
            </span>
          )}
        </div>
        <p style={{
          fontSize: 12, color: C.text2, lineHeight: 1.45, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{t.desc}</p>
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function TemplatesPage() {
  const [col, setCol] = useState(false);
  const [nav, setNav] = useState("templates");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const anim = (d) => ready ? { animation: `fdUp 450ms ${d}ms ease both` } : {};

  const filtered = templates.filter(t => {
    if (filter !== "all" && t.category !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const SideBtn = ({ icon: Icon, label, id, danger }) => (
    <button onClick={() => setNav(id)} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: col ? "10px 0" : "10px 18px", justifyContent: col ? "center" : "flex-start",
      margin: "1px 8px", borderRadius: 8, cursor: "pointer",
      background: nav === id ? `${C.accent}14` : "transparent",
      color: danger ? C.error : (nav === id ? C.accent : C.text2),
      fontWeight: nav === id ? 600 : 400, fontSize: 13.5,
      border: "none", width: col ? 48 : "calc(100% - 16px)", fontFamily: "inherit", transition: "all 150ms",
    }}
      onMouseEnter={e => { if (nav !== id) e.currentTarget.style.background = "rgba(20,20,23,0.03)"; }}
      onMouseLeave={e => { if (nav !== id) e.currentTarget.style.background = "transparent"; }}
    ><Icon size={19} />{!col && <span>{label}</span>}</button>
  );

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.14)' stroke-width='0.6'/%3E%3C/svg%3E")`;
  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`;

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", background: C.bg, minHeight: "100vh", display: "flex", color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        input:focus{outline:none}
        input::placeholder{color:${C.text4}}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: col ? 68 : 244, minWidth: col ? 68 : 244, background: C.white,
        borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
        transition: "all 260ms cubic-bezier(.4,0,.2,1)", position: "relative", zIndex: 20, overflow: "visible",
      }}>
        <button onClick={() => setCol(!col)} style={{
          position: "absolute", right: -14, top: 72, width: 28, height: 28, borderRadius: "50%",
          background: C.white, border: `1px solid ${C.borderStrong}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, color: C.text2,
        }}>{col ? <IcoChevR /> : <IcoChevL />}</button>

        <div style={{ padding: col ? "18px 0" : "18px 18px", display: "flex", alignItems: "center", justifyContent: col ? "center" : "flex-start", gap: 9, borderBottom: `1px solid ${C.border}`, minHeight: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>C</span>
          </div>
          {!col && <span style={{ fontWeight: 700, fontSize: 17, color: C.text1 }}>Creatyng</span>}
        </div>

        <button style={{
          margin: col ? "14px 8px" : "14px 14px", padding: "10px 0",
          background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff",
          border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: col ? 0 : 8,
          boxShadow: `0 3px 10px ${C.accent}44`, fontFamily: "inherit",
        }}><IcoPlus size={17} />{!col && "Nova Criação"}</button>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 2 }}>
          <SideBtn icon={IcoHome} label="Home" id="home" />
          <SideBtn icon={IcoGrid} label="Templates" id="templates" />
          <SideBtn icon={IcoCompass} label="Explore" id="explore" />
          <SideBtn icon={IcoFolder} label="Projetos" id="projects" />
          <div style={{ flex: 1 }} />
          <div style={{ height: 1, background: C.border, margin: "8px 14px" }} />
          <SideBtn icon={IcoSettings} label="Configurações" id="settings" />
          <SideBtn icon={IcoHelp} label="Ajuda" id="help" />
          <div style={{ marginBottom: 10 }}><SideBtn icon={IcoLogout} label="Sair" id="logout" danger /></div>
        </nav>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* HEADER */}
        <header style={{
          height: 56, padding: "0 26px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`, background: "rgba(245,245,243,0.8)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 15,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", background: "rgba(20,20,23,0.035)", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text3, cursor: "pointer", minWidth: 200 }}>
              <IcoSearch size={15} /><span>Buscar...</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: C.text4, background: "rgba(20,20,23,0.05)", padding: "1px 5px", borderRadius: 3, fontWeight: 600, fontFamily: "monospace" }}>⌘K</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, cursor: "pointer" }}>
              <IcoSparkle /><span style={{ fontWeight: 700, color: C.accent }}>221</span><span style={{ color: C.text3, fontSize: 11.5 }}>créditos</span>
            </div>
            <button style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${C.accent}`, background: C.accentPale, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}>
              <IcoZap size={13} />Upgrade
            </button>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 3px" }} />
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>R</div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          background: `
            radial-gradient(ellipse 700px 400px at 50% 0%, rgba(255,113,61,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 500px 300px at 85% 5%, rgba(255,155,112,0.06) 0%, transparent 60%),
            ${gridSvg}, ${noiseSvg}, ${C.bg}
          `,
        }}>
          {/* Hero banner */}
          <div style={{
            padding: "40px 36px 32px", textAlign: "center",
            background: "linear-gradient(180deg, rgba(255,113,61,0.06) 0%, transparent 100%)",
            borderBottom: `1px solid ${C.border}`, ...anim(0),
          }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text1, marginBottom: 6 }}>
              Explore os templates do Creatyng
            </h1>
            <p style={{ fontSize: 14.5, color: C.text2, maxWidth: 440, margin: "0 auto" }}>
              Encontre o tipo de criativo ideal para seu negócio. Comece a criar.
            </p>
          </div>

          {/* Filters + Search */}
          <div style={{
            padding: "18px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.4)",
            backdropFilter: "blur(8px)", position: "sticky", top: 56, zIndex: 10,
            ...anim(60),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text3, marginRight: 4 }}>Filtrar</span>
              {categories.map(c => {
                const active = filter === c.id;
                return (
                  <button key={c.id} onClick={() => setFilter(c.id)} style={{
                    padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: active ? C.accentPale : C.white,
                    color: active ? C.accent : C.text2, fontWeight: active ? 600 : 400,
                    fontSize: 12.5, transition: "all 150ms",
                  }}>{c.label}</button>
                );
              })}
            </div>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7, padding: "6px 12px",
              background: C.white, borderRadius: 8, border: `1px solid ${C.borderStrong}`,
              width: 200,
            }}>
              <IcoSearch size={14} stroke={C.text4} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar template..."
                style={{ flex: 1, border: "none", background: "transparent", fontSize: 12.5, fontFamily: "inherit", color: C.text1 }}
              />
            </div>
          </div>

          {/* Grid */}
          <div style={{ padding: "24px 36px 48px" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18,
            }}>
              {filtered.map((t, i) => <TemplateCard key={t.id} t={t} i={i} ready={ready} />)}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.text3 }}>
                <IcoSearch size={36} stroke={C.text4} style={{ margin: "0 auto 12px", display: "block" }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Nenhum template encontrado</div>
                <div style={{ fontSize: 13 }}>Tente ajustar os filtros ou o termo de busca.</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
