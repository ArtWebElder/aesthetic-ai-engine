import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Code2,
  TrendingUp,
  Briefcase,
  Video,
  Share2,
  Camera,
  User,
  Utensils,
  ShoppingBag,
  Pizza,
  Shirt,
  Dumbbell,
  BookOpen,
  Car,
  Home,
  Image,
  Megaphone,
  Star,
  Package,
  Globe,
  Lightbulb,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import logoLight from '@/assets/logo-light.png';

/* ─── Types ──────────────────────────────────────────── */
type ProfileId =
  | 'designer'
  | 'webdev'
  | 'traffic'
  | 'business'
  | 'youtuber'
  | 'social'
  | 'photographer'
  | 'other';

type ObjectiveId =
  | 'social_posts'
  | 'promotions'
  | 'ads'
  | 'thumbnails'
  | 'brand'
  | 'product_photos';

interface OnboardingState {
  profile: ProfileId | null;
  subcategory: string | null;
  objectives: ObjectiveId[];
  plan: 'free' | 'pro';
}

/* ─── Data ───────────────────────────────────────────── */
const PROFILES: { id: ProfileId; labelKey: string; Icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'designer', labelKey: 'onboarding.profile.designer', Icon: Palette, color: 'from-violet-500 to-purple-500' },
  { id: 'webdev', labelKey: 'onboarding.profile.webdev', Icon: Code2, color: 'from-blue-500 to-cyan-400' },
  { id: 'traffic', labelKey: 'onboarding.profile.traffic', Icon: TrendingUp, color: 'from-orange-500 to-amber-400' },
  { id: 'business', labelKey: 'onboarding.profile.business', Icon: Briefcase, color: 'from-emerald-500 to-teal-400' },
  { id: 'youtuber', labelKey: 'onboarding.profile.youtuber', Icon: Video, color: 'from-red-500 to-rose-400' },
  { id: 'social', labelKey: 'onboarding.profile.social', Icon: Share2, color: 'from-pink-500 to-fuchsia-400' },
  { id: 'photographer', labelKey: 'onboarding.profile.photographer', Icon: Camera, color: 'from-sky-500 to-blue-400' },
  { id: 'other', labelKey: 'onboarding.profile.other', Icon: User, color: 'from-gray-500 to-slate-400' },
];

const SUBCATEGORIES: Record<ProfileId, { id: string; labelKey: string; Icon: React.FC<{ className?: string }> }[]> = {
  designer: [
    { id: 'branding', labelKey: 'onboarding.sub.branding', Icon: Star },
    { id: 'ui_ux', labelKey: 'onboarding.sub.ui_ux', Icon: Globe },
    { id: 'print', labelKey: 'onboarding.sub.print', Icon: BookOpen },
    { id: 'social_media', labelKey: 'onboarding.sub.social_media', Icon: Share2 },
  ],
  webdev: [
    { id: 'agency', labelKey: 'onboarding.sub.agency', Icon: Globe },
    { id: 'saas', labelKey: 'onboarding.sub.saas', Icon: Zap },
    { id: 'ecommerce', labelKey: 'onboarding.sub.ecommerce', Icon: ShoppingBag },
    { id: 'freelance', labelKey: 'onboarding.sub.freelance', Icon: User },
  ],
  traffic: [
    { id: 'ecommerce', labelKey: 'onboarding.sub.ecommerce', Icon: ShoppingBag },
    { id: 'infoproducts', labelKey: 'onboarding.sub.infoproducts', Icon: BookOpen },
    { id: 'local_biz', labelKey: 'onboarding.sub.local_biz', Icon: Home },
    { id: 'agency', labelKey: 'onboarding.sub.agency', Icon: Globe },
  ],
  business: [
    { id: 'restaurant', labelKey: 'onboarding.sub.restaurant', Icon: Utensils },
    { id: 'acai', labelKey: 'onboarding.sub.acai', Icon: Pizza },
    { id: 'fashion', labelKey: 'onboarding.sub.fashion', Icon: Shirt },
    { id: 'gym', labelKey: 'onboarding.sub.gym', Icon: Dumbbell },
    { id: 'car_dealer', labelKey: 'onboarding.sub.car_dealer', Icon: Car },
    { id: 'real_estate', labelKey: 'onboarding.sub.real_estate', Icon: Home },
  ],
  youtuber: [
    { id: 'gaming', labelKey: 'onboarding.sub.gaming', Icon: Zap },
    { id: 'education', labelKey: 'onboarding.sub.education', Icon: BookOpen },
    { id: 'lifestyle', labelKey: 'onboarding.sub.lifestyle', Icon: Star },
    { id: 'tech', labelKey: 'onboarding.sub.tech', Icon: Code2 },
  ],
  social: [
    { id: 'fashion', labelKey: 'onboarding.sub.fashion', Icon: Shirt },
    { id: 'food', labelKey: 'onboarding.sub.food', Icon: Utensils },
    { id: 'fitness', labelKey: 'onboarding.sub.fitness', Icon: Dumbbell },
    { id: 'travel', labelKey: 'onboarding.sub.travel', Icon: Globe },
  ],
  photographer: [
    { id: 'product', labelKey: 'onboarding.sub.product', Icon: Package },
    { id: 'portrait', labelKey: 'onboarding.sub.portrait', Icon: User },
    { id: 'food', labelKey: 'onboarding.sub.food', Icon: Utensils },
    { id: 'fashion', labelKey: 'onboarding.sub.fashion', Icon: Shirt },
  ],
  other: [
    { id: 'marketing', labelKey: 'onboarding.sub.marketing', Icon: Megaphone },
    { id: 'ecommerce', labelKey: 'onboarding.sub.ecommerce', Icon: ShoppingBag },
    { id: 'creative', labelKey: 'onboarding.sub.creative', Icon: Palette },
    { id: 'other', labelKey: 'onboarding.sub.other', Icon: Lightbulb },
  ],
};

