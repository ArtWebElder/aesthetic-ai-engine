// src/services/generateService.ts
// CREATYNG — Fase 2 — Conecta useWizardStore ao motor de geração (Edge Function)
// Uma chamada: generateFromWizard(wizardState) → CachedGeneration

import type { WizardState, CachedGeneration, ReferenceAnalysis } from "@/types/preset";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";
import { buildGenerationPrompt } from "@/services/referenceAnalyzer";
import { detectNicheFromText, getNicheContext } from "@/data/contextualAssets";
import { getAspectConfig, GRADIENT_OVERLAYS } from "@/data/compositionRules";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

// ─── ERRO TIPADO ──────────────────────────────────────────────────────────────

export class GenerateError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GenerateError";
  }
}

// ─── PROMPT COMPILER (wizard → texto para a IA) ───────────────────────────────

function buildPrompt(state: WizardState): { prompt: string; negativePrompt: string } {
  const preset = SYSTEM_IMAGE_PRESETS.find((p) => p.id === state.selectedImagePresetId);
  const sceneKeywords: string[] = (preset?.config?.image as { sceneKeywords?: string[] })?.sceneKeywords ?? [
    "cinematic scene",
    "professional marketing creative",
    "ultra detailed",
    "photorealistic",
  ];
  const negativeKeywords: string[] = (preset?.config?.image as { negativeKeywords?: string[] })?.negativeKeywords ?? [];

  const framingDesc: Record<string, string> = {
    face: "close-up portrait",
    half_body: "half body shot",
    full_body: "full body shot",
    product: "product photography, clean product shot",
  };
  const angleDesc: Record<string, string> = {
    eye_level: "eye level angle",
    low_angle: "low angle, slightly looking up at subject",
    high_angle: "high angle, slightly looking down at subject",
  };

  const framing = framingDesc[state.framing] ?? "portrait";
  const angle = angleDesc[state.cameraAngle] ?? "eye level";

  // Use aspect-ratio-aware composition space instructions
  const selectedAr = (state.activePresetConfig?.composition as { aspectRatio?: string } | undefined)?.aspectRatio ?? "1:1";
  const arConfig = getAspectConfig(selectedAr);
  const textSpace = arConfig.compositionSpace;

  const positive = [
    "Photorealistic cinematic image. Blockbuster-level production quality.",
    "Professional marketing creative, agency grade. Ultra-detailed.",
    `Subject framing: ${framing}. Camera: ${angle}.`,
    "SUBJECT: preserve identity exactly. Do NOT alter face, proportions or distinctive features.",
    ...sceneKeywords,
    textSpace,
    "Do NOT generate any text, letters, words or numbers in the image.",
    "No watermarks. No logos overlay. Anatomically correct. No plastic skin. No dead eyes.",
    "Sharp focus on subject. Consistent lighting. No white halo around subject.",
  ].join(" ");

  const negative = [
    "plastic skin, waxy face, dead eyes, glass eyes, lifeless expression,",
    "distorted hands, extra fingers, wrong anatomy, disfigured body,",
    "blurry text, garbled letters, any text in image, watermark, tool logo,",
    "stock photo generic background, inconsistent lighting, two light sources,",
    "white halo around subject, edge fringe, cutout artifact,",
    "cartoon, anime, illustration, painting, low quality, blurry, grainy,",
    ...negativeKeywords,
  ].join(" ");

  return { prompt: positive, negativePrompt: negative };
}

function resolveAspectRatio(state: WizardState): { width: number; height: number } {
  const ar = (state.activePresetConfig?.composition as { aspectRatio?: string } | undefined)?.aspectRatio ?? "4:5";
  const map: Record<string, { width: number; height: number }> = {
    "1:1":  { width: 1080, height: 1080 },
    "4:5":  { width: 1080, height: 1350 },
    "9:16": { width: 1080, height: 1920 },
    "16:9": { width: 1920, height: 1080 },
  };
  return map[ar] ?? { width: 1080, height: 1350 };
}

// ─── POP DESIGN PROMPT BUILDERS ───────────────────────────────────────────────

