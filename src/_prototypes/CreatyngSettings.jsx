import { useState, useEffect } from "react";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", error: "#EF4444",
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
const IcoSun = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></Ico>;
const IcoSparkle = (p) => <Ico size={15} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoUser = (p) => <Ico {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>;
const IcoSliders = (p) => <Ico {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></Ico>;
const IcoPalette = (p) => <Ico {...p}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.4-.15-.74-.4-1.02-.26-.28-.4-.64-.4-1.08 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/></Ico>;
const IcoKey = (p) => <Ico {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Ico>;
const IcoUpload = (p) => <Ico {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></Ico>;
const IcoCopy = (p) => <Ico size={15} {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Ico>;
const IcoTrash = (p) => <Ico size={15} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Ico>;
const IcoCamera = (p) => <Ico size={16} {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
const IcoCheck = (p) => <Ico size={16} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoGlobe = (p) => <Ico size={16} {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></Ico>;
const IcoMoon = (p) => <Ico size={16} {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Ico>;

/* ─── SHARED INPUT ─── */
const Input = ({ label, value, onChange, placeholder, disabled, type = "text" }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 6, display: "block" }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 9, fontSize: 13.5, fontFamily: "inherit",
        border: `1px solid ${C.borderStrong}`, background: disabled ? C.bg : C.white, color: C.text1,
        outline: "none", transition: "border 150ms",
      }}
    />
  </div>
);

/* ─── TOGGLE SWITCH ─── */
const Toggle = ({ on, onToggle, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
    <span style={{ fontSize: 13.5, color: C.text1 }}>{label}</span>
    <button onClick={onToggle} style={{
      width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
      background: on ? C.accent : "rgba(20,20,23,0.12)", transition: "background 200ms",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
        left: on ? 21 : 3, transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </button>
  </div>
);

/* ─── BRAND COLOR SWATCH ─── */
const ColorSwatch = ({ color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: color, border: `1px solid ${C.border}`,
      cursor: "pointer", transition: "transform 150ms",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
    />
    <span style={{ fontSize: 10, color: C.text3 }}>{color}</span>
  </div>
);

/* ─── SETTINGS TABS ─── */
const TABS = [
  { id: "profile", label: "Perfil", icon: IcoUser },
  { id: "prefs", label: "Preferências", icon: IcoSliders },
  { id: "brand", label: "Brand Kit", icon: IcoPalette },
  { id: "api", label: "API Keys", icon: IcoKey },
];

/* ─── MAIN ─── */
export default function SettingsPage() {
  const [col, setCol] = useState(false);
  const [nav, setNav] = useState("settings");
  const [tab, setTab] = useState("profile");
  const [ready, setReady] = useState(false);

  // Profile state
  const [name, setName] = useState("Rodrigo Nutra");
  const [email] = useState("rodrigo@creatyng.com");
  const [phone, setPhone] = useState("+55 63 9 9999-0000");

  // Prefs state
  const [lang, setLang] = useState("pt");
  const [theme, setTheme] = useState("light");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);

  // Brand state
  const [brandColors] = useState(["#ff713d", "#141417", "#f5f5f3", "#7C3AED"]);
  const [brandFonts] = useState(["Instrument Sans", "Inter"]);

  // API state
  const [apiKeys] = useState([
    { id: 1, name: "Produção", key: "ck_live_••••••••••••a3f7", created: "12 Jan 2026" },
    { id: 2, name: "Desenvolvimento", key: "ck_test_••••••••••••b8e2", created: "28 Fev 2026" },
  ]);

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

  /* ─── TAB CONTENT ─── */
  const renderTab = () => {
    if (tab === "profile") return (
      <div style={anim(80)}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Perfil</h2>
        <p style={{ fontSize: 13, color: C.text3, marginBottom: 28 }}>Gerencie suas informações pessoais.</p>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.accent}, ${C.dark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 26,
            }}>R</div>
            <button style={{
              position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%",
              background: C.white, border: `1.5px solid ${C.borderStrong}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: C.text2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}><IcoCamera /></button>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>Rodrigo Nutra</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Plano Pro · Membro desde Jan 2026</div>
          </div>
        </div>

        <div style={{ maxWidth: 420 }}>
          <Input label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
          <Input label="Email" value={email} onChange={() => {}} disabled placeholder="" />
          <Input label="Telefone" value={phone} onChange={setPhone} placeholder="+55 00 0000-0000" />
        </div>

        <button style={{
          padding: "10px 28px", borderRadius: 9, border: "none",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", boxShadow: `0 3px 10px ${C.accent}44`, marginTop: 4,
          transition: "all 180ms",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}
        >Salvar alterações</button>

        {/* Danger zone */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.error, marginBottom: 4 }}>Zona de perigo</h3>
          <p style={{ fontSize: 12.5, color: C.text3, marginBottom: 14 }}>Ações irreversíveis para sua conta.</p>
          <button style={{
            padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${C.error}`,
            background: "transparent", color: C.error, fontSize: 12.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 150ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.error}0A`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >Excluir minha conta</button>
        </div>
      </div>
    );

    if (tab === "prefs") return (
      <div style={anim(80)}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Preferências</h2>
        <p style={{ fontSize: 13, color: C.text3, marginBottom: 28 }}>Personalize sua experiência no Creatyng.</p>

        {/* Language */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 8, display: "block" }}>Idioma</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: "pt", label: "Português", ico: "🇧🇷" }, { id: "en", label: "English", ico: "🇺🇸" }, { id: "es", label: "Español", ico: "🇪🇸" }].map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                border: lang === l.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                background: lang === l.id ? C.accentPale : C.white,
                color: lang === l.id ? C.accent : C.text2, fontWeight: lang === l.id ? 600 : 400,
                fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 150ms",
              }}>
                <IcoGlobe stroke={lang === l.id ? C.accent : C.text4} />{l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 8, display: "block" }}>Tema</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "light", label: "Claro", ico: IcoSun },
              { id: "dark", label: "Escuro", ico: IcoMoon },
            ].map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                border: theme === t.id ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                background: theme === t.id ? C.accentPale : C.white,
                color: theme === t.id ? C.accent : C.text2, fontWeight: theme === t.id ? 600 : 400,
                fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 150ms",
              }}>
                <t.ico stroke={theme === t.id ? C.accent : C.text4} />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 4, display: "block" }}>Notificações</label>
          <div style={{ maxWidth: 360 }}>
            <Toggle label="Notificações por email" on={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            <Toggle label="Notificações push" on={pushNotif} onToggle={() => setPushNotif(!pushNotif)} />
          </div>
        </div>

        <button style={{
          padding: "10px 28px", borderRadius: 9, border: "none",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", boxShadow: `0 3px 10px ${C.accent}44`, marginTop: 12,
        }}>Salvar preferências</button>
      </div>
    );

    if (tab === "brand") return (
      <div style={anim(80)}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Brand Kit</h2>
        <p style={{ fontSize: 13, color: C.text3, marginBottom: 28 }}>Configure a identidade visual da sua marca para aplicar nos criativos.</p>

        {/* Logo upload */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 8, display: "block" }}>Logo da marca</label>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 14, border: `2px dashed ${C.borderStrong}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", background: C.white, transition: "all 150ms", color: C.text4, gap: 4,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.color = C.text4; }}
            >
              <IcoUpload size={22} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>Upload</span>
            </div>
            <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
              PNG, SVG ou JPG<br />Recomendado: 512x512px<br />Máximo: 2MB
            </div>
          </div>
        </div>

        {/* Brand colors */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 10, display: "block" }}>Cores da marca</label>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {brandColors.map((c, i) => <ColorSwatch key={i} color={c} />)}
            <button style={{
              width: 40, height: 40, borderRadius: 10, border: `2px dashed ${C.borderStrong}`,
              background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.text4, transition: "all 150ms",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.color = C.text4; }}
            ><IcoPlus size={16} /></button>
          </div>
        </div>

        {/* Brand fonts */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, marginBottom: 10, display: "block" }}>Fontes da marca</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {brandFonts.map((f, i) => (
              <div key={i} style={{
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1, fontFamily: f }}>{f}</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: C.text4, display: "flex" }}><IcoTrash /></button>
              </div>
            ))}
            <button style={{
              padding: "8px 16px", borderRadius: 8, border: `2px dashed ${C.borderStrong}`,
              background: C.white, cursor: "pointer", color: C.text4, fontSize: 12.5, fontWeight: 500,
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all 150ms",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.color = C.text4; }}
            ><IcoPlus size={14} /> Adicionar fonte</button>
          </div>
        </div>

        <button style={{
          padding: "10px 28px", borderRadius: 9, border: "none",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", boxShadow: `0 3px 10px ${C.accent}44`,
        }}>Salvar Brand Kit</button>
      </div>
    );

    if (tab === "api") return (
      <div style={anim(80)}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>API Keys</h2>
        <p style={{ fontSize: 13, color: C.text3, marginBottom: 28 }}>Gerencie suas chaves de API para integração.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 540, marginBottom: 20 }}>
          {apiKeys.map(k => (
            <div key={k.id} style={{
              padding: "14px 18px", borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text1 }}>{k.name}</div>
                <div style={{ fontSize: 12, color: C.text3, marginTop: 3, fontFamily: "monospace" }}>{k.key}</div>
                <div style={{ fontSize: 11, color: C.text4, marginTop: 3 }}>Criada em {k.created}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                  background: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11.5, fontWeight: 500, color: C.text2, fontFamily: "inherit",
                }}><IcoCopy /> Copiar</button>
                <button style={{
                  padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.error}33`,
                  background: "transparent", cursor: "pointer", display: "flex", alignItems: "center",
                  color: C.error,
                }}><IcoTrash /></button>
              </div>
            </div>
          ))}
        </div>

        <button style={{
          padding: "10px 22px", borderRadius: 9, border: `1.5px solid ${C.accent}`,
          background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
        }}><IcoPlus size={15} /> Nova API Key</button>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", background: C.bg, minHeight: "100vh", display: "flex", color: C.text1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(20,20,23,0.08);border-radius:3px}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:${C.accent} !important;box-shadow:0 0 0 2px ${C.accent}22}
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
          flex: 1, overflowY: "auto", display: "flex",
          background: `
            radial-gradient(ellipse 600px 400px at 10% 4%, rgba(255,113,61,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 500px 350px at 80% 8%, rgba(255,155,112,0.06) 0%, transparent 65%),
            ${gridSvg}, ${noiseSvg}, ${C.bg}
          `,
        }}>
          {/* Settings sidebar (tabs) */}
          <div style={{
            width: 220, minWidth: 220, borderRight: `1px solid ${C.border}`, padding: "28px 16px",
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 20, padding: "0 8px" }}>Configurações</h2>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer",
                  background: active ? C.accentPale : "transparent",
                  border: active ? `1px solid ${C.accent}33` : "1px solid transparent",
                  color: active ? C.accent : C.text2, fontWeight: active ? 600 : 400,
                  fontSize: 13.5, fontFamily: "inherit", transition: "all 150ms",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(20,20,23,0.03)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <t.icon size={18} />{t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, padding: "28px 36px 48px", overflowY: "auto" }}>
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
