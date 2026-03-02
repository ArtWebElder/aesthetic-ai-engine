import type { Provider } from "./provider.ts";

export const vertexImagenProvider: Provider = {
  name: "vertex-imagen",
  supportsStrictIdentity: false,
  supportsStyleReference: true,
  async generateTextToImage() {
    throw new Error("not_implemented");
  },
  async generateImageToImageStrict() {
    throw new Error("not_implemented");
  },
};
