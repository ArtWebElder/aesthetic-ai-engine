import { X, Download, Upload, Sparkles, Settings } from 'lucide-react';
import { ExecState, NODE_TYPE_DEFS, StudioNode } from './types';
import { useI18n } from '@/i18n';
import { StudioSelect } from './StudioSelect';

function CategoryIcon({ category, size = 11 }: { category: string; size?: number }) {
  const s = { width: size, height: size };
  if (category === 'input') return <Download style={s} />;
  if (category === 'ai') return <Sparkles style={s} />;
  if (category === 'output') return <Upload style={s} />;
  return <Settings style={s} />;
}

interface StudioPropertiesProps {
  node: StudioNode | null;
  execState: ExecState;
  onClose: () => void;
  onDataChange: (nodeId: string, key: string, value: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 7,
  padding: '6px 9px',
  fontSize: 11,
  color: 'hsl(var(--foreground))',
  outline: 'none',
  boxSizing: 'border-box',
};


const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'hsl(var(--muted-foreground))',
  marginBottom: 4,
  letterSpacing: 0.5,
};

export function StudioProperties({ node, execState, onClose, onDataChange }: StudioPropertiesProps) {
  const { t } = useI18n();

  if (!node) return null;

  const def = NODE_TYPE_DEFS[node.type];

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 224,
      zIndex: 90,
      background: 'hsl(var(--card))',
      borderLeft: '1px solid hsl(var(--border))',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid hsl(var(--border))',
      }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: `${def.color}25`,
          border: `1px solid ${def.color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: def.color,
        }}>
          <CategoryIcon category={def.category} size={11} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {def.label}
          </div>
          <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>{def.category}</div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Status badge */}
      {execState !== 'idle' && (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: execState === 'done' ? 'rgba(16,185,129,0.15)' : execState === 'running' ? `${def.color}20` : 'rgba(239,68,68,0.15)',
            fontSize: 10,
            fontWeight: 600,
            color: execState === 'done' ? '#10b981' : execState === 'running' ? def.color : '#ef4444',
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
              animation: execState === 'running' ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            {execState === 'done' ? t('studio.node.done') : execState === 'running' ? t('studio.node.running') : 'Error'}
          </div>
        </div>
      )}

      {/* Properties */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Common: position */}
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>{t('studio.props.position')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', marginBottom: 2 }}>X</div>
              <input
                style={inputStyle}
                value={Math.round(node.x)}
                readOnly
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', marginBottom: 2 }}>Y</div>
              <input
                style={inputStyle}
                value={Math.round(node.y)}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Type-specific properties */}
        {node.type === 'brand_input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.brand_name')}</div>
              <input
                style={inputStyle}
                placeholder="Acme Corp"
                value={(node.data.brandName as string) ?? ''}
                onChange={e => onDataChange(node.id, 'brandName', e.target.value)}
              />
            </div>
            <div>
              <div style={labelStyle}>{t('studio.props.brand_desc')}</div>
              <textarea
                style={{ ...inputStyle, resize: 'none' }}
                rows={3}
                placeholder="Brand voice and values..."
                value={(node.data.description as string) ?? ''}
                onChange={e => onDataChange(node.id, 'description', e.target.value)}
              />
            </div>
          </div>
        )}

        {node.type === 'bg_removal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.method')}</div>
              <StudioSelect
                defaultValue="onnx"
                options={[
                  { value: 'onnx', label: 'ONNX (local)' },
                  { value: 'api', label: 'API (cloud)' },
                ]}
              />
            </div>
            <div>
              <div style={labelStyle}>{t('studio.props.threshold')}</div>
              <input type="range" min={0} max={100} defaultValue={50} style={{ width: '100%', accentColor: def.color }} />
            </div>
          </div>
        )}

        {node.type === 'color_grade' && (
          <div>
            <div style={labelStyle}>{t('studio.props.preset')}</div>
            <StudioSelect
              defaultValue="warm"
              options={[
                { value: 'warm', label: 'Warm' },
                { value: 'cold', label: 'Cold' },
                { value: 'vivid', label: 'Vivid' },
                { value: 'muted', label: 'Muted' },
              ]}
            />
          </div>
        )}

        {node.type === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.format')}</div>
              <StudioSelect
                defaultValue="png"
                options={[
                  { value: 'png', label: 'PNG' },
                  { value: 'jpg', label: 'JPG' },
                  { value: 'webp', label: 'WebP' },
                ]}
              />
            </div>
            <div>
              <div style={labelStyle}>{t('studio.props.dimension')}</div>
              <StudioSelect
                defaultValue="1080x1080"
                options={[
                  { value: '1080x1080', label: '1080×1080 (Square)' },
                  { value: '1080x1350', label: '1080×1350 (Feed)' },
                  { value: '1080x1920', label: '1080×1920 (Story)' },
                  { value: '1920x1080', label: '1920×1080 (Banner)' },
                ]}
              />
            </div>
          </div>
        )}

        {(node.type === 'scene_gen' || node.type === 'image_gen' || node.type === 'prompt_builder') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.model')}</div>
              <StudioSelect
                defaultValue="gemini"
                options={[
                  { value: 'gemini', label: 'Gemini 2.0 Flash' },
                  { value: 'replicate', label: 'Replicate FLUX' },
                ]}
              />
            </div>
            {def.creditCost && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',
                borderRadius: 7,
                background: 'rgba(255,113,61,0.1)',
                border: '1px solid rgba(255,113,61,0.2)',
              }}>
                <Sparkles style={{ width: 14, height: 14, color: '#ff713d' }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ff713d' }}>{def.creditCost} {t('studio.props.credits')}</div>
                  <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>{t('studio.props.per_run')}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
