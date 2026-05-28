import { useState, useEffect } from "react";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", purple: "#7C3AED",
  cardShadow: "0 1px 3px rgba(20,20,23,0.04)",
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
const IcoSparkle = (p) => <Ico size={15} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoCheck = (p) => <Ico size={16} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoCrown = (p) => <Ico {...p}><path d="M2 20h20L19 8l-5 5-2-7-2 7-5-5z" fill="none"/><line x1="2" y1="20" x2="22" y2="20"/></Ico>;
const IcoUsers = (p) => <Ico {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Ico>;
const IcoBuilding = (p) => <Ico {...p}><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><path d="M9 22v-4h6v4"/></Ico>;
const IcoSun = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="5"/></Ico>;
const IcoTrendUp = (p) => <Ico size={16} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Ico>;

/* ─── PLANS ─── */
const plans = [
  {
    id: "free", name: "Free", price: "R$ 0", period: "/mês", credits: "50",
    desc: "Para conhecer a plataforma", current: false, accent: C.text3,
    features: [
      "50 créditos / mês",
      "2 templates disponíveis",
      "Export PNG",
      "Marca d'água Creatyng",
    ],
    missing: ["Chat AI", "Brand Kit", "Multi-formato", "Suporte prioritário"],
  },
  {
    id: "pro", name: "Pro", price: "R$ 49", period: "/mês", credits: "500",
    desc: "Para criadores individuais", current: true, popular: true, accent: C.accent,
    features: [
      "500 créditos / mês",
      "Todos os templates",
      "Export PNG, JPG, WebP",
      "Sem marca d'água",
      "Chat AI ilimitado",
      "Brand Kit básico",
    ],
    missing: ["Multi-formato", "Suporte prioritário"],
  },
  {
    id: "team", name: "Team", price: "R$ 149", period: "/mês", credits: "2.000",
    desc: "Para equipes e agências", current: false, accent: C.purple,
    features: [
      "2.000 créditos / mês",
      "Todos os templates",
      "Todos os formatos",
      "Sem marca d'água",
      "Chat AI ilimitado",
      "Brand Kit completo",
      "Até 5 colaboradores",
      "Suporte prioritário",
    ],
    missing: [],
  },
  {
    id: "enterprise", name: "Enterprise", price: "Sob consulta", period: "", credits: "Ilimitado",
    desc: "Para grandes operações", current: false, accent: C.dark,
    features: [
      "Créditos ilimitados",
      "API dedicada",
      "White-label",
      "SSO & compliance",
      "Gerente de conta",
      "SLA garantido",
      "Colaboradores ilimitados",
      "Onboarding dedicado",
    ],
    missing: [],
  },
];

/* ─── USAGE HISTORY ─── */
const history = [
  { date: "Hoje", action: "Food/Pop — Burger Artesanal", credits: -5, type: "gen" },
  { date: "Hoje", action: "Chat AI — Refinamento", credits: -1, type: "chat" },
  { date: "Ontem", action: "Pop Design — Açaí Bowl", credits: -8, type: "gen" },
  { date: "Ontem", action: "Food/Pop — Sushi Festival", credits: -5, type: "gen" },
  { date: "08 Mar", action: "Recarga avulsa — 200 créditos", credits: 200, type: "topup" },
  { date: "05 Mar", action: "Food/Pop — Pizza Weekend", credits: -5, type: "gen" },
  { date: "01 Mar", action: "Renovação mensal — Plano Pro", credits: 500, type: "renew" },
];

/* ─── MAIN ─── */
export default function BillingPage() {
  const [col, setCol] = useState(false);
  const [nav, setNav] = useState("billing");
  const [tab, setTab] = useState("plans");
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const anim = (d) => ready ? { animation: `fdUp 450ms ${d}ms ease both` } : {};

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

  const usedCredits = 279;
  const totalCredits = 500;
  const pct = Math.round((usedCredits / totalCredits) * 100);

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", background: C.bg, minHeight: "100vh", display: "flex", color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
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
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>R</div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{
          flex: 1, overflowY: "auto",
          background: `
            radial-gradient(ellipse 700px 400px at 30% 2%, rgba(255,113,61,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 500px 300px at 75% 5%, rgba(255,155,112,0.06) 0%, transparent 60%),
            ${gridSvg}, ${noiseSvg}, ${C.bg}
          `,
          padding: "28px 36px 48px",
        }}>
          {/* Title + Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, ...anim(0) }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 3 }}>Planos & Faturamento</h1>
              <p style={{ fontSize: 13.5, color: C.text2 }}>Gerencie seu plano, créditos e histórico de uso.</p>
            </div>
            <div style={{ display: "flex", gap: 2, background: "rgba(20,20,23,0.04)", borderRadius: 8, padding: 3 }}>
              {[{ id: "plans", label: "Planos" }, { id: "usage", label: "Uso & Histórico" }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: "6px 16px", borderRadius: 6, border: "none", fontFamily: "inherit",
                  background: tab === t.id ? C.white : "transparent",
                  color: tab === t.id ? C.text1 : C.text3, fontWeight: tab === t.id ? 600 : 400,
                  fontSize: 13, cursor: "pointer", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 150ms",
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {tab === "plans" && (
            <>
              {/* Usage summary card */}
              <div style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px",
                marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: C.cardShadow, ...anim(60),
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.text3, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Plano atual</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>Pro</span>
                      <span style={{ fontSize: 12, color: C.text3, background: C.accentPale, padding: "2px 8px", borderRadius: 5, fontWeight: 500 }}>R$ 49/mês</span>
                    </div>
                  </div>
                  <div style={{ width: 1, height: 40, background: C.border }} />
                  <div>
                    <div style={{ fontSize: 12, color: C.text3, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Créditos usados</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: C.text1 }}>{usedCredits}</span>
                      <span style={{ fontSize: 13, color: C.text3 }}>de {totalCredits}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 180, height: 6, borderRadius: 3, background: "rgba(20,20,23,0.06)", marginTop: 6 }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, transition: "width 600ms ease" }} />
                    </div>
                  </div>
                  <div style={{ width: 1, height: 40, background: C.border }} />
                  <div>
                    <div style={{ fontSize: 12, color: C.text3, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Renova em</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text1 }}>22 dias</div>
                  </div>
                </div>
                <button style={{
                  padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${C.accent}`,
                  background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <IcoPlus size={15} /> Recarregar créditos
                </button>
              </div>

              {/* Plan cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, ...anim(140) }}>
                {plans.map((p, i) => {
                  const isCurrent = p.current;
                  return (
                    <div key={p.id} style={{
                      background: C.white, borderRadius: 14, overflow: "hidden",
                      border: isCurrent ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                      boxShadow: isCurrent ? `0 4px 20px ${C.accent}20` : C.cardShadow,
                      position: "relative", display: "flex", flexDirection: "column",
                      animation: ready ? `scIn 340ms ${140 + i * 50}ms ease both` : "none",
                    }}>
                      {/* Popular badge */}
                      {p.popular && (
                        <div style={{
                          position: "absolute", top: 12, right: 12, padding: "3px 10px", borderRadius: 6,
                          background: C.accent, color: "#fff", fontSize: 10, fontWeight: 600,
                        }}>Seu plano</div>
                      )}

                      <div style={{ padding: "22px 20px 0" }}>
                        {/* Plan icon */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                          background: p.id === "free" ? C.bg : p.id === "pro" ? C.accentPale : p.id === "team" ? `${C.purple}14` : `${C.dark}0A`,
                          display: "flex", alignItems: "center", justifyContent: "center", color: p.accent,
                        }}>
                          {p.id === "free" && <IcoSparkle />}
                          {p.id === "pro" && <IcoZap size={18} />}
                          {p.id === "team" && <IcoUsers size={18} stroke={C.purple} />}
                          {p.id === "enterprise" && <IcoBuilding size={18} stroke={C.dark} />}
                        </div>

                        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text1, marginBottom: 3 }}>{p.name}</h3>
                        <p style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>{p.desc}</p>

                        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 4 }}>
                          <span style={{ fontSize: 28, fontWeight: 700, color: p.accent }}>{p.price}</span>
                          <span style={{ fontSize: 13, color: C.text3 }}>{p.period}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text3, marginBottom: 18 }}>
                          <span style={{ fontWeight: 600, color: C.text1 }}>{p.credits}</span> créditos / mês
                        </div>
                      </div>

                      {/* Features */}
                      <div style={{ padding: "0 20px 20px", flex: 1 }}>
                        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {p.features.map((f, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.text1 }}>
                              <IcoCheck stroke={C.success} />
                              <span>{f}</span>
                            </div>
                          ))}
                          {p.missing.map((f, j) => (
                            <div key={`m${j}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.text4 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              <span style={{ textDecoration: "line-through" }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div style={{ padding: "0 20px 20px" }}>
                        <button style={{
                          width: "100%", padding: "10px 0", borderRadius: 9, cursor: "pointer",
                          fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "all 180ms",
                          ...(isCurrent ? {
                            border: `1px solid ${C.border}`, background: C.bg, color: C.text3,
                          } : p.id === "enterprise" ? {
                            border: `1.5px solid ${C.dark}`, background: "transparent", color: C.dark,
                          } : {
                            border: "none", background: `linear-gradient(135deg, ${p.accent}, ${p.accent}BB)`, color: "#fff",
                            boxShadow: `0 3px 10px ${p.accent}33`,
                          }),
                        }}>
                          {isCurrent ? "Plano atual" : p.id === "enterprise" ? "Falar com vendas" : `Assinar ${p.name}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "usage" && (
            <div style={anim(60)}>
              {/* Usage summary */}
              <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Créditos restantes", value: "221", sub: "de 500 este mês", color: C.accent },
                  { label: "Gerações este mês", value: "42", sub: "+12% vs mês anterior", color: C.purple },
                  { label: "Gasto médio / dia", value: "9.3", sub: "créditos por dia", color: C.success },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px", boxShadow: C.cardShadow }}>
                    <div style={{ fontSize: 11, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{s.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: C.text3, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      {i === 1 && <IcoTrendUp stroke={C.success} />}{s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* History table */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>Histórico de uso</h3>
                  <button style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, fontWeight: 500, color: C.text2, cursor: "pointer", fontFamily: "inherit" }}>Este mês</button>
                </div>
                {history.map((h, i) => (
                  <div key={i} style={{
                    padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: i < history.length - 1 ? `1px solid ${C.border}` : "none",
                    transition: "background 120ms",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                        background: h.credits > 0 ? `${C.success}12` : `${C.accent}12`,
                        color: h.credits > 0 ? C.success : C.accent,
                      }}>
                        {h.credits > 0 ? <IcoPlus size={15} /> : <IcoSparkle />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{h.action}</div>
                        <div style={{ fontSize: 11, color: C.text4, marginTop: 1 }}>{h.date}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, fontFamily: "monospace",
                      color: h.credits > 0 ? C.success : C.text2,
                    }}>
                      {h.credits > 0 ? "+" : ""}{h.credits}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
