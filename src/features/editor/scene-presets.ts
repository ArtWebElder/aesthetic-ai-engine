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

const SCENE_PRESET_DEFAULTS: Record<"social_post" | "ecom_banner" | "photoshoot", ScenePresetSlug> = {
  social_post: "studio_gradient",
  ecom_banner: "minimal_texture",
  photoshoot: "studio_white",
};

const SCENE_PRESET_DESCRIPTIONS: Record<ScenePresetSlug, string> = {
  studio_white: "seamless white cyc studio, softbox at 45° overhead, clean catch light, infinite floor, product hero framing",
  studio_dark: "dark charcoal seamless backdrop, single rim light at 70° behind subject, high contrast pools of shadow",
  studio_gradient: "smooth warm-to-cool gradient backdrop, soft falloff from top center, vignette edges",
  lifestyle_home: "bright modern living room, floor-to-ceiling windows, natural diffused light at f/2.8, shallow depth of field",
  luxury_interior: "high-end penthouse interior, Carrara marble floor, brass fixtures, warm ambient at 2800K, volumetric ray from window",
  urban_day: "glass-and-steel city backdrop, midday natural light, lens flare at frame edge, environmental depth",
  urban_night: "city nightscape, wet streets reflecting neon signs, teal-orange cinematic grade, 35mm look",
  nature_outdoor: "lush golden-hour outdoor environment, backlit foliage, soft natural fill, textural ground detail",
  minimal_texture: "neutral off-white linen texture, ultra soft shadows, near-flat lighting, Scandinavian editorial feel",
  editorial_backdrop: "fashion-editorial paper backdrop with color treatment, dramatic directional light, high fashion context",
};

function normalizeModuleForScenePreset(
  module: ModuleType
): keyof typeof SCENE_PRESET_DEFAULTS | null {
  if (module === "photoshoot") return "photoshoot";
  if (module === "ecom_banner") return "ecom_banner";
  if (module === "social_post") return "social_post";
  return null;
}

export function isScenePresetSlug(value: string): value is ScenePresetSlug {
  return SCENE_PRESET_SET.has(value);
}

export function getDefaultScenePreset(
  module: ModuleType
): ScenePresetSlug | "" {
  const normalizedModule = normalizeModuleForScenePreset(module);
  if (!normalizedModule) return "";
  return SCENE_PRESET_DEFAULTS[normalizedModule];
}

export function normalizeScenePreset(
  value: string | null | undefined,
  module: ModuleType
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
