import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RechargeCreditsModalProps {
  open: boolean;
  onClose: () => void;
  currentCredits?: number;
  totalCredits?: number;
}

const PACKAGES = [
  { credits: 100, price: 'R$ 9,90', per: 'R$ 0,099', save: null, color: '#141417', accent: false, purple: false },
  { credits: 300, price: 'R$ 24,90', per: 'R$ 0,083', save: '17%', color: '#ff713d', accent: true, purple: false },
  { credits: 500, price: 'R$ 39,90', per: 'R$ 0,079', save: '20%', color: '#7C3AED', accent: false, purple: true },
];

const RechargeCreditsModal = ({
  open,
  onClose,
  currentCredits = 221,
  totalCredits = 500,
}: RechargeCreditsModalProps) => {
  const [selected, setSelected] = useState(1); // default: 300 credits

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const usedPct = Math.min(100, Math.round((currentCredits / totalCredits) * 100));
  const pkg = PACKAGES[selected];

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(20,20,23,0.4)', backdropFilter: 'blur(4px)',
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
          background: '#ffffff', borderRadius: 20, width: 460, maxWidth: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden',
          animation: 'rcmMdIn 250ms cubic-bezier(.4,0,.2,1) both',
          fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
        }}
      >
        {/* ── Header gradient ── */}
        <div style={{
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          padding: '24px 28px 20px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -10, left: 40, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {/* Sparkle icon */}
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
                  <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
                </svg>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Recarregar créditos</h3>
              </div>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                Saldo atual: <strong style={{ color: '#fff' }}>{currentCredits} créditos</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', backdropFilter: 'blur(4px)', flexShrink: 0,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
              <span>{currentCredits} usados</span>
              <span>{totalCredits} total</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: `${usedPct}%`, height: '100%', borderRadius: 3, background: '#fff', transition: 'width 600ms ease' }} />
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px 28px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Escolha seu pacote
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
                    : '1px solid rgba(20,20,23,0.06)',
                  background: selected === i
                    ? (o.accent ? '#FFF0EA' : o.purple ? 'rgba(124,58,237,0.06)' : '#f5f5f3')
                    : '#ffffff',
                }}
              >
                {o.save && (
                  <div style={{
                    position: 'absolute', top: -10, padding: '2px 8px', borderRadius: 5,
                    background: o.accent ? '#ff713d' : '#7C3AED',
                    color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}>
                    Economize {o.save}
                  </div>
                )}
                <div style={{ fontSize: 26, fontWeight: 700, color: selected === i ? o.color : '#141417', lineHeight: 1 }}>{o.credits}</div>
                <div style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500 }}>créditos</div>
                <div style={{ width: '100%', height: 1, background: 'rgba(20,20,23,0.06)', margin: '6px 0' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: selected === i ? o.color : '#141417' }}>{o.price}</div>
                <div style={{ fontSize: 10, color: '#b5b5bb' }}>{o.per} / crédito</div>
              </button>
            ))}
          </div>

          {/* Info row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
            padding: '10px 14px', background: '#f5f5f3', borderRadius: 10,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#b5b5bb" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 11.5, color: '#5a5a60' }}>
              Precisa de mais?{' '}
              <span style={{ color: '#ff713d', fontWeight: 600, cursor: 'pointer' }}>Entre em contato</span>
              {' '}para pacotes corporativos.
            </span>
          </div>

          {/* CTA button */}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 11, border: 'none', marginTop: 16,
              background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
              color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(255,113,61,0.35)', transition: 'all 180ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(255,113,61,0.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(255,113,61,0.35)'; }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
              <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
            </svg>
            Adicionar {pkg.credits} créditos — {pkg.price}
          </button>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#b5b5bb" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontSize: 10.5, color: '#b5b5bb' }}>Pagamento seguro via Stripe</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RechargeCreditsModal;
