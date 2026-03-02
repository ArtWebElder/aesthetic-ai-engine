import { Image } from "https://esm.sh/imagescript@1.3.0";

type PreprocessFlags = {
  alphaComposited: boolean;
  upscaled: boolean;
  padded: boolean;
};

export type PreprocessedSubject = {
  dataUrl: string;
  base64: string;
  mime: string;
  width: number;
  height: number;
  flags: PreprocessFlags;
  hash: string;
};

function uint8ToBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isPng(bytes: Uint8Array) {
  if (bytes.length < 8) return false;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

function pngHasAlphaChannelOrTrns(bytes: Uint8Array) {
  if (!isPng(bytes)) return false;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );

    if (type === "IHDR" && length >= 13 && offset + 8 + length <= bytes.length) {
      const colorType = bytes[offset + 8 + 9];
      if (colorType === 4 || colorType === 6) return true;
    }

    if (type === "tRNS") return true;
    if (type === "IEND") break;

    offset += 12 + length;
  }
  return false;
}

function getAlphaBoundingBox(image: any): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const width = Number(image?.width ?? 0);
  const height = Number(image?.height ?? 0);
  const bitmap = image?.bitmap as Uint8Array | undefined;
  if (!bitmap || bitmap.length !== width * height * 4) return null;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = bitmap[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

export async function preprocessSubjectImage(url: string): Promise<PreprocessedSubject> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`subject_fetch_failed: ${resp.status}`);
  }

  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error("subject_empty");
  const hasAlpha = pngHasAlphaChannelOrTrns(bytes);

  const decoded = await Image.decode(bytes);
  const srcW = Number(decoded.width);
  const srcH = Number(decoded.height);
  if (!srcW || !srcH) throw new Error("subject_invalid_dimensions");

  const pad = Math.max(1, Math.round(Math.max(srcW, srcH) * 0.12));
  const paddedW = srcW + pad * 2;
  const paddedH = srcH + pad * 2;

  const canvas = new Image(paddedW, paddedH);
  canvas.fill(0x0f172aff);

  let drawX = pad;
  let drawY = pad;

  if (hasAlpha) {
    const bbox = getAlphaBoundingBox(decoded);
    if (bbox) {
      const bboxCenterX = (bbox.minX + bbox.maxX) / 2;
      const bboxCenterY = (bbox.minY + bbox.maxY) / 2;
      drawX = Math.round(paddedW / 2 - bboxCenterX);
      drawY = Math.round(paddedH / 2 - bboxCenterY);
    }
  }

  canvas.composite(decoded, drawX, drawY);

  let out = canvas;
  let upscaled = false;
  const minSide = Math.min(paddedW, paddedH);
  if (minSide < 1024) {
    const scale = 1024 / minSide;
    const nextW = Math.max(1024, Math.round(paddedW * scale));
    const nextH = Math.max(1024, Math.round(paddedH * scale));
    out = out.resize(nextW, nextH);
    upscaled = true;
  }

  const outBytes = await out.encode();
  const hashBuffer = await crypto.subtle.digest("SHA-256", outBytes);
  const hash = toHex(new Uint8Array(hashBuffer));
  const base64 = uint8ToBase64(outBytes);

  return {
    dataUrl: `data:image/png;base64,${base64}`,
    base64,
    mime: "image/png",
    width: Number(out.width),
    height: Number(out.height),
    flags: {
      alphaComposited: hasAlpha,
      upscaled,
      padded: true,
    },
    hash,
  };
}
