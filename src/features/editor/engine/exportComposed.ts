// src/features/editor/engine/exportComposed.ts
// CREATYNG — MASTER SPEC DIFF TR.7 + 13.1 + 13.3
// Export final composto: imagem base + overlay + texto Canvas 2D.
// Multi-formato: crop inteligente por proporção.

import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";
import { renderTextOnCanvas, type TextRenderConfig } from "./textRenderer";
import { drawTextOverlay } from "./overlayIntegration";

// ─── FORMATOS ─────────────────────────────────────────────────────────────────

export type ExportCategory = "social" | "ecommerce" | "ads";

export interface ExportFormat {
  id: string;
  slug: string;           // kept for compat
  label: string;
  ratio: string;
  category: ExportCategory;
  w: number;
  h: number;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  // Social Media
  { id: "instagram_feed",     slug: "ig_feed_1x1",    label: "Instagram Feed",       ratio: "1:1",    category: "social",    w: 1080, h: 1080 },
  { id: "instagram_portrait", slug: "ig_feed_4x5",    label: "Instagram Portrait",   ratio: "4:5",    category: "social",    w: 1080, h: 1350 },
  { id: "instagram_story",    slug: "story_9x16",     label: "Instagram Stories",    ratio: "9:16",   category: "social",    w: 1080, h: 1920 },
  { id: "tiktok",             slug: "tiktok_9x16",    label: "TikTok",               ratio: "9:16",   category: "social",    w: 1080, h: 1920 },
  { id: "facebook_feed",      slug: "fb_feed_1x1",    label: "Facebook Feed",        ratio: "1:1",    category: "social",    w: 1080, h: 1080 },
  { id: "facebook_cover",     slug: "fb_cover",       label: "Facebook Cover",       ratio: "16:9",   category: "social",    w: 1640, h: 924  },
  { id: "youtube_thumb",      slug: "yt_thumb",       label: "YouTube Thumbnail",    ratio: "16:9",   category: "social",    w: 1280, h: 720  },
  { id: "twitter",            slug: "twitter_16x9",   label: "Twitter/X Post",       ratio: "16:9",   category: "social",    w: 1600, h: 900  },
  // E-commerce
  { id: "ecom_banner",        slug: "ecom_desktop",   label: "Banner E-commerce",    ratio: "16:9",   category: "ecommerce", w: 1920, h: 1080 },
  { id: "ecom_square",        slug: "ecom_square",    label: "Produto Quadrado",     ratio: "1:1",    category: "ecommerce", w: 1200, h: 1200 },
  // Ads
  { id: "google_display",     slug: "google_display", label: "Google Display",       ratio: "1.91:1", category: "ads",       w: 1200, h: 628  },
  { id: "meta_ads",           slug: "meta_ads",       label: "Meta Ads",             ratio: "1.91:1", category: "ads",       w: 1200, h: 628  },
];

export const FORMAT_BY_ID = new Map<string, ExportFormat>(
  EXPORT_FORMATS.map((f) => [f.id, f])
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Crop inteligente: mantém o centro, corta bordas proporcionalmente.
 */
function drawWithSmartCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = targetW / targetH;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
}

function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(w * 0.018)}px Inter, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("✦ CREATYNG.COM", w - w * 0.02, h - h * 0.015);
  ctx.restore();
}

// ─── COMPOSIÇÃO PRINCIPAL ─────────────────────────────────────────────────────

export interface ComposeOptions {
  imageBase64: string;
  texts: { headline: string; subheadline?: string; cta?: string };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  composition: CompositionConfig;
  targetFormat: ExportFormat;
  watermark?: boolean;
  quality?: "2k" | "4k";           // 4k = escalar canvas x2 (Pro only)
  outputFormat?: "png" | "jpg";
}

/**
 * Gera a imagem final composta (imagem + overlay + texto) e retorna base64.
 * DIFF 13.3: recomposeForFormat usa a mesma lógica para todos os formatos.
 */
export async function exportComposed(opts: ComposeOptions): Promise<string> {
  const {
    imageBase64, texts, presetConfig, colors, composition,
    targetFormat, watermark, quality = "2k", outputFormat = "png",
  } = opts;

  const scale = quality === "4k" ? 2 : 1;
  const { w, h } = targetFormat;
  const cw = w * scale;
  const ch = h * scale;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // 1. Imagem base com crop inteligente
  const img = await base64ToImage(imageBase64);
  drawWithSmartCrop(ctx, img, cw, ch);

  // 2. Overlay de integração (gradiente adaptativo)
  if (texts.headline || texts.cta) {
    drawTextOverlay(ctx, composition, cw, ch);
  }

  // 3. Texto com tipografia real
  const textConfig: TextRenderConfig = {
    texts,
    presetConfig,
    colors,
    composition,
    canvasWidth: cw,
    canvasHeight: ch,
  };
  renderTextOnCanvas(ctx, textConfig);

  // 4. Marca d'água se plano free
  if (watermark) {
    applyWatermark(ctx, cw, ch);
  }

  const mime = outputFormat === "jpg" ? "image/jpeg" : "image/png";
  const qualityVal = outputFormat === "jpg" ? 0.9 : 1.0;
  return canvas.toDataURL(mime, qualityVal);
}

/**
 * DIFF 13.3 — Recompõe para um formato específico usando a imagem base cacheada.
 * Não rechama a IA. Só crop + overlay + texto.
 */
export async function recomposeForFormat(
  imageBase64: string,
  texts: ComposeOptions["texts"],
  presetConfig: TextPresetConfig,
  colors: ColorConfig,
  composition: CompositionConfig,
  targetFormat: ExportFormat,
  opts: { watermark?: boolean; quality?: "2k" | "4k"; outputFormat?: "png" | "jpg" } = {}
): Promise<string> {
  return exportComposed({
    imageBase64,
    texts,
    presetConfig,
    colors,
    composition,
    targetFormat,
    ...opts,
  });
}

/**
 * DIFF 13.4 — Renderiza preview miniatura (ex: 360x360) para exibir no modal.
 */
export async function renderFormatPreview(
  imageBase64: string,
  texts: ComposeOptions["texts"],
  presetConfig: TextPresetConfig,
  colors: ColorConfig,
  composition: CompositionConfig,
  targetFormat: ExportFormat,
  previewSize = 360
): Promise<string> {
  const { w, h } = targetFormat;
  const ratio = w / h;
  const pw = ratio >= 1 ? previewSize : Math.round(previewSize * ratio);
  const ph = ratio >= 1 ? Math.round(previewSize / ratio) : previewSize;

  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const img = await base64ToImage(imageBase64);
  drawWithSmartCrop(ctx, img, pw, ph);

  if (texts.headline || texts.cta) {
    drawTextOverlay(ctx, composition, pw, ph);
  }

  renderTextOnCanvas(ctx, {
    texts, presetConfig, colors, composition,
    canvasWidth: pw, canvasHeight: ph,
  });

  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Gera thumbnail 300×300 de uma imagem base64.
 * Usado no CachedGeneration.imageThumbnail.
 */
export async function resizeToThumbnail(
  imageBase64: string,
  size = 300
): Promise<string> {
  const img = await base64ToImage(imageBase64);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageBase64;
  drawWithSmartCrop(ctx, img, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}
