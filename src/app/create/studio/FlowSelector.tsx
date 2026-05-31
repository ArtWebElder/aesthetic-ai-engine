import {
  Palette, Sparkles, Plus,
  LayoutTemplate, Copy, Scissors, MonitorPlay, SlidersHorizontal, Quote,
} from 'lucide-react';
import { PRESET_FLOWS, type PresetFlow } from './types';
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
};

interface FlowSelectorProps {
  onSelectFlow: (flowId: string) => void;
  onEmptyFlow: () => void;
}

export function FlowSelector({ onSelectFlow, onEmptyFlow }: FlowSelectorProps) {
  const { t, lang } = useI18n();

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
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'hsl(var(--foreground))',
          marginBottom: 4,
        }}>
          {t('studio.flow_selector.title')}
        </h2>
        <p style={{
          fontSize: 12,
          color: 'hsl(var(--muted-foreground))',
          marginBottom: 24,
        }}>
          {t('studio.flow_selector.subtitle')}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
        }}>
          {flows.map(([id, flow]) => {
            const IconComp = ICON_MAP[flow.icon] || Sparkles;
            return (
              <button
                key={id}
                onClick={() => onSelectFlow(id)}
                style={{
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
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = flow.color;
                  (e.currentTarget as HTMLElement).style.background = `${flow.color}08`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${flow.color}20`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
                  (e.currentTarget as HTMLElement).style.background = 'hsl(var(--background))';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
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
                  {flow.credits} cr
                </div>
              </button>
            );
          })}

          {/* Empty flow option */}
          <button
            onClick={onEmptyFlow}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 8,
              padding: '18px 16px',
              borderRadius: 14,
              border: '1.5px dashed hsl(var(--border))',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
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
      </div>
    </div>
  );
}
