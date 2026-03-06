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
  const { prompt, negativePrompt } = buildPrompt(state);
  const { width, height } = resolveAspectRatio(state);

  const body = {
    prompt,
    negativePrompt,
    width,
    height,
    subjectBase64: state.subjectBase64,
    strictIdentity: true,
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
