import { useState } from 'react';
import { Search, X, Download, Upload, Sparkles, Settings, Image, Type, Palette, Folder } from 'lucide-react';
import { NodeTypeId, NODE_TYPE_DEFS, PanelTab } from './types';
import { useI18n } from '@/i18n';

function CategoryIcon({ category, size = 12 }: { category: string; size?: number }) {
  const s = { width: size, height: size };
  if (category === 'input') return <Download style={s} />;
  if (category === 'ai') return <Sparkles style={s} />;
  if (category === 'output') return <Upload style={s} />;
  return <Settings style={s} />;
}

function AssetTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const s = { width: size, height: size };
  if (type === 'PNG') return <Image style={s} />;
  if (type === 'TTF') return <Type style={s} />;
  if (type === 'JSON') return <Palette style={s} />;
  return <Folder style={s} />;
}

interface NodeCategoryGroup {
  labelKey: string;
  items: NodeTypeId[];
}

const NODE_GROUPS: NodeCategoryGroup[] = [
  {
    labelKey: 'studio.panel.frequently_used',
    items: ['text_input', 'image_upload', 'reference_upload', 'prompt_builder', 'image_gen'],
  },
  {
    labelKey: 'studio.panel.use_ai',
    items: ['reference_analyzer', 'scene_gen', 'image_gen', 'background_gen', 'copy_ai', 'composition_ai'],
  },
  {
    labelKey: 'studio.panel.processing',
    items: ['bg_removal', 'compositor', 'color_grade'],
  },
  {
    labelKey: 'studio.panel.composition',
    items: ['text_overlay', 'typography', 'prompt_builder'],
  },
  {
    labelKey: 'studio.panel.context',
    items: ['brand_input', 'image_upload', 'reference_upload', 'text_input'],
  },
  {
    labelKey: 'studio.panel.automate',
    items: ['export'],
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
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  const filterBySearch = (items: NodeTypeId[]) => {
    if (!search) return items;
    return items.filter(id => {
      const def = NODE_TYPE_DEFS[id];
      return def.label.toLowerCase().includes(search.toLowerCase());
    });
  };

  return (
    <div style={isMobile ? {
      position: 'absolute',
      left: 0, right: 0, bottom: 'calc(66px + env(safe-area-inset-bottom, 0px))', top: 'auto',
      width: '100%', maxHeight: '62vh', minHeight: 220,
      zIndex: 400,
      background: 'hsl(var(--card))',
      borderTop: '1px solid hsl(var(--border))',
      borderTopLeftRadius: 16, borderTopRightRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 -8px 28px rgba(0,0,0,0.18)',
      animation: 'fadeIn 0.15s ease',
    } : {
      position: 'absolute',
      left: 62,
      top: 60,
      bottom: 60,
      width: 260,
      zIndex: 90,
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid hsl(var(--border))',
      }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          {tab === 'nodes' && t('studio.nav.add_node')}
          {tab === 'assets' && t('studio.nav.assets')}
          {tab === 'templates' && t('studio.nav.templates')}
          {tab === 'learn' && t('studio.nav.learn')}
        </span>
        <button
          onClick={onClose}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
            background: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 7,
            padding: '5px 8px',
          }}>
            <Search size={11} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
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
                color: 'hsl(var(--foreground))',
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
                  <div style={{ fontSize: isMobile ? 11 : 9, fontWeight: 700, color: 'hsl(var(--muted-foreground))', letterSpacing: 0.8, padding: '6px 4px 4px' }}>
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
                          gap: isMobile ? 11 : 8,
                          padding: isMobile ? '11px 8px' : '7px 8px',
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
                          width: isMobile ? 34 : 26,
                          height: isMobile ? 34 : 26,
                          borderRadius: 7,
                          background: `${def.color}25`,
                          border: `1px solid ${def.color}40`,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: def.color,
                        }}>
                          <CategoryIcon category={def.category} size={isMobile ? 17 : 12} />
                        </div>
                        <div>
                          <div style={{ fontSize: isMobile ? 15 : 11, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{def.label}</div>
                          {def.aiProvider && (
                            <div style={{ fontSize: isMobile ? 12 : 9, color: 'hsl(var(--muted-foreground))' }}>{def.aiProvider}</div>
                          )}
                        </div>
                        {def.creditCost && (
                          <div style={{ marginLeft: 'auto', fontSize: isMobile ? 13 : 9, color: '#ff713d', fontWeight: 700 }}>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{tpl.name}</span>
                <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{tpl.desc}</span>
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
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  background: 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--muted-foreground))',
                }}>
                  <AssetTypeIcon type={asset.type} size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{asset.name}</div>
                  <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{asset.type} · {asset.size}</div>
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
                  background: 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,113,61,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
