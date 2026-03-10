import type {
  CreatygnComposition,
  CompositionLayer,
  HeadlineSegment,
  ContactItem,
} from '@/types/composition';
import { segmentHeadline } from './textRenderer';
import { extractDecorativeWord, chooseDecorativeConfig } from './exportComposed';
import { chooseBadgeVariant, chooseContactVariant } from './textRenderer';

export interface CompositionPalette {
  accent: string;
  accentLight: string;
  badgeBg: string;
  badgeText: string;
  ctaBg: string;
  ctaText: string;
}

export interface CompositionInput {
  // Images
  sceneBase64?: string;       // Gemini scene (Food/Pop)
  bgBase64?: string;          // Gemini background (Pop Design)
  subjectBase64?: string;     // Subject isolado (Pop Design)

  // Texts
  headline: string;
  subheadline?: string;
  cta?: string;
  price?: { value: string; prefix: string; suffix: string } | null;
  whatsapp?: string;
  instagram?: string;

  // Style
  preset: string;
  palette: CompositionPalette;
  fontFamily?: string;        // override de fonte
  headlineSizeFactor?: number; // override de tamanho
}

export function buildComposition(input: CompositionInput): CreatygnComposition {
  const {
    sceneBase64, bgBase64, subjectBase64,
    headline, subheadline, cta, price, whatsapp, instagram,
    preset, palette, fontFamily, headlineSizeFactor = 1.0,
  } = input;

  const isPopDesign = preset === 'sys-img-pop-design';
  const isFoodPop = !isPopDesign;
  const font = fontFamily || 'Montserrat';

  const layers: CompositionLayer[] = [];
  let zIndex = 0;

  // ===== CAMADA: BACKGROUND =====
  if (isPopDesign && bgBase64) {
    layers.push({
      type: 'background',
      source: { type: 'image', base64: bgBase64, fit: 'cover' },
    });
  } else if (isPopDesign) {
    layers.push({
      type: 'background',
      source: {
        type: 'gradient',
        css: `linear-gradient(160deg, ${lighten(palette.accent, 0.65)}, ${lighten(palette.accent, 0.75)})`,
      },
    });
  } else if (sceneBase64) {
    layers.push({
      type: 'background',
      source: { type: 'image', base64: sceneBase64, fit: 'cover' },
    });
  } else {
    // Food/Pop fallback gradient when no sceneBase64 is provided
    layers.push({
      type: 'background',
      source: {
        type: 'gradient',
        css: `linear-gradient(160deg, ${lighten(palette.accent, 0.15)}, #0f0f1a)`,
      },
    });
  }

  // ===== CAMADA: GRADIENT OVERLAY (Food/Pop only) =====
  if (isFoodPop) {
    layers.push({
      type: 'gradient-overlay',
      css: `linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 30%, transparent 50%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.82) 100%)`,
      zIndex: ++zIndex,
    });
  }

  // ===== CAMADA: TEXTO DECORATIVO =====
  if (headline) {
    const word = extractDecorativeWord(headline);
    const decoConfig = chooseDecorativeConfig(headline);

    layers.push({
      type: 'decorative-text',
      text: word,
      style: {
        fontFamily: font,
        fontWeight: 900,
        fontSize: `${130 * headlineSizeFactor}vw`,
        fontStyle: 'normal',
        color: isPopDesign ? palette.accent : '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
        lineHeight: '1',
        textAlign: 'center',
        opacity: isPopDesign ? 0.18 : decoConfig.opacity,
        transform: decoConfig.rotation ? `rotate(${decoConfig.rotation}deg)` : undefined,
      },
      position: { x: '50%', y: '50%', anchor: 'center' },
      repeat: { count: 2, offsetY: '75%', opacityDecay: 0.5 },
      zIndex: ++zIndex,
    });
  }

  // ===== CAMADA: SUBJECT (Pop Design) =====
  if (isPopDesign && subjectBase64) {
    layers.push({
      type: 'image',
      id: 'subject',
      base64: subjectBase64,
      position: { x: '50%', y: '52%', anchor: 'center' },
      size: {
        width: '75%',
        height: 'auto',
        maxWidth: '75%',
        maxHeight: '65%',
        objectFit: 'contain',
      },
      effects: {
        dropShadow: '0 15px 40px rgba(0,0,0,0.2)',
      },
      zIndex: ++zIndex,
    });
  }

  // ===== CAMADA: HEADLINE =====
  if (headline) {
    const segments = segmentHeadline(headline);
    const bgIsDark = isFoodPop || (isPopDesign && Boolean(bgBase64));

    const headlineSegments: HeadlineSegment[] = segments.map(seg => {
      const baseFontSize = seg.isAccent ? 14 : 6;
      const adjustedSize = baseFontSize * headlineSizeFactor;

      return {
        text: seg.text,
        role: seg.isAccent ? 'impact' as const : 'context' as const,
        style: {
          fontFamily: font,
          fontWeight: seg.weight,
          fontSize: `${adjustedSize}vw`,
          fontStyle: (seg.isAccent && isFoodPop) ? 'italic' as const : 'normal' as const,
          color: bgIsDark
            ? (seg.isAccent ? '#FFFFFF' : 'rgba(255,255,255,0.88)')
            : (seg.isAccent ? palette.accent : '#2D2D2D'),
          textTransform: 'uppercase' as const,
          letterSpacing: seg.isAccent ? '-0.02em' : '0.02em',
          lineHeight: seg.isAccent ? '0.85' : '1.05',
          textAlign: 'center' as const,
          textShadow: bgIsDark
            ? '0 2px 15px rgba(0,0,0,0.3), 0 4px 30px rgba(0,0,0,0.15)'
            : 'none',
        },
      };
    });

    layers.push({
      type: 'headline',
      segments: headlineSegments,
      position: {
        x: '50%',
        y: isFoodPop ? '5%' : '4%',
        anchor: 'top-center',
      },
      gap: '2px',
      zIndex: zIndex + 10,
    });
  }

  // ===== CAMADA: SUBHEADLINE =====
  if (subheadline) {
    const bgIsDark = isFoodPop || (isPopDesign && Boolean(bgBase64));

    layers.push({
      type: 'subheadline',
      text: subheadline,
      style: {
        fontFamily: font,
        fontWeight: 400,
        fontSize: `${2.8 * headlineSizeFactor}vw`,
        fontStyle: 'normal',
        color: bgIsDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)',
        textTransform: 'none',
        letterSpacing: '0.02em',
        lineHeight: '1.3',
        textAlign: 'center',
      },
      position: { x: '50%', y: 'auto', anchor: 'top-center' },
      zIndex: zIndex + 11,
    });
  }

  // ===== CAMADA: BADGE =====
  if (price?.value) {
    const badgeVariant = chooseBadgeVariant(headline || '', price.value);
    const variantMap: Record<string, 'card' | 'pill' | 'minimal' | 'split'> = {
      'card-right': 'card',
      'card-left': 'card',
      'pill-bottom': 'pill',
      'minimal-inline': 'minimal',
    };

    layers.push({
      type: 'badge',
      variant: isPopDesign ? 'split' : (variantMap[badgeVariant] || 'card'),
      position: {
        x: isPopDesign ? '50%' :
          (badgeVariant.includes('left') ? '5%' :
           badgeVariant.includes('right') ? '78%' : '50%'),
        y: isPopDesign ? '80%' : '65%',
        anchor: isPopDesign ? 'center' :
          (badgeVariant.includes('left') ? 'top-left' :
           badgeVariant.includes('right') ? 'top-right' : 'center'),
      },
      size: {
        width: isPopDesign ? '55%' : (badgeVariant === 'pill-bottom' ? '65%' : '22%'),
        height: 'auto',
      },
      background: {
        color: 'rgba(255,255,255,0.95)',
        gradient: `linear-gradient(-45deg, rgba(255,255,255,0.95), ${palette.accentLight || 'rgba(255,248,240,0.9)'})`,
        borderRadius: badgeVariant === 'pill-bottom' ? '999px' : '12px',
        border: `1.5px solid ${palette.accent}25`,
        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
      },
      elements: [
        ...(price.suffix ? [{
          type: 'suffix' as const,
          text: price.suffix,
          style: {
            fontFamily: font, fontWeight: 500, fontSize: '1.4vw',
            fontStyle: 'normal' as const, color: '#888',
            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            lineHeight: '1', textAlign: 'center' as const,
          },
        }] : []),
        {
          type: 'price' as const,
          text: `${price.prefix} ${price.value}`,
          style: {
            fontFamily: font, fontWeight: 800, fontSize: '3.8vw',
            fontStyle: 'normal' as const, color: palette.accent,
            textTransform: 'none' as const, letterSpacing: '-0.01em',
            lineHeight: '1.1', textAlign: 'center' as const,
          },
        },
        {
          type: 'divider' as const,
          style: { color: 'rgba(0,0,0,0.08)', width: '1px', height: '60%' },
        },
        {
          type: 'cta' as const,
          text: (cta || 'PEÇA JÁ').toUpperCase(),
          style: {
            fontFamily: font, fontWeight: 600, fontSize: '2vw',
            fontStyle: 'normal' as const, color: '#FFFFFF',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            lineHeight: '1', textAlign: 'center' as const,
          },
          background: {
            color: palette.accent,
            borderRadius: '6px',
          },
        },
      ],
      zIndex: zIndex + 12,
    });
  }

  // ===== CAMADA: CONTACT BAR =====
  if (whatsapp || instagram) {
    const contactVariant = chooseContactVariant(whatsapp || '', instagram || '');
    const bgIsDark = isFoodPop || (isPopDesign && Boolean(bgBase64));
    const items: ContactItem[] = [];

    if (whatsapp) items.push({
      type: 'whatsapp', value: whatsapp,
      icon: { type: 'circle', color: palette.accent + 'CC', size: '2.5vw' },
    });
    if (instagram) items.push({
      type: 'instagram',
      value: instagram.startsWith('@') ? instagram : `@${instagram}`,
      icon: { type: 'circle', color: palette.accent + '99', size: '2.5vw' },
    });

    layers.push({
      type: 'contact-bar',
      variant: isPopDesign ? 'center' :
        (contactVariant === 'bar-left' ? 'left' :
         contactVariant === 'inline-badge' ? 'pill' : 'center'),
      position: { x: '50%', y: '93%', anchor: 'center' },
      items,
      separator: {
        text: '  •  ',
        style: {
          fontFamily: font, fontWeight: 400, fontSize: '2.2vw',
          fontStyle: 'normal', color: bgIsDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
          textTransform: 'none', letterSpacing: '0', lineHeight: '1', textAlign: 'center',
        },
      },
      style: {
        fontFamily: font, fontWeight: 500, fontSize: '2.2vw',
        fontStyle: 'normal',
        color: bgIsDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)',
        textTransform: 'none', letterSpacing: '0.02em', lineHeight: '1',
        textAlign: 'center',
        textShadow: bgIsDark ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
      },
      zIndex: zIndex + 13,
    });
  }

  return {
    version: '1.0',
    preset,
    canvasSize: { width: 1080, height: 1080 },
    layers,
  };
}

// Helper
function lighten(hex: string, amount: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  } catch {
    return '#F5F5F5';
  }
}