/** Chamada 1 — Fundo colorido + elementos flutuantes, SEM o subject principal no centro */
export function buildPopDesignBackgroundPrompt(state: WizardState): { prompt: string; negativePrompt: string } {
  const allText = [state.headline, state.subheadline, state.freeInstructions]
    .filter(Boolean).join(" ");

  const nicheKey = detectNicheFromText(allText);
  const ctx = getNicheContext(nicheKey);

  const layers: string[] = [];

  layers.push(
    `A vibrant, colorful background scene for a social media food advertisement. ` +
    `Rich gradient — NOT white, NOT plain, NOT gray. ` +
    `${ctx.mood}. Appetizing colors creating atmosphere and depth.`
  );

  layers.push(
    `Floating food elements scattered around the edges: ${ctx.assets.join(', ')}. ` +
    `${ctx.colorGrade}. ` +
    `The elements should be three-dimensional, not flat — with motion blur and depth.`
  );

  layers.push(
    `${ctx.lighting}. ` +
    `Fill the ENTIRE image with floating food elements, scattered everywhere — ` +
    `edges, corners, and throughout the frame. ` +
    `The elements must be LARGE, COLORFUL, and HIGHLY SATURATED — clearly visible against the gradient. ` +
    `At least 8-12 distinct food elements. VIBRANT, not subtle. ` +
    `A product will be layered on top digitally later, so elements behind it will be partially hidden — that is perfectly fine.`
  );

  if (state.freeInstructions) {
    layers.push(`Additional creative direction: ${state.freeInstructions}`);
  }

  return {
    prompt: layers.join("\n\n"),
    negativePrompt: [
      ctx.negativePrompt,
      "white background, plain background, gray background",
      "empty background, plain gradient, minimal elements, subtle, monochromatic",
      "main product in center, central food item, bowl in center, cup in center, plate in center",
      "collage, split screen, borders, frames",
    ].join(", "),
  };
}

/** Chamada 2 — Subject isolado em fundo branco puro para composição */
export function buildPopDesignSubjectPrompt(state: WizardState): { prompt: string; negativePrompt: string } {
  const layers: string[] = [];

  layers.push(
    `Professional product photography of the exact item shown in the reference image. ` +
    `PURE WHITE background (#FFFFFF) — no gradients, no shadows on background. ` +
    `CRITICAL: preserve exact shape, color, texture of the original product. ` +
    `The product must be sharp, centered, well-lit with even studio lighting. ` +
    `Do NOT add any floating elements or decorations — just the product alone ` +
    `on a clean white background.`
  );

  layers.push(
    `100mm macro lens, f/8, maximum sharpness. ` +
    `Even studio lighting from all sides, no dramatic shadows, no colored lighting. ` +
    `The background must be PERFECTLY WHITE (#FFFFFF) with absolutely NO shadows, ` +
    `NO gradients, NO gray areas. The product should appear to float on pure white ` +
    `with NO contact shadows on the background surface.`
  );

  return {
    prompt: layers.join("\n\n"),
    negativePrompt: [
      "text, letters, typography, watermark, logo",
      "colored background, gradient, dark background, gray background",
      "floating elements, ingredients scattered around, decorations around product",
      "kitchen, table, restaurant, environment, bokeh, shadows on background",
    ].join(", "),
  };
}

// ─── FOOD POP PROMPT BUILDER (paralelo ao buildPrompt, não altera o original) ──

