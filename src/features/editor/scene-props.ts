import type { ModuleType, ScenePropSlug } from "@/types/spec";

export const SCENE_PROP_OPTIONS: readonly ScenePropSlug[] = [
  "soft_shadow",
  "reflection_surface",
  "floating_elements",
  "bokeh_lights",
  "smoke_haze",
  "plants_greenery",
  "paper_texture",
  "marble_stone",
  "wood_warm",
  "neon_glow",
] as const;

const SCENE_PROP_SET = new Set<string>(SCENE_PROP_OPTIONS);

const SCENE_PROP_DEFAULTS: Record<ModuleType, ScenePropSlug[]> = {
  social_post: ["floating_elements", "bokeh_lights"],
  ecom_banner: ["soft_shadow", "reflection_surface"],
  photoshoot: ["soft_shadow"],
};

const SCENE_PROP_DESCRIPTIONS: Record<ScenePropSlug, string> = {
  soft_shadow: "soft grounded shadow",
  reflection_surface: "subtle reflection surface",
  floating_elements: "floating shapes, light particles",
  bokeh_lights: "bokeh lights",
  smoke_haze: "subtle haze",
  plants_greenery: "plants / greenery accent",
  paper_texture: "paper / grain texture",
  marble_stone: "marble / stone base",
  wood_warm: "wood surface",
  neon_glow: "neon glow accents",
};

export function isScenePropSlug(value: string): value is ScenePropSlug {
  return SCENE_PROP_SET.has(value);
}

export function getDefaultSceneProps(module: ModuleType): ScenePropSlug[] {
  return [...SCENE_PROP_DEFAULTS[module]];
}

export function normalizeSceneProps(values: unknown, module: ModuleType): ScenePropSlug[] {
  if (!Array.isArray(values)) {
    return getDefaultSceneProps(module);
  }
  const rawValues = values;
  const normalized = Array.from(
    new Set(
      rawValues
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(isScenePropSlug)
    )
  );
  return normalized;
}

export function getScenePropLabelKey(sceneProp: ScenePropSlug): string {
  return `editor.scene.props.options.${sceneProp}`;
}

export function getScenePropDescription(sceneProp: string | null | undefined): string | null {
  const normalized = (sceneProp ?? "").trim();
  if (!isScenePropSlug(normalized)) return null;
  return SCENE_PROP_DESCRIPTIONS[normalized];
}
