import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/services/supabaseClient';
import { useCreditStore } from '@/stores/useCreditStore';
import { useI18n } from '@/i18n';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';

interface RechargeCreditsModalProps {
  open: boolean;
  onClose: () => void;
  currentCredits?: number;
  totalCredits?: number;
}

const PACKAGES = [
  { id: '100', credits: 100, price: 'R$ 9,90', per: 'R$ 0,099', save: null, color: 'hsl(var(--foreground))', accent: false, purple: false },
  { id: '300', credits: 300, price: 'R$ 24,90', per: 'R$ 0,083', save: '17%', color: 'hsl(var(--brand))', accent: true, purple: false },
  { id: '500', credits: 500, price: 'R$ 39,90', per: 'R$ 0,079', save: '20%', color: '#7C3AED', accent: false, purple: true },
];

type PayMethod = 'card' | 'pix';

// Detect if user is likely in Brazil
function detectBrazil(): boolean {
  try {
    const lang = navigator.language || '';
    if (lang.toLowerCase() === 'pt-br') return true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('America/') && [
      'America/Sao_Paulo', 'America/Fortaleza', 'America/Recife',
      'America/Bahia', 'America/Belem', 'America/Manaus',
      'America/Cuiaba', 'America/Porto_Velho', 'America/Boa_Vista',
      'America/Campo_Grande', 'America/Rio_Branco', 'America/Maceio',
      'America/Araguaina', 'America/Noronha', 'America/Eirunepe',
      'America/Santarem',
    ].includes(tz)) return true;
  } catch { /* fallback to false */ }
  return false;
}

// Format CPF (000.000.000-00) or CNPJ (00.000.000/0000-00)
function formatCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    // CPF mask
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ mask
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

