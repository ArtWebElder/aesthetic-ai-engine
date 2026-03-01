// src/types/spec.ts

export type ModuleType = "social_post" | "ecom_banner" | "photoshoot";

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
  | "ecom_desktop_1920x800"
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

export type StylePreset =
  | "minimal_clean"
  | "bold_ads"
  | "glass"
  | "editorial"
  | "clean_modern";

export type TemplateId =
  | "social_post_clean"
  | "photoshoot_clean"
  | "social_01"
  | "social_02"
  | "social_03"
  | "social_04"
  | "social_05"
  | "social_06"
  | "ecom_01"
  | "ecom_v2_01"
  | "ecom_02"
  | "ecom_03"
  | "ecom_04"
  | "photo_01"
  | "photo_02"
  | "photo_03"
  | "photo_04"
  | "photo_05";

export type ScenePresetSlug =
  | "studio_white"
  | "studio_dark"
  | "studio_gradient"
  | "lifestyle_home"
  | "luxury_interior"
  | "urban_day"
  | "urban_night"
  | "nature_outdoor"
  | "minimal_texture"
  | "editorial_backdrop";

export type SceneMoodSlug =
  | "clean_bright"
  | "warm_cozy"
  | "cool_modern"
  | "cinematic_moody"
  | "luxury_premium"
  | "energetic_pop"
  | "natural_authentic"
  | "night_neon";

export type ScenePropSlug =
  | "soft_shadow"
  | "reflection_surface"
  | "floating_elements"
  | "bokeh_lights"
  | "smoke_haze"
  | "plants_greenery"
  | "paper_texture"
  | "marble_stone"
  | "wood_warm"
  | "neon_glow";

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
  ecomTextPreset?: "clean_bold" | "glass_label" | "distressed_angle";
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
  logoUrl?: string | null;
  autoRemoveBg: boolean;
}

export interface EcomStyleDNA {
  palette?: string[];
  vibe?: string;
  layout?: string;
  textStyle?: string;
  fx?: string[];
}

export interface EcomV2Spec {
  styleRefImageUrl?: string | null;
  styleRefImagePath?: string | null;
  subjectWeight?: number;
  styleWeight?: number;
  subjectLockRealism?: boolean;
  styleLockRealism?: boolean;
  styleDNA?: EcomStyleDNA | null;
  layoutPreset?: "layout_a" | "layout_b" | "layout_c";
  textPreset?: "impact" | "premium" | "clean";
  intensity?: number;
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
  seed?: number | null;
  negativePrompt?: string | null;
}

export interface ReferenceImage {
  id: string;
  url: string | null;
  role: "style" | "composition" | "product" | "brand" | "subject" | "other";
  weight: number;
  lockRealism: boolean;
  notes?: string;
}

export interface BuilderSpec {
  headline?: string;
  subheadline?: string;
  cta?: string;
  badge?: string;
  brandName?: string;
  platformPreset?: string;
  goalPreset?: string;
  layoutPreset?: string;
  scenePreset?: ScenePresetSlug | "";
  sceneMood?: SceneMoodSlug | "";
  sceneProps?: ScenePropSlug[];
  compositionFlags?: string[];
  logoUploads?: string[];
  productUploads?: string[];
  backgroundUploads?: string[];
  premiumOverlayEnabled?: boolean;
  premiumOverlayUrls?: string[];
  designerMode?: boolean;
  batchCount?: number;
  intensity?: number;
  finish?: string;
  subjectType?: string;
  framing?: string;
  expression?: string;
  action?: string;
  lightingSetup?: string;
  temperature?: string;
  mood?: string;
  macroStyle?: string;
  visualStyle?: string[];
  assetsHighlights?: string[];
  contextProps?: string[];
  materialFeel?: string;
  lens?: string;
  depth?: string;
  angle?: string;
  motion?: string;
  advancedOpen?: boolean;
  layoutBase?: string;
  safeSpace?: string;
  extraDetails?: string;
}

export interface ProjectSpec {
  module: ModuleType;
  format: ProjectFormat;
  photoAspect?: "1:1" | "4:5" | "3:2" | "4:3" | "16:9" | "9:16";
  stylePreset: StylePreset;
  templateId: TemplateId;
  contextText?: string;
  subjectText?: string;
  styleText?: string;
  cameraText?: string;
  compositionText?: string;
  subjectImageUrl?: string | null;
  subjectImagePath?: string | null;
  contextOpen?: boolean;
  /** @deprecated Legacy free-text builder fields (ignored in V1.7) */
  lightingText?: string;
  assetsText?: string;
  promptDebug?: boolean;
  builder?: BuilderSpec;
  referenceImages?: ReferenceImage[];
  /** @deprecated Use referenceImages instead. */
  referenceImageUrl?: string | null;

  content: ContentSpec;
  brand: BrandSpec;
  assets: AssetsSpec;
  ecomV2?: EcomV2Spec;
  effects: EffectsSpec;

  generation: GenerationParams;
}

export interface Generation {
  id: string;
  projectId: string;
  status: "queued" | "running" | "done" | "error";
  imageUrl?: string;
  signedUrl?: string;
  bucket?: string;
  path?: string;
  provider?: string;
  mime?: string;
  width?: number;
  height?: number;
  creditsUsed?: number;
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