function buildFoodPopPrompt(state: WizardState): { prompt: string; negativePrompt: string } {
  const allText = [
    state.headline, state.subheadline, state.cta, state.freeInstructions,
  ].filter(Boolean).join(" ");

  // Detect niche and get contextual assets
  const nicheKey = detectNicheFromText(allText);
  const ctx = getNicheContext(nicheKey);

  // Detect aspect ratio for composition space instructions
  const ar = (state.activePresetConfig?.composition as { aspectRatio?: string } | undefined)?.aspectRatio ?? '1:1';
  const aspectConfig = getAspectConfig(ar);

  const layers: string[] = [];

  // === [SUBJECT] — Preservation ===
  layers.push(
    `[SUBJECT]\n` +
    `Professional food photography of the exact product shown in the reference image. ` +
    `CRITICAL PRESERVATION RULES: maintain the exact shape, texture, proportions, and color of every ingredient. ` +
    `Real food imperfections are desired — this is a real product being sold, not a stock photo. ` +
    `Do NOT idealize, do NOT make it look like a 3D render or AI-generated food. ` +
    `The owner must instantly recognize this as THEIR product photographed by a professional.`
  );

  // === [ENVIRONMENT] — Surface + mood from niche ===
  layers.push(
    `[ENVIRONMENT]\n` +
    `Surface: ${ctx.surfaces[0]}. ${ctx.mood}. ` +
    `The environment suggests a real, premium atmosphere — not a sterile studio.`
  );

  // === [CONTEXTUAL ASSETS] ===
  layers.push(
    `[CONTEXTUAL ASSETS]\n` +
    `Surrounding elements: ${ctx.assets.join(', ')}. ` +
    `These elements should be scattered naturally around the main product, creating depth and context. ` +
    `Some sharp in foreground, others softly blurred in background.`
  );

  // === [LIGHTING] ===
  layers.push(
    `[LIGHTING]\n` +
    `${ctx.lighting}. ` +
    `The lighting must make the food look appetizing, warm, and inviting.`
  );

  // === [COMPOSITION SPACE] — Breathing room for text overlay ===
  layers.push(
    `[COMPOSITION SPACE]\n` +
    `${aspectConfig.compositionSpace}\n` +
    `Do NOT place important food elements in the text breathing zones. ` +
    `The product should occupy the center to lower-center of the frame.`
  );

  // === [TECHNICAL] — Camera + color grade ===
  layers.push(
    `[TECHNICAL]\n` +
    `${ctx.cameraSettings}. ${ctx.colorGrade}. ` +
    `Photorealistic, high detail, 8K resolution. ` +
    `Vibrant but natural colors — no over-saturation, no filters, no vintage effects.`
  );

  // === User colors ===
  const colors = state.activePresetConfig?.colors;
  if (colors?.primary || colors?.secondary) {
    const colorParts: string[] = [];
    if (colors.primary) colorParts.push(`primary: ${colors.primary}`);
    if (colors.secondary) colorParts.push(`secondary: ${colors.secondary}`);
    layers.push(`Color direction: harmonize with ${colorParts.join(", ")}.`);
  }

  // === Free instructions ===
  if (state.freeInstructions) {
    layers.push(`Additional creative direction: ${state.freeInstructions}`);
  }

  const negativePrompt = [
    ctx.negativePrompt,
    "text, letters, typography, words, numbers, any form of text",
    "watermark, logo, border, frame, vignette",
    "artificial food, wax texture, 3D render, CGI",
    "AI artifacts, deformed food",
    "plastic look, oversaturation, HDR look",
    "collage, split screen",
    "blurry product, soft focus on main subject",
  ].join(", ");

  return { prompt: layers.join("\n\n"), negativePrompt };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function fetchAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new GenerateError("image_fetch_failed", `HTTP ${resp.status} ao baixar imagem gerada.`);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new GenerateError("image_read_failed", "Erro ao ler imagem gerada."));
    reader.readAsDataURL(blob);
  });
}

function resizeThumbnail(base64: string, maxSide = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64.slice(0, 500)); // fallback mínimo
    img.src = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

