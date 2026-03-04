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
  clean_bright:
    "clean bright commercial studio, 45° overhead softbox, pure white or light gray seamless background, high-key lighting with soft fill, no harsh shadows, crisp product-focused clarity",
  warm_cozy:
    "warm golden hour window light at 2700K color temperature, soft natural fill from opposite side, home interior or café environment props, shallow depth of field on background elements, organic warm atmosphere",
  cool_modern:
    "cool daylight-balanced lighting at 5500K, architectural or minimal interior space, geometric hard shadows as design element, sleek contemporary feel, strong lines and planes of light",
  cinematic_moody:
    "dramatic 3-point lighting setup: soft key light from front, intense purple/magenta rim light from behind creating a glowing halo around the subject, dark fill side creating deep shadows; aggressive background bokeh at f/1.4 aperture; airborne particles in the air (sparks, glowing embers, light dust); high contrast with deep blacks and saturated highlights; cinematic color grading",
  luxury_premium:
    "soft diffused natural window light creating even flat illumination, near-white or cool gray neutral background, near-zero harsh shadows, bipartite composition with subject occupying 55–65% of frame, intentional negative space for text placement, high-end architectural studio aesthetic",
  energetic_pop:
    "punchy high-contrast studio lighting, vivid saturated colors, dynamic diagonal composition, sharp crisp details, strong graphic feel, high-energy commercial advertising style, bold color contrast",
  natural_authentic:
    "golden hour natural sunlight from low angle, outdoor or organic natural environment, documentary-style candid framing, authentic real-world context, no artificial studio look, warm honest atmosphere",
  night_neon:
    "cold frontal key light with cyan/blue color cast, intense cyan/blue rim light from behind the subject, deep black background suggesting a tunnel or corridor with receding depth, floating 3D glass prisms and crystal fragments around the subject catching and refracting light, volumetric fog and god rays cutting through the darkness, monochromatic cyan-black color palette, extreme subject sharpness against a dark cinematic background",
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
