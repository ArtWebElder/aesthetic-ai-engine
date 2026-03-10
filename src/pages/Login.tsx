import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';

/* ─── Carousel card data ─────────────────────────────── */
const CARDS = [
  { label: 'Ecom Banner', gradient: 'linear-gradient(135deg, #f97316, #e11d48)', price: 'R$ 497' },
  { label: 'Social Post', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', price: 'R$ 299' },
  { label: 'Photoshoot', gradient: 'linear-gradient(135deg, #0891b2, #0d9488)', price: 'R$ 899' },
  { label: 'Product Ad', gradient: 'linear-gradient(135deg, #d97706, #ea580c)', price: 'R$ 199' },
  { label: 'Story Ad', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', price: 'R$ 149' },
  { label: 'Brand Kit', gradient: 'linear-gradient(135deg, #10b981, #22c55e)', price: 'R$ 599' },
  { label: 'Hero Banner', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', price: 'R$ 349' },
  { label: 'Thumbnail', gradient: 'linear-gradient(135deg, #eab308, #f97316)', price: 'R$ 99' },
  { label: 'Campaign', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', price: 'R$ 799' },
];

function CreativeCard({ label, gradient, price }: { label: string; gradient: string; price: string }) {
  return (
    <div
      className="shrink-0 rounded-[14px] overflow-hidden mb-3 relative"
      style={{ background: gradient, aspectRatio: '4/5' }}
    >
      {/* Headline */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <div>
          <div className="h-2.5 bg-white/30 rounded-full mb-1.5 w-3/4" />
          <div className="h-2 bg-white/20 rounded-full w-1/2" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-1.5 bg-white/20 rounded-full w-full" />
          <div className="h-1.5 bg-white/15 rounded-full w-4/5" />
        </div>
      </div>
      {/* Label + price badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-white text-[11px] font-semibold">{label}</span>
        <span
          className="text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {price}
        </span>
      </div>
    </div>
  );
}

function CarouselColumn({ cards, reverse }: { cards: typeof CARDS; reverse?: boolean }) {
  const doubled = [...cards, ...cards];
  return (
    <div className="flex flex-col overflow-hidden h-full relative flex-1">
      <div
        className={reverse ? 'animate-scroll-down' : 'animate-scroll-up'}
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
    { label: 'Fair', color: 'bg-orange-400' },
    { label: 'Good', color: 'bg-yellow-400' },
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
    <div className="min-h-screen flex" style={{ background: '#f5f5f3' }}>
      {/* ── Left panel (light) ───────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center relative z-10 overflow-y-auto"
        style={{ minWidth: 0, width: '100%', maxWidth: 480, padding: '48px', background: '#f5f5f3' }}
      >
        {/* Logo */}
        <div className="mb-8 self-start flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-full text-white"
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#141417', letterSpacing: '-0.02em' }}>Creatyng</span>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          {/* Toggle login/signup */}
          <div
            className="flex mb-6"
            style={{ background: 'rgba(20,20,23,0.04)', borderRadius: 9, padding: 3 }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 text-sm rounded-[7px] transition-all duration-200"
                style={{
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? '#141417' : '#8e8e96',
                  background: mode === m ? '#ffffff' : 'transparent',
                  boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {m === 'login' ? t('auth.tab_login') : t('auth.tab_signup')}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#141417', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {mode === 'login' ? t('auth.login.heading') : t('auth.signup.heading')}
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a60', marginTop: 4 }}>{t('auth.subtitle')}</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 transition-colors"
            style={{
              padding: '11px 16px',
              borderRadius: 10,
              border: '1px solid rgba(20,20,23,0.1)',
              background: '#ffffff',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#141417',
              marginBottom: 16,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f3'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
          >
            <GoogleIcon />
            {t('auth.continue_google')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(20,20,23,0.1)' }} />
            <span style={{ fontSize: 12, color: '#b5b5bb' }}>{t('auth.or_email')}</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(20,20,23,0.1)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5b5bb' }} />
                <input
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 bg-white text-sm outline-none transition-all duration-150"
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: '1px solid rgba(20,20,23,0.1)',
                    color: '#141417',
                    fontSize: 13.5,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ff713d'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,23,0.1)'; }}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5b5bb' }} />
              <input
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 bg-white text-sm outline-none transition-all duration-150"
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(20,20,23,0.1)',
                  color: '#141417',
                  fontSize: 13.5,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#ff713d'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,23,0.1)'; }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5b5bb' }} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 bg-white text-sm outline-none transition-all duration-150"
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(20,20,23,0.1)',
                  color: '#141417',
                  fontSize: 13.5,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#ff713d'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,23,0.1)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#b5b5bb' }}
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
                        i < pwStrength.score ? pwStrength.color : 'bg-[rgba(20,20,23,0.08)]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: '#8e8e96' }}>{pwStrength.label}</p>
              </div>
            )}

            {error && (
              <p className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
                fontSize: 13.5,
                fontWeight: 600,
                boxShadow: '0 3px 10px rgba(255,113,61,0.3)',
                marginTop: 4,
              }}
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
          <div
            className="mt-8 p-4 rounded-xl"
            style={{ background: 'rgba(20,20,23,0.03)', border: '1px solid rgba(20,20,23,0.06)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)' }}
              >
                M
              </div>
              <div>
                <p className="text-xs leading-relaxed" style={{ color: '#5a5a60' }}>
                  {t('auth.testimonial')}
                </p>
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#8e8e96' }}>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {t('auth.testimonial_author')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (dark carousel) ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: '#141417' }}>
        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{ height: '18%', background: 'linear-gradient(to bottom, #141417, transparent)' }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{ height: '18%', background: 'linear-gradient(to top, #141417, transparent)' }}
        />

        {/* Carousel columns */}
        <div className="flex gap-3 px-6 pt-4 w-full h-full overflow-hidden">
          <CarouselColumn cards={CARDS.slice(0, 3)} />
          <CarouselColumn cards={CARDS.slice(3, 6)} reverse />
          <CarouselColumn cards={CARDS.slice(6, 9)} />
        </div>

        {/* Floating badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex items-center gap-2 rounded-full"
            style={{
              padding: '8px 18px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#ff713d' }} />
            <span className="text-white font-semibold" style={{ fontSize: 13 }}>{t('auth.generated_badge')}</span>
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
          animation: scrollUp 22s linear infinite;
        }
        .animate-scroll-down {
          animation: scrollDown 22s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
