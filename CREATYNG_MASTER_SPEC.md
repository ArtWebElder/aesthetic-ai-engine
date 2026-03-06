# CREATYNG — MASTER SPEC
# Fonte única de verdade para implementação do produto

> Este é o único documento que o Claude Code precisa ler para implementar o Creatyng.
> Ele substitui: CREATYNG_FEATURES_SPEC, CREATYNG_TEXT_ENGINE,
> CREATYNG_PRESET_SYSTEM e CREATYNG_EXEC_INSTRUCTION.
> Leia sempre junto com: CLAUDE.md, CREATYNG_VISION_FIRST.md, CREATYNG_MOTOR_PLAN.md

---

## COMO USAR ESTE DOCUMENTO

1. Leia a seção FUNDAÇÃO antes de qualquer diff
2. Cada diff tem: objetivo → tipos envolvidos → implementação → NÃO FAZER → checklist
3. Execute um diff por vez. Não pule etapas.
4. Antes de commitar: execute o checklist do diff
5. Se encontrar conflito com código existente: pare e mapeie antes de implementar

---

# ═══════════════════════════════════════════
# FUNDAÇÃO — LEIA ANTES DE QUALQUER DIFF
# ═══════════════════════════════════════════

## Por que a fundação existe

Tudo que o usuário configura para gerar uma imagem — preset de estilo, preset de
texto, cores, fontes, brand kit, estilo salvo — é uma instância do mesmo objeto base.

Se cada diff criar seu próprio schema de dados, em 3 semanas teremos:
- `preset: string` no wizard store
- `style: { name, atmosphere }` nos cards
- `savedStyle: { preset, fonts, colors }` no banco
- `brandKit: { style, typography }` no brand kit

Quatro schemas para a mesma coisa. Impossível conectar ao marketplace, ao sistema
de aprendizado, ou ao feedback loop sem refatorar tudo.

**A fundação define o schema uma vez. Todos os diffs usam esse schema.**

---

## TIPOS UNIVERSAIS (criar em src/types/preset.ts ANTES de qualquer diff)

```typescript
// src/types/preset.ts

// ─── PRESET UNIVERSAL ───────────────────────────────────────────────────────

export interface CreatygnPreset {
  id: string
  slug: string                        // 'drama-impact', 'text-clean-editorial'
  name: string
  description?: string
  thumbnailUrl: string                // imagem de exemplo gerada com este preset

  type: PresetType
  scope: PresetScope
  authorId?: string                   // null = preset do sistema Creatyng
  authorName?: string

  config: PresetConfig
  stats: PresetStats
  marketplace?: PresetMarketplace

  createdAt: string
  updatedAt: string
  version: number
}

export type PresetType =
  | 'image_style'    // Drama, Clean, Dark, Editorial, Neon
  | 'text_style'     // Impact, Clean, Dark, Neon, Street, Luxury, Sport, Minimal
  | 'composition'    // regras de layout e posição
  | 'color_palette'  // conjunto de cores
  | 'full'           // preset completo (image + text + cores + composição)
  | 'brand_kit'      // brand kit de usuário específico

export type PresetScope =
  | 'system'         // criado pelo Creatyng, todos veem
  | 'user_private'   // criado pelo usuário, só ele vê
  | 'user_public'    // publicado no marketplace
  | 'team'           // compartilhado no plano Agency

// ─── CONFIG DO PRESET ────────────────────────────────────────────────────────

export interface PresetConfig {
  image?: ImagePresetConfig
  text?: TextPresetConfig
  colors?: ColorConfig
  composition?: CompositionConfig
}

export interface ImagePresetConfig {
  preset: 'drama' | 'clean' | 'dark' | 'editorial' | 'neon'
  atmosphere: 'fog' | 'particles' | 'glass_shards' | 'rain' | 'none'
  lighting: 'rim_purple' | 'rim_blue' | 'natural' | 'studio' | 'neon' | 'none'
  sceneKeywords: string[]
  negativeKeywords: string[]
  visualDNA?: VisualDNA               // DNA extraído de referência real (Vision First)
}

export interface TextPresetConfig {
  stylePreset: TextStylePreset
  headlineFont: string                // Google Font name
  bodyFont: string                    // Google Font name
  headlineWeight: number              // 400-900
  headlineTracking: string            // '-0.02em', '0.05em', etc
  headlineLineHeight: number          // 0.85-1.3
  headlineTransform: 'uppercase' | 'none' | 'capitalize'
  effects: TextEffects
  accentWordAuto: boolean
  accentWordPattern?: string          // regex ou '[colchetes]' manual
  blendMode: TextBlendMode
}

export type TextStylePreset =
  | 'impact'         // T1 — Anton, grunge, drama
  | 'clean'          // T2 — Bebas Neue, corporativo
  | 'dark'           // T3 — Cinzel, glow ciano
  | 'neon'           // T4 — Rajdhani, efeito neon
  | 'street'         // T5 — Black Han Sans, spray
  | 'luxury'         // T6 — Cormorant, dourado
  | 'sport'          // T7 — Teko, bold máximo
  | 'minimal'        // T8 — Inter, Swiss design

export type TextBlendMode =
  | 'normal' | 'screen' | 'overlay' | 'soft-light' | 'luminosity'

export interface TextEffects {
  texture?: 'grunge_metal' | 'spray_paint' | 'none'
  glow: boolean
  glowColor?: string                  // usa accent se null
  glowIntensity: number               // 0-100
  shadow: 'none' | 'soft' | 'medium' | 'hard' | 'multi-layer'
  shadowColor?: string
  stroke: boolean
  strokeWidth?: number
  strokeColor?: string
  gradient: boolean
  gradientColors?: string[]
}

export interface ColorConfig {
  primary: string                     // hex — rim light, accent, neon
  secondary: string                   // hex — partículas, reflexos
  neutral: string                     // hex — fundo, sombras
  extras: string[]                    // até 5 cores extras
  accentWord?: string                 // cor da accent word (pode diferir da primary)
}

export interface CompositionConfig {
  textPosition: 'top' | 'bottom' | 'left' | 'right' | 'center'
  textAlignment: 'left' | 'center' | 'right'
  subjectPosition: 'center' | 'left' | 'right' | 'lower-center'
  overlayIntensity: number            // 0-100
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5'
  width?: number
  height?: number
}

// ─── STATS E MARKETPLACE ─────────────────────────────────────────────────────

export interface PresetStats {
  usageCount: number
  approvalCount: number
  rejectionCount: number
  approvalRate: number                // 0-100, calculado automaticamente
  favoriteCount: number
  lastUsedAt?: string
}

export interface PresetMarketplace {
  published: boolean
  price: number                       // 0 = grátis, >0 = créditos
  category: string
  tags: string[]
  featured: boolean
  revenue: number
}

// ─── WIZARD STATE ─────────────────────────────────────────────────────────────
// CRÍTICO: todos os diffs do wizard usam este tipo. Não criar estados paralelos.

export interface WizardState {
  // PASSO 1 — SUBJECT
  subjectBase64?: string
  subjectThumbnail?: string           // versão reduzida para preview
  subjectProfile?: SubjectProfile     // resultado do Vision AI (Stage 1)
  framing: 'face' | 'half_body' | 'full_body' | 'product'
  cameraAngle: 'eye_level' | 'low_angle' | 'high_angle'

  // PASSO 2 — ESTILO
  selectedImagePresetId?: string      // ID do CreatygnPreset (type: image_style)
  selectedTextPresetId?: string       // ID do CreatygnPreset (type: text_style)
  activePresetConfig: PresetConfig    // preset base + overrides do usuário

  // REFERÊNCIA
  referenceBase64?: string
  visualDNA?: VisualDNA               // resultado do Vision AI na referência

  // PASSO 3 — TEXTOS
  headline: string
  subheadline: string
  cta: string

  // MODO
  mode: 'quick' | 'advanced'

  // META
  lastGenerationId?: string
}

// Quando o usuário altera algo acima do preset (ex: troca só a fonte):
// NÃO criar novo campo. Usar activePresetConfig como override:
// setPresetOverride('text.headlineFont', 'Montserrat')
// Isso preserva o preset base mas salva o override na sessão.

// ─── GERAÇÃO E CACHE ──────────────────────────────────────────────────────────

export interface CachedGeneration {
  generationId: string                // UUID único por geração
  imageBase64: string                 // imagem completa
  imageThumbnail: string              // 300x300 para histórico
  wizardStateSnapshot: WizardState    // estado EXATO usado na geração
  presetIds: {
    image?: string
    text?: string
  }
  activePresetConfigSnapshot: PresetConfig  // config EXATA (com overrides)
  visualDNA?: VisualDNA
  qualityScore?: number
  meta: GenerationMeta
  timestamp: number
}

export interface GenerationMeta {
  provider: string
  model: string
  dnaUsed: boolean
  aspectRatio: string
  generationMs: number
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────

export type GenerationRating = 'approved' | 'rejected' | 'favorited'

export interface GenerationFeedback {
  generationId: string
  userId: string
  rating: GenerationRating
  presetId?: string                   // qual preset foi usado
  configSnapshot: PresetConfig        // config exata usada
  qualityScore?: number
  ratedAt: string
}
```

