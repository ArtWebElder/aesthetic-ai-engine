import { useState, useEffect } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", purple: "#7C3AED", cyan: "#06B6D4",
  cardShadow: "0 1px 3px rgba(20,20,23,0.04)",
};

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
const IcoSparkle = (p) => <Ico size={15} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoImage = (p) => <Ico {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoList = (p) => <Ico size={16} {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Ico>;
const IcoGridView = (p) => <Ico size={16} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Ico>;
const IcoMoreH = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Ico>;
const IcoEdit = (p) => <Ico size={14} {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>;
const IcoCopy = (p) => <Ico size={14} {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Ico>;
const IcoTrash = (p) => <Ico size={14} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Ico>;
const IcoDownload = (p) => <Ico size={14} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoSun = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="5"/></Ico>;
const IcoChevDown = (p) => <Ico size={14} {...p}><polyline points="6 9 12 15 18 9"/></Ico>;
const IcoFolderBig = (p) => <Ico size={40} {...p}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Ico>;

/* ─── MOCK PROJECTS ─── */
const allProjects = [
  { id: 1, name: "Promo Açaí Tropical", preset: "Food/Pop", date: "10 Mar 2026", dateSort: 20260310, color: "#7C3AED", hue: 270, versions: 3, credits: 15 },
  { id: 2, name: "Burger Artesanal", preset: "Food/Pop", date: "9 Mar 2026", dateSort: 20260309, color: "#ff713d", hue: 15, versions: 5, credits: 23 },
  { id: 3, name: "Sushi Festival", preset: "Pop Design", date: "7 Mar 2026", dateSort: 20260307, color: "#EC4899", hue: 330, versions: 2, credits: 16 },
  { id: 4, name: "Pizza Weekend", preset: "Food/Pop", date: "5 Mar 2026", dateSort: 20260305, color: "#10B981", hue: 160, versions: 1, credits: 5 },
  { id: 5, name: "Café Especial", preset: "Pop Design", date: "3 Mar 2026", dateSort: 20260303, color: "#06B6D4", hue: 190, versions: 4, credits: 32 },
  { id: 6, name: "Doces & Bolos", preset: "Food/Pop", date: "1 Mar 2026", dateSort: 20260301, color: "#F59E0B", hue: 38, versions: 2, credits: 10 },
  { id: 7, name: "Sorvete Verão", preset: "Pop Design", date: "28 Fev 2026", dateSort: 20260228, color: "#EC4899", hue: 340, versions: 1, credits: 8 },
  { id: 8, name: "Churrasco BBQ", preset: "Food/Pop", date: "25 Fev 2026", dateSort: 20260225, color: "#1E293B", hue: 210, versions: 3, credits: 15 },
  { id: 9, name: "Poke Bowl Fresh", preset: "Pop Design", date: "20 Fev 2026", dateSort: 20260220, color: "#10B981", hue: 165, versions: 2, credits: 16 },
];

/* ─── DROPDOWN MENU ─── */
function ActionMenu({ open, onClose, onAction }) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, width: 160, background: C.white, borderRadius: 10, border: `1px solid ${C.borderStrong}`, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: 4, zIndex: 20, animation: "fdUp 120ms ease both" }}>
      {[
        { id: "open", label: "Abrir projeto", icon: IcoImage },
        { id: "rename", label: "Renomear", icon: IcoEdit },
        { id: "duplicate", label: "Duplicar", icon: IcoCopy },
        { id: "download", label: "Exportar", icon: IcoDownload },
        { divider: true },
        { id: "delete", label: "Excluir", icon: IcoTrash, danger: true },
      ].map((item, i) => item.divider ? (
        <div key={i} style={{ height: 1, background: C.border, margin: "3px 0" }} />
      ) : (
        <button key={i} onClick={() => { onAction(item.id); onClose(); }} style={{
          width: "100%", padding: "7px 10px", borderRadius: 6, border: "none", background: "transparent",
          cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left",
          color: item.danger ? C.error : C.text1, display: "flex", alignItems: "center", gap: 8,
          transition: "background 80ms",
        }}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? `${C.error}08` : "rgba(20,20,23,0.03)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        ><item.icon stroke={item.danger ? C.error : C.text3} />{item.label}</button>
      ))}
    </div>
  );
}

