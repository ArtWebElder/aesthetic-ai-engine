import type { ModuleType, SceneMoodSlug } from "@/types/spec";

export const SCENE_MOOD_OPTIONS: readonly SceneMoodSlug[] = [
  "clean_bright",
  "warm_cozy",
  "cool_modern",
  "cinematic_moody",
  "luxury_premium",
  "energetic_pop",
  "natural_authentic",
  "night_neon",
] as const;

const SCENE_MOOD_SET = new Set<string>(SCENE_MOOD_OPTIONS);

const SCENE_MOOD_DEFAULTS: Record<ModuleType, SceneMoodSlug> = {
  social_post: "energetic_pop",
  ecom_banner: "luxury_premium",
  photoshoot: "clean_bright",
};

const SCENE_MOOD_DESCRIPTIONS: Record<SceneMoodSlug, string> = {
  clean_bright: "clean, bright, commercial",
  warm_cozy: "warm, cozy, inviting",
  cool_modern: "cool, modern, sleek",
  cinematic_moody: "cinematic, moody, dramatic shadows",
  luxury_premium: "luxury, premium, refined",
  energetic_pop: "energetic, vibrant, punchy",
  natural_authentic: "natural, authentic, documentary vibe",
  night_neon: "night, neon accents, high contrast",
};

export function isSceneMoodSlug(value: string): value is SceneMoodSlug {
  return SCENE_MOOD_SET.has(value);
}

export function getDefaultSceneMood(module: ModuleType): SceneMoodSlug {
  return SCENE_MOOD_DEFAULTS[module];
}

export function normalizeSceneMood(
  value: string | null | undefined,
  module: ModuleType
): SceneMoodSlug | "" {
  const normalized = (value ?? "").trim();
  if (isSceneMoodSlug(normalized)) return normalized;
  const fallback = getDefaultSceneMood(module);
  return fallback || "";
}

export function getSceneMoodLabelKey(sceneMood: SceneMoodSlug): string {
  return `editor.scene.mood.options.${sceneMood}`;
}

export function getSceneMoodDescription(sceneMood: string | null | undefined): string | null {
  const normalized = (sceneMood ?? "").trim();
  if (!isSceneMoodSlug(normalized)) return null;
  return SCENE_MOOD_DESCRIPTIONS[normalized];
}
