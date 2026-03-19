// src/services/typographyTemplates.ts
// CREATYNG — Templates de tipografia profissional para text_overlay.
// Selecionados automaticamente baseado na análise da referência.

export interface TypographyTemplate {
  id: string;
  name: string;
  description: string;
  matchMoods: string[];
  matchCategories: string[];

  container: {
    position: 'bottom' | 'top' | 'center' | 'bottom-left' | 'bottom-right' | 'split-bottom';
    padding: string;
    background?: string;
  };

  headline: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    letterSpacing: string;
    lineHeight: string;
    textTransform: string;
    textShadow: string;
    maxWidth: string;
    textAlign: string;
    WebkitTextStroke?: string;
  };

  price: {
    show: boolean;
    fontSize: string;
    fontWeight: string;
    color: string;
    badge: {
      enabled: boolean;
      background: string;
      borderRadius: string;
      padding: string;
      border?: string;
      backdropFilter?: string;
    };
  };

  cta: {
    show: boolean;
    fontSize: string;
    fontWeight: string;
    color: string;
    letterSpacing: string;
    textTransform: string;
    opacity: string;
    button?: {
      enabled: boolean;
      background: string;
      borderRadius: string;
      padding: string;
      border?: string;
    };
  };

  contact: {
    show: boolean;
    fontSize: string;
    fontWeight: string;
    color: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'below-cta';
    opacity: string;
  };

  decorations?: {
    dividerLine?: { color: string; width: string; opacity: string };
    accentDot?: { color: string; size: string };
    overlayGradient?: string;
  };
}

// ═══════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════

