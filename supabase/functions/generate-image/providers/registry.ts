import type { Provider } from "./provider.ts";
import { geminiImageProvider } from "./gemini-image.ts";
import { replicateFluxProvider } from "./replicate-flux.ts";
import { vertexImagenProvider } from "./vertex-imagen.ts";
import { openaiImageProvider } from "./openai-image.ts";

export type ProviderKind =
  | "gemini-nano-banana-pro"
  | "replicate-flux-kontext-pro"
  | "openai-image"
  | "vertex-imagen";

const providerRegistry: Record<ProviderKind, Provider> = {
  "gemini-nano-banana-pro": geminiImageProvider,
  "replicate-flux-kontext-pro": replicateFluxProvider,
  "openai-image": openaiImageProvider,
  "vertex-imagen": vertexImagenProvider,
};

export function getProvider(kind: ProviderKind): Provider {
  return providerRegistry[kind];
}

export function selectProvider(input: { strictIdentity: boolean; module?: string | null }): Provider {
  // Thumbnail mode: text must be baked INTO the image → OpenAI GPT Image.
  // Routed by module so existing flows are unaffected.
  if (input.module === "sys-img-thumbnail") {
    return providerRegistry["openai-image"];
  }
  if (input.strictIdentity) {
    return providerRegistry["gemini-nano-banana-pro"];
  }
  // Non-strict: use Replicate Flux for text-to-image (Vertex stub is not implemented)
  return providerRegistry["replicate-flux-kontext-pro"];
}