export async function generateFromWizard(state: WizardState): Promise<CachedGeneration> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new GenerateError(
      "supabase_not_configured",
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.",
    );
  }

  if (!state.subjectBase64) {
    throw new GenerateError("no_subject", "Envie uma imagem do sujeito antes de gerar.");
  }

  const startedAt = Date.now();

  // Debug log — inputs being sent to generation
  console.log('[Generate] Inputs:', {
    subject: !!state.subjectBase64,
    preset: state.selectedImagePresetId,
    reference: !!state.referenceBase64,
    texts: {
      headline: state.headline,
      subheadline: state.subheadline,
      cta: state.cta,
      price: state.price?.value,
      whatsapp: state.whatsapp,
      instagram: state.instagram,
    },
  });

  // ── Pipeline routing (priority: reference > popDesign > foodPop > preset) ──
  const hasReference = Boolean(state.referenceBase64 && state.referenceAnalysis);

  const isPopDesign = state.selectedImagePresetId === "sys-img-pop-design";
  const isFoodPop =
    !isPopDesign &&
    (state.category === "food" ||
      Boolean(state.price?.value || state.whatsapp || state.instagram));

  const phase = (state as unknown as { _popDesignPhase?: string })._popDesignPhase;

  let prompt: string;
  let negativePrompt: string;
  let styleReferenceBase64: string | null = null;

  if (hasReference && state.referenceAnalysis) {
    // REFERENCE-BASED pipeline — highest priority
    prompt = buildGenerationPrompt(state.referenceAnalysis, {
      headline: state.headline,
      price: undefined,
      cta: state.cta,
    });
    negativePrompt = "text, typography, watermark, logo, words, letters, blurry, low quality";
    styleReferenceBase64 = state.referenceBase64 ?? null;
    console.log("[Generate] Mode: REFERENCE-BASED");
  } else if (isPopDesign && phase === "background") {
    ({ prompt, negativePrompt } = buildPopDesignBackgroundPrompt(state));
    console.log("[PopDesign BG] Full prompt:", prompt);
    console.log("[PopDesign BG] Negative:", negativePrompt);
  } else if (isPopDesign && phase === "subject") {
    ({ prompt, negativePrompt } = buildPopDesignSubjectPrompt(state));
  } else if (isPopDesign) {
    ({ prompt, negativePrompt } = buildPopDesignBackgroundPrompt(state));
  } else if (isFoodPop) {
    ({ prompt, negativePrompt } = buildFoodPopPrompt(state));
  } else {
    ({ prompt, negativePrompt } = buildPrompt(state));
    console.log("[Generate] Mode: PRESET-BASED");
  }

  const { width, height } = resolveAspectRatio(state);

  // Background phase = text-to-image (no strict identity — we want a new scene)
  // Subject phase = img2img strict (preserve exact product)
  // Reference mode always uses strict identity
  const strictIdentity = hasReference || !(isPopDesign && phase === "background");

  const body: Record<string, unknown> = {
    prompt,
    negativePrompt,
    width,
    height,
    subjectBase64: state.subjectBase64,
    strictIdentity,
    identityStrength: 90,
    styleStrength: hasReference ? 70 : 45,
    module: state.selectedImagePresetId ?? "wizard",
  };

  if (styleReferenceBase64) {
    body.styleReferenceBase64 = styleReferenceBase64;
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new GenerateError(
      data?.error ?? "generation_failed",
      data?.details ?? `HTTP ${resp.status} — tente novamente.`,
    );
  }

  // A Edge Function retorna signedUrl (bucket privado) ou imageBase64 direto
  let imageBase64: string;
  if (data.signedUrl) {
    imageBase64 = await fetchAsBase64(data.signedUrl);
  } else if (typeof data.imageBase64 === "string" && data.imageBase64) {
    imageBase64 = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:image/png;base64,${data.imageBase64}`;
  } else {
    throw new GenerateError("no_image_in_response", "Resposta sem imagem. Verifique os logs da Edge Function.");
  }

  const imageThumbnail = await resizeThumbnail(imageBase64, 300);

  return {
    generationId: data.generationId ?? crypto.randomUUID(),
    imageBase64,
    imageThumbnail,
    wizardStateSnapshot: { ...state },
    presetIds: {
      image: state.selectedImagePresetId,
      text: state.selectedTextPresetId,
    },
    activePresetConfigSnapshot: { ...(state.activePresetConfig ?? {}) },
    visualDNA: state.visualDNA,
    meta: {
      provider: data.meta?.providerName ?? data.provider ?? "unknown",
      model: data.meta?.providerName ?? "unknown",
      dnaUsed: Boolean(state.visualDNA),
      aspectRatio: `${width}x${height}`,
      generationMs: Date.now() - startedAt,
    },
    timestamp: Date.now(),
  };
}
