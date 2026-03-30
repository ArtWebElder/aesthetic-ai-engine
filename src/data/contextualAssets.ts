// src/data/contextualAssets.ts
// CREATYNG — Contextual assets for scene generation prompts.
// Each niche has specific props, lighting, mood, surfaces, and camera settings.

export interface NicheContext {
  assets: string[];
  lighting: string;
  mood: string;
  surfaces: string[];
  colorGrade: string;
  cameraSettings: string;
  negativePrompt: string;
}

export const NICHE_CONTEXTS: Record<string, NicheContext> = {
  burger: {
    assets: ['crispy bacon strips', 'melting cheddar dripping', 'fresh lettuce leaves', 'sesame bun with steam', 'scattered french fries', 'craft beer glass with condensation', 'small sauce bowls with ketchup and mustard', 'scattered sesame seeds on surface'],
    lighting: 'dramatic warm side lighting from left, deep shadows on right, rim light on burger edges highlighting steam, golden hour warmth, subtle smoke rising',
    mood: 'dark moody rustic premium steakhouse, appetizing, indulgent',
    surfaces: ['dark walnut cutting board', 'black slate plate', 'rustic parchment paper', 'dark marble counter'],
    colorGrade: 'warm teal and orange color grading, rich deep blacks, warm highlights',
    cameraSettings: 'Canon EOS R5, 85mm f/1.8, shallow depth of field with background blur, low angle hero shot, commercial food photography',
    negativePrompt: 'text, watermark, logo, blurry, low quality, plastic looking food, flat lighting, overhead shot',
  },
  acai: {
    assets: ['frozen blueberries and strawberries scattered', 'granola clusters on top', 'honey drizzle mid-pour', 'fresh banana slices', 'coconut flakes', 'mint leaf garnish', 'condensation droplets on bowl'],
    lighting: 'bright natural window light from top-left, soft diffused shadows, fresh morning sunlight feel, slight lens flare',
    mood: 'fresh tropical vibrant healthy, summer morning, organic natural',
    surfaces: ['coconut shell bowl', 'light bamboo tray', 'white marble surface', 'tropical leaf underneath'],
    colorGrade: 'vibrant saturated colors, bright whites, deep purple acai contrast',
    cameraSettings: 'Sony A7IV, 50mm f/2.0, slightly overhead 45-degree angle, lifestyle food photography, natural light',
    negativePrompt: 'text, watermark, dark moody, artificial lighting, processed food look',
  },
  pizza: {
    assets: ['melting mozzarella cheese pull', 'fresh basil leaves', 'olive oil drizzle', 'scattered red chili flakes', 'flour dust in air', 'tomato sauce splash', 'garlic cloves'],
    lighting: 'warm wood-fired oven glow from behind, rustic warm ambiance, fire reflection on cheese, dramatic contrast',
    mood: 'italian artisan authentic wood-fired, rustic cozy trattoria',
    surfaces: ['wooden pizza peel', 'rustic stone counter', 'flour-dusted marble', 'red checkered napkin'],
    colorGrade: 'warm rustic tones, golden highlights, deep warm shadows',
    cameraSettings: 'Canon 5D Mark IV, 35mm f/2.8, eye-level angle, slight tilt, editorial food photography',
    negativePrompt: 'text, watermark, microwave, frozen pizza, flat light, clean modern setting',
  },
  sushi: {
    assets: ['small soy sauce dish with reflection', 'bamboo chopsticks resting elegantly', 'fresh wasabi dollop', 'pickled ginger slices', 'bamboo rolling mat', 'sake cup'],
    lighting: 'clean soft overhead light, minimal shadows, zen simplicity, slight backlight creating glow on fish',
    mood: 'japanese minimalist precise clean, omakase experience, zen tranquility',
    surfaces: ['black slate sushi board', 'light bamboo mat', 'dark ceramic plate', 'polished wood counter'],
    colorGrade: 'clean neutral tones, slight cool temperature, high clarity, subtle contrast',
    cameraSettings: 'Sony A7RV, 90mm macro f/2.8, overhead flat lay or slight angle, precision food photography',
    negativePrompt: 'text, watermark, messy, western style plating, bright colors, casual setting',
  },
  advocacia: {
    assets: ['mahogany gavel on sound block', 'stack of leather-bound law books', 'brass scales of justice', 'legal documents with seal', 'gold fountain pen', 'reading glasses on documents'],
    lighting: 'dramatic Rembrandt side lighting, deep moody shadows, warm desk lamp glow, volumetric light through window blinds',
    mood: 'professional authoritative dark elegance, old-money law firm, serious gravitas',
    surfaces: ['polished mahogany desk', 'dark green leather surface', 'marble desk accent', 'dark wood paneling background'],
    colorGrade: 'dark moody cinematic, warm gold highlights, deep black shadows, slight film grain',
    cameraSettings: 'Nikon Z8, 50mm f/1.4, shallow depth of field, low key lighting, editorial portrait style',
    negativePrompt: 'text, watermark, bright cheerful, modern office, casual, flat lighting',
  },
  barbearia: {
    assets: ['vintage straight razor', 'badger shaving brush with foam', 'leather barber chair detail', 'vintage hair tonics bottles', 'hot towel steaming', 'scattered hair clippings'],
    lighting: 'warm vintage tungsten lighting, deep amber shadows, slight haze, neon sign glow from background',
    mood: "vintage masculine grooming, old-school barbershop, gentleman's club feel",
    surfaces: ['worn leather', 'dark marble counter', 'antique wood shelf', 'mirror reflection'],
    colorGrade: 'warm vintage desaturated, amber highlights, moody browns',
    cameraSettings: 'Fujifilm X-T5, 35mm f/1.4, environmental portrait style, slight film emulation',
    negativePrompt: 'text, watermark, modern salon, bright lighting, feminine, clean sterile',
  },
  tech: {
    assets: ['floating 3D app icons', 'glowing screen reflections', 'RGB keyboard glow', 'code on monitors in background', 'neon light strips', 'cable management visible'],
    lighting: 'colored neon ambient lighting, screen glow illuminating face, RGB accents, dark room with colored light sources, volumetric haze',
    mood: 'dark tech futuristic, gaming setup, developer workspace, cyberpunk influenced',
    surfaces: ['matte black desk', 'carbon fiber texture', 'brushed aluminum', 'dark concrete wall'],
    colorGrade: 'teal and purple color grading, deep blacks, neon accent colors, high contrast',
    cameraSettings: 'Sony A7SIII, 24mm f/1.4, environmental portrait, wide establishing shot, cinematic aspect ratio',
    negativePrompt: 'text, watermark, bright office, daytime, cluttered desk, low quality monitors',
  },
  moda: {
    assets: ['fabric texture details', 'fashion magazine nearby', 'designer sunglasses', 'luxury handbag', 'gold jewelry accents', 'fresh flowers'],
    lighting: 'editorial studio lighting, large soft diffused key light, slight rim light for separation, clean white fill',
    mood: 'editorial high fashion aspirational, vogue style, luxury lifestyle',
    surfaces: ['white seamless backdrop', 'textured linen', 'concrete floor', 'natural stone'],
    colorGrade: 'desaturated editorial, slight warm shift, creamy skin tones, fashion magazine look',
    cameraSettings: 'Phase One IQ4, 120mm f/2.8, fashion editorial style, full body or waist-up, high fashion posing',
    negativePrompt: 'text, watermark, casual setting, snapchat filter, low resolution, amateur photography',
  },
};

