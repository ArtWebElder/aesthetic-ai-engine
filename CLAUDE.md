# CREATYNG — CONTEXTO PERMANENTE PARA O CLAUDE CODE

> Leia este arquivo inteiro antes de qualquer tarefa e confirme o estágio atual.
> Não implemente nada sem antes declarar: "Estamos no STAGE X. O próximo diff é Y."
> Para tasks de geração/prompt/engine, leia também: **CREATYNG_VISUAL_SPEC.md**

---

## O QUE É O CREATYNG

SaaS premium de criação visual com IA. O usuário preenche campos simples (headline, estilo, produto) e recebe na outra ponta uma imagem de nível agência — texto perfeito, layout profissional, sem cara de IA amadora.

**Frase central:** "Você joga os ingredientes. O motor entrega o bolo pronto."

**Mercado-alvo:** e-commerce, criadores, agências, social media managers — global (EN, PT-BR, ES).

---

## DUAS INTERFACES DE CRIAÇÃO

O Creatyng tem duas interfaces distintas para criação:

### 1. Editor (Wizard)
Interface guiada com 3 passos (Subject → Style → Text). Usa presets de cena, moods, props.
Ideal para leigos — preenche campos e gera.
- Localização: `src/features/editor/`
- Rota: `/create` (EditorPage)

### 2. Studio (Node Editor)
Interface estilo ComfyUI com nodes visuais conectáveis. Pipeline configurável.
Ideal para power users e fluxos customizados.
- Localização: `src/app/create/studio/`
- Rota: `/create/studio` (StudioPage)
- **Este é o foco de desenvolvimento atual.**

---

## FEATURES CORE DO MVP

### 1. Ecom Banner (via Studio → fluxo "Banner Criativo")
- Produto real do user (foto) + fundo profissional gerado pela IA + texto nítido (Canvas 2D)
- Pipeline: Referência → Análise → BG Removal → Gerar Fundo → Compositor → Text Overlay → Export
- Subject preservado 100% fiel (foto real recortada, não regenerada pela IA)

### 2. Styled Photo (via Studio → fluxo "Foto no Estilo")
- Recria a foto do user seguindo o estilo de uma referência visual
- Pipeline: Referência + Subject → Análise → Prompt Builder → Image Gen → Export
- Strict Identity: produto mantém aparência real

### 3. Photoshoot (via Editor/Wizard)
- Ensaio fotográfico ultra realista (pessoa, produto, marca, comida)
- Altíssima qualidade: iluminação cinematográfica, output 2K/4K
- Estilo controlado por presets de cena

---

## ARQUITETURA TÉCNICA

### Stack
- **Frontend:** React + TypeScript + Tailwind CSS + shadcn-ui (Vite)
- **Backend:** Supabase (Postgres + Storage + Edge Functions em Deno)
- **IA Engine:** Pipeline multi-modelo com roteamento inteligente
- **Tipografia:** Canvas 2D no browser (text overlay node) — não HTML/CSS overlay

### Pipeline Studio (Banner Criativo)
```
Referência (imagem)  →  Analisar Referência (Gemini 2.5 Flash)
Subject (foto real)  →  BG Removal (ONNX/API)
                              ↓
                     Gerar Fundo (Flux/Gemini — SÓ cenário, sem subject)
                              ↓
                     Compositor (Canvas API — subject recortado SOBRE fundo)
                              ↓
                     Text Overlay (Canvas 2D — headline, preço, CTA)
                              ↓
                     Export (PNG/JPG/WebP)
```

### Pipeline Studio (Foto no Estilo)
```
Referência + Subject → Analisar Referência (Gemini)
                              ↓
                     Prompt Builder (compila prompt)
                              ↓
                     Image Gen (Gemini IMG2IMG / Replicate)
                              ↓
                     Export
```

---

## ARQUIVOS PRINCIPAIS (fonte única de verdade)

