import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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

export type PreprocessOptions = {
  bg?: string;
  minSide?: number;
  paddingPct?: number;
};

const DEFAULT_BG = "#111827";
const DEFAULT_MIN_SIDE = 1024;
const DEFAULT_PADDING_PCT = 0.12;
const MAX_BYTES = 4_000_000;
const DECODE_ENABLED = (Deno.env.get("PREPROCESS_DECODE_ENABLED") ?? "").trim() === "true";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeMime(headerValue: string | null) {
  const mime = String(headerValue ?? "image/jpeg").split(";")[0].trim().toLowerCase();
  if (!mime) return "image/jpeg";
  return mime;
}

function isAllowedImageMime(mime: string) {
  return (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/webp"
  );
}

function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function readUint32BE(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] << 24) >>> 0) |
    ((bytes[offset + 1] << 16) >>> 0) |
    ((bytes[offset + 2] << 8) >>> 0) |
    (bytes[offset + 3] >>> 0)
  );
}

function readUint24LE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)) >>> 0;
}

function parsePngInfo(bytes: Uint8Array): { width: number; height: number; hasAlpha: boolean } | null {
  if (bytes.length < 33) return null;
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  const colorType = bytes[25];
  let hasAlpha = colorType === 4 || colorType === 6;

  let pos = 8;
  while (pos + 8 <= bytes.length) {
    const length = readUint32BE(bytes, pos);
    if (pos + 12 + length > bytes.length) break;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (type === "tRNS") {
      hasAlpha = true;
      break;
    }
    if (type === "IEND") break;
    pos += 12 + length;
  }

  if (!width || !height) return null;
  return { width, height, hasAlpha };
}

function parseJpegInfo(bytes: Uint8Array): { width: number; height: number; hasAlpha: boolean } | null {
  if (bytes.length < 4) return null;
  let offset = 2;
  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }
    let marker = bytes[offset + 1];
    while (marker === 0xff && offset + 2 < bytes.length) {
      offset++;
      marker = bytes[offset + 1];
    }
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 1 >= bytes.length) break;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSOF && segmentLength >= 7) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (width && height) return { width, height, hasAlpha: false };
      break;
    }
    offset += segmentLength;
  }
  return null;
}

function parseWebpInfo(bytes: Uint8Array): { width: number; height: number; hasAlpha: boolean } | null {
  if (bytes.length < 30) return null;
  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunkType === "VP8X") {
    const flags = bytes[20];
    const width = readUint24LE(bytes, 24) + 1;
    const height = readUint24LE(bytes, 27) + 1;
    return { width, height, hasAlpha: (flags & 0x10) !== 0 };
  }
  if (chunkType === "VP8L" && bytes.length >= 25) {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    const hasAlpha = (b3 & 0x10) !== 0;
    return { width, height, hasAlpha };
  }
  return null;
}

function getImageInfo(bytes: Uint8Array, mime: string): { width: number; height: number; hasAlpha: boolean } | null {
  if (mime === "image/png") return parsePngInfo(bytes);
  if (mime === "image/jpeg" || mime === "image/jpg") return parseJpegInfo(bytes);
  if (mime === "image/webp") return parseWebpInfo(bytes);
  return null;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function parseHexColorToRGBA(color: string): number {
  const hex = color.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0;
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0;
  }
  return ((0x11 << 24) | (0x18 << 16) | (0x27 << 8) | 0xff) >>> 0;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(hashBuffer));
}

