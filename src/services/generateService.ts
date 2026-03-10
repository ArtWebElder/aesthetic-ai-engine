// src/services/generateService.ts
// CREATYNG — Fase 2 — Conecta useWizardStore ao motor de geração (Edge Function)
// Uma chamada: generateFromWizard(wizardState) → CachedGeneration

import type { WizardState, CachedGeneration } from "@/types/preset";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";

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

  const textPos = (state.activePresetConfig?.composition as { textPosition?: string } | undefined)?.textPosition ?? "bottom";
  const textSpaceMap: Record<string, string> = {
    bottom: "keep the lower 35% of the frame darker and with lower contrast — this area will receive text overlay",
    top: "keep the upper 30% of the frame darker and with lower contrast — this area will receive text overlay",
    left: "subject positioned right-center, left 40% of frame as negative space for text",
    right: "subject positioned left-center, right 40% of frame as negative space for text",
  };
  const textSpace = textSpaceMap[textPos] ?? textSpaceMap.bottom;

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
  const layers: string[] = [];

  const allText = [state.headline, state.subheadline, state.freeInstructions]
    .filter(Boolean).join(" ").toLowerCase();

  const isCold   = /açaí|acai|sorvete|gelato|milkshake|smoothie|frozen/.test(allText);
  const isSushi  = /sushi|sashimi|temaki|japonês|japa|uramaki|combinado/.test(allText);
  const isPizza  = /pizza|pizzaria|italiana|massa|lasanha|forno/.test(allText);
  const isBurger = /burger|burguer|hambúrguer|hamburger|smash|lanche|sanduíche/.test(allText);

  layers.push(
    `A vibrant, colorful background scene for a social media food advertisement. ` +
    `Rich gradient — NOT white, NOT plain, NOT gray. ` +
    `Warm, appetizing colors creating atmosphere and depth.`
  );

  if (isCold) {
    layers.push(
      `Floating food elements scattered around the edges: fresh strawberries, banana slices, ` +
      `blueberries, granola clusters, coconut shavings, chocolate chips, açaí berries, ` +
      `condensation droplets catching light. Splashes of berry juice flying outward with motion blur. ` +
      `Color palette: deep purple to magenta gradient. Tropical, fresh, energetic atmosphere.`
    );
  } else if (isSushi) {
    layers.push(
      `Floating food elements around the edges: soy sauce splashes, sesame seeds, ginger slices, ` +
      `wasabi drops, nori pieces, rice grains, chopstick silhouettes. ` +
      `Color palette: deep red to black gradient. Sophisticated Japanese aesthetic.`
    );
  } else if (isPizza) {
    layers.push(
      `Floating food elements around the edges: fresh basil leaves, tomato sauce splashes, ` +
      `cheese stretches, oregano, olive oil drops, flour dust particles. ` +
      `Color palette: warm red to orange gradient. Italian rustic warmth.`
    );
  } else if (isBurger) {
    layers.push(
      `Floating food elements around the edges: bacon strips, lettuce leaves, cheese slices, ` +
      `onion rings, sauce splashes, sesame seeds, french fries. ` +
      `Color palette: warm amber to brown gradient. Energetic, appetite-driven atmosphere.`
    );
  } else {
    layers.push(
      `Floating decorative food elements around the edges. ` +
      `Colorful and energetic atmosphere. Warm gradient background with depth.`
    );
  }

  layers.push(
    `Studio-quality lighting. Floating elements look three-dimensional, not flat. ` +
    `Slight depth of field — some elements sharp, others softly blurred. ` +
    `High resolution, vibrant colors, professional food advertising style.`
  );

  layers.push(
    `Fill the ENTIRE image with floating food elements, scattered everywhere — ` +
    `edges, corners, and throughout the frame. ` +
    `The elements must be LARGE, COLORFUL, and HIGHLY SATURATED — clearly visible against the gradient. ` +
    `At least 8-12 distinct food elements. VIBRANT, not subtle. ` +
    `Think of a food explosion filling the entire scene. ` +
    `A product will be layered on top digitally later, so elements behind it will be partially hidden — that is perfectly fine.`
  );

  if (state.freeInstructions) {
    layers.push(`Additional creative direction: ${state.freeInstructions}`);
  }

  return {
    prompt: layers.join("\n\n"),
    negativePrompt: [
      "text, letters, typography, watermark, logo",
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
  const layers: string[] = [];

  // === CAMADA 1 — PRESERVAÇÃO DO SUBJECT ===
  layers.push(
    `Professional food photography of the exact product shown in the reference image. ` +
    `CRITICAL PRESERVATION RULES: maintain the exact shape, texture, proportions, and color of every ingredient. ` +
    `Real food imperfections are desired — this is a real product being sold, not a stock photo. ` +
    `Do NOT idealize, do NOT make it look like a 3D render or AI-generated food. ` +
    `The owner must instantly recognize this as THEIR product photographed by a professional.`
  );

  // === CAMADA 2 — AMBIENTE E FUNDO ===
  layers.push(
    `Background: warm, slightly blurred restaurant or kitchen environment. ` +
    `Bokeh lights from kitchen equipment. Warm color temperature. ` +
    `The environment suggests a real restaurant atmosphere, not a sterile studio. ` +
    `Product placed on a dark wooden surface with subtle reflections.`
  );

  // === CAMADA 3 — ASSETS DINÂMICOS (contextual) ===
  const allText = [
    state.headline, state.subheadline, state.cta, state.freeInstructions,
  ].filter(Boolean).join(" ").toLowerCase();

  const isCold   = /açaí|acai|sorvete|gelato|frapê|milkshake|smoothie|cold|frozen|ice|sushi|sashimi|poke|temaki/i.test(allText);
  const isSushi  = /sushi|sashimi|poke|temaki|japonês|japones|japonesa|niguiri/i.test(allText);
  const isPizza  = /pizza|focaccia/i.test(allText);

  if (isCold && !isPizza) {
    layers.push(
      `Dynamic presentation: delicate mist rising from the cold product, condensation droplets on the surface and container. ` +
      `Small ice crystals catching light. Subtle cool steam wisps. ` +
      `Fresh ingredients arranged elegantly around — no fire, no heat effects, no hot steam. ` +
      `Serene but appetizing energy. The product must look refreshingly cold.`
    );
  } else if (isSushi) {
    layers.push(
      `Elegant presentation: sushi/Japanese food arranged artistically. ` +
      `Clean white or dark slate surface. Subtle garnishes (ginger, wasabi, sesame seeds). ` +
      `Light soy sauce reflection. Minimal, precise composition. No fire, no hot effects. ` +
      `Refined, high-end Japanese restaurant feel.`
    );
  } else if (isPizza) {
    layers.push(
      `Dynamic presentation: cheese stretch visible as a slice is lifted. Tomato sauce splashes. ` +
      `Fresh basil leaves falling. Oregano scattered. Steam rising from hot cheese. ` +
      `Ingredients exploding outward from the pizza in an appetizing way. ` +
      `Energy and movement. Italian restaurant atmosphere.`
    );
  } else {
    layers.push(
      `Dynamic floating ingredient elements around the main product with motion blur suggesting explosive movement. ` +
      `Ingredients flying outward: sauce splashes, scattered seeds, floating herb leaves, steam wisps. ` +
      `Energy and movement throughout the frame. Dynamic commercial food photography style.`
    );
  }

  // === CAMADA 4 — ILUMINAÇÃO ===
  layers.push(
    `Lighting: main key light from upper-left at 45 degrees, warm color temperature 3200-3500K. ` +
    `Soft fill light from right side. Rim light on product edges to separate from background. ` +
    `The lighting must make the food look appetizing, warm, and inviting. ` +
    `Dramatic but not dark — this is about appetite appeal, not cinematic mood.`
  );

  // === CAMADA 5 — ZONA DE RESPIRO PARA TEXTO ===
  const hasPrice = state.price && state.price.value;
  const hasContact = state.whatsapp || state.instagram;
  const textDensity = [state.headline, state.subheadline, state.cta, hasPrice ? "price" : "", hasContact ? "contact" : ""]
    .filter(Boolean).length;

  const topBreathing = textDensity >= 3 ? "30%" : "25%";
  const bottomBreathing = hasContact ? "18%" : "12%";

  layers.push(
    `COMPOSITION RULE: The upper ${topBreathing} of the image must have significantly less visual detail ` +
    `and lower contrast — this area will receive headline text overlay. ` +
    `The bottom ${bottomBreathing} should also be slightly darker and simpler for contact information. ` +
    `The product should occupy the center to lower-center of the frame. ` +
    `Do NOT place important food elements in the upper portion or very bottom.`
  );

  // === CAMADA 6 — TÉCNICA FOTOGRÁFICA ===
  layers.push(
    `Shot with 85mm lens, f/2.8 aperture, shallow depth of field. ` +
    `Food photography hero shot, slightly below eye level looking up at the product. ` +
    `High resolution suitable for 2048x2048 output. ` +
    `Vibrant but natural colors — no over-saturation, no filters, no vintage effects.`
  );

  // === CORES DO USUÁRIO (se informadas) ===
  const colors = state.activePresetConfig?.colors;
  if (colors?.primary || colors?.secondary) {
    const colorParts: string[] = [];
    if (colors.primary) colorParts.push(`primary: ${colors.primary}`);
    if (colors.secondary) colorParts.push(`secondary: ${colors.secondary}`);
    layers.push(
      `Color direction: The scene lighting and environment should harmonize with these colors: ${colorParts.join(", ")}. ` +
      `Use them as the dominant warm tones in the scene.`
    );
  }

  // === INSTRUÇÕES LIVRES DO USUÁRIO ===
  if (state.freeInstructions) {
    layers.push(`Additional creative direction from the client: ${state.freeInstructions}`);
  }

  const negativePrompt = [
    "text, letters, typography, words, numbers, written words, any form of text",
    "watermark, logo, border, frame, vignette",
    "artificial food, wax texture, 3D render, stock photography, CGI",
    "AI generated text, AI artifacts, deformed food",
    "cold lighting, blue color cast, flat lighting",
    "plastic look, oversaturation, HDR look",
    "collage, split screen, multiple products unless specified",
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
  const isPopDesign = state.selectedImagePresetId === "sys-img-pop-design";
  const isFoodPop =
    !isPopDesign &&
    (state.category === "food" ||
      Boolean(state.price?.value || state.whatsapp || state.instagram));

  const phase = (state as unknown as { _popDesignPhase?: string })._popDesignPhase;

  const { prompt, negativePrompt } =
    isPopDesign && phase === "background" ? buildPopDesignBackgroundPrompt(state) :
    isPopDesign && phase === "subject"    ? buildPopDesignSubjectPrompt(state) :
    isPopDesign                           ? buildPopDesignBackgroundPrompt(state) :
    isFoodPop                             ? buildFoodPopPrompt(state) :
                                            buildPrompt(state);

  if (isPopDesign && phase === "background") {
    console.log("[PopDesign BG] Full prompt:", prompt);
    console.log("[PopDesign BG] Negative:", negativePrompt);
  }

  const { width, height } = resolveAspectRatio(state);

  // Background phase = text-to-image (no strict identity — we want a new scene)
  // Subject phase = img2img strict (preserve exact product)
  const strictIdentity = !(isPopDesign && phase === "background");

  const body = {
    prompt,
    negativePrompt,
    width,
    height,
    subjectBase64: state.subjectBase64,
    strictIdentity,
    identityStrength: 90,
    styleStrength: 45,
    module: state.selectedImagePresetId ?? "wizard",
  };

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
