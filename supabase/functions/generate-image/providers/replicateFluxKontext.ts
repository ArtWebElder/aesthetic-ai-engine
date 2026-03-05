/// <reference lib="deno.ns" />
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

type StyleRef = {
  base64: string;
  mime: string;
  weight: number;
  url: string;
};

type ReplicateStrictInput = {
  prompt: string;
  subjectImageBase64: string;
  subjectImageMime: string;
  identityStrength: number;
  aspectRatio?: string;
  styleReferences?: StyleRef[];
};

type ReplicateStrictResult = {
  imageBase64: string;
  mimeType: string;
  meta: {
    providerName: string;
    payloadKind: "replicate_kontext";
    endpoint: "replicate:v1:predictions";
    version: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildIdentityDirective(identityStrength: number): string {
  if (identityStrength >= 95) {
    return "Preserve exact subject identity. Only minimal changes in scene and style.";
  }
  if (identityStrength >= 80) {
    return "Strongly preserve subject identity and core category. Avoid substitutions.";
  }
  return "Preserve the same subject category and recognizable identity.";
}

function pickOutputUrl(output: unknown): string | null {
  if (typeof output === "string" && output.trim()) return output;
  if (Array.isArray(output)) {
    for (const entry of output) {
      if (typeof entry === "string" && entry.trim()) return entry;
    }
  }
  return null;
}

export class ReplicateFluxKontextProvider {
  readonly name = "replicate-flux-kontext-pro" as const;
  private readonly token: string;
  private readonly version: string;

  constructor(input: { token: string; version?: string }) {
    this.token = input.token;
    this.version =
      input.version?.trim() ||
      String(Deno.env.get("REPLICATE_FLUX_KONTEXT_PRO_VERSION") ?? "").trim();

    if (!this.version) {
      throw new Error("replicate_missing_version");
    }
  }

  async generateImageToImageStrict(input: ReplicateStrictInput): Promise<ReplicateStrictResult> {
    const initImage = `data:${input.subjectImageMime};base64,${input.subjectImageBase64}`;

    // Pick the highest-weight style reference (if any)
    const styleRef = (input.styleReferences ?? []).sort((a, b) => b.weight - a.weight)[0];
    const styleRefDataUrl = styleRef
      ? `data:${styleRef.mime};base64,${styleRef.base64}`
      : null;

    const styleRefInstruction = styleRef
      ? `STYLE REFERENCE IMAGE (second image provided): Extract from this reference: lighting direction and color, color grading, atmospheric mood, depth of field style, background composition, particle effects, and overall visual quality level. Apply this exact visual style to the new scene. Do NOT copy people or specific objects from the reference. Style weight: ${styleRef.weight}/100 — this reference defines the aesthetic of the output.`
      : null;

    const prompt = [buildIdentityDirective(input.identityStrength), styleRefInstruction, input.prompt]
      .filter(Boolean)
      .join("\n");

    const payload = {
      version: this.version,
      input: {
        prompt,
        input_image: initImage,
        ...(styleRefDataUrl ? { style_image: styleRefDataUrl } : {}),
        ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
      },
    };

    const createResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const createText = await createResp.text();
    const createJson = (() => {
      try {
        return createText ? JSON.parse(createText) : null;
      } catch {
        return null;
      }
    })();

    if (!createResp.ok) {
      const retryAfter = createResp.headers.get("retry-after");
      let bodySnippet = (createText || "").slice(0, 300);
      if (createResp.status === 429 && retryAfter) {
        bodySnippet = bodySnippet
          ? `${bodySnippet} retry_after=${retryAfter}`
          : `retry_after=${retryAfter}`;
      }
      throw new Error(`replicate_create_failed:${createResp.status}:${bodySnippet}`);
    }

    const pollUrl = String(createJson?.urls?.get ?? "").trim();
    if (!pollUrl) {
      throw new Error("replicate_invalid_response:missing_poll_url");
    }

    const startedAt = Date.now();
    let pred: any = createJson;

    while (Date.now() - startedAt < 90_000) {
      const status = String(pred?.status ?? "");
      if (status === "succeeded") break;
      if (status === "failed" || status === "canceled") {
        throw new Error(`replicate_${status}:${String(pred?.error ?? "unknown").slice(0, 300)}`);
      }

      await sleep(900);

      const pollResp = await fetch(pollUrl, {
        method: "GET",
        headers: {
          Authorization: `Token ${this.token}`,
        },
      });
      const pollText = await pollResp.text();
      if (!pollResp.ok) {
        throw new Error(`replicate_poll_failed:${pollResp.status}:${(pollText || "").slice(0, 300)}`);
      }
      pred = pollText ? JSON.parse(pollText) : null;
    }

    if (String(pred?.status ?? "") !== "succeeded") {
      throw new Error("replicate_timeout");
    }

    const outputUrl = pickOutputUrl(pred?.output);
    if (!outputUrl) {
      throw new Error("replicate_invalid_response:missing_output_url");
    }

    const imageResp = await fetch(outputUrl, { method: "GET" });
    if (!imageResp.ok) {
      throw new Error(`replicate_output_fetch_failed:${imageResp.status}`);
    }

    const bytes = new Uint8Array(await imageResp.arrayBuffer());
    if (!bytes.byteLength) {
      throw new Error("replicate_output_empty");
    }

    const mimeType =
      String(imageResp.headers.get("content-type") ?? "").split(";")[0].trim() || "image/png";
    const imageBase64 = encodeBase64(bytes);

    return {
      imageBase64,
      mimeType,
      meta: {
        providerName: this.name,
        payloadKind: "replicate_kontext",
        endpoint: "replicate:v1:predictions",
        version: this.version,
      },
    };
  }
}
