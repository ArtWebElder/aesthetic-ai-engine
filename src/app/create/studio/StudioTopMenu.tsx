import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, LayoutDashboard, Plus, Copy, Undo2, Redo2,
  LayoutGrid, Trash2,
} from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';

interface StudioTopMenuProps {
  onNewFlow: () => void;
  onCloneFlow: () => void;
  onAutoLayout: () => void;
  onDeleteFlow: () => void;
}

export function StudioTopMenu({
  onNewFlow,
  onCloneFlow,
  onAutoLayout,
  onDeleteFlow,
}: StudioTopMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    fontSize: 12,
    color: 'hsl(var(--foreground))',
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'background 0.1s',
  };

  const handleItem = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      style={{ position: 'absolute', top: 14, left: 14, zIndex: 200 }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 10px',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 10,
          color: 'hsl(var(--foreground))',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={11} color="#fff" />
        </div>
        {t('studio.menu.title')}
        <ChevronDown size={12} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: 220,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 10,
          padding: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'fadeIn 0.1s ease',
        }}>
          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleItem(() => navigate('/app/dashboard'))}
          >
            <LayoutDashboard size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.home')}</span>
          </div>

          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleItem(onNewFlow)}
          >
            <Plus size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.new')}</span>
          </div>

          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleItem(onCloneFlow)}
          >
            <Copy size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.clone')}</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 0' }} />

          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => { setOpen(false); }}
          >
            <Undo2 size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.undo')}</span>
            <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>Ctrl+Z</span>
          </div>

          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => { setOpen(false); }}
          >
            <Redo2 size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.redo')}</span>
            <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>Ctrl+Shift+Z</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 0' }} />

          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleItem(onAutoLayout)}
          >
            <LayoutGrid size={13} style={{ opacity: 0.7 }} />
            <span style={{ flex: 1 }}>{t('studio.menu.auto_layout')}</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 0' }} />

          <div
            style={{ ...itemStyle, color: '#ef4444' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => handleItem(onDeleteFlow)}
          >
            <Trash2 size={13} />
            <span style={{ flex: 1 }}>{t('studio.menu.delete')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
