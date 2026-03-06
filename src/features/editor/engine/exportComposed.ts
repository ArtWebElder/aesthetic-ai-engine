// src/features/editor/engine/exportComposed.ts
// CREATYNG — MASTER SPEC DIFF TR.7
// Export final composto: imagem base + overlay + texto Canvas 2D.

import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";
import { renderTextOnCanvas, type TextRenderConfig } from "./textRenderer";
import { drawTextOverlay } from "./overlayIntegration";

export interface ExportFormat {
  w: number;
  h: number;
  label: string;
  slug: string;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  { w: 1080, h: 1080, label: "Instagram Feed 1:1", slug: "ig_feed_1x1" },
  { w: 1080, h: 1350, label: "Instagram Feed 4:5", slug: "ig_feed_4x5" },
  { w: 1080, h: 1920, label: "Story/Reels 9:16", slug: "story_9x16" },
  { w: 1200, h: 628, label: "Facebook/LinkedIn", slug: "fb_landscape" },
  { w: 1920, h: 800, label: "E-commerce Banner Desktop", slug: "ecom_desktop" },
  { w: 1366, h: 768, label: "E-commerce Notebook", slug: "ecom_notebook" },
];

async function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Desenha a imagem base no canvas com crop inteligente para o formato alvo.
 * Mantém o centro da imagem, corta as bordas proporcionalmente.
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
    // Imagem mais larga — cortar laterais
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Imagem mais alta — cortar topo/base
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
}

export interface ComposeOptions {
  imageBase64: string;             // imagem base gerada pela IA (sem texto)
  texts: { headline: string; subheadline?: string; cta?: string };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  composition: CompositionConfig;
  targetFormat: ExportFormat;
  watermark?: boolean;             // true = plano free
}

/**
 * Gera a imagem final composta (imagem + overlay + texto) e retorna base64.
 * Utiliza Canvas 2D — funciona no browser sem dependências externas.
 */
export async function exportComposed(opts: ComposeOptions): Promise<string> {
  const { imageBase64, texts, presetConfig, colors, composition, targetFormat, watermark } = opts;
  const { w, h } = targetFormat;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // 1. Imagem base com crop inteligente
  const img = await base64ToImage(imageBase64);
  drawWithSmartCrop(ctx, img, w, h);

  // 2. Overlay de integração (gradiente adaptativo)
  if (texts.headline || texts.cta) {
    drawTextOverlay(ctx, composition, w, h);
  }

  // 3. Texto com tipografia real
  const textConfig: TextRenderConfig = {
    texts,
    presetConfig,
    colors,
    composition,
    canvasWidth: w,
    canvasHeight: h,
  };
  renderTextOnCanvas(ctx, textConfig);

  // 4. Marca d'água se plano free
  if (watermark) {
    applyWatermark(ctx, w, h);
  }

  // 5. Export como PNG
  return canvas.toDataURL("image/png", 1.0);
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
