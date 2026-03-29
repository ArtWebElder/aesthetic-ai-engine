import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Code2, Target, Briefcase, Play, Megaphone, Camera, Sparkles,
  Utensils, Shirt, ShoppingBag, BarChart2, Video, Mic, Monitor,
  Hash, Globe, Image, Check, ChevronRight, ChevronLeft,
  Wand2, LayoutGrid, ArrowRight, PartyPopper,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/services/supabaseClient';

/* ─── Types ──────────────────────────────────────────── */
type ProfileId = 'designer' | 'webdev' | 'traffic' | 'business' | 'creator' | 'social' | 'photographer' | 'other';

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

/* Goals removed — simplified onboarding */

/* ─── Main component ─────────────────────────────────── */
export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, markOnboarded } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [trans, setTrans] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const TOTAL_STEPS = 3;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const profileColor = PROFILES.find(p => p.id === profile)?.color || '#ff713d';

  const canNext = () => {
    if (step === 0) return !!profile;
    if (step === 1) return !!subcat;
    return true;
  };

  const go = (dir: number) => {
    if (dir > 0 && !canNext()) return;
    setTrans(true);
    setTimeout(() => { setStep(s => s + dir); setTrans(false); }, 180);
  };

  const markAndNavigate = (dest: string) => {
    try { localStorage.setItem('creatyng_onboarding', JSON.stringify({ profile, subcat, completed: true })); } catch { /* ignore */ }
    if (user) {
      supabase.from('profiles').update({ onboarded: true }).eq('id', user.id).then(() => {}).catch(() => {});
    }
    markOnboarded();
    navigate(dest, { replace: true });
  };

  const STEP_INFO = [
    { title: t('onboarding.step1.title'), sub: t('onboarding.step1.subtitle') },
    { title: t('onboarding.step2.title'), sub: t('onboarding.step2.subtitle') },
    { title: t('onboarding.done.title'), sub: t('onboarding.done.subtitle') },
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

        {/* STEP 2: All set! — Wizard/Studio cards */}
        {step === 2 && (
          <div style={{ animation: 'fdUp 400ms ease both' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, rgba(255,113,61,0.12), rgba(255,155,112,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PartyPopper size={28} style={{ color: '#ff713d' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              {/* Wizard card */}
              <button
                onClick={() => markAndNavigate('/app/create')}
                className="ob-card ob-btn"
                style={{
                  background: '#ffffff', borderRadius: 14, padding: '24px 20px',
                  border: '1px solid rgba(20,20,23,0.06)', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
                  animation: ready ? 'scIn 300ms ease both' : 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  background: 'linear-gradient(135deg, rgba(255,113,61,0.12), rgba(255,155,112,0.08))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff713d',
                }}>
                  <Wand2 size={22} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#141417', marginBottom: 4 }}>
                  {t('onboarding.done.wizard_title')}
                </div>
                <div style={{ fontSize: 12.5, color: '#8e8e96', lineHeight: 1.5, marginBottom: 14 }}>
                  {t('onboarding.done.wizard_desc')}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, color: '#ff713d',
                  fontSize: 13, fontWeight: 600, marginTop: 'auto',
                }}>
                  {t('onboarding.done.try_wizard')} <ArrowRight size={14} />
                </div>
              </button>

              {/* Studio card */}
              <button
                onClick={() => markAndNavigate('/app/create/studio')}
                className="ob-card ob-btn"
                style={{
                  background: '#ffffff', borderRadius: 14, padding: '24px 20px',
                  border: '1px solid rgba(20,20,23,0.06)', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
                  animation: ready ? 'scIn 300ms 60ms ease both' : 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.08))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED',
                }}>
                  <LayoutGrid size={22} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#141417', marginBottom: 4 }}>
                  {t('onboarding.done.studio_title')}
                </div>
                <div style={{ fontSize: 12.5, color: '#8e8e96', lineHeight: 1.5, marginBottom: 14 }}>
                  {t('onboarding.done.studio_desc')}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, color: '#7C3AED',
                  fontSize: 13, fontWeight: 600, marginTop: 'auto',
                }}>
                  {t('onboarding.done.try_studio')} <ArrowRight size={14} />
                </div>
              </button>
            </div>

            {/* Explore dashboard link */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => markAndNavigate('/app/dashboard')}
                style={{
                  background: 'none', border: 'none', color: '#8e8e96', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
              >
                {t('onboarding.done.explore_dashboard')} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation — only for steps 0-1 */}
      {step < 2 && (
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

      {/* Skip link — only for steps 0-1 */}
      {step < 2 && (
        <button onClick={() => { setStep(2); }} style={{
          background: 'none', border: 'none', color: '#b5b5bb', fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit', paddingBottom: 20,
        }}>{t('onboarding.skip')}</button>
      )}
    </div>
  );
}
