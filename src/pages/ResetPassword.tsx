// src/pages/ResetPassword.tsx
// CREATYNG — Set a new password after arriving from the recovery email link.
// Supabase establishes a temporary recovery session from the URL hash on load
// (handled by AuthProvider's onAuthStateChange). Here the user picks a new password.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'hsl(var(--background))', padding: 20, fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))', borderRadius: 18, padding: '32px 28px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <Logo />
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: '#10B981', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t('auth.reset.success')}</p>
          </div>
        ) : !hasSession && checked ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'hsl(var(--foreground))', marginBottom: 8, lineHeight: 1.5 }}>
              {t('auth.reset.invalid_link')}
            </p>
            {urlError && (
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 16, lineHeight: 1.4 }}>
                {urlError}
              </p>
            )}
            <Button variant="gradient" onClick={() => navigate('/login')} className="w-full" style={{ height: 44 }}>
              {t('auth.reset.back_to_login')}
            </Button>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--foreground))', textAlign: 'center' }}>
              {t('auth.reset.title')}
            </h1>
            <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 4, marginBottom: 22 }}>
              {t('auth.reset.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5b5bb' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('auth.reset.new_password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 text-sm outline-none"
                  style={{ height: 44, borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13.5 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#b5b5bb' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5b5bb' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={t('auth.reset.confirm_placeholder')}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 text-sm outline-none"
                  style={{ height: 44, borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 13.5 }}
                />
              </div>

              {error && (
                <p className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600">{error}</p>
              )}

              <Button type="submit" variant="gradient" disabled={loading} className="w-full" style={{ height: 44, fontSize: 13.5 }}>
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