### Studio (Node Editor) — FOCO ATUAL
| Arquivo | Descrição |
|---|---|
| `src/app/create/StudioPage.tsx` | Página principal do Studio (state, handlers, layout) |
| `src/app/create/studio/types.ts` | Tipos: NodeTypeId, NODE_TYPE_DEFS, PRESET_FLOWS, Connection |
| `src/app/create/studio/engine.ts` | Motor de execução: executeNode, executeFlow, topological sort |
| `src/app/create/studio/StudioNode.tsx` | Renderização visual de cada node (inputs, previews, run btn) |
| `src/app/create/studio/StudioCanvas.tsx` | Canvas infinito com pan/zoom |
| `src/app/create/studio/StudioConnection.tsx` | Linhas SVG entre nodes |
| `src/app/create/studio/StudioNodePanel.tsx` | Painel lateral "Add node" com categorias |
| `src/app/create/studio/FlowSelector.tsx` | Modal de seleção de fluxo ao abrir o Studio |
| `src/app/create/studio/StudioChat.tsx` | Chat IA (descreva e a IA monta o fluxo) |
| `src/app/create/studio/StudioTopMenu.tsx` | Menu topo (New, Clone, Undo, Redo, Auto Layout) |
| `src/app/create/studio/StudioToolbar.tsx` | Toolbar inferior (cursor/hand, zoom) |
| `src/app/create/studio/StudioProperties.tsx` | Painel de propriedades do node selecionado |
| `src/app/create/studio/StudioSelect.tsx` | Select customizado para nodes |
| `src/app/create/studio/StudioNavbar.tsx` | Navbar lateral esquerda com tabs |

### Services
| Arquivo | Descrição |
|---|---|
| `src/services/referenceAnalyzer.ts` | Analisa referência com Gemini 2.5 Flash → JSON estruturado |
| `src/services/generateService.ts` | Service de geração (chamada Supabase Edge Function) |
| `src/services/adminService.ts` | Service de administração |
| `src/services/supabaseClient.ts` | Cliente Supabase |

### Backend (Edge Functions)
| Arquivo | Descrição |
|---|---|
| `supabase/functions/generate-image/index.ts` | Orquestrador principal |
| `supabase/functions/generate-image/types.ts` | Tipos do backend |
| `supabase/functions/generate-image/providers/registry.ts` | Roteamento de providers |
| `supabase/functions/generate-image/providers/provider.ts` | Interface base de provider |
| `supabase/functions/generate-image/providers/gemini-image.ts` | Provider Gemini (primário strict) |
| `supabase/functions/generate-image/providers/replicateFluxKontext.ts` | Provider Replicate Kontext (fallback strict) |
| `supabase/functions/generate-image/providers/replicate-flux.ts` | Provider Replicate (text-to-image) |
| `supabase/functions/generate-image/providers/vertex-imagen.ts` | Provider Vertex (legacy, não usar) |
| `supabase/functions/generate-image/preprocess/subject.ts` | Preprocess: alpha, upscale, padding, SHA-256 |
| `supabase/functions/generate-image/smartPromptCompiler.ts` | Compilador de prompt inteligente |
| `supabase/functions/generate-image/visionAnalysis.ts` | Análise de visão |
| `supabase/functions/generate-image/utils/base64.ts` | Utilitários base64 |

### Editor (Wizard) — interface alternativa
| Arquivo | Descrição |
|---|---|
| `src/features/editor/EditorPage.tsx` | Editor principal (wizard mode) |
| `src/features/editor/design/` | Subpasta de design do editor |
| `src/features/editor/engine/` | Subpasta do motor do editor (bgRemoval, textRenderer, etc.) |
| `src/features/editor/wizard/` | Subpasta do wizard (WizardLayout, Steps, PreviewCanvas) |
| `src/types/spec/index.ts` | Tipos core do editor (source of truth) |
| `src/types/preset.ts` | Tipos universais: ReferenceAnalysis, VisualDNA, CreatygnPreset, etc. |

