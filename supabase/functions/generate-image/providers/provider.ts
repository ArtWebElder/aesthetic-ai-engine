export type ProviderGenerateInput = {
  prompt: string;
  negativePrompt: string | null;
  width: number;
  height: number;
  seed: number | null;
  module: string | null;
  strictIdentity: boolean;
  identityStrength: number | null;
  styleStrength: number | null;
  referenceImagesCount: number;
  subjectImage: {
    base64: string;
    mime: string;
    dataUrl: string;
    width: number;
    height: number;
    hash: string;
  };
  styleReferences?: Array<{
    base64: string;
    mime: string;
    weight: number;
    url: string;
  }>;
};

export type ProviderGenerateResult = {
  base64: string;
  payloadKind: string;
  raw?: unknown;
};

export interface Provider {
  name: string;
  supportsStrictIdentity: boolean;
  supportsStyleReference: boolean;
  generateTextToImage(input: ProviderGenerateInput): Promise<ProviderGenerateResult>;
  generateImageToImageStrict(input: ProviderGenerateInput): Promise<ProviderGenerateResult>;
}
