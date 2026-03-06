// src/types/brandKit.ts
// CREATYNG — MASTER SPEC DIFF 16.1
// Tipos do Brand Kit e Avatar. Usados por 16.2-16.6.
// O estilo visual do brand kit também é salvo como CreatygnPreset (type: 'brand_kit').

// ─── BRAND KIT ────────────────────────────────────────────────────────────────

export interface BrandKit {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;                  // URL no Supabase Storage

  colors: {
    primary: string;                 // hex
    secondary: string;               // hex
    neutral: string;                 // hex
    extras: string[];                // até 5 extras
  };

  fonts: {
    headline: string;                // Google Font name
    body: string;                    // Google Font name
  };

  style: {
    preset: "drama" | "clean" | "dark" | "editorial" | "neon";
    atmosphere: string;
    lighting: string;
  };

  presetId?: string;                 // UUID do CreatygnPreset correspondente (type: brand_kit)
  avatar?: BrandAvatar;             // avatar vinculado (opcional)

  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Estado do formulário de criação/edição (sem id e timestamps)
export type BrandKitDraft = Omit<BrandKit, "id" | "userId" | "createdAt" | "updatedAt" | "avatar" | "presetId">;

export const DEFAULT_BRAND_KIT_DRAFT: BrandKitDraft = {
  name: "Minha Marca",
  colors: {
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    neutral: "#111827",
    extras: [],
  },
  fonts: {
    headline: "Anton",
    body: "Inter",
  },
  style: {
    preset: "drama",
    atmosphere: "none",
    lighting: "none",
  },
  isDefault: false,
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────

export type AvatarStatus = "pending" | "processing" | "ready" | "error";

export interface BrandAvatar {
  id: string;
  brandKitId: string;
  userId: string;
  name: string;
  description?: string;             // gerado por IA

  referenceImages: string[];        // URLs no Storage (5-10 fotos)
  bestReference?: string;           // URL da melhor foto

  identityProfile: {
    gender?: string;
    approximateAge?: string;
    hairColor?: string;
    skinTone?: string;
    distinctiveFeatures?: string;
  };

  previewImages: string[];          // 4 previews gerados no onboarding
  status: AvatarStatus;

  createdAt: string;
  updatedAt: string;
}

// ─── SERIALIZAÇÃO (banco → tipo) ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function brandKitFromRow(row: any): BrandKit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    colors: {
      primary: row.color_primary,
      secondary: row.color_secondary,
      neutral: row.color_neutral,
      extras: row.color_extras ?? [],
    },
    fonts: {
      headline: row.font_headline,
      body: row.font_body,
    },
    style: {
      preset: row.style_preset,
      atmosphere: row.style_atmosphere,
      lighting: row.style_lighting,
    },
    presetId: row.preset_id ?? undefined,
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function avatarFromRow(row: any): BrandAvatar {
  return {
    id: row.id,
    brandKitId: row.brand_kit_id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    referenceImages: row.reference_images ?? [],
    bestReference: row.best_reference ?? undefined,
    identityProfile: {
      gender: row.identity_gender ?? undefined,
      approximateAge: row.identity_approximate_age ?? undefined,
      hairColor: row.identity_hair_color ?? undefined,
      skinTone: row.identity_skin_tone ?? undefined,
      distinctiveFeatures: row.identity_distinctive_features ?? undefined,
    },
    previewImages: row.preview_images ?? [],
    status: row.status ?? "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
