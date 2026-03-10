import { X } from 'lucide-react';
import { ExecState, NODE_TYPE_DEFS, StudioNode } from './types';
import { useI18n } from '@/i18n';

interface StudioPropertiesProps {
  node: StudioNode | null;
  execState: ExecState;
  onClose: () => void;
  onDataChange: (nodeId: string, key: string, value: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  padding: '6px 9px',
  fontSize: 11,
  color: '#e5e7eb',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 4,
  letterSpacing: 0.5,
};

export function StudioProperties({ node, execState, onClose, onDataChange }: StudioPropertiesProps) {
  const { t } = useI18n();

  if (!node) return null;

  const def = NODE_TYPE_DEFS[node.type];

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 48,
      bottom: 0,
      width: 224,
      zIndex: 90,
      background: '#1a1a1f',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
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
        borderBottom: '1px solid rgba(255,255,255,0.08)',
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
          fontSize: 11,
          flexShrink: 0,
        }}>
          {def.category === 'input' ? '📥' : def.category === 'ai' ? '✨' : def.category === 'output' ? '📤' : '⚙️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {def.label}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{def.category}</div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Status badge */}
      {execState !== 'idle' && (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>X</div>
              <input
                style={inputStyle}
                value={Math.round(node.x)}
                readOnly
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Y</div>
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
              <select style={{ ...inputStyle, height: 30 }}>
                <option value="onnx">ONNX (local)</option>
                <option value="api">API (cloud)</option>
              </select>
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
            <select style={{ ...inputStyle, height: 30 }}>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="vivid">Vivid</option>
              <option value="muted">Muted</option>
            </select>
          </div>
        )}

        {node.type === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.format')}</div>
              <select style={{ ...inputStyle, height: 30 }}>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>{t('studio.props.dimension')}</div>
              <select style={{ ...inputStyle, height: 30 }}>
                <option value="1080x1080">1080×1080 (Square)</option>
                <option value="1080x1350">1080×1350 (Feed)</option>
                <option value="1080x1920">1080×1920 (Story)</option>
                <option value="1920x1080">1920×1080 (Banner)</option>
              </select>
            </div>
          </div>
        )}

        {(node.type === 'scene_gen' || node.type === 'image_gen' || node.type === 'prompt_builder') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={labelStyle}>{t('studio.props.model')}</div>
              <select style={{ ...inputStyle, height: 30 }}>
                <option value="gemini">Gemini 2.0 Flash</option>
                <option value="replicate">Replicate FLUX</option>
              </select>
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
                <span style={{ fontSize: 14 }}>✨</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ff713d' }}>{def.creditCost} {t('studio.props.credits')}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{t('studio.props.per_run')}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
