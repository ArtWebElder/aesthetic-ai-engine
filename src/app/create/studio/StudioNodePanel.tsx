import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { NodeTypeId, NODE_TYPE_DEFS, PanelTab } from './types';
import { useI18n } from '@/i18n';

interface NodeCategoryGroup {
  labelKey: string;
  items: NodeTypeId[];
}

const NODE_GROUPS: NodeCategoryGroup[] = [
  {
    labelKey: 'studio.panel.frequently_used',
    items: ['text_input', 'image_upload', 'prompt_builder', 'image_gen'],
  },
  {
    labelKey: 'studio.panel.use_ai',
    items: ['scene_gen', 'image_gen'],
  },
  {
    labelKey: 'studio.panel.context',
    items: ['brand_input', 'image_upload', 'text_input'],
  },
  {
    labelKey: 'studio.panel.automate',
    items: ['bg_removal', 'color_grade', 'typography', 'export'],
  },
];

const TEMPLATES = [
  { id: 'food-pop', name: 'Food/Pop Basic', desc: 'Upload → BG Remove → Scene Gen', color: '#ff713d' },
  { id: 'pop-full', name: 'Pop Design Complete', desc: 'Full brand flow with typography', color: '#8b5cf6' },
  { id: 'product', name: 'Product Photoshoot', desc: 'Professional product images', color: '#06b6d4' },
  { id: 'social', name: 'Social Post', desc: 'Instagram-ready creatives', color: '#10b981' },
  { id: 'editorial', name: 'Editorial Layout', desc: 'Clean editorial composition', color: '#f59e0b' },
];

const ASSETS = [
  { id: 'logo', name: 'Brand Logo', type: 'PNG', size: '45 KB' },
  { id: 'palette', name: 'Color Palette', type: 'JSON', size: '2 KB' },
  { id: 'font', name: 'Custom Font', type: 'TTF', size: '120 KB' },
  { id: 'photos', name: 'Product Photos', type: 'Folder', size: '3 items' },
];

const LEARN_ITEMS = [
  { id: 'start', title: 'Getting started', desc: 'Learn the basics of the Studio' },
  { id: 'nodes', title: 'Available nodes', desc: 'What each node does' },
  { id: 'connect', title: 'Connecting nodes', desc: 'How to wire up your flow' },
  { id: 'tips', title: 'Pro tips', desc: 'Advanced techniques' },
];

interface StudioNodePanelProps {
  tab: PanelTab;
  onClose: () => void;
  onAddNode: (type: NodeTypeId) => void;
}

export function StudioNodePanel({ tab, onClose, onAddNode }: StudioNodePanelProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filterBySearch = (items: NodeTypeId[]) => {
    if (!search) return items;
    return items.filter(id => {
      const def = NODE_TYPE_DEFS[id];
      return def.label.toLowerCase().includes(search.toLowerCase());
    });
  };

  return (
    <div style={{
      position: 'fixed',
      left: 62,
      top: 60,
      bottom: 60,
      width: 260,
      zIndex: 90,
      background: '#1a1a1f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>
          {tab === 'nodes' && t('studio.nav.add_node')}
          {tab === 'assets' && t('studio.nav.assets')}
          {tab === 'templates' && t('studio.nav.templates')}
          {tab === 'learn' && t('studio.nav.learn')}
        </span>
        <button
          onClick={onClose}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Search (nodes tab only) */}
      {tab === 'nodes' && (
        <div style={{ padding: '8px 12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7,
            padding: '5px 8px',
          }}>
            <Search size={11} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('studio.panel.search')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 11,
                color: '#e5e7eb',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        {tab === 'nodes' && (
          <div>
            {NODE_GROUPS.map((group, gi) => {
              const filtered = filterBySearch(group.items);
              // Deduplicate shown items within group
              const unique = [...new Set(filtered)];
              if (unique.length === 0) return null;
              return (
                <div key={gi} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, padding: '6px 4px 4px' }}>
                    {t(group.labelKey)}
                  </div>
                  {unique.map(typeId => {
                    const def = NODE_TYPE_DEFS[typeId];
                    return (
                      <button
                        key={typeId}
                        onClick={() => onAddNode(typeId)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 8px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,113,61,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: `${def.color}25`,
                          border: `1px solid ${def.color}40`,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 12 }}>
                            {def.category === 'input' ? '📥' : def.category === 'ai' ? '✨' : def.category === 'output' ? '📤' : '⚙️'}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{def.label}</div>
                          {def.aiProvider && (
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{def.aiProvider}</div>
                          )}
                        </div>
                        {def.creditCost && (
                          <div style={{ marginLeft: 'auto', fontSize: 9, color: '#ff713d', fontWeight: 700 }}>
                            {def.creditCost}cr
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'templates' && (
          <div style={{ padding: '4px 0' }}>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 2,
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: `1px solid transparent`,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  marginBottom: 4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${tpl.color}15`;
                  e.currentTarget.style.border = `1px solid ${tpl.color}40`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '1px solid transparent';
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{tpl.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tpl.desc}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'assets' && (
          <div style={{ padding: '4px 0' }}>
            {ASSETS.map(asset => (
              <div
                key={asset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 7,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {asset.type === 'PNG' ? '🖼️' : asset.type === 'TTF' ? '🔤' : asset.type === 'JSON' ? '🎨' : '📁'}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }}>{asset.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{asset.type} · {asset.size}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'learn' && (
          <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEARN_ITEMS.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,113,61,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
