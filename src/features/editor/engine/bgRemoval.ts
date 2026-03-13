// src/features/editor/engine/bgRemoval.ts
// CREATYNG — Pop Design Paradigm B — Background Removal
// Uses @imgly/background-removal (client-side ONNX) to isolate subject.

import { removeBackground, type Config } from "@imgly/background-removal";

const BG_REMOVAL_CONFIG: Config = {
  // No publicPath override — use the library's built-in default:
  // https://staticimgly.com/@imgly/background-removal-data/{version}/dist/
  output: {
    format: "image/png",
    quality: 1.0,
  },
};

/**
 * Convert a base64 data URL or raw base64 string to a Blob.
 */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const data = base64.startsWith("data:")
    ? base64.split(",")[1]
    : base64;
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

/**
 * Convert a Blob to a base64 data URL.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob as base64"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Remove background from a base64 image.
 * Returns a base64 PNG data URL with transparent background.
 *
 * Throws if the library fails — caller should handle and show error.
 */
export async function removeSubjectBackground(
  imageBase64: string,
): Promise<string> {
  const inputBlob = base64ToBlob(
    imageBase64,
    imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg",
  );

  const resultBlob = await removeBackground(inputBlob, BG_REMOVAL_CONFIG);
  return blobToBase64(resultBlob);
}