### i18n
| Arquivo | Descrição |
|---|---|
| `src/i18n/index.ts` | Provider e hook `useI18n()` → retorna `{ t, lang, setLang }` |
| `src/i18n/locales/en.json` | Traduções EN |
| `src/i18n/locales/pt-BR.json` | Traduções PT-BR |
| `src/i18n/locales/es.json` | Traduções ES |

---

## STUDIO — NODES DISPONÍVEIS (15 tipos)

### Input (4)
| ID | Label | Descrição |
|---|---|---|
| `brand_input` | Brand Input | Nome da marca + descrição |
| `image_upload` | Image Upload | Upload de subject (foto do produto) |
| `reference_upload` | Referência Visual | Upload de imagem de referência |
| `text_input` | Text Prompt | Texto livre OU campos múltiplos (headline, price, cta, contact) |

### AI (4)
| ID | Label | Provider | Custo |
|---|---|---|---|
| `reference_analyzer` | Analisar Referência | Gemini 2.5 Flash | 2 cr |
| `scene_gen` | Scene Gen | Gemini (delega p/ image_gen) | 3 cr |
| `image_gen` | Image Gen | Replicate/Gemini | 5 cr |
| `background_gen` | Gerar Fundo | Flux/Gemini | 4 cr |

### Processing (3)
| ID | Label | Descrição |
|---|---|---|
| `prompt_builder` | Prompt Builder | Compila prompt a partir de inputs |
| `bg_removal` | BG Removal | Remove fundo (ONNX/API) → output type `subject_cutout` |
| `compositor` | Compositor | Compõe subject recortado sobre fundo (Canvas API) |

### Composition (3)
| ID | Label | Descrição |
|---|---|---|
| `text_overlay` | Overlay de Texto | Renderiza textos via Canvas 2D sobre imagem |
| `typography` | Typography | Tipografia (legacy — pass-through, não implementado) |
| `color_grade` | Color Grade | Gradação de cor (legacy — pass-through, não implementado) |

### Output (1)
| ID | Label | Descrição |
|---|---|---|
| `export` | Export | Exporta imagem final (PNG/JPG/WebP) |

---

## STUDIO — FLUXOS PRESET

### styled-photo (Foto no Estilo) — 5 cr
6 nodes: reference_upload → reference_analyzer → prompt_builder → image_gen → export
(+ image_upload conectado ao analyzer e image_gen)

### creative-banner (Banner Criativo) — 8 cr
9 nodes: ref → analyze, sub → bgrem, analyze → bggen, bgrem + bggen → compose → overlay → export
(+ text_input com campos headline/price/cta/contact)

### simple-gen (Geração Simples) — 3 cr
5 nodes: brand_input + image_upload + text_input → prompt_builder → image_gen

---

## STUDIO — DETALHES DE IMPLEMENTAÇÃO

### Estado do StudioPage (StudioPage.tsx)
```typescript
// State principal
const [nodes, setNodes] = useState<StudioNode[]>(DEFAULT_NODES);           // [] vazio
const [connections, setConnections] = useState<Connection[]>(DEFAULT_CONNECTIONS); // [] vazio
const [execStates, setExecStates] = useState<Record<string, ExecState>>({});
const [nodeOutputs, setNodeOutputs] = useState<NodeOutputs>({});
const [showFlowSelector, setShowFlowSelector] = useState(true);            // modal ao abrir
```

### Cache Invalidation (handleNodeDataChange)
Quando um node de input muda seus dados (nova imagem, novo texto), **todos os nodes downstream** são invalidados automaticamente:
- BFS forward pelas conexões a partir do node alterado
- `nodeOutputs` e `execStates` são limpos para o node + todos dependentes
- Nodes invalidados voltam ao estado `idle` (sem check verde)
- Implementado em: `StudioPage.tsx` → `handleNodeDataChange`

