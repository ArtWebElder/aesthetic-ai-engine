import { useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { supabase } from '@/services/supabaseClient';
import SidebarNav from './SidebarNav';
import Topbar from './Topbar';
import CommandBar from './CommandBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Mail, X, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import CreditUpsell from '@/components/creatyng/CreditUpsell';

const AppShell = () => {
  const { user, loading, emailVerified } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleResendEmail = useCallback(async () => {
    if (!user?.email || resending) return;
    setResending(true);
    try {
      await supabase.auth.resend({ type: 'signup', email: user.email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  }, [user?.email, resending]);

  const handleVerifyOtp = useCallback(async () => {
    if (!user?.email || !otpCode.trim() || otpLoading) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otpCode.trim(),
        type: 'signup',
      });
      if (error) {
        setOtpError(t('verify_email.otp_invalid'));
      } else {
        setOtpSuccess(true);
        setBannerDismissed(true);
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpSuccess(false);
          setOtpCode('');
        }, 2000);
      }
    } catch {
      setOtpError(t('verify_email.otp_invalid'));
    } finally {
      setOtpLoading(false);
    }
  }, [user?.email, otpCode, otpLoading, t]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      // Cmd/Ctrl+N → new creation
      if (isMod && e.key === 'n') {
        e.preventDefault();
        navigate('/app/create');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  // DEV: auth guard temporarily disabled for visual review
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-[#141417] flex items-center justify-center">
  //       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff713d] to-[#FF9B70] flex items-center justify-center animate-pulse">
  //         <span className="text-white font-extrabold text-lg">C</span>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="min-h-screen flex w-full noise-overlay">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20" style={{ overflow: 'visible' }}>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar — 280px drawer, always expanded */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SidebarNav onClose={() => setMobileOpen(false)} forceExpanded />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {!pathname.startsWith('/app/create') && (
          <Topbar onMenuToggle={() => setMobileOpen(true)} />
        )}

        {/* Email verification banner — only for email/password users */}
        {!emailVerified && !bannerDismissed && (
          <div style={{
            background: 'linear-gradient(90deg, #FFF7ED, #FFEDD5)',
            borderBottom: '1px solid #FDBA74',
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, color: '#9A3412',
            flexWrap: 'wrap',
          }}>
            <Mail style={{ width: 16, height: 16, flexShrink: 0, color: '#EA580C' }} />
            <span style={{ flex: 1 }}>
              {resent ? t('verify_email.resent') : t('verify_email.banner')}
            </span>
            {!resent && (
              <>
                <button
                  onClick={() => setShowOtpModal(true)}
                  style={{
                    padding: '4px 14px', borderRadius: 6, border: 'none',
                    background: '#EA580C', color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <ShieldCheck style={{ width: 13, height: 13 }} />
                  {t('verify_email.verify_now')}
                </button>
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: '1px solid #FDBA74',
                    background: '#fff', color: '#EA580C', fontSize: 12, fontWeight: 600,
                    cursor: resending ? 'default' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5, opacity: resending ? 0.6 : 1,
                  }}
                >
                  <RefreshCw style={{ width: 13, height: 13, animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                  {t('verify_email.resend')}
                </button>
              </>
            )}
            <button
              onClick={() => setBannerDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9A3412' }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}

        {/* Credit upsell banners/modals */}
        <CreditUpsell />

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          }} onClick={() => { if (!otpLoading) { setShowOtpModal(false); setOtpError(null); setOtpCode(''); } }}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 16, padding: '32px 28px', width: 380, maxWidth: '90vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                animation: 'scIn 200ms ease both',
              }}
            >
              <style>{`@keyframes scIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

              {otpSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle style={{ width: 48, height: 48, color: '#10B981', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{t('verify_email.success_title')}</h3>
                  <p style={{ fontSize: 13, color: '#8e8e96' }}>{t('verify_email.success_desc')}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(255,113,61,0.12), rgba(255,155,112,0.08))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C',
                    }}>
                      <Mail style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t('verify_email.modal_title')}</h3>
                      <p style={{ fontSize: 12.5, color: '#8e8e96' }}>{t('verify_email.modal_desc')}</p>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: '#5a5a60', marginBottom: 14 }}>
                    {t('verify_email.modal_sent_to')} <strong>{user?.email}</strong>
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t('verify_email.otp_placeholder')}
                    value={otpCode}
                    onChange={e => { setOtpCode(e.target.value); setOtpError(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 16,
                      border: otpError ? '2px solid #EF4444' : '1px solid rgba(20,20,23,0.12)',
                      outline: 'none', fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center',
                      marginBottom: 8,
                    }}
                  />

                  {otpError && (
                    <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>{otpError}</p>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || !otpCode.trim()}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg,#ff713d,#FF9B70)', color: '#fff',
                      fontSize: 14, fontWeight: 600, cursor: otpLoading || !otpCode.trim() ? 'default' : 'pointer',
                      fontFamily: 'inherit', opacity: otpLoading || !otpCode.trim() ? 0.5 : 1,
                      marginBottom: 12, transition: 'opacity 150ms',
                    }}
                  >
                    {otpLoading ? t('verify_email.verifying') : t('verify_email.verify_btn')}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={handleResendEmail}
                      disabled={resending}
                      style={{
                        background: 'none', border: 'none', color: '#EA580C', fontSize: 12.5,
                        cursor: resending ? 'default' : 'pointer', fontFamily: 'inherit',
                        opacity: resending ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <RefreshCw style={{ width: 12, height: 12, animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                      {resent ? t('verify_email.resent') : t('verify_email.resend')}
                    </button>
                    <button
                      onClick={() => { setShowOtpModal(false); setOtpError(null); setOtpCode(''); }}
                      style={{
                        background: 'none', border: 'none', color: '#8e8e96', fontSize: 12.5,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {t('verify_email.later')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto bg-background" style={
          pathname.startsWith('/app/create') ? { overflow: 'hidden', background: 'none', position: 'relative' } : {
            backgroundColor: '#FAFAFA',
            backgroundImage: [
              'linear-gradient(180deg, rgba(255,113,61,0.04) 0%, transparent 30%)',
              'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
            ].join(','),
            backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          }
        }>
          {['/app/create/studio', '/app/create', '/app/settings', '/app/help'].some(p => pathname === p || pathname.startsWith(p + '/')) ? (
            <Outlet />
          ) : ['/app/projects', '/app/billing'].some(p => pathname.startsWith(p)) ? (
            <div key={pathname} className="animate-fade-up max-w-6xl mx-auto w-full px-4 py-2 md:px-6 lg:px-8">
              <Outlet />
            </div>
          ) : (
            <div key={pathname} className="animate-fade-up px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <CommandBar />
    </div>
  );
};

export default AppShell;
