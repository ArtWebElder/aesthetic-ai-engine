export type EditorPresetOption = {
  value: string;
  label: string;
  labelKey?: string;
};

export const SUBJECT_TYPE_OPTIONS: EditorPresetOption[] = [
  { value: "person", label: "Person", labelKey: "editor.preset.subject_type.person" },
  { value: "couple", label: "Couple", labelKey: "editor.preset.subject_type.couple" },
  { value: "family", label: "Family", labelKey: "editor.preset.subject_type.family" },
  { value: "product", label: "Product", labelKey: "editor.preset.subject_type.product" },
  { value: "object", label: "Object", labelKey: "editor.preset.subject_type.object" },
  { value: "pet", label: "Pet", labelKey: "editor.preset.subject_type.pet" },
];

export const FRAMING_OPTIONS: EditorPresetOption[] = [
  { value: "close_up", label: "Close-up", labelKey: "editor.preset.framing.close_up" },
  { value: "medium_shot", label: "Medium shot", labelKey: "editor.preset.framing.medium_shot" },
  { value: "full_body", label: "Full body", labelKey: "editor.preset.framing.full_body" },
  { value: "wide", label: "Wide", labelKey: "editor.preset.framing.wide" },
];

export const EXPRESSION_OPTIONS: EditorPresetOption[] = [
  { value: "neutral", label: "Neutral", labelKey: "editor.preset.expression.neutral" },
  { value: "smiling", label: "Smiling", labelKey: "editor.preset.expression.smiling" },
  { value: "serious", label: "Serious", labelKey: "editor.preset.expression.serious" },
  { value: "confident", label: "Confident", labelKey: "editor.preset.expression.confident" },
];

export const ACTION_OPTIONS: EditorPresetOption[] = [
  { value: "standing", label: "Standing", labelKey: "editor.preset.action.standing" },
  { value: "walking", label: "Walking", labelKey: "editor.preset.action.walking" },
  { value: "pointing", label: "Pointing", labelKey: "editor.preset.action.pointing" },
  {
    value: "holding_product",
    label: "Holding product",
    labelKey: "editor.preset.action.holding_product",
  },
  {
    value: "looking_camera",
    label: "Looking at camera",
    labelKey: "editor.preset.action.looking_camera",
  },
];

export const LIGHTING_SETUP_OPTIONS: EditorPresetOption[] = [
  {
    value: "studio_softbox",
    label: "Studio softbox",
    labelKey: "editor.preset.lighting_setup.studio_softbox",
  },
  {
    value: "natural_window",
    label: "Natural window",
    labelKey: "editor.preset.lighting_setup.natural_window",
  },
  { value: "golden_hour", label: "Golden hour", labelKey: "editor.preset.lighting_setup.golden_hour" },
  {
    value: "dramatic_rim",
    label: "Dramatic rim light",
    labelKey: "editor.preset.lighting_setup.dramatic_rim",
  },
];

export const TEMPERATURE_OPTIONS: EditorPresetOption[] = [
  { value: "warm", label: "Warm", labelKey: "editor.preset.temperature.warm" },
  { value: "neutral", label: "Neutral", labelKey: "editor.preset.temperature.neutral" },
  { value: "cool", label: "Cool", labelKey: "editor.preset.temperature.cool" },
];

export const MOOD_OPTIONS: EditorPresetOption[] = [
  { value: "clean", label: "Clean", labelKey: "editor.preset.mood.clean" },
  { value: "premium", label: "Premium", labelKey: "editor.preset.mood.premium" },
  { value: "energetic", label: "Energetic", labelKey: "editor.preset.mood.energetic" },
  { value: "calm", label: "Calm", labelKey: "editor.preset.mood.calm" },
  { value: "moody", label: "Moody", labelKey: "editor.preset.mood.moody" },
];