export const TYPOGRAPHY_TEMPLATES: TypographyTemplate[] = [

  // ─── 1. LUXURY MINIMAL ───
  {
    id: 'luxury-minimal',
    name: 'Luxury Minimal',
    description: 'Clean, espaçado, elegante. Perfeito pra produtos premium.',
    matchMoods: ['luxurious', 'minimal', 'clean', 'elegant', 'professional', 'sophisticated'],
    matchCategories: ['watches', 'jewelry', 'luxury', 'tech', 'automotive', 'fashion-luxury'],
    container: {
      position: 'bottom',
      padding: '0 60px 60px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    },
    headline: {
      fontFamily: "'Instrument Sans', 'Inter', 'Helvetica Neue', sans-serif",
      fontSize: '42px',
      fontWeight: '300',
      color: '#FFFFFF',
      letterSpacing: '0.18em',
      lineHeight: '1.2',
      textTransform: 'uppercase',
      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
      maxWidth: '85%',
      textAlign: 'center',
    },
    price: {
      show: true,
      fontSize: '24px',
      fontWeight: '600',
      color: '#FFFFFF',
      badge: {
        enabled: false,
        background: 'transparent',
        borderRadius: '0',
        padding: '0',
      },
    },
    cta: {
      show: true,
      fontSize: '13px',
      fontWeight: '500',
      color: '#FFFFFF',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      opacity: '0.5',
    },
    contact: {
      show: true,
      fontSize: '12px',
      fontWeight: '400',
      color: '#FFFFFF',
      position: 'bottom-right',
      opacity: '0.35',
    },
    decorations: {
      dividerLine: { color: '#FFFFFF', width: '40px', opacity: '0.3' },
    },
  },

  // ─── 2. BOLD IMPACT ───
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    description: 'Grande, forte, chamativo. Pra promoções e ofertas.',
    matchMoods: ['vibrant', 'energetic', 'bold', 'playful', 'warm', 'intense'],
    matchCategories: ['food', 'restaurant', 'promo', 'sale', 'event', 'sports'],
    container: {
      position: 'bottom',
      padding: '0 40px 40px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
    },
    headline: {
      fontFamily: "'Instrument Sans', 'Inter', 'Impact', sans-serif",
      fontSize: '64px',
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: '-0.02em',
      lineHeight: '1.0',
      textTransform: 'uppercase',
      textShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(0,0,0,0.3)',
      maxWidth: '90%',
      textAlign: 'center',
    },
    price: {
      show: true,
      fontSize: '32px',
      fontWeight: '800',
      color: '#FFFFFF',
      badge: {
        enabled: true,
        background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
        borderRadius: '10px',
        padding: '8px 24px',
      },
    },
    cta: {
      show: true,
      fontSize: '16px',
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      opacity: '0.7',
      button: {
        enabled: true,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '10px 28px',
        border: '1px solid rgba(255,255,255,0.2)',
      },
    },
    contact: {
      show: true,
      fontSize: '14px',
      fontWeight: '500',
      color: '#FFFFFF',
      position: 'below-cta',
      opacity: '0.5',
    },
  },

  // ─── 3. NEON GLOW ───
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Brilhos e neon. Pra nightlife, tech, gaming.',
    matchMoods: ['dark', 'dramatic', 'neon', 'futuristic', 'edgy', 'cool'],
    matchCategories: ['nightlife', 'gaming', 'tech', 'music', 'streaming', 'cyberpunk'],
    container: {
      position: 'bottom',
      padding: '0 50px 50px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
    },
    headline: {
      fontFamily: "'Instrument Sans', 'Inter', sans-serif",
      fontSize: '56px',
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: '-0.01em',
      lineHeight: '1.05',
      textTransform: 'uppercase',
      textShadow: '0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.3), 0 2px 10px rgba(0,0,0,0.5)',
      maxWidth: '90%',
      textAlign: 'center',
    },
    price: {
      show: true,
      fontSize: '28px',
      fontWeight: '700',
      color: '#FFFFFF',
      badge: {
        enabled: true,
        background: 'rgba(124,58,237,0.3)',
        borderRadius: '8px',
        padding: '6px 20px',
        border: '1px solid rgba(124,58,237,0.4)',
        backdropFilter: 'blur(8px)',
      },
    },
    cta: {
      show: true,
      fontSize: '14px',
      fontWeight: '600',
      color: '#C084FC',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      opacity: '0.8',
    },
    contact: {
      show: true,
      fontSize: '12px',
      fontWeight: '400',
      color: '#C084FC',
      position: 'bottom-right',
      opacity: '0.4',
    },
    decorations: {
      accentDot: { color: '#7C3AED', size: '6px' },
    },
  },

  // ─── 4. GLASS CARD ───
  {
    id: 'glass-card',
    name: 'Glass Card',
    description: 'Card flutuante com blur. Moderno e clean.',
    matchMoods: ['modern', 'clean', 'professional', 'minimal', 'sophisticated'],
    matchCategories: ['saas', 'app', 'beauty', 'skincare', 'fashion', 'lifestyle'],
    container: {
      position: 'bottom',
      padding: '0 40px 40px',
    },
    headline: {
      fontFamily: "'Instrument Sans', 'Inter', sans-serif",
      fontSize: '36px',
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: '-0.02em',
      lineHeight: '1.15',
      textTransform: 'none',
      textShadow: 'none',
      maxWidth: '100%',
      textAlign: 'left',
    },
    price: {
      show: true,
      fontSize: '22px',
      fontWeight: '700',
      color: '#FFFFFF',
      badge: {
        enabled: true,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '6px 16px',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
      },
    },
    cta: {
      show: true,
      fontSize: '14px',
      fontWeight: '600',
      color: '#141417',
      letterSpacing: '0',
      textTransform: 'none',
      opacity: '1',
      button: {
        enabled: true,
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '10px 24px',
      },
    },
    contact: {
      show: true,
      fontSize: '12px',
      fontWeight: '500',
      color: '#FFFFFF',
      position: 'below-cta',
      opacity: '0.5',
    },
    decorations: {
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
    },
  },

  // ─── 5. FOOD VIBRANT ───
  {
    id: 'food-vibrant',
    name: 'Food Vibrant',
    description: 'Colorido e apetitoso. Pra restaurantes e delivery.',
    matchMoods: ['vibrant', 'warm', 'energetic', 'appetizing', 'fun', 'colorful'],
    matchCategories: ['food', 'restaurant', 'burger', 'pizza', 'acai', 'bakery', 'cafe', 'delivery'],
    container: {
      position: 'bottom',
      padding: '0 36px 36px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, transparent 100%)',
    },
    headline: {
      fontFamily: "'Instrument Sans', 'Inter', 'Helvetica Neue', sans-serif",
      fontSize: '58px',
      fontWeight: '800',
      color: '#FFD700',
      letterSpacing: '-0.02em',
      lineHeight: '1.0',
      textTransform: 'uppercase',
      textShadow: '0 3px 12px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.3)',
      maxWidth: '95%',
      textAlign: 'center',
      WebkitTextStroke: '1px rgba(0,0,0,0.15)',
    },
    price: {
      show: true,
      fontSize: '34px',
      fontWeight: '900',
      color: '#FFFFFF',
      badge: {
        enabled: true,
        background: '#EF4444',
        borderRadius: '12px',
        padding: '8px 28px',
      },
    },
    cta: {
      show: true,
      fontSize: '18px',
      fontWeight: '700',
      color: '#141417',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      opacity: '1',
      button: {
        enabled: true,
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        borderRadius: '50px',
        padding: '12px 32px',
      },
    },
    contact: {
      show: true,
      fontSize: '15px',
      fontWeight: '600',
      color: '#FFFFFF',
      position: 'below-cta',
      opacity: '0.6',
    },
  },

  // ─── 6. EDITORIAL SPLIT ───
  {
    id: 'editorial-split',
    name: 'Editorial Split',
    description: 'Texto na lateral. Estilo editorial/revista.',
    matchMoods: ['editorial', 'magazine', 'artistic', 'creative'],
    matchCategories: ['fashion', 'editorial', 'magazine', 'art', 'photography'],
    container: {
      position: 'bottom-left',
      padding: '40px',
    },
    headline: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: '48px',
      fontWeight: '400',
      color: '#FFFFFF',
      letterSpacing: '-0.01em',
      lineHeight: '1.1',
      textTransform: 'none',
      textShadow: '0 2px 16px rgba(0,0,0,0.4)',
      maxWidth: '60%',
      textAlign: 'left',
    },
    price: {
      show: true,
      fontSize: '20px',
      fontWeight: '600',
      color: '#FFFFFF',
      badge: { enabled: false, background: '', borderRadius: '', padding: '' },
    },
    cta: {
      show: true,
      fontSize: '13px',
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      opacity: '0.6',
    },
    contact: {
      show: true,
      fontSize: '11px',
      fontWeight: '400',
      color: '#FFFFFF',
      position: 'bottom-left',
      opacity: '0.35',
    },
    decorations: {
      dividerLine: { color: '#FFFFFF', width: '30px', opacity: '0.4' },
      overlayGradient: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
    },
  },
];