```typescript
// Padrão: field_* keys atualizam node.data.fields nested
if (key.startsWith('field_')) {
  const fieldName = key.slice(6); // 'field_headline' → 'headline'
  const fields = { ...(n.data.fields || {}), [fieldName]: value };
  return { ...n, data: { ...n.data, fields } };
}
// Numeric keys são convertidos para number
const numericKeys = ['subjectScale', 'shadowBlur', 'shadowOpacity', 'width', 'height'];
```

### Flow Selector (FlowSelector.tsx)
- Modal aparece ao abrir o Studio (DEFAULT_NODES é vazio → `showFlowSelector: true`)
- Cards com ícone Lucide, nome (i18n via `lang`), descrição, créditos
- Hover com borda na cor do fluxo + background sutil
- Opção "Fluxo Vazio" (dashed border) para canvas limpo
- "Novo Fluxo" no menu top → `setShowFlowSelector(true)` (reabre o selector, SEM confirm dialog)
- PresetFlow interface inclui: `id, name, nameEn, nameEs, description, descriptionEn, descriptionEs, icon, color, credits`
- i18n usa `lang` do hook `useI18n()` (não `locale`)

### Execução (engine.ts)
- `getExecutionOrder()` → topological sort via BFS (inDegree counting)
- `prePopulateInputOutputs()` → pré-popula outputs dos input nodes ANTES da execução
- `collectInputs()` → coleta inputs de todos os upstream conectados, mergeando via Object.assign
- `findUpstreamByType()` → busca valor com `type` específico em `_allUpstream` array
- Nodes críticos que param o fluxo: `image_gen`, `background_gen`, `compositor`
- Nodes não-críticos (falham silenciosamente): `reference_analyzer` (fallback genérico)

### Output Types do Engine (convenção interna)
Cada node retorna um objeto com `type` que identifica a natureza do output:
```
image_upload      → { image, type: 'subject' }
reference_upload  → { image, type: 'reference' }
text_input        → { text, [fields], type: 'text' }        // fields se banner mode
reference_analyzer→ { analysis, prompt, type: 'analysis' }
prompt_builder    → { prompt, analysis, type: 'prompt' }
image_gen         → { image, type: 'generated' }
bg_removal        → { image, type: 'subject_cutout' }       // NÃO 'subject'
background_gen    → { backgroundImage, image, type: 'background' }
compositor        → { image, type: 'composed', width, height }
text_overlay      → { image, type: 'final' }
export            → { image, finalImage, type: 'export' }
```
**IMPORTANTE:** `bg_removal` retorna `type: 'subject_cutout'` (não `'subject'`). O `compositor` busca esse type via `findUpstreamByType(inputs, 'subject_cutout')`.

### text_input com Fields (Banner Mode)
- Quando `node.data.fields` é um objeto `{ headline, price, cta, contact }`, renderiza 4 inputs separados
- UI usa `onDataChange(node.id, 'field_headline', value)` → handler extrai `field_` prefix
- Engine: `node.data.fields && typeof node.data.fields === 'object'` → retorna `{ fields, type: 'text' }`

### StudioNodePanel — Categorias (NODE_GROUPS)
```
FREQUENTLY USED  → text_input, image_upload, reference_upload, prompt_builder, image_gen
USE AI           → reference_analyzer, scene_gen, image_gen, background_gen
PROCESSING       → bg_removal, compositor, color_grade
COMPOSITION      → text_overlay, typography, prompt_builder
PROVIDE CONTEXT  → brand_input, image_upload, reference_upload, text_input
OUTPUT           → export
```

### StudioNode.tsx — Ícones importados
```typescript
import { Building2, ImagePlus, Type, Wand2, Sparkles, Scissors,
  AlignLeft, Palette, Camera, Download, Play, CheckCircle,
  Loader2, ScanEye, FileText, AlertCircle, Trash2,
  Image, Layers, LayoutTemplate } from 'lucide-react';
```
`RUN_NODES` (nodes com botão "Run"): `prompt_builder, scene_gen, image_gen, reference_analyzer, bg_removal, export, background_gen, compositor, text_overlay`

---

## PIPELINE DE IA (PROVIDERS) — STATUS ATUAL

