import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles, RefreshCw, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { supabase } from '@/services/supabaseClient';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

/* ─── Carousel card data ─────────────────────────────── */
const CARDS = [
  { label: 'Ecom Banner', gradient: 'linear-gradient(135deg, hsl(var(--brand)), #e11d48)', price: 'R$ 497' },
  { label: 'Social Post', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', price: 'R$ 299' },
  { label: 'Photoshoot', gradient: 'linear-gradient(135deg, #0891b2, #0d9488)', price: 'R$ 899' },
  { label: 'Product Ad', gradient: 'linear-gradient(135deg, #d97706, #ea580c)', price: 'R$ 199' },
  { label: 'Story Ad', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', price: 'R$ 149' },
  { label: 'Brand Kit', gradient: 'linear-gradient(135deg, #10b981, #22c55e)', price: 'R$ 599' },
  { label: 'Hero Banner', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', price: 'R$ 349' },
  { label: 'Thumbnail', gradient: 'linear-gradient(135deg, #eab308, hsl(var(--brand)))', price: 'R$ 99' },
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
          style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
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
  const [view, setView] = useState<'form' | 'verify' | 'reset'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetSending, setResetSending] = useState(false);

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (user) navigate('/app/dashboard', { replace: true });
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const pwStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  const handleForgotPassword = async () => {
    setError('');
    setResetMsg('');
    if (!email.trim()) {
      setError(t('auth.reset.need_email'));
      return;
    }
    setResetSending(true);
    try {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        setError(error.message || t('auth.reset.failed'));
      } else {
        setResetMsg(t('auth.reset.sent'));
      }
    } catch {
      setError(t('auth.reset.failed'));
    } finally {
      setResetSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
            setView('verify');
            setResendCooldown(60);
          } else if (msg.includes('email rate limit exceeded') || msg.includes('rate limit')) {
            setError(t('auth.rate_limit'));
          } else {
            setError(error.message);
          }
        } else {
          navigate('/app/dashboard', { replace: true });
        }
      } else {
        const { error } = await signUpWithEmail(email, password, name);
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            setError(t('auth.error_already_registered'));
          } else if (msg.includes('email rate limit exceeded') || msg.includes('rate limit')) {
            setError(t('auth.rate_limit'));
          } else {
            setError(error.message);
          }
        } else {
          setView('verify');
          setResendCooldown(60);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    await signInWithGoogle();
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!email || !otpCode.trim() || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'signup',
      });
      if (error) {
        setOtpError(t('auth.otp_invalid'));
      } else {
        setOtpSuccess(true);
        // After verification, try signing in automatically
        setTimeout(async () => {
          const { error: loginErr } = await signInWithEmail(email, password);
          if (!loginErr) {
            navigate('/app/dashboard', { replace: true });
          } else {
            // Verified but auto-login failed — go back to form
            setView('form');
            setOtpSuccess(false);
          }
        }, 1500);
      }
    } catch {
      setOtpError(t('auth.otp_invalid'));
    } finally {
      setOtpLoading(false);
    }
  }, [email, otpCode, otpLoading, password, signInWithEmail, navigate, t]);

  const handleResendCode = useCallback(async () => {
    if (!email || resending || resendCooldown > 0) return;
    setResending(true);
    setOtpError('');
    try {
      const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email });
      if (resendErr) {
        const msg = resendErr.message?.toLowerCase() || '';
        if (msg.includes('rate limit') || msg.includes('too many')) {
          setOtpError(t('auth.resend_rate_limit'));
        } else {
          setOtpError(resendErr.message);
        }
      } else {
        setResendCooldown(60);
        setOtpError('');
        // Brief success feedback via inline message
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch {
      setOtpError(t('auth.resend_rate_limit'));
    } finally {
      setResending(false);
    }
  }, [email, resending, resendCooldown, t]);

  const handleChangeEmail = useCallback(() => {
    setView('form');
    setOtpCode('');
    setOtpError('');
    setOtpSuccess(false);
    setResendCooldown(0);
    setResendSuccess(false);
  }, []);

  const handleSkipVerification = () => {
    // Let user in without verification — they can verify later via AppShell banner
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div className="cyau">
      {/* Scoped Spotlight styles — isolated to this screen (no global tokens touched) */}
      <style>{`
        .cyau {
          display: flex;
          height: 100dvh;
          overflow: hidden;
          background: hsl(var(--background));
        }
        /* ── left showcase (desktop only) ── */
        .cyau-show {
          display: none;
          position: relative;
          flex: 1;
          overflow: hidden;
          background: radial-gradient(120% 70% at 15% 0%, #2a201a, #100d0b 60%), #100d0b;
        }
        .cyau-show::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        @media (min-width: 1024px) { .cyau-show { display: flex; } }

        /* ── right panel ── */
        .cyau-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 36px 22px;
          background: hsl(var(--background));
        }
        @media (min-width: 1024px) {
          .cyau-panel { width: 32%; min-width: 392px; flex-shrink: 0; padding: 48px 40px; }
        }
        .cyau-panel::before {
          content: ''; position: absolute; inset: 0 0 auto 0; height: 320px; pointer-events: none; z-index: 0;
          background: radial-gradient(70% 60% at 50% 0%, hsl(var(--brand) / .10), transparent 70%);
        }
        .cyau-inner { position: relative; z-index: 1; width: 100%; max-width: 412px; }
        .cyau-logo { margin-bottom: 30px; }

        /* segmented tabs */
        .cyau-seg {
          position: relative; display: flex; background: hsl(var(--muted));
          border-radius: 12px; padding: 4px; margin-bottom: 24px;
        }
        .cyau-seg-thumb {
          position: absolute; top: 4px; left: 4px; width: calc(50% - 4px); height: calc(100% - 8px);
          border-radius: 9px; background: var(--brand-gradient);
          box-shadow: 0 8px 18px -8px hsl(var(--brand) / .55);
          transition: transform .25s cubic-bezier(.3,1.4,.5,1);
        }
        .cyau-seg[data-mode="signup"] .cyau-seg-thumb { transform: translateX(100%); }
        .cyau-seg button {
          position: relative; z-index: 1; flex: 1; padding: 9px 0; font-size: 14px;
          background: none; border: none; cursor: pointer; border-radius: 9px;
          transition: color .2s; color: hsl(var(--muted-foreground)); font-weight: 500;
        }
        .cyau-seg button.on { color: hsl(var(--brand-foreground)); font-weight: 600; }

        /* headings */
        .cyau-h1 { font-size: 26px; font-weight: 700; color: hsl(var(--foreground)); letter-spacing: -.03em; line-height: 1.2; }
        .cyau-sub { font-size: 14px; color: hsl(var(--muted-foreground)); margin-top: 4px; }

        /* google + divider */
        .cyau-google {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
          height: 46px; border-radius: 11px; border: 1px solid hsl(var(--border));
          background: hsl(var(--card)); color: hsl(var(--foreground));
          font-size: 14px; font-weight: 500; cursor: pointer; transition: background .15s, border-color .15s;
        }
        .cyau-google:hover { background: hsl(var(--muted)); border-color: hsl(var(--border-strong, var(--border))); }
        .cyau-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
        .cyau-divider .ln { flex: 1; height: 1px; background: hsl(var(--border)); }
        .cyau-divider span { font-size: 12px; color: hsl(var(--muted-foreground)); }

        /* fields */
        .cyau-field { position: relative; display: flex; align-items: center; }
        .cyau-stack > .cyau-field + .cyau-field { margin-top: 12px; }
        .cyau-ic { position: absolute; left: 14px; color: hsl(var(--muted-foreground)); display: grid; pointer-events: none; }
        .cyau-input {
          width: 100%; height: 46px; border: 1px solid hsl(var(--border)); background: hsl(var(--card));
          color: hsl(var(--foreground)); border-radius: 11px; padding: 0 14px 0 42px; font-size: 16px;
          transition: border-color .15s, box-shadow .15s;
        }
        .cyau-input.has-eye { padding-right: 42px; }
        .cyau-input::placeholder { color: hsl(var(--muted-foreground)); opacity: .7; }
        .cyau-input:focus { outline: none; border-color: hsl(var(--brand)); box-shadow: 0 0 0 3px hsl(var(--brand) / .15); }
        .cyau-eye {
          position: absolute; right: 10px; width: 32px; height: 32px; border: none; background: transparent;
          color: hsl(var(--muted-foreground)); display: grid; place-items: center; cursor: pointer; border-radius: 8px;
        }
        .cyau-eye:hover { color: hsl(var(--foreground)); }

        /* alerts */
        .cyau-alert { font-size: 12.5px; line-height: 1.4; border-radius: 10px; padding: 9px 12px; }
        .cyau-alert.err { background: rgba(229,86,78,.12); border: 1px solid rgba(229,86,78,.32); color: #E5564E; }
        .cyau-alert.ok  { background: rgba(61,187,107,.12); border: 1px solid rgba(61,187,107,.30); color: #3DBB6B; }

        /* links / small buttons */
        .cyau-link { background: none; border: none; cursor: pointer; padding: 0; font-size: 12.5px; font-weight: 500; color: hsl(var(--brand)); font-family: inherit; }
        .cyau-textbtn { background: none; border: none; cursor: pointer; padding: 0; font-size: 13px; font-family: inherit; display: flex; align-items: center; gap: 4px; }

        /* verify tile + otp */
        .cyau-tile { width: 56px; height: 56px; border-radius: 18px; display: grid; place-items: center; margin-bottom: 20px; background: hsl(var(--brand) / .12); color: hsl(var(--brand)); }
        .cyau-tile.ok { background: rgba(61,187,107,.12); color: #3DBB6B; }
        .cyau-otp {
          width: 100%; height: 52px; border-radius: 12px; border: 1px solid hsl(var(--border));
          background: hsl(var(--card)); color: hsl(var(--foreground)); font-size: 22px;
          font-family: ui-monospace, 'SF Mono', monospace; letter-spacing: 6px; text-align: center; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .cyau-otp:focus { border-color: hsl(var(--brand)); box-shadow: 0 0 0 3px hsl(var(--brand) / .15); }
        .cyau-otp.bad { border-color: #E5564E; box-shadow: 0 0 0 3px rgba(229,86,78,.16); }

        /* testimonial */
        .cyau-quote { margin-top: 28px; padding: 16px; border-radius: 14px; background: hsl(var(--muted)); border: 1px solid hsl(var(--border)); }

        /* carousel */
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        .animate-scroll-up { animation: scrollUp 22s linear infinite; }
        .animate-scroll-down { animation: scrollDown 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .animate-scroll-up, .animate-scroll-down { animation: none; } }
      `}</style>

      {/* ── Left panel (dark showcase) — desktop only ── */}
      <div className="cyau-show">
        {/* Top / bottom fades */}
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: '18%', background: 'linear-gradient(to bottom, #100d0b, transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: '18%', background: 'linear-gradient(to top, #100d0b, transparent)' }} />

        {/* Carousel columns */}
        <div className="flex gap-3 px-6 pt-4 w-full h-full overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
          <CarouselColumn cards={CARDS.slice(0, 3)} />
          <CarouselColumn cards={CARDS.slice(3, 6)} reverse />
          <CarouselColumn cards={CARDS.slice(6, 9)} />
        </div>

        {/* Floating badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex items-center gap-2 rounded-full"
            style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'hsl(var(--brand))' }} />
            <span className="text-white font-semibold" style={{ fontSize: 13 }}>{t('auth.generated_badge')}</span>
          </div>
        </div>
      </div>

      {/* ── Right panel (auth) ── */}
      <div className="cyau-panel">
        <div className="cyau-inner animate-fade-up">
          {/* Logo */}
          <div className="cyau-logo">
            <Logo height={30} />
          </div>

          {view === 'verify' ? (
            /* ── OTP Verification View ─────────────────────── */
            <div>
              {otpSuccess ? (
                <div className="text-center py-8">
                  <div className="cyau-tile ok" style={{ margin: '0 auto 20px' }}>
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="cyau-h1" style={{ fontSize: 22, marginBottom: 6 }}>{t('auth.verify_success')}</h2>
                  <p className="cyau-sub">{t('auth.verify_redirecting')}</p>
                </div>
              ) : (
                <>
                  <div className="cyau-tile">
                    <ShieldCheck className="w-7 h-7" />
                  </div>

                  <h1 className="cyau-h1" style={{ fontSize: 24, marginBottom: 6 }}>{t('auth.verify_title')}</h1>
                  <p className="cyau-sub" style={{ marginBottom: 8 }}>
                    {t('auth.verify_subtitle')} <strong style={{ color: 'hsl(var(--foreground))' }}>{email}</strong>
                  </p>
                  <button onClick={handleChangeEmail} className="cyau-textbtn" style={{ color: 'hsl(var(--brand))', fontWeight: 500, marginBottom: 16 }}>
                    {t('auth.change_email')} <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="00000000"
                    maxLength={8}
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setOtpError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
                    className={`cyau-otp ${otpError ? 'bad' : ''}`}
                    style={{ marginBottom: 8 }}
                    autoFocus
                  />

                  {otpError && <p className="text-xs mb-2" style={{ color: '#E5564E' }}>{otpError}</p>}

                  <Button
                    variant="gradient"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length < 8}
                    className="w-full"
                    style={{ height: 46, borderRadius: 11, fontSize: 14, marginTop: 8, marginBottom: 16 }}
                  >
                    {otpLoading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>{t('auth.verify_btn')}<ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>

                  {resendSuccess && <p className="text-xs mb-2" style={{ color: '#3DBB6B' }}>{t('auth.resend_success')}</p>}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleResendCode}
                      disabled={resending || resendCooldown > 0}
                      className="flex items-center gap-1.5"
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--brand))', fontSize: 13, fontWeight: 500, cursor: resending || resendCooldown > 0 ? 'default' : 'pointer', opacity: resending || resendCooldown > 0 ? 0.5 : 1 }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                      {resendCooldown > 0 ? `${t('auth.resend_code')} (${resendCooldown}s)` : t('auth.resend_code')}
                    </button>

                    <button onClick={handleSkipVerification} className="cyau-textbtn" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {t('auth.verify_later')}<ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : view === 'reset' ? (
            /* ── Forgot password (request reset link) ──────── */
            <>
              <button
                type="button"
                onClick={() => { setView('form'); setError(''); setResetMsg(''); }}
                className="cyau-textbtn"
                style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}
              >
                <ChevronLeft className="w-4 h-4" /> {t('auth.reset.back_to_login')}
              </button>

              <h1 className="cyau-h1" style={{ fontSize: 24 }}>{t('auth.reset.title_request')}</h1>
              <p className="cyau-sub" style={{ marginBottom: 22 }}>{t('auth.reset.request_subtitle')}</p>

              <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="cyau-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="cyau-field">
                  <span className="cyau-ic"><Mail className="w-4 h-4" /></span>
                  <input
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="cyau-input"
                  />
                </div>

                {error && <p className="cyau-alert err">{error}</p>}
                {resetMsg && <p className="cyau-alert ok">{resetMsg}</p>}

                <Button type="submit" variant="gradient" disabled={resetSending} className="w-full" style={{ height: 46, borderRadius: 11, fontSize: 14, marginTop: 4 }}>
                  {resetSending ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>{t('auth.reset.send')}<ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* ── Login / Signup Form ───────────────────────── */
            <>
              {/* Toggle login/signup */}
              <div className="cyau-seg" data-mode={mode}>
                <span className="cyau-seg-thumb" />
                {(['login', 'signup'] as const).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setError(''); }} className={mode === m ? 'on' : ''}>
                    {m === 'login' ? t('auth.tab_login') : t('auth.tab_signup')}
                  </button>
                ))}
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h1 className="cyau-h1">{mode === 'login' ? t('auth.login.heading') : t('auth.signup.heading')}</h1>
                <p className="cyau-sub">{t('auth.subtitle')}</p>
              </div>

              {/* Google */}
              <button onClick={handleGoogle} className="cyau-google" style={{ marginBottom: 16 }}>
                <GoogleIcon />
                {t('auth.continue_google')}
              </button>

              {/* Divider */}
              <div className="cyau-divider">
                <div className="ln" />
                <span>{t('auth.or_email')}</span>
                <div className="ln" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="cyau-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mode === 'signup' && (
                  <div className="cyau-field">
                    <span className="cyau-ic"><User className="w-4 h-4" /></span>
                    <input
                      type="text"
                      placeholder={t('auth.name_placeholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="cyau-input"
                    />
                  </div>
                )}

                <div className="cyau-field">
                  <span className="cyau-ic"><Mail className="w-4 h-4" /></span>
                  <input
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="cyau-input"
                  />
                </div>

                <div className="cyau-field">
                  <span className="cyau-ic"><Lock className="w-4 h-4" /></span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('auth.password_placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="cyau-input has-eye"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="cyau-eye" aria-label="toggle password">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot password (login only) → dedicated reset view */}
                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: -2 }}>
                    <button type="button" onClick={() => { setView('reset'); setError(''); setResetMsg(''); }} className="cyau-link">
                      {t('auth.reset.link')}
                    </button>
                  </div>
                )}

                {/* Password strength (signup only) */}
                {mode === 'signup' && pwStrength && password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < pwStrength.score ? pwStrength.color : ''}`}
                          style={i < pwStrength.score ? undefined : { background: 'hsl(var(--border))' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{pwStrength.label}</p>
                  </div>
                )}

                {error && <p className="cyau-alert err">{error}</p>}

                <Button type="submit" variant="gradient" disabled={loading} className="w-full" style={{ height: 46, borderRadius: 11, fontSize: 14, marginTop: 4 }}>
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>{mode === 'login' ? t('auth.sign_in') : t('auth.create_account')}<ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>

              {/* Social proof */}
              <div className="cyau-quote">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--brand)), #e11d48)' }}
                  >
                    M
                  </div>
                  <div>
                    <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auth.testimonial')}</p>
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: '#3DBB6B' }} />
                      {t('auth.testimonial_author')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
