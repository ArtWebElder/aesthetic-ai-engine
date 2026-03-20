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
  1: ['bg_removal', 'color_grade', 'prompt_builder', 'reference_analyzer', 'copy_ai'],
  2: ['scene_gen', 'image_gen', 'background_gen'],
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
    credits: 12,
    nodes: [
      { id: 'ref', type: 'reference_upload', x: 60, y: 60, data: { label: 'Referência do Banner' } },
      { id: 'sub', type: 'image_upload', x: 60, y: 300, data: { label: 'Foto do Produto' } },
      { id: 'txt', type: 'text_input', x: 60, y: 520, data: {
        text: '',
        fields: { headline: '', price: '', cta: '', contact: '' },
      }},
      { id: 'analyze', type: 'reference_analyzer', x: 420, y: 60, data: {} },
      { id: 'copy', type: 'copy_ai', x: 420, y: 520, data: {} },
      { id: 'generate', type: 'image_gen', x: 780, y: 180, data: {
        width: 1080, height: 1080,
        mode: 'scene_with_subject',
      }},
      { id: 'compose', type: 'composition_ai', x: 1140, y: 180, data: {} },
      { id: 'overlay', type: 'text_overlay', x: 1500, y: 180, data: { templateId: '' } },
      { id: 'export', type: 'export', x: 1820, y: 180, data: { format: 'png' } },
    ],
    connections: [
      // Reference → Analyze
      { id: 'c1', fromNode: 'ref', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      { id: 'c2', fromNode: 'sub', fromPort: 'output', toNode: 'analyze', toPort: 'input' },
      // Analyze → Copy IA (referenceAnalysis)
      { id: 'c3', fromNode: 'analyze', fromPort: 'output', toNode: 'copy', toPort: 'input' },
      // Text input → Copy IA (product info)
      { id: 'c4', fromNode: 'txt', fromPort: 'output', toNode: 'copy', toPort: 'input' },
      // Subject + Reference + Analyze → Image Gen
      { id: 'c5', fromNode: 'sub', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c6', fromNode: 'ref', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      { id: 'c7', fromNode: 'analyze', fromPort: 'output', toNode: 'generate', toPort: 'input' },
      // Image Gen + Copy IA + Analyze → Composition IA
      { id: 'c8', fromNode: 'generate', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      { id: 'c9', fromNode: 'copy', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      { id: 'c10', fromNode: 'analyze', fromPort: 'output', toNode: 'compose', toPort: 'input' },
      // Composition IA + Image Gen + Copy IA → Text Overlay
      { id: 'c11', fromNode: 'compose', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c12', fromNode: 'generate', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      { id: 'c13', fromNode: 'copy', fromPort: 'output', toNode: 'overlay', toPort: 'input' },
      // Text Overlay → Export
      { id: 'c14', fromNode: 'overlay', fromPort: 'output', toNode: 'export', toPort: 'input' },
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
