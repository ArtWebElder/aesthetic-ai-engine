// src/types/spec.ts

export type ModuleType = "social" | "ecom" | "photoshoot";

/* =========================
   FORMATS
========================= */

// Social
export type SocialFormat =
  | "feed_1080"
  | "feed_1080x1350"
  | "story_1080x1920"
  | "landscape_1200x628";

// Ecom (NOVOS)
export type EcomFormat =
  | "ecom_ultrawide_1920x800"
  | "ecom_notebook_1366x768"
  | "ecom_mobile_1080x1350"
  | "ecom_custom";

// Photoshoot
export type PhotoshootFormat = "square_1024";

export type ProjectFormat = SocialFormat | EcomFormat | PhotoshootFormat;

/* =========================
   STYLE + TEMPLATES
========================= */

export type StylePreset = "minimal_clean" | "bold_ads" | "glass" | "editorial";

export type TemplateId =
  | "social_01"
  | "social_02"
  | "social_03"
  | "social_04"
  | "social_05"
  | "social_06"
  | "ecom_01"
  | "ecom_02"
  | "ecom_03"
  | "ecom_04"
  | "photo_01"
  | "photo_02"
  | "photo_03"
  | "photo_04"
  | "photo_05";

/* =========================
   BRAND / TOKENS
========================= */

export type FontPreset = "inter" | "space_grotesk" | "dm_sans" | "plus_jakarta";
export type AccentMode = "solid" | "gradient";

export interface ContentSpec {
  headline: string;
  subheadline: string;
  ctaText: string;
  price?: string;
  badgeText?: string;
}

export interface BrandSpec {
  primary: string;
  secondary: string;
  accent: string;
  paletteMode?: "mono" | "duo" | "tri" | "custom";
  accent2?: string;
  neutralBg?: string;
  neutralSurface?: string;
  neutralText?: string;
  accentMode: AccentMode;
  fontPreset: FontPreset;
  autoContrast: boolean;
  logoUrl?: string;
}

export interface AssetsSpec {
  productImageUrl?: string;
  extraImageUrl?: string;
  referenceImageUrl?: string;
  autoRemoveBg: boolean;
}

export interface EffectsSpec {
  preset: "clean" | "bold" | "glass" | "neon";
  textOutline: number;
  shadow: number;
  depth3d: number;
  tilt: number;
}

export interface GenerationParams {
  aspectRatio: string;
  width: number;
  height: number;
  quality: "standard" | "high";
  realism?: number;
}

export interface ReferenceImage {
  id: string;
  url: string | null;
  role: "style" | "composition" | "product" | "brand" | "other";
  weight: number;
  lockRealism: boolean;
  notes?: string;
}

export interface BuilderSpec {
  subjectType?: string;
  framing?: string;
  expression?: string;
  action?: string;
  lightingSetup?: string;
  temperature?: string;
  mood?: string;
  macroStyle?: string;
  visualStyle?: string[];
  layoutBase?: string;
  safeSpace?: string;
  extraDetails?: string;
}

export interface ProjectSpec {
  module: ModuleType;
  format: ProjectFormat;
  stylePreset: StylePreset;
  templateId: TemplateId;
  contextText?: string;
  subjectText?: string;
  styleText?: string;
  cameraText?: string;
  compositionText?: string;
  subjectImageUrl?: string | null;
  lightingText?: string;
  assetsText?: string;
  builder?: BuilderSpec;
  referenceImages?: ReferenceImage[];
  /** @deprecated Use referenceImages instead. */
  referenceImageUrl?: string | null;

  content: ContentSpec;
  brand: BrandSpec;
  assets: AssetsSpec;
  effects: EffectsSpec;

  generation: GenerationParams;
}

export interface Generation {
  id: string;
  projectId: string;
  status: "queued" | "running" | "done" | "error";
  imageUrl?: string;
  prompt?: string;
  negativePrompt?: string;
  createdAt: string;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  spec: ProjectSpec;
  status: "draft" | "generated";
  createdAt: string;
  updatedAt: string;

  generations?: Generation[];
  activeGenerationId?: string;
}