### Reference Analyzer (frontend)
- **Modelo:** `gemini-2.5-flash` via Gemini API
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
- **responseMimeType:** `application/json` (força JSON limpo, sem markdown fences)
- **Retry:** 2 tentativas (temp 0.2 → temp 0.1, ambas com responseMimeType)
- **Fallback:** se ambas falharem (parse error OU HTTP error), retorna `buildFallbackAnalysis()` com defaults profissionais — **NÃO lança erro**
- **Fallback defaults:** center position, large size, dark gradient bg, studio lighting, bold-sans headline, #FFFFFF text
- Arquivo: `src/services/referenceAnalyzer.ts`

### Histórico de modelos testados (Reference Analyzer)
```
gemini-2.5-pro                → JSON inválido (retornava markdown fences, thinking tokens)
gemini-2.0-flash              → 404 (modelo não existe sem suffix)
gemini-2.0-flash-001          → 404 (descontinuado, "no longer available to new users")
gemini-2.5-flash              → ✅ FUNCIONA (estável, rápido, obedece responseMimeType)
```

### Strict Identity ON (Ecom Banner e Photoshoot)
1. **Primário:** Gemini (`gemini-2.0-flash-preview-image-generation`) via Gemini API — modo IMG2IMG
2. **Fallback:** FLUX.1 Kontext Pro via Replicate (`replicateFluxKontext.ts`)
3. **Erro se ambos falharem:** `strict_identity_provider_unavailable`

### Strict Identity OFF (Social Post text-to-image)
- **Provider:** Replicate FLUX (`replicate-flux.ts`) via text-to-image

### Background Gen (Studio — engine.ts case 'background_gen')
- Usa o mesmo endpoint `generate-image` com `strictIdentity: false`
- Prompt inclui instrução explícita: "ONLY background, NO product, NO text"
- `negativePrompt`: "product, person, people, food, text, typography, watermark, logo, letters, words, main subject"
- `module: 'sys-img-background'`
- **Fallback se não recebeu análise:** prompt genérico profissional ("Professional product photography background. Clean, modern studio environment...")

### Preprocess (antes de chamar qualquer provider no modo strict)
- Detectar alpha/transparência → compor fundo neutro (`#111827`)
- Upscale: minSide >= 1024px
- Padding e centralização (12% por padrão)
- SHA-256 hash determinístico
- Fallback: se `PREPROCESS_DECODE_ENABLED != "true"`, passa original sem transformar

### Variáveis de ambiente necessárias
```
# Frontend (.env)
VITE_GEMINI_API_KEY=           # Google AI Studio (para reference analyzer)
VITE_SUPABASE_URL=             # Supabase project URL
VITE_SUPABASE_ANON_KEY=        # Supabase anon key

# Backend (Supabase Edge Function secrets)
GEMINI_API_KEY=                # Google AI Studio (para geração de imagem)
REPLICATE_API_TOKEN=           # Replicate (para Flux/Kontext)
SUPABASE_URL=                  # Auto-set pelo Supabase
SUPABASE_SERVICE_ROLE_KEY=     # Auto-set pelo Supabase
GENS_BUCKET=generations-private # Bucket de storage (default)
PREPROCESS_DECODE_ENABLED=true  # Ativa pixel-level preprocess (opcional)
```

### Response do backend inclui meta/debug
```json
{
  "generationId": "...",
  "signedUrl": "...",
  "provider": "gemini-2.0-flash-preview-image-generation",
  "meta": {
    "providerName": "gemini-2.0-flash-preview-image-generation | replicate-flux-kontext-pro",
    "modeUsed": "strict_identity | text_to_image",
    "strictIdentity": true,
    "identityStrength": 90,
    "styleStrength": 45,
    "payloadKind": "gemini_img2img_strict | replicate_kontext",
    "gemini_failed_then_replicate": false,
    "preprocess": {
      "flags": { "alphaComposited": true, "upscaled": true, "padded": true },
      "hash": "sha256...",
      "width": 1248,
      "height": 1248
    }
  }
}
```

