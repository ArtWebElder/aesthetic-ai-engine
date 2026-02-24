import type { ProjectSpec } from "@/types/spec";

export type PhotoshootPresetId =
  | "studio_product"
  | "editorial_portrait"
  | "food_hero"
  | "lifestyle"
  | "onwhite_ecom";

export const PHOTOSHOOT_PRESET_OPTIONS: { id: PhotoshootPresetId; label: string }[] = [
  { id: "studio_product", label: "Studio Product" },
  { id: "editorial_portrait", label: "Editorial Portrait" },
  { id: "food_hero", label: "Food Hero" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "onwhite_ecom", label: "On White Ecom" },
];

export const PHOTOSHOOT_PRESETS: Record<PhotoshootPresetId, Partial<ProjectSpec["builder"]>> = {
  studio_product: {
    lens: "85mm",
    depth: "all_in_focus",
    angle: "eye_level",
    lightingSetup: "studio_softbox",
    mood: "clean",
    temperature: "neutral",
    finish: "true_to_life",
    intensity: 52,
  },
  editorial_portrait: {
    lens: "85mm",
    depth: "strong_bokeh",
    angle: "eye_level",
    lightingSetup: "natural_window",
    mood: "premium",
    temperature: "warm",
    finish: "editorial_soft",
    intensity: 60,
  },
  food_hero: {
    lens: "50mm",
    depth: "medium_bokeh",
    angle: "angle_45",
    lightingSetup: "natural_window",
    mood: "energetic",
    temperature: "warm",
    finish: "high_key_clean",
    intensity: 58,
  },
  lifestyle: {
    lens: "35mm",
    depth: "medium_bokeh",
    angle: "eye_level",
    lightingSetup: "golden_hour",
    mood: "calm",
    temperature: "warm",
    finish: "true_to_life",
    intensity: 55,
  },
  onwhite_ecom: {
    lens: "85mm",
    depth: "all_in_focus",
    angle: "eye_level",
    lightingSetup: "studio_softbox",
    mood: "clean",
    temperature: "neutral",
    finish: "high_key_clean",
    intensity: 50,
  },
};

export function applyPhotoshootPreset(
  spec: ProjectSpec,
  presetId: PhotoshootPresetId
): ProjectSpec {
  if (spec.module !== "photoshoot") return spec;

  const baseBuilder = spec.builder ?? {};
  const preset = PHOTOSHOOT_PRESETS[presetId];
  const mergedBuilder = { ...baseBuilder, ...preset };

  return {
    ...spec,
    builder: {
      ...mergedBuilder,
      subjectType: baseBuilder.subjectType,
      extraDetails: baseBuilder.extraDetails,
      motion: "static",
      finish: (mergedBuilder.finish ?? "").trim() || "true_to_life",
    },
  };
}
