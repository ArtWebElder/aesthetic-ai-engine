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
  social_post: [],
  ecom_banner: [],
  photoshoot: [],
};

const SCENE_PROP_DESCRIPTIONS: Record<ScenePropSlug, string> = {
  soft_shadow: "soft elliptical ground shadow beneath subject, contact shadow at 15% opacity",
  reflection_surface: "polished floor reflection, mirrored base showing inverted subject at 40% opacity fade",
  floating_elements: "subtle translucent glass shards and geometric fragments floating in the scene, catching light refraction and specular highlights, soft depth-of-field separation between planes",
  bokeh_lights: "soft circular bokeh light orbs out-of-focus in the background, warm golden and cool blue light diffusion, shallow depth of field, atmospheric halo glow around light sources",
  smoke_haze: "atmospheric fog and soft volumetric smoke haze filling the lower and mid frame, light rays cutting through the mist, moody atmospheric depth",
  plants_greenery: "natural leaf and branch elements framing scene, depth-of-field greenery clusters at image border",
  paper_texture: "subtle film grain and paper fiber micro-texture across the entire image at 8% opacity",
  marble_stone: "Calacatta marble surface with gold veining as foreground base, sharp foreground detail",
  wood_warm: "warm oak or walnut wood-grain surface as base, soft specular highlight across grain",
  neon_glow: "vivid neon light bloom in cyan, purple and magenta tones, glowing light streaks and chromatic aberration at edges, dark background with high-contrast neon illumination casting colored shadows",
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

// ─── Grupos mutuamente exclusivos ─────────────────────────────────────────────
// Dentro de cada grupo, o usuário escolhe no máximo 1 opção (comportamento radio).
// Grupos diferentes podem ser combinados (máx. 1 por grupo = máx. 3 ativos total).

export type ScenePropGroupId = "surface" | "atmosphere" | "depth";

export const SCENE_PROP_GROUPS: ReadonlyArray<{
  id: ScenePropGroupId;
  labelKey: string;
  slugs: readonly ScenePropSlug[];
}> = [
  {
    id: "surface",
    labelKey: "editor.scene.props.group.surface",
    slugs: ["marble_stone", "wood_warm", "plants_greenery", "paper_texture"],
  },
  {
    id: "atmosphere",
    labelKey: "editor.scene.props.group.atmosphere",
    slugs: ["smoke_haze", "floating_elements", "bokeh_lights", "neon_glow"],
  },
  {
    id: "depth",
    labelKey: "editor.scene.props.group.depth",
    slugs: ["soft_shadow", "reflection_surface"],
  },
] as const;

/** Retorna o grupo ao qual o slug pertence, ou null se não estiver em nenhum grupo. */
export function getScenePropGroupId(slug: ScenePropSlug): ScenePropGroupId | null {
  for (const group of SCENE_PROP_GROUPS) {
    if ((group.slugs as readonly string[]).includes(slug)) return group.id;
  }
  return null;
}

/**
 * Aplica toggle com constraint de radio dentro de cada grupo.
 * - Se já ativo → desativa (toggle off)
 * - Se inativo + tem grupo → remove outros do mesmo grupo, adiciona este
 * - Se inativo + sem grupo → adiciona normalmente
 */
export function applyScenePropToggle(
  current: ScenePropSlug[],
  selected: ScenePropSlug,
): ScenePropSlug[] {
  const isActive = current.includes(selected);
  if (isActive) return current.filter((s) => s !== selected);

  const groupId = getScenePropGroupId(selected);
  if (!groupId) return [...current, selected];

  const group = SCENE_PROP_GROUPS.find((g) => g.id === groupId)!;
  const withoutGroup = current.filter((s) => !(group.slugs as readonly string[]).includes(s));
  return [...withoutGroup, selected];
}