export function getNicheContext(niche: string): NicheContext {
  const lower = niche.toLowerCase();
  for (const [key, ctx] of Object.entries(NICHE_CONTEXTS)) {
    if (lower.includes(key)) return ctx;
  }
  return {
    assets: ['relevant contextual props'],
    lighting: 'professional studio lighting, soft shadows, clean illumination',
    mood: 'professional commercial photography',
    surfaces: ['clean neutral surface'],
    colorGrade: 'balanced professional color grading',
    cameraSettings: 'professional DSLR, 50mm f/2.0, commercial photography style',
    negativePrompt: 'text, watermark, blurry, low quality',
  };
}

/** Detect niche from free text (headline, subheadline, instructions) */
export function detectNicheFromText(text: string): string {
  const lower = text.toLowerCase();
  const patterns: [RegExp, string][] = [
    [/burger|burguer|hambúrguer|hamburger|smash|lanche/, 'burger'],
    [/açaí|acai|frozen|smoothie|sorvete|gelato|milkshake/, 'acai'],
    [/pizza|pizzaria|italiana|massa|lasanha/, 'pizza'],
    [/sushi|sashimi|temaki|japonês|japa|uramaki/, 'sushi'],
    [/advocacia|advogado|jurídico|direito|penal|trabalhista/, 'advocacia'],
    [/barbearia|barbeiro|barber|corte|navalha/, 'barbearia'],
    [/tech|saas|app|startup|software|digital/, 'tech'],
    [/moda|fashion|roupa|vestuário|look|outfit/, 'moda'],
  ];
  for (const [pattern, niche] of patterns) {
    if (pattern.test(lower)) return niche;
  }
  return 'generic';
}