---

## FILOSOFIA DO PRODUTO (NÃO NEGOCIÁVEL)

1. **O usuário nunca vê prompt.** Ele preenche campos: headline, estilo, intensidade, subject. O sistema compila o prompt internamente.
2. **Texto perfeito é obrigação.** Tipografia renderizada via Canvas 2D (text_overlay node) — fontes reais, shadow, wrap. Nunca depender da IA para tipografia.
3. **Efeitos visuais pertencem à IA.** Bokeh, névoa, vidro, neon, sombra — são instruções de prompt, gerados pela IA como parte da imagem. Nunca CSS compostos por cima.
4. **Subject real é sagrado.** No fluxo Banner Criativo, o produto do user é recortado e composto sobre o fundo — nunca regenerado pela IA.
5. **Resultado na primeira tentativa.** O usuário clica em "Executar" e recebe a imagem pronta. Sem iteração manual obrigatória.
6. **Qualidade acima de velocidade.** Latência maior é aceitável se o resultado for nível agência.
7. **Leigo consegue usar.** Interface simples, campos claros, presets pré-moldados.

---

## REGRAS DE I18N (PERMANENTES)

### O que PODE ser traduzido
- Labels, headings, placeholders, pills/chips, labels de opções em select, texto de botões, empty states, helper text

### O que NUNCA pode ser traduzido/alterado
- `value` de opções
- enums, spec fields, builder fields
- IDs, module names, internal identifiers
- logic strings, engine compile strings

### Padrão obrigatório para options com label
```typescript
{
  value: "eye_level",          // NUNCA muda
  label: "Eye level",          // fallback
  labelKey: "editor.preset.angle.eye_level"  // i18n key
}

// No JSX:
(option.labelKey ? t(option.labelKey) : option.label) || option.label
```

### Hook i18n
```typescript
// src/i18n/index.ts exporta:
useI18n(): { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }
// ATENÇÃO: é `lang`, NÃO `locale`. Tipo Lang = 'en' | 'pt-BR' | 'es'
```

### Namespaces de keys
```
editor.*          editor.preset.*       editor.actions.*
editor.format.*   editor.debug.*        editor.generic.*
social.*          photoshoot.*          ecom.*          ambient.*
studio.*          studio.nav.*          studio.panel.*
studio.node.*     studio.flow_selector.*
studio.props.*    studio.credits.*
```

### Regra de ouro
Toda feature nova: primeiro cria a estrutura interna → depois aplica i18n → depois UX → depois otimiza.

---

## ESTÁGIOS DO ROADMAP

```
STAGE 0 — Mapping           ✅ CONCLUÍDO  (CLAUDE.md criado, arquitetura mapeada)
STAGE 1 — Strict Providers   ✅ CONCLUÍDO  (Gemini IMG2IMG + Replicate Kontext Pro + fallback)
STAGE 2 — Preprocess         ✅ CONCLUÍDO  (alpha, upscale 1024px, padding 12%, SHA-256 hash)
STAGE 3 — Renderer           ⏸ SUSPENSO   (HTML/CSS overlay substituído por IA-first)
STAGE 4 — Editor UX          ✅ CONCLUÍDO  (wizard 3 passos, presets, moods, props)
STAGE 4b — Engine Quality    ✅ CONCLUÍDO  (prompt 5-block, moods detalhados, Gemini model fix)
STAGE 5 — Studio             🔧 EM CURSO   (node editor ComfyUI-style — ver detalhes abaixo)
STAGE 6 — MVP Polish         ❌ PENDENTE   (landing page, billing, testes)
```

### STATUS DO STAGE 5 (Studio)

