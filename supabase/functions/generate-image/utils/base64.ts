import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

export function uint8ToBase64(bytes: Uint8Array): string {
  return encodeBase64(bytes);
}

export async function fetchUrlAsBase64(url: string): Promise<{ base64: string; mime: string; byteLength: number }> {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`fetch_url_failed:${resp.status}`);
  }
  const mime = String(resp.headers.get("content-type") ?? "image/png")
    .split(";")[0]
    .trim()
    .toLowerCase() || "image/png";
  const bytes = new Uint8Array(await resp.arrayBuffer());
  if (!bytes.byteLength) {
    throw new Error("fetch_url_empty");
  }
  return { base64: uint8ToBase64(bytes), mime, byteLength: bytes.byteLength };
}
