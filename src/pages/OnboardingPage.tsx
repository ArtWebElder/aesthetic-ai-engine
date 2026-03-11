import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Code2, Target, Briefcase, Play, Megaphone, Camera, Sparkles,
  Utensils, Shirt, ShoppingBag, BookOpen, BarChart2, Video, Mic, Monitor,
  Hash, Globe, Image, Package, Upload, Check, ChevronRight, ChevronLeft, Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n';

/* ─── Types ──────────────────────────────────────────── */
type ProfileId = 'designer' | 'webdev' | 'traffic' | 'business' | 'creator' | 'social' | 'photographer' | 'other';
type ObjectiveId = 'social_posts' | 'promotions' | 'ads' | 'thumbnails' | 'brand' | 'product_photos';

/* ─── Data ───────────────────────────────────────────── */
const PROFILES: { id: ProfileId; label: string; sub: string; Icon: React.FC<{ size?: number; stroke?: string }>; color: string }[] = [
  { id: 'designer', label: 'Designer / Criativo', sub: 'Freelancer ou agência de design', Icon: Palette, color: '#7C3AED' },
  { id: 'webdev', label: 'Web Designer / Dev', sub: 'Sites, landing pages, UI/UX', Icon: Code2, color: '#06B6D4' },
  { id: 'traffic', label: 'Gestor de Tráfego', sub: 'Criativos para campanhas pagas', Icon: Target, color: '#F59E0B' },
  { id: 'business', label: 'Empresário / Dono de Negócio', sub: 'Restaurante, loja, serviços', Icon: Briefcase, color: '#ff713d' },
  { id: 'creator', label: 'YouTuber / Creator', sub: 'Thumbnails, banners, social media', Icon: Play, color: '#EF4444' },
  { id: 'social', label: 'Social Media Manager', sub: 'Gestão de conteúdo e posts', Icon: Megaphone, color: '#10B981' },
  { id: 'photographer', label: 'Fotógrafo / Produtor', sub: 'Fotos de produto e ensaios', Icon: Camera, color: '#8B5CF6' },
  { id: 'other', label: 'Outro', sub: 'Nenhum dos acima', Icon: Sparkles, color: '#8e8e96' },
];

const SUBCATEGORIES: Record<ProfileId, { id: string; label: string; Icon: React.FC<{ size?: number; stroke?: string }> }[]> = {
  business: [
    { id: 'restaurant', label: 'Restaurante / Lanchonete', Icon: Utensils },
    { id: 'acai', label: 'Açaiteria / Sucos / Sorvetes', Icon: Utensils },
    { id: 'pizzaria', label: 'Pizzaria / Sushi / Japonesa', Icon: Utensils },
    { id: 'bakery', label: 'Confeitaria / Padaria / Café', Icon: Utensils },
    { id: 'fashion', label: 'Moda / Vestuário / Acessórios', Icon: Shirt },
    { id: 'beauty', label: 'Beleza / Estética / Saúde', Icon: Sparkles },
    { id: 'ecommerce', label: 'E-commerce / Loja Virtual', Icon: ShoppingBag },
    { id: 'services', label: 'Serviços em geral', Icon: Briefcase },
  ],
  designer: [
    { id: 'freelancer', label: 'Freelancer independente', Icon: Palette },
    { id: 'agency', label: 'Agência de design', Icon: Monitor },
    { id: 'branding', label: 'Branding / Identidade visual', Icon: Image },
    { id: 'social-design', label: 'Social media design', Icon: Hash },
  ],
  traffic: [
    { id: 'meta-ads', label: 'Meta Ads (Facebook/Instagram)', Icon: Target },
    { id: 'google-ads', label: 'Google Ads / Display', Icon: Globe },
    { id: 'multi-channel', label: 'Multi-canal / Full stack', Icon: BarChart2 },
  ],
  creator: [
    { id: 'youtube', label: 'YouTube (thumbnails, banners)', Icon: Play },
    { id: 'tiktok', label: 'TikTok / Reels / Shorts', Icon: Video },
    { id: 'podcast', label: 'Podcast / Áudio', Icon: Mic },
    { id: 'streaming', label: 'Streaming / Live', Icon: Monitor },
  ],
  webdev: [
    { id: 'landing', label: 'Landing pages / Sites', Icon: Monitor },
    { id: 'uiux', label: 'UI/UX Design', Icon: Monitor },
    { id: 'saas', label: 'SaaS / Produto digital', Icon: Code2 },
  ],
  social: [
    { id: 'instagram', label: 'Instagram / Facebook', Icon: Hash },
    { id: 'multi-social', label: 'Multi-plataforma', Icon: Globe },
    { id: 'influencer', label: 'Influencer marketing', Icon: Megaphone },
  ],
  photographer: [
    { id: 'product-photo', label: 'Fotografia de produto', Icon: Camera },
    { id: 'food-photo', label: 'Fotografia gastronômica', Icon: Utensils },
    { id: 'portrait', label: 'Retratos / Ensaios', Icon: Camera },
  ],
  other: [
    { id: 'curious', label: 'Só quero explorar', Icon: Sparkles },
  ],
};

