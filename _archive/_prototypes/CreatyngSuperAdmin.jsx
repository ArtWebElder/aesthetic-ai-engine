import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444", purple: "#7C3AED", cyan: "#06B6D4",
  cardShadow: "0 1px 3px rgba(20,20,23,0.04)",
};

/* ─── ICONS ─── */
const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoUsers = (p) => <Ico {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Ico>;
const IcoDollar = (p) => <Ico {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Ico>;
const IcoActivity = (p) => <Ico {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Ico>;
const IcoCpu = (p) => <Ico {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Ico>;
const IcoTrendUp = (p) => <Ico size={14} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Ico>;
const IcoTrendDown = (p) => <Ico size={14} {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Ico>;
const IcoSearch = (p) => <Ico {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>;
const IcoShield = (p) => <Ico {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ico>;
const IcoPlus = (p) => <Ico {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoMinus = (p) => <Ico size={14} {...p}><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoBan = (p) => <Ico size={14} {...p}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Ico>;
const IcoTrash = (p) => <Ico size={14} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Ico>;
const IcoEdit = (p) => <Ico size={14} {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>;
const IcoChevDown = (p) => <Ico size={14} {...p}><polyline points="6 9 12 15 18 9"/></Ico>;

/* ─── MOCK DATA ─── */
const mrrData = [
  { month: "Set", value: 1200 }, { month: "Out", value: 2100 }, { month: "Nov", value: 3400 },
  { month: "Dez", value: 4200 }, { month: "Jan", value: 5800 }, { month: "Fev", value: 7100 }, { month: "Mar", value: 8400 },
];
const genDaily = [
  { day: "Seg", count: 42 }, { day: "Ter", count: 58 }, { day: "Qua", count: 35 },
  { day: "Qui", count: 72 }, { day: "Sex", count: 91 }, { day: "Sáb", count: 48 }, { day: "Dom", count: 33 },
];
const featureUsage = [
  { name: "Food/Pop", value: 58, color: C.accent },
  { name: "Pop Design", value: 27, color: C.purple },
  { name: "Chat AI", value: 10, color: C.cyan },
  { name: "Outros", value: 5, color: C.text4 },
];
const users = [
  { id: 1, name: "Marina Costa", email: "marina@acai.com", plan: "Pro", credits: 312, used: 188, gens: 34, tokens: 45200, status: "active" },
  { id: 2, name: "Carlos Silva", email: "carlos@burger.com", plan: "Free", credits: 12, used: 38, gens: 8, tokens: 12400, status: "active" },
  { id: 3, name: "Ana Oliveira", email: "ana@pizzaria.com", plan: "Pro", credits: 489, used: 11, gens: 3, tokens: 4100, status: "active" },
  { id: 4, name: "Pedro Santos", email: "pedro@sushi.com", plan: "Team", credits: 1840, used: 160, gens: 52, tokens: 89300, status: "active" },
  { id: 5, name: "Julia Mendes", email: "julia@cafe.com", plan: "Pro", credits: 0, used: 500, gens: 87, tokens: 134000, status: "suspended" },
  { id: 6, name: "Rafael Lima", email: "rafa@doces.com", plan: "Free", credits: 43, used: 7, gens: 2, tokens: 3200, status: "active" },
  { id: 7, name: "Beatriz Rocha", email: "bia@churrasco.com", plan: "Pro", credits: 221, used: 279, gens: 41, tokens: 67800, status: "active" },
];
const genLogs = [
  { id: 1, user: "Marina Costa", feature: "Food/Pop", cost: 5, tokens: 1200, time: "Há 12min", status: "ok" },
  { id: 2, user: "Pedro Santos", feature: "Pop Design", cost: 8, tokens: 2400, time: "Há 28min", status: "ok" },
  { id: 3, user: "Beatriz Rocha", feature: "Food/Pop", cost: 5, tokens: 1100, time: "Há 45min", status: "ok" },
  { id: 4, user: "Julia Mendes", feature: "Chat AI", cost: 1, tokens: 340, time: "Há 1h", status: "ok" },
  { id: 5, user: "Carlos Silva", feature: "Food/Pop", cost: 5, tokens: 1350, time: "Há 1h", status: "error" },
  { id: 6, user: "Marina Costa", feature: "Pop Design", cost: 8, tokens: 2100, time: "Há 2h", status: "ok" },
  { id: 7, user: "Pedro Santos", feature: "Food/Pop", cost: 5, tokens: 1050, time: "Há 3h", status: "ok" },
];
const tokensByProvider = [
  { provider: "Gemini Pro", used: 342000, cost: "R$ 28,40" },
  { provider: "Gemini Flash", used: 89000, cost: "R$ 4,20" },
  { provider: "Replicate", used: 12000, cost: "R$ 6,80" },
];

/* ─── TABS ─── */
const TABS = [
  { id: "overview", label: "Visão Geral", icon: IcoActivity },
  { id: "users", label: "Usuários", icon: IcoUsers },
  { id: "finance", label: "Financeiro", icon: IcoDollar },
  { id: "generations", label: "Gerações", icon: IcoActivity },
  { id: "tokens", label: "Tokens", icon: IcoCpu },
];

/* ─── KPI CARD ─── */
function KPI({ label, value, sub, trend, trendUp, color = C.text1 }) {
  return (
    <div style={{ flex: 1, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px", boxShadow: C.cardShadow }}>
      <div style={{ fontSize: 11, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: C.text3, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
        {trend && (trendUp ? <IcoTrendUp stroke={C.success} /> : <IcoTrendDown stroke={C.error} />)}
        <span style={{ color: trend ? (trendUp ? C.success : C.error) : C.text3, fontWeight: trend ? 600 : 400 }}>{sub}</span>
      </div>
    </div>
  );
}

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }) {
  const s = status === "active" ? { bg: `${C.success}14`, color: C.success, label: "Ativo" }
    : status === "suspended" ? { bg: `${C.error}14`, color: C.error, label: "Suspenso" }
    : { bg: `${C.text4}14`, color: C.text4, label: status };
  return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
}
function PlanBadge({ plan }) {
  const colors = { Free: C.text3, Pro: C.accent, Team: C.purple, Enterprise: C.dark };
  return <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: `${colors[plan] || C.text3}14`, color: colors[plan] || C.text3 }}>{plan}</span>;
}

/* ─── MAIN ─── */
export default function SuperAdmin() {
  const [tab, setTab] = useState("overview");
  const [ready, setReady] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  useEffect(() => { setReady(true); }, []);
  const anim = (d) => ready ? { animation: `fdUp 400ms ${d}ms ease both` } : {};

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  const thStyle = { fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}` };
  const tdStyle = { padding: "11px 14px", fontSize: 13, color: C.text1, borderBottom: `1px solid ${C.border}` };

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", background: C.bg, minHeight: "100vh", color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus{outline:none}input::placeholder{color:${C.text4}}
      `}</style>

      {/* HEADER */}
      <header style={{
        height: 56, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`, background: "rgba(245,245,243,0.85)",
        backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 15,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>C</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Creatyng</span>
          <span style={{ padding: "4px 12px", borderRadius: 6, background: `${C.error}14`, color: C.error, fontSize: 10.5, fontWeight: 700, marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <IcoShield size={13} />SUPER ADMIN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: C.text2 }}>Rodrigo Nutra</span>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.error},${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11.5 }}>R</div>
        </div>
      </header>

      <div style={{ display: "flex" }}>
        {/* SIDE TABS */}
        <div style={{ width: 210, minWidth: 210, borderRight: `1px solid ${C.border}`, padding: "20px 12px", background: C.white, minHeight: "calc(100vh - 56px)" }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer",
                background: active ? C.accentPale : "transparent",
                border: active ? `1px solid ${C.accent}33` : "1px solid transparent",
                color: active ? C.accent : C.text2, fontWeight: active ? 600 : 400,
                fontSize: 13, fontFamily: "inherit", transition: "all 150ms",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(20,20,23,0.03)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? C.accentPale : "transparent"; }}
              ><t.icon size={17} />{t.label}</button>
            );
          })}
        </div>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: "24px 32px 48px", overflowY: "auto", background: `${gridSvg}, ${C.bg}` }}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, ...anim(0) }}>Visão Geral</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, ...anim(40) }}>
              <KPI label="MRR" value="R$ 8.400" sub="+18% vs mês anterior" trend trendUp color={C.success} />
              <KPI label="Usuários ativos" value="127" sub="+23 este mês" trend trendUp color={C.accent} />
              <KPI label="Gerações hoje" value="379" sub="+12% vs ontem" trend trendUp color={C.purple} />
              <KPI label="Custo tokens hoje" value="R$ 39,40" sub="-8% vs ontem" trend trendUp={false} color={C.cyan} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24, ...anim(100) }}>
              {/* MRR chart */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", boxShadow: C.cardShadow }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Receita Recorrente (MRR)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mrrData}>
                    <defs><linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.2}/><stop offset="100%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,20,23,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={2.5} fill="url(#gMrr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Feature distribution */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", boxShadow: C.cardShadow }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features mais usadas</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={featureUsage} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                      {featureUsage.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {featureUsage.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.text2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color }} />{f.name} {f.value}%
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generations per day */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", boxShadow: C.cardShadow, ...anim(160) }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Gerações por dia (última semana)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={genDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,20,23,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  <Bar dataKey="count" fill={C.accent} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>}

          {/* ═══ USERS ═══ */}
          {tab === "users" && <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, ...anim(0) }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Usuários ({users.length})</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", background: C.white, borderRadius: 8, border: `1px solid ${C.borderStrong}`, width: 240 }}>
                <IcoSearch size={15} stroke={C.text4} />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar usuário..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 12.5, fontFamily: "inherit", color: C.text1 }} />
              </div>
            </div>

            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow, ...anim(40) }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thStyle}>Usuário</th><th style={thStyle}>Plano</th><th style={thStyle}>Créditos</th>
                  <th style={thStyle}>Gerações</th><th style={thStyle}>Tokens</th><th style={thStyle}>Status</th><th style={thStyle}>Ações</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ transition: "background 100ms" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: C.text3 }}>{u.email}</div>
                      </td>
                      <td style={tdStyle}><PlanBadge plan={u.plan} /></td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600 }}>{u.credits}</span>
                        <span style={{ color: C.text4, fontSize: 11 }}> / {u.credits + u.used}</span>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(20,20,23,0.06)", marginTop: 3 }}>
                          <div style={{ width: `${Math.round((u.used / (u.credits + u.used)) * 100)}%`, height: "100%", borderRadius: 2, background: C.accent }} />
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ fontWeight: 500 }}>{u.gens}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 12, fontFamily: "monospace", color: C.text2 }}>{(u.tokens/1000).toFixed(1)}k</span></td>
                      <td style={tdStyle}><StatusBadge status={u.status} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[
                            { icon: IcoEdit, color: C.text3, title: "Editar créditos" },
                            { icon: IcoBan, color: "#F59E0B", title: u.status === "suspended" ? "Reativar" : "Suspender" },
                            { icon: IcoTrash, color: C.error, title: "Excluir" },
                          ].map((a, j) => (
                            <button key={j} title={a.title} style={{
                              width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`,
                              background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              color: a.color, transition: "all 120ms",
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}0A`; e.currentTarget.style.borderColor = `${a.color}33`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}
                            ><a.icon /></button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ FINANCE ═══ */}
          {tab === "finance" && <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, ...anim(0) }}>Financeiro</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, ...anim(40) }}>
              <KPI label="MRR atual" value="R$ 8.400" sub="+18% vs mês anterior" trend trendUp color={C.success} />
              <KPI label="Receita total (Mar)" value="R$ 9.240" sub="inclui recargas avulsas" color={C.accent} />
              <KPI label="Churn" value="2.1%" sub="-0.4% vs mês anterior" trend trendUp={false} color={C.error} />
              <KPI label="Conv. Free→Pro" value="14.3%" sub="+2.1% vs mês anterior" trend trendUp color={C.purple} />
            </div>
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "18px 20px", boxShadow: C.cardShadow, ...anim(100) }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Evolução MRR (últimos 7 meses)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={mrrData}>
                  <defs><linearGradient id="gMrr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.success} stopOpacity={0.15}/><stop offset="100%" stopColor={C.success} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,20,23,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke={C.success} strokeWidth={2.5} fill="url(#gMrr2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>}

          {/* ═══ GENERATIONS ═══ */}
          {tab === "generations" && <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, ...anim(0) }}>Gerações</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, ...anim(40) }}>
              <KPI label="Gerações hoje" value="379" sub="+12% vs ontem" trend trendUp color={C.accent} />
              <KPI label="Custo médio / geração" value="R$ 0,08" sub="Gemini Pro avg" color={C.text1} />
              <KPI label="Feature top" value="Food/Pop" sub="58% das gerações" color={C.accent} />
              <KPI label="Taxa de erro" value="1.2%" sub="-0.3% vs semana anterior" trend trendUp={false} color={C.success} />
            </div>

            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow, ...anim(100) }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600 }}>Log de gerações recentes</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thStyle}>Usuário</th><th style={thStyle}>Feature</th><th style={thStyle}>Créditos</th>
                  <th style={thStyle}>Tokens</th><th style={thStyle}>Tempo</th><th style={thStyle}>Status</th>
                </tr></thead>
                <tbody>
                  {genLogs.map(g => (
                    <tr key={g.id}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}><span style={{ fontWeight: 500 }}>{g.user}</span></td>
                      <td style={tdStyle}><PlanBadge plan={g.feature} /></td>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>-{g.cost}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 12, fontFamily: "monospace", color: C.text2 }}>{g.tokens.toLocaleString()}</span></td>
                      <td style={tdStyle}><span style={{ color: C.text3 }}>{g.time}</span></td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600,
                          background: g.status === "ok" ? `${C.success}14` : `${C.error}14`,
                          color: g.status === "ok" ? C.success : C.error,
                        }}>{g.status === "ok" ? "Sucesso" : "Erro"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ TOKENS ═══ */}
          {tab === "tokens" && <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, ...anim(0) }}>Uso de Tokens</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, ...anim(40) }}>
              <KPI label="Tokens hoje" value="443k" sub="Gemini + Replicate" color={C.cyan} />
              <KPI label="Custo hoje" value="R$ 39,40" sub="-8% vs ontem" trend trendUp={false} color={C.success} />
              <KPI label="Custo / geração" value="R$ 0,08" sub="média 7 dias" color={C.text1} />
              <KPI label="Usuário top" value="Pedro S." sub="89.3k tokens hoje" color={C.purple} />
            </div>

            {/* Provider breakdown */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow, marginBottom: 24, ...anim(100) }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600 }}>Consumo por provedor</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thStyle}>Provedor</th><th style={thStyle}>Tokens usados</th><th style={thStyle}>Custo estimado</th><th style={thStyle}>% do total</th>
                </tr></thead>
                <tbody>
                  {tokensByProvider.map((t, i) => {
                    const total = tokensByProvider.reduce((s, x) => s + x.used, 0);
                    const pct = Math.round((t.used / total) * 100);
                    return (
                      <tr key={i}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{t.provider}</span></td>
                        <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{(t.used/1000).toFixed(0)}k</span></td>
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: C.accent }}>{t.cost}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 80, height: 6, borderRadius: 3, background: "rgba(20,20,23,0.06)" }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: i === 0 ? C.accent : i === 1 ? C.cyan : C.purple }} />
                            </div>
                            <span style={{ fontSize: 12, color: C.text2, fontWeight: 500 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Top users by tokens */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: C.cardShadow, ...anim(160) }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600 }}>Top usuários por consumo de tokens</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thStyle}>#</th><th style={thStyle}>Usuário</th><th style={thStyle}>Plano</th><th style={thStyle}>Tokens (mês)</th><th style={thStyle}>Custo est.</th>
                </tr></thead>
                <tbody>
                  {[...users].sort((a, b) => b.tokens - a.tokens).slice(0, 5).map((u, i) => (
                    <tr key={u.id}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(20,20,23,0.015)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: i === 0 ? C.accent : C.text3 }}>{i + 1}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{u.name}</span><br/><span style={{ fontSize: 11, color: C.text3 }}>{u.email}</span></td>
                      <td style={tdStyle}><PlanBadge plan={u.plan} /></td>
                      <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{(u.tokens/1000).toFixed(1)}k</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: 500, color: C.text1 }}>R$ {(u.tokens * 0.00008).toFixed(2)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}
        </main>
      </div>
    </div>
  );
}