---

## SEED DATA DOS PRESETS DO SISTEMA (src/data/systemPresets.ts)

```typescript
// src/data/systemPresets.ts
// Usar estes dados desde o DIFF PS.0.
// Quando o banco estiver pronto, migrar sem refatoração.

import { CreatygnPreset } from '@/types/preset'

const now = new Date().toISOString()
const emptyStats = {
  usageCount: 0, approvalCount: 0, rejectionCount: 0,
  approvalRate: 0, favoriteCount: 0
}

export const SYSTEM_IMAGE_PRESETS: CreatygnPreset[] = [
  {
    id: 'sys-img-drama', slug: 'drama-impact', name: 'Drama / Impact',
    type: 'image_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/drama.jpg',
    config: { image: {
      preset: 'drama', atmosphere: 'particles', lighting: 'rim_purple',
      sceneKeywords: ['dramatic cinematic scene', 'intense purple magenta rim lighting',
        'bokeh background', 'sparks embers particles', 'high contrast deep shadows'],
      negativeKeywords: ['soft lighting', 'bright background', 'clean studio'],
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-img-clean', slug: 'clean-premium', name: 'Clean / Premium',
    type: 'image_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/clean.jpg',
    config: { image: {
      preset: 'clean', atmosphere: 'none', lighting: 'natural',
      sceneKeywords: ['clean professional setting', 'soft natural window light',
        'near-white background', 'high-end studio feel'],
      negativeKeywords: ['dramatic lighting', 'particles', 'dark background'],
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-img-dark', slug: 'dark-cinematic', name: 'Dark / Cinematic',
    type: 'image_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/dark.jpg',
    config: { image: {
      preset: 'dark', atmosphere: 'glass_shards', lighting: 'rim_blue',
      sceneKeywords: ['dark cinematic scene', 'deep perspective corridor',
        'cold cyan-blue rim lighting', 'god rays atmospheric depth'],
      negativeKeywords: ['bright lighting', 'clean background', 'colorful'],
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-img-editorial', slug: 'editorial-magazine', name: 'Editorial / Magazine',
    type: 'image_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/editorial.jpg',
    config: { image: {
      preset: 'editorial', atmosphere: 'none', lighting: 'studio',
      sceneKeywords: ['fashion editorial photography', 'magazine quality',
        'strong directional light', 'high fashion context'],
      negativeKeywords: ['casual', 'amateur', 'flat lighting'],
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-img-neon', slug: 'neon-futuristic', name: 'Neon / Futuristic',
    type: 'image_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/neon.jpg',
    config: { image: {
      preset: 'neon', atmosphere: 'fog', lighting: 'neon',
      sceneKeywords: ['neon futuristic scene', 'cyberpunk aesthetic',
        'colorful neon lights', 'urban night setting'],
      negativeKeywords: ['natural lighting', 'daytime', 'clean studio'],
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
]

export const SYSTEM_TEXT_PRESETS: CreatygnPreset[] = [
  {
    id: 'sys-txt-impact', slug: 'text-impact-drama', name: 'Impact / Drama',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-impact.jpg',
    config: { text: {
      stylePreset: 'impact', headlineFont: 'Anton', bodyFont: 'Oswald',
      headlineWeight: 900, headlineTracking: '-0.02em',
      headlineLineHeight: 0.9, headlineTransform: 'uppercase',
      effects: { texture: 'grunge_metal', glow: true, glowIntensity: 60,
        shadow: 'multi-layer', stroke: false, gradient: false },
      accentWordAuto: true, blendMode: 'screen',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-clean', slug: 'text-clean-editorial', name: 'Clean / Editorial',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-clean.jpg',
    config: { text: {
      stylePreset: 'clean', headlineFont: 'Bebas Neue', bodyFont: 'Montserrat',
      headlineWeight: 400, headlineTracking: '-0.01em',
      headlineLineHeight: 0.88, headlineTransform: 'uppercase',
      effects: { glow: false, glowIntensity: 0, shadow: 'soft',
        stroke: false, gradient: false },
      accentWordAuto: false, blendMode: 'normal',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-dark', slug: 'text-dark-cinematic', name: 'Dark / Cinematic',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-dark.jpg',
    config: { text: {
      stylePreset: 'dark', headlineFont: 'Cinzel Decorative', bodyFont: 'Cinzel',
      headlineWeight: 700, headlineTracking: '0.08em',
      headlineLineHeight: 1.0, headlineTransform: 'uppercase',
      effects: { glow: true, glowIntensity: 90, shadow: 'multi-layer',
        stroke: false, gradient: false },
      accentWordAuto: true, blendMode: 'screen',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-neon', slug: 'text-neon-futuristic', name: 'Neon / Futuristic',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-neon.jpg',
    config: { text: {
      stylePreset: 'neon', headlineFont: 'Rajdhani', bodyFont: 'Share Tech Mono',
      headlineWeight: 700, headlineTracking: '0.05em',
      headlineLineHeight: 0.95, headlineTransform: 'uppercase',
      effects: { glow: true, glowIntensity: 100, shadow: 'medium',
        stroke: false, gradient: false },
      accentWordAuto: true, blendMode: 'screen',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-street', slug: 'text-street-grunge', name: 'Street / Grunge',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-street.jpg',
    config: { text: {
      stylePreset: 'street', headlineFont: 'Black Han Sans', bodyFont: 'Oswald',
      headlineWeight: 900, headlineTracking: '-0.03em',
      headlineLineHeight: 0.85, headlineTransform: 'uppercase',
      effects: { texture: 'spray_paint', glow: false, glowIntensity: 0,
        shadow: 'hard', stroke: true, strokeWidth: 2, gradient: false },
      accentWordAuto: true, blendMode: 'overlay',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-luxury', slug: 'text-luxury-elegance', name: 'Luxury / Elegance',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-luxury.jpg',
    config: { text: {
      stylePreset: 'luxury', headlineFont: 'Cormorant Garamond', bodyFont: 'Montserrat',
      headlineWeight: 300, headlineTracking: '0.25em',
      headlineLineHeight: 1.2, headlineTransform: 'uppercase',
      effects: { glow: false, glowIntensity: 0, shadow: 'soft',
        stroke: false, gradient: true,
        gradientColors: ['#FFFFFF', '#E8D9B5', '#FFFFFF', '#C9B99A', '#FFFFFF'] },
      accentWordAuto: false, blendMode: 'soft-light',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-sport', slug: 'text-bold-sport', name: 'Bold / Sport',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-sport.jpg',
    config: { text: {
      stylePreset: 'sport', headlineFont: 'Teko', bodyFont: 'Barlow Condensed',
      headlineWeight: 700, headlineTracking: '-0.01em',
      headlineLineHeight: 0.82, headlineTransform: 'uppercase',
      effects: { glow: false, glowIntensity: 0, shadow: 'hard',
        stroke: true, strokeWidth: 3, gradient: false },
      accentWordAuto: true, blendMode: 'normal',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
  {
    id: 'sys-txt-minimal', slug: 'text-minimal-swiss', name: 'Minimal / Swiss',
    type: 'text_style', scope: 'system',
    thumbnailUrl: '/presets/thumbs/text-minimal.jpg',
    config: { text: {
      stylePreset: 'minimal', headlineFont: 'Inter', bodyFont: 'Inter',
      headlineWeight: 800, headlineTracking: '-0.04em',
      headlineLineHeight: 1.0, headlineTransform: 'none',
      effects: { glow: false, glowIntensity: 0, shadow: 'none',
        stroke: false, gradient: false },
      accentWordAuto: false, blendMode: 'normal',
    }},
    stats: emptyStats, version: 1, createdAt: now, updatedAt: now,
  },
]

// Qual text preset combina com qual image preset (sugestão automática)
export const PRESET_AFFINITY: Record<string, string> = {
  'sys-img-drama':      'sys-txt-impact',
  'sys-img-clean':      'sys-txt-clean',
  'sys-img-dark':       'sys-txt-dark',
  'sys-img-editorial':  'sys-txt-luxury',
  'sys-img-neon':       'sys-txt-neon',
}
```