const OBJECTIVES: { id: ObjectiveId; labelKey: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'social_posts', labelKey: 'onboarding.obj.social_posts', Icon: Share2 },
  { id: 'promotions', labelKey: 'onboarding.obj.promotions', Icon: Megaphone },
  { id: 'ads', labelKey: 'onboarding.obj.ads', Icon: TrendingUp },
  { id: 'thumbnails', labelKey: 'onboarding.obj.thumbnails', Icon: Image },
  { id: 'brand', labelKey: 'onboarding.obj.brand', Icon: Star },
  { id: 'product_photos', labelKey: 'onboarding.obj.product_photos', Icon: Package },
];

/* ─── Progress bar ───────────────────────────────────── */
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#ff713d] rounded-full transition-all duration-500"
        style={{ width: `${((step) / total) * 100}%` }}
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  const [state, setState] = useState<OnboardingState>({
    profile: null,
    subcategory: null,
    objectives: [],
    plan: 'free',
  });

  const canContinue = (): boolean => {
    if (step === 1) return !!state.profile;
    if (step === 2) return !!state.subcategory;
    if (step === 3) return state.objectives.length > 0;
    return true;
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else finish();
  };

  const finish = () => {
    try {
      localStorage.setItem('creatyng_onboarding', JSON.stringify({ ...state, completed: true }));
    } catch { /* ignore */ }
    navigate('/app/dashboard', { replace: true });
  };

  const toggleObjective = (id: ObjectiveId) => {
    setState((s) => ({
      ...s,
      objectives: s.objectives.includes(id)
        ? s.objectives.filter((o) => o !== id)
        : [...s.objectives, id],
    }));
  };

  const subs = state.profile ? SUBCATEGORIES[state.profile] : [];

  return (
    <div className="min-h-screen bg-[#141417] flex flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="w-full max-w-lg mb-8">
        <img src={logoLight} alt="Creatyng" className="h-7 w-auto" />
      </div>

      {/* Card */}
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/40 text-xs">
              {t('onboarding.step_counter', { step: String(step), total: String(TOTAL_STEPS) })}
            </span>
            <button
              onClick={finish}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[420px] flex flex-col">
          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.step1.title')}</h2>
              <p className="text-white/40 text-sm mb-6">{t('onboarding.step1.subtitle')}</p>
              <div className="grid grid-cols-2 gap-2">
                {PROFILES.map(({ id, labelKey, Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setState((s) => ({ ...s, profile: id, subcategory: null }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                      state.profile === id
                        ? 'border-[#ff713d]/60 bg-[#ff713d]/10'
                        : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium leading-tight">{t(labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Subcategory */}
          {step === 2 && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.step2.title')}</h2>
              <p className="text-white/40 text-sm mb-6">{t('onboarding.step2.subtitle')}</p>
              <div className="grid grid-cols-2 gap-2">
                {subs.map(({ id, labelKey, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setState((s) => ({ ...s, subcategory: id }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                      state.subcategory === id
                        ? 'border-[#ff713d]/60 bg-[#ff713d]/10'
                        : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white/70" />
                    </div>
                    <span className="text-white text-sm font-medium">{t(labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Objectives */}
          {step === 3 && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.step3.title')}</h2>
              <p className="text-white/40 text-sm mb-6">{t('onboarding.step3.subtitle')}</p>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map(({ id, labelKey, Icon }) => {
                  const selected = state.objectives.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleObjective(id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                        selected
                          ? 'border-[#ff713d]/60 bg-[#ff713d]/10'
                          : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-[#ff713d]' : 'bg-white/8'
                      }`}>
                        {selected
                          ? <Check className="w-4 h-4 text-white" />
                          : <Icon className="w-4 h-4 text-white/60" />
                        }
                      </div>
                      <span className="text-white text-sm font-medium">{t(labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Plan */}
          {step === 4 && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.step4.title')}</h2>
              <p className="text-white/40 text-sm mb-6">{t('onboarding.step4.subtitle')}</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Free */}
                <button
                  onClick={() => setState((s) => ({ ...s, plan: 'free' }))}
                  className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                    state.plan === 'free'
                      ? 'border-[#ff713d]/60 bg-[#ff713d]/10'
                      : 'border-white/10 bg-white/3 hover:bg-white/6'
                  }`}
                >
                  <div className="text-white font-semibold text-base mb-1">{t('onboarding.plan.free')}</div>
                  <div className="text-white/40 text-xs mb-3">{t('onboarding.plan.free_price')}</div>
                  <ul className="space-y-1.5">
                    {['10 credits/mo', 'HD export', 'Core templates'].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>

                {/* Pro */}
                <button
                  onClick={() => setState((s) => ({ ...s, plan: 'pro' }))}
                  className={`p-4 rounded-xl border text-left transition-all duration-150 relative overflow-hidden ${
                    state.plan === 'pro'
                      ? 'border-[#ff713d]/80 bg-gradient-to-br from-[#ff713d]/15 to-[#ff713d]/5'
                      : 'border-white/10 bg-white/3 hover:bg-white/6'
                  }`}
                >
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[10px] bg-[#ff713d] text-white px-2 py-0.5 rounded-full font-medium">
                      {t('onboarding.plan.popular')}
                    </span>
                  </div>
                  <div className="text-white font-semibold text-base mb-1">{t('onboarding.plan.pro')}</div>
                  <div className="text-[#ff713d] text-xs mb-3">{t('onboarding.plan.pro_price')}</div>
                  <ul className="space-y-1.5">
                    {['500 credits/mo', '4K export', 'All templates', 'BYOK'].map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Quick Create */}
          {step === 5 && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.step5.title')}</h2>
              <p className="text-white/40 text-sm mb-6">{t('onboarding.step5.subtitle')}</p>

              {/* Dropzone */}
              <div className="border-2 border-dashed border-white/15 rounded-xl p-8 flex flex-col items-center gap-3 mb-4 hover:border-[#ff713d]/40 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-white/8 group-hover:bg-[#ff713d]/15 flex items-center justify-center transition-all">
                  <Upload className="w-6 h-6 text-white/40 group-hover:text-[#ff713d]" />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm font-medium">{t('onboarding.step5.dropzone')}</p>
                  <p className="text-white/30 text-xs mt-0.5">{t('onboarding.step5.dropzone_hint')}</p>
                </div>
              </div>

              {/* Suggested template */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{t('onboarding.step5.suggestion_label')}</p>
                  <p className="text-white/40 text-xs">{t('onboarding.step5.suggestion_hint')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/8">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>

            <button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[#ff713d] text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_3px_10px_rgba(255,113,61,0.30)]"
            >
              {step === TOTAL_STEPS ? t('onboarding.finish') : t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
