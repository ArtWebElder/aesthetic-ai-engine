import { useState, useEffect } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", purple: "#7C3AED", cyan: "#06B6D4",
};

/* ─── SVG ICONS (all inline, no emojis) ─── */
const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoArrowR = (p) => <Ico size={18} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ico>;
const IcoArrowL = (p) => <Ico size={18} {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Ico>;
const IcoCheck = (p) => <Ico size={16} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoSparkle = (p) => <Ico size={20} {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoUpload = (p) => <Ico size={28} {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></Ico>;
// Profile icons
const IcoPen = (p) => <Ico size={22} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></Ico>;
const IcoTarget = (p) => <Ico size={22} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Ico>;
const IcoStore = (p) => <Ico size={22} {...p}><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V13h6v8"/><path d="M3 9h18"/></Ico>;
const IcoPlay = (p) => <Ico size={22} {...p}><polygon points="5 3 19 12 5 21 5 3"/></Ico>;
const IcoBriefcase = (p) => <Ico size={22} {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></Ico>;
const IcoCode = (p) => <Ico size={22} {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Ico>;
const IcoMegaphone = (p) => <Ico size={22} {...p}><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></Ico>;
const IcoCamera = (p) => <Ico size={22} {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Ico>;
// Subcategory icons
const IcoUtensils = (p) => <Ico size={18} {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></Ico>;
const IcoShirt = (p) => <Ico size={18} {...p}><path d="M20.38 3.46L16 2 12 5 8 2 3.62 3.46a2 2 0 00-1.34 1.93L3 21h18l.72-15.61a2 2 0 00-1.34-1.93z"/></Ico>;
const IcoMonitor = (p) => <Ico size={18} {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Ico>;
const IcoLayout = (p) => <Ico size={18} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></Ico>;
const IcoBarChart = (p) => <Ico size={18} {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></Ico>;
const IcoVideo = (p) => <Ico size={18} {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></Ico>;
const IcoMic = (p) => <Ico size={18} {...p}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></Ico>;
const IcoBox = (p) => <Ico size={18} {...p}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>;
const IcoGlobe = (p) => <Ico size={18} {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></Ico>;
const IcoImage = (p) => <Ico size={18} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>;
const IcoHash = (p) => <Ico size={18} {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Ico>;
const IcoZap = (p) => <Ico size={16} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.accent} stroke={C.accent}/></Ico>;

/* ─── PROFILE TYPES ─── */
const profiles = [
  { id: "designer", label: "Designer / Criativo", sub: "Freelancer ou agência de design", icon: IcoPen, color: C.purple },
  { id: "webdev", label: "Web Designer / Dev", sub: "Sites, landing pages, UI/UX", icon: IcoCode, color: C.cyan },
  { id: "traffic", label: "Gestor de Tráfego", sub: "Criativos para campanhas pagas", icon: IcoTarget, color: "#F59E0B" },
  { id: "business", label: "Empresário / Dono de Negócio", sub: "Restaurante, loja, serviços", icon: IcoBriefcase, color: C.accent },
  { id: "creator", label: "YouTuber / Creator", sub: "Thumbnails, banners, social media", icon: IcoPlay, color: "#EF4444" },
  { id: "social", label: "Social Media Manager", sub: "Gestão de conteúdo e posts", icon: IcoMegaphone, color: "#10B981" },
  { id: "photographer", label: "Fotógrafo / Produtor", sub: "Fotos de produto e ensaios", icon: IcoCamera, color: "#8B5CF6" },
  { id: "other", label: "Outro", sub: "Nenhum dos acima", icon: IcoSparkle, color: C.text3 },
];

/* ─── SUBCATEGORIES by profile ─── */
const subcategories = {
  business: [
    { id: "restaurant", label: "Restaurante / Lanchonete", icon: IcoUtensils },
    { id: "acai", label: "Açaiteria / Sucos / Sorvetes", icon: IcoUtensils },
    { id: "pizzaria", label: "Pizzaria / Sushi / Japonesa", icon: IcoUtensils },
    { id: "bakery", label: "Confeitaria / Padaria / Café", icon: IcoUtensils },
    { id: "fashion", label: "Moda / Vestuário / Acessórios", icon: IcoShirt },
    { id: "beauty", label: "Beleza / Estética / Saúde", icon: IcoSparkle },
    { id: "ecommerce", label: "E-commerce / Loja Virtual", icon: IcoBox },
    { id: "services", label: "Serviços em geral", icon: IcoBriefcase },
  ],
  designer: [
    { id: "freelancer", label: "Freelancer independente", icon: IcoPen },
    { id: "agency", label: "Agência de design", icon: IcoLayout },
    { id: "branding", label: "Branding / Identidade visual", icon: IcoImage },
    { id: "social-design", label: "Social media design", icon: IcoHash },
  ],
  traffic: [
    { id: "meta-ads", label: "Meta Ads (Facebook/Instagram)", icon: IcoTarget },
    { id: "google-ads", label: "Google Ads / Display", icon: IcoGlobe },
    { id: "multi-channel", label: "Multi-canal / Full stack", icon: IcoBarChart },
  ],
  creator: [
    { id: "youtube", label: "YouTube (thumbnails, banners)", icon: IcoPlay },
    { id: "tiktok", label: "TikTok / Reels / Shorts", icon: IcoVideo },
    { id: "podcast", label: "Podcast / Áudio", icon: IcoMic },
    { id: "streaming", label: "Streaming / Live", icon: IcoMonitor },
  ],
  webdev: [
    { id: "landing", label: "Landing pages / Sites", icon: IcoLayout },
    { id: "uiux", label: "UI/UX Design", icon: IcoMonitor },
    { id: "saas", label: "SaaS / Produto digital", icon: IcoCode },
  ],
  social: [
    { id: "instagram", label: "Instagram / Facebook", icon: IcoHash },
    { id: "multi-social", label: "Multi-plataforma", icon: IcoGlobe },
    { id: "influencer", label: "Influencer marketing", icon: IcoMegaphone },
  ],
  photographer: [
    { id: "product-photo", label: "Fotografia de produto", icon: IcoCamera },
    { id: "food-photo", label: "Fotografia gastronômica", icon: IcoUtensils },
    { id: "portrait", label: "Retratos / Ensaios", icon: IcoCamera },
  ],
  other: [
    { id: "curious", label: "Só quero explorar", icon: IcoSparkle },
  ],
};

/* ─── GOALS ─── */
const goals = [
  { id: "social-posts", label: "Posts para redes sociais", desc: "Instagram, Facebook, TikTok", icon: IcoHash },
  { id: "promo", label: "Promoções e ofertas", desc: "Destaque de preços, combos, descontos", icon: IcoMegaphone },
  { id: "ads", label: "Criativos para anúncios", desc: "Meta Ads, Google Display, TikTok Ads", icon: IcoTarget },
  { id: "thumbnails", label: "Thumbnails e banners", desc: "YouTube, blog, apresentações", icon: IcoImage },
  { id: "brand", label: "Identidade visual consistente", desc: "Logo, cores, tipografia unificada", icon: IcoPen },
  { id: "product", label: "Fotos de produto profissionais", desc: "E-commerce, catálogo, cardápio", icon: IcoCamera },
];

/* ─── CONTEXTUAL QUICK CREATE ─── */
const quickCreateMap = {
  business: { title: "Criativo para seu negócio", desc: "Suba a foto do seu produto e escolha o estilo.", suggestions: ["Food / Pop", "Pop Design"] },
  designer: { title: "Criativo de portfólio", desc: "Gere uma peça profissional para mostrar ao cliente.", suggestions: ["Pop Design", "Editorial"] },
  traffic: { title: "Criativo para campanha", desc: "Crie um anúncio de alta conversão agora.", suggestions: ["Food / Pop", "Pop Design"] },
  creator: { title: "Thumbnail para seu conteúdo", desc: "Gere uma thumb que atrai cliques.", suggestions: ["Pop Design", "Neon Glow"] },
  webdev: { title: "Mockup ou visual", desc: "Gere um visual para seu projeto web.", suggestions: ["Pop Design", "Editorial"] },
  social: { title: "Post para o feed", desc: "Crie um post profissional em segundos.", suggestions: ["Food / Pop", "Pop Design"] },
  photographer: { title: "Composição fotográfica", desc: "Transforme sua foto em criativo de agência.", suggestions: ["Food / Pop", "Editorial"] },
  other: { title: "Seu primeiro criativo", desc: "Escolha um estilo e comece a criar.", suggestions: ["Food / Pop", "Pop Design"] },
};

/* ─── CARD COMPONENT ─── */
function SelectCard({ icon: Icon, label, sub, selected, onClick, color, index = 0, ready = true }) {
  return (
    <button onClick={onClick} style={{
      padding: sub ? "14px 16px" : "11px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
      border: selected ? `2px solid ${color || C.accent}` : `1px solid ${C.border}`,
      background: selected ? `${color || C.accent}0A` : C.white, color: C.text1,
      display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%",
      transition: "all 150ms", animation: ready ? `scIn 280ms ${index * 35}ms ease both` : "none",
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = C.borderStrong; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: selected ? `${color || C.accent}14` : "rgba(20,20,23,0.03)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: selected ? (color || C.accent) : C.text3, transition: "all 150ms",
      }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>{sub}</div>}
      </div>
      {selected && <IcoCheck stroke={color || C.accent} />}
    </button>
  );
}

/* ─── MAIN ─── */
export default function OnboardingV2() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(null);
  const [subcat, setSubcat] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [plan, setPlan] = useState(null);
  const [ready, setReady] = useState(false);
  const [trans, setTrans] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;
  const profileColor = profiles.find(p => p.id === profile)?.color || C.accent;

  const go = (dir) => { setTrans(true); setTimeout(() => { setStep(s => s + dir); setTrans(false); }, 180); };

  const canNext = () => {
    if (step === 0) return !!profile;
    if (step === 1) return !!subcat;
    if (step === 2) return selectedGoals.length > 0;
    if (step === 3) return !!plan;
    return true;
  };

  const stepInfo = [
    { title: "Qual seu perfil?", sub: "Vamos personalizar tudo pra você." },
    { title: "Mais sobre o que faz", sub: `Conte mais sobre sua atuação como ${profiles.find(p=>p.id===profile)?.label || ""}.` },
    { title: "O que quer criar?", sub: "Selecione seus objetivos principais." },
    { title: "Escolha seu plano", sub: "Comece grátis ou desbloqueie tudo com o Pro." },
    { title: quickCreateMap[profile]?.title || "Crie agora!", sub: quickCreateMap[profile]?.desc || "" },
  ];

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: "100vh",
      background: `radial-gradient(ellipse 700px 500px at 50% 8%, rgba(255,113,61,0.07) 0%, transparent 60%), ${gridSvg}, ${C.bg}`,
      display: "flex", flexDirection: "column", alignItems: "center", color: C.text1,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 680, padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>C</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Creatyng</span>
          </div>
          <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>Passo {step + 1} de {totalSteps}</span>
        </div>
        <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(20,20,23,0.06)", marginBottom: 32 }}>
          <div style={{ width: `${progress}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, transition: "width 400ms ease" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{
        width: "100%", maxWidth: 680, padding: "0 24px", flex: 1,
        opacity: trans ? 0 : 1, transform: trans ? "translateY(6px)" : "", transition: "all 180ms ease",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{stepInfo[step].title}</h1>
        <p style={{ fontSize: 14, color: C.text2, marginBottom: 24 }}>{stepInfo[step].sub}</p>

        {/* STEP 0: Profile type */}
        {step === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {profiles.map((p, i) => (
              <SelectCard key={p.id} icon={p.icon} label={p.label} sub={p.sub} color={p.color}
                selected={profile === p.id} onClick={() => { setProfile(p.id); setSubcat(null); }} index={i} ready={ready} />
            ))}
          </div>
        )}

        {/* STEP 1: Subcategory */}
        {step === 1 && profile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(subcategories[profile] || []).map((s, i) => (
              <SelectCard key={s.id} icon={s.icon} label={s.label} color={profileColor}
                selected={subcat === s.id} onClick={() => setSubcat(s.id)} index={i} ready={ready} />
            ))}
          </div>
        )}

        {/* STEP 2: Goals (multi-select) */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {goals.map((g, i) => {
              const sel = selectedGoals.includes(g.id);
              return (
                <button key={g.id} onClick={() => setSelectedGoals(p => sel ? p.filter(x => x !== g.id) : [...p, g.id])} style={{
                  padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  border: sel ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: sel ? C.accentPale : C.white, color: C.text1,
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%",
                  transition: "all 150ms", animation: `scIn 280ms ${i * 40}ms ease both`,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: sel ? `2px solid ${C.accent}` : `2px solid ${C.borderStrong}`,
                    background: sel ? C.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms",
                  }}>{sel && <IcoCheck size={13} stroke="#fff" />}</div>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: sel ? `${C.accent}14` : "rgba(20,20,23,0.03)", display: "flex", alignItems: "center", justifyContent: "center", color: sel ? C.accent : C.text3, flexShrink: 0 }}>
                    <g.icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: sel ? 600 : 500 }}>{g.label}</div>
                    <div style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>{g.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 3: Plan upsell */}
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { id: "free", name: "Grátis", price: "R$ 0", credits: "50 créditos", feats: ["2 templates", "Export PNG", "Marca d'água Creatyng"], cta: "Começar grátis", outline: true },
              { id: "pro", name: "Pro", price: "R$ 49", period: "/mês", credits: "500 créditos", badge: "Recomendado", feats: ["Todos os templates", "Sem marca d'água", "Chat AI ilimitado", "Brand Kit", "Multi-formato"], cta: "Assinar Pro", outline: false },
            ].map((p, i) => (
              <div key={p.id} onClick={() => setPlan(p.id)} style={{
                background: C.white, borderRadius: 14, padding: "22px 20px", cursor: "pointer",
                border: plan === p.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                transition: "all 150ms", position: "relative", animation: `scIn 300ms ${i * 60}ms ease both`,
              }}>
                {p.badge && <div style={{ position: "absolute", top: 12, right: 12, padding: "3px 10px", borderRadius: 6, background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700 }}>{p.badge}</div>}
                <div style={{ fontSize: 12, fontWeight: 600, color: p.outline ? C.text3 : C.accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: p.outline ? C.text1 : C.accent }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 13, color: C.text3 }}>{p.period}</span>}
                </div>
                <div style={{ fontSize: 13, color: C.text3, marginBottom: 18 }}>{p.credits} / mês</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {p.feats.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.text2 }}>
                      <IcoCheck stroke={C.success} />{f}
                    </div>
                  ))}
                </div>
                <button style={{
                  width: "100%", padding: "10px 0", borderRadius: 9, marginTop: 18, fontFamily: "inherit",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  ...(p.outline
                    ? { border: `1px solid ${C.borderStrong}`, background: C.white, color: C.text1 }
                    : { border: "none", background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, color: "#fff", boxShadow: `0 3px 12px ${C.accent}44` }
                  ),
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: Contextual quick create */}
        {step === 4 && (
          <div style={{ textAlign: "center", animation: "fdUp 400ms ease both" }}>
            <div style={{
              width: 300, height: 190, borderRadius: 16, margin: "0 auto 24px",
              border: `2px dashed ${C.borderStrong}`, background: C.white,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 180ms", gap: 8, color: C.text3,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.color = C.text3; }}
            >
              <IcoUpload />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Arraste sua imagem aqui</div>
              <div style={{ fontSize: 12 }}>PNG, JPG ou WebP · Máx 10MB</div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
              {(quickCreateMap[profile]?.suggestions || ["Food / Pop", "Pop Design"]).map((s, i) => (
                <div key={i} style={{
                  padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.white, cursor: "pointer", transition: "all 150ms",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = profileColor; e.currentTarget.style.background = `${profileColor}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: profileColor }}>{s}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: C.text3, maxWidth: 400, margin: "0 auto" }}>
              {quickCreateMap[profile]?.desc || "Escolha um estilo e comece a criar."}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        width: "100%", maxWidth: 680, padding: "20px 24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        {step > 0 ? (
          <button onClick={() => go(-1)} style={{
            padding: "9px 18px", borderRadius: 9, border: `1px solid ${C.borderStrong}`,
            background: C.white, color: C.text2, fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
          }}><IcoArrowL /> Voltar</button>
        ) : <div />}

        {step < 4 ? (
          <button onClick={() => canNext() && go(1)} disabled={!canNext()} style={{
            padding: "9px 22px", borderRadius: 9, border: "none",
            background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: canNext() ? "pointer" : "default",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
            boxShadow: `0 3px 12px ${C.accent}44`, opacity: canNext() ? 1 : 0.4,
            transition: "all 180ms",
          }}>Continuar <IcoArrowR /></button>
        ) : (
          <button style={{
            padding: "10px 26px", borderRadius: 9, border: "none",
            background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7,
            boxShadow: `0 3px 14px ${C.accent}44`, animation: "pulse 2s infinite",
          }}>
            <IcoSparkle /> Gerar meu primeiro criativo
          </button>
        )}
      </div>

      {step < 4 && (
        <button onClick={() => { setStep(4); setTrans(false); }} style={{
          background: "none", border: "none", color: C.text4, fontSize: 12,
          cursor: "pointer", fontFamily: "inherit", paddingBottom: 20,
        }}>Pular configuração</button>
      )}
    </div>
  );
}
