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
    styleText,
    cameraText,
    compositionText,
    subjectImageUrl,
    lightingText,
    assetsText,
    builder,
    referenceImages,
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

  const safeEffects = effects ?? { textOutline: 0, shadow: 0, depth3d: 0, tilt: 0 };
  const effectsHints = `text style: outline=${safeEffects.textOutline}/10 shadow=${safeEffects.shadow}/10 depth=${safeEffects.depth3d}/10 tilt=${safeEffects.tilt}deg`;
  const cleanedContext = contextText?.trim();
  const cleanedSubject = subjectText?.trim();
  const cleanedStyle = styleText?.trim();
  const cleanedCamera = cameraText?.trim();
  const cleanedComposition = compositionText?.trim();
  const cleanedSubjectImage = subjectImageUrl?.trim();
  const cleanedLighting = lightingText?.trim();
  const cleanedAssets = assetsText?.trim();
  const cleanedBuilder = {
    subjectType: builder?.subjectType?.trim() ?? "",
    framing: builder?.framing?.trim() ?? "",
    expression: builder?.expression?.trim() ?? "",
    action: builder?.action?.trim() ?? "",
    lightingSetup: builder?.lightingSetup?.trim() ?? "",
    temperature: builder?.temperature?.trim() ?? "",
    mood: builder?.mood?.trim() ?? "",
    macroStyle: builder?.macroStyle?.trim() ?? "",
    visualStyle: (builder?.visualStyle ?? []).filter((v): v is string => Boolean(v?.trim())),
    layoutBase: builder?.layoutBase?.trim() ?? "",
    safeSpace: builder?.safeSpace?.trim() ?? "",
    extraDetails: builder?.extraDetails?.trim() ?? "",
  };
  const cleanedReferenceImage = referenceImageUrl?.trim();
  const subjectReferenceLine = cleanedSubjectImage
    ? cleanedSubjectImage.startsWith("data:")
      ? "Subject reference image: uploaded (embedded)"
      : `Subject reference image: ${cleanedSubjectImage}`
    : null;
  const normalizedReferences = (referenceImages ?? [])
    .filter((entry) => Boolean(entry?.url))
    .map((entry) => ({
      role: entry.role ?? "style",
      weight:
        typeof entry.weight === "number"
          ? Math.max(0, Math.min(100, Math.round(entry.weight)))
          : 70,
      lockRealism: Boolean(entry.lockRealism),
      notes: entry.notes?.trim() ?? "",
      url: entry.url?.trim() ?? "",
    }));
  if (normalizedReferences.length === 0 && cleanedReferenceImage) {
    normalizedReferences.push({
      role: "style",
      weight: 70,
      lockRealism: false,
      notes: "",
      url: cleanedReferenceImage,
    });
  }
  const referenceImageLines = normalizedReferences.map((entry) => {
    const source = entry.url.startsWith("data:") ? "uploaded (embedded)" : entry.url;
    const notesSuffix = entry.notes ? ` - ${entry.notes}` : "";
    const lockRealismFlag = entry.lockRealism ? "Y" : "N";
    return `Reference image (${entry.role}, weight=${entry.weight}, lockRealism=${lockRealismFlag}): ${source}${notesSuffix}`;
  });
  const builderSubjectLine =
    cleanedBuilder.subjectType ||
    cleanedBuilder.framing ||
    cleanedBuilder.expression ||
    cleanedBuilder.action
      ? `Builder Subject: ${cleanedBuilder.subjectType || "n/a"}, framing=${cleanedBuilder.framing || "n/a"}, expression=${cleanedBuilder.expression || "n/a"}, action=${cleanedBuilder.action || "n/a"}`
      : null;
  const builderLightingLine =
    cleanedBuilder.lightingSetup || cleanedBuilder.temperature || cleanedBuilder.mood
      ? `Builder Lighting: setup=${cleanedBuilder.lightingSetup || "n/a"}, temp=${cleanedBuilder.temperature || "n/a"}, mood=${cleanedBuilder.mood || "n/a"}`
      : null;
  const builderStyleLine =
    cleanedBuilder.macroStyle || cleanedBuilder.visualStyle.length > 0
      ? `Builder Style: macro=${cleanedBuilder.macroStyle || "n/a"}, visual=${cleanedBuilder.visualStyle.join(", ") || "n/a"}`
      : null;
  const builderCompositionLine =
    cleanedBuilder.layoutBase || cleanedBuilder.safeSpace
      ? `Builder Composition: layout=${cleanedBuilder.layoutBase || "n/a"}, safeSpace=${cleanedBuilder.safeSpace || "n/a"}`
      : null;
  const builderExtraDetailsLine = cleanedBuilder.extraDetails
    ? `Builder Extra details: ${cleanedBuilder.extraDetails}`
    : null;
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
    cleanedSubject ? `Main subject: ${cleanedSubject}` : null,
    cleanedStyle ? `Style direction: ${cleanedStyle}` : null,
    cleanedCamera ? `Camera / lens: ${cleanedCamera}` : null,
    cleanedComposition ? `Composition / layout: ${cleanedComposition}` : null,
    cleanedLighting ? `Lighting / mood: ${cleanedLighting}` : null,
    cleanedAssets ? `Assets / elements: ${cleanedAssets}` : null,
    subjectReferenceLine,
    cleanedContext ? `context: ${cleanedContext}` : null,
    ...referenceImageLines,
    builderSubjectLine,
    builderLightingLine,
    builderStyleLine,
    builderCompositionLine,
    builderExtraDetailsLine,
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
