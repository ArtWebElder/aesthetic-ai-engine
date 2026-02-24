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
  const normalizeText = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

  const presetIntensity =
    typeof preset.intensity === "number" && Number.isFinite(preset.intensity)
      ? preset.intensity
      : 70;
  const rawIntensity =
    typeof mergedBuilder.intensity === "number" && Number.isFinite(mergedBuilder.intensity)
      ? mergedBuilder.intensity
      : presetIntensity;
  const normalizedIntensity = Math.max(0, Math.min(100, Math.round(rawIntensity)));

  const resolvedLens = normalizeText(mergedBuilder.lens) || normalizeText(preset.lens);
  const resolvedDepth = normalizeText(mergedBuilder.depth) || normalizeText(preset.depth);
  const resolvedAngle = normalizeText(mergedBuilder.angle) || normalizeText(preset.angle);
  const resolvedLightingSetup =
    normalizeText(mergedBuilder.lightingSetup) || normalizeText(preset.lightingSetup);
  const resolvedMood = normalizeText(mergedBuilder.mood) || normalizeText(preset.mood);
  const resolvedTemperature =
    normalizeText(mergedBuilder.temperature) || normalizeText(preset.temperature);

  const nextBuilder = {
    ...mergedBuilder,
    subjectType: baseBuilder.subjectType,
    extraDetails: baseBuilder.extraDetails,
    assetsHighlights: baseBuilder.assetsHighlights,
    contextProps: baseBuilder.contextProps,
    lens: resolvedLens,
    depth: resolvedDepth,
    angle: resolvedAngle,
    lightingSetup: resolvedLightingSetup,
    mood: resolvedMood,
    temperature: resolvedTemperature,
    intensity: normalizedIntensity,
    visualStyle: [],
    macroStyle: "",
    layoutBase: "",
    safeSpace: "",
    motion: "static",
    finish: (mergedBuilder.finish ?? "").trim() || "true_to_life",
  };

  return {
    ...spec,
    builder: nextBuilder,
  };
}
