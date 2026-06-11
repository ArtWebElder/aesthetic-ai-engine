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
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
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
  { id: 'other', labelKey: 'onboarding.profile.other', subKey: 'onboarding.sub.other', Icon: Sparkles, color: '#9b8f86' },
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

  const subs = profile ? SUBCATEGORIES[profile] || [] : [];

  /* tile style: resting = category hue · selected = brand gradient */
  const tileStyle = (color: string, selected: boolean): React.CSSProperties =>
    selected
      ? { background: 'linear-gradient(145deg, hsl(var(--brand-2)), hsl(var(--brand)))', color: '#fff', border: '1px solid transparent', boxShadow: '0 8px 18px -8px hsl(var(--brand) / .6)' }
      : { background: `${color}1A`, color, border: `1px solid ${color}33` };

  return (
    <div className="cyob">
      {/* Scoped Spotlight styles — isolated to this screen (no global tokens touched) */}
      <style>{`
        .cyob {
          position: relative;
          min-height: 100vh;
          min-height: 100svh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: hsl(var(--foreground));
          background: radial-gradient(110% 55% at 50% -8%, #FFF3EA, #F4EDE4 55%), #F4EDE4;
        }
        .dark .cyob {
          background: radial-gradient(110% 55% at 50% -8%, #2a201a, #100d0b 55%), #100d0b;
        }
        .cyob::before {
          content: ''; position: absolute; inset: 0 0 auto 0; height: 380px; pointer-events: none; z-index: 0; opacity: .55;
          background-image: linear-gradient(rgba(28,22,16,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(28,22,16,.045) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: linear-gradient(180deg, #000, transparent);
          mask-image: linear-gradient(180deg, #000, transparent);
        }
        .dark .cyob::before {
          background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
        }
        .cyob-col {
          position: relative; z-index: 1; width: 100%; max-width: 660px; margin: 0 auto;
          min-height: 100svh; display: flex; flex-direction: column; padding: 30px 24px 26px;
        }
        .cyob-top { display: flex; align-items: center; justify-content: space-between; }
        .cyob-step { font-size: 13px; font-weight: 500; color: hsl(var(--muted-foreground)); }
        .cyob-progress { height: 5px; border-radius: 999px; background: hsl(var(--border)); margin: 18px 0 34px; overflow: hidden; }
        .cyob-progress span {
          display: block; height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, hsl(var(--brand)), hsl(var(--brand-2)));
          box-shadow: 0 0 14px -2px hsl(var(--brand)); transition: width .45s cubic-bezier(.3,.9,.3,1);
        }
        .cyob-title { font-size: 26px; font-weight: 700; color: hsl(var(--foreground)); letter-spacing: -.025em; }
        .cyob-sub { color: hsl(var(--muted-foreground)); font-size: 15px; margin-top: 6px; }

        /* options */
        .cyob-opt {
          position: relative; display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
          background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)); border-radius: 16px; cursor: pointer;
          font-family: inherit; color: hsl(var(--foreground));
          transition: border-color .18s, transform .18s, box-shadow .18s, background .18s;
        }
        .cyob-opt:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(0,0,0,.5); }
        .cyob-opt.sel {
          border-color: hsl(var(--brand)); background: hsl(var(--brand) / .08);
          box-shadow: 0 0 0 3px hsl(var(--brand) / .15), 0 16px 34px -18px hsl(var(--brand) / .6);
        }
        .cyob-check {
          position: absolute; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
          background: hsl(var(--brand)); color: hsl(var(--brand-foreground));
          opacity: 0; transform: scale(.5); transition: all .2s cubic-bezier(.3,1.4,.5,1);
        }
        .cyob-opt.sel .cyob-check { opacity: 1; transform: scale(1); }
        .cyob-tile { width: 44px; height: 44px; border-radius: 12px; flex: none; display: grid; place-items: center; transition: all .2s; }

        .cyob-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cyob-list { display: flex; flex-direction: column; gap: 10px; }

        /* ready cards */
        .cyob-readycard {
          display: flex; flex-direction: column; align-items: flex-start; text-align: left;
          background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)); border-radius: 16px;
          padding: 22px 20px; cursor: pointer; font-family: inherit; transition: all .18s;
        }
        .cyob-readycard:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -22px rgba(0,0,0,.55); }
        .cyob-readycard.primary { border-color: hsl(var(--brand) / .4); background: hsl(var(--brand) / .06); }

        @keyframes cyob-scin { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes cyob-fdup { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .cyob-anim { animation: none !important; } }

        @media (max-width: 600px) {
          .cyob-col { padding: 24px 18px 22px; }
          .cyob-title { font-size: 22px; }
          .cyob-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cyob-col">
        {/* Header */}
        <div className="cyob-top">
          <Logo height={26} />
          <span className="cyob-step">{t('onboarding.step_counter').replace('{step}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}</span>
        </div>

        {/* Progress bar */}
        <div className="cyob-progress"><span style={{ width: `${progress}%` }} /></div>

        {/* Content */}
        <div style={{ flex: 1, opacity: trans ? 0 : 1, transform: trans ? 'translateY(6px)' : '', transition: 'all 180ms ease' }}>
          <h1 className="cyob-title">{STEP_INFO[step].title}</h1>
          <p className="cyob-sub" style={{ marginBottom: 24 }}>{STEP_INFO[step].sub}</p>

          {/* STEP 0: Profile */}
          {step === 0 && (
            <div className="cyob-grid">
              {PROFILES.map((p, i) => {
                const selected = profile === p.id;
                return (
                  <button
                    key={p.id}
                    className={`cyob-opt cyob-anim ${selected ? 'sel' : ''}`}
                    onClick={() => { setProfile(p.id); setSubcat(null); }}
                    style={{ padding: '14px 16px', animation: ready ? `cyob-scin 280ms ${i * 35}ms ease both` : 'none' }}
                  >
                    <div className="cyob-tile" style={tileStyle(p.color, selected)}>
                      <p.Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: selected ? 600 : 500, color: 'hsl(var(--foreground))' }}>{t(p.labelKey)}</div>
                      <div style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>{t(p.subKey)}</div>
                    </div>
                    <div className="cyob-check" style={{ position: 'absolute', top: 14, right: 14 }}><Check size={14} /></div>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 1: Subcategory */}
          {step === 1 && (
            <div className="cyob-list">
              {subs.map((s, i) => {
                const selected = subcat === s.id;
                return (
                  <button
                    key={s.id}
                    className={`cyob-opt cyob-anim ${selected ? 'sel' : ''}`}
                    onClick={() => setSubcat(s.id)}
                    style={{ padding: '14px 16px', animation: ready ? `cyob-scin 280ms ${i * 35}ms ease both` : 'none' }}
                  >
                    <div className="cyob-tile" style={tileStyle(profileColor, selected)}>
                      <s.Icon size={18} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: 'hsl(var(--foreground))' }}>{t(s.labelKey)}</div>
                    <div className="cyob-check" style={{ position: 'absolute', right: 16 }}><Check size={14} /></div>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: All set! — Wizard/Studio cards */}
          {step === 2 && (
            <div className="cyob-anim" style={{ animation: 'cyob-fdup 400ms ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                  background: 'hsl(var(--brand) / .12)', border: '1px solid hsl(var(--brand) / .24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--brand))',
                }}>
                  <PartyPopper size={28} />
                </div>
              </div>

              <div className="cyob-grid" style={{ marginBottom: 24 }}>
                {/* Wizard card */}
                <button onClick={() => markAndNavigate('/app/create')} className="cyob-readycard primary cyob-anim" style={{ animation: ready ? 'cyob-scin 300ms ease both' : 'none' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                    background: 'linear-gradient(145deg, hsl(var(--brand-2)), hsl(var(--brand)))', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px -8px hsl(var(--brand) / .6)',
                  }}>
                    <Wand2 size={22} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>{t('onboarding.done.wizard_title')}</div>
                  <div style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: 14 }}>{t('onboarding.done.wizard_desc')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(var(--brand))', fontSize: 13, fontWeight: 600, marginTop: 'auto' }}>
                    {t('onboarding.done.try_wizard')} <ArrowRight size={14} />
                  </div>
                </button>

                {/* Studio card */}
                <button onClick={() => markAndNavigate('/app/create/studio')} className="cyob-readycard cyob-anim" style={{ animation: ready ? 'cyob-scin 300ms 60ms ease both' : 'none' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(139,92,246,0.10))', color: '#7C3AED',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.22)',
                  }}>
                    <LayoutGrid size={22} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>{t('onboarding.done.studio_title')}</div>
                  <div style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: 14 }}>{t('onboarding.done.studio_desc')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7C3AED', fontSize: 13, fontWeight: 600, marginTop: 'auto' }}>
                    {t('onboarding.done.try_studio')} <ArrowRight size={14} />
                  </div>
                </button>
              </div>

              {/* Explore dashboard link */}
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => markAndNavigate('/app/dashboard')} style={{
                  background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  {t('onboarding.done.explore_dashboard')} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation — only for steps 0-1 */}
        {step < 2 && (
          <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step > 0 ? (
              <button onClick={() => go(-1)} style={{
                padding: '0 20px', height: 48, borderRadius: 12, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <ChevronLeft size={18} /> {t('onboarding.back')}
              </button>
            ) : <div />}

            <Button variant="gradient" onClick={() => go(1)} style={{
              height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14,
              cursor: canNext() ? 'pointer' : 'not-allowed', opacity: canNext() ? 1 : 0.45,
            }}>
              {t('onboarding.continue')} <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* Skip link — only for steps 0-1 */}
        {step < 2 && (
          <button onClick={() => { setStep(2); }} style={{
            display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
            color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 6,
          }}>{t('onboarding.skip')}</button>
        )}
      </div>
    </div>
  );
}
