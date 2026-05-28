import { useState, useEffect, useRef, useCallback } from "react";

const LOGO_FAVICON = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABnAGoDASIAAhEBAxEB/8QAHAAAAQQDAQAAAAAAAAAAAAAAAAMGBwgCBAUB/8QASRAAAQMDAgMCBCf/2Q==";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA", accentBorder: "#ff713d",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981",
  cardShadow: "0 1px 3px rgba(20,20,23,0.04)", cardHoverShadow: "0 8px 24px rgba(20,20,23,0.08)",
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
const IcoChevL = (p) => <Ico size={18} {...p}><polyline points="15 18 9 12 15 6"/></Ico>;
const IcoChevR = (p) => <Ico size={18} {...p}><polyline points="9 18 15 12 9 6"/></Ico>;
const IcoZap = (p) => <Ico {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.accent} stroke={C.accent}/></Ico>;
const IcoImage = (p) => <Ico {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoCamera = (p) => <Ico {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
const IcoPalette = (p) => <Ico {...p}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.4-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></Ico>;
const IcoStar = (p) => <Ico {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>;
const IcoLayers = (p) => <Ico {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ico>;
const IcoSun = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></Ico>;
const IcoSparkle = (p) => <Ico size={15} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoMenu = (p) => <Ico size={18} {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Ico>;
const IcoPanel = (p) => <Ico size={18} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></Ico>;

/* ─── DATA ─── */
const features = [
  { id: "food-pop", title: "Food / Pop", short: "Cena cinematográfica com seu produto real.", desc: "O Gemini gera o ambiente, ingredientes voando e iluminação profissional a partir da foto do seu prato. Tipografia de agência inclusa.", gradient: "linear-gradient(135deg, #ff713d 0%, #FFB088 100%)", icon: IcoCamera, tag: "Popular" },
  { id: "pop-design", title: "Pop Design", short: "Subject isolado + fundo colorido vibrante.", desc: "Remoção de fundo automática, cores vibrantes, tipografia decorativa gigante. Design gráfico puro sem fotografia de cena.", gradient: "linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)", icon: IcoPalette, tag: "Novo" },
  { id: "editorial", title: "Editorial", short: "Layout elegante estilo revista premium.", desc: "Composição sofisticada com grids editoriais, tipografia refinada e acabamento de alto nível para marcas que buscam sofisticação.", gradient: "linear-gradient(135deg, #1E293B 0%, #64748B 100%)", icon: IcoLayers, tag: "Em breve" },
  { id: "neon", title: "Neon Glow", short: "Efeito néon vibrante para destaque.", desc: "Brilhos, reflexos e atmosfera noturna para dar destaque máximo ao seu produto com iluminação dramática e cores neon.", gradient: "linear-gradient(135deg, #06B6D4 0%, #818CF8 100%)", icon: IcoStar, tag: "Em breve" },
];

const projects = [
  { id: 1, name: "Promo Açaí Tropical", preset: "Food/Pop", date: "Há 2h", color: "#7C3AED", hue: 270 },
  { id: 2, name: "Burger Artesanal", preset: "Food/Pop", date: "Há 1 dia", color: "#ff713d", hue: 15 },
  { id: 3, name: "Sushi Festival", preset: "Pop Design", date: "Há 3 dias", color: "#EC4899", hue: 330 },
  { id: 4, name: "Pizza Weekend", preset: "Food/Pop", date: "Há 5 dias", color: "#10B981", hue: 160 },
  { id: 5, name: "Café Especial", preset: "Pop Design", date: "Há 1 sem", color: "#06B6D4", hue: 190 },
  { id: 6, name: "Doces & Bolos", preset: "Food/Pop", date: "Há 2 sem", color: "#F59E0B", hue: 38 },
  { id: 7, name: "Sorvete Verão", preset: "Pop Design", date: "Há 3 sem", color: "#EC4899", hue: 340 },
];

const inspo = [
  { id: 1, color: "#FF6B35", h: 220, label: "Hamburgueria Premium", feat: "Food/Pop" },
  { id: 2, color: "#7C3AED", h: 175, label: "Açaí Bowl Verão", feat: "Pop Design" },
  { id: 3, color: "#EC4899", h: 260, label: "Pizza Artesanal", feat: "Food/Pop" },
  { id: 4, color: "#06B6D4", h: 190, label: "Sushi Experience", feat: "Pop Design" },
  { id: 5, color: "#F59E0B", h: 235, label: "Café Gourmet", feat: "Food/Pop" },
  { id: 6, color: "#10B981", h: 180, label: "Doceria Fina", feat: "Pop Design" },
  { id: 7, color: "#1E293B", h: 210, label: "Churrascaria BBQ", feat: "Food/Pop" },
  { id: 8, color: "#DC2626", h: 245, label: "Mexicano Picante", feat: "Food/Pop" },
];

/* ─── Carousel nav arrows ─── */
function CarouselNav({ scrollRef, showAll = true, label = "Ver todos" }) {
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: "smooth" });
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => scroll(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoChevL /></button>
      <button onClick={() => scroll(1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoChevR /></button>
      {showAll && <button style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12.5, fontWeight: 500, color: C.text2, cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>{label}</button>}
    </div>
  );
}

/* ─── FEATURE CARD ─── */
function FeatureCard({ f, i, ready }) {
  const [hov, setHov] = useState(false);
  const Icon = f.icon;
  const coming = f.tag === "Em breve";

  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 0 }}
      onMouseEnter={() => !coming && setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Card */}
      <div style={{
        width: 195, height: 155, borderRadius: 12, background: f.gradient, position: "relative",
        overflow: "hidden", cursor: coming ? "default" : "pointer",
        border: hov ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
        opacity: coming ? 0.6 : 1, transition: "border 180ms ease, opacity 180ms ease",
        display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 14,
        animation: ready ? `scIn 350ms ${80 + i * 60}ms ease both` : "none",
      }}>
        <div style={{ position: "absolute", top: 12, left: 12, opacity: 0.85, zIndex: 2 }}>
          <Icon size={24} stroke="#fff" strokeWidth={1.8} />
        </div>
        <div style={{
          position: "absolute", top: 10, right: 10, padding: "3px 9px", borderRadius: 6,
          fontSize: 10, fontWeight: 600, zIndex: 2,
          background: "rgba(255,255,255,0.15)", color: coming ? "rgba(255,255,255,0.55)" : "#fff",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}>{f.tag}</div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)", borderRadius: "12px 12px 0 0" }} />

        {/* Normal content */}
        <div style={{ position: "relative", zIndex: 2, opacity: hov ? 0 : 1, transition: "opacity 150ms ease" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 2, lineHeight: 1.2 }}>{f.title}</div>
          <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{f.short}</div>
        </div>

        {/* Hover overlay with CTA */}
        {hov && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5, borderRadius: 11,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fdIn 150ms ease both",
          }}>
            <button style={{
              padding: "9px 22px", borderRadius: 9, border: "none", fontFamily: "inherit",
              background: "#fff", color: C.dark, fontWeight: 700, fontSize: 13,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}>Criar agora</button>
          </div>
        )}
      </div>

      {/* Description dropdown below card */}
      <div style={{
        maxHeight: hov ? 140 : 0, opacity: hov ? 1 : 0, overflow: "hidden",
        transition: "max-height 250ms ease, opacity 200ms ease",
        marginTop: hov ? 6 : 0,
      }}>
        <div style={{
          width: 195, background: C.white, borderRadius: 10, padding: "10px 12px",
          border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.4 }}>{f.desc}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─── */
export default function Dashboard() {
  const [col, setCol] = useState(false);
  const [nav, setNav] = useState("home");
  const [hProj, setHProj] = useState(null);
  const [hInsp, setHInsp] = useState(null);
  const [inspoTab, setInspoTab] = useState("explore");
  const [ready, setReady] = useState(false);
  const featRef = useRef(null);
  const projRef = useRef(null);
  useEffect(() => { setReady(true); }, []);
  const anim = (d) => ready ? { animation: `fdUp 450ms ${d}ms ease both` } : {};

  const SideBtn = ({ icon: Icon, label, id, danger }) => (
    <button onClick={() => setNav(id)} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: col ? "10px 0" : "10px 18px", justifyContent: col ? "center" : "flex-start",
      margin: "1px 8px", borderRadius: 8, cursor: "pointer",
      background: nav === id ? `${C.accent}14` : "transparent",
      color: danger ? "#EF4444" : (nav === id ? C.accent : C.text2),
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
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fdIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: col ? 68 : 244, minWidth: col ? 68 : 244, background: C.white,
        borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
        transition: "all 260ms cubic-bezier(.4,0,.2,1)", position: "relative", zIndex: 20, overflow: "visible",
      }}>
        {/* Collapse button - visible, outside sidebar edge */}
        <button onClick={() => setCol(!col)} style={{
          position: "absolute", right: -14, top: 72, width: 28, height: 28, borderRadius: "50%",
          background: C.white, border: `1px solid rgba(20,20,23,0.1)`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30,
          color: C.text2, transition: "all 150ms",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
        >{col ? <IcoChevR size={15} /> : <IcoChevL size={15} />}</button>

        <div style={{ padding: col ? "18px 0" : "18px 18px", display: "flex", alignItems: "center", justifyContent: col ? "center" : "flex-start", gap: 9, borderBottom: `1px solid ${C.border}`, minHeight: 60 }}>
          <img src={LOGO_FAVICON} alt="C" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover" }} />
          {!col && <span style={{ fontWeight: 700, fontSize: 17, color: C.text1 }}>Creatyng</span>}
        </div>

        <button style={{
          margin: col ? "14px 8px" : "14px 14px", padding: "10px 0",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, color: "#fff",
          border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: col ? 0 : 8,
          boxShadow: `0 3px 10px ${C.accent}44`, fontFamily: "inherit", transition: "all 180ms",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
        ><IcoPlus size={17} />{!col && "Nova Criação"}</button>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 2 }}>
          <SideBtn icon={IcoHome} label="Home" id="home" />
          <SideBtn icon={IcoGrid} label="Templates" id="templates" />
          <SideBtn icon={IcoCompass} label="Explore" id="explore" />
          <SideBtn icon={IcoFolder} label="Projetos" id="projects" />
          {!col && <>
            <div style={{ height: 1, background: C.border, margin: "12px 14px" }} />
            <div style={{ padding: "6px 18px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: C.text4 }}>Recentes</div>
            {projects.slice(0, 4).map(p => (
              <div key={p.id} style={{ padding: "6px 18px", fontSize: 12.5, color: C.text3, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 120ms" }}
                onMouseEnter={e => e.currentTarget.style.color = C.text1}
                onMouseLeave={e => e.currentTarget.style.color = C.text3}
              ><div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              </div>
            ))}
          </>}
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
            {/* Upgrade - outline orange */}
            <button style={{
              padding: "5px 14px", borderRadius: 8,
              border: `1.5px solid ${C.accent}`, background: C.accentPale,
              color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", transition: "all 150ms",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.accentPale; }}
            ><IcoZap size={13} />Upgrade</button>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 3px" }} />
            <button style={{ padding: "5px 9px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, fontSize: 11.5, fontWeight: 600, color: C.text2, cursor: "pointer", fontFamily: "inherit" }}>PT</button>
            <button style={{ padding: "5px 7px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3 }}><IcoSun /></button>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>R</div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          background: `
            radial-gradient(ellipse 700px 500px at 10% 4%, rgba(255,113,61,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 600px 400px at 80% 8%, rgba(255,155,112,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 500px 350px at 45% 2%, rgba(255,180,136,0.07) 0%, transparent 65%),
            ${gridSvg}, ${noiseSvg}, ${C.bg}
          `,
          padding: "28px 32px 48px",
        }}>
          {/* Welcome - just greeting */}
          <div style={{ marginBottom: 24, ...anim(0) }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text1, lineHeight: 1.2 }}>Olá, Rodrigo!</h1>
          </div>

          {/* ── CRIAR AGORA (carousel) ── */}
          <div style={{ marginBottom: 36, ...anim(60) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>Comece rápido</h3>
              <CarouselNav scrollRef={featRef} label="Ver todos" />
            </div>
            <div ref={featRef} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none", scrollBehavior: "smooth" }}>
              {features.map((f, i) => <FeatureCard key={f.id} f={f} i={i} ready={ready} />)}
            </div>
          </div>

          {/* ── MEUS PROJETOS (single row, overflow hidden, carousel) ── */}
          <div style={{ marginBottom: 36, ...anim(200) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>Meus Projetos</h3>
              <CarouselNav scrollRef={projRef} label="Ver todos" />
            </div>
            <div ref={projRef} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", scrollBehavior: "smooth" }}>
              {projects.map((p, i) => (
                <div key={p.id} style={{
                  width: 210, minWidth: 210, background: C.white, borderRadius: 12, overflow: "hidden",
                  border: hProj === p.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  boxShadow: C.cardShadow, cursor: "pointer", transition: "all 180ms",
                  animation: ready ? `scIn 320ms ${200 + i * 40}ms ease both` : "none",
                  ...(hProj === p.id ? { background: `linear-gradient(180deg, ${C.accentPale} 0%, ${C.white} 60%)` } : {}),
                }}
                  onMouseEnter={() => setHProj(p.id)}
                  onMouseLeave={() => setHProj(null)}
                >
                  <div style={{ height: 110, background: `linear-gradient(145deg, hsl(${p.hue} 55% 94%), hsl(${p.hue} 45% 87%))`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${p.color}30` }}>
                      <IcoImage size={18} stroke="#fff" />
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text1, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: C.text2, background: C.bg, padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{p.preset}</span>
                      <span style={{ fontSize: 11, color: C.text4 }}>{p.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── GALERIA DE INSPIRAÇÃO (with tabs) ── */}
          <div style={anim(340)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.text3 }}>Descubra o que é possível</h3>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 2, background: "rgba(20,20,23,0.04)", borderRadius: 8, padding: 3 }}>
                  {[{ id: "explore", label: "Explore", ico: IcoCompass }, { id: "templates", label: "Templates", ico: IcoGrid }].map(t => {
                    const active = inspoTab === t.id;
                    return (
                      <button key={t.id} onClick={() => setInspoTab(t.id)} style={{
                        padding: "5px 14px", borderRadius: 6, border: "none", fontFamily: "inherit",
                        background: active ? C.white : "transparent",
                        color: active ? C.text1 : C.text3,
                        fontWeight: active ? 600 : 400, fontSize: 12, cursor: "pointer",
                        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        display: "flex", alignItems: "center", gap: 5, transition: "all 150ms",
                      }}>
                        <t.ico size={13} />{t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12.5, fontWeight: 500, color: C.text2, cursor: "pointer", fontFamily: "inherit" }}>Ver mais</button>
            </div>
            <div style={{ columnCount: 4, columnGap: 12 }}>
              {inspo.map(item => (
                <div key={item.id} style={{
                  height: item.h, background: `linear-gradient(155deg, ${item.color}DD, ${item.color}77)`,
                  borderRadius: 11, marginBottom: 12, breakInside: "avoid", position: "relative",
                  overflow: "hidden", cursor: "pointer", transition: "all 200ms",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 12,
                  transform: hInsp === item.id ? "scale(1.015)" : "",
                  border: hInsp === item.id ? `1.5px solid ${C.accent}` : "1px solid transparent",
                }}
                  onMouseEnter={() => setHInsp(item.id)}
                  onMouseLeave={() => setHInsp(null)}
                >
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10.5, fontWeight: 500, marginTop: 2 }}>{item.feat}</div>
                  </div>
                  {hInsp === item.id && (
                    <div style={{
                      position: "absolute", top: 8, right: 8, zIndex: 3, padding: "4px 10px",
                      borderRadius: 6, fontSize: 10, fontWeight: 600,
                      background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                      color: "#fff", border: "1px solid rgba(255,255,255,0.2)", animation: "scIn 120ms ease both",
                    }}>Criar similar</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