---

## SCHEMA DO BANCO DE DADOS (supabase/migrations/001_preset_system.sql)

```sql
-- Criar ANTES de qualquer diff que salva dados

CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'image_style','text_style','composition','color_palette','full','brand_kit'
  )),
  scope TEXT NOT NULL CHECK (scope IN (
    'system','user_private','user_public','team'
  )),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  approval_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  marketplace_published BOOLEAN DEFAULT false,
  marketplace_price INTEGER DEFAULT 0,
  marketplace_category TEXT,
  marketplace_tags TEXT[] DEFAULT '{}',
  marketplace_featured BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  generation_id UUID NOT NULL,
  preset_id UUID REFERENCES presets(id),
  config_snapshot JSONB NOT NULL,
  image_url TEXT NOT NULL,
  image_thumbnail_url TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('approved','rejected','favorited')),
  rated_at TIMESTAMPTZ,
  quality_score INTEGER,
  quality_checks JSONB,
  provider_used TEXT,
  dna_used BOOLEAN DEFAULT false,
  generation_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_saved_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  preset_id UUID REFERENCES presets(id) NOT NULL,
  pinned BOOLEAN DEFAULT false,
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preset_id)
);

CREATE INDEX idx_presets_type_scope ON presets(type, scope);
CREATE INDEX idx_presets_approval_rate ON presets(approval_rate DESC);
CREATE INDEX idx_generation_feedback_user ON generation_feedback(user_id, created_at DESC);
CREATE INDEX idx_generation_feedback_preset ON generation_feedback(preset_id);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presets_read" ON presets FOR SELECT USING (
  scope IN ('system','user_public') OR author_id = auth.uid()
);
CREATE POLICY "presets_write" ON presets FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "presets_update" ON presets FOR UPDATE USING (author_id = auth.uid());

-- Atualiza approval_rate automaticamente após feedback
CREATE OR REPLACE FUNCTION update_preset_approval_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE presets SET
    approval_rate = CASE
      WHEN (approval_count + rejection_count) = 0 THEN 0
      ELSE ROUND((approval_count::DECIMAL / (approval_count + rejection_count)) * 100, 2)
    END,
    updated_at = NOW()
  WHERE id = NEW.preset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

# ═══════════════════════════════════════════
# FASE 1 — MVP
# DIFF PS.0 → 9.1-9.5 → TR.1-TR.7 → 13.1-13.5 → 16.1-16.6
# ═══════════════════════════════════════════

---

## DIFF PS.0 — FUNDAÇÃO DE TIPOS E BANCO
**Fazer PRIMEIRO. Nenhum outro diff começa antes deste.**

**O que criar:**
- `src/types/preset.ts` — todos os tipos da seção FUNDAÇÃO acima
- `src/data/systemPresets.ts` — seed data dos 5 image presets + 8 text presets
- `supabase/migrations/001_preset_system.sql` — tabelas e RLS
- `src/lib/presetUtils.ts` — funções helpers:
  - `getPresetById(id: string): CreatygnPreset | undefined`
  - `getSuggestedTextPreset(imagePresetId: string): CreatygnPreset`
  - `applyPresetOverride(base: PresetConfig, key: string, value: unknown): PresetConfig`
  - `buildActiveConfig(presetId: string, overrides: Partial<PresetConfig>): PresetConfig`

**NÃO FAZER:**
- Não criar UI ainda
- Não conectar ao Supabase ainda (seed local basta por enquanto)
- Não criar lógica de geração ainda

**CHECKLIST PS.0:**
- [ ] `npm run build` passa sem erros de tipo
- [ ] `getPresetById('sys-img-drama')` retorna o preset correto
- [ ] `getSuggestedTextPreset('sys-img-drama')` retorna `sys-txt-impact`
- [ ] `applyPresetOverride` não muta o objeto original (imutável)
- [ ] Migração SQL não tem erros de sintaxe

---

## DIFF 9.1 — ESTRUTURA DO WIZARD

**Depende de:** PS.0 (tipos devem existir)

**O que criar:**
- `src/features/editor/wizard/WizardLayout.tsx` — shell com stepper + navegação
- `src/features/editor/wizard/WizardStep1Subject.tsx`
- `src/features/editor/wizard/WizardStep2Style.tsx`
- `src/features/editor/wizard/WizardStep3Text.tsx`
- `src/stores/useWizardStore.ts` — Zustand store com `WizardState` (do PS.0)

**WizardStore obrigatório:**
```typescript
// src/stores/useWizardStore.ts
import { create } from 'zustand'
import { WizardState, PresetConfig } from '@/types/preset'
import { buildActiveConfig, applyPresetOverride } from '@/lib/presetUtils'

interface WizardStore extends WizardState {
  // Navegação
  currentStep: 1 | 2 | 3
  goToStep: (step: 1 | 2 | 3) => void
  goNext: () => void
  goBack: () => void

  // Preset
  selectImagePreset: (presetId: string) => void
  selectTextPreset: (presetId: string) => void
  setPresetOverride: (key: string, value: unknown) => void
  // key usa dot notation: 'text.headlineFont', 'colors.primary'

  // Subject
  setSubject: (base64: string, thumbnail: string) => void
  setSubjectProfile: (profile: SubjectProfile) => void

  // Textos
  setHeadline: (text: string) => void
  setSubheadline: (text: string) => void
  setCta: (text: string) => void

  // Referência
  setReference: (base64: string) => void
  setVisualDNA: (dna: VisualDNA) => void

  // Modo
  setMode: (mode: 'quick' | 'advanced') => void

  // Reset
  reset: () => void
}
```

**Layout do wizard:**
```
┌─────────────────────────────────────────────────────┐
│  ● ─── ○ ─── ○    Passo 1 de 3    [Quick ⇄ Advanced]│
│                                                     │
│         CONTEÚDO DO PASSO (80% da tela)             │
│                                                     │
│  [← Voltar]              [Próximo →] ou [✦ Gerar]   │
└─────────────────────────────────────────────────────┘
```

- Stepper: 3 pontos conectados. Ativo = preenchido + cor primária. Futuro = vazio.
- Navegação por teclado: Enter avança, Esc volta, Tab entre campos
- Passo 3 tem botão "✦ Gerar Criativo" em vez de "Próximo"

**NÃO FAZER:**
- Não conectar ao motor de geração ainda
- Não implementar os campos dos passos ainda (só a shell)
- Não criar o seletor de fonte como campo independente

**CHECKLIST 9.1:**
- [ ] `useWizardStore` usa `WizardState` do `src/types/preset.ts` (não tipo próprio)
- [ ] Store tem `selectedImagePresetId` e `selectedTextPresetId` como campos
- [ ] Store tem `activePresetConfig: PresetConfig` como campo
- [ ] `setPresetOverride` usa `applyPresetOverride` do presetUtils (imutável)
- [ ] Navegação entre passos funciona com teclado
- [ ] `npm run build` passa

---

## DIFF 9.2 — CARDS DE PRESET VISUAIS

**Depende de:** PS.0 (tipos), 9.1 (wizard store)

**O que criar:**
- `src/components/PresetCard.tsx` — card clicável com thumbnail + nome
- `src/components/PresetGrid.tsx` — grid de cards com seleção exclusiva por grupo
- Integrar no `WizardStep2Style`

**PresetCard:**
```typescript
interface PresetCardProps {
  preset: CreatygnPreset           // NUNCA string | nunca objeto ad-hoc
  selected: boolean
  onSelect: (preset: CreatygnPreset) => void
  size?: 'sm' | 'md' | 'lg'       // sm para atmosfera/iluminação, md para base
}
// Thumbnail vem de preset.thumbnailUrl
// Nome vem de preset.name
// Selecionado: borda cor primária + checkmark no canto
// Hover: borda destacada + descrição aparece como tooltip
```

**Grupos no Passo 2 (radio exclusivo por grupo):**
```
ESTILO BASE (escolher 1 obrigatório):
[Drama/Impact] [Clean/Premium] [Dark/Cinematic] [Editorial] [Neon/Futuristic]
Fonte: SYSTEM_IMAGE_PRESETS

