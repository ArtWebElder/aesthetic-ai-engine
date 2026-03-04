// src/features/engine/prompt-summarizer.ts
// Converte ProjectSpec em uma descrição legível para o usuário final (PT-BR).

import type { ProjectSpec } from "@/types/spec";

export interface PromptSummary {
  /** Frase principal descrevendo o cenário */
  scene: string;
  /** Descrição da iluminação e atmosfera */
  lighting: string | null;
  /** Efeitos/elementos ativos (vidro voando, bokeh, névoa, etc.) */
  effects: string[];
  /** Resumo dos textos na imagem */
  textLayer: string | null;
  /** Assets presentes (produto, sujeito, overlay) */
  assets: string[];
}

// ─── Labels PT-BR ─────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  social_post: "post para redes sociais",
  ecom_banner: "banner de e-commerce",
  photoshoot: "fotoshoot editorial",
};

const SCENE_LABELS: Record<string, string> = {
  studio_white: "estúdio branco e limpo",
  studio_dark: "estúdio escuro com contraluz",
  studio_gradient: "estúdio com fundo gradiente suave",
  lifestyle_home: "ambiente doméstico moderno",
  luxury_interior: "interior de luxo com mármore e madeira",
  urban_day: "cenário urbano com luz do dia",
  urban_night: "cena noturna urbana com neons",
  nature_outdoor: "ambiente natural ao ar livre",
  minimal_texture: "fundo neutro com textura sutil",
  editorial_backdrop: "fundo editorial estilo revista",
};

const MOOD_LABELS: Record<string, string> = {
  clean_bright: "limpa e bem iluminada",
  warm_cozy: "quente e aconchegante",
  cool_modern: "fria e moderna",
  cinematic_moody: "cinematográfica e dramática",
  luxury_premium: "luxuosa e premium",
  energetic_pop: "energética e vibrante",
  natural_authentic: "natural e autêntica",
  night_neon: "noturna com acentos neon",
};

const LIGHTING_LABELS: Record<string, string> = {
  studio_softbox: "softbox de estúdio",
  natural_window: "luz natural de janela",
  golden_hour: "luz dourada de pôr do sol",
  dramatic_rim: "contraluz dramático",
};

const TEMPERATURE_LABELS: Record<string, string> = {
  warm: "tons quentes",
  neutral: "tons neutros",
  cool: "tons frios",
};

const PROP_LABELS: Record<string, string> = {
  soft_shadow: "sombra suave no chão",
  reflection_surface: "superfície refletiva",
  floating_elements: "fragmentos de vidro flutuando no ar",
  bokeh_lights: "luzes desfocadas ao fundo",
  smoke_haze: "névoa e fumaça sutil",
  plants_greenery: "plantas e vegetação decorativa",
  paper_texture: "textura de papel/grão",
  marble_stone: "base de mármore ou pedra",
  wood_warm: "superfície de madeira aquecida",
  neon_glow: "brilho neon colorido",
};

const EFFECTS_LABELS: Record<string, string> = {
  clean: "limpos e legíveis",
  bold: "em negrito com alto contraste",
  glass: "com efeito vidro translúcido",
  neon: "com brilho neon",
};

const STYLE_PRESET_LABELS: Record<string, string> = {
  minimal_clean: "estilo minimalista",
  bold_ads: "estilo publicitário impactante",
  glass: "estilo glassmorphism",
  editorial: "estilo editorial",
  clean_modern: "estilo moderno e limpo",
};

// ─── Summarizer ───────────────────────────────────────────────────────────────

export function summarizeSpec(spec: ProjectSpec): PromptSummary {
  const { module, builder, content, effects, assets } = spec;

  // Cena principal
  const sceneParts: string[] = [];
  const moduleLabel = MODULE_LABELS[module] ?? module;
  // Capitaliza primeiro caractere
  sceneParts.push(moduleLabel.charAt(0).toUpperCase() + moduleLabel.slice(1));

  if (builder?.scenePreset && SCENE_LABELS[builder.scenePreset]) {
    sceneParts.push(`em ${SCENE_LABELS[builder.scenePreset]}`);
  }

  if (builder?.sceneMood && MOOD_LABELS[builder.sceneMood]) {
    sceneParts.push(`com atmosfera ${MOOD_LABELS[builder.sceneMood]}`);
  }

  const styleLabel = spec.stylePreset ? STYLE_PRESET_LABELS[spec.stylePreset] : null;
  if (styleLabel) {
    sceneParts.push(`no ${styleLabel}`);
  }

  // Iluminação
  let lighting: string | null = null;
  if (builder?.lightingSetup && LIGHTING_LABELS[builder.lightingSetup]) {
    const tempLabel = builder.temperature ? TEMPERATURE_LABELS[builder.temperature] : null;
    lighting = `Iluminação: ${LIGHTING_LABELS[builder.lightingSetup]}${tempLabel ? ` · ${tempLabel}` : ""}`;
  } else if (builder?.mood) {
    lighting = `Atmosfera ${builder.mood}`;
  }

  // Efeitos/props de cena (overlays visuais)
  const activeEffects: string[] = [];
  if (builder?.sceneProps?.length) {
    for (const prop of builder.sceneProps) {
      if (PROP_LABELS[prop]) {
        activeEffects.push(PROP_LABELS[prop]);
      }
    }
  }
  if (builder?.premiumOverlayEnabled && builder?.premiumOverlayUrls?.length) {
    activeEffects.push("overlay premium personalizado");
  }

  // Textos na imagem
  let textLayer: string | null = null;
  const effectPreset = effects?.preset ?? "clean";
  const effectLabel = EFFECTS_LABELS[effectPreset] ?? "limpos";
  const textParts: string[] = [];
  if (content?.headline) textParts.push(`"${content.headline}"`);
  if (content?.ctaText) textParts.push(`botão "${content.ctaText}"`);
  if (content?.price) textParts.push(`preço "${content.price}"`);

  if (textParts.length > 0) {
    textLayer = `Textos ${textParts.join(", ")} — estilo ${effectLabel}`;
  } else if (effectLabel) {
    textLayer = `Textos com estilo ${effectLabel}`;
  }

  // Assets
  const assetList: string[] = [];
  if (spec.subjectImageUrl || builder?.subjectType) {
    const subjectLabel = builder?.subjectType ?? "sujeito enviado";
    assetList.push(`Sujeito: ${subjectLabel}`);
  }
  if (assets?.productImageUrl || builder?.productUploads?.length) {
    assetList.push("Produto em destaque");
  }
  if (spec.referenceImageUrl || (spec.referenceImages?.length ?? 0) > 0) {
    assetList.push(`${spec.referenceImages?.length ?? 1} imagem(ns) de referência`);
  }

  return {
    scene: sceneParts.join(" "),
    lighting,
    effects: activeEffects,
    textLayer,
    assets: assetList,
  };
}
