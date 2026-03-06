// src/lib/preprocessSubject.ts
// Preprocess de imagem do subject via Canvas API (browser).
// Substitui o preprocess pixel-level que era feito na Edge Function via imagescript
// (não compatível com Deno Deploy). Decisão: 2026-03-06.
//
// Etapas:
//   1. Alpha composite — fundo neutro #808080 composto sob a imagem (elimina transparência)
//   2. Resize — garante lado menor >= 1024px
//   3. Padding — 12% do lado menor após resize, centraliza o subject

const BG_COLOR = "#808080";
const MIN_SIDE = 1024;
const PADDING_PCT = 0.12;

export type PreprocessResult = {
  dataUrl: string;
  mime: "image/png";
  width: number;
  height: number;
};

export function preprocessSubject(dataUrl: string): Promise<PreprocessResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      if (!srcW || !srcH) {
        reject(new Error("preprocess_invalid_dimensions"));
        return;
      }

      // 1. Resize — upscale se lado menor < 1024px (nunca downscale)
      const minSide = Math.min(srcW, srcH);
      const scale = minSide < MIN_SIDE ? MIN_SIDE / minSide : 1;
      const scaledW = Math.round(srcW * scale);
      const scaledH = Math.round(srcH * scale);

      // 2. Padding — 12% do lado menor após escala
      const padPx = Math.round(Math.min(scaledW, scaledH) * PADDING_PCT);
      const canvasW = scaledW + padPx * 2;
      const canvasH = scaledH + padPx * 2;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("preprocess_canvas_context_failed"));
        return;
      }

      // 3. Alpha composite — pinta o fundo antes de desenhar a imagem
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Desenha a imagem centralizada com padding
      ctx.drawImage(img, padPx, padPx, scaledW, scaledH);

      const outputDataUrl = canvas.toDataURL("image/png");
      resolve({
        dataUrl: outputDataUrl,
        mime: "image/png",
        width: canvasW,
        height: canvasH,
      });
    };

    img.onerror = () => reject(new Error("preprocess_image_load_failed"));
    img.src = dataUrl;
  });
}