const GOALS: { id: ObjectiveId; label: string; desc: string; Icon: React.FC<{ size?: number; stroke?: string }> }[] = [
  { id: 'social_posts', label: 'Posts para redes sociais', desc: 'Instagram, Facebook, TikTok', Icon: Hash },
  { id: 'promotions', label: 'Promoções e ofertas', desc: 'Destaque de preços, combos, descontos', Icon: Megaphone },
  { id: 'ads', label: 'Criativos para anúncios', desc: 'Meta Ads, Google Display, TikTok Ads', Icon: Target },
  { id: 'thumbnails', label: 'Thumbnails e banners', desc: 'YouTube, blog, apresentações', Icon: Image },
  { id: 'brand', label: 'Identidade visual consistente', desc: 'Logo, cores, tipografia unificada', Icon: Palette },
  { id: 'product_photos', label: 'Fotos de produto profissionais', desc: 'E-commerce, catálogo, cardápio', Icon: Camera },
];

const QUICK_CREATE_MAP: Record<string, { title: string; desc: string; suggestions: string[] }> = {
  business: { title: 'Criativo para seu negócio', desc: 'Suba a foto do seu produto e escolha o estilo.', suggestions: ['Food / Pop', 'Pop Design'] },
  designer: { title: 'Criativo de portfólio', desc: 'Gere uma peça profissional para mostrar ao cliente.', suggestions: ['Pop Design', 'Editorial'] },
  traffic: { title: 'Criativo para campanha', desc: 'Crie um anúncio de alta conversão agora.', suggestions: ['Food / Pop', 'Pop Design'] },
  creator: { title: 'Thumbnail para seu conteúdo', desc: 'Gere uma thumb que atrai cliques.', suggestions: ['Pop Design', 'Neon Glow'] },
  webdev: { title: 'Mockup ou visual', desc: 'Gere um visual para seu projeto web.', suggestions: ['Pop Design', 'Editorial'] },
  social: { title: 'Post para o feed', desc: 'Crie um post profissional em segundos.', suggestions: ['Food / Pop', 'Pop Design'] },
  photographer: { title: 'Composição fotográfica', desc: 'Transforme sua foto em criativo de agência.', suggestions: ['Food / Pop', 'Editorial'] },
  other: { title: 'Seu primeiro criativo', desc: 'Escolha um estilo e comece a criar.', suggestions: ['Food / Pop', 'Pop Design'] },
};

