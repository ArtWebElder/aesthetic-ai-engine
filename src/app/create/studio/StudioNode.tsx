import { useRef, useState } from 'react';
import {
  Building2, ImagePlus, Type, Wand2, Sparkles, Scissors,
  AlignLeft, Palette, Camera, Download, Play, CheckCircle,
  Loader2, ScanEye, FileText, AlertCircle, Trash2,
  Image, Layers, LayoutTemplate,
} from 'lucide-react';
import { ExecState, NODE_TYPE_DEFS, NodeTypeId, StudioNode as StudioNodeType } from './types';
import { useI18n } from '@/i18n';
import { StudioSelect } from './StudioSelect';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, ImagePlus, Type, Wand2, Sparkles, Scissors,
  AlignLeft, Palette, Camera, Download, ScanEye, FileText,
  Image, Layers, LayoutTemplate,
};

/** Trigger browser download — handles both base64 data URIs and remote URLs */
async function triggerDownload(src: string, format: string) {
  let blobUrl: string | null = null;
  try {
    let blob: Blob;
    if (src.startsWith('data:')) {
      // Convert base64 data URI → blob
      const res = await fetch(src);
      blob = await res.blob();
    } else {
      // Remote URL — fetch as blob to bypass CORS navigation issues
      const res = await fetch(src);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      blob = await res.blob();
    }
    blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `creatyng-asset.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('[StudioNode] Download failed, falling back to window.open:', err);
    window.open(src, '_blank');
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }
}

const RUN_NODES: NodeTypeId[] = [
  'prompt_builder', 'scene_gen', 'image_gen',
  'reference_analyzer', 'bg_removal', 'export',
  'background_gen', 'compositor', 'text_overlay',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeOutput = any;

interface StudioNodeProps {
  node: StudioNodeType;
  isSelected: boolean;
  execState: ExecState;
  output?: NodeOutput;
  isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onRun: (nodeId: string) => void;
  onDataChange: (nodeId: string, key: string, value: string) => void;
  onDelete?: (nodeId: string) => void;
  onOutputPortDown: (e: React.MouseEvent, nodeId: string) => void;
  onInputPortUp: (nodeId: string) => void;
}

// ── Output Preview ──────────────────────────────────────────────────────────

function OutputPreview({ output }: { output?: NodeOutput }) {
  if (!output) return null;

  const imgSrc = output.image || output.generatedImage || output.finalImage;
  if (imgSrc && typeof imgSrc === 'string' && (imgSrc.startsWith('data:') || imgSrc.startsWith('http'))) {
    return (
      <div style={{ margin: '4px 10px 6px', borderRadius: 8, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
        <img src={imgSrc} alt="output" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
      </div>
    );
  }

  if (output.prompt && typeof output.prompt === 'string') {
    return (
      <div style={{
        margin: '4px 10px 6px', padding: '6px 8px', borderRadius: 6,
        background: 'hsl(var(--muted))', fontSize: 10, fontFamily: 'monospace',
        color: 'hsl(var(--foreground))', lineHeight: 1.4,
        maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {output.prompt.slice(0, 150)}{output.prompt.length > 150 ? '...' : ''}
      </div>
    );
  }

  if (output.analysis) {
    const a = output.analysis;
    return (
      <div style={{
        margin: '4px 10px 6px', padding: '6px 8px', borderRadius: 6,
        background: '#06B6D410', fontSize: 10,
        color: '#06B6D4', lineHeight: 1.4,
      }}>
        ✓ {a.style?.mood || 'analyzed'} · {a.layout?.productPosition || '?'} · {a.style?.lighting || '?'}
      </div>
    );
  }

  if (output.type === 'export') {
    const exportImg = output.image || output.finalImage;
    const fmt = (output.format || 'png') as string;
    return (
      <div style={{ margin: '4px 10px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {exportImg && typeof exportImg === 'string' && (
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
            <img src={exportImg} alt="export preview" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
          </div>
        )}
        {exportImg && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerDownload(exportImg, fmt);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8,
              background: '#10B981', color: '#fff', fontSize: 13,
              fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              letterSpacing: 0.3,
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
          >
            <Download size={16} /> Download {fmt.toUpperCase()}
          </button>
        )}
        {!exportImg && (
          <div style={{
            padding: '6px 8px', borderRadius: 6,
            background: '#10b98115', fontSize: 10, color: '#10b981',
          }}>
            ✓ Pronto ({fmt})
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── Image Upload Zone (shared between image_upload and reference_upload) ──

function ImageUploadZone({
  node, onDataChange, label,
}: {
  node: StudioNodeType;
  onDataChange: (id: string, key: string, value: string) => void;
  label: string;
}) {
  const hasImage = Boolean(node.data.imageBase64);
  const inputId = `upload-${node.id}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string) ?? '';
      onDataChange(node.id, 'imageBase64', base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ padding: '6px 10px' }} onMouseDown={e => e.stopPropagation()}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id={inputId}
      />
      <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'block' }}>
        {hasImage ? (
          <img
            src={node.data.imageBase64 as string}
            alt="uploaded"
            style={{
              width: '100%', height: 90, objectFit: 'cover',
              borderRadius: 8, border: '1px solid hsl(var(--border))',
            }}
          />
        ) : (
          <div style={{
            border: '1.5px dashed hsl(var(--border))',
            borderRadius: 8, padding: '18px 8px', textAlign: 'center',
            fontSize: 10, color: 'hsl(var(--muted-foreground))',
          }}>
            {label}
          </div>
        )}
      </label>
    </div>
  );
}

