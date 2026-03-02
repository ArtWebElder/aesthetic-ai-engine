import type { Provider } from "./provider.ts";
import { vertexImagenProvider } from "./vertex-imagen.ts";

const geminiNanoBananaProProvider: Provider = {
  name: "gemini-nano-banana-pro",
  supportsStrictIdentity: true,
  supportsStyleReference: true,
  async generateTextToImage() {
    throw new Error("not_implemented");
  },
  async generateImageToImageStrict() {
    throw new Error("not_implemented");
  },
};

const replicateFluxKontextProProvider: Provider = {
  name: "replicate-flux-kontext-pro",
  supportsStrictIdentity: true,
  supportsStyleReference: true,
  async generateTextToImage() {
    throw new Error("not_implemented");
  },
  async generateImageToImageStrict() {
    throw new Error("not_implemented");
  },
};

export type ProviderKind =
  | "gemini-nano-banana-pro"
  | "replicate-flux-kontext-pro"
  | "vertex-imagen";

const providerRegistry: Record<ProviderKind, Provider> = {
  "gemini-nano-banana-pro": geminiNanoBananaProProvider,
  "replicate-flux-kontext-pro": replicateFluxKontextProProvider,
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
