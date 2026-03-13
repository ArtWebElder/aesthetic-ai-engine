import { useState } from 'react';
import { Search, Command, Menu, Sparkles, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockCredits } from '@/lib/mocks/data';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { LocaleDropdown } from '@/components/LocaleDropdown';
import RechargeCreditsModal from '@/components/creatyng/RechargeCreditsModal';

interface TopbarProps {
  onMenuToggle?: () => void;
}

/* ── Simple inline tooltip ── */
function CreditTooltip({ credits, children }: { credits: number; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          padding: '6px 12px', borderRadius: 8,
          background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))',
          fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, pointerEvents: 'none',
          border: '1px solid hsl(var(--border))',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff713d', flexShrink: 0 }}>
              <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
            </svg>
            {credits} créditos restantes
          </span>
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid hsl(var(--popover))',
          }} />
        </div>
      )}
    </div>
  );
}

const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [notifCount, setNotifCount] = useState(3);

  const initials = (
    user?.user_metadata?.full_name?.charAt(0) ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U'
  ).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex items-center px-5 gap-3"
      style={{
        height: 56,
        background: 'hsl(var(--background) / 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {onMenuToggle && (
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onMenuToggle}>
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Search */}
      <button
        className="hidden sm:flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{
          padding: '6px 13px',
          background: 'hsl(var(--muted))',
          borderRadius: 8,
          border: '1px solid hsl(var(--border))',
        }}
        onClick={() => {
          const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
          document.dispatchEvent(e);
        }}
      >
        <Search style={{ width: 15, height: 15, color: 'hsl(var(--muted-foreground))' }} />
        <span style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>{t('topbar.search')}</span>
        <kbd
          className="ml-3 flex items-center gap-0.5 font-mono"
          style={{ background: 'hsl(var(--muted))', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}
        >
          <Command style={{ width: 10, height: 10 }} />K
        </kbd>
      </button>

      <div className="flex-1" />

      <LocaleDropdown compact />

      {/* Credits badge with tooltip */}
      <CreditTooltip credits={mockCredits.current}>
        <button
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          onClick={() => setShowUpgradeModal(true)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff713d', flexShrink: 0 }}>
            <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ff713d' }}>{mockCredits.current}</span>
          <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>créditos</span>
        </button>
      </CreditTooltip>

      {/* Upgrade button */}
      <button
        className="hidden sm:flex items-center gap-1.5 transition-opacity hover:opacity-80"
        onClick={() => setShowUpgradeModal(true)}
        style={{
          padding: '5px 14px',
          borderRadius: 8,
          border: '1.5px solid #ff713d',
          background: 'hsl(var(--primary) / 0.1)',
          fontSize: 12.5,
          fontWeight: 600,
          color: '#ff713d',
        }}
      >
        <Zap style={{ width: 13, height: 13 }} />
        Upgrade
      </button>

      {/* Notification bell */}
      <button
        onClick={() => setNotifCount(0)}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9,
          border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
          cursor: 'pointer', flexShrink: 0, transition: 'background 150ms',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card))'}
        title="Notificações"
      >
        <Bell style={{ width: 16, height: 16, color: 'hsl(var(--muted-foreground))' }} />
        {notifCount > 0 && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid hsl(var(--background) / 0.8)',
          }}>
            {notifCount > 9 ? '9+' : notifCount}
          </div>
        )}
      </button>

      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full text-white"
        style={{
          width: 30,
          height: 30,
          background: 'linear-gradient(135deg, #ff713d, #141417)',
          fontSize: 11.5,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <RechargeCreditsModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentCredits={mockCredits.current}
        totalCredits={500}
      />
    </header>
  );
};

export default Topbar;