**Concluído:**
- Node editor com canvas infinito, pan/zoom, conexões SVG
- 15 tipos de node com UI completa (13 implementados, 2 pass-through: typography, color_grade)
- Motor de execução real (topological sort, executeNode, executeFlow)
- 3 fluxos preset: styled-photo, creative-banner, simple-gen
- Flow Selector modal ao abrir Studio (sem confirm dialog)
- Reference Analyzer com Gemini 2.5 Flash + JSON mode + fallback genérico
- Background Gen com prompt de fundo isolado + fallback sem análise
- Compositor (Canvas API) — subject real sobre fundo gerado com shadow/scale/position
- Text Overlay (Canvas 2D) — headline com word-wrap, price badge, CTA
- BG Removal (ONNX/API) → output type `subject_cutout`
- Cache invalidation — BFS forward, nodes downstream limpos quando input muda
- text_input com fields mode (banner: headline/price/cta/contact)
- StudioNodePanel com 6 categorias
- i18n completo (en, pt-BR, es) incluindo flow selector, node placeholders, panel groups

**Pendente / próximos passos:**
- Testar fluxo completo end-to-end com imagens reais
- Chat IA para montagem automática de fluxos
- Salvar/carregar fluxos do user (Supabase)
- Templates de fluxo mais variados
- Melhorar compositor: múltiplas posições, rotação, blending modes
- Text overlay: mais fontes, estilos, posições configuráveis
- Implementar typography e color_grade (hoje são pass-through)

---

## HISTÓRICO DE BUGS RESOLVIDOS E DECISÕES (Março 2026)

### 1. Gemini model IDs — tentativa e erro
- `gemini-2.5-pro` → retornava JSON inválido (thinking tokens, markdown fences), descartado
- `gemini-2.0-flash` (sem suffix) → 404 Not Found, o modelo precisa do suffix `-001`
- `gemini-3-pro-image-preview` → modelo inexistente no backend, corrigido para `gemini-2.0-flash-preview-image-generation`
- **Decisão:** sempre usar IDs exatos verificados: `gemini-2.0-flash-001` (análise), `gemini-2.0-flash-preview-image-generation` (geração)

### 2. responseMimeType — solução definitiva para JSON
- Mesmo com prompt dizendo "return ONLY JSON", o Gemini 2.5 Pro retornava markdown fences
- `generationConfig.responseMimeType: "application/json"` forçou JSON limpo em 100% dos casos
- Aplicado em ambas as tentativas (primeira temp 0.2, retry temp 0.1)

### 3. Fallback sem análise — fluxo não pode parar
- Se o Gemini falhar totalmente (HTTP error + parse error), `buildFallbackAnalysis()` retorna defaults profissionais
- O fluxo continua: background_gen usa prompt genérico, compositor compõe normalmente, text_overlay renderiza textos
- reference_analyzer é non-critical no engine (falha não para o fluxo)

### 4. Cache de outputs não era invalidado
- **Bug:** user trocava imagem no Image Upload, mas nodes downstream continuavam usando output antigo
- **Fix:** BFS forward em `handleNodeDataChange` — percorre conexões, limpa `nodeOutputs` e `execStates` de todos os dependentes
- Nodes invalidados voltam para `idle` (sem check verde), indicando re-execução necessária

### 5. bg_removal output type conflito
- Originalmente retornava `type: 'subject'`, igual ao `image_upload`
- Compositor não conseguia distinguir entre subject original e subject recortado
- **Fix:** bg_removal agora retorna `type: 'subject_cutout'`, compositor busca via `findUpstreamByType(inputs, 'subject_cutout')`

### 6. Fluxo 'asset-generator' renomeado
- Nome original (`asset-generator`) era genérico demais
- Renomeado para `styled-photo` com i18n names (PT: "Foto no Estilo", EN: "Styled Photo", ES: "Foto con Estilo")
- PresetFlow interface expandida com `id, nameEn, nameEs, descriptionEn, descriptionEs, icon, color, credits`

### 7. DEFAULT_NODES era pré-populado
- Originalmente `DEFAULT_NODES = PRESET_FLOWS['asset-generator'].nodes` — Studio já abria com um fluxo
- Mudado para `DEFAULT_NODES = []` — Studio abre vazio e mostra FlowSelector modal
- `handleNewFlow` agora reabre o selector em vez de fazer `window.confirm` + carregar flow hardcoded