// ═══════════════════════════════════════════════════════
// SELETOR AUTOMÁTICO
// ═══════════════════════════════════════════════════════

export function selectTemplate(analysis: Record<string, unknown> | null | undefined): TypographyTemplate {
  if (!analysis) return TYPOGRAPHY_TEMPLATES[0];

  const style = analysis.style as Record<string, unknown> | undefined;
  const composition = analysis.composition as Record<string, unknown> | undefined;

  const mood = ((style?.mood as string) || '').toLowerCase();
  const bg = ((style?.backgroundDescription as string) || '').toLowerCase();
  const desc = ((composition?.description as string) || '').toLowerCase();
  const allText = `${mood} ${bg} ${desc}`;

  let bestMatch = TYPOGRAPHY_TEMPLATES[0];
  let bestScore = 0;

  for (const template of TYPOGRAPHY_TEMPLATES) {
    let score = 0;

    for (const m of template.matchMoods) {
      if (allText.includes(m)) score += 3;
    }

    for (const c of template.matchCategories) {
      if (allText.includes(c)) score += 5;
    }

    // Bonus keywords
    if (allText.includes('food') || allText.includes('burger') || allText.includes('pizza')) {
      if (template.id === 'food-vibrant') score += 10;
    }
    if (allText.includes('luxury') || allText.includes('watch') || allText.includes('premium')) {
      if (template.id === 'luxury-minimal') score += 10;
    }
    if (allText.includes('neon') || allText.includes('gaming') || allText.includes('dark')) {
      if (template.id === 'neon-glow') score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestMatch;
}
