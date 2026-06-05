// src/lib/featureTiers.ts
// CREATYNG — Quality-tier registry (Eco / Pro / Ultra) per feature.
//
// SINGLE SOURCE OF TRUTH for, per feature and tier:
//   - which model/provider runs        (model)
//   - estimated provider cost in BRL    (providerCostBRL)  → used by the cost ledger (Phase 2)
//   - how many credits we charge        (credits)          → respects the margin floor
//   - which plan may use it             (minPlan)          → gating
//   - anonymous/free access + daily cap (anon)             → landing-isca limits
//
// Phase 1 (this file): frontend config only — consumed by creditCosts.calculateCost.
// Phase 2 (needs migration + deploy): backend reads `providerCostBRL` to record real
//          cost per generation; `anon.dailyCap` is enforced server-side / per IP.
// Phase 3 (needs deploy): Admin dashboard aggregates the ledger by model/feature.
//
// RULE: never charge fewer credits than `creditFloor(providerCostBRL)` — that is what
// keeps every paid tier above MIN_MARGIN. Free tiers (providerCostBRL === 0) charge 0.

export type Tier = 'eco' | 'pro' | 'ultra';
export type Plan = 'free' | 'pro' | 'team';

export interface TierSpec {
  /** Model id: 'browser:<lib>' runs client-side (cost 0), 'replicate:<owner>/<model>' calls Replicate. */
  model: string;
  /** Estimated provider cost per run, in BRL. 0 = runs client-side (no provider cost). */
  providerCostBRL: number;
  /** Credits charged to the user. Must be >= creditFloor(providerCostBRL). */
  credits: number;
  /** Minimum plan required to use this tier. */
  minPlan: Plan;
  /** Anonymous (logged-out) access — used by the public tool/landing pages. */
  anon: { enabled: boolean; dailyCap: number };
}

export interface FeatureSpec {
  id: string;
  /** i18n key base shared by Studio nodes and standalone tool pages. */
  labelKey: string;
  tiers: Partial<Record<Tier, TierSpec>>;
}

/** 1 credit ≈ R$0,099  (R$9,90 / 100 créditos). */
export const CREDIT_VALUE_BRL = 0.099;
/** Minimum gross margin we accept on any paid tier: (revenue - cost) / revenue. */
export const MIN_MARGIN = 0.45;

/** Lowest credit count that still respects MIN_MARGIN for a given provider cost. */
export function creditFloor(providerCostBRL: number): number {
  if (providerCostBRL <= 0) return 0;
  return Math.ceil(providerCostBRL / (CREDIT_VALUE_BRL * (1 - MIN_MARGIN)));
}

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, team: 2 };