export const MACRO_STYLE_OPTIONS: EditorPresetOption[] = [
  { value: "minimal", label: "Minimal", labelKey: "editor.preset.macro_style.minimal" },
  { value: "editorial", label: "Editorial", labelKey: "editor.preset.macro_style.editorial" },
  {
    value: "commercial_ads",
    label: "Commercial ads",
    labelKey: "editor.preset.macro_style.commercial_ads",
  },
  { value: "cinematic", label: "Cinematic", labelKey: "editor.preset.macro_style.cinematic" },
];

export const VISUAL_STYLE_OPTIONS: EditorPresetOption[] = [
  {
    value: "high_contrast",
    label: "High contrast",
    labelKey: "editor.preset.visual_style.high_contrast",
  },
  { value: "film_grain", label: "Film grain", labelKey: "editor.preset.visual_style.film_grain" },
  { value: "soft_glow", label: "Soft glow", labelKey: "editor.preset.visual_style.soft_glow" },
  { value: "natural_skin", label: "Natural skin", labelKey: "editor.preset.visual_style.natural_skin" },
  {
    value: "vibrant_colors",
    label: "Vibrant colors",
    labelKey: "editor.preset.visual_style.vibrant_colors",
  },
  {
    value: "muted_palette",
    label: "Muted palette",
    labelKey: "editor.preset.visual_style.muted_palette",
  },
];

export const ASSET_HIGHLIGHTS_OPTIONS: EditorPresetOption[] = [
  { value: "logo", label: "Logo", labelKey: "editor.preset.asset_highlights.logo" },
  {
    value: "product_texture",
    label: "Product texture",
    labelKey: "editor.preset.asset_highlights.product_texture",
  },
  {
    value: "hero_object",
    label: "Hero object",
    labelKey: "editor.preset.asset_highlights.hero_object",
  },
  { value: "badge", label: "Badge", labelKey: "editor.preset.asset_highlights.badge" },
  { value: "packaging", label: "Packaging", labelKey: "editor.preset.asset_highlights.packaging" },
  {
    value: "glass_reflection",
    label: "Glass reflection",
    labelKey: "editor.preset.asset_highlights.glass_reflection",
  },
  {
    value: "specular_highlights",
    label: "Specular highlights",
    labelKey: "editor.preset.asset_highlights.specular_highlights",
  },
  {
    value: "fabric_detail",
    label: "Fabric detail",
    labelKey: "editor.preset.asset_highlights.fabric_detail",
  },
];

export const CONTEXT_PROPS_OPTIONS: EditorPresetOption[] = [
  { value: "desk_setup", label: "Desk setup", labelKey: "editor.preset.context_props.desk_setup" },
  { value: "plants", label: "Plants", labelKey: "editor.preset.context_props.plants" },
  {
    value: "minimal_furniture",
    label: "Minimal furniture",
    labelKey: "editor.preset.context_props.minimal_furniture",
  },
  { value: "paper_props", label: "Paper props", labelKey: "editor.preset.context_props.paper_props" },
  { value: "tech_props", label: "Tech props", labelKey: "editor.preset.context_props.tech_props" },
  {
    value: "kitchen_props",
    label: "Kitchen props",
    labelKey: "editor.preset.context_props.kitchen_props",
  },
  {
    value: "studio_backdrop",
    label: "Studio backdrop",
    labelKey: "editor.preset.context_props.studio_backdrop",
  },
  {
    value: "lifestyle_scene",
    label: "Lifestyle scene",
    labelKey: "editor.preset.context_props.lifestyle_scene",
  },
];

export const MATERIAL_FEEL_OPTIONS: EditorPresetOption[] = [
  { value: "matte", label: "Matte", labelKey: "editor.preset.material_feel.matte" },
  { value: "glossy", label: "Glossy", labelKey: "editor.preset.material_feel.glossy" },
  { value: "metallic", label: "Metallic", labelKey: "editor.preset.material_feel.metallic" },
  { value: "glass", label: "Glass", labelKey: "editor.preset.material_feel.glass" },
  { value: "fabric", label: "Fabric", labelKey: "editor.preset.material_feel.fabric" },
  { value: "natural", label: "Natural", labelKey: "editor.preset.material_feel.natural" },
];

