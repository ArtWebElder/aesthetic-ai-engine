import type { ModuleType, ScenePresetSlug } from "@/types/spec";

export const SCENE_PRESET_OPTIONS: readonly ScenePresetSlug[] = [
  "studio_white",
  "studio_dark",
  "studio_gradient",
  "lifestyle_home",
  "luxury_interior",
  "urban_day",
  "urban_night",
  "nature_outdoor",
  "minimal_texture",
  "editorial_backdrop",
] as const;

const SCENE_PRESET_SET = new Set<string>(SCENE_PRESET_OPTIONS);

const SCENE_PRESET_DEFAULTS: Record<"social_post" | "ecom" | "photoshoot", ScenePresetSlug> = {
  social_post: "studio_gradient",
  ecom: "minimal_texture",
  photoshoot: "studio_white",
};

const SCENE_PRESET_DESCRIPTIONS: Record<ScenePresetSlug, string> = {
  studio_white: "clean seamless white studio background, soft shadows",
  studio_dark: "dark matte studio backdrop, rim light, high contrast",
  studio_gradient: "soft gradient studio backdrop, smooth falloff",
  lifestyle_home: "modern home interior, natural window light",
  luxury_interior: "high-end interior, marble/wood, warm cinematic light",
  urban_day: "modern city environment, natural daylight",
  urban_night: "city night scene, neon accents, cinematic",
  nature_outdoor: "outdoor natural environment, soft sunlight",
  minimal_texture: "neutral textured background, subtle material",
  editorial_backdrop: "editorial photo backdrop, fashion magazine style",
};

function normalizeModuleForScenePreset(
  module: ModuleType | "ecom_banner" | string
): keyof typeof SCENE_PRESET_DEFAULTS | null {
  if (module === "photoshoot") return "photoshoot";
  if (module === "ecom" || module === "ecom_banner") return "ecom";
  if (module === "social_post") return "social_post";
  return null;
}

export function isScenePresetSlug(value: string): value is ScenePresetSlug {
  return SCENE_PRESET_SET.has(value);
}

export function getDefaultScenePreset(
  module: ModuleType | "ecom_banner" | string
): ScenePresetSlug | "" {
  const normalizedModule = normalizeModuleForScenePreset(module);
  if (!normalizedModule) return "";
  return SCENE_PRESET_DEFAULTS[normalizedModule];
}

export function normalizeScenePreset(
  value: string | null | undefined,
  module: ModuleType | "ecom_banner" | string
): ScenePresetSlug | "" {
  const normalized = (value ?? "").trim();
  const normalizedModule = normalizeModuleForScenePreset(module);
  if (!normalizedModule) return "";
  if (isScenePresetSlug(normalized)) return normalized;
  return SCENE_PRESET_DEFAULTS[normalizedModule];
}

export function getScenePresetLabelKey(scenePreset: ScenePresetSlug): string {
  return `editor.scene.preset.options.${scenePreset}`;
}

export function getScenePresetDescription(scenePreset: string | null | undefined): string | null {
  const normalized = (scenePreset ?? "").trim();
  if (!isScenePresetSlug(normalized)) return null;
  return SCENE_PRESET_DESCRIPTIONS[normalized];
}