/* ─── MAIN ─── */
export default function ProjectsPage() {
  const [col, setCol] = useState(false);
  const [nav, setNav] = useState("projects");
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [hov, setHov] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    const h = () => setMenuOpen(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);
  const anim = (d) => ready ? { animation: `fdUp 450ms ${d}ms ease both` } : {};

  let filtered = allProjects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "all" && p.preset !== filter) return false;
    return true;
  });
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "credits") filtered.sort((a, b) => b.credits - a.credits);
  else filtered.sort((a, b) => b.dateSort - a.dateSort);

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
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        input:focus{outline:none}input::placeholder{color:${C.text4}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: col ? 68 : 244, minWidth: col ? 68 : 244, background: C.white, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "all 260ms cubic-bezier(.4,0,.2,1)", position: "relative", zIndex: 20, overflow: "visible" }}>
        <button onClick={() => setCol(!col)} style={{ position: "absolute", right: -14, top: 72, width: 28, height: 28, borderRadius: "50%", background: C.white, border: `1px solid ${C.borderStrong}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, color: C.text2 }}>{col ? <IcoChevR /> : <IcoChevL />}</button>
        <div style={{ padding: col ? "18px 0" : "18px 18px", display: "flex", alignItems: "center", justifyContent: col ? "center" : "flex-start", gap: 9, borderBottom: `1px solid ${C.border}`, minHeight: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>C</span></div>
          {!col && <span style={{ fontWeight: 700, fontSize: 17, color: C.text1 }}>Creatyng</span>}
        </div>
        <button style={{ margin: col ? "14px 8px" : "14px 14px", padding: "10px 0", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: col ? 0 : 8, boxShadow: `0 3px 10px ${C.accent}44`, fontFamily: "inherit" }}><IcoPlus size={17} />{!col && "Nova Criação"}</button>
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

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header style={{ height: 56, padding: "0 26px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, background: "rgba(245,245,243,0.8)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", background: "rgba(20,20,23,0.035)", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text3, cursor: "pointer", minWidth: 200 }}>
              <IcoSearch size={15} /><span>Buscar...</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: C.text4, background: "rgba(20,20,23,0.05)", padding: "1px 5px", borderRadius: 3, fontWeight: 600, fontFamily: "monospace" }}>⌘K</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}><IcoSparkle /><span style={{ fontWeight: 700, color: C.accent }}>221</span><span style={{ color: C.text3, fontSize: 11.5 }}>créditos</span></div>
            <button style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${C.accent}`, background: C.accentPale, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit" }}><IcoZap size={13} />Upgrade</button>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 3px" }} />
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>R</div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", background: `radial-gradient(ellipse 600px 400px at 15% 4%, rgba(255,113,61,0.08) 0%, transparent 65%), ${gridSvg}, ${noiseSvg}, ${C.bg}`, padding: "24px 32px 48px" }}>
          {/* Title + Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, ...anim(0) }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Meus Projetos</h1>
              <p style={{ fontSize: 13, color: C.text3 }}>{allProjects.length} projetos · {allProjects.reduce((s, p) => s + p.versions, 0)} versões</p>
            </div>
            <button style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 3px 10px ${C.accent}44` }}><IcoPlus size={15} />Novo Projeto</button>
          </div>

          {/* Filters bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10, ...anim(40) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Search */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", background: C.white, borderRadius: 8, border: `1px solid ${C.borderStrong}`, width: 220 }}>
                <IcoSearch size={14} stroke={C.text4} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar projeto..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 12.5, fontFamily: "inherit", color: C.text1 }} />
              </div>
              {/* Filter by preset */}
              {["all", "Food/Pop", "Pop Design"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 13px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                  border: filter === f ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: filter === f ? C.accentPale : C.white,
                  color: filter === f ? C.accent : C.text2, fontWeight: filter === f ? 600 : 400,
                  transition: "all 150ms",
                }}>{f === "all" ? "Todos" : f}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 12, fontFamily: "inherit", color: C.text2, cursor: "pointer" }}>
                <option value="recent">Mais recentes</option>
                <option value="name">Nome A-Z</option>
                <option value="credits">Mais créditos</option>
              </select>
              {/* View toggle */}
              <div style={{ display: "flex", background: "rgba(20,20,23,0.04)", borderRadius: 7, padding: 2 }}>
                <button onClick={() => setView("grid")} style={{ width: 30, height: 28, borderRadius: 5, border: "none", cursor: "pointer", background: view === "grid" ? C.white : "transparent", color: view === "grid" ? C.text1 : C.text4, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: view === "grid" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}><IcoGridView /></button>
                <button onClick={() => setView("list")} style={{ width: 30, height: 28, borderRadius: 5, border: "none", cursor: "pointer", background: view === "list" ? C.white : "transparent", color: view === "list" ? C.text1 : C.text4, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: view === "list" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}><IcoList /></button>
              </div>
            </div>
          </div>

          {/* GRID VIEW */}
          {view === "grid" && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{
                  background: C.white, borderRadius: 12, overflow: "hidden",
                  border: hov === p.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  boxShadow: C.cardShadow, cursor: "pointer", transition: "all 180ms", position: "relative",
                  ...(hov === p.id ? { background: `linear-gradient(180deg, ${C.accentPale} 0%, ${C.white} 40%)` } : {}),
                  animation: ready ? `scIn 320ms ${40 + i * 35}ms ease both` : "none",
                }}
                  onMouseEnter={() => setHov(p.id)} onMouseLeave={() => { setHov(null); }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: 130, background: `linear-gradient(145deg, hsl(${p.hue} 55% 94%), hsl(${p.hue} 45% 87%))`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${p.color}30` }}>
                      <IcoImage size={20} stroke="#fff" />
                    </div>
                    {/* Version badge */}
                    <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", fontSize: 10, fontWeight: 600, color: C.text2 }}>{p.versions} versões</div>
                    {/* More menu */}
                    <div style={{ position: "absolute", top: 8, right: 8 }} onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id); }} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text2, opacity: hov === p.id ? 1 : 0, transition: "opacity 150ms" }}>
                        <IcoMoreH />
                      </button>
                      <ActionMenu open={menuOpen === p.id} onClose={() => setMenuOpen(null)} onAction={(a) => {}} />
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text1, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: C.text2, background: C.bg, padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{p.preset}</span>
                      <span style={{ fontSize: 11, color: C.text4 }}>{p.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && filtered.length > 0 && (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                {["Projeto", "Template", "Versões", "Data", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {filtered.map((p, i) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 8, padding: "11px 16px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer", transition: "background 100ms", alignItems: "center",
                  animation: ready ? `fdUp 300ms ${i * 30}ms ease both` : "none",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${p.color}20, ${p.color}40)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IcoImage size={14} stroke={p.color} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.text2 }}>{p.preset}</span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{p.versions}</span>
                  <span style={{ fontSize: 12, color: C.text3 }}>{p.date}</span>
                  <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                    {[IcoEdit, IcoCopy, IcoTrash].map((Icon, j) => (
                      <button key={j} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: j === 2 ? C.error : C.text3, transition: "all 100ms" }}
                        onMouseEnter={e => e.currentTarget.style.background = j === 2 ? `${C.error}08` : C.bg}
                        onMouseLeave={e => e.currentTarget.style.background = C.white}
                      ><Icon /></button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, padding: "44px 32px", textAlign: "center", width: 340, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(180deg, ${C.accent}06, transparent)` }} />
                <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}10, ${C.accent}06)`, border: `1px solid ${C.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.accent, position: "relative" }}><IcoFolderBig /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, position: "relative" }}>
                  {search ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
                </h3>
                <p style={{ fontSize: 12.5, color: C.text3, lineHeight: 1.5, marginBottom: 20, position: "relative" }}>
                  {search ? "Tente ajustar os filtros ou o termo de busca." : "Crie seu primeiro criativo profissional e ele aparecerá aqui."}
                </p>
                {!search && (
                  <button style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: `0 3px 10px ${C.accent}33`, position: "relative" }}><IcoPlus size={14} />Criar primeiro projeto</button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
