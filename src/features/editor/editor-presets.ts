export type EditorPresetOption = {
  value: string;
  label: string;
};

export const SUBJECT_TYPE_OPTIONS: EditorPresetOption[] = [
  { value: "person", label: "Person" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "product", label: "Product" },
  { value: "object", label: "Object" },
  { value: "pet", label: "Pet" },
];

export const FRAMING_OPTIONS: EditorPresetOption[] = [
  { value: "close_up", label: "Close-up" },
  { value: "medium_shot", label: "Medium shot" },
  { value: "full_body", label: "Full body" },
  { value: "wide", label: "Wide" },
];

export const EXPRESSION_OPTIONS: EditorPresetOption[] = [
  { value: "neutral", label: "Neutral" },
  { value: "smiling", label: "Smiling" },
  { value: "serious", label: "Serious" },
  { value: "confident", label: "Confident" },
];

export const ACTION_OPTIONS: EditorPresetOption[] = [
  { value: "standing", label: "Standing" },
  { value: "walking", label: "Walking" },
  { value: "pointing", label: "Pointing" },
  { value: "holding_product", label: "Holding product" },
  { value: "looking_camera", label: "Looking at camera" },
];

export const LIGHTING_SETUP_OPTIONS: EditorPresetOption[] = [
  { value: "studio_softbox", label: "Studio softbox" },
  { value: "natural_window", label: "Natural window" },
  { value: "golden_hour", label: "Golden hour" },
  { value: "dramatic_rim", label: "Dramatic rim light" },
];

export const TEMPERATURE_OPTIONS: EditorPresetOption[] = [
  { value: "warm", label: "Warm" },
  { value: "neutral", label: "Neutral" },
  { value: "cool", label: "Cool" },
];

export const MOOD_OPTIONS: EditorPresetOption[] = [
  { value: "clean", label: "Clean" },
  { value: "premium", label: "Premium" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "moody", label: "Moody" },
];

export const MACRO_STYLE_OPTIONS: EditorPresetOption[] = [
  { value: "minimal", label: "Minimal" },
  { value: "editorial", label: "Editorial" },
  { value: "commercial_ads", label: "Commercial ads" },
  { value: "cinematic", label: "Cinematic" },
];

export const VISUAL_STYLE_OPTIONS: EditorPresetOption[] = [
  { value: "high_contrast", label: "High contrast" },
  { value: "film_grain", label: "Film grain" },
  { value: "soft_glow", label: "Soft glow" },
  { value: "natural_skin", label: "Natural skin" },
  { value: "vibrant_colors", label: "Vibrant colors" },
  { value: "muted_palette", label: "Muted palette" },
];

export const ASSET_HIGHLIGHTS_OPTIONS: EditorPresetOption[] = [
  { value: "logo", label: "Logo" },
  { value: "product_texture", label: "Product texture" },
  { value: "hero_object", label: "Hero object" },
  { value: "badge", label: "Badge" },
  { value: "packaging", label: "Packaging" },
  { value: "glass_reflection", label: "Glass reflection" },
  { value: "specular_highlights", label: "Specular highlights" },
  { value: "fabric_detail", label: "Fabric detail" },
];

export const CONTEXT_PROPS_OPTIONS: EditorPresetOption[] = [
  { value: "desk_setup", label: "Desk setup" },
  { value: "plants", label: "Plants" },
  { value: "minimal_furniture", label: "Minimal furniture" },
  { value: "paper_props", label: "Paper props" },
  { value: "tech_props", label: "Tech props" },
  { value: "kitchen_props", label: "Kitchen props" },
  { value: "studio_backdrop", label: "Studio backdrop" },
  { value: "lifestyle_scene", label: "Lifestyle scene" },
];

export const MATERIAL_FEEL_OPTIONS: EditorPresetOption[] = [
  { value: "matte", label: "Matte" },
  { value: "glossy", label: "Glossy" },
  { value: "metallic", label: "Metallic" },
  { value: "glass", label: "Glass" },
  { value: "fabric", label: "Fabric" },
  { value: "natural", label: "Natural" },
];

export const LENS_OPTIONS: EditorPresetOption[] = [
  { value: "24mm", label: "24mm" },
  { value: "35mm", label: "35mm" },
  { value: "50mm", label: "50mm" },
  { value: "85mm", label: "85mm" },
  { value: "macro", label: "Macro" },
];

export const DEPTH_OPTIONS: EditorPresetOption[] = [
  { value: "strong_bokeh", label: "Strong bokeh" },
  { value: "medium_bokeh", label: "Medium bokeh" },
  { value: "all_in_focus", label: "All in focus" },
];

export const ANGLE_OPTIONS: EditorPresetOption[] = [
  { value: "eye_level", label: "Eye level" },
  { value: "low_angle", label: "Low angle" },
  { value: "high_angle", label: "High angle" },
  { value: "top_down", label: "Top down" },
  { value: "flat_lay", label: "Flat lay" },
  { value: "angle_45", label: "45 angle" },
];

export const MOTION_OPTIONS: EditorPresetOption[] = [
  { value: "static", label: "Static" },
  { value: "slight_motion_blur", label: "Slight motion blur" },
  { value: "dynamic_ads", label: "Dynamic ads" },
];

export const LAYOUT_BASE_OPTIONS: EditorPresetOption[] = [
  { value: "centered", label: "Centered" },
  { value: "rule_of_thirds", label: "Rule of thirds" },
  { value: "left_weighted", label: "Left weighted" },
  { value: "right_weighted", label: "Right weighted" },
];

export const SAFE_SPACE_OPTIONS: EditorPresetOption[] = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" },
];
