/// <reference lib="deno.ns" />
// supabase/functions/upscale-image/index.ts
// CREATYNG — Edge Function: upscale-image
// Increases image resolution/sharpness via Replicate Real-ESRGAN.
// Body: { image: <url|dataURI>, scale: 2|4 } → { image: <output url>, scale }
// Uses the existing REPLICATE_API_TOKEN secret (no new key needed).

import { corsHeaders } from "../_shared/cors.ts";

// Model-scoped endpoint runs the model's latest version — no version hash to pin.
const REPLICATE_URL = "https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions";

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
    if (!image || typeof image !== "string") return json({ error: "no_image" }, 400, cors);

    // Create the prediction. `Prefer: wait` blocks up to ~60s and returns the
    // finished prediction inline when the model is fast (Real-ESRGAN usually is).
    const createResp = await fetch(REPLICATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input: { image, scale, face_enhance: false } }),
    });

    let pred = await createResp.json().catch(() => null);
    if (!createResp.ok || !pred) {
      const details = pred?.detail || pred?.title || `replicate ${createResp.status}`;
      console.error("[upscale-image] create failed:", details);
      return json({ error: "replicate_error", details: String(details).slice(0, 200) }, 502, cors);
    }

    // Fallback: if `wait` timed out, poll the prediction a few times.
    let tries = 0;
    const TERMINAL = ["succeeded", "failed", "canceled"];
    while (pred?.status && !TERMINAL.includes(pred.status) && tries < 25 && pred?.urls?.get) {
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

    return json({ image: output, scale }, 200, cors);
  } catch (e) {
    console.error("[upscale-image] error:", e);
    return json({ error: "internal", details: String(e).slice(0, 200) }, 500, cors);
  }
});
