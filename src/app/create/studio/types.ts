// Creatyng Studio — Node Editor Types

export type NodeTypeId =
  | 'brand_input'
  | 'image_upload'
  | 'reference_upload'
  | 'text_input'
  | 'prompt_builder'
  | 'reference_analyzer'
  | 'scene_gen'
  | 'bg_removal'
  | 'upscale'
  | 'multiformat'
  | 'reframe_ai'
  | 'typography'
  | 'color_grade'
  | 'image_gen'
  | 'background_gen'
  | 'compositor'
  | 'text_overlay'
  | 'copy_ai'
  | 'composition_ai'
  | 'export';

export interface NodeTypeDef {
  id: NodeTypeId;
  label: string;
  icon: string;          // Lucide icon name
  color: string;         // Node accent color
  aiProvider?: string;   // 'Gemini' | 'Replicate' | undefined
  category: 'input' | 'processing' | 'ai' | 'composition' | 'output';
  defaultWidth: number;
  defaultHeight: number;
  creditCost?: number;
}

export interface StudioNode {
  id: string;
  type: NodeTypeId;
  x: number;
  y: number;
  data: Record<string, unknown>;
}

export interface Connection {
  id: string;
  fromNode: string;
  fromPort: 'output';
  toNode: string;
  toPort: 'input';
}

export type ExecState = 'idle' | 'running' | 'done' | 'error';
export type ToolMode = 'cursor' | 'hand';

export type PanelTab = 'nodes' | 'assets' | 'templates' | 'learn';

// Column assignment for Auto Layout
export const AUTO_LAYOUT_COLUMNS: Record<number, NodeTypeId[]> = {
  0: ['brand_input', 'image_upload', 'reference_upload', 'text_input'],
  1: ['bg_removal', 'upscale', 'multiformat', 'color_grade', 'prompt_builder', 'reference_analyzer', 'copy_ai'],
  2: ['scene_gen', 'image_gen', 'background_gen', 'reframe_ai'],
  3: ['compositor', 'text_overlay', 'typography', 'composition_ai', 'export'],
};

export const AUTO_LAYOUT_COL_X = [80, 460, 840, 1220];
export const AUTO_LAYOUT_ROW_GAP = 230;

// Node execution timeouts (ms) — used as fallback for simulation
export const NODE_RUN_TIMEOUT: Partial<Record<NodeTypeId, number>> = {
  prompt_builder: 1800,
  reference_analyzer: 8000,
  scene_gen: 3000,
  image_gen: 15000,
  background_gen: 15000,
  compositor: 3000,
  text_overlay: 1500,
  bg_removal: 5000,
  upscale: 40000,
  multiformat: 4000,
  reframe_ai: 45000,
  color_grade: 800,
  typography: 800,
  copy_ai: 8000,
  composition_ai: 10000,
  export: 800,
};

