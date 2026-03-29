import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Code2, Target, Briefcase, Play, Megaphone, Camera, Sparkles,
  Utensils, Shirt, ShoppingBag, BarChart2, Video, Mic, Monitor,
  Hash, Globe, Image, Check, ChevronRight, ChevronLeft,
  Zap, Users, ExternalLink, Loader2,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/services/supabaseClient';

/* ─── Types ──────────────────────────────────────────── */
type ProfileId = 'designer' | 'webdev' | 'traffic' | 'business' | 'creator' | 'social' | 'photographer' | 'other';
type ObjectiveId = 'social_posts' | 'promotions' | 'ads' | 'thumbnails' | 'brand' | 'product_photos';

/* ─── Data ───────────────────────────────────────────── */
const PROFILES: { id: ProfileId; labelKey: string; subKey: string; Icon: React.FC<{ size?: number; stroke?: string }>; color: string }[] = [
  { id: 'designer', labelKey: 'onboarding.profile.designer', subKey: 'onboarding.sub.branding', Icon: Palette, color: '#7C3AED' },
  { id: 'webdev', labelKey: 'onboarding.profile.webdev', subKey: 'onboarding.sub.ui_ux', Icon: Code2, color: '#06B6D4' },
  { id: 'traffic', labelKey: 'onboarding.profile.traffic', subKey: 'onboarding.sub.marketing', Icon: Target, color: '#F59E0B' },
  { id: 'business', labelKey: 'onboarding.profile.business', subKey: 'onboarding.sub.local_biz', Icon: Briefcase, color: '#ff713d' },
  { id: 'creator', labelKey: 'onboarding.profile.youtuber', subKey: 'onboarding.sub.creative', Icon: Play, color: '#EF4444' },
  { id: 'social', labelKey: 'onboarding.profile.social', subKey: 'onboarding.sub.social_media', Icon: Megaphone, color: '#10B981' },
  { id: 'photographer', labelKey: 'onboarding.profile.photographer', subKey: 'onboarding.sub.product', Icon: Camera, color: '#8B5CF6' },
  { id: 'other', labelKey: 'onboarding.profile.other', subKey: 'onboarding.sub.other', Icon: Sparkles, color: '#8e8e96' },
];

