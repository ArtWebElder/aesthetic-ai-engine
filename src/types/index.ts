import type { ProjectFormat, StylePreset } from "./spec";

export type { StylePreset } from "./spec";

export type ProjectType = "social_post" | "ecom_banner" | "photoshoot";

export type FormatPreset = ProjectFormat;

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface Generation {
  id: string;
  projectId: string;
  status: GenerationStatus;
  createdAt: string;
}

export interface CreditBalance {
  current: number;
}

export interface Template {
  id: string;
  name: string;
  category: "social" | "ecom" | "photoshoot";
}

export const FORMAT_OPTIONS: Record<ProjectType, { value: FormatPreset; label: string }[]> = {
  social_post: [
    { value: "feed_1080x1350", label: "Feed 1080×1350" },
    { value: "feed_1080", label: "Feed 1080×1080" },
    { value: "story_1080x1920", label: "Story 1080×1920" },
    { value: "landscape_1200x628", label: "Landscape 1200×628" },
  ],
  ecom_banner: [
    { value: "ecom_desktop_1920x800", label: "Desktop 1920×800" },
    { value: "ecom_notebook_1366x768", label: "Notebook 1366×768" },
    { value: "ecom_mobile_1080x1350", label: "Mobile 1080×1350" },
    { value: "ecom_custom", label: "Custom (default 1920×800)" },
  ],
  photoshoot: [{ value: "square_1024", label: "Square 1024×1024" }],
};

export const STYLE_PRESETS: { value: StylePreset; label: string; labelKey?: string }[] = [
  { value: "minimal_clean", label: "Minimal Clean", labelKey: "editor.style_preset.minimal_clean" },
  { value: "bold_ads", label: "Bold Ads", labelKey: "editor.style_preset.bold_ads" },
  { value: "glass", label: "Glass", labelKey: "editor.style_preset.glass" },
  { value: "editorial", label: "Editorial", labelKey: "editor.style_preset.editorial" },
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  social_post: "Social Post",
  ecom_banner: "E-com Banner",
  photoshoot: "Photoshoot",
};
