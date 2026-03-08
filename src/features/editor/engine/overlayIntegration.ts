// src/features/editor/engine/overlayIntegration.ts
// CREATYNG — MASTER SPEC DIFF TR.6
// Overlay de integração: gradiente adaptativo baseado na luminosidade da zona de texto.

import type { CompositionConfig } from "@/types/preset";

export interface TextZoneBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Calcula a luminosidade média dos pixels na zona de texto.
 * Retorna valor entre 0 (escuro) e 1 (claro).
 */
export function calculateZoneLuminosity(
  ctx: CanvasRenderingContext2D,
  zone: TextZoneBounds
): number {
  const { x, y, w, h } = zone;
  if (w <= 0 || h <= 0) return 0.5;

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(
      Math.max(0, Math.round(x)),
      Math.max(0, Math.round(y)),
      Math.round(w),
      Math.round(h)
    );
  } catch {
    return 0.5; // fallback se canvas é tainted (cross-origin)
  }

  const data = imageData.data;
  let total = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    // Luminância perceptual (ITU-R BT.709)
    total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return total / pixelCount;
}

/**
 * Determina a intensidade do overlay baseado na luminosidade.
 * Fundo claro → overlay mais forte; fundo escuro → overlay mais suave.
 */
export function calculateOverlayIntensity(avgLuminosity: number): number {
  if (avgLuminosity > 0.7) return 0.85; // fundo muito claro
  if (avgLuminosity > 0.5) return 0.80; // fundo claro
  if (avgLuminosity > 0.3) return 0.75; // fundo médio
  return 0.75;                           // fundo escuro
}

/**
 * Desenha o overlay de gradiente na zona de texto.
 * Deve ser chamado DEPOIS de desenhar a imagem base e ANTES do texto.
 */
export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  composition: CompositionConfig,
  cw: number,
  ch: number,
  forceIntensity?: number
): void {
  const pos = composition.textPosition ?? "bottom";
  const preset = getPresetStyleType(composition);

  // Preset clean não usa overlay por padrão
  if (preset === "clean" && forceIntensity === undefined) return;

  const pad = cw * 0.06;

  let zone: TextZoneBounds;
  let gradStart: [number, number];
  let gradEnd: [number, number];

  switch (pos) {
    case "top":
      zone = { x: 0, y: 0, w: cw, h: ch * 0.42 };
      gradStart = [0, 0];
      gradEnd = [0, ch * 0.42];
      break;
    case "left":
      zone = { x: 0, y: 0, w: cw * 0.5, h: ch };
      gradStart = [0, 0];
      gradEnd = [cw * 0.5, 0];
      break;
    case "right":
      zone = { x: cw * 0.5, y: 0, w: cw * 0.5, h: ch };
      gradStart = [cw, 0];
      gradEnd = [cw * 0.5, 0];
      break;
    case "center":
      zone = { x: cw * 0.1, y: ch * 0.2, w: cw * 0.8, h: ch * 0.6 };
      gradStart = [cw * 0.5, ch * 0.5];
      gradEnd = [cw * 0.5, ch];
      break;
    default: // bottom — 45% of canvas height, aligns with text zone
      zone = { x: 0, y: ch * 0.55, w: cw, h: ch * 0.45 };
      gradStart = [0, ch];
      gradEnd = [0, ch * 0.55];
  }

  // Mede luminosidade se não foi forçada
  const avgLum = calculateZoneLuminosity(ctx, zone);
  const intensity = forceIntensity ?? calculateOverlayIntensity(avgLum);

  // Desenha gradiente
  let grad: CanvasGradient;
  if (pos === "center") {
    grad = ctx.createRadialGradient(
      cw / 2, ch / 2, 0,
      cw / 2, ch / 2, Math.min(cw, ch) * 0.5
    );
  } else {
    grad = ctx.createLinearGradient(...gradStart, ...gradEnd);
  }

  grad.addColorStop(0, `rgba(0,0,0,${intensity.toFixed(2)})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.restore();
}

/** Tipo de preset para determinar comportamento do overlay */
function getPresetStyleType(composition: CompositionConfig): string {
  // Sem acesso direto ao image preset aqui — usar default
  return "other";
}
