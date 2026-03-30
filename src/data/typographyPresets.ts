// src/data/typographyPresets.ts
// CREATYNG — Premium typography presets for composition engine.
// Each preset defines a complete typographic system: headline, subheadline, overline, CTA.
// Used by compositionBuilder and htmlRenderer.

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: number;
  color: string;
  textTransform?: 'uppercase' | 'capitalize' | 'none';
  letterSpacing?: string;
  textShadow?: string;
  webkitTextStroke?: string;
  backgroundImage?: string;
  backgroundClip?: 'text';
  webkitBackgroundClip?: 'text';
  webkitTextFillColor?: string;
}

export interface TypographyPreset {
  id: string;
  name: string;
  description: string;
  category: 'elegant' | 'bold' | 'modern' | 'editorial' | 'street' | 'luxury';
  suitableFor: string[];
  headline: TypographyStyle;
  subheadline: TypographyStyle;
  overline: TypographyStyle;
  cta: TypographyStyle & {
    background: string;
    borderRadius: string;
    padding: string;
  };
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'gold-serif',
    name: 'Gold Serif',
    description: 'Serifa dourada com emboss — advocacia, luxo, premium',
    category: 'luxury',
    suitableFor: ['advocacia', 'joalheria', 'relojoaria', 'moda', 'premium', 'law'],
    headline: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 900,
      color: '#C4A052',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      textShadow: '0 1px 0 rgba(255,235,180,0.4), 0 -1px 0 rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
      backgroundImage: 'linear-gradient(180deg, #E8D48B 0%, #C4A052 40%, #8B6914 100%)',
      backgroundClip: 'text',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
    },
    subheadline: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 400,
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: '0.03em',
    },
    overline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 500,
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    cta: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
      color: '#1A1A1A',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      background: 'linear-gradient(135deg, #E8D48B, #C4A052)',
      borderRadius: '4px',
      padding: '12px 28px',
    },
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    description: 'Condensada pesada — promoções, food, esporte',
    category: 'bold',
    suitableFor: ['hamburgueria', 'pizzaria', 'esporte', 'promoção', 'varejo', 'burger', 'food'],
    headline: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontWeight: 400,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.3)',
    },
    subheadline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 500,
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: '0.02em',
    },
    overline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
      color: '#FF6B35',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    cta: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontWeight: 400,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      background: '#FF6B35',
      borderRadius: '6px',
      padding: '10px 24px',
    },
  },
  {
    id: 'outline-glow',
    name: 'Outline Glow',
    description: 'Texto outlined com glow — tech, neon, gaming',
    category: 'street',
    suitableFor: ['tech', 'gaming', 'balada', 'evento', 'música'],
    headline: {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 700,
      color: 'transparent',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      webkitTextStroke: '2px rgba(255,255,255,0.9)',
      textShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(120,200,255,0.15)',
    },
    subheadline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 400,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: '0.03em',
    },
    overline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      color: '#64B5F6',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
    },
    cta: {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 700,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      textShadow: '0 0 10px rgba(100,181,246,0.5)',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '10px 24px',
    },
  },
  {
    id: 'editorial-clean',
    name: 'Editorial Clean',
    description: 'Limpo e editorial — clínica, saúde, beleza',
    category: 'editorial',
    suitableFor: ['clinica', 'saúde', 'beleza', 'spa', 'lifestyle', 'coach'],
    headline: {
      fontFamily: "'DM Serif Display', serif",
      fontWeight: 400,
      color: '#FFFFFF',
      letterSpacing: '-0.01em',
      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    subheadline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 300,
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: '0.01em',
    },
    overline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
      color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
    },
    cta: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      background: 'transparent',
      borderRadius: '0px',
      padding: '8px 0px',
    },
  },
  {
    id: 'neon-street',
    name: 'Neon Street',
    description: 'Vibrante com glow colorido — açaiteria, sorvete, festa',
    category: 'street',
    suitableFor: ['açaiteria', 'sorvete', 'festa', 'carnaval', 'lançamento', 'acai'],
    headline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      textShadow: '0 0 10px #FF6EC7, 0 0 20px #FF6EC7, 0 0 40px #FF6EC7, 0 2px 4px rgba(0,0,0,0.5)',
    },
    subheadline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
      color: 'rgba(255,255,255,0.85)',
    },
    overline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
      color: '#FF6EC7',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    cta: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 800,
      color: '#1A1A1A',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      background: '#FF6EC7',
      borderRadius: '50px',
      padding: '10px 28px',
    },
  },
  {
    id: 'luxury-dark',
    name: 'Luxury Dark',
    description: 'Elegância escura — relojoaria, whisky, carro, imóvel',
    category: 'luxury',
    suitableFor: ['relojoaria', 'whisky', 'automotivo', 'imobiliária', 'hotel'],
    headline: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 700,
      color: '#D4C5A0',
      letterSpacing: '0.04em',
      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
    },
    subheadline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 300,
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    overline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 400,
      color: 'rgba(212,197,160,0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
    },
    cta: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
      color: '#D4C5A0',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      background: 'transparent',
      borderRadius: '0px',
      padding: '10px 24px',
      webkitTextStroke: '1px #D4C5A0',
    },
  },
  {
    id: 'pop-vibrant',
    name: 'Pop Vibrant',
    description: 'Colorido e chamativo — fast food, delivery, app',
    category: 'bold',
    suitableFor: ['fast food', 'delivery', 'app', 'ecommerce', 'loja'],
    headline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 800,
      color: '#FFD93D',
      textTransform: 'uppercase',
      letterSpacing: '0.01em',
      textShadow: '3px 3px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
    },
    subheadline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 500,
      color: '#FFFFFF',
    },
    overline: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 600,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    cta: {
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 700,
      color: '#1A1A1A',
      textTransform: 'uppercase',
      background: '#FFD93D',
      borderRadius: '50px',
      padding: '12px 32px',
    },
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Ultra limpo — arquitetura, design, portfolio',
    category: 'modern',
    suitableFor: ['arquitetura', 'design', 'portfolio', 'fotografia', 'estúdio'],
    headline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      color: '#FFFFFF',
      letterSpacing: '-0.02em',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    subheadline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 300,
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: '0.01em',
    },
    overline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
    },
    cta: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '4px',
      padding: '10px 20px',
    },
  },
  {
    id: 'retro-hard',
    name: 'Retro Hard',
    description: 'Retrô com sombra dura — churrasco, cervejaria, bar',
    category: 'bold',
    suitableFor: ['churrasco', 'cervejaria', 'bar', 'barbeiro', 'tattoo', 'barbearia'],
    headline: {
      fontFamily: "'Archivo Black', sans-serif",
      fontWeight: 400,
      color: '#F5E6C8',
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
      textShadow: '4px 4px 0 rgba(0,0,0,0.5)',
    },
    subheadline: {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 400,
      color: 'rgba(245,230,200,0.7)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    overline: {
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 400,
      color: '#E85D24',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    cta: {
      fontFamily: "'Archivo Black', sans-serif",
      fontWeight: 400,
      color: '#1A1A1A',
      textTransform: 'uppercase',
      background: '#F5E6C8',
      borderRadius: '2px',
      padding: '10px 24px',
    },
  },
  {
    id: 'gradient-modern',
    name: 'Gradient Modern',
    description: 'Gradiente vibrante no texto — SaaS, tech, startup',
    category: 'modern',
    suitableFor: ['saas', 'tech', 'startup', 'app', 'digital'],
    headline: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 800,
      color: '#FFFFFF',
      letterSpacing: '-0.01em',
      backgroundImage: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      backgroundClip: 'text',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
    },
    subheadline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 400,
      color: 'rgba(255,255,255,0.7)',
    },
    overline: {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      color: '#667EEA',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    cta: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
      color: '#FFFFFF',
      background: 'linear-gradient(135deg, #667EEA, #764BA2)',
      borderRadius: '8px',
      padding: '12px 28px',
    },
  },
];

export function getPresetForNiche(niche: string): TypographyPreset {
  const lower = niche.toLowerCase();
  const match = TYPOGRAPHY_PRESETS.find(p =>
    p.suitableFor.some(s => lower.includes(s))
  );
  return match || TYPOGRAPHY_PRESETS.find(p => p.id === 'bold-impact')!;
}

export function getPresetById(id: string): TypographyPreset | undefined {
  return TYPOGRAPHY_PRESETS.find(p => p.id === id);
}

/** Google Fonts URL for all premium fonts used by presets */
export const PREMIUM_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Bebas+Neue&family=Oswald:wght@400;700&family=DM+Serif+Display&family=Montserrat:wght@400;700;800;900&family=Cormorant+Garamond:wght@400;600;700&family=Poppins:wght@400;600;700;800&family=Archivo+Black&family=Inter:wght@300;400;500;600;700&display=swap';