// ── The quality ladder ────────────────────────────────────────────────────────
// Numbers below are the "caminho traçado": each feature climbs eco → pro → ultra.
// Credits already respect creditFloor(cost) so we never lose money.
export const FEATURE_TIERS: Record<string, FeatureSpec> = {
  remove_bg: {
    id: 'remove_bg',
    labelKey: 'tools.remove_bg',
    tiers: {
      // LIVE today — runs in the browser (@imgly), zero provider cost → free magnet.
      eco:   { model: 'browser:imgly',         providerCostBRL: 0,    credits: 0, minPlan: 'free', anon: { enabled: true,  dailyCap: 1 } },
      // Planned (needs Bria key + deploy) — premium edge quality (hair/glass).
      pro:   { model: 'replicate:bria/rmbg-2', providerCostBRL: 0.11, credits: 3, minPlan: 'pro',  anon: { enabled: false, dailyCap: 0 } },
      ultra: { model: 'replicate:bria/rmbg-2', providerCostBRL: 0.11, credits: 4, minPlan: 'team', anon: { enabled: false, dailyCap: 0 } },
    },
  },
  upscale: {
    id: 'upscale',
    labelKey: 'tools.upscale',
    tiers: {
      eco:   { model: 'replicate:nightmareai/real-esrgan',     providerCostBRL: 0.01, credits: 1, minPlan: 'free', anon: { enabled: true,  dailyCap: 1 } },
      pro:   { model: 'replicate:philz1337x/clarity-upscaler',  providerCostBRL: 0.07, credits: 2, minPlan: 'pro',  anon: { enabled: false, dailyCap: 0 } },
      ultra: { model: 'replicate:philz1337x/clarity-upscaler',  providerCostBRL: 0.27, credits: 5, minPlan: 'team', anon: { enabled: false, dailyCap: 0 } },
    },
  },
  generate: {
    id: 'generate',
    labelKey: 'tools.generate',
    tiers: {
      eco:   { model: 'replicate:black-forest-labs/flux-schnell',      providerCostBRL: 0.02, credits: 2, minPlan: 'free', anon: { enabled: false, dailyCap: 0 } },
      pro:   { model: 'replicate:black-forest-labs/flux-kontext-pro',   providerCostBRL: 0.22, credits: 5, minPlan: 'pro',  anon: { enabled: false, dailyCap: 0 } },
      ultra: { model: 'replicate:black-forest-labs/flux-1.1-pro-ultra', providerCostBRL: 0.33, credits: 7, minPlan: 'team', anon: { enabled: false, dailyCap: 0 } },
    },
  },
  thumbnail: {
    id: 'thumbnail',
    labelKey: 'tools.thumbnail',
    tiers: {
      // Text baked into the image needs a text-strong model — OpenAI GPT Image.
      // Needs OPENAI_API_KEY secret + edge deploy. Credits respect creditFloor(cost).
      pro:   { model: 'openai:gpt-image-1', providerCostBRL: 0.40, credits: 8,  minPlan: 'pro',  anon: { enabled: false, dailyCap: 0 } },
      ultra: { model: 'openai:gpt-image-1', providerCostBRL: 0.80, credits: 16, minPlan: 'team', anon: { enabled: false, dailyCap: 0 } },
    },
  },
  headshot: {
    id: 'headshot',
    labelKey: 'tools.headshot',
    tiers: {
      pro:   { model: 'replicate:black-forest-labs/flux-kontext-pro', providerCostBRL: 0.22, credits: 5, minPlan: 'pro',  anon: { enabled: false, dailyCap: 0 } },
      ultra: { model: 'replicate:zsxkib/instant-id',                  providerCostBRL: 0.27, credits: 7, minPlan: 'team', anon: { enabled: false, dailyCap: 0 } },
    },
  },
  recolor: {
    id: 'recolor',
    labelKey: 'tools.recolor',
    tiers: {
      // Canvas filters — client-side, zero cost.
      eco: { model: 'browser:canvas', providerCostBRL: 0, credits: 0, minPlan: 'free', anon: { enabled: true, dailyCap: 50 } },
    },
  },
  multiformat: {
    id: 'multiformat',
    labelKey: 'tools.multiformat',
    tiers: {
      // Reframe to multiple aspect ratios via Canvas (blurred fill) — client-side, free.
      eco: { model: 'browser:canvas', providerCostBRL: 0, credits: 0, minPlan: 'free', anon: { enabled: true, dailyCap: 50 } },
    },
  },
};

export function resolveTier(feature: string, tier: Tier): TierSpec | undefined {
  return FEATURE_TIERS[feature]?.tiers[tier];
}

/** Credits to charge for a feature+tier. Returns 0 for free tiers / unknown specs. */
export function creditsForFeature(feature: string, tier: Tier): number {
  return resolveTier(feature, tier)?.credits ?? 0;
}

/** Whether a plan is allowed to run a given feature+tier. */
export function planAllows(plan: Plan, feature: string, tier: Tier): boolean {
  const spec = resolveTier(feature, tier);
  if (!spec) return false;
  return PLAN_RANK[plan] >= PLAN_RANK[spec.minPlan];
}

/**
 * Map Studio preset-flow ids → (feature, tier) so a flow's credit cost is derived
 * from the tier registry instead of a separate hardcoded number. Flows not listed
 * here keep using the legacy CREDIT_COSTS map (see creditCosts.ts).
 */
export const FLOW_TIER_MAP: Record<string, { feature: string; tier: Tier }> = {
  'remove-bg': { feature: 'remove_bg', tier: 'eco' },
  'recolor': { feature: 'recolor', tier: 'eco' },
  // Upscale eco = Real-ESRGAN (~R$0.01) → 1 credit, still above the margin floor.
  'upscale': { feature: 'upscale', tier: 'eco' },
  // Multi-format reframing is client-side Canvas → free.
  'multi-format': { feature: 'multiformat', tier: 'eco' },
  // Generation modes stay on 'pro' until the backend is tier-aware (Phase 2):
  // today every generation runs on Flux (~R$0.22), so 'eco' pricing would lose money.
  'quote-card': { feature: 'generate', tier: 'pro' },
  'thumbnail': { feature: 'thumbnail', tier: 'pro' },
  'headshot': { feature: 'headshot', tier: 'pro' },
  'product-scene': { feature: 'generate', tier: 'pro' },
};