export const NODE_TYPE_DEFS: Record<NodeTypeId, NodeTypeDef> = {
  brand_input: {
    id: 'brand_input',
    label: 'Brand Input',
    icon: 'Building2',
    color: '#6366f1',
    category: 'input',
    defaultWidth: 260,
    defaultHeight: 172,
  },
  image_upload: {
    id: 'image_upload',
    label: 'Image Upload',
    icon: 'ImagePlus',
    color: '#06b6d4',
    category: 'input',
    defaultWidth: 260,
    defaultHeight: 200,
  },
  reference_upload: {
    id: 'reference_upload',
    label: 'Referência Visual',
    icon: 'ImagePlus',
    color: '#7C3AED',
    category: 'input',
    defaultWidth: 280,
    defaultHeight: 200,
  },
  text_input: {
    id: 'text_input',
    label: 'Text Prompt',
    icon: 'Type',
    color: '#8b5cf6',
    category: 'input',
    defaultWidth: 260,
    defaultHeight: 152,
  },
  prompt_builder: {
    id: 'prompt_builder',
    label: 'Prompt Builder',
    icon: 'Wand2',
    color: '#f59e0b',
    aiProvider: 'Gemini',
    category: 'processing',
    defaultWidth: 320,
    defaultHeight: 220,
    creditCost: 1,
  },
  reference_analyzer: {
    id: 'reference_analyzer',
    label: 'Analisar Referência',
    icon: 'ScanEye',
    color: '#06B6D4',
    aiProvider: 'Gemini 2.5 Pro',
    category: 'ai',
    defaultWidth: 300,
    defaultHeight: 180,
    creditCost: 2,
  },
  scene_gen: {
    id: 'scene_gen',
    label: 'Scene Gen',
    icon: 'Sparkles',
    color: '#ff713d',
    aiProvider: 'Gemini',
    category: 'ai',
    defaultWidth: 280,
    defaultHeight: 240,
    creditCost: 3,
  },
  bg_removal: {
    id: 'bg_removal',
    label: 'BG Removal',
    icon: 'Scissors',
    color: '#ec4899',
    category: 'processing',
    defaultWidth: 260,
    defaultHeight: 168,
  },
  upscale: {
    id: 'upscale',
    label: 'Upscale',
    icon: 'Maximize2',
    color: '#0ea5e9',
    aiProvider: 'Replicate',
    category: 'processing',
    defaultWidth: 260,
    defaultHeight: 180,
    creditCost: 1,
  },
  multiformat: {
    id: 'multiformat',
    label: 'Multi-formato',
    icon: 'LayoutGrid',
    color: '#0d9488',
    category: 'processing',
    defaultWidth: 280,
    defaultHeight: 220,
  },
  reframe_ai: {
    id: 'reframe_ai',
    label: 'Adaptar Formato (IA)',
    icon: 'Expand',
    color: '#7C3AED',
    aiProvider: 'Replicate',
    category: 'ai',
    defaultWidth: 280,
    defaultHeight: 200,
    creditCost: 3,
  },
  typography: {
    id: 'typography',
    label: 'Typography',
    icon: 'AlignLeft',
    color: '#14b8a6',
    category: 'composition',
    defaultWidth: 260,
    defaultHeight: 200,
  },
  color_grade: {
    id: 'color_grade',
    label: 'Color Grade',
    icon: 'Palette',
    color: '#a855f7',
    category: 'composition',
    defaultWidth: 240,
    defaultHeight: 152,
  },
  image_gen: {
    id: 'image_gen',
    label: 'Image Gen',
    icon: 'Camera',
    color: '#ff713d',
    aiProvider: 'Replicate',
    category: 'ai',
    defaultWidth: 280,
    defaultHeight: 248,
    creditCost: 5,
  },
  background_gen: {
    id: 'background_gen',
    label: 'Gerar Fundo',
    icon: 'Image',
    color: '#10B981',
    aiProvider: 'Flux / Gemini',
    category: 'ai',
    defaultWidth: 300,
    defaultHeight: 220,
    creditCost: 4,
  },
  compositor: {
    id: 'compositor',
    label: 'Compositor',
    icon: 'Layers',
    color: '#F59E0B',
    category: 'processing',
    defaultWidth: 300,
    defaultHeight: 200,
  },
  text_overlay: {
    id: 'text_overlay',
    label: 'Overlay de Texto',
    icon: 'Type',
    color: '#06B6D4',
    category: 'composition',
    defaultWidth: 300,
    defaultHeight: 200,
  },
  copy_ai: {
    id: 'copy_ai',
    label: 'Copy IA',
    icon: 'FileText',
    color: '#F59E0B',
    aiProvider: 'Gemini',
    category: 'ai',
    defaultWidth: 300,
    defaultHeight: 220,
    creditCost: 2,
  },
  composition_ai: {
    id: 'composition_ai',
    label: 'Composição IA',
    icon: 'LayoutTemplate',
    color: '#8B5CF6',
    aiProvider: 'Gemini',
    category: 'ai',
    defaultWidth: 320,
    defaultHeight: 220,
    creditCost: 2,
  },
  export: {
    id: 'export',
    label: 'Export',
    icon: 'Download',
    color: '#10b981',
    category: 'output',
    defaultWidth: 240,
    defaultHeight: 172,
  },
};