export async function preprocessSubjectImage(
  url: string,
  opts: PreprocessOptions = {},
): Promise<PreprocessedSubject> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`subject_fetch_failed:${resp.status}`);
  }

  const headerMime = normalizeMime(resp.headers.get("content-type"));
  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (!bytes.byteLength) throw new Error("subject_empty");

  const detectedMime = detectMimeFromBytes(bytes);
  const mime = detectedMime ?? headerMime;
  if (!isAllowedImageMime(mime)) {
    throw new Error(`subject_unsupported_mime:${mime}`);
  }

  const intrinsic = getImageInfo(bytes, mime);
  const intrinsicWidth = intrinsic?.width ?? 0;
  const intrinsicHeight = intrinsic?.height ?? 0;
  const hasAlpha = intrinsic?.hasAlpha ?? mime === "image/png";

  if (bytes.byteLength > MAX_BYTES) {
    const hash = await sha256Hex(bytes);
    const base64 = encodeBase64(bytes);
    const dataUrl = `data:${mime};base64,${base64}`;
    return {
      dataUrl,
      base64,
      mime,
      width: intrinsicWidth,
      height: intrinsicHeight,
      flags: {
        alphaComposited: false,
        upscaled: false,
        padded: false,
      },
      hash,
    };
  }

  const minSide = Math.max(64, Math.round(Number(opts.minSide ?? DEFAULT_MIN_SIDE)));
  const paddingPct = clampNumber(Number(opts.paddingPct ?? DEFAULT_PADDING_PCT), 0, 0.4);
  const bg = parseHexColorToRGBA(opts.bg ?? DEFAULT_BG);

  let outBytes = bytes;
  let outMime = mime;
  let outWidth = intrinsicWidth;
  let outHeight = intrinsicHeight;
  const flags: PreprocessFlags = {
    alphaComposited: false,
    upscaled: false,
    padded: false,
  };

  // Real processing path. If decode/transform is unavailable in Edge runtime,
  // we keep deterministic fallback output with computed dimensions and hash.
  try {
    if (!DECODE_ENABLED) {
      throw new Error("preprocess_decode_disabled");
    }
    const { Image } = await import("https://esm.sh/imagescript@1.3.0?target=deno&no-dts");
    const decoded = await (Image as any).decode(bytes);
    let working: any = decoded;
    let currentWidth = Number(decoded?.width) || intrinsicWidth;
    let currentHeight = Number(decoded?.height) || intrinsicHeight;

    if (currentWidth > 0 && currentHeight > 0) {
      const currentMin = Math.min(currentWidth, currentHeight);
      if (currentMin < minSide) {
        const scale = minSide / currentMin;
        const targetWidth = Math.max(1, Math.round(currentWidth * scale));
        const targetHeight = Math.max(1, Math.round(currentHeight * scale));
        if (typeof working.resize === "function") {
          working = working.resize(targetWidth, targetHeight);
          currentWidth = targetWidth;
          currentHeight = targetHeight;
          flags.upscaled = true;
        }
      }

      const padPx = Math.max(0, Math.round(Math.min(currentWidth, currentHeight) * paddingPct));
      const needsBackgroundComposite = hasAlpha;
      const needsPad = padPx > 0;

      if (needsBackgroundComposite || needsPad) {
        const canvasWidth = currentWidth + padPx * 2;
        const canvasHeight = currentHeight + padPx * 2;
        const canvas = new (Image as any)(canvasWidth, canvasHeight);
        if (typeof canvas.fill === "function") {
          canvas.fill(bg);
        }
        if (typeof canvas.composite === "function") {
          canvas.composite(working, padPx, padPx);
        }
        working = canvas;
        flags.alphaComposited = needsBackgroundComposite;
        flags.padded = needsPad;
        currentWidth = canvasWidth;
        currentHeight = canvasHeight;
      }

      const encoded = typeof working.encode === "function" ? await working.encode() : null;
      const encodedBytes = encoded instanceof Uint8Array ? encoded : encoded ? new Uint8Array(encoded) : null;
      if (encodedBytes && encodedBytes.byteLength > 0) {
        outBytes = encodedBytes;
        outMime = "image/png";
        outWidth = currentWidth;
        outHeight = currentHeight;
      }
    }
  } catch {
    // Fallback path intentionally keeps original bytes/mime.
  }

  const hash = await sha256Hex(outBytes);
  const base64 = encodeBase64(outBytes);
  const dataUrl = `data:${outMime};base64,${base64}`;

  return {
    dataUrl,
    base64,
    mime: outMime,
    width: outWidth,
    height: outHeight,
    flags,
    hash,
  };
}
