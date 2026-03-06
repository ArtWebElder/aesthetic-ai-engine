// src/types/preset.ts
// CREATYNG — MASTER SPEC — Tipos Universais
// Fonte única de verdade para presets, wizard, brand kit e marketplace.
// NUNCA criar schemas paralelos para o mesmo conceito.

// ─── VISION FIRST — tipos espelhados do backend (supabase/functions não incluso no tsconfig) ──

export interface VisualDNA {
  lighting: {
    type: string;
    direction: string;
    color: string;
    rimColor: string;
    intensity: string;
    shadows: string;
  };
  colorPalette: {
    dominant: string;
    secondary: string;
    accent: string;
    background: string;
    overall: string;
  };
  atmosphere: {
    mood: string;
    particles: boolean;
    particleType: string;
    fog: boolean;
    glowEffects: boolean;
    depthOfField: string;
  };
  composition: {
    subjectPosition: string;
    subjectSize: string;
    cameraAngle: string;
    foregroundElements: string;
    backgroundElements: string;
    planes: number;
    negativeSpace: string;
  };
  style: {
    genre: string;
    realism: string;
    productionLevel: string;
    era: string;
    references: string;
  };
  textures: {
    skin: string;
    materials: string;
    surfaceQuality: string;
  };
  specialElements: {
    effects3D: boolean;
    effects3DDescription: string;
    energyEffects: boolean;
    energyDescription: string;
    environmentalElements: string;
  };
  promptWeight: {
    mostImportant: string;
    doNotChange: string;
    optional: string;
  };
}

export interface SubjectProfile {
  subjectType: "person" | "product" | "animal" | "vehicle" | "food" | "logo" | "other";
  person: {
    gender: string | null;
    approximateAge: string | null;
    hairColor: string | null;
    hairStyle: string | null;
    skinTone: string | null;
    eyeColor: string | null;
    facialHair: string | null;
    distinctiveFeatures: string | null;
    bodyType: string | null;
    currentClothing: string | null;
  } | null;
  product: {
    category: string | null;
    primaryColor: string | null;
    shape: string | null;
    distinctiveFeatures: string | null;
  } | null;
  framing: {
    currentCrop: string;
    faceVisible: boolean;
    faceQuality: string;
  };
  identityStrength: number;
  preservationInstructions: string;
}

// ─── PRESET UNIVERSAL ────────────────────────────────────────────────────────

export interface CreatygnPreset {
  id: string;
  slug: string;                      // 'drama-impact', 'text-clean-editorial'
  name: string;
  description?: string;
  thumbnailUrl: string;              // imagem de exemplo gerada com este preset

  type: PresetType;
  scope: PresetScope;
  authorId?: string;                 // null = preset do sistema Creatyng
  authorName?: string;

  config: PresetConfig;
  stats: PresetStats;
  marketplace?: PresetMarketplace;

  createdAt: string;
  updatedAt: string;
  version: number;
}

export type PresetType =
  | "image_style"    // Drama, Clean, Dark, Editorial, Neon
  | "text_style"     // Impact, Clean, Dark, Neon, Street, Luxury, Sport, Minimal
  | "composition"    // regras de layout e posição
  | "color_palette"  // conjunto de cores
  | "full"           // preset completo (image + text + cores + composição)
  | "brand_kit";     // brand kit de usuário específico

export type PresetScope =
  | "system"         // criado pelo Creatyng, todos veem
  | "user_private"   // criado pelo usuário, só ele vê
  | "user_public"    // publicado no marketplace
  | "team";          // compartilhado no plano Agency

// ─── CONFIG DO PRESET ─────────────────────────────────────────────────────────

export interface PresetConfig {
  image?: ImagePresetConfig;
  text?: TextPresetConfig;
  colors?: ColorConfig;
  composition?: CompositionConfig;
}

export interface ImagePresetConfig {
  preset: "drama" | "clean" | "dark" | "editorial" | "neon";
  atmosphere: "fog" | "particles" | "glass_shards" | "rain" | "none";
  lighting: "rim_purple" | "rim_blue" | "natural" | "studio" | "neon" | "none";
  sceneKeywords: string[];
  negativeKeywords: string[];
  visualDNA?: VisualDNA;             // DNA extraído de referência real (Vision First)
}

export interface TextPresetConfig {
  stylePreset: TextStylePreset;
  headlineFont: string;              // Google Font name
  bodyFont: string;                  // Google Font name
  headlineWeight: number;            // 400-900
  headlineTracking: string;          // '-0.02em', '0.05em', etc
  headlineLineHeight: number;        // 0.85-1.3
  headlineTransform: "uppercase" | "none" | "capitalize";
  effects: TextEffects;
  accentWordAuto: boolean;
  accentWordPattern?: string;        // regex ou '[colchetes]' manual
  blendMode: TextBlendMode;
}

