import { useState } from 'react';
import { Search, Command, Menu, Sparkles, Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockCredits } from '@/lib/mocks/data';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { LocaleDropdown } from '@/components/LocaleDropdown';
import Modal from '@/components/creatyng/Modal';

interface TopbarProps {
  onMenuToggle?: () => void;
}

const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        background: 'rgba(245,245,243,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(20,20,23,0.06)',
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
          background: 'rgba(20,20,23,0.035)',
          borderRadius: 8,
          border: '1px solid rgba(20,20,23,0.06)',
        }}
        onClick={() => {
          const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
          document.dispatchEvent(e);
        }}
      >
        <Search style={{ width: 15, height: 15, color: '#8e8e96' }} />
        <span style={{ fontSize: 13.5, color: '#8e8e96' }}>{t('topbar.search')}</span>
        <kbd
          className="ml-3 flex items-center gap-0.5 font-mono"
          style={{ background: 'rgba(20,20,23,0.05)', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}
        >
          <Command style={{ width: 10, height: 10 }} />K
        </kbd>
      </button>

      <div className="flex-1" />

      <LocaleDropdown compact />

      {/* Credits badge — clickable to open recharge modal */}
      <button
        className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        onClick={() => setShowUpgradeModal(true)}
        title="Recarregar créditos"
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          border: '1px solid rgba(20,20,23,0.06)',
          background: '#ffffff',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Sparkles style={{ width: 15, height: 15, color: '#ff713d' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#ff713d' }}>{mockCredits.current}</span>
        <span style={{ fontSize: 11.5, color: '#8e8e96' }}>créditos</span>
      </button>

      {/* Upgrade button */}
      <button
        className="hidden sm:flex items-center gap-1.5 transition-opacity hover:opacity-80"
        onClick={() => setShowUpgradeModal(true)}
        style={{
          padding: '5px 14px',
          borderRadius: 8,
          border: '1.5px solid #ff713d',
          background: '#FFF0EA',
          fontSize: 12.5,
          fontWeight: 600,
          color: '#ff713d',
        }}
      >
        <Zap style={{ width: 13, height: 13 }} />
        Upgrade
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
      <Modal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Recarregar Créditos" size="sm">
        <p style={{ fontSize: 14, color: '#5a5a60', lineHeight: 1.6, marginBottom: 20 }}>
          Escolha um pacote de créditos para continuar gerando criativos incríveis sem interrupção.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { label: '100 créditos', price: 'R$ 9,90', highlight: false },
            { label: '300 créditos', price: 'R$ 24,90', highlight: true },
            { label: '700 créditos', price: 'R$ 49,90', highlight: false },
          ].map((pkg) => (
            <button
              key={pkg.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 150ms',
                border: pkg.highlight ? '2px solid #ff713d' : '1px solid rgba(20,20,23,0.08)',
                background: pkg.highlight ? '#FFF0EA' : '#ffffff',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: '#141417' }}>
                <Plus size={14} color="#ff713d" /> {pkg.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: pkg.highlight ? '#ff713d' : '#5a5a60' }}>{pkg.price}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowUpgradeModal(false)}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Confirmar recarga
        </button>
      </Modal>
    </header>
  );
};

export default Topbar;