ATMOSFERA (escolher 1, "Nenhum" é opção):
[Fog] [Particles] [Glass Shards] [Rain] [Nenhum]
Fonte: array local simples (não é preset completo, é override da config)

ILUMINAÇÃO (escolher 1, "Nenhum" é opção):
[Rim Purple] [Rim Blue] [Natural] [Hard Studio] [Nenhum]
Fonte: array local simples

PALETA DE CORES:
[● Primária] [● Secundária] [● Neutra] [+ Adicionar]
Color pickers que atualizam activePresetConfig.colors
```

**Ao selecionar preset base:**
```typescript
onSelectImagePreset(preset: CreatygnPreset) {
  wizardStore.selectImagePreset(preset.id)
  // Sugerir automaticamente o text preset compatível
  const suggestedText = getSuggestedTextPreset(preset.id)
  if (!wizardStore.selectedTextPresetId) {
    wizardStore.selectTextPreset(suggestedText.id)
  }
}
```

**NÃO FAZER:**
- Não usar array de strings: `['drama', 'clean', 'dark']`
- Não criar interface `StyleOption` própria — usar `CreatygnPreset`
- Não hardcodar thumbnails em JSX — vêm do `preset.thumbnailUrl`

**CHECKLIST 9.2:**
- [ ] `PresetCard` recebe `CreatygnPreset` como prop (não string, não objeto parcial)
- [ ] Seleção atualiza `selectedImagePresetId` no wizard store
- [ ] Seleção de preset de imagem sugere automaticamente texto compatível
- [ ] Cor primária/secundária/neutra atualiza `activePresetConfig.colors`
- [ ] "Nenhum" disponível para atmosfera e iluminação
- [ ] `npm run build` passa

---

## DIFF TR.1 — TEXTURAS DO RENDERER

**Depende de:** PS.0 (pode fazer paralelo com 9.x)
**Independente do wizard — não há conflito**

**O que criar:**
- `/public/textures/grunge-metal.png` — 256x256, tileable, para preset Impact
- `/public/textures/spray-paint.png` — 256x256, tileable, para preset Street
- `/public/textures/noise-subtle.png` — 256x256, overlay geral suave
- `src/features/editor/engine/textureLoader.ts` — carrega e cacheia texturas

```typescript
// src/features/editor/engine/textureLoader.ts
const TEXTURE_PATHS: Record<string, string> = {
  grunge_metal: '/textures/grunge-metal.png',
  spray_paint:  '/textures/spray-paint.png',
  noise_subtle: '/textures/noise-subtle.png',
}

const cache = new Map<string, HTMLImageElement>()

export async function loadTexture(name: string): Promise<HTMLImageElement> {
  if (cache.has(name)) return cache.get(name)!
  const img = new Image()
  img.src = TEXTURE_PATHS[name]
  await new Promise(res => { img.onload = res })
  cache.set(name, img)
  return img
}
```

**Especificação visual das texturas:**
- `grunge-metal`: cinza escuro com riscos e arranhados irregulares, preto e branco
- `spray-paint`: manchas de spray irregulares, alto contraste, preto e branco
- Ambas: tileable (borda esquerda = borda direita, top = bottom)
- Ambas: modo de uso é `background-clip: text` — precisa ter contraste suficiente

**CHECKLIST TR.1:**
- [ ] Texturas são tileable (testar repetindo 4x — sem seam visível)
- [ ] `loadTexture('grunge_metal')` retorna imagem carregada
- [ ] Cache funciona — segunda chamada não recarrega
- [ ] `npm run build` passa

---

## DIFF TR.2 — CSS VARIABLES DO SISTEMA DE CORES

**Depende de:** PS.0, 9.1 (wizard store com cores)

**O que criar:**
- `src/features/editor/engine/cssVarsInjector.ts` — injeta variáveis CSS baseadas na `activePresetConfig.colors`

```typescript
// src/features/editor/engine/cssVarsInjector.ts

export function injectPresetCSSVars(colors: ColorConfig, element: HTMLElement): void {
  const primaryRGB = hexToRGB(colors.primary)
  element.style.setProperty('--accent-color', colors.primary)
  element.style.setProperty('--accent-rgb', `${primaryRGB.r},${primaryRGB.g},${primaryRGB.b}`)
  element.style.setProperty('--accent-secondary', colors.secondary)
  element.style.setProperty('--neutral', colors.neutral)
  element.style.setProperty('--accent-word', colors.accentWord ?? colors.primary)
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}
```

**Onde usar:** injetar no container do canvas de preview e no container do resultado.
Todos os CSS dos presets de texto usam estas variáveis — mudar a cor do usuário
muda automaticamente glow, stroke, accent word, sem nenhum código adicional.

**CHECKLIST TR.2:**
- [ ] Mudar cor primária no wizard reflete imediatamente nas variáveis CSS
- [ ] `--accent-rgb` está no formato correto `R,G,B` (para usar em rgba())
- [ ] `npm run build` passa

---

## DIFF 9.3 — SELETOR DE FONTE COMO OVERRIDE

**Depende de:** PS.0, 9.1, 9.2 (preset de texto já precisa estar selecionado)

**Conceito crítico:** a fonte NÃO é um campo independente.
É um override opcional sobre o preset de texto ativo.

```
Fluxo correto:
1. Usuário seleciona preset "Impact" → headlineFont = 'Anton' (vem do preset)
2. Seletor de fonte aparece com 'Anton' pré-selecionado
3. Se usuário trocar para 'Bebas Neue':
   → wizardStore.setPresetOverride('text.headlineFont', 'Bebas Neue')
   → activePresetConfig.text.headlineFont = 'Bebas Neue'
   → preset base ('sys-txt-impact') NÃO muda
   → override fica só na sessão atual
```

**O que criar:**
- `src/components/FontSelector.tsx` — seletor com preview ao vivo
- Integrar no `WizardStep3Text` como campo secundário (não protagonista)

```typescript
interface FontSelectorProps {
  value: string                        // fonte atual (do activePresetConfig)
  previewText: string                  // texto do headline do usuário
  suggestedFonts: string[]             // sugestões baseadas no text preset ativo
  onChange: (fontName: string) => void // chama setPresetOverride
  label: string                        // 'Fonte principal' | 'Fonte secundária'
}
```

**UI do seletor:**
```
Fonte (override opcional):
┌─────────────────────────────────┐
│ Anton                      ▼    │
│ ──────────────────────────────  │
│ EU QUERIA SER FORTE             │  ← preview com o texto real do usuário
└─────────────────────────────────┘

