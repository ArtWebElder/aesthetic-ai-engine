// supabase/functions/generate-image/providers/openai-image.ts
// CREATYNG — OpenAI GPT Image provider.
//
// Purpose: render text INTO the generated image (legible, integrated typography),
// which Flux/Gemini handle poorly. Used by the Thumbnail mode, routed via
// registry.selectProvider when module === 'sys-img-thumbnail'.
//
// Requires the Supabase Edge Function secret OPENAI_API_KEY. The model id is
// configurable via OPENAI_IMAGE_MODEL (default 'gpt-image-1') so it can be bumped
// to a newer GPT Image without a code change. Quality via OPENAI_IMAGE_QUALITY.

import type {
  Provider,
  ProviderGenerateInput,
  ProviderGenerateResult,
} from "./provider.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/images";
const MODEL = String(Deno.env.get("OPENAI_IMAGE_MODEL") ?? "gpt-image-1").trim();
const QUALITY = String(Deno.env.get("OPENAI_IMAGE_QUALITY") ?? "medium").trim();

function getApiKey(): string {
  const key = String(Deno.env.get("OPENAI_API_KEY") ?? "").trim();
  if (!key) throw new Error("openai_missing_api_key");
  return key;
}

// gpt-image-1 accepts a fixed set of sizes. Pick the closest to the request.
function pickSize(width: number, height: number): string {
  const ratio = width / Math.max(1, height);
  if (ratio >= 1.2) return "1536x1024"; // landscape (thumbnails / 16:9-ish)
  if (ratio <= 0.83) return "1024x1536"; // portrait
  return "1024x1024"; // square
}

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBase64(json: any): string {
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64 || typeof b64 !== "string") {
    throw new Error("openai_no_image_in_response");
  }
  return b64;
}

async function generate(
  input: ProviderGenerateInput,
  withSubject: boolean,
): Promise<ProviderGenerateResult> {
  const apiKey = getApiKey();
  const size = pickSize(input.width, input.height);

  if (withSubject && input.subjectImage?.base64) {
    // Image edit — keep the uploaded subject, restyle around it and bake the text.
    const form = new FormData();
    form.append("model", MODEL);
    form.append("prompt", input.prompt);
    form.append("size", size);
    form.append("quality", QUALITY);
    const bytes = b64ToBytes(input.subjectImage.base64);
    const mime = input.subjectImage.mime || "image/png";
    form.append("image", new Blob([bytes], { type: mime }), "subject.png");

    const res = await fetch(`${OPENAI_API_URL}/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`openai_edits_failed_${res.status}: ${err.slice(0, 300)}`);
    }
    const json = await res.json();
    return {
      base64: extractBase64(json),
      payloadKind: "openai_gpt_image_edit",
      raw: { model: MODEL, size },
    };
  }

  // Text-to-image generation.
  const res = await fetch(`${OPENAI_API_URL}/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: input.prompt,
      size,
      quality: QUALITY,
      n: 1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`openai_generations_failed_${res.status}: ${err.slice(0, 300)}`);
  }
  const json = await res.json();
  return {
    base64: extractBase64(json),
    payloadKind: "openai_gpt_image_t2i",
    raw: { model: MODEL, size },
  };
}

export const openaiImageProvider: Provider = {
  name: "openai-gpt-image",
  supportsStrictIdentity: true,
  supportsStyleReference: false,
  generateTextToImage: (input) => generate(input, false),
  generateImageToImageStrict: (input) => generate(input, true),
};
