// src/features/engine/prompt-compiler.ts

import type { ProjectSpec } from "@/types/spec";
import {
  ACTION_OPTIONS,
  ANGLE_OPTIONS,
  ASSET_HIGHLIGHTS_OPTIONS,
  CONTEXT_PROPS_OPTIONS,
  DEPTH_OPTIONS,
  EXPRESSION_OPTIONS,
  FINISH_OPTIONS,
  FRAMING_OPTIONS,
  LAYOUT_BASE_OPTIONS,
  LENS_OPTIONS,
  LIGHTING_SETUP_OPTIONS,
  MACRO_STYLE_OPTIONS,
  MATERIAL_FEEL_OPTIONS,
  MOTION_OPTIONS,
  MOOD_OPTIONS,
  SAFE_SPACE_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
  TEMPERATURE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/features/editor/editor-presets";
import { getScenePresetDescription } from "@/features/editor/scene-presets";
import { getSceneMoodDescription } from "@/features/editor/scene-moods";
import { getScenePropDescription } from "@/features/editor/scene-props";

export interface CompiledPrompt {
  prompt: string;
  negativePrompt: string;
  meta: {
    stylePreset: string;
    aspectRatio: string;
    size: { w: number; h: number };
    module: ProjectSpec["module"];
    format: ProjectSpec["format"];
    usedNegativePrompt?: boolean;
    usedSeed?: boolean;
    defaultNegativePromptWasApplied?: boolean;
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
  const { headline, subheadline, ctaText: cta } = content;
  const isEcomV2Template = module === "ecom_banner" && templateId === "ecom_v2_01";
  const userNegativePrompt =
    typeof generation.negativePrompt === "string" ? generation.negativePrompt.trim() : "";
  const normalizedSeed =
    Number.isFinite(Number(generation.seed)) && generation.seed !== null
      ? Math.max(0, Math.min(2_147_483_647, Math.round(Number(generation.seed))))
      : null;

  // Prompts-base por módulo (bem simples agora)
  const moduleBase =
    module === "social_post"
      ? "high-performing social ad creative, bold typography area reserved, modern commercial look"
      : module === "ecom_banner"
      ? "e-commerce promotional banner, premium minimal layout, product-focused composition"
      : "photorealistic high-resolution photoshoot, natural skin texture, true-to-life lighting and tones, clean editorial framing";

  const styleHints =
    module === "photoshoot"
      ? null
      : stylePreset === "glass"
      ? "subtle glassmorphism, soft blur surfaces, thin borders"
      : stylePreset === "minimal_clean"
      ? "minimal, lots of negative space, clean composition"
      : stylePreset === "bold_ads"
      ? "high-contrast, punchy, strong hierarchy"
      : "editorial, premium, soft contrast";

  const textHints =
    module === "photoshoot"
      ? null
      : content.headline || content.subheadline
      ? "leave safe space for text overlay, no unreadable tiny text in the image"
      : "no text";

  const safeEffects = effects ?? { textOutline: 0, shadow: 0, depth3d: 0, tilt: 0 };
  const effectsHints =
    module === "photoshoot"
      ? null
      : `text style: outline=${safeEffects.textOutline}/10 shadow=${safeEffects.shadow}/10 depth=${safeEffects.depth3d}/10 tilt=${safeEffects.tilt}deg`;
  const cleanedContext = contextText?.trim();
  const cleanedSubject = subjectText?.trim();
  const cleanedSubjectImage = subjectImageUrl?.trim();
  const debugEnabled = Boolean(promptDebug);
  const debugCopyLine =
    debugEnabled && (headline?.trim() || subheadline?.trim() || cta?.trim())
      ? `Copy (HTML overlay only): headline="${headline ?? ""}", subheadline="${subheadline ?? ""}", cta="${cta ?? ""}"`
      : null;
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
    finish:
      module === "photoshoot"
        ? builder?.finish?.trim() || "true_to_life"
        : builder?.finish?.trim() ?? "",
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
    motion: module === "photoshoot" ? "static" : builder?.motion?.trim() ?? "",
    layoutBase: builder?.layoutBase?.trim() ?? "",
    safeSpace: builder?.safeSpace?.trim() ?? "",
    extraDetails: builder?.extraDetails?.trim() ?? "",
    scenePreset: builder?.scenePreset?.trim() ?? "",
    sceneMood: builder?.sceneMood?.trim() ?? "",
    sceneProps: Array.isArray(builder?.sceneProps) ? builder.sceneProps : [],
  };
  const intensity = cleanedBuilder.intensity;
  const scenePresetDescription = getScenePresetDescription(cleanedBuilder.scenePreset);
  const scenePresetLine = scenePresetDescription
    ? `Scene preset: ${scenePresetDescription}`
    : null;
  const sceneMoodDescription = getSceneMoodDescription(cleanedBuilder.sceneMood);
  const sceneMoodLine = sceneMoodDescription ? `Scene mood: ${sceneMoodDescription}` : null;
  const scenePropsDescriptions = cleanedBuilder.sceneProps
    .map((value) => getScenePropDescription(value))
    .filter((value): value is string => Boolean(value));
  const scenePropsLine =
    scenePropsDescriptions.length > 0
      ? `Scene props: ${scenePropsDescriptions.join(", ")}`
      : null;
  const isLow = intensity <= 40;
  const isHigh = intensity >= 76;
  const isExtreme = intensity >= 85;
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
    finish: cleanedBuilder.finish ? toLabel(cleanedBuilder.finish, FINISH_OPTIONS) : "",
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
  const hardSubjectConstraintLine =
    isEcomV2Template && cleanedSubjectImage
      ? "Hard constraint: preserve exact subject, do not replace category or core product identity."
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
        : entry.role === "subject"
        ? "preserve exact subject identity/category; do not replace or drift"
        : "general reference";
    return `Reference image (${entry.role}, weight=${entry.weight}, lockRealism=${lockRealismFlag}): ${source}; ${roleGuidance}${notesSuffix}`;
  });
  const rolePriorityLines: string[] = [];
  if (normalizedReferences.some((entry) => entry.role === "product" && entry.weight >= 80)) {
    rolePriorityLines.push(
      "Priority: preserve product fidelity (shape, details, materials) above all."
    );
  }
  if (normalizedReferences.some((entry) => entry.role === "brand" && entry.weight >= 80)) {
    rolePriorityLines.push(
      "Priority: maintain strict brand consistency (palette, tone, identity)."
    );
  }
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
    sceneCompositionLine,
    sceneLightingLine,
    sceneStyleLine,
    sceneAssetsLine,
    sceneCameraLine,
    sceneExtraLine,
    sceneIntensityLine,
  ].filter(Boolean);
  const sceneDirectiveLine =
    sceneDirectiveSegments.length > 0
      ? `Scene directive: ${sceneDirectiveSegments.join("; ")}.`
      : null;
  const weightedDirectiveLine = sceneDirectiveLine
    ? `${sceneDirectiveLine}${
        isHigh ? "; strong emphasis on visual impact" : ""
      }${
        isExtreme
          ? "; visually dominant, bold composition, strong lighting presence"
          : ""
      }`
    : null;
  const intensityDirectiveLine = sceneDirectiveLine
    ? isLow
      ? "Intensity directive: subtle, minimal manipulation, keep natural realism"
      : isHigh
      ? isExtreme
        ? "Intensity directive: visually dominant, bold composition and lighting emphasis"
        : "Intensity directive: strong visual impact, bolder styling, keep coherent"
      : "Intensity directive: balanced enhancement, realistic, avoid over-stylization"
    : null;
  const compositionSet = Boolean(builderLabels.layoutBase) || Boolean(builderLabels.safeSpace);
  const lightingSet =
    Boolean(builderLabels.lightingSetup) ||
    Boolean(builderLabels.mood) ||
    Boolean(builderLabels.temperature);
  const styleSet = Boolean(builderLabels.macroStyle) || builderLabels.visualStyle.length > 0;
  const assetsSet =
    builderLabels.assetsHighlights.length > 0 || Boolean(builderLabels.materialFeel);
  const categoryCount = [compositionSet, lightingSet, styleSet, assetsSet].filter(Boolean).length;
  const selectiveAmplificationLines: string[] = [];
  if (isExtreme || (isHigh && categoryCount >= 2)) {
    if (compositionSet) {
      selectiveAmplificationLines.push(
        "Amplify: composition must strongly follow the selected layout and safe space."
      );
    }
    if (lightingSet) {
      selectiveAmplificationLines.push(
        "Amplify: lighting and mood must clearly match the selected setup and atmosphere."
      );
    }
    if (styleSet) {
      selectiveAmplificationLines.push(
        "Amplify: style direction must be clearly expressed and visually consistent."
      );
    }
    if (assetsSet) {
      selectiveAmplificationLines.push(
        "Amplify: selected elements/material feel must be visible and intentional."
      );
    }
  }
  const selectedAmplificationLines = selectiveAmplificationLines.slice(0, 2);
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

  const baseBlock = [
    cleanedContext
      ? module === "photoshoot"
        ? `Shoot notes: ${cleanedContext}`
        : `Campaign context: ${cleanedContext}`
      : null,
    subjectReferenceLine,
    ...referenceImageLines,
    ...rolePriorityLines,
  ];
  const textureGuardLine =
    module === "photoshoot"
      ? "no waxy skin, no plastic skin, natural texture, no overprocessing"
      : "ultra sharp, premium, realistic details, no waxy skin, natural colors";
  const photoshootCleanLine =
    module === "photoshoot" ? "no text, no logos, no watermarks" : null;
  const ecomV2CleanLine = isEcomV2Template ? "no text, no logos, no watermarks" : null;
  const photoshootFinishLine =
    module === "photoshoot" && builderLabels.finish ? `finish=${builderLabels.finish}` : null;

  // A ideia é: a imagem base NÃO precisa “escrever” o texto certo
  // (isso a gente renderiza em HTML/CSS). Aqui só reservamos espaço e estética.
  const prompt = [
    ...(isExtreme
      ? [weightedDirectiveLine, intensityDirectiveLine, ...selectedAmplificationLines, ...baseBlock]
      : [...baseBlock, weightedDirectiveLine, intensityDirectiveLine, ...selectedAmplificationLines]),
    hardSubjectConstraintLine,
    debugEnabled ? builderSubjectLineText : null,
    debugEnabled ? builderLightingLine : null,
    debugEnabled ? builderStyleLine : null,
    debugEnabled ? builderCompositionLine : null,
    debugEnabled ? builderAssetsLine : null,
    debugEnabled ? builderCameraLine : null,
    debugEnabled ? builderExtraDetailsLine : null,
    textHints,
    debugCopyLine,
    cleanedSubject ? `Main subject: ${cleanedSubject}` : null,
    scenePresetLine,
    sceneMoodLine,
    scenePropsLine,
    moduleBase,
    styleHints,
    `template: ${templateId}`,
    effectsHints,
    module === "photoshoot" ? null : `Color palette mode: ${paletteMode}`,
    module === "photoshoot" ? null : `Palette guidance: ${paletteGuidance}`,
    module === "photoshoot" ? null : `Primary color: ${primaryColor}`,
    module === "photoshoot" ? null : `Secondary color: ${secondaryColor}`,
    module === "photoshoot" ? null : `Neutral background: ${neutralBackground}`,
    module === "photoshoot" ? null : `Surface color: ${surfaceColor}`,
    module === "photoshoot" ? null : `Text color: ${textColor}`,
    realismValue !== null ? `Realism level: ${realismValue}%` : null,
    photoshootFinishLine,
    photoshootCleanLine,
    ecomV2CleanLine,
    textureGuardLine,
  ]
    .filter(Boolean)
    .join(", ");

  const defaultNegativePrompt = [
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
  const ecomDefaultNegativePrompt =
    "blurry, low quality, text, watermark, logo, artifacts, distorted product, bad proportions";
  const ecomV2DefaultNegativePrompt =
    "text, watermark, logo, deformed product, wrong category, waxy skin, plastic texture";
  const defaultNegativePromptWasApplied = module === "ecom_banner" && !userNegativePrompt;
  const negativePromptBase = userNegativePrompt
    ? userNegativePrompt
    : isEcomV2Template
    ? ecomV2DefaultNegativePrompt
    : module === "ecom_banner"
    ? ecomDefaultNegativePrompt
    : defaultNegativePrompt;
  const negativePrompt =
    isEcomV2Template && userNegativePrompt
      ? `${ecomV2DefaultNegativePrompt}, ${userNegativePrompt}`
      : negativePromptBase;

  return {
    prompt,
    negativePrompt,
    meta: {
      stylePreset,
      aspectRatio: generation.aspectRatio,
      size: { w: generation.width, h: generation.height },
      module,
      format: spec.format,
      usedNegativePrompt: debugEnabled ? Boolean(negativePrompt) : undefined,
      usedSeed: debugEnabled ? normalizedSeed !== null : undefined,
      defaultNegativePromptWasApplied: debugEnabled ? defaultNegativePromptWasApplied : undefined,
    },
  };
}
