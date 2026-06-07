/// <reference lib="deno.ns" />
// supabase/functions/upscale-image/index.ts
// CREATYNG — Edge Function: upscale-image
// Increases image resolution/sharpness via Replicate.
//   tier "eco"        → Real-ESRGAN (fast, cheap)         [default]
//   tier "pro"/"ultra"→ Clarity Upscaler (diffusion, premium detail)
// Body: { image: <url|dataURI>, scale: 2|4, tier?: "eco"|"pro"|"ultra" }
//   → { image: <output url>, scale, tier, engine }
// Uses the existing REPLICATE_API_TOKEN secret (no new key needed).

import { corsHeaders } from "../_shared/cors.ts";

// Model-scoped endpoints run each model's latest version — no version hash to pin.
const ESRGAN_URL = "https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions";
const CLARITY_URL = "https://api.replicate.com/v1/models/philz1337x/clarity-upscaler/predictions";

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

  const token = String(Deno.env.get("REPLICATE_API_TOKEN") ?? "").trim();
  if (!token) return json({ error: "replicate_token_missing" }, 500, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const image = body?.image;
    const scale = Math.min(4, Math.max(2, Number(body?.scale) || 4));
    const tier = ["eco", "pro", "ultra"].includes(String(body?.tier)) ? String(body?.tier) : "eco";
    if (!image || typeof image !== "string") return json({ error: "no_image" }, 400, cors);

    // Eco = Real-ESRGAN; Pro/Ultra = Clarity Upscaler (diffusion-based, slower).
    const useClarity = tier === "pro" || tier === "ultra";
    const url = useClarity ? CLARITY_URL : ESRGAN_URL;
    const input = useClarity
      ? {
          image,
          scale_factor: scale,
          creativity: 0.35,
          resemblance: 0.6,
          dynamic: tier === "ultra" ? 8 : 6,
          num_inference_steps: tier === "ultra" ? 18 : 12,
        }
      : { image, scale, face_enhance: false };
    // Clarity is diffusion-based and slower → poll longer before giving up.
    const maxTries = useClarity ? 90 : 25;

    // Create the prediction. `Prefer: wait` blocks up to ~60s and returns the
    // finished prediction inline when the model is fast enough.
    const createResp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
    });

    let pred = await createResp.json().catch(() => null);
    if (!createResp.ok || !pred) {
      const details = pred?.detail || pred?.title || `replicate ${createResp.status}`;
      console.error("[upscale-image] create failed:", details);
      return json({ error: "replicate_error", details: String(details).slice(0, 200) }, 502, cors);
    }

    // Fallback: if `wait` timed out, poll the prediction until terminal.
    let tries = 0;
    const TERMINAL = ["succeeded", "failed", "canceled"];
    while (pred?.status && !TERMINAL.includes(pred.status) && tries < maxTries && pred?.urls?.get) {
      await new Promise((r) => setTimeout(r, 2000));
      const getResp = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${token}` } });
      pred = await getResp.json().catch(() => pred);
      tries++;
    }

    if (pred?.status !== "succeeded") {
      console.error("[upscale-image] not succeeded:", pred?.status, pred?.error);
      return json({ error: "upscale_failed", details: String(pred?.error || pred?.status || "unknown").slice(0, 200) }, 502, cors);
    }

    const output = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!output) return json({ error: "no_output" }, 502, cors);

    return json({ image: output, scale, tier, engine: useClarity ? "clarity" : "esrgan" }, 200, cors);
  } catch (e) {
    console.error("[upscale-image] error:", e);
    return json({ error: "internal", details: String(e).slice(0, 200) }, 500, cors);
  }
});
