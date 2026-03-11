import { useState } from 'react';
import { Plus, Images, Layers, MessageSquare, BookOpen } from 'lucide-react';
import { PanelTab } from './types';
import { useI18n } from '@/i18n';

interface NavItem {
  id: PanelTab | 'chat';
  icon: React.ElementType;
  labelKey: string;
  isChat?: boolean;
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nodes', icon: Plus, labelKey: 'studio.nav.add_node', accent: true },
  { id: 'assets', icon: Images, labelKey: 'studio.nav.assets' },
  { id: 'templates', icon: Layers, labelKey: 'studio.nav.templates' },
  { id: 'chat', icon: MessageSquare, labelKey: 'studio.nav.chat', isChat: true },
  { id: 'learn', icon: BookOpen, labelKey: 'studio.nav.learn' },
];

interface StudioNavbarProps {
  openPanel: PanelTab | null;
  chatOpen: boolean;
  onPanelChange: (tab: PanelTab | null) => void;
  onChatToggle: () => void;
}

export function StudioNavbar({ openPanel, chatOpen, onPanelChange, onChatToggle }: StudioNavbarProps) {
  const { t } = useI18n();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = (item: NavItem) => {
    if (item.isChat) {
      onChatToggle();
      return;
    }
    const tab = item.id as PanelTab;
    onPanelChange(openPanel === tab ? null : tab);
  };

  const isActive = (item: NavItem) => {
    if (item.isChat) return chatOpen;
    return openPanel === item.id;
  };

  return (
    <div style={{
      position: 'absolute',
      left: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item);
        const hovered = hoveredId === item.id;
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              onClick={() => handleClick(item)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.1)',
                background: active
                  ? item.accent
                    ? '#ff713d'
                    : 'rgba(255,113,61,0.12)'
                  : item.accent
                  ? '#ff713d'
                  : '#ffffff',
                color: active && !item.accent
                  ? '#ff713d'
                  : item.accent
                  ? '#fff'
                  : active
                  ? '#ff713d'
                  : 'rgba(0,0,0,0.55)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active
                  ? '0 4px 12px rgba(255,113,61,0.3)'
                  : '0 2px 6px rgba(0,0,0,0.08)',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <Icon size={15} />
            </button>

            {/* Tooltip */}
            {hovered && (
              <div style={{
                position: 'absolute',
                left: 46,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ffffff',
                color: '#111827',
                fontSize: 11,
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                pointerEvents: 'none',
                animation: 'fadeIn 0.1s ease',
              }}>
                {t(item.labelKey)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
