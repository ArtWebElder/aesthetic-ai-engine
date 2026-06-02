import { useState } from 'react';
import {
  Palette, Sparkles, Plus,
  LayoutTemplate, Copy, Scissors, MonitorPlay, SlidersHorizontal, Quote, UserRound, Package,
  ArrowLeft,
} from 'lucide-react';
import { PRESET_FLOWS, type PresetFlow } from './types';
import { FLOW_STYLES } from './flowStyles';
import { useI18n } from '@/i18n';

const ICON_MAP: Record<string, React.ElementType> = {
  Palette,
  Sparkles,
  LayoutTemplate,
  Copy,
  Scissors,
  MonitorPlay,
  SlidersHorizontal,
  Quote,
  UserRound,
  Package,
};

interface FlowSelectorProps {
  onSelectFlow: (flowId: string, styleId?: string) => void;
  onEmptyFlow: () => void;
  initialStyleFlow?: string; // open directly on this flow's styles (e.g. from a dashboard card)
}

const cardBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  padding: '18px 16px',
  borderRadius: 14,
  border: '1.5px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
};

export function FlowSelector({ onSelectFlow, onEmptyFlow, initialStyleFlow }: FlowSelectorProps) {
  const { t, lang } = useI18n();
  // When set, the modal shows the pre-molded STYLES for that flow instead of the flows list.
  const [styleFlow, setStyleFlow] = useState<string | null>(initialStyleFlow ?? null);

  const getName = (flow: PresetFlow) => {
    if (lang === 'en') return flow.nameEn;
    if (lang === 'es') return flow.nameEs;
    return flow.name;
  };

  const getDesc = (flow: PresetFlow) => {
    if (lang === 'en') return flow.descriptionEn;
    if (lang === 'es') return flow.descriptionEs;
    return flow.description;
  };

  const flows = Object.entries(PRESET_FLOWS);
  const styles = styleFlow ? (FLOW_STYLES[styleFlow] ?? []) : [];

  const hoverIn = (el: HTMLElement, color: string) => {
    el.style.borderColor = color;
    el.style.background = `${color}08`;
    el.style.boxShadow = `0 4px 16px ${color}20`;
  };
  const hoverOut = (el: HTMLElement) => {
    el.style.borderColor = 'hsl(var(--border))';
    el.style.background = 'hsl(var(--background))';
    el.style.boxShadow = 'none';
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 20,
        padding: '32px 36px',
        maxWidth: 560,
        width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {styleFlow ? (
          <>
            <button
              onClick={() => setStyleFlow(null)}
              onMouseDown={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--muted-foreground))', fontSize: 12,
                fontFamily: 'inherit', padding: 0, marginBottom: 12,
              }}
            >
              <ArrowLeft size={14} /> {t('studio.flow_selector.back')}
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              {t('studio.flow_selector.choose_style')}
            </h2>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 24 }}>
              {t('studio.flow_selector.choose_style_sub')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectFlow(styleFlow, s.id)}
                  style={cardBase}
                  onMouseEnter={e => hoverIn(e.currentTarget as HTMLElement, s.color)}
                  onMouseLeave={e => hoverOut(e.currentTarget as HTMLElement)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${s.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.color,
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.3 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 3, lineHeight: 1.4 }}>
                      {s.vibe}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              {t('studio.flow_selector.title')}
            </h2>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 24 }}>
              {t('studio.flow_selector.subtitle')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {flows.map(([id, flow]) => {
                const IconComp = ICON_MAP[flow.icon] || Sparkles;
                const hasStyles = (FLOW_STYLES[id]?.length ?? 0) > 0;
                return (
                  <button
                    key={id}
                    onClick={() => (hasStyles ? setStyleFlow(id) : onSelectFlow(id))}
                    style={cardBase}
                    onMouseEnter={e => hoverIn(e.currentTarget as HTMLElement, flow.color)}
                    onMouseLeave={e => hoverOut(e.currentTarget as HTMLElement)}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${flow.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: flow.color,
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.3 }}>
                        {getName(flow)}
                      </div>
                      <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 3, lineHeight: 1.4 }}>
                        {getDesc(flow)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: flow.color,
                      background: `${flow.color}12`,
                      padding: '2px 8px',
                      borderRadius: 6,
                      marginTop: 'auto',
                    }}>
                      {hasStyles ? `${FLOW_STYLES[id].length} ${t('studio.flow_selector.styles_chip')}` : `${flow.credits} cr`}
                    </div>
                  </button>
                );
              })}

              {/* Empty flow option */}
              <button
                onClick={onEmptyFlow}
                style={{ ...cardBase, border: '1.5px dashed hsl(var(--border))', background: 'transparent' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#ff713d';
                  (e.currentTarget as HTMLElement).style.background = '#ff713d08';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'hsl(var(--muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--muted-foreground))',
                }}>
                  <Plus size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.3 }}>
                    {t('studio.flow_selector.empty')}
                  </div>
                  <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 3, lineHeight: 1.4 }}>
                    {t('studio.flow_selector.empty_desc')}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: 'hsl(var(--muted-foreground))',
                  background: 'hsl(var(--muted))',
                  padding: '2px 8px',
                  borderRadius: 6,
                  marginTop: 'auto',
                }}>
                  0 cr
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