export const LENS_OPTIONS: EditorPresetOption[] = [
  { value: "24mm", label: "24mm", labelKey: "editor.preset.lens.24mm" },
  { value: "35mm", label: "35mm", labelKey: "editor.preset.lens.35mm" },
  { value: "50mm", label: "50mm", labelKey: "editor.preset.lens.50mm" },
  { value: "85mm", label: "85mm", labelKey: "editor.preset.lens.85mm" },
  { value: "macro", label: "Macro", labelKey: "editor.preset.lens.macro" },
];

export const DEPTH_OPTIONS: EditorPresetOption[] = [
  {
    value: "strong_bokeh",
    label: "Strong bokeh",
    labelKey: "editor.preset.depth.strong_bokeh",
  },
  {
    value: "medium_bokeh",
    label: "Medium bokeh",
    labelKey: "editor.preset.depth.medium_bokeh",
  },
  {
    value: "all_in_focus",
    label: "All in focus",
    labelKey: "editor.preset.depth.all_in_focus",
  },
];

export const ANGLE_OPTIONS: EditorPresetOption[] = [
  { value: "eye_level", label: "Eye level", labelKey: "editor.preset.angle.eye_level" },
  { value: "low_angle", label: "Low angle", labelKey: "editor.preset.angle.low_angle" },
  { value: "high_angle", label: "High angle", labelKey: "editor.preset.angle.high_angle" },
  { value: "top_down", label: "Top down", labelKey: "editor.preset.angle.top_down" },
  { value: "flat_lay", label: "Flat lay", labelKey: "editor.preset.angle.flat_lay" },
  { value: "angle_45", label: "45 angle", labelKey: "editor.preset.angle.angle_45" },
];

export const MOTION_OPTIONS: EditorPresetOption[] = [
  { value: "static", label: "Static", labelKey: "editor.preset.motion.static" },
  {
    value: "slight_motion_blur",
    label: "Slight motion blur",
    labelKey: "editor.preset.motion.slight_motion_blur",
  },
  { value: "dynamic_ads", label: "Dynamic ads", labelKey: "editor.preset.motion.dynamic_ads" },
];

export const FINISH_OPTIONS: EditorPresetOption[] = [
  {
    value: "true_to_life",
    label: "True to life",
    labelKey: "editor.preset.finish.true_to_life",
  },
  {
    value: "editorial_soft",
    label: "Editorial soft",
    labelKey: "editor.preset.finish.editorial_soft",
  },
  {
    value: "high_key_clean",
    label: "High key clean",
    labelKey: "editor.preset.finish.high_key_clean",
  },
  {
    value: "low_key_moody",
    label: "Low key moody",
    labelKey: "editor.preset.finish.low_key_moody",
  },
];

export const LAYOUT_BASE_OPTIONS: EditorPresetOption[] = [
  { value: "centered", label: "Centered", labelKey: "editor.preset.layout_base.centered" },
  {
    value: "rule_of_thirds",
    label: "Rule of thirds",
    labelKey: "editor.preset.layout_base.rule_of_thirds",
  },
  {
    value: "left_weighted",
    label: "Left weighted",
    labelKey: "editor.preset.layout_base.left_weighted",
  },
  {
    value: "right_weighted",
    label: "Right weighted",
    labelKey: "editor.preset.layout_base.right_weighted",
  },
];

export const SAFE_SPACE_OPTIONS: EditorPresetOption[] = [
  { value: "top", label: "Top", labelKey: "editor.preset.safe_space.top" },
  { value: "bottom", label: "Bottom", labelKey: "editor.preset.safe_space.bottom" },
  { value: "left", label: "Left", labelKey: "editor.preset.safe_space.left" },
  { value: "right", label: "Right", labelKey: "editor.preset.safe_space.right" },
  { value: "over", label: "Over subject", labelKey: "editor.preset.safe_space.over" },
];
