import { useRef } from 'react';
import {
  Building2, ImagePlus, Type, Wand2, Sparkles, Scissors,
  AlignLeft, Palette, Camera, Download, Play, CheckCircle,
  Loader2,
} from 'lucide-react';
import { ExecState, NODE_TYPE_DEFS, NodeTypeId, StudioNode as StudioNodeType } from './types';
import { useI18n } from '@/i18n';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, ImagePlus, Type, Wand2, Sparkles, Scissors,
  AlignLeft, Palette, Camera, Download,
};

const RUN_NODES: NodeTypeId[] = ['prompt_builder', 'scene_gen', 'image_gen'];

interface StudioNodeProps {
  node: StudioNodeType;
  isSelected: boolean;
  execState: ExecState;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onRun: (nodeId: string) => void;
  onDataChange: (nodeId: string, key: string, value: string) => void;
}

function NodeContent({
  node,
  execState,
  onRun,
  onDataChange,
}: {
  node: StudioNodeType;
  execState: ExecState;
  onRun: (id: string) => void;
  onDataChange: (id: string, key: string, value: string) => void;
}) {
  const { t } = useI18n();
  const def = NODE_TYPE_DEFS[node.type];
  const isRunnable = RUN_NODES.includes(node.type);
  const isRunning = execState === 'running';
  const isDone = execState === 'done';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 11,
    color: '#e5e7eb',
    outline: 'none',
    resize: 'none' as const,
  };

  const runBtn = isRunnable && (
    <button
      onClick={e => { e.stopPropagation(); onRun(node.id); }}
      disabled={isRunning}
      style={{
        width: '100%',
        padding: '5px 0',
        borderRadius: 6,
        background: isRunning ? 'rgba(255,255,255,0.05)' : def.color,
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        border: 'none',
        cursor: isRunning ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: isRunning ? 0.6 : 1,
        marginTop: 4,
      }}
    >
      {isRunning ? (
        <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> {t('studio.node.running')}</>
      ) : isDone ? (
        <><CheckCircle size={12} /> {t('studio.node.done')}</>
      ) : (
        <><Play size={12} /> {t('studio.node.run')}</>
      )}
    </button>
  );

  switch (node.type) {
    case 'brand_input':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            style={inputStyle}
            placeholder="Brand name..."
            value={(node.data.brandName as string) ?? ''}
            onChange={e => onDataChange(node.id, 'brandName', e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
          <textarea
            style={{ ...inputStyle, resize: 'none' }}
            rows={2}
            placeholder="Brand description..."
            value={(node.data.description as string) ?? ''}
            onChange={e => onDataChange(node.id, 'description', e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      );
    case 'image_upload':
      return (
        <div style={{ padding: '6px 10px' }}>
          <div style={{
            border: '1.5px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '18px 8px',
            textAlign: 'center',
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}>
            {t('studio.node.upload_hint')}
          </div>
        </div>
      );
    case 'text_input':
      return (
        <div style={{ padding: '6px 10px' }}>
          <textarea
            style={{ ...inputStyle, resize: 'none' }}
            rows={3}
            placeholder={t('studio.node.prompt_placeholder')}
            value={(node.data.text as string) ?? ''}
            onChange={e => onDataChange(node.id, 'text', e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      );
    case 'prompt_builder':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 10,
            color: isDone ? '#e5e7eb' : 'rgba(255,255,255,0.3)',
            minHeight: 52,
            fontFamily: 'monospace',
          }}>
            {isDone
              ? 'A vibrant product photo with warm cinematic lighting, bokeh background, editorial quality...'
              : t('studio.node.output_placeholder')}
          </div>
          <select
            style={{ ...inputStyle, height: 28 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <option value="gemini">Gemini 2.0 Flash</option>
            <option value="gpt4">GPT-4o</option>
          </select>
          {runBtn}
        </div>
      );
    case 'scene_gen':
    case 'image_gen':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            minHeight: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {isDone ? (
              <div style={{
                width: '100%',
                height: 90,
                background: `linear-gradient(135deg, ${def.color}33, ${def.color}11)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: def.color,
              }}>
                ✓ {t('studio.node.generated')}
              </div>
            ) : (
              t('studio.node.preview_placeholder')
            )}
          </div>
          {runBtn}
        </div>
      );
    case 'bg_removal':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <select style={{ ...inputStyle, height: 28 }} onMouseDown={e => e.stopPropagation()}>
            <option value="onnx">ONNX (local)</option>
            <option value="api">API (cloud)</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>Threshold</span>
            <input type="range" min={0} max={100} defaultValue={50} style={{ flex: 1, accentColor: def.color }}
              onMouseDown={e => e.stopPropagation()} />
          </div>
        </div>
      );
    case 'typography':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <input style={inputStyle} placeholder="Headline..." onMouseDown={e => e.stopPropagation()} />
          <input style={inputStyle} placeholder="R$ 49,90" onMouseDown={e => e.stopPropagation()} />
          <input style={inputStyle} placeholder="CTA text..." onMouseDown={e => e.stopPropagation()} />
        </div>
      );
    case 'color_grade':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <select style={{ ...inputStyle, height: 28 }} onMouseDown={e => e.stopPropagation()}>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="vivid">Vivid</option>
            <option value="muted">Muted</option>
          </select>
        </div>
      );
    case 'export':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <select style={{ ...inputStyle, height: 28 }} onMouseDown={e => e.stopPropagation()}>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
          <select style={{ ...inputStyle, height: 28 }} onMouseDown={e => e.stopPropagation()}>
            <option value="1080x1080">1080×1080 (Square)</option>
            <option value="1080x1350">1080×1350 (Feed)</option>
            <option value="1080x1920">1080×1920 (Story)</option>
            <option value="1920x1080">1920×1080 (Banner)</option>
          </select>
        </div>
      );
    default:
      return null;
  }
}

export function StudioNode({
  node,
  isSelected,
  execState,
  onMouseDown,
  onSelect,
  onRun,
  onDataChange,
}: StudioNodeProps) {
  const def = NODE_TYPE_DEFS[node.type];
  const IconComp = ICON_MAP[def.icon] ?? Building2;
  const isRunning = execState === 'running';
  const isDone = execState === 'done';
  const headerRef = useRef<HTMLDivElement>(null);

  const borderColor = isDone
    ? '#10b981'
    : isSelected
    ? def.color
    : 'rgba(255,255,255,0.08)';

  const boxShadow = isRunning
    ? `0 0 16px ${def.color}60, 0 0 32px ${def.color}20`
    : isSelected
    ? `0 0 12px ${def.color}40`
    : '0 4px 12px rgba(0,0,0,0.4)';

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: def.defaultWidth,
        background: '#1a1a1f',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        boxShadow,
        userSelect: 'none',
        zIndex: isSelected ? 20 : 10,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'visible',
      }}
      onClick={() => onSelect(node.id)}
    >
      {/* Input port */}
      <div
        style={{
          position: 'absolute',
          left: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 13,
          height: 13,
          borderRadius: '50%',
          border: `2px solid ${def.color}`,
          background: '#1a1a1f',
          zIndex: 30,
        }}
      />
      {/* Output port */}
      <div
        style={{
          position: 'absolute',
          right: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 13,
          height: 13,
          borderRadius: '50%',
          background: def.color,
          zIndex: 30,
        }}
      />

      {/* Header — drag handle */}
      <div
        ref={headerRef}
        onMouseDown={e => { e.stopPropagation(); onMouseDown(e, node.id); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'grab',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: `${def.color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconComp size={13} style={{ color: def.color }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', flex: 1, letterSpacing: 0.1 }}>
          {def.label}
        </span>
        {def.aiProvider && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: def.aiProvider === 'Gemini' ? '#a78bfa' : '#fb923c',
            background: def.aiProvider === 'Gemini' ? '#7c3aed20' : '#f9731620',
            padding: '1px 5px',
            borderRadius: 4,
            letterSpacing: 0.3,
          }}>
            {def.aiProvider}
          </span>
        )}
        {isDone && <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />}
        {isRunning && <Loader2 size={13} style={{ color: def.color, animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
      </div>

      {/* Body */}
      <NodeContent
        node={node}
        execState={execState}
        onRun={onRun}
        onDataChange={onDataChange}
      />
    </div>
  );
}