Sugeridas para Impact:
[Anton] [Bebas Neue] [Oswald] [Black Han Sans]    [+ Ver todas]
```

**Carregamento de fontes:** usar Google Fonts API.
Carregar fonte só quando o seletor abre (não no mount do componente).
```typescript
async function loadGoogleFont(fontName: string): Promise<void> {
  const link = document.createElement('link')
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;700;900&display=swap`
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  await document.fonts.ready
}
```

**NÃO FAZER:**
- Não criar `const [font, setFont] = useState('Anton')` no componente
- Não salvar fonte diretamente em estado separado do wizard
- Não criar campo de fonte no WizardState além do que está em activePresetConfig

**CHECKLIST 9.3:**
- [ ] Selecionar preset "Impact" → seletor mostra 'Anton' automaticamente
- [ ] Trocar fonte → `activePresetConfig.text.headlineFont` muda (não estado isolado)
- [ ] Preview mostra o texto real do usuário na fonte selecionada
- [ ] Fonte só carrega do Google Fonts quando seletor abre
- [ ] `npm run build` passa

---

## DIFF TR.3 — TEXT STYLE PICKER (8 CARDS DE TEXTO)

**Depende de:** PS.0, TR.1, TR.2, 9.2 (estrutura de cards)

**O que criar:**
- `src/components/TextStylePicker.tsx` — grid 4x2 de cards
- Integrar no `WizardStep3Text` como seletor principal de texto

**Cada card renderiza em tempo real:**
```typescript
interface TextStyleCardProps {
  preset: CreatygnPreset              // type: 'text_style'
  previewText: string                 // headline atual do usuário
  colors: ColorConfig                 // cores atuais do usuário
  selected: boolean
  onSelect: (preset: CreatygnPreset) => void
}
// O card é um mini canvas 120x80px
// Renderiza o previewText com todos os efeitos do preset
// Quando o usuário digita, todos os 8 cards atualizam simultaneamente
// (debounce de 400ms para não sobrecarregar)
```

**Ao selecionar text preset:**
```typescript
onSelectTextPreset(preset: CreatygnPreset) {
  wizardStore.selectTextPreset(preset.id)
  // selectTextPreset substitui activePresetConfig.text pelo config do preset
  // Overrides anteriores de fonte são descartados (novo preset, novo começo)
}
```

**NÃO FAZER:**
- Não misturar cards de imagem com cards de texto na mesma grid
- Não criar interface própria para o card — usar `CreatygnPreset`

**CHECKLIST TR.3:**
- [ ] 8 cards renderizando com o texto real do usuário
- [ ] Selecionar card atualiza `selectedTextPresetId` no wizard store
- [ ] Debounce de 400ms no preview ao digitar
- [ ] Cards de texto e imagem são componentes distintos mas reutilizam `PresetCard`
- [ ] `npm run build` passa

---

## DIFF TR.4 — ACCENT WORD

**Depende de:** PS.0, 9.3

**O que criar:**
- `src/features/editor/engine/accentWord.ts`

```typescript
// Detecta automaticamente qual palavra destacar
export function detectAccentWord(text: string): { before: string; accent: string; after: string } {
  const words = text.trim().split(/\s+/)
  if (words.length === 1) return { before: '', accent: words[0], after: '' }
  if (words.length === 2) return { before: words[0], accent: words[1], after: '' }
  // Para 3+ palavras: destaca o último grupo de 1-2 palavras
  const accentWords = words.slice(-2)
  const beforeWords = words.slice(0, -2)
  return {
    before: beforeWords.join(' '),
    accent: accentWords.join(' '),
    after: ''
  }
}

// Parseia [colchetes] manuais do usuário
export function parseManualAccent(text: string): { before: string; accent: string; after: string } {
  const match = text.match(/^(.*?)\[(.+?)\](.*)$/)
  if (!match) return { before: text, accent: '', after: '' }
  return { before: match[1].trim(), accent: match[2].trim(), after: match[3].trim() }
}

// Retorna HTML com span para a accent word
export function renderAccentWord(
  text: string,
  accentColor: string,
  useAuto: boolean
): string {
  const parts = useAuto ? detectAccentWord(text) : parseManualAccent(text)
  if (!parts.accent) return `<span>${text}</span>`
  return [
    parts.before ? `<span>${parts.before} </span>` : '',
    `<span style="color: ${accentColor}">${parts.accent}</span>`,
    parts.after ? `<span> ${parts.after}</span>` : '',
  ].join('')
}
```

**CHECKLIST TR.4:**
- [ ] `detectAccentWord('EU QUERIA SER FORTE')` → accent = 'SER FORTE'
- [ ] `parseManualAccent('EU [QUERIA] SER FORTE')` → accent = 'QUERIA'
- [ ] Accent word usa `--accent-word` CSS var (que vem da cor do usuário)
- [ ] `npm run build` passa

---

## DIFF 9.4 — POSIÇÃO DO TEXTO COM CANVAS PREVIEW

**Depende de:** PS.0, 9.1, TR.2

**O que criar:**
- `src/features/editor/wizard/PreviewCanvas.tsx` — canvas de preview pré-geração
- Integrar no `WizardStep3Text`

**Comportamento:**
```
Passo 3 do wizard mostra um canvas dividido:
┌─────────────────────────────┐
│  ████████████████████████   │ ← zona de texto (overlay escuro)
│  [headline do usuário]      │   com tipografia real do preset selecionado
│  [subheadline]              │
│  [CTA]                      │
│─────────────────────────────│
│  [foto do subject se        │ ← zona do subject
│   já foi uploadada]         │   ou ícone placeholder
└─────────────────────────────┘
```

- Overlay usa gradiente do `TEXT_LAYOUTS[textPosition].overlayStyle`
- Texto simulado usa fonte e estilo do `activePresetConfig.text`
- Sincronização bidirecional: arrastar zona de texto muda `textPosition` no store
- Mudar `textPosition` no store anima a zona com transition suave

```typescript
// Posições e seus overlays
const TEXT_LAYOUTS = {
  bottom: {
    overlayStyle: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
    zone: { top: '65%', left: 0, right: 0, bottom: 0 },
  },
  top: {
    overlayStyle: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
    zone: { top: 0, left: 0, right: 0, bottom: '65%' },
  },
  left: {
    overlayStyle: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
    zone: { top: 0, left: 0, right: '55%', bottom: 0 },
  },
  right: {
    overlayStyle: 'linear-gradient(to left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
    zone: { top: 0, left: '55%', right: 0, bottom: 0 },
  },
}
```

**CHECKLIST 9.4:**
- [ ] Canvas atualiza em tempo real ao digitar headline
- [ ] Canvas atualiza ao mudar text preset
- [ ] Canvas atualiza ao mudar posição do texto
- [ ] Arrastar zona atualiza `activePresetConfig.composition.textPosition`
- [ ] `npm run build` passa

---

## DIFF TR.5 — RENDERER PRINCIPAL (8 PRESETS T1-T8)

**Depende de:** PS.0, TR.1, TR.2, TR.4

**O que criar:**
- `src/features/editor/engine/textRenderer.ts` — função principal de render

```typescript
export interface TextRenderConfig {
  texts: { headline: string; subheadline?: string; cta?: string }
  presetConfig: TextPresetConfig
  colors: ColorConfig
  composition: CompositionConfig
  canvasWidth: number
  canvasHeight: number
  backgroundImage: HTMLImageElement
}

// Retorna HTMLElement pronto para compor sobre o canvas
export async function renderText(config: TextRenderConfig): Promise<HTMLElement> {
  // 1. Criar container posicionado na zona correta
  // 2. Aplicar overlay de integração (gradiente)
  // 3. Injetar CSS vars de cores
  // 4. Renderizar headline com preset (fonte, peso, tracking, efeitos)
  // 5. Se efeito.texture: aplicar background-clip: text
  // 6. Se efeito.glow: aplicar text-shadow com cores do preset
  // 7. Se efeito.gradient: aplicar linear-gradient no texto
  // 8. Renderizar accent word com renderAccentWord()
  // 9. Renderizar subheadline + CTA
  // 10. Retornar elemento
}
```

**CSS por preset — os 8 blocos completos:**

**T1 — Impact/Drama:**
```css
.headline-impact {
  font-family: 'Anton', Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(48px, 10vw, 96px);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.9;
  background: url('/textures/grunge-metal.png') center/cover;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))
          drop-shadow(0 6px 16px rgba(0,0,0,0.4))
          drop-shadow(0 12px 32px rgba(0,0,0,0.3));
}
.subheadline-impact {
  font-family: 'Oswald', sans-serif;
  font-weight: 400;
  font-size: clamp(16px, 3.5vw, 32px);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
}
.cta-impact {
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  font-size: clamp(14px, 2.8vw, 26px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-color);
  border-bottom: 2px solid var(--accent-color);
  padding-bottom: 4px;
}
```

**T2 — Clean/Editorial:**
```css
.headline-clean {
  font-family: 'Bebas Neue', Anton, sans-serif;
  font-weight: 400;
  font-size: clamp(52px, 11vw, 104px);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.88;
  color: #FFFFFF;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.subheadline-clean {
  font-family: 'Montserrat', sans-serif;
  font-weight: 300;
  font-size: clamp(14px, 2.5vw, 24px);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.9);
}
.cta-clean {
  display: inline-block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: clamp(12px, 2vw, 18px);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #FFFFFF;
  border: 2px solid #FFFFFF;
  padding: 10px 24px;
}
```

**T3 — Dark/Cinematic:**
```css
.headline-dark {
  font-family: 'Cinzel Decorative', 'Playfair Display', serif;
  font-weight: 700;
  font-size: clamp(36px, 8vw, 78px);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.0;
  color: #FFFFFF;
  text-shadow:
    0 0 10px rgba(0, 229, 255, 0.9),
    0 0 30px rgba(0, 229, 255, 0.6),
    0 0 60px rgba(0, 229, 255, 0.3),
    0 2px 4px rgba(0,0,0,0.8);
}
.subheadline-dark {
  font-family: 'Cinzel', sans-serif;
  font-weight: 400;
  font-size: clamp(12px, 2vw, 20px);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(0, 229, 255, 0.8);
}
.cta-dark {
  font-family: 'Share Tech Mono', monospace;
  font-weight: 400;
  font-size: clamp(10px, 1.5vw, 14px);
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.6);
}
```

**T4 — Neon/Futuristic:**
```css
.headline-neon {
  font-family: 'Rajdhani', Orbitron, sans-serif;
  font-weight: 700;
  font-size: clamp(44px, 9vw, 88px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 0.95;
  color: #FFFFFF;
  text-shadow:
    0 0 7px #fff,
    0 0 21px #fff,
    0 0 42px var(--accent-color),
    0 0 82px var(--accent-color);
}
```

**T5 — Street/Grunge:**
```css
.headline-street {
  font-family: 'Black Han Sans', Anton, sans-serif;
  font-weight: 900;
  font-size: clamp(50px, 10.5vw, 100px);
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.85;
  background: url('/textures/spray-paint.png') center/cover;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-text-stroke: 2px rgba(255,255,255,0.3);
}
```

**T6 — Luxury/Elegance:**
```css
.headline-luxury {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-weight: 300;
  font-size: clamp(36px, 7.5vw, 72px);
  text-transform: uppercase;
  letter-spacing: 0.25em;
  line-height: 1.2;
  background: linear-gradient(135deg,
    #FFFFFF 0%, #E8D9B5 30%, #FFFFFF 50%, #C9B99A 70%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**T7 — Bold/Sport:**
```css
.headline-sport {
  font-family: 'Teko', 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(56px, 12vw, 112px);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.82;
  color: #FFFFFF;
  -webkit-text-stroke: 3px rgba(255,255,255,1);
  paint-order: stroke fill;
  text-shadow:
    4px 4px 0px var(--accent-color),
    8px 8px 0px rgba(0,0,0,0.3);
}
```

**T8 — Minimal/Swiss:**
```css
.headline-minimal {
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  font-weight: 800;
  font-size: clamp(40px, 8.5vw, 80px);
  text-transform: none;
  letter-spacing: -0.04em;
  line-height: 1.0;
  color: #FFFFFF;
}
```

**CHECKLIST TR.5:**
- [ ] Todos os 8 presets renderizam sem erros
- [ ] `background-clip: text` funciona (verificar prefixos)
- [ ] Fontes são carregadas antes de renderizar
- [ ] Accent word aparece na cor `--accent-word`
- [ ] `npm run build` passa

---

## DIFF TR.6 — OVERLAY DE INTEGRAÇÃO

**Depende de:** TR.5, 9.4

**Lógica:** detectar luminosidade média da zona onde o texto vai ficar.
Se a zona for clara, aumentar a opacidade do overlay.
Se for escura, reduzir.

```typescript
export function calculateOverlayIntensity(
  imageData: ImageData,
  zone: TextZone
): number {
  // Extrair pixels da zona
  const zonePixels = extractZonePixels(imageData, zone)
  // Calcular luminosidade média
  const avgLuminosity = zonePixels.reduce((sum, px) => {
    return sum + (0.299 * px.r + 0.587 * px.g + 0.114 * px.b) / 255
  }, 0) / zonePixels.length
  // Mapa: fundo claro → overlay forte; fundo escuro → overlay leve
  if (avgLuminosity > 0.7) return 0.80  // fundo muito claro
  if (avgLuminosity > 0.5) return 0.65  // fundo claro
  if (avgLuminosity > 0.3) return 0.50  // fundo médio
  return 0.35                           // fundo escuro — overlay suave
}
```

**CHECKLIST TR.6:**
- [ ] Overlay é gradiente (não retângulo sólido)
- [ ] Intensidade muda conforme luminosidade da zona
- [ ] Preset Clean não usa overlay por padrão
- [ ] `npm run build` passa

---

## DIFF TR.7 — EXPORT FINAL COMPOSTO

**Depende de:** TR.5, TR.6, 13.2 (cache da imagem base)

```typescript
export async function exportComposed(
  imageBase64: string,
  textConfig: TextRenderConfig,
  targetFormat: ExportFormat
): Promise<string> {
  // 1. Criar canvas no tamanho do formato alvo
  const canvas = document.createElement('canvas')
  canvas.width = targetFormat.w
  canvas.height = targetFormat.h
  const ctx = canvas.getContext('2d')!

  // 2. Desenhar imagem base (com crop inteligente para o formato)
  const img = await base64ToImage(imageBase64)
  drawWithCrop(ctx, img, targetFormat)

  // 3. Renderizar overlay de integração
  renderOverlay(ctx, textConfig.composition, targetFormat)

  // 4. Renderizar texto (usando textRenderer)
  const textElement = await renderText(textConfig)
  // Rasterizar o elemento HTML no canvas via html2canvas ou similar
  await rasterizeHTMLToCanvas(textElement, ctx, targetFormat)

  // 5. Aplicar marca d'água se plano free
  if (userPlan === 'free') applyWatermark(ctx, targetFormat)

  // 6. Exportar como PNG base64
  return canvas.toDataURL('image/png', 1.0)
}
```

**CHECKLIST TR.7:**
- [ ] Export final tem texto + imagem compostos corretamente
- [ ] `background-clip: text` foi rasterizado (não é transparente no PNG)
- [ ] Resolução alvo respeitada (2K mínimo)
- [ ] `npm run build` passa

---

## DIFF 9.5 — MODO RÁPIDO / AVANÇADO

**Depende de:** 9.1-9.4, TR.3

**Quick Mode (default) — campos visíveis:**
```
Passo 1: só upload
Passo 2: só preset base (5 image cards)
Passo 3: TextStylePicker (8 cards) + headline + CTA + formato
Total: ~8 interações, ~30 segundos
```

**Advanced Mode — todos os campos:**
```
Passo 1: upload + framing + camera angle + referência
Passo 2: preset base + atmosfera + iluminação + cores
Passo 3: TextStylePicker + headline + subheadline + CTA + fonte override + posição + formato
```

**Toggle:** botão no canto superior direito. Estado persistido em localStorage.
Ao trocar de modo: não perder dados já preenchidos — só mostrar/esconder campos.

**Sugestão automática de preset no Quick Mode:**
```typescript
// Após Vision AI analisar o subject (Stage 1 do Vision First):
function suggestPresetForSubject(profile: SubjectProfile): string {
  if (profile.subjectType === 'person') {
    if (profile.framing?.currentCrop === 'close-up') return 'sys-img-drama'
    return 'sys-img-editorial'
  }
  if (profile.subjectType === 'product') {
    if (profile.product?.category?.includes('food')) return 'sys-img-clean'
    if (profile.product?.category?.includes('tech')) return 'sys-img-neon'
    return 'sys-img-clean'
  }
  return 'sys-img-drama' // fallback
}
```

**CHECKLIST 9.5:**
- [ ] Quick Mode mostra só os campos essenciais
- [ ] Dados não se perdem ao trocar de modo
- [ ] Estado do modo persiste em localStorage
- [ ] Sugestão automática roda quando subjectProfile está disponível
- [ ] `npm run build` passa

---

## DIFF 13.1-13.5 — EXPORT MULTI-FORMATO

*(spec detalhada já estava no CREATYNG_FEATURES_SPEC.md — manter como está)*
*(integração adicional: ExportModal usa `CachedGeneration` do wizard store)*

**Integração crítica com o sistema de presets:**

No DIFF 13.2 (cache da imagem base), o cache DEVE incluir:
```typescript
const generation: CachedGeneration = {
  generationId: crypto.randomUUID(),
  imageBase64,
  imageThumbnail: await resizeToThumbnail(imageBase64, 300, 300),
  wizardStateSnapshot: { ...wizardStore.getState() },
  presetIds: {
    image: wizardStore.selectedImagePresetId,
    text: wizardStore.selectedTextPresetId,
  },
  activePresetConfigSnapshot: { ...wizardStore.activePresetConfig },
  visualDNA: wizardStore.visualDNA,
  meta,
  timestamp: Date.now(),
}
```

Sem isso, o feedback loop e o histórico perdem os dados mais valiosos.

---

## DIFF 16.1-16.6 — BRAND KIT + AVATAR

*(spec detalhada já estava no CREATYNG_FEATURES_SPEC.md)*

**Integração crítica:** Brand Kit usa o schema de `CreatygnPreset` com:
- `type: 'brand_kit'`
- `scope: 'user_private'`
- `config:` inclui image + text + colors + composition (config completa)

A tabela `brand_kits` separada do Supabase pode existir para dados de avatar e logo,
mas o estilo visual do brand kit deve ser salvo como um `CreatygnPreset` na tabela `presets`.
Isso permite que brand kits apareçam como presets no wizard sem código adicional.

---

# ═══════════════════════════════════════════
# FASE 2 — POLIMENTO
# (Executar após Fase 1 validada com usuários reais)
# ═══════════════════════════════════════════

*(Features 1, 2, 3, 4, 5, 7, 8 — spec detalhada mantida do CREATYNG_FEATURES_SPEC.md)*
*(Todos usam WizardState e CachedGeneration do schema universal — sem mudanças de tipo)*

**Nota importante para DIFF 3.1 (Refinar sem regerar):**
O "refinamento" é literalmente `setPresetOverride` no wizard store + re-render do TR.5.
Não precisa de novo sistema. Já está na arquitetura.

**Nota importante para DIFF 4.4 (Favoritar):**
```typescript
async function favoriteGeneration(gen: CachedGeneration) {
  await supabase.from('generation_feedback').insert({
    generation_id: gen.generationId,
    user_id: currentUser.id,
    rating: 'favorited',
    preset_id: gen.presetIds.image ?? null,
    config_snapshot: gen.activePresetConfigSnapshot,
    image_url: await uploadToStorage(gen.imageBase64),
    image_thumbnail_url: await uploadToStorage(gen.imageThumbnail),
    rated_at: new Date().toISOString(),
  })
  // Incrementar stats do preset
  if (gen.presetIds.image) {
    await supabase.rpc('increment_preset_favorite', { preset_id: gen.presetIds.image })
  }
}
```

---

# ═══════════════════════════════════════════
# FASE 3 — EXPANSÃO
# ═══════════════════════════════════════════

*(Features 10, 12, 14, 15, 17, 18 — spec mantida do CREATYNG_FEATURES_SPEC.md)*

**Nota para DIFF 17.1 (Salvar Meu Estilo):**
"Salvar como Meu Estilo" = criar `CreatygnPreset` com:
```typescript
{
  type: 'full',
  scope: 'user_private',
  authorId: currentUser.id,
  config: gen.activePresetConfigSnapshot,
  thumbnailUrl: gen.imageThumbnail,
  // stats começam zerados
}
```
Zero refatoração. É só inserir na tabela `presets`.

**Sistema de Aprendizado (PS.1-PS.8) — ativar nesta fase:**
Com volume de dados de feedback acumulado da Fase 1 e 2,
implementar clustering, sugestão automática por DNA e marketplace.

---

# ═══════════════════════════════════════════
# ORDEM FINAL DE EXECUÇÃO
# ═══════════════════════════════════════════

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — MVP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PS.0   tipos + banco + seed (PRIMEIRO — sem exceção)

9.1    wizard shell + store com WizardState
TR.1   texturas (paralelo com 9.x — sem dependência)
TR.2   CSS vars (depende de PS.0 e 9.1)
9.2    cards de preset (depende de PS.0 e 9.1)
TR.3   TextStylePicker (depende de TR.1, TR.2, 9.2)
9.3    seletor de fonte como override (depende de 9.2, TR.3)
TR.4   accent word (depende de PS.0)
9.4    canvas preview com zonas (depende de 9.1, TR.2)
TR.5   renderer 8 presets (depende de TR.1, TR.2, TR.4)
TR.6   overlay de integração (depende de TR.5)
9.5    modo rápido/avançado (depende de 9.1-9.4, TR.3)
TR.7   export composto (depende de TR.5, TR.6)

13.1   modal de export
13.2   cache da geração com CachedGeneration (snapshot completo)
13.3   renderer multi-formato
13.4   previews por formato
13.5   download ZIP

16.1   schema brand kit no Supabase
16.2   CRUD brand kit (usa CreatygnPreset type: brand_kit)
16.3   criação de avatar
16.4   previews do avatar
16.5   integração avatar com wizard
16.6   galeria de composições

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — POLIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1-3.3   refinar sem regerar
4.1-4.4   histórico visual + favoritar com feedback
5.1-5.2   canvas interativo
7.1-7.2   drag texto
8.1-8.2   comparador antes/depois
1.1-1.3   streaming visual
2.1-2.3   3 variações automáticas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — EXPANSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

17.1-17.2  salvar meu estilo (insert em presets)
18.1-18.3  quality score
12.1-12.2  atalhos de teclado
14.1-14.2  preview em dispositivo
15.1-15.2  marca d'água
PS.1-PS.8  sistema de aprendizado + marketplace
```

---

# ═══════════════════════════════════════════
# PRÉ-FASE 2 — CORREÇÕES OBRIGATÓRIAS ANTES DE CONTINUAR
# Execute e conclua os 3 diffs abaixo antes de iniciar qualquer diff da Fase 2.
# ═══════════════════════════════════════════

## Contexto

A Fase 1 foi concluída com sucesso (build limpo, todos os diffs commitados).
Três pontos do log de execução precisam ser resolvidos antes do merge na main
e antes de iniciar a Fase 2. São correções de qualidade — não features novas.

```
PRE.1 → PRE.2 → PRE.3 → npm run build → merge main → tag v0.1.0-mvp → FASE 2
```

---

## DIFF PRE.1 — AVATAR: FEATURE FLAG LIMPA
**Risco: zero. Tempo estimado: 20 minutos.**

**Problema:** Previews do Avatar estão como stub (TODO).
Expor funcionalidade incompleta em produção prejudica a percepção do produto.

**O que criar:**

```typescript
// src/config/features.ts
// Arquivo central de feature flags. Adicionar novas flags aqui sempre.

export const FEATURES = {
  // Avatar requer Edge Function ainda não implementada.
  // Mudar para true quando supabase/functions/generate-avatar estiver pronto.
  AVATAR_ENABLED: false,

  // Futuras flags (não implementar ainda — só declarar):
  MARKETPLACE_ENABLED: false,
  QUALITY_SCORE_ENABLED: false,
  VARIATIONS_ENABLED: false,
} as const
```

```typescript
// src/features/brandKit/AvatarSection.tsx
// Envolver o conteúdo existente neste wrapper — não reescrever o conteúdo.

import { FEATURES } from '@/config/features'

export function AvatarSection() {
  if (!FEATURES.AVATAR_ENABLED) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {/* Conteúdo atual com blur — não apagar, só ofuscar */}
        <div className="opacity-40 pointer-events-none select-none blur-[1.5px]">
          <AvatarSectionContent />
        </div>
        {/* Overlay de "em breve" */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-black/75 backdrop-blur-sm rounded-2xl px-8 py-5 text-center">
            <p className="text-white font-semibold text-base">Avatar em breve</p>
            <p className="text-white/60 text-sm mt-1">
              Estamos finalizando esta funcionalidade
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <AvatarSectionContent />
}
```

**NÃO FAZER:**
- Não apagar o conteúdo existente do Avatar — só envolver com a flag
- Não criar feature flags em outros arquivos — centralizar em `src/config/features.ts`

**CHECKLIST PRE.1:**
- [ ] `src/config/features.ts` criado com `AVATAR_ENABLED: false`
- [ ] AvatarSection renderiza overlay "em breve" quando flag é false
- [ ] AvatarSection renderiza normalmente quando flag é true (testar manualmente)
- [ ] Nenhum outro componente foi alterado
- [ ] `npm run build` passa

---

## DIFF PRE.2 — BRAND KIT: CAMADA DE ABSTRAÇÃO DE STORAGE
**Risco: médio. Tempo estimado: 1-2 horas.**

**Problema:** Brand Kit usa localStorage diretamente nos componentes.
Quando Supabase for configurado, precisaria refatorar cada componente.
A solução é criar uma camada de abstração agora — os componentes nunca
tocam localStorage diretamente, só chamam `brandKitStorage`.

**O que criar:**

```typescript
// src/lib/brandKitStorage.ts

import { BrandKit } from '@/types/preset'
import { supabase } from '@/lib/supabase'

// ─── INTERFACE ────────────────────────────────────────────────────────────────
// Todos os componentes usam esta interface. Nunca localStorage diretamente.

export interface IBrandKitStorage {
  getAll(): Promise<BrandKit[]>
  getById(id: string): Promise<BrandKit | null>
  save(kit: BrandKit): Promise<BrandKit>
  delete(id: string): Promise<void>
}

// ─── IMPLEMENTAÇÃO LOCAL (ativa agora) ───────────────────────────────────────

class LocalBrandKitStorage implements IBrandKitStorage {
  private readonly KEY = 'creatyng_brand_kits_v2'

  async getAll(): Promise<BrandKit[]> {
    try {
      const raw = localStorage.getItem(this.KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  async getById(id: string): Promise<BrandKit | null> {
    const all = await this.getAll()
    return all.find(k => k.id === id) ?? null
  }

  async save(kit: BrandKit): Promise<BrandKit> {
    const all = await this.getAll()
    const idx = all.findIndex(k => k.id === kit.id)
    const updated = { ...kit, updatedAt: new Date().toISOString() }
    if (idx >= 0) {
      all[idx] = updated
    } else {
      all.push({ ...updated, createdAt: new Date().toISOString() })
    }
    localStorage.setItem(this.KEY, JSON.stringify(all))
    return updated
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll()
    localStorage.setItem(this.KEY, JSON.stringify(all.filter(k => k.id !== id)))
  }
}

// ─── IMPLEMENTAÇÃO SUPABASE (ativa quando SUPABASE_READY = true) ──────────────

class SupabaseBrandKitStorage implements IBrandKitStorage {
  async getAll(): Promise<BrandKit[]> {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async getById(id: string): Promise<BrandKit | null> {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  async save(kit: BrandKit): Promise<BrandKit> {
    const { data, error } = await supabase
      .from('brand_kits')
      .upsert({ ...kit, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('brand_kits')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ─── INSTÂNCIA EXPORTADA ──────────────────────────────────────────────────────
// Mudar SUPABASE_READY para true quando:
// 1. supabase/migrations/001_preset_system.sql foi aplicada
// 2. Variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão no .env
// 3. RLS policies estão configuradas

const SUPABASE_READY = false

export const brandKitStorage: IBrandKitStorage = SUPABASE_READY
  ? new SupabaseBrandKitStorage()
  : new LocalBrandKitStorage()
```

**Refatoração dos componentes existentes:**

Encontrar todos os arquivos que hoje usam localStorage para brand kits.
Substituir cada acesso direto pela chamada equivalente ao `brandKitStorage`:

```typescript
// ANTES (padrão a eliminar):
const kits = JSON.parse(localStorage.getItem('brand_kits') || '[]')
localStorage.setItem('brand_kits', JSON.stringify(kits))

// DEPOIS (padrão correto):
import { brandKitStorage } from '@/lib/brandKitStorage'
const kits = await brandKitStorage.getAll()
await brandKitStorage.save(kit)
```

**NÃO FAZER:**
- Não mudar a UI dos componentes — só a fonte dos dados
- Não apagar dados existentes no localStorage (usar KEY diferente: `creatyng_brand_kits_v2`)
- Não implementar migração de dados agora — usuários de teste aceitam recomeçar

**CHECKLIST PRE.2:**
- [ ] `src/lib/brandKitStorage.ts` criado com as duas implementações
- [ ] Nenhum componente acessa `localStorage` diretamente para brand kits
- [ ] `SUPABASE_READY = false` (localStorage ativo)
- [ ] Criar, editar e deletar brand kit funcionam normalmente
- [ ] `npm run build` passa

---

## DIFF PRE.3 — EXPORT: UX DE DOWNLOAD SEQUENCIAL
**Risco: baixo. Tempo estimado: 30 minutos.**

**Problema:** Downloads sequenciais sem feedback parecem bugs.
O usuário não sabe quantos arquivos estão sendo baixados ou o progresso.

**O que criar:**

```typescript
// src/features/editor/export/sequentialDownload.ts

export interface DownloadFile {
  filename: string
  base64: string
  label: string       // "Instagram Feed", "Stories", etc
}

export async function downloadSequential(
  files: DownloadFile[],
  onProgress: (current: number, total: number, label: string) => void
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Notificar progresso antes de baixar
    onProgress(i + 1, files.length, file.label)

    // Converter base64 para blob e baixar
    const blob = base64ToBlob(file.base64, 'image/png')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Delay entre downloads — evita que o browser bloqueie
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 900))
    }
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(',')[1] ?? base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}
```

**UI de progresso no ExportModal:**

```typescript
// Adicionar ao ExportModal — estado de download

const [downloadState, setDownloadState] = useState<{
  active: boolean
  current: number
  total: number
  currentLabel: string
} | null>(null)

async function handleExport() {
  const files = buildFilesToExport(selectedFormats, cachedGeneration)

  setDownloadState({ active: true, current: 0, total: files.length, currentLabel: '' })

  await downloadSequential(files, (current, total, label) => {
    setDownloadState({ active: true, current, total, currentLabel: label })
  })

  setDownloadState(null)
}

// UI durante download:
{downloadState?.active && (
  <div className="flex flex-col gap-2 p-4 bg-black/10 rounded-xl">
    <div className="flex justify-between text-sm text-white/80">
      <span>Baixando {downloadState.currentLabel}...</span>
      <span>{downloadState.current} de {downloadState.total}</span>
    </div>
    <div className="w-full bg-white/10 rounded-full h-1.5">
      <div
        className="bg-white rounded-full h-1.5 transition-all duration-500"
        style={{ width: `${(downloadState.current / downloadState.total) * 100}%` }}
      />
    </div>
  </div>
)}
```

**CHECKLIST PRE.3:**
- [ ] Download de 1 formato: baixa direto sem barra de progresso
- [ ] Download de 2+ formatos: mostra barra com label de cada arquivo
- [ ] Delay de 900ms entre downloads (browser não bloqueia)
- [ ] Após todos os downloads: estado reseta, botão volta ao normal
- [ ] `npm run build` passa

---

## CHECKLIST FINAL PRÉ-FASE 2

Após PRE.1 + PRE.2 + PRE.3 concluídos:

```bash
npm run build          # deve passar com 0 erros
npm run typecheck      # se existir

# Merge na main
git checkout main
git merge --no-ff feat/pre-fase2-fixes
git push origin main

# Tag do MVP
git tag -a v0.1.0-mvp -m "Fase 1 completa + correções pré-Fase 2"
git push origin v0.1.0-mvp
```

**Após o merge e a tag: a Fase 2 pode começar.**
Primeiro diff da Fase 2: conectar `useWizardStore` ao motor de geração real.
Ver seção FASE 2 deste documento para a ordem completa.

---

# PROMPT DE INÍCIO PARA O CLAUDE CODE

```
Leia estes arquivos nesta ordem — todos, antes de qualquer implementação:
1. CLAUDE.md
2. CREATYNG_MASTER_SPEC.md  ← este documento
3. CREATYNG_VISION_FIRST.md
4. CREATYNG_MOTOR_PLAN.md

FASE 1 está 100% concluída (build limpo, todos os diffs commitados).

Antes de iniciar a Fase 2, execute os 3 diffs de correção obrigatórios
na seção PRÉ-FASE 2 deste documento:

  PRE.1 → Feature flag para Avatar (20 min, risco zero)
  PRE.2 → Camada de abstração de storage para Brand Kit (1-2h, risco médio)
  PRE.3 → UX de download sequencial no Export (30 min, risco baixo)

Regras de execução:
- Execute um diff por vez na ordem acima
- Após cada diff: npm run build deve passar limpo
- Não misture os diffs
- Não inicie PRE.2 antes de PRE.1 estar commitado
- Não inicie PRE.3 antes de PRE.2 estar commitado
- Não misture correções dos PRE com qualquer diff da Fase 2

Ao finalizar os 3 diffs:
1. Rode npm run build uma última vez
2. Execute o merge na main e a tag v0.1.0-mvp conforme o CHECKLIST FINAL
3. Me informe: "PRÉ-FASE 2 concluída. Build limpo. Tag v0.1.0-mvp criada.
   Pronto para iniciar Fase 2 — conectar useWizardStore ao motor de geração."

Só então aguarde minha confirmação para iniciar a Fase 2.
```