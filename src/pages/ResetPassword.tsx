// src/pages/ResetPassword.tsx
// CREATYNG — Set a new password after arriving from the recovery email link.
// Supabase establishes a temporary recovery session from the URL hash on load
// (handled by AuthProvider's onAuthStateChange). Here the user picks a new password.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

const ResetPassword = () => {
  const { session, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  // Give supabase-js a moment to parse the recovery token from the URL.
  const [checked, setChecked] = useState(false);
  // Surface any error Supabase appended to the URL (expired/invalid link, etc.)
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    const parse = (s: string) => new URLSearchParams(s.startsWith('#') || s.startsWith('?') ? s.slice(1) : s);
    const h = parse(window.location.hash);
    const q = parse(window.location.search);
    const desc = h.get('error_description') || q.get('error_description') || h.get('error') || q.get('error');
    if (desc) setUrlError(decodeURIComponent(desc.replace(/\+/g, ' ')));
    const tmr = setTimeout(() => setChecked(true), 2000);
    return () => clearTimeout(tmr);
  }, []);

  const hasSession = !!session;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError(t('auth.reset.too_short')); return; }
    if (password !== confirm) { setError(t('auth.reset.mismatch')); return; }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) { setError(error.message || t('auth.reset.failed')); return; }
      setDone(true);
      setTimeout(() => navigate('/app/dashboard', { replace: true }), 1400);
    } catch {
      setError(t('auth.reset.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyrp">
      {/* Scoped Spotlight styles — isolated to this screen (no global tokens touched) */}
      <style>{`
        .cyrp {
          position: relative;
          min-height: 100vh;
          min-height: 100svh;
          display: grid;
          place-items: center;
          padding: 24px;
          overflow: hidden;
          background: radial-gradient(120% 80% at 50% -10%, #FFF3EA, #F2EBE2 60%), #F4EDE4;
        }
        .dark .cyrp {
          background: radial-gradient(120% 80% at 50% -10%, #2a201a, #100d0b 60%), #100d0b;
        }
        /* faint grid + brand glow */
        .cyrp::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .6;
          background-image: linear-gradient(rgba(28,22,16,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,22,16,.04) 1px, transparent 1px);
          background-size: 46px 46px;
          -webkit-mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent 80%);
          mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent 80%);
        }
        .dark .cyrp::before {
          background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
        }
        .cyrp::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(60% 40% at 50% 0%, hsl(var(--brand) / .12), transparent 70%);
        }
        .cyrp-card {
          position: relative; z-index: 1; width: 100%; max-width: 412px;
          background: hsl(var(--card)); border: 1px solid hsl(var(--border));
          border-radius: 24px; padding: 34px 32px 30px;
          box-shadow: 0 30px 70px -28px rgba(0,0,0,.30);
        }
        .cyrp-brand { display: flex; align-items: center; justify-content: center; margin-bottom: 26px; }
        .cyrp-head { text-align: center; margin-bottom: 22px; }
        .cyrp-title { font-size: 26px; font-weight: 600; color: hsl(var(--foreground)); letter-spacing: -.025em; }
        .cyrp-sub { color: hsl(var(--muted-foreground)); font-size: 14.5px; margin-top: 8px; line-height: 1.5; }

        /* fields */
        .cyrp-field { position: relative; display: flex; align-items: center; margin-bottom: 13px; }
        .cyrp-ic { position: absolute; left: 15px; color: hsl(var(--muted-foreground)); display: grid; pointer-events: none; }
        .cyrp-input {
          width: 100%; height: 52px; border: 1px solid hsl(var(--border)); background: hsl(var(--card));
          color: hsl(var(--foreground)); border-radius: 13px; padding: 0 46px; font-size: 16px;
          transition: border-color .15s, box-shadow .15s;
        }
        .cyrp-input::placeholder { color: hsl(var(--muted-foreground)); opacity: .7; }
        .cyrp-input:focus { outline: none; border-color: hsl(var(--brand)); box-shadow: 0 0 0 3px hsl(var(--brand) / .15); }
        .cyrp-eye {
          position: absolute; right: 12px; width: 34px; height: 34px; border: none; background: transparent;
          color: hsl(var(--muted-foreground)); display: grid; place-items: center; cursor: pointer; border-radius: 8px;
        }
        .cyrp-eye:hover { color: hsl(var(--foreground)); }

        /* alert */
        .cyrp-alert { border-radius: 11px; padding: 11px 13px; font-size: 13px; font-weight: 500; margin-bottom: 13px; line-height: 1.4; }
        .cyrp-alert.err { background: rgba(229,86,78,.12); border: 1px solid rgba(229,86,78,.34); color: #E5564E; }

        /* centered states (success / invalid) */
        .cyrp-center { text-align: center; padding: 6px 0 4px; }
        .cyrp-bigic { width: 76px; height: 76px; border-radius: 26px; margin: 4px auto 20px; display: grid; place-items: center; }
        .cyrp-bigic.ok { background: rgba(61,187,107,.14); color: #3DBB6B; border: 1px solid rgba(61,187,107,.30); animation: cyrp-pop .45s cubic-bezier(.3,1.4,.5,1); }
        .cyrp-bigic.warn { background: rgba(229,134,43,.14); color: #E5862B; border: 1px solid rgba(229,134,43,.30); }
        @keyframes cyrp-pop { from { transform: scale(.6); } to { transform: scale(1); } }
        .cyrp-state-title { font-size: 19px; font-weight: 600; color: hsl(var(--foreground)); line-height: 1.4; }
        .cyrp-errdetail {
          margin-top: 14px; font-family: ui-monospace, 'SF Mono', monospace; font-size: 11.5px;
          color: hsl(var(--muted-foreground)); background: hsl(var(--muted)); border: 1px solid hsl(var(--border));
          border-radius: 10px; padding: 9px 12px; word-break: break-word;
        }
        .cyrp-redirect { width: 140px; height: 4px; border-radius: 999px; background: hsl(var(--border)); margin: 22px auto 4px; overflow: hidden; }
        .cyrp-redirect span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, hsl(var(--brand)), hsl(var(--brand-2))); animation: cyrp-fill 1.4s linear forwards; }
        @keyframes cyrp-fill { from { width: 0; } to { width: 100%; } }

        @media (prefers-reduced-motion: reduce) {
          .cyrp-bigic.ok { animation: none; }
          .cyrp-redirect span { animation: none; width: 100%; }
        }
        @media (max-width: 480px) {
          .cyrp { padding: 16px; }
          .cyrp-card { padding: 28px 22px 26px; border-radius: 20px; }
        }
      `}</style>

      <div className="cyrp-card">
        <div className="cyrp-brand">
          <Logo />
        </div>

        {done ? (
          <div className="cyrp-center">
            <div className="cyrp-bigic ok">
              <CheckCircle2 style={{ width: 38, height: 38 }} />
            </div>
            <p className="cyrp-state-title">{t('auth.reset.success')}</p>
            <div className="cyrp-redirect"><span /></div>
          </div>
        ) : !hasSession && checked ? (
          <div className="cyrp-center">
            <div className="cyrp-bigic warn">
              <AlertTriangle style={{ width: 36, height: 36 }} />
            </div>
            <p className="cyrp-state-title">{t('auth.reset.invalid_link')}</p>
            {urlError && <div className="cyrp-errdetail">{urlError}</div>}
            <Button
              variant="gradient"
              onClick={() => navigate('/login')}
              className="w-full"
              style={{ height: 52, borderRadius: 13, marginTop: 18 }}
            >
              {t('auth.reset.back_to_login')}
            </Button>
          </div>
        ) : (
          <>
            <div className="cyrp-head">
              <h1 className="cyrp-title">{t('auth.reset.title')}</h1>
              <p className="cyrp-sub">{t('auth.reset.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cyrp-field">
                <span className="cyrp-ic"><Lock style={{ width: 17, height: 17 }} /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('auth.reset.new_password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="cyrp-input"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="cyrp-eye" aria-label="toggle password">
                  {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                </button>
              </div>

              <div className="cyrp-field">
                <span className="cyrp-ic"><Lock style={{ width: 17, height: 17 }} /></span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('auth.reset.confirm_placeholder')}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="cyrp-input"
                />
              </div>

              {error && <div className="cyrp-alert err">{error}</div>}

              <Button
                type="submit"
                variant="gradient"
                disabled={loading}
                className="w-full"
                style={{ height: 52, borderRadius: 13, fontSize: 15, marginTop: 6 }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>{t('auth.reset.save')}<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