// ── Preset Flows ──────────────────────────────────────────────────────────────

export interface PresetFlow {
  id: string;
  name: string;
  nameEn: string;
  nameEs: string;
  description: string;
  descriptionEn: string;
  descriptionEs: string;
  icon: string;
  color: string;
  credits: number;
  nodes: StudioNode[];
  connections: Connection[];
}

export const PRESET_FLOWS: Record<string, PresetFlow> = {
  'remove-bg': {
    id: 'remove-bg',
    name: 'Remover Fundo',
    nameEn: 'Remove Background',
    nameEs: 'Quitar Fondo',
    description: 'Recorte o fundo de qualquer imagem em 1 clique — direto no navegador, grátis.',
    descriptionEn: 'Cut out the background of any image in one click — right in your browser, free.',
    descriptionEs: 'Recorta el fondo de cualquier imagen en un clic — en el navegador, gratis.',
    icon: 'Scissors',
    color: '#ec4899',
    credits: 0,
    nodes: [
      { id: 'n1', type: 'image_upload', x: 120, y: 160, data: { label: 'Imagem' } },
      { id: 'n2', type: 'bg_removal', x: 480, y: 170, data: {} },
      { id: 'n3', type: 'export', x: 840, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n2', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
    ],
  },
  'upscale': {
    id: 'upscale',
    name: 'Upscale HD/4K',
    nameEn: 'Upscale HD/4K',
    nameEs: 'Upscale HD/4K',
    description: 'Aumente a resolução e a nitidez de qualquer imagem — ideal pra impressão e telas grandes.',
    descriptionEn: 'Increase the resolution and sharpness of any image — great for print and large screens.',
    descriptionEs: 'Aumenta la resolución y nitidez de cualquier imagen — ideal para impresión y pantallas grandes.',
    icon: 'Maximize2',
    color: '#0ea5e9',
    credits: 1,
    nodes: [
      { id: 'n1', type: 'image_upload', x: 120, y: 160, data: { label: 'Imagem' } },
      { id: 'n2', type: 'upscale', x: 480, y: 170, data: { scale: 4 } },
      { id: 'n3', type: 'export', x: 840, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n2', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
    ],
  },
  'multi-format': {
    id: 'multi-format',
    name: 'Variações de Formato',
    nameEn: 'Format Variations',
    nameEs: 'Variaciones de Formato',
    description: 'Uma imagem → todas as redes: feed (1:1, 4:5), story (9:16) e banner (16:9), de uma vez. Grátis.',
    descriptionEn: 'One image → every network: feed (1:1, 4:5), story (9:16) and banner (16:9), all at once. Free.',
    descriptionEs: 'Una imagen → todas las redes: feed (1:1, 4:5), story (9:16) y banner (16:9), de una vez. Gratis.',
    icon: 'LayoutGrid',
    color: '#0d9488',
    credits: 0,
    nodes: [
      { id: 'n1', type: 'image_upload', x: 120, y: 160, data: { label: 'Imagem' } },
      { id: 'n2', type: 'multiformat', x: 480, y: 150, data: {} },
      { id: 'n3', type: 'export', x: 860, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n2', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
    ],
  },
  'reframe-ai': {
    id: 'reframe-ai',
    name: 'Adaptar Formato (IA)',
    nameEn: 'AI Reframe',
    nameEs: 'Reencuadre con IA',
    description: 'Adapta o MESMO criativo pra outra proporção com IA — estende a cena sem cortar o produto/sujeito. Premium.',
    descriptionEn: 'Adapt the SAME creative to another aspect ratio with AI — extends the scene without cutting the product/subject. Premium.',
    descriptionEs: 'Adapta el MISMO creativo a otra proporción con IA — extiende la escena sin cortar el producto/sujeto. Premium.',
    icon: 'Expand',
    color: '#7C3AED',
    credits: 3,
    nodes: [
      { id: 'n1', type: 'image_upload', x: 120, y: 160, data: { label: 'Imagem' } },
      { id: 'n2', type: 'reframe_ai', x: 480, y: 160, data: { ratio: '9:16' } },
      { id: 'n3', type: 'export', x: 860, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n2', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
    ],
  },
  'thumbnail': {
    id: 'thumbnail',
    name: 'Thumbnail',
    nameEn: 'Thumbnail',
    nameEs: 'Miniatura',
    description: 'Thumbnail 16:9 com o TÍTULO desenhado na imagem pela IA (OpenAI). Subject opcional.',
    descriptionEn: '16:9 thumbnail with the TITLE drawn into the image by AI (OpenAI). Optional subject.',
    descriptionEs: 'Miniatura 16:9 con el TÍTULO dibujado en la imagen por IA (OpenAI). Subject opcional.',
    icon: 'MonitorPlay',
    color: '#ef4444',
    credits: 8,
    nodes: [
      { id: 'info', type: 'text_input', x: 60, y: 80, data: { fields: { title: '', channel: '', style: '', lighting: '', assets: '' }, label: 'Thumbnail' } },
      { id: 'subject', type: 'image_upload', x: 60, y: 380, data: { label: 'Subject (opcional)' } },
      { id: 'gen', type: 'image_gen', x: 480, y: 200, data: { mode: 'thumbnail', module: 'sys-img-thumbnail', width: 1536, height: 1024 } },
      { id: 'export', type: 'export', x: 860, y: 200, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'info', fromPort: 'output', toNode: 'gen', toPort: 'input' },
      { id: 'c2', fromNode: 'subject', fromPort: 'output', toNode: 'gen', toPort: 'input' },
      { id: 'c3', fromNode: 'gen', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'recolor': {
    id: 'recolor',
    name: 'Re-color / Mood',
    nameEn: 'Re-color / Mood',
    nameEs: 'Re-color / Mood',
    description: 'Aplique um clima de cor (quente, frio, vívido, dramático, vintage) em 1 clique — grátis.',
    descriptionEn: 'Apply a color mood (warm, cold, vivid, dramatic, vintage) in one click — free.',
    descriptionEs: 'Aplica un mood de color (cálido, frío, vívido, dramático, vintage) en un clic — gratis.',
    icon: 'SlidersHorizontal',
    color: '#a855f7',
    credits: 0,
    nodes: [
      { id: 'n1', type: 'image_upload', x: 120, y: 160, data: { label: 'Imagem' } },
      { id: 'n2', type: 'color_grade', x: 480, y: 170, data: { mode: 'vivid' } },
      { id: 'n3', type: 'export', x: 840, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n2', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
    ],
  },
  'quote-card': {
    id: 'quote-card',
    name: 'Card de Citação',
    nameEn: 'Quote Card',
    nameEs: 'Tarjeta de Cita',
    description: 'Post social com frase em destaque: fundo gerado por IA + texto nítido por cima.',
    descriptionEn: 'Social post with a featured quote: AI background + crisp text on top.',
    descriptionEs: 'Post social con una frase destacada: fondo con IA + texto nítido encima.',
    icon: 'Quote',
    color: '#0ea5e9',
    credits: 5,
    nodes: [
      { id: 'bgprompt', type: 'prompt_builder', x: 60, y: 80, data: { customPrompt: 'Elegant minimal abstract gradient background for a social media quote card. Soft smooth color blend, subtle texture, generous clean negative space, premium calm aesthetic.' } },
      { id: 'title', type: 'text_input', x: 60, y: 340, data: { fields: { headline: '', contact: '' }, label: 'Frase + autor' } },
      { id: 'bggen', type: 'background_gen', x: 440, y: 80, data: { width: 1080, height: 1080 } },
      { id: 'overlay', type: 'text_overlay', x: 800, y: 200, data: { width: 1080, height: 1080 } },
      { id: 'export', type: 'export', x: 1140, y: 200, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'bgprompt', fromPort: 'output', toNode: 'bggen', toPort: 'input' },
      { id: 'c2', fromNode: 'bggen', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c3', fromNode: 'title', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c4', fromNode: 'overlay', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'headshot': {
    id: 'headshot',
    name: 'Headshot / Perfil',
    nameEn: 'Headshot / Profile',
    nameEs: 'Headshot / Perfil',
    description: 'Transforme sua selfie em retrato profissional — mantém seu rosto, troca luz e fundo.',
    descriptionEn: 'Turn your selfie into a professional portrait — keeps your face, swaps light and background.',
    descriptionEs: 'Convierte tu selfie en un retrato profesional — mantiene tu rostro, cambia luz y fondo.',
    icon: 'UserRound',
    color: '#14b8a6',
    credits: 5,
    nodes: [
      { id: 'subject', type: 'image_upload', x: 60, y: 120, data: { label: 'Sua foto' } },
      { id: 'styleprompt', type: 'prompt_builder', x: 60, y: 360, data: { customPrompt: 'Professional corporate headshot. Clean studio lighting, soft neutral gradient background, sharp focus, 85mm portrait look, business attire, confident natural expression. Preserve the person face and identity exactly.' } },
      { id: 'gen', type: 'image_gen', x: 440, y: 200, data: { width: 1080, height: 1080, identityStrength: 92 } },
      { id: 'export', type: 'export', x: 800, y: 200, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'subject', fromPort: 'output', toNode: 'gen', toPort: 'input' },
      { id: 'c2', fromNode: 'styleprompt', fromPort: 'output', toNode: 'gen', toPort: 'input' },
      { id: 'c3', fromNode: 'gen', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'product-scene': {
    id: 'product-scene',
    name: 'Produto em Cena',
    nameEn: 'Product in Scene',
    nameEs: 'Producto en Escena',
    description: 'Seu produto real recortado sobre um cenário profissional gerado por IA.',
    descriptionEn: 'Your real product cut out over an AI-generated professional scene.',
    descriptionEs: 'Tu producto real recortado sobre una escena profesional generada por IA.',
    icon: 'Package',
    color: '#10b981',
    credits: 5,
    nodes: [
      { id: 'sub', type: 'image_upload', x: 60, y: 120, data: { label: 'Foto do produto' } },
      { id: 'bgrem', type: 'bg_removal', x: 420, y: 120, data: {} },
      { id: 'sceneprompt', type: 'prompt_builder', x: 60, y: 380, data: { customPrompt: 'Professional product photography scene. Clean modern studio environment, elegant surface, soft cinematic lighting, subtle depth of field, premium commercial look. Leave clear central space for the product. No text, no logos, no watermark.' } },
      { id: 'bggen', type: 'background_gen', x: 420, y: 360, data: { width: 1080, height: 1080 } },
      { id: 'comp', type: 'compositor', x: 800, y: 220, data: { width: 1080, height: 1080, subjectScale: 0.62, subjectPosition: 'center', shadowEnabled: true, shadowOpacity: 0.28, shadowBlur: 24 } },
      { id: 'export', type: 'export', x: 1160, y: 220, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'sub', fromPort: 'output', toNode: 'bgrem', toPort: 'input' },
      { id: 'c2', fromNode: 'sceneprompt', fromPort: 'output', toNode: 'bggen', toPort: 'input' },
      { id: 'c3', fromNode: 'bgrem', fromPort: 'output', toNode: 'comp', toPort: 'input' },
      { id: 'c4', fromNode: 'bggen', fromPort: 'output', toNode: 'comp', toPort: 'input' },
      { id: 'c5', fromNode: 'comp', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'clone-criativo': {
    id: 'clone-criativo',
    name: 'Clone Criativo',
    nameEn: 'Creative Clone',
    nameEs: 'Clon Creativo',
    description: 'Clone qualquer anúncio com IA. Troque textos, cores e subject.',
    descriptionEn: 'Clone any ad with AI. Swap texts, colors and subject.',
    descriptionEs: 'Clona cualquier anuncio con IA. Cambia textos, colores y sujeto.',
    icon: 'Copy',
    color: '#ff713d',
    credits: 12,
    nodes: [
      { id: 'ref', type: 'reference_upload', x: 60, y: 60, data: { label: 'Referência (anúncio a clonar)' } },
      { id: 'sub', type: 'image_upload', x: 60, y: 300, data: { label: 'Subject (opcional)' } },
      { id: 'txt', type: 'text_input', x: 60, y: 520, data: { text: '', fields: { headline: '', price: '', cta: '', contact: '' } } },
      { id: 'analyze', type: 'reference_analyzer', x: 440, y: 60, data: {} },
      { id: 'generate', type: 'image_gen', x: 820, y: 160, data: { width: 1080, height: 1080, mode: 'clone_creative_v2' } },
      { id: 'export', type: 'export', x: 1200, y: 160, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'ref', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      { id: 'c2', fromNode: 'sub', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      { id: 'c3', fromNode: 'analyze', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c4', fromNode: 'sub', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c5', fromNode: 'ref', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c6', fromNode: 'txt', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c7', fromNode: 'generate', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'styled-photo': {
    id: 'styled-photo',
    name: 'Foto no Estilo',
    nameEn: 'Styled Photo',
    nameEs: 'Foto con Estilo',
    description: 'Recrie sua foto seguindo o estilo de uma referência visual',
    descriptionEn: 'Recreate your photo following a visual reference style',
    descriptionEs: 'Recrea tu foto siguiendo el estilo de una referencia visual',
    icon: 'Palette',
    color: '#7C3AED',
    credits: 5,
    nodes: [
      { id: 'n1', type: 'reference_upload', x: 60, y: 60, data: {} },
      { id: 'n2', type: 'image_upload', x: 60, y: 300, data: {} },
      { id: 'n3', type: 'reference_analyzer', x: 420, y: 60, data: {} },
      { id: 'n4', type: 'prompt_builder', x: 420, y: 280, data: { customPrompt: '' } },
      { id: 'n5', type: 'image_gen', x: 780, y: 170, data: { width: 1080, height: 1080 } },
      { id: 'n6', type: 'export', x: 1100, y: 170, data: { format: 'png' } },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n3', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n3', toPort: 'input' },
      { id: 'c3', fromNode: 'n2', fromPort: 'output', toNode: 'n5', toPort: 'input' },
      { id: 'c4', fromNode: 'n3', fromPort: 'output', toNode: 'n4', toPort: 'input' },
      { id: 'c5', fromNode: 'n4', fromPort: 'output', toNode: 'n5', toPort: 'input' },
      { id: 'c6', fromNode: 'n5', fromPort: 'output', toNode: 'n6', toPort: 'input' },
    ],
  },
  'creative-banner': {
    id: 'creative-banner',
    name: 'Banner Criativo',
    nameEn: 'Creative Banner',
    nameEs: 'Banner Creativo',
    description: 'Seu produto real + fundo profissional + copy e composição IA',
    descriptionEn: 'Your real product + professional background + AI copy & composition',
    descriptionEs: 'Tu producto real + fondo profesional + copy y composición IA',
    icon: 'LayoutTemplate',
    color: '#ff713d',
    credits: 8,
    nodes: [
      // Row 1: Reference → Analyze → Copy IA → Image Gen → Composition IA → Overlay → Export
      { id: 'ref', type: 'reference_upload', x: 60, y: 60, data: { label: 'Referência do Banner' } },
      { id: 'analyze', type: 'reference_analyzer', x: 400, y: 60, data: {} },
      { id: 'copy', type: 'copy_ai', x: 740, y: 60, data: {} },
      { id: 'generate', type: 'image_gen', x: 1080, y: 160, data: {
        width: 1080, height: 1080,
        mode: 'composition_visual',
      }},
      { id: 'compose', type: 'composition_ai', x: 1420, y: 160, data: {} },
      { id: 'overlay', type: 'text_overlay', x: 1760, y: 160, data: { templateId: '' } },
      { id: 'export', type: 'export', x: 2060, y: 160, data: { format: 'png' } },
      // Row 2: Subject (connects to Analyze + Image Gen)
      { id: 'sub', type: 'image_upload', x: 60, y: 300, data: { label: 'Foto do Produto' } },
      // Row 3: Text Prompt (connects to Copy IA)
      { id: 'txt', type: 'text_input', x: 60, y: 520, data: {
        text: '',
        fields: { headline: '', price: '', cta: '', contact: '' },
      }},
    ],
    connections: [
      // Reference + Subject → Analyze
      { id: 'c1', fromNode: 'ref', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      { id: 'c2', fromNode: 'sub', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      // Analyze + Text Input → Copy IA
      { id: 'c3', fromNode: 'analyze', fromPort: 'output', toNode: 'copy', toPort: 'input' },
      { id: 'c4', fromNode: 'txt', fromPort: 'output', toNode: 'copy', toPort: 'input' },
      // Copy IA + Subject + Analyze → Image Gen (Copy BEFORE generation)
      { id: 'c5', fromNode: 'copy', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c6', fromNode: 'sub', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c7', fromNode: 'ref', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c8', fromNode: 'analyze', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      // Image Gen + Copy IA + Analyze → Composition IA
      { id: 'c9', fromNode: 'generate', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      { id: 'c10', fromNode: 'copy', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      { id: 'c11', fromNode: 'analyze', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      // Composition IA + Image Gen + Copy IA → Text Overlay
      { id: 'c12', fromNode: 'compose', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c13', fromNode: 'generate', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c14', fromNode: 'copy', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      // Text Overlay → Export
      { id: 'c15', fromNode: 'overlay', fromPort: 'output', toNode: 'export', toPort: 'input' },
    ],
  },
  'simple-gen': {
    id: 'simple-gen',
    name: 'Geração Simples',
    nameEn: 'Simple Generation',
    nameEs: 'Generación Simple',
    description: 'Fluxo básico: brand + imagem + prompt → geração',
    descriptionEn: 'Basic flow: brand + image + prompt → generation',
    descriptionEs: 'Flujo básico: marca + imagen + prompt → generación',
    icon: 'Sparkles',
    color: '#8b5cf6',
    credits: 3,
    nodes: [
      { id: 'n1', type: 'brand_input', x: 60, y: 40, data: {} },
      { id: 'n2', type: 'image_upload', x: 60, y: 280, data: {} },
      { id: 'n3', type: 'text_input', x: 60, y: 500, data: {} },
      { id: 'n4', type: 'prompt_builder', x: 480, y: 180, data: {} },
      { id: 'n5', type: 'image_gen', x: 880, y: 200, data: {} },
    ],
    connections: [
      { id: 'c1', fromNode: 'n1', fromPort: 'output', toNode: 'n4', toPort: 'input' },
      { id: 'c2', fromNode: 'n2', fromPort: 'output', toNode: 'n5', toPort: 'input' },
      { id: 'c3', fromNode: 'n3', fromPort: 'output', toNode: 'n4', toPort: 'input' },
      { id: 'c4', fromNode: 'n4', fromPort: 'output', toNode: 'n5', toPort: 'input' },
    ],
  },
};

// Default: no flow loaded (show selector)
export const DEFAULT_NODES: StudioNode[] = [];
export const DEFAULT_CONNECTIONS: Connection[] = [];