export type TextStylePreset =
  | "impact"         // T1 — Anton, grunge, drama
  | "clean"          // T2 — Bebas Neue, corporativo
  | "dark"           // T3 — Cinzel, glow ciano
  | "neon"           // T4 — Rajdhani, efeito neon
  | "street"         // T5 — Black Han Sans, spray
  | "luxury"         // T6 — Cormorant, dourado
  | "sport"          // T7 — Teko, bold máximo
  | "minimal";       // T8 — Inter, Swiss design

export type TextBlendMode =
  | "normal" | "screen" | "overlay" | "soft-light" | "luminosity";

export interface TextEffects {
  texture?: "grunge_metal" | "spray_paint" | "none";
  glow: boolean;
  glowColor?: string;                // usa accent se null
  glowIntensity: number;             // 0-100
  shadow: "none" | "soft" | "medium" | "hard" | "multi-layer";
  shadowColor?: string;
  stroke: boolean;
  strokeWidth?: number;
  strokeColor?: string;
  gradient: boolean;
  gradientColors?: string[];
}

export interface ColorConfig {
  primary: string;                   // hex — rim light, accent, neon
  secondary: string;                 // hex — partículas, reflexos
  neutral: string;                   // hex — fundo, sombras
  extras: string[];                  // até 5 cores extras
  accentWord?: string;               // cor da accent word (pode diferir da primary)
}

export interface CompositionConfig {
  textPosition: "top" | "bottom" | "left" | "right" | "center";
  textAlignment: "left" | "center" | "right";
  subjectPosition: "center" | "left" | "right" | "lower-center";
  overlayIntensity: number;          // 0-100
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5";
  width?: number;
  height?: number;
}

// ─── STATS E MARKETPLACE ──────────────────────────────────────────────────────

export interface PresetStats {
  usageCount: number;
  approvalCount: number;
  rejectionCount: number;
  approvalRate: number;              // 0-100, calculado automaticamente
  favoriteCount: number;
  lastUsedAt?: string;
}

export interface PresetMarketplace {
  published: boolean;
  price: number;                     // 0 = grátis, >0 = créditos
  category: string;
  tags: string[];
  featured: boolean;
  revenue: number;
}

// ─── WIZARD STATE ─────────────────────────────────────────────────────────────
// CRÍTICO: todos os diffs do wizard usam este tipo. Não criar estados paralelos.

export interface WizardState {
  // PASSO 1 — SUBJECT
  subjectBase64?: string;
  subjectThumbnail?: string;         // versão reduzida para preview
  subjectProfile?: SubjectProfile;   // resultado do Vision AI (Stage 1)
  framing: "face" | "half_body" | "full_body" | "product";
  cameraAngle: "eye_level" | "low_angle" | "high_angle";

  // PASSO 2 — ESTILO
  selectedImagePresetId?: string;    // ID do CreatygnPreset (type: image_style)
  selectedTextPresetId?: string;     // ID do CreatygnPreset (type: text_style)
  activePresetConfig: PresetConfig;  // preset base + overrides do usuário

  // REFERÊNCIA
  referenceBase64?: string;
  visualDNA?: VisualDNA;             // resultado do Vision AI na referência

  // PASSO 3 — TEXTOS
  headline: string;
  subheadline: string;
  cta: string;

  // MODO
  mode: "quick" | "advanced";

  // META
  lastGenerationId?: string;
}

// ─── GERAÇÃO E CACHE ───────────────────────────────────────────────────────────

export interface CachedGeneration {
  generationId: string;              // UUID único por geração
  imageBase64: string;               // imagem completa
  imageThumbnail: string;            // 300x300 para histórico
  wizardStateSnapshot: WizardState;  // estado EXATO usado na geração
  presetIds: {
    image?: string;
    text?: string;
  };
  activePresetConfigSnapshot: PresetConfig;  // config EXATA (com overrides)
  visualDNA?: VisualDNA;
  qualityScore?: number;
  meta: GenerationMeta;
  timestamp: number;
}

export interface GenerationMeta {
  provider: string;
  model: string;
  dnaUsed: boolean;
  aspectRatio: string;
  generationMs: number;
}

// ─── FEEDBACK ──────────────────────────────────────────────────────────────────

export type GenerationRating = "approved" | "rejected" | "favorited";

export interface GenerationFeedback {
  generationId: string;
  userId: string;
  rating: GenerationRating;
  presetId?: string;                 // qual preset foi usado
  configSnapshot: PresetConfig;      // config exata usada
  qualityScore?: number;
  ratedAt: string;
}
