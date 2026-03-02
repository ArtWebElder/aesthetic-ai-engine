import type { Provider } from "./provider.ts";
import { geminiImageProvider } from "./gemini-image.ts";
import { replicateFluxProvider } from "./replicate-flux.ts";
import { vertexImagenProvider } from "./vertex-imagen.ts";

export type ProviderKind =
  | "gemini-nano-banana-pro"
  | "replicate-flux-kontext-pro"
  | "vertex-imagen";

const providerRegistry: Record<ProviderKind, Provider> = {
  "gemini-nano-banana-pro": geminiImageProvider,
  "replicate-flux-kontext-pro": replicateFluxProvider,
  "vertex-imagen": vertexImagenProvider,
};

export function getProvider(kind: ProviderKind): Provider {
  return providerRegistry[kind];
}

export function selectProvider(input: { strictIdentity: boolean }): Provider {
  if (input.strictIdentity) {
    return providerRegistry["gemini-nano-banana-pro"];
  }
  return providerRegistry["vertex-imagen"];
}
