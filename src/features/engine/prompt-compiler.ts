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
  const { module, stylePreset, templateId, content, brand, effects, generation } =
    spec;

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

  // A ideia é: a imagem base NÃO precisa “escrever” o texto certo
  // (isso a gente renderiza em HTML/CSS). Aqui só reservamos espaço e estética.
  const prompt = [
    moduleBase,
    styleHints,
    `template: ${templateId}`,
    textHints,
    effectsHints,
    "ultra sharp, premium, realistic details, no waxy skin, natural colors",
  ].join(", ");

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
