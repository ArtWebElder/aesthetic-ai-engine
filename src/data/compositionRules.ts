// src/data/compositionRules.ts
// CREATYNG — Composition rules for layout, zones, hierarchy, and aspect ratios.
// Used by compositionBuilder to position elements correctly.

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5';

export interface ZoneRange {
  yStart: number;
  yEnd: number;
}

export interface CompositionZones {
  overline: ZoneRange;
  subheadline: ZoneRange;
  headline: ZoneRange;
  subject: ZoneRange;
  cta: ZoneRange;
  price: ZoneRange;
  contactBar: ZoneRange;
  decorativeText: ZoneRange;
}

export interface AspectRatioConfig {
  dimensions: { width: number; height: number };
  compositionSpace: string;
  zones: CompositionZones;
  subjectPosition: string;
}

/** Default zones for 1:1 (used as fallback) */
export const COMPOSITION_ZONES: CompositionZones = {
  overline:       { yStart: 0.05, yEnd: 0.12 },
  subheadline:    { yStart: 0.10, yEnd: 0.20 },
  headline:       { yStart: 0.20, yEnd: 0.45 },
  subject:        { yStart: 0.15, yEnd: 0.75 },
  cta:            { yStart: 0.70, yEnd: 0.82 },
  price:          { yStart: 0.75, yEnd: 0.85 },
  contactBar:     { yStart: 0.90, yEnd: 0.97 },
  decorativeText: { yStart: 0.25, yEnd: 0.65 },
};

export const ASPECT_RATIO_CONFIGS: Record<AspectRatio, AspectRatioConfig> = {
  '1:1': {
    dimensions: { width: 1080, height: 1080 },
    compositionSpace: 'Position subject center-right, occupying 50% of frame. Leave top 25% darker for headline. Leave bottom 20% darker for CTA. Clean negative space on left.',
    zones: COMPOSITION_ZONES,
    subjectPosition: 'center-right',
  },
  '9:16': {
    dimensions: { width: 1080, height: 1920 },
    compositionSpace: 'Position subject in lower 55% of frame. Leave top 35% with dark gradient for headline. Subject fills width but NOT height. Bottom 12% for CTA.',
    zones: {
      overline:       { yStart: 0.04, yEnd: 0.08 },
      headline:       { yStart: 0.08, yEnd: 0.28 },
      subheadline:    { yStart: 0.28, yEnd: 0.34 },
      subject:        { yStart: 0.30, yEnd: 0.80 },
      cta:            { yStart: 0.82, yEnd: 0.88 },
      price:          { yStart: 0.75, yEnd: 0.82 },
      contactBar:     { yStart: 0.92, yEnd: 0.97 },
      decorativeText: { yStart: 0.15, yEnd: 0.55 },
    },
    subjectPosition: 'center-bottom',
  },
  '16:9': {
    dimensions: { width: 1920, height: 1080 },
    compositionSpace: 'Position subject on RIGHT 55% of frame. Leave LEFT 40% completely dark or soft gradient for headline text. Wide banner format — left side must be clean negative space. Bottom 12% darker for CTA strip.',
    zones: {
      overline:       { yStart: 0.10, yEnd: 0.22 },
      headline:       { yStart: 0.25, yEnd: 0.55 },
      subheadline:    { yStart: 0.55, yEnd: 0.68 },
      subject:        { yStart: 0.05, yEnd: 0.95 },
      cta:            { yStart: 0.72, yEnd: 0.85 },
      price:          { yStart: 0.65, yEnd: 0.75 },
      contactBar:     { yStart: 0.90, yEnd: 0.97 },
      decorativeText: { yStart: 0.20, yEnd: 0.70 },
    },
    subjectPosition: 'right',
  },
  '4:5': {
    dimensions: { width: 1080, height: 1350 },
    compositionSpace: 'Position subject center, occupying 45% of frame. Leave top 18% for overline. Leave bottom 25% for headline + CTA. Clean space around subject.',
    zones: {
      overline:       { yStart: 0.04, yEnd: 0.10 },
      subheadline:    { yStart: 0.08, yEnd: 0.16 },
      headline:       { yStart: 0.65, yEnd: 0.82 },
      subject:        { yStart: 0.12, yEnd: 0.65 },
      cta:            { yStart: 0.82, yEnd: 0.90 },
      price:          { yStart: 0.78, yEnd: 0.84 },
      contactBar:     { yStart: 0.93, yEnd: 0.98 },
      decorativeText: { yStart: 0.20, yEnd: 0.60 },
    },
    subjectPosition: 'center',
  },
};

/** Multipliers relative to headline size (headline = 1.0) */
export const SIZE_HIERARCHY = {
  headline:       1.0,
  subheadline:    0.35,
  overline:       0.22,
  cta:            0.30,
  price:          0.55,
  contactBar:     0.20,
  decorativeText: 2.5,
};

export const SPACING = {
  minGapBetweenElements: 0.04,
  headlinePadding: 0.06,
  subjectClearance: 0.08,
};

export const GRADIENT_OVERLAYS = {
  top: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, transparent 50%)',
  bottom: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 25%, transparent 55%)',
};

export function getAspectConfig(ratio: string): AspectRatioConfig {
  return ASPECT_RATIO_CONFIGS[ratio as AspectRatio] || ASPECT_RATIO_CONFIGS['1:1'];
}
