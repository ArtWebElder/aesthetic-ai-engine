import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import logoLight from '@/assets/logo-light.png';

/* ─── Carousel card data ─────────────────────────────── */
const CARDS = [
  { label: 'Ecom Banner', color: 'from-orange-500 to-rose-500', sub: 'Fashion Drop' },
  { label: 'Social Post', color: 'from-violet-600 to-indigo-500', sub: 'Instagram Feed' },
  { label: 'Photoshoot', color: 'from-cyan-500 to-teal-400', sub: 'Studio Editorial' },
  { label: 'Product Ad', color: 'from-amber-500 to-orange-400', sub: 'E-commerce' },
  { label: 'Story Ad', color: 'from-pink-500 to-rose-400', sub: 'TikTok Vertical' },
  { label: 'Brand Kit', color: 'from-emerald-500 to-green-400', sub: 'Identity Pack' },
  { label: 'Hero Banner', color: 'from-blue-500 to-indigo-400', sub: 'Landing Page' },
  { label: 'Thumbnail', color: 'from-yellow-500 to-amber-400', sub: 'YouTube' },
  { label: 'Campaign', color: 'from-fuchsia-600 to-pink-500', sub: 'Multi-format' },
];

function CreativeCard({ label, color, sub }: { label: string; color: string; sub: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${color} p-px mb-3 shrink-0`}>
      <div className="rounded-xl bg-[#1a1a1f]/70 backdrop-blur-sm p-4 h-28 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{label}</span>
        </div>
        <div>
          <div className="h-2 bg-white/20 rounded-full mb-1.5 w-3/4" />
          <div className="h-1.5 bg-white/10 rounded-full w-1/2" />
          <span className="text-white/40 text-[10px] mt-1.5 block">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function CarouselColumn({ cards, reverse }: { cards: typeof CARDS; reverse?: boolean }) {
  const doubled = [...cards, ...cards];
  return (
    <div className="flex flex-col overflow-hidden h-full relative">
      <div
        className={`flex flex-col ${reverse ? 'animate-scroll-down' : 'animate-scroll-up'}`}
        style={{ willChange: 'transform' }}
      >
        {doubled.map((c, i) => (
          <CreativeCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}

/* ─── Password strength ──────────────────────────────── */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const map = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Excellent', color: 'bg-emerald-400' },
  ];
  return { score, ...map[score] };
}

/* ─── Google SVG icon ────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────── */
const Login = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (user) navigate('/app/dashboard', { replace: true });
  }, [user, navigate]);

  const pwStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) setError(error.message);
        else navigate('/app/dashboard', { replace: true });
      } else {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) setError(error.message);
        else navigate('/onboarding', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen flex bg-[#141417]">
      {/* ── Left panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 min-h-screen max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="mb-8 self-start">
          <img src={logoLight} alt="Creatyng" className="h-8 w-auto" />
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' ? t('auth.login.heading') : t('auth.signup.heading')}
            </h1>
            <p className="text-sm text-white/50">{t('auth.subtitle')}</p>
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-white/10 text-white shadow'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {m === 'login' ? t('auth.tab_login') : t('auth.tab_signup')}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 h-10 rounded-xl bg-white text-[#141417] text-sm font-medium hover:bg-white/90 transition-all duration-150 mb-4"
          >
            <GoogleIcon />
            {t('auth.continue_google')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">{t('auth.or_email')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#ff713d]/60 focus:bg-white/8 transition-all duration-150"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#ff713d]/60 focus:bg-white/8 transition-all duration-150"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#ff713d]/60 focus:bg-white/8 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength (signup only) */}
            {mode === 'signup' && pwStrength && password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        i < pwStrength.score ? pwStrength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40">{pwStrength.label}</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#ff713d] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(255,113,61,0.35)] mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t('auth.sign_in') : t('auth.create_account')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social proof */}
          <div className="mt-8 p-4 bg-white/5 border border-white/8 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                M
              </div>
              <div>
                <p className="text-white/70 text-xs leading-relaxed">
                  {t('auth.testimonial')}
                </p>
                <p className="text-white/40 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {t('auth.testimonial_author')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (carousel) ──────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0f0f12]">
        {/* Overlay fades */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0f0f12] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f0f12] to-transparent z-10 pointer-events-none" />

        {/* Carousel columns */}
        <div className="flex gap-3 px-6 pt-4 w-full overflow-hidden h-full">
          <div className="flex-1 h-full overflow-hidden">
            <CarouselColumn cards={CARDS.slice(0, 3)} />
          </div>
          <div className="flex-1 h-full overflow-hidden">
            <CarouselColumn cards={CARDS.slice(3, 6)} reverse />
          </div>
          <div className="flex-1 h-full overflow-hidden">
            <CarouselColumn cards={CARDS.slice(6, 9)} />
          </div>
        </div>

        {/* Badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-[#ff713d]" />
            <span className="text-white/80 text-xs font-medium">{t('auth.generated_badge')}</span>
          </div>
        </div>
      </div>

      {/* Carousel CSS animations */}
      <style>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .animate-scroll-up {
          animation: scrollUp 20s linear infinite;
        }
        .animate-scroll-down {
          animation: scrollDown 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
