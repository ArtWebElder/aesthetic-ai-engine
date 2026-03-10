// ============================================================
// CREATYNG COMPOSITION SCHEMA v1.0
// O formato central que conecta motor → renderer → chat → export
// ============================================================

export interface CreatygnComposition {
  version: '1.0';
  preset: string;
  canvasSize: { width: number; height: number };
  layers: CompositionLayer[];
}

export type CompositionLayer =
  | BackgroundLayer
  | ImageLayer
  | GradientOverlayLayer
  | DecorativeTextLayer
  | HeadlineLayer
  | SubheadlineLayer
  | BadgeLayer
  | ContactBarLayer
  | ParticleLayer
  | LogoLayer;

// ---- Posição ----

export interface LayerPosition {
  x: string;       // "50%" | "120px"
  y: string;       // "6%" | "auto"
  anchor: 'center' | 'top-left' | 'top-center' | 'top-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// ---- Estilo de Texto (com CSS avançado) ----

export interface TextStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: string;
  fontStyle: 'normal' | 'italic';
  color: string;
  textTransform: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  letterSpacing: string;
  lineHeight: string;
  textAlign: 'left' | 'center' | 'right';

  // CSS avançado — o poder do HTML/CSS
  textShadow?: string;
  backgroundClip?: 'text';
  backgroundImage?: string;     // gradiente ou URL de textura
  webkitTextStroke?: string;    // "1px rgba(255,255,255,0.2)"
  mixBlendMode?: string;
  opacity?: number;
  filter?: string;
  transform?: string;           // "rotate(-2deg)" | "skewX(-3deg)"
}

// ---- Layers ----

export interface BackgroundLayer {
  type: 'background';
  source:
    | { type: 'image'; base64: string; fit: 'cover' | 'contain' }
    | { type: 'gradient'; css: string }
    | { type: 'solid'; color: string };
}

export interface GradientOverlayLayer {
  type: 'gradient-overlay';
  css: string;  // "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%)"
  zIndex: number;
}

export interface ImageLayer {
  type: 'image';
  id: string;
  base64: string;
  position: LayerPosition;
  size: {
    width: string;
    height: string;
    maxWidth?: string;
    maxHeight?: string;
    objectFit: 'contain' | 'cover';
  };
  effects?: {
    dropShadow?: string;
    borderRadius?: string;
    opacity?: number;
    filter?: string;
    mixBlendMode?: string;
  };
  zIndex: number;
}

export interface DecorativeTextLayer {
  type: 'decorative-text';
  text: string;
  style: TextStyle;
  position: LayerPosition;
  repeat?: {
    count: number;
    offsetY: string;
    opacityDecay: number;
  };
  zIndex: number;
}

export interface HeadlineLayer {
  type: 'headline';
  segments: HeadlineSegment[];
  position: LayerPosition;
  gap: string;
  zIndex: number;
}

export interface HeadlineSegment {
  text: string;
  style: TextStyle;
  role: 'impact' | 'context';
}

export interface SubheadlineLayer {
  type: 'subheadline';
  text: string;
  style: TextStyle;
  position: LayerPosition;
  zIndex: number;
}

export interface BadgeLayer {
  type: 'badge';
  variant: 'card' | 'pill' | 'minimal' | 'split';
  position: LayerPosition;
  size: { width: string; height: string };
  background: {
    color: string;
    gradient?: string;
    borderRadius: string;
    border?: string;
    boxShadow?: string;
    backdropFilter?: string;
  };
  elements: BadgeElement[];
  zIndex: number;
}

export type BadgeElement =
  | { type: 'suffix'; text: string; style: TextStyle }
  | { type: 'price'; text: string; style: TextStyle }
  | { type: 'cta'; text: string; style: TextStyle; background: { color: string; borderRadius: string } }
  | { type: 'divider'; style: { color: string; width: string; height: string } };

export interface ContactBarLayer {
  type: 'contact-bar';
  variant: 'center' | 'left' | 'pill';
  position: LayerPosition;
  items: ContactItem[];
  separator?: { text: string; style: TextStyle };
  style: TextStyle;
  background?: {
    color: string;
    borderRadius: string;
    border?: string;
  };
  zIndex: number;
}

export interface ContactItem {
  type: 'whatsapp' | 'instagram' | 'phone' | 'email';
  value: string;
  icon?: {
    type: 'circle' | 'svg';
    color: string;
    size: string;
  };
}

export interface ParticleLayer {
  type: 'particles';
  count: number;
  style: {
    color: string;
    sizeRange: [string, string];
    opacityRange: [number, number];
    blurRange: [string, string];
  };
  distribution: 'random' | 'edges';
  seed: number;
  mixBlendMode?: string;
  zIndex: number;
}

export interface LogoLayer {
  type: 'logo';
  base64: string;
  position: LayerPosition;
  size: { height: string; width: string };
  opacity?: number;
  zIndex: number;
}
