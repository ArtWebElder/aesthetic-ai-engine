import type { Provider } from "./provider.ts";
import { fetchUrlAsBase64 } from "../utils/base64.ts";

const REPLICATE_TIMEOUT_MS = 90_000;
const REPLICATE_POLL_MS = 1_200;

// Official model path: /v1/models/{owner}/{name}/predictions
const REPLICATE_MODEL_OWNER = "black-forest-labs";
const REPLICATE_MODEL_NAME = "flux-kontext-pro";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickOutputUrl(raw: any): string | null {
  const output = raw?.output;
  if (typeof output === "string" && output.trim()) return output.trim();

  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

export const replicateFluxProvider: Provider = {
  name: "replicate-flux-kontext-pro",
  supportsStrictIdentity: true,
  supportsStyleReference: true,

  async generateTextToImage() {
    throw new Error("not_implemented");
  },

  async generateImageToImageStrict(input) {
    const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
    if (!token) throw new Error("replicate_missing_api_token");

    const styleRef = (input.styleReferences ?? []).sort((a, b) => b.weight - a.weight)[0];

    const promptLines = [
      "Create a photoreal variation preserving exact subject identity.",
      input.prompt,
    ];
    if (input.negativePrompt) promptLines.push(`Avoid: ${input.negativePrompt}`);
    if (styleRef) promptLines.push("Use style guidance from style image while preserving subject identity.");

    const createUrl = `https://api.replicate.com/v1/models/${encodeURIComponent(
      REPLICATE_MODEL_OWNER
    )}/${encodeURIComponent(REPLICATE_MODEL_NAME)}/predictions`;

    const createResp = await fetch(createUrl, {
      method: "POST",
      headers: {
        // Replicate accepts Bearer in the OpenAPI, but Token also works in many examples.
        // We'll use Bearer for max compatibility.
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: promptLines.join("\n"),
          // For image-to-image, most replicate models accept an "image" input.
          // Flux Kontext variants commonly accept image input fields; if yours differs,
          // we’ll adjust after reading the model schema.
          input_image: input.subjectImage.dataUrl,
          ...(styleRef ? { style_image: `data:${styleRef.mime};base64,${styleRef.base64}` } : {}),
        },
      }),
    });

    const createText = await createResp.text();
    const createParsed = createText ? JSON.parse(createText) : null;

    if (!createResp.ok) {
      throw new Error(`replicate_http_${createResp.status}:${(createText || "request_failed").slice(0, 280)}`);
    }

    const pollUrl = String(createParsed?.urls?.get ?? "").trim();
    if (!pollUrl) throw new Error("replicate_invalid_response:missing_poll_url");

    const startedAt = Date.now();
    let last: any = createParsed;

    while (Date.now() - startedAt < REPLICATE_TIMEOUT_MS) {
      const status = String(last?.status ?? "");
      if (status === "succeeded") break;

      if (status === "failed" || status === "canceled") {
        throw new Error(`replicate_${status}:${String(last?.error ?? "no_error").slice(0, 280)}`);
      }

      await sleep(REPLICATE_POLL_MS);

      const pollResp = await fetch(pollUrl, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const pollText = await pollResp.text();
      if (!pollResp.ok) {
        throw new Error(`replicate_poll_http_${pollResp.status}:${(pollText || "poll_failed").slice(0, 280)}`);
      }

      last = pollText ? JSON.parse(pollText) : null;
    }

    if (String(last?.status ?? "") !== "succeeded") {
      throw new Error("replicate_timeout");
    }

    const outputUrl = pickOutputUrl(last);
    if (!outputUrl) throw new Error("replicate_invalid_response:missing_output_url");

    const output = await fetchUrlAsBase64(outputUrl);

    return {
      base64: output.base64,
      payloadKind: "replicate_flux_kontext_pro_strict",
      raw: {
        status: last?.status,
        model: `${REPLICATE_MODEL_OWNER}/${REPLICATE_MODEL_NAME}`,
        usedStyleReference: Boolean(styleRef),
      },
    };
  },
};