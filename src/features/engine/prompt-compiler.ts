// src/features/engine/prompt-compiler.ts

import type { ProjectSpec } from "@/types/spec";

export interface CompiledPrompt {
  prompt: string;
  negativePrompt: string;
  meta: {
    stylePreset: string;
    aspectRatio: string;
    size: { w: number; h: number };
  };
}

/**
 * V1 (placeholder): compila o Spec em um prompt consistente.
 * Depois você vai evoluir isso com:
 * - templates por módulo
 * - "brand voice" e regras de safe-area
 * - inputs de produto + background
 * - prompt blocks (tipo JSON -> texto final)
 */
export function compilePrompt(spec: ProjectSpec): CompiledPrompt {
  const {
    module,
    stylePreset,
    templateId,
    content,
    brand,
    effects,
    generation,
    contextText,
    subjectText,
    lightingText,
    assetsText,
    referenceImageUrl,
  } = spec;

  // Prompts-base por módulo (bem simples agora)
  const moduleBase =
    module === "social"
      ? "high-performing social ad creative, bold typography area reserved, modern commercial look"
      : module === "ecom"
      ? "e-commerce promotional banner, premium minimal layout, product-focused composition"
      : "professional photoshoot, realistic studio lighting, clean editorial look";

  const styleHints =
    stylePreset === "glass"
      ? "subtle glassmorphism, soft blur surfaces, thin borders"
      : stylePreset === "minimal_clean"
      ? "minimal, lots of negative space, clean composition"
      : stylePreset === "bold_ads"
      ? "high-contrast, punchy, strong hierarchy"
      : "editorial, premium, soft contrast";

  const textHints =
    content.headline || content.subheadline
      ? "leave safe space for text overlay, no unreadable tiny text in the image"
      : "no text";

  const effectsHints = `text style: outline=${effects.textOutline}/10 shadow=${effects.shadow}/10 depth=${effects.depth3d}/10 tilt=${effects.tilt}deg`;
  const cleanedContext = contextText?.trim();
  const cleanedSubject = subjectText?.trim();
  const cleanedLighting = lightingText?.trim();
  const cleanedAssets = assetsText?.trim();
  const cleanedReferenceImage = referenceImageUrl?.trim();
  const paletteMode = brand.paletteMode ?? "mono";
  const paletteGuidance =
    paletteMode === "mono"
      ? "single-accent palette with clean neutrals"
      : paletteMode === "duo"
      ? "two-color harmony between primary and secondary"
      : paletteMode === "tri"
      ? "three-color balanced palette with controlled contrast"
      : "custom palette with explicit brand color roles";
  const primaryColor = brand.accent || brand.primary;
  const secondaryColor = brand.accent2 ?? brand.secondary;
  const neutralBackground = brand.neutralBg ?? "#0f172a";
  const surfaceColor = brand.neutralSurface ?? "#1e293b";
  const textColor = brand.neutralText ?? brand.primary ?? "#ffffff";
  const realismValue =
    typeof generation.realism === "number"
      ? Math.max(0, Math.min(100, Math.round(generation.realism)))
      : null;

  // A ideia é: a imagem base NÃO precisa “escrever” o texto certo
  // (isso a gente renderiza em HTML/CSS). Aqui só reservamos espaço e estética.
  const prompt = [
    moduleBase,
    styleHints,
    `template: ${templateId}`,
    textHints,
    effectsHints,
    `Color palette mode: ${paletteMode}`,
    `Palette guidance: ${paletteGuidance}`,
    `Primary color: ${primaryColor}`,
    `Secondary color: ${secondaryColor}`,
    `Neutral background: ${neutralBackground}`,
    `Surface color: ${surfaceColor}`,
    `Text color: ${textColor}`,
    cleanedContext ? `context: ${cleanedContext}` : null,
    cleanedSubject ? `Main subject: ${cleanedSubject}` : null,
    cleanedLighting ? `Lighting / mood: ${cleanedLighting}` : null,
    cleanedAssets ? `Assets / elements: ${cleanedAssets}` : null,
    cleanedReferenceImage ? `Reference image: ${cleanedReferenceImage}` : null,
    realismValue !== null ? `Realism level: ${realismValue}%` : null,
    "ultra sharp, premium, realistic details, no waxy skin, natural colors",
  ]
    .filter(Boolean)
    .join(", ");

  const negativePrompt = [
    "low quality",
    "blurry",
    "over-saturated",
    "waxy skin",
    "bad anatomy",
    "distorted face",
    "garbled text",
    "watermark",
    "logo artifacts",
    "extra fingers",
  ].join(", ");

  return {
    prompt,
    negativePrompt,
    meta: {
      stylePreset,
      aspectRatio: generation.aspectRatio,
      size: { w: generation.width, h: generation.height },
    },
  };
}