/* ─── Main component ─────────────────────────────────── */
export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<ObjectiveId[]>([]);
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [ready, setReady] = useState(false);
  const [trans, setTrans] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const TOTAL_STEPS = 5;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const profileColor = PROFILES.find(p => p.id === profile)?.color || '#ff713d';

  const go = (dir: number) => {
    setTrans(true);
    setTimeout(() => { setStep(s => s + dir); setTrans(false); }, 180);
  };

  const canNext = () => {
    if (step === 0) return !!profile;
    if (step === 1) return !!subcat;
    if (step === 2) return selectedGoals.length > 0;
    if (step === 3) return !!plan;
    return true;
  };

  const finish = () => {
    try { localStorage.setItem('creatyng_onboarding', JSON.stringify({ profile, subcat, goals: selectedGoals, plan, completed: true })); } catch { /* ignore */ }
    navigate('/app/dashboard', { replace: true });
  };

  const STEP_INFO = [
    { title: 'Qual seu perfil?', sub: 'Vamos personalizar tudo pra você.' },
    { title: 'Mais sobre o que faz', sub: `Conte mais sobre sua atuação como ${PROFILES.find(p => p.id === profile)?.label || ''}.` },
    { title: 'O que quer criar?', sub: 'Selecione seus objetivos principais.' },
    { title: 'Escolha seu plano', sub: 'Comece grátis ou desbloqueie tudo com o Pro.' },
    { title: QUICK_CREATE_MAP[profile || 'other']?.title || 'Crie agora!', sub: QUICK_CREATE_MAP[profile || 'other']?.desc || '' },
  ];

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  const subs = profile ? SUBCATEGORIES[profile] || [] : [];

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
      minHeight: '100vh',
      background: `radial-gradient(ellipse 700px 500px at 50% 8%, rgba(255,113,61,0.07) 0%, transparent 60%), ${gridSvg}, #f5f5f3`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: '#141417',
    }}>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        .ob-btn{transition:all 150ms}
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 680, padding: '28px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>C</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Creatyng</span>
          </div>
          <span style={{ fontSize: 12, color: '#8e8e96', fontWeight: 500 }}>Passo {step + 1} de {TOTAL_STEPS}</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(20,20,23,0.06)', marginBottom: 32 }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #ff713d, #FF9B70)', transition: 'width 400ms ease' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{
        width: '100%', maxWidth: 680, padding: '0 24px', flex: 1,
        opacity: trans ? 0 : 1, transform: trans ? 'translateY(6px)' : '', transition: 'all 180ms ease',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{STEP_INFO[step].title}</h1>
        <p style={{ fontSize: 14, color: '#5a5a60', marginBottom: 24 }}>{STEP_INFO[step].sub}</p>

        {/* STEP 0: Profile */}
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PROFILES.map((p, i) => {
              const selected = profile === p.id;
              return (
                <button key={p.id} className="ob-btn" onClick={() => { setProfile(p.id); setSubcat(null); }} style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: selected ? `2px solid ${p.color}` : '1px solid rgba(20,20,23,0.06)',
                  background: selected ? `${p.color}0A` : '#ffffff', color: '#141417',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                  animation: ready ? `scIn 280ms ${i * 35}ms ease both` : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: selected ? `${p.color}14` : 'rgba(20,20,23,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected ? p.color : '#8e8e96',
                  }}>
                    <p.Icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500 }}>{p.label}</div>
                    <div style={{ fontSize: 11.5, color: '#8e8e96', marginTop: 1 }}>{p.sub}</div>
                  </div>
                  {selected && <Check size={16} color={p.color} />}
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 1: Subcategory */}
        {step === 1 && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subs.map((s, i) => {
              const selected = subcat === s.id;
              return (
                <button key={s.id} className="ob-btn" onClick={() => setSubcat(s.id)} style={{
                  padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: selected ? `2px solid ${profileColor}` : '1px solid rgba(20,20,23,0.06)',
                  background: selected ? `${profileColor}0A` : '#ffffff', color: '#141417',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                  animation: ready ? `scIn 280ms ${i * 35}ms ease both` : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: selected ? `${profileColor}14` : 'rgba(20,20,23,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected ? profileColor : '#8e8e96',
                  }}>
                    <s.Icon size={18} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500 }}>{s.label}</div>
                  {selected && <Check size={16} color={profileColor} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 2: Goals (multi-select) */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GOALS.map((g, i) => {
              const sel = selectedGoals.includes(g.id);
              return (
                <button key={g.id} className="ob-btn" onClick={() => setSelectedGoals(prev => sel ? prev.filter(x => x !== g.id) : [...prev, g.id])} style={{
                  padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: sel ? '2px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                  background: sel ? '#FFF0EA' : '#ffffff', color: '#141417',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%',
                  animation: ready ? `scIn 280ms ${i * 40}ms ease both` : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: sel ? '2px solid #ff713d' : '2px solid rgba(20,20,23,0.1)',
                    background: sel ? '#ff713d' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {sel && <Check size={13} color="#fff" />}
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: sel ? 'rgba(255,113,61,0.12)' : 'rgba(20,20,23,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sel ? '#ff713d' : '#8e8e96',
                  }}>
                    <g.Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: sel ? 600 : 500 }}>{g.label}</div>
                    <div style={{ fontSize: 11.5, color: '#8e8e96', marginTop: 1 }}>{g.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 3: Plan upsell */}
        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {([
              { id: 'free' as const, name: 'Grátis', price: 'R$ 0', credits: '50 créditos', feats: ['2 templates', 'Export PNG', "Marca d'água Creatyng"], cta: 'Começar grátis', outline: true },
              { id: 'pro' as const, name: 'Pro', price: 'R$ 49', period: '/mês', credits: '500 créditos', badge: 'Recomendado', feats: ['Todos os templates', "Sem marca d'água", 'Chat AI ilimitado', 'Brand Kit', 'Multi-formato'], cta: 'Assinar Pro', outline: false },
            ]).map((p, i) => (
              <div key={p.id} onClick={() => setPlan(p.id)} style={{
                background: '#ffffff', borderRadius: 14, padding: '22px 20px', cursor: 'pointer',
                border: plan === p.id ? '2px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                transition: 'all 150ms', position: 'relative',
                animation: ready ? `scIn 300ms ${i * 60}ms ease both` : 'none',
              }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 6, background: '#ff713d', color: '#fff', fontSize: 10, fontWeight: 700 }}>{p.badge}</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: p.outline ? '#8e8e96' : '#ff713d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: p.outline ? '#141417' : '#ff713d' }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 13, color: '#8e8e96' }}>{p.period}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#8e8e96', marginBottom: 18 }}>{p.credits} / mês</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {p.feats.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#5a5a60' }}>
                      <Check size={16} color="#10B981" />{f}
                    </div>
                  ))}
                </div>
                <button style={{
                  width: '100%', padding: '10px 0', borderRadius: 9, marginTop: 18, fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  ...(p.outline
                    ? { border: '1px solid rgba(20,20,23,0.1)', background: '#ffffff', color: '#141417' }
                    : { border: 'none', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', color: '#fff', boxShadow: '0 3px 12px rgba(255,113,61,0.27)' }
                  ),
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: Quick create */}
        {step === 4 && (
          <div style={{ textAlign: 'center', animation: 'fdUp 400ms ease both' }}>
            <div style={{
              width: 300, height: 190, borderRadius: 16, margin: '0 auto 24px',
              border: '2px dashed rgba(20,20,23,0.1)', background: '#ffffff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 180ms', gap: 8, color: '#8e8e96',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ff713d'; (e.currentTarget as HTMLElement).style.color = '#ff713d'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,20,23,0.1)'; (e.currentTarget as HTMLElement).style.color = '#8e8e96'; }}
            >
              <Upload size={28} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Arraste sua imagem aqui</div>
              <div style={{ fontSize: 12 }}>PNG, JPG ou WebP · Máx 10MB</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              {(QUICK_CREATE_MAP[profile || 'other']?.suggestions || ['Food / Pop', 'Pop Design']).map((s, i) => (
                <div key={i} style={{
                  padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(20,20,23,0.06)',
                  background: '#ffffff', cursor: 'pointer', transition: 'all 150ms',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = profileColor; (e.currentTarget as HTMLElement).style.background = `${profileColor}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,20,23,0.06)'; (e.currentTarget as HTMLElement).style.background = '#ffffff'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: profileColor }}>{s}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: '#8e8e96', maxWidth: 400, margin: '0 auto' }}>
              {QUICK_CREATE_MAP[profile || 'other']?.desc || 'Escolha um estilo e comece a criar.'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ width: '100%', maxWidth: 680, padding: '20px 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {step > 0 ? (
          <button onClick={() => go(-1)} style={{
            padding: '9px 18px', borderRadius: 9, border: '1px solid rgba(20,20,23,0.1)',
            background: '#ffffff', color: '#5a5a60', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <ChevronLeft size={18} /> Voltar
          </button>
        ) : <div />}

        {step < 4 ? (
          <button onClick={() => canNext() && go(1)} disabled={!canNext()} style={{
            padding: '9px 22px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#ff713d,#FF9B70)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: canNext() ? 'pointer' : 'default',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 3px 12px rgba(255,113,61,0.27)', opacity: canNext() ? 1 : 0.4, transition: 'all 180ms',
          }}>
            Continuar <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={finish} style={{
            padding: '10px 26px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#ff713d,#FF9B70)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 3px 14px rgba(255,113,61,0.27)', animation: 'pulse 2s infinite',
          }}>
            <Sparkles size={18} /> Gerar meu primeiro criativo
          </button>
        )}
      </div>

      {step < 4 && (
        <button onClick={finish} style={{
          background: 'none', border: 'none', color: '#b5b5bb', fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit', paddingBottom: 20,
        }}>Pular configuração</button>
      )}
    </div>
  );
}
