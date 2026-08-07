// src/components/creatyng/CreditUpsell.tsx
// CREATYNG — Smart credit upsell system (5 behavioral triggers)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Sparkles, AlertTriangle, Zap, Star, Heart, ArrowRight, CreditCard } from 'lucide-react';
import { useCreditStore } from '@/stores/useCreditStore';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

/* ─── Local storage keys ──────────────────────────────── */
const LS_FIRST_GEN = 'creatyng_first_gen_shown';
const LS_SATISFACTION = 'creatyng_satisfaction_shown';
const LS_GEN_COUNT = 'creatyng_gen_count';
const LS_LOW_DISMISSED = 'creatyng_low_credits_dismissed';

/* ─── Helpers ─────────────────────────────────────────── */
function getGenCount(): number {
  try { return parseInt(localStorage.getItem(LS_GEN_COUNT) || '0', 10); } catch { return 0; }
}

export function incrementGenCount(): number {
  const n = getGenCount() + 1;
  try { localStorage.setItem(LS_GEN_COUNT, String(n)); } catch { /* */ }
  return n;
}

/* ─── A. First Generation Toast ────────────────────────── */
function FirstGenToast({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      background: 'hsl(var(--card))', borderRadius: 14, padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid hsl(var(--border))',
      maxWidth: 340, display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'fdUp 300ms ease both',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, hsl(var(--brand) / 0.12), rgba(255,155,112,0.08))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={18} style={{ color: 'hsl(var(--brand))' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 3 }}>
          {t('upsell.first_gen.title')}
        </div>
        <div style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
          {t('upsell.first_gen.desc')}
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#b5b5bb' }}>
        <X size={16} />
      </button>
    </div>
  );
}

/* ─── B. Low Credits Banner ────────────────────────────── */
function LowCreditsBanner({ credits, onDismiss, onUpgrade }: { credits: number; onDismiss: () => void; onUpgrade: () => void }) {
  const { t } = useI18n();

  return (
    <div style={{
      background: 'hsl(var(--brand) / 0.08)',
      borderBottom: '1px solid #FDBA74',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, color: '#9A3412',
      flexWrap: 'wrap',
    }}>
      <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0, color: '#EA580C' }} />
      <span style={{ flex: 1 }}>
        {t('upsell.credits_low.banner').replace('{credits}', String(credits))}
      </span>
      <button
        onClick={onUpgrade}
        style={{
          padding: '4px 14px', borderRadius: 6, border: 'none',
          background: 'hsl(var(--brand))', color: 'hsl(var(--brand-foreground))', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <Zap style={{ width: 13, height: 13 }} />
        {t('upsell.credits_low.upgrade')}
      </button>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9A3412' }}
      >
        <X style={{ width: 15, height: 15 }} />
      </button>
    </div>
  );
}

/* ─── C. Critical Credits Modal ────────────────────────── */
function CriticalCreditsModal({ credits, onClose, onUpgrade }: { credits: number; onClose: () => void; onUpgrade: () => void }) {
  const { t } = useI18n();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'hsl(var(--card))', borderRadius: 16, padding: '32px 28px', width: 380, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        animation: 'scIn 200ms ease both',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, margin: '0 auto 18px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={24} style={{ color: '#EA580C' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
          {t('upsell.credits_critical.title')}
        </h3>
        <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
          {t('upsell.credits_critical.desc').replace('{credits}', String(credits))}
        </p>
        <Button
          variant="gradient"
          onClick={onUpgrade}
          className="w-full"
          style={{ padding: '11px 0', fontSize: 14, marginBottom: 10, height: 'auto' }}
        >
          {t('upsell.credits_critical.upgrade')}
        </Button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
            background: 'transparent', color: 'hsl(var(--muted-foreground))',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {t('upsell.credits_critical.later')}
        </button>
      </div>
    </div>
  );
}

