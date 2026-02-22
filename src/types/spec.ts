// src/types/spec.ts

export type ModuleType = "social" | "ecom" | "photoshoot";

export type SocialFormat =
  | "feed_1080"
  | "feed_1080x1350"
  | "story_1080x1920"
  | "landscape_1200x628";

export type EcomFormat = "ecom_desktop_1920x800" | "ecom_mobile_1080x1350";

export type PhotoshootFormat = "square_1024";

export type ProjectFormat = SocialFormat | EcomFormat | PhotoshootFormat;

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
  | "photo_02";

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
  primary: string; // token name or hex later
  secondary: string;
  accent: string;
  accentMode: AccentMode;
  fontPreset: FontPreset; // UI preset only (global fonts remain default in MVP)
  autoContrast: boolean;
  logoUrl?: string; // placeholder, later: storage
}

export interface AssetsSpec {
  productImageUrl?: string;
  extraImageUrl?: string;
  referenceImageUrl?: string; // for style/pose reference
  autoRemoveBg: boolean;
}

export interface EffectsSpec {
  preset: "clean" | "bold" | "glass" | "neon";
  textOutline: number; // 0..10
  shadow: number; // 0..10
  depth3d: number; // 0..10
  tilt: number; // -15..+15
}

export interface GenerationParams {
  aspectRatio: string; // e.g. "1:1", "4:5", "9:16", "1.91:1"
  width: number;
  height: number;
  quality: "standard" | "high";
}

export interface ProjectSpec {
  module: ModuleType;
  format: ProjectFormat;
  stylePreset: StylePreset;
  templateId: TemplateId;

  content: ContentSpec;
  brand: BrandSpec;
  assets: AssetsSpec;
  effects: EffectsSpec;

  // later used by /api/generate (or server action)
  generation: GenerationParams;
}

export interface Project {
  id: string;
  name: string;
  spec: ProjectSpec;
  status: "draft" | "generated";
  createdAt: string;
  updatedAt: string;
}