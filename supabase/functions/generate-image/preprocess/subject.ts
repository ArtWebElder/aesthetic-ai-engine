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

export async function preprocessSubjectImage(url: string): Promise<PreprocessedSubject> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`subject_fetch_failed:${resp.status}`);
  }

  const mime = normalizeMime(resp.headers.get("content-type"));
  if (!isAllowedImageMime(mime)) {
    throw new Error(`subject_unsupported_mime:${mime}`);
  }

  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (!bytes.byteLength) throw new Error("subject_empty");

  // hard limit pra evitar WORKER_LIMIT
  const MAX_BYTES = 1_500_000; // ~1.5MB
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error(`subject_too_large:${bytes.byteLength}`);
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hash = toHex(new Uint8Array(hashBuffer));

  const base64 = encodeBase64(bytes);
  const dataUrl = `data:${mime};base64,${base64}`;

  // Sem decode/resize: leve e não estoura worker
  return {
    dataUrl,
    base64,
    mime,
    width: 0,
    height: 0,
    flags: {
      alphaComposited: false,
      upscaled: false,
      padded: false,
    },
    hash,
  };
}