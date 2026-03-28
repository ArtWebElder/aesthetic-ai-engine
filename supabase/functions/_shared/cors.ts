// supabase/functions/_shared/cors.ts
// Shared CORS headers for all Edge Functions

export function corsHeaders(origin: string | null) {
  const allowOrigin = origin ?? "*";
  return {
    "access-control-allow-origin": allowOrigin === "null" ? "*" : allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers":
      "authorization, x-client-info, apikey, content-type, x-requested-with",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    vary: "Origin",
  };
}