const RechargeCreditsModal = ({
  open,
  onClose,
  currentCredits: propCredits,
  totalCredits = 500,
}: RechargeCreditsModalProps) => {
  const { t } = useI18n();
  const { emailVerified, user } = useAuth();
  const storeCredits = useCreditStore((s) => s.credits);
  const currentCredits = propCredits ?? storeCredits;

  const [isBrazil] = useState(detectBrazil);
  const [selected, setSelected] = useState(1);
  const [method, setMethod] = useState<PayMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CPF/CNPJ state (Pix only)
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cpfError, setCpfError] = useState(false);

  // Pix state
  const [pixQrImage, setPixQrImage] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill CPF/CNPJ from profile
  useEffect(() => {
    if (!user || cpfCnpj) return;
    supabase.from('profiles').select('cpf_cnpj').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.cpf_cnpj) setCpfCnpj(formatCpfCnpj(data.cpf_cnpj));
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup polling on unmount/close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      setPixQrImage(null);
      setPixPayload(null);
      setPixPaymentId(null);
      setPixPaid(false);
      setError(null);
      setLoading(false);
      setCopied(false);
      setCpfError(false);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Pix polling ──
  const startPixPolling = useCallback((paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('check-pix-status', {
          body: { payment_id: paymentId },
        });
        // If invoke fails (401, network, etc), skip this cycle
        if (fnErr) return;
        if (data?.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPixPaid(true);
          useCreditStore.getState().fetchCredits();
        } else if (data?.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(t('recharge.pix_expired'));
          setPixQrImage(null);
        }
      } catch { /* silent retry */ }
    }, 5000);
  }, [t]);

  // ── Handle purchase ──
  async function handlePurchase() {
    if (!emailVerified) {
      setError(t('verify_email.block_purchase'));
      return;
    }
    setError(null);
    setCpfError(false);
    setLoading(true);
    const pkg = PACKAGES[selected];

    // Validate CPF/CNPJ for Pix
    if (method === 'pix') {
      const digits = cpfCnpj.replace(/\D/g, '');
      if (digits.length < 11) {
        setCpfError(true);
        setError(t('recharge.cpf_required'));
        setLoading(false);
        return;
      }
    }

    try {
      // Force token refresh to avoid "Invalid JWT" on edge function calls.
      // getSession() returns a cached token that may be expired; refreshSession()
      // actually contacts Supabase to get a fresh access_token.
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      console.log('[Payment] session refresh:', session ? 'authenticated' : 'NO SESSION', refreshError?.message || '');
      if (!session) {
        throw new Error(t('recharge.not_authenticated') || 'Not authenticated');
      }

      if (method === 'card') {
        console.log('[Payment] invoking create-stripe-checkout, package:', pkg.id);
        const { data, error: fnErr } = await supabase.functions.invoke('create-stripe-checkout', {
          body: { package: pkg.id },
        });
        console.log('[Payment] stripe response:', { data, fnErr });
        if (fnErr) {
          // supabase-js wraps non-2xx responses — try to extract the body
          const errBody = typeof fnErr === 'object' && 'context' in fnErr
            ? await (fnErr as { context: { json: () => Promise<Record<string, string>> } }).context.json().catch(() => null)
            : null;
          console.error('[Payment] stripe error body:', errBody);
          throw new Error(errBody?.error || data?.error || 'stripe_error');
        }
        if (!data?.url) {
          throw new Error(data?.error || 'stripe_no_url');
        }
        window.location.href = data.url;
        return; // redirect happening
      }

      // Pix
      const cpfDigits = cpfCnpj.replace(/\D/g, '');
      console.log('[Payment] invoking create-pix-charge, package:', pkg.id);
      const { data, error: fnErr } = await supabase.functions.invoke('create-pix-charge', {
        body: { package: pkg.id, cpfCnpj: cpfDigits },
      });
      console.log('[Payment] pix response:', { data, fnErr });
      if (fnErr) {
        const errBody = typeof fnErr === 'object' && 'context' in fnErr
          ? await (fnErr as { context: { json: () => Promise<Record<string, string>> } }).context.json().catch(() => null)
          : null;
        console.error('[Payment] pix error body:', errBody);
        throw new Error(errBody?.error || data?.error || 'pix_error');
      }
      if (!data?.qr_code_image) {
        throw new Error(data?.error || 'pix_no_qr');
      }

      setPixQrImage(data.qr_code_image);
      setPixPayload(data.qr_code_payload);
      setPixPaymentId(data.payment_id);
      startPixPolling(data.payment_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPayload() {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const plan = useCreditStore((s) => s.plan);

  if (!open) return null;

  // Free plan users cannot recharge — redirect to billing
  if (plan === 'free') {
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'hsl(var(--card))', borderRadius: 20, width: 380, maxWidth: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)', textAlign: 'center',
            padding: '36px 28px', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{t('recharge.plan_required_title')}</h3>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px', lineHeight: 1.5 }}>
            {t('recharge.plan_required_desc')}
          </p>
          <Button
            variant="gradient"
            onClick={() => { onClose(); window.location.href = '/app/billing'; }}
            style={{ padding: '10px 28px', fontSize: 14, fontWeight: 700 }}
          >
            {t('recharge.view_plans')}
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  const usedPct = Math.min(100, Math.round((currentCredits / totalCredits) * 100));
  const pkg = PACKAGES[selected];

  // ── Pix QR view ──
  if (pixQrImage && !pixPaid) {
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'hsl(var(--card))', borderRadius: 20, width: 400, maxWidth: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
            fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
            padding: '28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{t('recharge.scan_pix')}</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', margin: 0 }}>{pkg.credits} {t('recharge.credits_for')} {pkg.price}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img
              src={`data:image/png;base64,${pixQrImage}`}
              alt="Pix QR Code"
              style={{ width: 200, height: 200, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
            />
          </div>

          {pixPayload && (
            <button
              onClick={handleCopyPayload}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8,
                border: '1px solid hsl(var(--border))', background: copied ? 'hsl(var(--brand) / 0.14)' : 'hsl(var(--muted))',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                color: copied ? '#16a34a' : 'hsl(var(--foreground))',
              }}
            >
              {copied ? '✓ Copiado!' : t('recharge.copy_pix_code')}
            </button>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('recharge.waiting_payment')}</span>
            </div>
          </div>

          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        </div>
      </div>,
      document.body
    );
  }

  // ── Pix confirmed view ──
  if (pixPaid) {
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'hsl(var(--card))', borderRadius: 20, width: 380, maxWidth: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)', textAlign: 'center',
            padding: '36px 28px', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{t('recharge.payment_confirmed')}</h3>
          <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', margin: '0 0 20px' }}>
            {pkg.credits} {t('recharge.credits_added')}
          </p>
          <Button
            variant="gradient"
            onClick={onClose}
            style={{ padding: '10px 32px', fontSize: 14, fontWeight: 700 }}
          >
            {t('recharge.continue')}
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // ── Main modal ──
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(4px)',
        animation: 'rcmFdIn 150ms ease both',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes rcmFdIn{from{opacity:0}to{opacity:1}}
        @keyframes rcmMdIn{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'hsl(var(--card))', borderRadius: 20, width: 460, maxWidth: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflowX: 'hidden', overflowY: 'auto',
          maxHeight: 'calc(100dvh - 32px)',
          animation: 'rcmMdIn 250ms cubic-bezier(.4,0,.2,1) both',
          fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
        }}
      >
        {/* ── Header gradient ── */}
        <div style={{
          background: 'linear-gradient(160deg, hsl(var(--brand) / 0.14), hsl(var(--card)) 70%)',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '24px 28px 20px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'hsl(var(--brand) / 0.10)' }} />
          <div style={{ position: 'absolute', bottom: -10, left: 40, width: 50, height: 50, borderRadius: '50%', background: 'hsl(var(--brand) / 0.06)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" style={{ color: 'hsl(var(--brand))' }}>
                  <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
                </svg>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>{t('recharge.title')}</h3>
              </div>
              <p style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                {t('recharge.balance')}: <strong style={{ color: 'hsl(var(--brand))' }}>{currentCredits} {t('recharge.credits')}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 8,
                width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'hsl(var(--muted-foreground))', flexShrink: 0,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
              <span>{currentCredits} {t('recharge.used')}</span>
              <span>{totalCredits} total</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'hsl(var(--muted))' }}>
              <div style={{ width: `${usedPct}%`, height: '100%', borderRadius: 3, background: 'hsl(var(--brand))', transition: 'width 600ms ease' }} />
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px 28px 24px' }}>
          {/* Payment method toggle — only show Pix for Brazil */}
          {isBrazil ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['card', 'pix'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMethod(m); setError(null); setCpfError(false); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    border: method === m ? '2px solid hsl(var(--brand))' : '1px solid hsl(var(--border))',
                    background: method === m ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--muted))',
                    color: method === m ? 'hsl(var(--brand))' : 'hsl(var(--muted-foreground))',
                    transition: 'all 150ms',
                  }}
                >
                  {m === 'card' ? `💳 ${t('recharge.card')}` : `📱 Pix`}
                </button>
              ))}
            </div>
          ) : null}

          {/* CPF/CNPJ field — only when Pix is selected */}
          {method === 'pix' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 5 }}>
                {t('recharge.cpf_label')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpfCnpj}
                onChange={(e) => { setCpfCnpj(formatCpfCnpj(e.target.value)); setCpfError(false); }}
                placeholder={t('recharge.cpf_placeholder')}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  border: cpfError ? '1.5px solid #ef4444' : '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', outline: 'none',
                  transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.target.style.borderColor = cpfError ? '#ef4444' : 'hsl(var(--brand))'; }}
                onBlur={(e) => { e.target.style.borderColor = cpfError ? '#ef4444' : 'hsl(var(--border))'; }}
              />
              <p style={{ fontSize: 10.5, color: cpfError ? '#ef4444' : '#b5b5bb', margin: '4px 0 0' }}>
                {cpfError ? t('recharge.cpf_required') : t('recharge.cpf_helper')}
              </p>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            {t('recharge.choose_package')}
          </div>

          {/* Package cards */}
          <div style={{ display: 'flex', gap: 10 }}>
            {PACKAGES.map((o, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{
                  flex: 1, padding: '16px 12px', borderRadius: 14, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  position: 'relative', transition: 'all 150ms',
                  border: selected === i
                    ? `2px solid ${o.color}`
                    : '1px solid hsl(var(--border))',
                  background: selected === i
                    ? (o.accent ? 'hsl(var(--brand) / 0.12)' : o.purple ? 'rgba(124,58,237,0.06)' : 'hsl(var(--muted))')
                    : 'hsl(var(--card))',
                }}
              >
                {o.save && (
                  <div style={{
                    position: 'absolute', top: -10, padding: '2px 8px', borderRadius: 5,
                    background: o.accent ? 'hsl(var(--brand))' : '#7C3AED',
                    color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}>
                    {t('recharge.save')} {o.save}
                  </div>
                )}
                <div style={{ fontSize: 26, fontWeight: 700, color: selected === i ? o.color : 'hsl(var(--foreground))', lineHeight: 1 }}>{o.credits}</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{t('recharge.credits')}</div>
                <div style={{ width: '100%', height: 1, background: 'hsl(var(--border))', margin: '6px 0' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: selected === i ? o.color : 'hsl(var(--foreground))' }}>{o.price}</div>
                <div style={{ fontSize: 10, color: '#b5b5bb' }}>{o.per} / {t('recharge.credit_unit')}</div>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12, padding: '8px 14px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: 12, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          {/* Info row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
            padding: '10px 14px', background: 'hsl(var(--muted))', borderRadius: 10,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#b5b5bb" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>
              {t('recharge.need_more')}{' '}
              <span style={{ color: 'hsl(var(--brand))', fontWeight: 600, cursor: 'pointer' }}>{t('recharge.contact_us')}</span>
              {' '}{t('recharge.corporate_packages')}
            </span>
          </div>

          {/* CTA button */}
          <Button
            variant="gradient"
            onClick={handlePurchase}
            disabled={loading}
            className="w-full"
            style={{
              padding: '13px 0', borderRadius: 11, marginTop: 16,
              fontSize: 14.5, fontWeight: 700, height: 'auto', gap: 8,
              background: loading ? '#d4d4d8' : undefined,
              boxShadow: loading ? 'none' : undefined,
              opacity: loading ? 0.7 : undefined,
            }}
          >
            {loading ? (
              <span>{t('recharge.processing')}</span>
            ) : (
              <>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ color: 'hsl(var(--brand))' }}>
                  <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
                </svg>
                {method === 'card'
                  ? `${t('recharge.add')} ${pkg.credits} ${t('recharge.credits')} — ${pkg.price}`
                  : `${t('recharge.generate_pix')} — ${pkg.price}`
                }
              </>
            )}
          </Button>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#b5b5bb" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontSize: 10.5, color: '#b5b5bb' }}>
              {method === 'card' ? t('recharge.secure_stripe') : t('recharge.secure_pix')}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RechargeCreditsModal;
