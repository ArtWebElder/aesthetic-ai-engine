export type ProjectType = 'social_post' | 'ecom_banner' | 'photoshoot';

export type FormatPreset =
  | 'feed_1080x1350'
  | 'feed_1080'
  | 'story_1080x1920'
  | 'landscape_1200x628'
  | 'ecom_desktop_1920x800'
  | 'ecom_mobile_1080x1350'
  | 'square_1024';

export type StylePreset = 'minimal_clean' | 'bold_ads' | 'glass' | 'editorial';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  format: FormatPreset;
  stylePreset: StylePreset;
  createdAt: string;
  updatedAt: string;
}

export interface Generation {
  id: string;
  projectId: string;
  status: GenerationStatus;
  createdAt: string;
}

export interface CreditBalance {
  current: number;
}

export interface Template {
  id: string;
  name: string;
  category: 'social' | 'ecom' | 'photoshoot';
}

export const FORMAT_OPTIONS: Record<ProjectType, { value: FormatPreset; label: string }[]> = {
  social_post: [
    { value: 'feed_1080x1350', label: 'Feed 1080×1350' },
    { value: 'feed_1080', label: 'Feed 1080×1080' },
    { value: 'story_1080x1920', label: 'Story 1080×1920' },
    { value: 'landscape_1200x628', label: 'Landscape 1200×628' },
  ],
  ecom_banner: [
    { value: 'ecom_desktop_1920x800', label: 'Desktop 1920×800' },
    { value: 'ecom_mobile_1080x1350', label: 'Mobile 1080×1350' },
  ],
  photoshoot: [
    { value: 'square_1024', label: 'Square 1024×1024' },
  ],
};

export const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'minimal_clean', label: 'Minimal Clean' },
  { value: 'bold_ads', label: 'Bold Ads' },
  { value: 'glass', label: 'Glass' },
  { value: 'editorial', label: 'Editorial' },
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  social_post: 'Social Post',
  ecom_banner: 'E-com Banner',
  photoshoot: 'Photoshoot',
};
