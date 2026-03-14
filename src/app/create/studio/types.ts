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
  1: ['bg_removal', 'color_grade', 'prompt_builder', 'reference_analyzer'],
  2: ['scene_gen', 'image_gen'],
  3: ['typography', 'export'],
};

export const AUTO_LAYOUT_COL_X = [80, 460, 840, 1220];
export const AUTO_LAYOUT_ROW_GAP = 230;

// Node execution timeouts (ms) — used as fallback for simulation
export const NODE_RUN_TIMEOUT: Partial<Record<NodeTypeId, number>> = {
  prompt_builder: 1800,
  reference_analyzer: 8000,
  scene_gen: 3000,
  image_gen: 15000,
  bg_removal: 5000,
  color_grade: 800,
  typography: 800,
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
  name: string;
  description: string;
  nodes: StudioNode[];
  connections: Connection[];
}

export const PRESET_FLOWS: Record<string, PresetFlow> = {
  'asset-generator': {
    name: 'Asset Generator',
    description: 'Gera assets visuais baseados em referência + subject. Sem texto.',
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
  'simple-gen': {
    name: 'Simple Generation',
    description: 'Fluxo básico: brand + imagem + prompt → geração.',
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

// Default flow loaded on first open
export const DEFAULT_NODES: StudioNode[] = PRESET_FLOWS['asset-generator'].nodes;
export const DEFAULT_CONNECTIONS: Connection[] = PRESET_FLOWS['asset-generator'].connections;
