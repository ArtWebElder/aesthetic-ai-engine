/// <reference lib="deno.ns" />
import type { Provider } from "./provider.ts";

const GEMINI_MODEL = "gemini-3-pro-image-preview";
const GEMINI_TIMEOUT_MS = 60_000;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildGeminiInstruction(input: Parameters<Provider["generateImageToImageStrict"]>[0]): string {
  const identityStrength = Math.max(0, Math.min(100, Number(input.identityStrength ?? 90)));
  const styleStrength = Math.max(0, Math.min(100, Number(input.styleStrength ?? 45)));

  // Deterministic mapping: stronger identity => lower visual deviation.
  const variationLevel = Number((1 - clamp01(identityStrength / 100) * 0.85).toFixed(2));
  const styleInfluence = Number(clamp01(styleStrength / 100).toFixed(2));

  const lines = [
    "Create a photoreal image variation preserving the exact subject identity.",
    `Identity lock: ${identityStrength}/100. Variation level: ${variationLevel}.`,
    `Style influence: ${styleStrength}/100 (${styleInfluence}).`,
    `Prompt: ${input.prompt}`,
  ];
  if (input.negativePrompt) {
    lines.push(`Avoid: ${input.negativePrompt}`);
  }
  return lines.join("\n");
}

function extractGeminiImageBase64(raw: any): string | null {
  const candidates = Array.isArray(raw?.candidates) ? raw.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const data = part?.inline_data?.data ?? part?.inlineData?.data ?? null;
      if (typeof data === "string" && data.trim()) {
        return data;
      }
    }
  }
  return null;
}

export const geminiImageProvider: Provider = {
  name: "gemini-nano-banana-pro",
  supportsStrictIdentity: true,
  supportsStyleReference: true,
  async generateTextToImage() {
    throw new Error("not_implemented");
  },
  async generateImageToImageStrict(input) {
    const apiKey = String(Deno.env.get("GEMINI_API_KEY") ?? "").trim();
    if (!apiKey) {
      throw new Error("gemini_missing_api_key");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const parts: Array<Record<string, unknown>> = [
      { text: buildGeminiInstruction(input) },
      {
        inline_data: {
          mime_type: input.subjectImage.mime,
          data: input.subjectImage.base64,
        },
      },
    ];

    const styleRef = (input.styleReferences ?? [])
      .sort((a, b) => b.weight - a.weight)[0];
    if (styleRef) {
      parts.push({
        text: `Use this second image as style guidance only. styleWeight=${Math.max(0, Math.min(100, styleRef.weight))}/100.`,
      });
      parts.push({
        inline_data: {
          mime_type: styleRef.mime,
          data: styleRef.base64,
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("gemini_timeout"), GEMINI_TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
        signal: controller.signal,
      });

      const text = await resp.text();
      const parsed = text ? JSON.parse(text) : null;

      if (!resp.ok) {
        throw new Error(`gemini_http_${resp.status}:${(text || "request_failed").slice(0, 280)}`);
      }

      const base64 = extractGeminiImageBase64(parsed);
      if (!base64) {
        throw new Error("gemini_invalid_response:no_image_data");
      }

      return {
        base64,
        payloadKind: "gemini_img2img_strict",
        raw: {
          candidates: Array.isArray(parsed?.candidates) ? parsed.candidates.length : 0,
          model: GEMINI_MODEL,
          usedStyleReference: Boolean(styleRef),
        },
      };
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (msg.includes("AbortError") || msg.includes("gemini_timeout")) {
        throw new Error("gemini_timeout");
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  },
};
