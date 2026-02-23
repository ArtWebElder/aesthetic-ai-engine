// src/features/engine/prompt-compiler.ts

import type { ProjectSpec } from "@/types/spec";
import {
  ACTION_OPTIONS,
  ANGLE_OPTIONS,
  ASSET_HIGHLIGHTS_OPTIONS,
  CONTEXT_PROPS_OPTIONS,
  DEPTH_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  LAYOUT_BASE_OPTIONS,
  LENS_OPTIONS,
  LIGHTING_SETUP_OPTIONS,
  MACRO_STYLE_OPTIONS,
  MATERIAL_FEEL_OPTIONS,
  MOOD_OPTIONS,
  SAFE_SPACE_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
  TEMPERATURE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/features/editor/editor-presets";

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
    promptDebug,
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
  const debugEnabled = Boolean(promptDebug);
  const cleanedBuilder = {
    intensity:
      typeof builder?.intensity === "number"
        ? Math.max(0, Math.min(100, Math.round(builder.intensity)))
        : 70,
    subjectType: builder?.subjectType?.trim() ?? "",
    framing: builder?.framing?.trim() ?? "",
    expression: builder?.expression?.trim() ?? "",
    action: builder?.action?.trim() ?? "",
    lightingSetup: builder?.lightingSetup?.trim() ?? "",
    temperature: builder?.temperature?.trim() ?? "",
    mood: builder?.mood?.trim() ?? "",
    macroStyle: builder?.macroStyle?.trim() ?? "",
    visualStyle: (builder?.visualStyle ?? []).filter((v): v is string => Boolean(v?.trim())),
    assetsHighlights: (builder?.assetsHighlights ?? []).filter(
      (v): v is string => Boolean(v?.trim())
    ),
    contextProps: (builder?.contextProps ?? []).filter((v): v is string => Boolean(v?.trim())),
    materialFeel: builder?.materialFeel?.trim() ?? "",
    lens: builder?.lens?.trim() ?? "",
    depth: builder?.depth?.trim() ?? "",
    angle: builder?.angle?.trim() ?? "",
    motion: builder?.motion?.trim() ?? "",
    layoutBase: builder?.layoutBase?.trim() ?? "",
    safeSpace: builder?.safeSpace?.trim() ?? "",
    extraDetails: builder?.extraDetails?.trim() ?? "",
  };
  const cleanedReferenceImage = referenceImageUrl?.trim();
  const toLabel = (
    value: string,
    options: Array<{ value: string; label: string }>
  ): string => options.find((opt) => opt.value === value)?.label ?? value;
  const toLabelList = (
    values: string[],
    options: Array<{ value: string; label: string }>
  ): string[] => values.map((value) => toLabel(value, options));
  const builderLabels = {
    subjectType: cleanedBuilder.subjectType
      ? toLabel(cleanedBuilder.subjectType, SUBJECT_TYPE_OPTIONS)
      : "",
    framing: cleanedBuilder.framing ? toLabel(cleanedBuilder.framing, FRAMING_OPTIONS) : "",
    expression: cleanedBuilder.expression
      ? toLabel(cleanedBuilder.expression, EXPRESSION_OPTIONS)
      : "",
    action: cleanedBuilder.action ? toLabel(cleanedBuilder.action, ACTION_OPTIONS) : "",
    lightingSetup: cleanedBuilder.lightingSetup
      ? toLabel(cleanedBuilder.lightingSetup, LIGHTING_SETUP_OPTIONS)
      : "",
    temperature: cleanedBuilder.temperature
      ? toLabel(cleanedBuilder.temperature, TEMPERATURE_OPTIONS)
      : "",
    mood: cleanedBuilder.mood ? toLabel(cleanedBuilder.mood, MOOD_OPTIONS) : "",
    macroStyle: cleanedBuilder.macroStyle
      ? toLabel(cleanedBuilder.macroStyle, MACRO_STYLE_OPTIONS)
      : "",
    visualStyle: toLabelList(cleanedBuilder.visualStyle, VISUAL_STYLE_OPTIONS),
    assetsHighlights: toLabelList(cleanedBuilder.assetsHighlights, ASSET_HIGHLIGHTS_OPTIONS),
    contextProps: toLabelList(cleanedBuilder.contextProps, CONTEXT_PROPS_OPTIONS),
    materialFeel: cleanedBuilder.materialFeel
      ? toLabel(cleanedBuilder.materialFeel, MATERIAL_FEEL_OPTIONS)
      : "",
    lens: cleanedBuilder.lens ? toLabel(cleanedBuilder.lens, LENS_OPTIONS) : "",
    depth: cleanedBuilder.depth ? toLabel(cleanedBuilder.depth, DEPTH_OPTIONS) : "",
    angle: cleanedBuilder.angle ? toLabel(cleanedBuilder.angle, ANGLE_OPTIONS) : "",
    motion: cleanedBuilder.motion ? toLabel(cleanedBuilder.motion, MOTION_OPTIONS) : "",
    layoutBase: cleanedBuilder.layoutBase
      ? toLabel(cleanedBuilder.layoutBase, LAYOUT_BASE_OPTIONS)
      : "",
    safeSpace: cleanedBuilder.safeSpace
      ? toLabel(cleanedBuilder.safeSpace, SAFE_SPACE_OPTIONS)
      : "",
  };
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
    const roleGuidance =
      entry.role === "style"
        ? "use for visual style (lighting, grading, textures)"
        : entry.role === "composition"
        ? "use for layout/composition (framing, spacing, safe areas)"
        : entry.role === "product"
        ? "use for product fidelity (shape, details, materials)"
        : entry.role === "brand"
        ? "use for brand identity (palette, tone, consistency)"
        : "general reference";
    return `Reference image (${entry.role}, weight=${entry.weight}, lockRealism=${lockRealismFlag}): ${source}; ${roleGuidance}${notesSuffix}`;
  });
  const builderSubjectLine =
    [
      builderLabels.subjectType ? `type=${builderLabels.subjectType}` : null,
      builderLabels.framing ? `framing=${builderLabels.framing}` : null,
      builderLabels.expression ? `expression=${builderLabels.expression}` : null,
      builderLabels.action ? `action=${builderLabels.action}` : null,
    ].filter(Boolean);
  const builderSubjectLineParts = builderSubjectLine.join(", ");
  const builderSubjectLineText =
    builderSubjectLineParts.length > 0 ? `Builder Subject: ${builderSubjectLineParts}` : null;
  const builderLightingParts = [
    builderLabels.lightingSetup ? `setup=${builderLabels.lightingSetup}` : null,
    builderLabels.temperature ? `temp=${builderLabels.temperature}` : null,
    builderLabels.mood ? `mood=${builderLabels.mood}` : null,
  ].filter(Boolean);
  const builderLightingLine =
    builderLightingParts.length > 0 ? `Builder Lighting: ${builderLightingParts.join(", ")}` : null;
  const builderStyleParts = [
    builderLabels.macroStyle ? `macro=${builderLabels.macroStyle}` : null,
    builderLabels.visualStyle.length > 0 ? `visual=${builderLabels.visualStyle.join(", ")}` : null,
  ].filter(Boolean);
  const builderStyleLine =
    builderStyleParts.length > 0 ? `Builder Style: ${builderStyleParts.join(", ")}` : null;
  const builderCompositionParts = [
    builderLabels.layoutBase ? `layout=${builderLabels.layoutBase}` : null,
    builderLabels.safeSpace ? `safeSpace=${builderLabels.safeSpace}` : null,
  ].filter(Boolean);
  const builderCompositionLine =
    builderCompositionParts.length > 0
      ? `Builder Composition: ${builderCompositionParts.join(", ")}`
      : null;
  const builderExtraDetailsLine = cleanedBuilder.extraDetails
    ? `Builder Extra details: ${cleanedBuilder.extraDetails}`
    : null;
  const builderAssetsSegments = [
    builderLabels.assetsHighlights.length > 0
      ? `highlights=${builderLabels.assetsHighlights.join(", ")}`
      : null,
    builderLabels.contextProps.length > 0 ? `props=${builderLabels.contextProps.join(", ")}` : null,
    builderLabels.materialFeel ? `material=${builderLabels.materialFeel}` : null,
  ].filter(Boolean);
  const builderAssetsLine =
    builderAssetsSegments.length > 0 ? `Builder Assets: ${builderAssetsSegments.join(", ")}` : null;
  const builderCameraSegments = [
    builderLabels.lens ? `lens=${builderLabels.lens}` : null,
    builderLabels.depth ? `depth=${builderLabels.depth}` : null,
    builderLabels.angle ? `angle=${builderLabels.angle}` : null,
    builderLabels.motion ? `motion=${builderLabels.motion}` : null,
  ].filter(Boolean);
  const builderCameraLine =
    builderCameraSegments.length > 0 ? `Builder Camera: ${builderCameraSegments.join(", ")}` : null;
  const sceneSubjectParts = [
    builderLabels.subjectType || null,
    builderLabels.framing || null,
    builderLabels.expression || null,
    builderLabels.action ? `action=${builderLabels.action}` : null,
  ].filter(Boolean);
  const sceneLightingCore = [
    builderLabels.lightingSetup || null,
    [builderLabels.temperature || null, builderLabels.mood || null]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const sceneLightingLine =
    sceneLightingCore.length > 0
      ? `lighting=${sceneLightingCore[0]}${sceneLightingCore[1] ? ` (${sceneLightingCore[1]})` : ""}`
      : null;
  const sceneStyleCore = [
    builderLabels.macroStyle || null,
    builderLabels.visualStyle.length > 0 ? builderLabels.visualStyle.join(", ") : null,
  ].filter(Boolean);
  const sceneStyleLine =
    sceneStyleCore.length > 0
      ? `style=${sceneStyleCore[0]}${sceneStyleCore[1] ? ` (${sceneStyleCore[1]})` : ""}`
      : null;
  const sceneCompositionParts = [
    builderLabels.layoutBase || null,
    builderLabels.safeSpace ? `safe space=${builderLabels.safeSpace}` : null,
  ].filter(Boolean);
  const sceneCompositionLine =
    sceneCompositionParts.length > 0 ? `composition=${sceneCompositionParts.join(", ")}` : null;
  const sceneAssetsParts = [
    builderLabels.assetsHighlights.length > 0
      ? `highlights(${builderLabels.assetsHighlights.join(", ")})`
      : null,
    builderLabels.contextProps.length > 0 ? `props(${builderLabels.contextProps.join(", ")})` : null,
    builderLabels.materialFeel ? `material=${builderLabels.materialFeel}` : null,
  ].filter(Boolean);
  const sceneAssetsLine =
    sceneAssetsParts.length > 0 ? `assets=${sceneAssetsParts.join(", ")}` : null;
  const sceneCameraParts = [
    builderLabels.lens || null,
    builderLabels.depth || null,
    builderLabels.angle || null,
    builderLabels.motion || null,
  ].filter(Boolean);
  const sceneCameraLine =
    sceneCameraParts.length > 0 ? `camera=${sceneCameraParts.join(", ")}` : null;
  const sceneExtraLine = cleanedBuilder.extraDetails
    ? `extra="${cleanedBuilder.extraDetails}"`
    : null;
  const sceneIntensityLine =
    cleanedBuilder.intensity !== 70 ? `intensity=${cleanedBuilder.intensity}%` : null;
  const sceneDirectiveSegments = [
    sceneSubjectParts.length > 0 ? sceneSubjectParts.join(", ") : null,
    sceneLightingLine,
    sceneStyleLine,
    sceneCompositionLine,
    sceneAssetsLine,
    sceneCameraLine,
    sceneExtraLine,
    sceneIntensityLine,
  ].filter(Boolean);
  const sceneDirectiveLine =
    sceneDirectiveSegments.length > 0
      ? `Scene directive: ${sceneDirectiveSegments.join("; ")}.`
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
    subjectReferenceLine,
    cleanedContext ? `context: ${cleanedContext}` : null,
    ...referenceImageLines,
    sceneDirectiveLine,
    debugEnabled ? builderSubjectLineText : null,
    debugEnabled ? builderLightingLine : null,
    debugEnabled ? builderStyleLine : null,
    debugEnabled ? builderCompositionLine : null,
    debugEnabled ? builderAssetsLine : null,
    debugEnabled ? builderCameraLine : null,
    debugEnabled ? builderExtraDetailsLine : null,
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