### 8. Decisão IA-first (Stage 3 suspenso)
- HTML/CSS overlay por cima da imagem gerada produzia camadas desconexas (texto "colado" sem integração visual)
- **Decisão:** tipografia no Editor é gerada pela IA como parte da imagem (via prompt); no Studio, usa Canvas 2D (text_overlay node)
- Stage 3 (HTML/CSS renderer com Headless Chromium) foi **permanentemente suspenso**

---

## REGRAS DE EXECUÇÃO PARA O CLAUDE CODE

### Tamanho das tasks (CRÍTICO)
- Não: prompt que mexe em 10 arquivos diferentes
- Não: prompt microscópico que altera 1 string
- Sim: 1 objetivo claro, máximo 2-3 arquivos, 1 bloco lógico

### Regras de diff
- Sempre gerar patch/diff
- Não renomear tipos, rotas ou enums
- Não inventar novos formatos
- Não importar dependências novas sem autorização
- Não mexer em arquivos fora do escopo declarado

### Checklist antes de qualquer commit
- [ ] `npm run build` passa sem erros
- [ ] Nenhum texto hardcoded em JSX
- [ ] Nenhum `value` de option foi alterado
- [ ] TypeScript compila sem erros
- [ ] JSON de i18n válido (en + pt-BR + es)
- [ ] Nenhum console.error novo

### Separação obrigatória
Se a task mexer em `spec`, `builder`, `engine` ou `compilePrompt` → **NÃO é task de i18n**. Separar completamente.

---

## TEMPLATE DE PROMPT PADRÃO (use sempre)

```
You are working on Creatyng — a premium AI visual creation SaaS.

CURRENT STAGE: [STAGE X]
GOAL: [1 sentence describing the goal]
FILES ALLOWED TO MODIFY: [list max 2-3 files]

RULES:
- Minimal diff only
- Do NOT change enums, IDs, spec fields, internal values
- Do NOT rename routes or types
- Do NOT add new dependencies without asking
- All new user-visible strings must have i18n keys in en.json, pt-BR.json, es.json

VALIDATION:
- npm run build must pass
- No TypeScript errors
- No hardcoded UI strings
- JSON files must be valid

DELIVERABLE: Return diff/patch only. Do not explain what you did — show the code.
```

---

## ERROS COMUNS — NUNCA REPETIR

- Usar `src/features/auth/editor/EditorPage.tsx` como fonte principal (é só re-export)
- Misturar `src/types/index.ts` com `src/types/spec/index.ts` como source of truth
- Chamar IA diretamente sem passar pelo service/engine (wrapper obrigatório)
- Rodar Headless Chromium dentro de Supabase Edge (Deno não suporta)
- Deixar texto de UI hardcoded em JSX
- Alterar `value` de qualquer option/enum
- Compor overlays CSS por cima da imagem gerada (efeitos visuais pertencem ao prompt/IA)
- Usar modelos Gemini inexistentes (sempre verificar: `gemini-2.5-flash` para análise, `gemini-2.0-flash-preview-image-generation` para geração)
- Implementar features de STAGE futuro antes de resolver bugs do STAGE atual
- Não limpar cache de outputs quando inputs mudam (sempre invalidar downstream)
- Usar `locale` do useI18n (é `lang`, não `locale`)
- bg_removal retornar `type: 'subject'` (é `'subject_cutout'` — compositor depende disso)
- DEFAULT_NODES com nodes pré-populados (deve ser `[]` para mostrar FlowSelector)
- handleNewFlow com `window.confirm` (deve reabrir FlowSelector)

---

## REGRA DE OURO FINAL

> Se você (Claude Code) não tiver certeza do escopo, **pergunte antes de implementar**.
> Nunca assuma. Nunca expanda o escopo sozinho. Uma task por vez.
> Sempre declare o STAGE atual e o próximo diff antes de qualquer execução.