// ── Node Content ────────────────────────────────────────────────────────────

function NodeContent({
  node, execState, output, onRun, onDataChange,
}: {
  node: StudioNodeType;
  execState: ExecState;
  output?: NodeOutput;
  onRun: (id: string) => void;
  onDataChange: (id: string, key: string, value: string) => void;
}) {
  const { t } = useI18n();
  const def = NODE_TYPE_DEFS[node.type];
  const isRunnable = RUN_NODES.includes(node.type);
  const isRunning = execState === 'running';
  const isDone = execState === 'done';
  const isError = execState === 'error';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'hsl(var(--muted))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 6, padding: '5px 8px',
    fontSize: 11, color: 'hsl(var(--foreground))',
    outline: 'none', resize: 'none' as const,
  };

  const runBtn = isRunnable && (
    <button
      onClick={e => { e.stopPropagation(); onRun(node.id); }}
      disabled={isRunning}
      style={{
        width: '100%', padding: '5px 0', borderRadius: 6,
        background: isError ? '#EF4444' : isRunning ? 'hsl(var(--muted))' : def.color,
        color: '#fff', fontSize: 11, fontWeight: 600,
        border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 4, opacity: isRunning ? 0.6 : 1, marginTop: 4,
      }}
    >
      {isRunning ? (
        <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> {t('studio.node.running')}</>
      ) : isError ? (
        <><AlertCircle size={12} /> Retry</>
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
      return <ImageUploadZone node={node} onDataChange={onDataChange} label={t('studio.node.upload_hint')} />;

    case 'reference_upload':
      return <ImageUploadZone node={node} onDataChange={onDataChange} label="Clique para subir referência" />;

    case 'text_input': {
      const hasFields = node.data.fields !== undefined;
      if (hasFields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fields = node.data.fields as any;
        // Banner mode — multiple text fields stored as individual data keys
        return (
          <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <input
              style={{ ...inputStyle, fontSize: 13, fontWeight: 600 }}
              placeholder={t('studio.node.field_headline')}
              value={fields?.headline ?? ''}
              onChange={e => onDataChange(node.id, 'field_headline', e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
            <input
              style={inputStyle}
              placeholder={t('studio.node.field_price')}
              value={fields?.price ?? ''}
              onChange={e => onDataChange(node.id, 'field_price', e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
            <input
              style={inputStyle}
              placeholder={t('studio.node.field_cta')}
              value={fields?.cta ?? ''}
              onChange={e => onDataChange(node.id, 'field_cta', e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
            <input
              style={inputStyle}
              placeholder={t('studio.node.field_contact')}
              value={fields?.contact ?? ''}
              onChange={e => onDataChange(node.id, 'field_contact', e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
        );
      }
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
    }

    case 'reference_analyzer':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 6,
            padding: '6px 8px', fontSize: 10, minHeight: 40,
            color: isDone ? '#06B6D4' : 'hsl(var(--muted-foreground))',
          }}>
            {isDone && output?.analysis
              ? `✓ ${output.analysis.style?.mood} · ${output.analysis.layout?.productPosition} · ${output.analysis.style?.lighting}`
              : 'Conecte referência + subject → Run'}
          </div>
          {runBtn}
          <OutputPreview output={output} />
        </div>
      );

    case 'prompt_builder':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            style={{ ...inputStyle, resize: 'none', fontFamily: 'monospace', fontSize: 10 }}
            rows={2}
            placeholder="Custom prompt (optional)..."
            value={(node.data.customPrompt as string) ?? ''}
            onChange={e => onDataChange(node.id, 'customPrompt', e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
          <OutputPreview output={output} />
          {runBtn}
        </div>
      );

    case 'scene_gen':
    case 'image_gen': {
      const previewImg = output?.image || output?.generatedImage;
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 6,
            fontSize: 10, color: 'hsl(var(--muted-foreground))',
            minHeight: 90, display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {previewImg && typeof previewImg === 'string' && (previewImg.startsWith('data:') || previewImg.startsWith('http')) ? (
              <img src={previewImg} alt="generated" style={{ width: '100%', height: 90, objectFit: 'cover' }} />
            ) : isDone ? (
              <div style={{
                width: '100%', height: 90,
                background: `linear-gradient(135deg, ${def.color}33, ${def.color}11)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: def.color,
              }}>
                ✓ {t('studio.node.generated')}
              </div>
            ) : (
              t('studio.node.preview_placeholder')
            )}
          </div>
          {output?.provider && (
            <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', textAlign: 'right' }}>
              via {output.provider}
            </div>
          )}
          {runBtn}
        </div>
      );
    }

    case 'bg_removal':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StudioSelect
            defaultValue="api"
            options={[
              { value: 'api', label: 'API (cloud)' },
              { value: 'onnx', label: 'ONNX (local)' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          <OutputPreview output={output} />
          {runBtn}
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
          <StudioSelect
            defaultValue="warm"
            options={[
              { value: 'warm', label: 'Warm' },
              { value: 'cold', label: 'Cold' },
              { value: 'vivid', label: 'Vivid' },
              { value: 'muted', label: 'Muted' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      );

    case 'background_gen': {
      const bgPreview = output?.image || output?.backgroundImage;
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 6,
            fontSize: 10, color: 'hsl(var(--muted-foreground))',
            minHeight: 80, display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {bgPreview && typeof bgPreview === 'string' ? (
              <img src={bgPreview} alt="background" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
            ) : (
              t('studio.node.bg_placeholder')
            )}
          </div>
          <StudioSelect
            defaultValue="1080x1080"
            options={[
              { value: '1080x1080', label: '1080×1080' },
              { value: '1080x1920', label: '1080×1920' },
              { value: '1920x1080', label: '1920×1080' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          {runBtn}
        </div>
      );
    }

    case 'compositor': {
      const composedPreview = output?.image;
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 6,
            fontSize: 10, color: 'hsl(var(--muted-foreground))',
            minHeight: 80, display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {composedPreview && typeof composedPreview === 'string' ? (
              <img src={composedPreview} alt="composed" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
            ) : (
              t('studio.node.compose_placeholder')
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onMouseDown={e => e.stopPropagation()}>
            <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
              {t('studio.node.scale')}
            </span>
            <input
              type="range" min="30" max="100" step="5"
              value={Math.round(((node.data.subjectScale as number) || 0.65) * 100)}
              onChange={e => onDataChange(node.id, 'subjectScale', String(Number(e.target.value) / 100))}
              style={{ flex: 1, accentColor: '#F59E0B' }}
            />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--foreground))', minWidth: 28 }}>
              {Math.round(((node.data.subjectScale as number) || 0.65) * 100)}%
            </span>
          </div>
          <StudioSelect
            defaultValue="center"
            options={[
              { value: 'center', label: 'Center' },
              { value: 'bottom-center', label: 'Bottom' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          {runBtn}
        </div>
      );
    }

    case 'text_overlay': {
      const overlayPreview = output?.image;
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            background: 'hsl(var(--muted))', borderRadius: 6,
            fontSize: 10, color: 'hsl(var(--muted-foreground))',
            minHeight: 80, display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {overlayPreview && typeof overlayPreview === 'string' ? (
              <img src={overlayPreview} alt="overlay" style={{ width: '100%', height: 80, objectFit: 'cover' }} />
            ) : (
              t('studio.node.overlay_placeholder')
            )}
          </div>
          <StudioSelect
            defaultValue="auto"
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
              { value: 'center', label: 'Center' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          {runBtn}
        </div>
      );
    }

    case 'export':
      return (
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StudioSelect
            defaultValue="png"
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpg', label: 'JPG' },
              { value: 'webp', label: 'WebP' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          <StudioSelect
            defaultValue="1080x1080"
            options={[
              { value: '1080x1080', label: '1080×1080 (Square)' },
              { value: '1080x1350', label: '1080×1350 (Feed)' },
              { value: '1080x1920', label: '1080×1920 (Story)' },
              { value: '1920x1080', label: '1920×1080 (Banner)' },
            ]}
            onMouseDown={e => e.stopPropagation()}
          />
          <OutputPreview output={output} />
          {runBtn}
        </div>
      );

    default:
      return null;
  }
}

// ── Main Node Component ─────────────────────────────────────────────────────

export function StudioNode({
  node, isSelected, execState, output, isConnecting,
  onMouseDown, onSelect, onRun, onDataChange, onDelete,
  onOutputPortDown, onInputPortUp,
}: StudioNodeProps) {
  const def = NODE_TYPE_DEFS[node.type];
  const IconComp = ICON_MAP[def.icon] ?? Building2;
  const isRunning = execState === 'running';
  const isDone = execState === 'done';
  const isError = execState === 'error';
  const headerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const borderColor = isError
    ? '#EF4444'
    : isDone
    ? '#10b981'
    : isSelected
    ? def.color
    : 'hsl(var(--border))';

  const boxShadow = isRunning
    ? `0 0 16px ${def.color}60, 0 0 32px ${def.color}20`
    : isSelected
    ? `0 0 12px ${def.color}40`
    : '0 2px 8px rgba(0,0,0,0.1)';

  return (
    <div
      style={{
        position: 'absolute', left: node.x, top: node.y,
        width: def.defaultWidth,
        background: 'hsl(var(--card))',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10, boxShadow,
        userSelect: 'none',
        zIndex: isSelected ? 20 : 10,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'visible',
      }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input port — interactive: receives connections when dragging */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={() => onInputPortUp(node.id)}
        style={{
          position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
          width: 13, height: 13, borderRadius: '50%',
          border: `2px solid ${def.color}`, background: 'hsl(var(--card))', zIndex: 30,
          cursor: isConnecting ? 'crosshair' : 'default',
          transition: 'transform 0.1s, box-shadow 0.1s',
          ...(isConnecting ? { boxShadow: `0 0 8px ${def.color}80`, transform: 'translateY(-50%) scale(1.3)' } : {}),
        }}
      />
      {/* Output port — interactive: starts connection drag */}
      <div
        onMouseDown={(e) => { e.stopPropagation(); onOutputPortDown(e, node.id); }}
        style={{
          position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)',
          width: 13, height: 13, borderRadius: '50%',
          background: def.color, zIndex: 30,
          cursor: 'crosshair',
          transition: 'transform 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.3)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%)'; }}
      />

      {/* Header — drag handle */}
      <div
        ref={headerRef}
        onMouseDown={e => { e.stopPropagation(); onMouseDown(e, node.id); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 10px',
          borderBottom: '1px solid hsl(var(--border))',
          cursor: 'grab', borderRadius: '8px 8px 0 0',
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: `${def.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconComp size={13} style={{ color: def.color }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', flex: 1, letterSpacing: 0.1 }}>
          {def.label}
        </span>
        {def.aiProvider && (
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: def.aiProvider.includes('Gemini') ? '#7c3aed' : '#ea6e0b',
            background: def.aiProvider.includes('Gemini') ? '#7c3aed18' : '#f9731618',
            padding: '1px 5px', borderRadius: 4, letterSpacing: 0.3,
          }}>
            {def.aiProvider}
          </span>
        )}
        {def.creditCost && (
          <span style={{
            fontSize: 9, fontWeight: 600, color: '#ff713d',
            background: '#ff713d15', padding: '1px 5px', borderRadius: 4,
          }}>
            {def.creditCost}cr
          </span>
        )}
        {isError && <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />}
        {isDone && !isError && <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />}
        {isRunning && <Loader2 size={13} style={{ color: def.color, animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 5,
              border: 'none', background: 'transparent',
              cursor: 'pointer', flexShrink: 0, padding: 0,
              opacity: isHovered || isSelected ? 0.5 : 0,
              transition: 'opacity 0.15s, background 0.1s',
              color: '#EF4444',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = '#EF444418'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = isHovered || isSelected ? '0.5' : '0'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            title="Delete node"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Body */}
      <NodeContent
        node={node}
        execState={execState}
        output={output}
        onRun={onRun}
        onDataChange={onDataChange}
      />
    </div>
  );
}