const SUBCATEGORIES: Record<ProfileId, { id: string; labelKey: string; Icon: React.FC<{ size?: number; stroke?: string }> }[]> = {
  business: [
    { id: 'restaurant', labelKey: 'onboarding.sub.restaurant', Icon: Utensils },
    { id: 'acai', labelKey: 'onboarding.sub.acai', Icon: Utensils },
    { id: 'fashion', labelKey: 'onboarding.sub.fashion', Icon: Shirt },
    { id: 'ecommerce', labelKey: 'onboarding.sub.ecommerce', Icon: ShoppingBag },
    { id: 'services', labelKey: 'onboarding.sub.local_biz', Icon: Briefcase },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  designer: [
    { id: 'freelancer', labelKey: 'onboarding.sub.freelance', Icon: Palette },
    { id: 'agency', labelKey: 'onboarding.sub.agency', Icon: Monitor },
    { id: 'branding', labelKey: 'onboarding.sub.branding', Icon: Image },
    { id: 'social-design', labelKey: 'onboarding.sub.social_media', Icon: Hash },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  traffic: [
    { id: 'meta-ads', labelKey: 'onboarding.sub.marketing', Icon: Target },
    { id: 'google-ads', labelKey: 'onboarding.sub.marketing', Icon: Globe },
    { id: 'multi-channel', labelKey: 'onboarding.sub.marketing', Icon: BarChart2 },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  creator: [
    { id: 'youtube', labelKey: 'onboarding.sub.creative', Icon: Play },
    { id: 'tiktok', labelKey: 'onboarding.sub.creative', Icon: Video },
    { id: 'podcast', labelKey: 'onboarding.sub.creative', Icon: Mic },
    { id: 'streaming', labelKey: 'onboarding.sub.creative', Icon: Monitor },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  webdev: [
    { id: 'landing', labelKey: 'onboarding.sub.saas', Icon: Monitor },
    { id: 'uiux', labelKey: 'onboarding.sub.ui_ux', Icon: Monitor },
    { id: 'saas', labelKey: 'onboarding.sub.saas', Icon: Code2 },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  social: [
    { id: 'instagram', labelKey: 'onboarding.sub.social_media', Icon: Hash },
    { id: 'multi-social', labelKey: 'onboarding.sub.social_media', Icon: Globe },
    { id: 'influencer', labelKey: 'onboarding.sub.marketing', Icon: Megaphone },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  photographer: [
    { id: 'product-photo', labelKey: 'onboarding.sub.product', Icon: Camera },
    { id: 'food-photo', labelKey: 'onboarding.sub.food', Icon: Utensils },
    { id: 'portrait', labelKey: 'onboarding.sub.portrait', Icon: Camera },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
  other: [
    { id: 'curious', labelKey: 'onboarding.sub.other', Icon: Sparkles },
  ],
};

const GOALS: { id: ObjectiveId; labelKey: string; descKey: string; Icon: React.FC<{ size?: number; stroke?: string }> }[] = [
  { id: 'social_posts', labelKey: 'onboarding.obj.social_posts', descKey: 'onboarding.obj.social_posts', Icon: Hash },
  { id: 'promotions', labelKey: 'onboarding.obj.promotions', descKey: 'onboarding.obj.promotions', Icon: Megaphone },
  { id: 'ads', labelKey: 'onboarding.obj.ads', descKey: 'onboarding.obj.ads', Icon: Target },
  { id: 'thumbnails', labelKey: 'onboarding.obj.thumbnails', descKey: 'onboarding.obj.thumbnails', Icon: Image },
  { id: 'brand', labelKey: 'onboarding.obj.brand', descKey: 'onboarding.obj.brand', Icon: Palette },
  { id: 'product_photos', labelKey: 'onboarding.obj.product_photos', descKey: 'onboarding.obj.product_photos', Icon: Camera },
];

/* ─── Main component ─────────────────────────────────── */
export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, markOnboarded } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<ObjectiveId[]>([]);
  const [ready, setReady] = useState(false);
  const [trans, setTrans] = useState(false);
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  useEffect(() => { setReady(true); }, []);

  const TOTAL_STEPS = 4;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const profileColor = PROFILES.find(p => p.id === profile)?.color || '#ff713d';

  const canNext = () => {
    if (step === 0) return !!profile;
    if (step === 1) return !!subcat;
    if (step === 2) return selectedGoals.length > 0;
    return true;
  };

  const go = (dir: number) => {
    if (dir > 0 && !canNext()) return;
    setTrans(true);
    setTimeout(() => { setStep(s => s + dir); setTrans(false); }, 180);
  };

  const markAndNavigate = (dest: string) => {
    try { localStorage.setItem('creatyng_onboarding', JSON.stringify({ profile, subcat, goals: selectedGoals, plan, completed: true })); } catch { /* ignore */ }
    // Fire-and-forget: update DB but navigate immediately regardless
    if (user) {
      supabase.from('profiles').update({ onboarded: true }).eq('id', user.id).then(() => {}).catch(() => {});
    }
    markOnboarded();
    navigate(dest, { replace: true });
  };

  async function handleSubscribe(planId: string) {
    setSubError(null);
    setSubLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: fnErr } = await supabase.functions.invoke('create-subscription', {
        body: { plan: planId },
      });
      if (fnErr) {
        const errBody = typeof fnErr === 'object' && 'context' in fnErr
          ? await (fnErr as { context: { json: () => Promise<Record<string, string>> } }).context.json().catch(() => null)
          : null;
        throw new Error(errBody?.error || data?.error || 'subscription_error');
      }
      if (!data?.url) throw new Error(data?.error || 'no_checkout_url');
      // Save onboarding data before redirect
      try { localStorage.setItem('creatyng_onboarding', JSON.stringify({ profile, subcat, goals: selectedGoals, plan: planId, completed: true })); } catch { /* ignore */ }
      if (user) {
        supabase.from('profiles').update({ onboarded: true }).eq('id', user.id).then(() => {}).catch(() => {});
      }
      markOnboarded();
      window.location.href = data.url;
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubLoading(null);
    }
  }

  const STEP_INFO = [
    { title: t('onboarding.step1.title'), sub: t('onboarding.step1.subtitle') },
    { title: t('onboarding.step2.title'), sub: t('onboarding.step2.subtitle') },
    { title: t('onboarding.step3.title'), sub: t('onboarding.step3.subtitle') },
    { title: t('onboarding.plan_choice.title'), sub: t('onboarding.plan_choice.subtitle') },
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
        .ob-btn{transition:all 150ms}
        .ob-card:hover{border-color:#ff713d !important;box-shadow:0 4px 20px rgba(255,113,61,0.10) !important}
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
          <span style={{ fontSize: 12, color: '#8e8e96', fontWeight: 500 }}>{t('onboarding.step_counter').replace('{step}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}</span>
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
                    <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500 }}>{t(p.labelKey)}</div>
                    <div style={{ fontSize: 11.5, color: '#8e8e96', marginTop: 1 }}>{t(p.subKey)}</div>
                  </div>
                  {selected && <Check size={16} color={p.color} />}
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 1: Subcategory */}
        {step === 1 && (
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
                  <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500 }}>{t(s.labelKey)}</div>
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
                    <div style={{ fontSize: 13.5, fontWeight: sel ? 600 : 500 }}>{t(g.labelKey)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 3: Plan choice (Free / Pro / Team) */}
        {step === 3 && (
          <div style={{ animation: 'fdUp 400ms ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {([
                {
                  id: 'free' as const, accent: '#8e8e96', Icon: Sparkles,
                  name: t('onboarding.plan.free'), price: t('onboarding.plan.free_price'), credits: '50',
                  feats: [t('onboarding.plan_choice.feat_templates_basic'), t('onboarding.plan_choice.feat_export_png'), t('onboarding.plan_choice.feat_watermark')],
                },
                {
                  id: 'pro' as const, accent: '#ff713d', Icon: Zap, popular: true,
                  name: t('onboarding.plan.pro'), price: t('onboarding.plan.pro_price'), credits: '500',
                  feats: [t('onboarding.plan_choice.feat_all_templates'), t('onboarding.plan_choice.feat_all_exports'), t('onboarding.plan_choice.feat_no_watermark'), t('onboarding.plan_choice.feat_chat_ai')],
                },
                {
                  id: 'team' as const, accent: '#7C3AED', Icon: Users,
                  name: t('onboarding.plan_choice.team'), price: t('onboarding.plan_choice.team_price'), credits: '2.000',
                  feats: [t('onboarding.plan_choice.feat_all_templates'), t('onboarding.plan_choice.feat_all_formats'), t('onboarding.plan_choice.feat_brand_kit'), t('onboarding.plan_choice.feat_collaborators'), t('onboarding.plan_choice.feat_priority_support')],
                },
              ]).map((p, i) => (
                <div key={p.id} style={{
                  background: '#ffffff', borderRadius: 14, padding: '22px 18px', position: 'relative',
                  border: p.popular ? '2px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                  transition: 'all 150ms', display: 'flex', flexDirection: 'column',
                  animation: ready ? `scIn 300ms ${i * 60}ms ease both` : 'none',
                }}>
                  {p.popular && (
                    <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)', padding: '3px 12px', borderRadius: 6, background: '#ff713d', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      {t('onboarding.plan.popular')}
                    </div>
                  )}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                    background: `${p.accent}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.accent,
                  }}>
                    <p.Icon size={20} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: p.accent, marginBottom: 2 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: '#8e8e96', marginBottom: 16 }}>{p.credits} {t('onboarding.plan_choice.credits_month')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {p.feats.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5a5a60' }}>
                        <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (p.id === 'free') {
                        markAndNavigate('/app/dashboard');
                      } else {
                        handleSubscribe(p.id);
                      }
                    }}
                    disabled={!!subLoading}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 9, marginTop: 18,
                      border: p.id === 'free' ? '1.5px solid rgba(20,20,23,0.1)' : 'none',
                      background: p.id === 'free' ? '#ffffff' : `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`,
                      color: p.id === 'free' ? '#141417' : '#fff',
                      fontSize: 13, fontWeight: 600, cursor: subLoading ? 'default' : 'pointer',
                      fontFamily: 'inherit', opacity: subLoading && subLoading !== p.id ? 0.4 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: p.id !== 'free' ? `0 3px 12px ${p.accent}40` : 'none',
                      transition: 'opacity 150ms',
                    }}
                  >
                    {subLoading === p.id ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      p.id === 'free' ? t('onboarding.plan_choice.start_free') : t('onboarding.plan_choice.subscribe')
                    )}
                  </button>
                </div>
              ))}
            </div>

            {subError && (
              <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginTop: 12 }}>{subError}</p>
            )}

            {/* Compare plans link */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a
                href="/app/billing"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#8e8e96', fontSize: 13, fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  textDecoration: 'none',
                }}
              >
                {t('onboarding.plan_choice.compare_plans')} <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Navigation — only for steps 0-2 */}
      {step < 3 && (
        <div style={{ width: '100%', maxWidth: 680, padding: '20px 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 0 ? (
            <button onClick={() => go(-1)} style={{
              padding: '9px 18px', borderRadius: 9, border: '1px solid rgba(20,20,23,0.1)',
              background: '#ffffff', color: '#5a5a60', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <ChevronLeft size={18} /> {t('onboarding.back')}
            </button>
          ) : <div />}

          <button onClick={() => go(1)} style={{
            padding: '9px 22px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#ff713d,#FF9B70)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: canNext() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 3px 12px rgba(255,113,61,0.27)', transition: 'all 180ms',
            opacity: canNext() ? 1 : 0.4,
          }}>
            {t('onboarding.continue')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Skip link — only for steps 0-2 */}
      {step < 3 && (
        <button onClick={() => { setStep(3); }} style={{
          background: 'none', border: 'none', color: '#b5b5bb', fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit', paddingBottom: 20,
        }}>{t('onboarding.skip')}</button>
      )}
    </div>
  );
}
