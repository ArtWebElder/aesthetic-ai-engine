/// <reference lib="deno.ns" />
// supabase/functions/expand-image/index.ts
// CREATYNG — Edge Function: expand-image (AI reframe / outpaint)
// Extends an image to a new aspect ratio via Replicate Bria Expand — the original
// stays intact (subject/product never cut), only the surrounding scene is generated.
// Body: { image, canvas_size:[w,h], original_image_size:[w,h], original_image_location:[x,y], ratio }
//   → { image: <output url>, ratio }
// Uses the existing REPLICATE_API_TOKEN secret.
//
// NOTE: field names follow Bria's documented Image-Expansion API. If the live
// Replicate schema differs, only the `input` object below needs adjusting.

import { corsHeaders } from "../_shared/cors.ts";

const REPLICATE_URL = "https://api.replicate.com/v1/models/bria/expand-image/predictions";

const FILL_PROMPT =
  "Extend the scene naturally, matching the existing lighting, colors, perspective and background texture. " +
  "Do not add any new people, products, subjects, logos or text.";

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function pickUrl(out: unknown): string | null {
  if (!out) return null;
  if (typeof out === "string") return out;
  if (Array.isArray(out)) return typeof out[0] === "string" ? out[0] : pickUrl(out[0]);
  if (typeof out === "object") {
    const o = out as Record<string, unknown>;
    return (o.image as string) || (o.result_url as string) || (o.url as string) || null;
  }
  return null;
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
    if (!image || typeof image !== "string") return json({ error: "no_image" }, 400, cors);

    const input: Record<string, unknown> = {
      image,
      prompt: FILL_PROMPT,
    };
    if (Array.isArray(body?.canvas_size)) input.canvas_size = body.canvas_size;
    if (Array.isArray(body?.original_image_size)) input.original_image_size = body.original_image_size;
    if (Array.isArray(body?.original_image_location)) input.original_image_location = body.original_image_location;
    if (typeof body?.ratio === "string") input.aspect_ratio = body.ratio; // harmless if unused

    const createResp = await fetch(REPLICATE_URL, {
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
      console.error("[expand-image] create failed:", details);
      return json({ error: "replicate_error", details: String(details).slice(0, 240) }, 502, cors);
    }

    let tries = 0;
    const TERMINAL = ["succeeded", "failed", "canceled"];
    while (pred?.status && !TERMINAL.includes(pred.status) && tries < 25 && pred?.urls?.get) {
      await new Promise((r) => setTimeout(r, 2000));
      const getResp = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${token}` } });
      pred = await getResp.json().catch(() => pred);
      tries++;
    }

    if (pred?.status !== "succeeded") {
      console.error("[expand-image] not succeeded:", pred?.status, pred?.error);
      return json({ error: "reframe_failed", details: String(pred?.error || pred?.status || "unknown").slice(0, 240) }, 502, cors);
    }

    const out = pickUrl(pred.output);
    if (!out) return json({ error: "no_output" }, 502, cors);

    return json({ image: out, ratio: body?.ratio ?? null }, 200, cors);
  } catch (e) {
    console.error("[expand-image] error:", e);
    return json({ error: "internal", details: String(e).slice(0, 200) }, 500, cors);
  }
});
