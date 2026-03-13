/// <reference lib="deno.ns" />
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Preprocess movido para o frontend (Canvas API) — decisão 2026-03-06.
// Esta Edge Function recebe o subject já pré-processado (alpha composite + resize + padding).
// As funções abaixo apenas decodificam o base64 de entrada, calculam o hash SHA-256
// e retornam a estrutura esperada pelo pipeline — sem transformação de pixel.

export type PreprocessedSubject = {
  dataUrl: string;
  base64: string;
  mime: string;
  width: number;
  height: number;
  flags: {
    alphaComposited: boolean;
    upscaled: boolean;
    padded: boolean;
  };
  hash: string;
};

export type PreprocessOptions = Record<string, never>;

function normalizeMime(headerValue: string | null) {
  const mime = String(headerValue ?? "image/jpeg").split(";")[0].trim().toLowerCase();
  return mime || "image/jpeg";
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
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)));
}

// Preenchimento de flags: o frontend já fez o preprocess, sinalizamos como feito.
const FRONTEND_FLAGS = {
  alphaComposited: true,
  upscaled: true,
  padded: true,
};

export async function preprocessSubjectBase64(
  dataUri: string,
  _opts: PreprocessOptions = {},
): Promise<PreprocessedSubject> {
  if (!dataUri) throw new Error("subject_invalid_datauri: empty");

  let mime = "image/jpeg";
  let b64 = dataUri;

  const commaIdx = dataUri.indexOf(",");
  if (commaIdx !== -1 && dataUri.startsWith("data:")) {
    mime = dataUri.slice(5, commaIdx).split(";")[0].trim() || "image/jpeg";
    b64 = dataUri.slice(commaIdx + 1);
  }

  let bytes: Uint8Array;
  try {
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    throw new Error("subject_invalid_base64");
  }

  const detectedMime = detectMimeFromBytes(bytes);
  const finalMime = detectedMime ?? mime;
  if (!isAllowedImageMime(finalMime)) throw new Error(`subject_unsupported_mime:${finalMime}`);

  const hash = await sha256Hex(bytes);
  const base64 = encodeBase64(bytes);

  return {
    dataUrl: `data:${finalMime};base64,${base64}`,
    base64,
    mime: finalMime,
    width: 0,
    height: 0,
    flags: FRONTEND_FLAGS,
    hash,
  };
}

export async function preprocessSubjectImage(
  url: string,
  _opts: PreprocessOptions = {},
): Promise<PreprocessedSubject> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`subject_fetch_failed:${resp.status}`);

  const headerMime = normalizeMime(resp.headers.get("content-type"));
  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (!bytes.byteLength) throw new Error("subject_empty");

  const detectedMime = detectMimeFromBytes(bytes);
  const mime = detectedMime ?? headerMime;
  if (!isAllowedImageMime(mime)) throw new Error(`subject_unsupported_mime:${mime}`);

  const hash = await sha256Hex(bytes);
  const base64 = encodeBase64(bytes);

  return {
    dataUrl: `data:${mime};base64,${base64}`,
    base64,
    mime,
    width: 0,
    height: 0,
    flags: FRONTEND_FLAGS,
    hash,
  };
}