/* ─── D. Paywall Modal (0 credits) ─────────────────────── */
export function PaywallModal({ onClose, plan }: { onClose: () => void; plan: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isFree = plan === 'free';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'hsl(var(--card))', borderRadius: 16, padding: '36px 28px', width: 400, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        animation: 'scIn 200ms ease both',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(234,88,12,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CreditCard size={28} style={{ color: '#EF4444' }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
          {t('upsell.credits_zero.title')}
        </h3>
        <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          {isFree ? t('upsell.credits_zero.desc_free') : t('upsell.credits_zero.desc_paid')}
        </p>

        {isFree ? (
          <>
            <Button
              variant="gradient"
              onClick={() => { onClose(); navigate('/app/billing'); }}
              className="w-full"
              style={{ padding: '12px 0', fontSize: 14, marginBottom: 10, height: 'auto' }}
            >
              <Zap size={16} /> {t('upsell.credits_zero.upgrade_pro')}
            </Button>
            <button
              onClick={() => { onClose(); navigate('/app/billing'); }}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                border: '1.5px solid rgba(124,58,237,0.2)',
                background: 'rgba(124,58,237,0.04)', color: '#7C3AED',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Star size={15} /> {t('upsell.credits_zero.see_team')}
            </button>
          </>
        ) : (
          <Button
            variant="gradient"
            onClick={() => { onClose(); navigate('/app/billing'); }}
            className="w-full"
            style={{ padding: '12px 0', fontSize: 14, height: 'auto' }}
          >
            <CreditCard size={16} /> {t('upsell.credits_zero.recharge')}
          </Button>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
            background: 'transparent', color: 'hsl(var(--muted-foreground))', marginTop: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {t('upsell.credits_zero.close')}
        </button>
      </div>
    </div>
  );
}

/* ─── E. Satisfaction Popup ────────────────────────────── */
function SatisfactionPopup({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      background: 'hsl(var(--card))', borderRadius: 14, padding: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid hsl(var(--border))',
      maxWidth: 320, animation: 'fdUp 300ms ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(244,63,94,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Heart size={18} style={{ color: '#EC4899' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 3 }}>
            {t('upsell.satisfaction.title')}
          </div>
          <div style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
            {t('upsell.satisfaction.desc')}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#b5b5bb' }}>
          <X size={16} />
        </button>
      </div>
      <Button
        variant="gradient"
        onClick={() => { onClose(); navigate('/app/billing'); }}
        className="w-full"
        style={{ padding: '9px 0', fontSize: 13, height: 'auto' }}
      >
        {t('upsell.satisfaction.upgrade')} <ArrowRight size={14} />
      </Button>
    </div>
  );
}

/* ─── Main CreditUpsell Orchestrator ───────────────────── */
export default function CreditUpsell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { credits, plan } = useCreditStore();
  const [showFirstGen, setShowFirstGen] = useState(false);
  const [showLowBanner, setShowLowBanner] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [criticalShownThisSession, setCriticalShownThisSession] = useState(false);

  // BUG 6: never show upsell modals on billing, settings, or onboarding pages
  const isSuppressedRoute = /\/(billing|settings|onboarding|create)/.test(pathname);

  // Check behavioral triggers
  useEffect(() => {
    if (isSuppressedRoute) return;
    const genCount = getGenCount();

    // A. First generation toast — show once after 1st gen
    if (genCount === 1) {
      try {
        if (!localStorage.getItem(LS_FIRST_GEN)) {
          setShowFirstGen(true);
          localStorage.setItem(LS_FIRST_GEN, '1');
        }
      } catch { /* */ }
    }

    // E. Satisfaction popup — show once after 3rd gen
    if (genCount >= 3) {
      try {
        if (!localStorage.getItem(LS_SATISFACTION)) {
          setShowSatisfaction(true);
          localStorage.setItem(LS_SATISFACTION, '1');
        }
      } catch { /* */ }
    }
  }, [isSuppressedRoute]);

  // Credit-based triggers
  // BUG 7: PaywallModal (credits === 0) removed from here — only shown in WizardPage on generate attempt
  // Critical modal threshold lowered from <=5 to <=2
  useEffect(() => {
    if (isSuppressedRoute) return;

    // C. Critical (≤2 credits) — once per session, dismissable, non-blocking
    if (credits > 0 && credits <= 2 && !criticalShownThisSession) {
      setShowCriticalModal(true);
      setCriticalShownThisSession(true);
      return;
    }

    // B. Low credits (≤15) — dismissable, returns next session
    if (credits <= 15 && credits > 0) {
      try {
        const dismissed = sessionStorage.getItem(LS_LOW_DISMISSED);
        if (!dismissed) setShowLowBanner(true);
      } catch { setShowLowBanner(true); }
    }
  }, [credits, criticalShownThisSession, isSuppressedRoute]);

  const handleDismissLow = useCallback(() => {
    setShowLowBanner(false);
    try { sessionStorage.setItem(LS_LOW_DISMISSED, '1'); } catch { /* */ }
  }, []);

  const goToBilling = useCallback(() => {
    navigate('/app/billing');
  }, [navigate]);

  // BUG 6: suppress everything on billing/settings/onboarding
  if (isSuppressedRoute) return null;

  return (
    <>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* B. Low credits banner */}
      {showLowBanner && !showCriticalModal && (
        <LowCreditsBanner credits={credits} onDismiss={handleDismissLow} onUpgrade={goToBilling} />
      )}

      {/* A. First gen toast */}
      {showFirstGen && <FirstGenToast onClose={() => setShowFirstGen(false)} />}

      {/* C. Critical credits modal (≤2, non-blocking, dismissable) */}
      {showCriticalModal && (
        <CriticalCreditsModal
          credits={credits}
          onClose={() => setShowCriticalModal(false)}
          onUpgrade={() => { setShowCriticalModal(false); goToBilling(); }}
        />
      )}

      {/* E. Satisfaction popup */}
      {showSatisfaction && !showFirstGen && !showCriticalModal && (
        <SatisfactionPopup onClose={() => setShowSatisfaction(false)} />
      )}
    </>
  );
}
