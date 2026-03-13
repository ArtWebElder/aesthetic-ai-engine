import { MousePointer, Hand, Minus, Plus } from 'lucide-react';
import { ToolMode } from './types';
import { useI18n } from '@/i18n';

const ZOOM_MIN = 30;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

interface StudioToolbarProps {
  toolMode: ToolMode;
  zoom: number;
  onToolChange: (mode: ToolMode) => void;
  onZoomChange: (z: number) => void;
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 7,
  background: active ? 'rgba(255,113,61,0.12)' : 'transparent',
  color: active ? '#ff713d' : 'hsl(var(--muted-foreground))',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export function StudioToolbar({ toolMode, zoom, onToolChange, onZoomChange }: StudioToolbarProps) {
  const { t } = useI18n();

  const zoomIn = () => onZoomChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP));
  const zoomOut = () => onZoomChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP));

  return (
    <div style={{
      position: 'absolute',
      bottom: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 12,
      padding: '4px 8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {/* Tool toggle */}
      <button
        style={btnStyle(toolMode === 'cursor')}
        onClick={() => onToolChange('cursor')}
        title={t('studio.toolbar.cursor')}
      >
        <MousePointer size={14} />
      </button>
      <button
        style={btnStyle(toolMode === 'hand')}
        onClick={() => onToolChange('hand')}
        title={t('studio.toolbar.hand')}
      >
        <Hand size={14} />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'hsl(var(--border))', margin: '0 4px' }} />

      {/* Zoom */}
      <button style={btnStyle(false)} onClick={zoomOut}>
        <Minus size={13} />
      </button>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'hsl(var(--foreground))',
        minWidth: 38,
        textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {zoom}%
      </span>
      <button style={btnStyle(false)} onClick={zoomIn}>
        <Plus size={13} />
      </button>
    </div>
  );
}
