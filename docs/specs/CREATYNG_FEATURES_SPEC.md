# CREATYNG — SPEC DE EXECUÇÃO: ROADMAP COMPLETO DE FEATURES

> Execute nessa ordem. Uma feature por vez. Não misture diffs de features diferentes.
> Leia junto com CLAUDE.md, CREATYNG_MOTOR_PLAN.md e CREATYNG_ISSUES.md.
>
> FASE 1 (MVP): Features 9, 13, 16
> FASE 2 (Polimento): Features 1, 2, 3, 4, 5, 7, 8
> FASE 3 (Expansão): Features 10, 12, 14, 15, 17, 18

---

# FEATURE 9 — WIZARD DE 3 PASSOS

## Objetivo
Substituir o formulário longo atual por um wizard de 3 passos ocupando a tela inteira.
Sem scroll. Sem sobrecarga. O usuário foca em uma decisão por vez.

## Fluxo completo

```
PASSO 1 — SUBJECT
  ↓ upload da foto/produto/logo
  ↓ escolha de enquadramento (rosto, meio corpo, corpo inteiro, produto)
  ↓ escolha de ângulo (frontal, low angle, high angle)
  ↓ [ PRÓXIMO → ]

PASSO 2 — ESTILO
  ↓ preset base (Drama | Clean | Dark | Editorial | Neon)
  ↓ atmosfera (Fog | Particles | Glass Shards | Rain | Nenhum)
  ↓ iluminação (Rim Purple | Rim Blue | Natural | Hard Studio | Nenhum)
  ↓ paleta de cores (primária + secundária + neutra)
  ↓ [ ← VOLTAR ] [ PRÓXIMO → ]

PASSO 3 — TEXTOS
  ↓ headline (campo grande, obrigatório)
  ↓ subheadline (campo menor, opcional)
  ↓ CTA (campo pequeno, opcional)
  ↓ fonte principal (seletor com preview)
  ↓ fonte secundária (seletor com preview, opcional)
  ↓ posição do texto (TOP | BOTTOM | LEFT | RIGHT | OVER)
  ↓ formato de saída (1:1 | 9:16 | 16:9 | 4:5)
  ↓ [ ← VOLTAR ] [ ✦ GERAR CRIATIVO ]
```

## Layout de cada passo

```
┌─────────────────────────────────────────────────────┐
│  ● ─── ○ ─── ○          [passo 1 de 3]  [Modo Rápido ⇄ Avançado]  │
│                                                     │
│         CONTEÚDO DO PASSO (ocupa 80% da tela)       │
│                                                     │
│  [← Voltar]              [Próximo →] ou [✦ Gerar]   │
└─────────────────────────────────────────────────────┘
```

- Indicador de progresso no topo: 3 pontos conectados por linha
- Ponto ativo: preenchido e com cor primária
- Pontos futuros: vazios
- Navegação por teclado: Tab entre campos, Enter para avançar, Esc para voltar

## Modo Rápido vs Avançado

**Modo Rápido (default):**
- Passo 1: só upload
- Passo 2: só preset base (5 cards visuais com preview)
- Passo 3: só headline + CTA + formato
- Total: ~8 campos, ~30 segundos

**Modo Avançado:**
- Todos os campos de todos os passos
- Toggle no canto superior direito
- Estado persiste na sessão (se foi avançado, continua avançado)

## Cards de preset (Passo 2)

Não são dropdowns. São cards visuais clicáveis:

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ [img]    │  │ [img]    │  │ [img]    │  │ [img]    │  │ [img]    │
│          │  │          │  │          │  │          │  │          │
│  DRAMA   │  │  CLEAN   │  │   DARK   │  │EDITORIAL │  │   NEON   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

- Cada card tem uma mini imagem de exemplo gerada com aquele preset
- Hover: borda destacada + label descritivo aparece
- Selecionado: borda cor primária + checkmark

## Seletor de fonte (Passo 3)

```
Fonte Principal:
┌─────────────────────────────────┐
│ Anton                      ▼    │
│ ──────────────────────────────  │
│ EU QUERIA SER FORTE             │  ← preview ao vivo com o texto do usuário
└─────────────────────────────────┘

Fontes sugeridas por preset:
[Anton] [Bebas Neue] [Oswald] [Black Han Sans] [+ Ver todas]
```

## Posição do texto — visualização no canvas

Ao selecionar posição, o canvas de preview mostra overlay indicando a zona:

```
TOP:     ████████████   (30% superior escurecido)
         subject aqui

BOTTOM:  subject aqui
         ████████████   (30% inferior escurecido)

LEFT:    ████  subject
         zona  aqui
         texto

RIGHT:   subject  ████
         aqui     zona
                  texto
```

## Diffs de implementação

### DIFF 9.1 — Estrutura do Wizard
- Criar componente `WizardLayout` com stepper + navegação
- Criar `WizardStep1Subject`, `WizardStep2Style`, `WizardStep3Text`
- Estado global do wizard em `useWizardStore` (Zustand ou Context)
- Não conectar ao motor ainda — só estrutura e navegação

### DIFF 9.2 — Cards de preset visuais
- Criar `PresetCard` com imagem de exemplo + label
- Grupos de categoria (Base | Atmosfera | Iluminação) com radio exclusivo
- Opção "Nenhum" em Atmosfera e Iluminação

### DIFF 9.3 — Seletor de fonte com preview
- Integrar Google Fonts API (carregar só quando seletor abre)
- Preview ao vivo com o texto que o usuário digitou no headline
- Lista de fontes sugeridas por preset ativo

### DIFF 9.4 — Seletor de posição com canvas preview
- Overlay visual no canvas indicando zona de texto
- Instrução de composição muda no payload conforme posição escolhida

### DIFF 9.5 — Modo Rápido / Avançado
- Toggle que colapsa/expande campos por passo
- Estado persistido em localStorage
- Modo Rápido é o default para novos usuários

---

# FEATURE 13 — EXPORT MULTI-FORMATO

## Objetivo
Ao exportar, gerar todos os formatos necessários de uma vez sem regerar a IA.
A imagem base (gerada pela IA) fica cacheada. O renderer reposiciona e recorta para cada formato.

## Formatos suportados

```typescript
const EXPORT_FORMATS = [
  // Social Media
  { id: 'instagram_feed',   label: 'Instagram Feed',    ratio: '1:1',  w: 1080, h: 1080 },
  { id: 'instagram_story',  label: 'Instagram Stories', ratio: '9:16', w: 1080, h: 1920 },
  { id: 'instagram_portrait', label: 'Instagram Portrait', ratio: '4:5', w: 1080, h: 1350 },
  { id: 'tiktok',           label: 'TikTok',            ratio: '9:16', w: 1080, h: 1920 },
  { id: 'facebook_feed',    label: 'Facebook Feed',     ratio: '1:1',  w: 1080, h: 1080 },
  { id: 'facebook_cover',   label: 'Facebook Cover',    ratio: '16:9', w: 1640, h: 924  },
  { id: 'youtube_thumb',    label: 'YouTube Thumbnail', ratio: '16:9', w: 1280, h: 720  },
  { id: 'twitter',          label: 'Twitter/X Post',    ratio: '16:9', w: 1600, h: 900  },
  // E-commerce
  { id: 'ecom_banner',      label: 'Banner E-commerce', ratio: '16:9', w: 1920, h: 1080 },
  { id: 'ecom_square',      label: 'Produto Quadrado',  ratio: '1:1',  w: 1200, h: 1200 },
  // Ads
  { id: 'google_display',   label: 'Google Display',    ratio: '16:9', w: 1200, h: 628  },
  { id: 'meta_ads',         label: 'Meta Ads',          ratio: '1.91:1', w: 1200, h: 628 },
]
```

## UI do modal de export

```
┌─────────────────────────────────────────────────┐
│  ✦ Exportar Criativo                        [X]  │
│                                                  │
│  [Preview da imagem]                            │
│                                                  │
│  SOCIAL MEDIA                                   │
│  ☑ Instagram Feed (1:1)    ☑ Stories (9:16)     │
│  ☐ TikTok (9:16)           ☐ Facebook Feed      │
│                                                  │
│  E-COMMERCE                                     │
│  ☐ Banner (16:9)           ☐ Produto (1:1)      │
│                                                  │
│  ADS                                            │
│  ☐ Meta Ads                ☐ Google Display     │
│                                                  │
│  Qualidade:  ○ 2K (recomendado)  ○ 4K (Pro)     │
│  Formato:    ○ PNG   ○ JPG (85%)                 │
│                                                  │
│  [Selecionar todos]    [✦ Exportar selecionados] │
└─────────────────────────────────────────────────┘
```

## Lógica de recomposição por formato

Ao mudar proporção, o renderer:
1. Usa a imagem base cacheada (não rechama a IA)
2. Recalcula posição e tamanho do subject (crop inteligente mantendo o rosto/produto visível)
3. Reposiciona o bloco de texto conforme a nova proporção
4. Ajusta tamanhos de fonte proporcionalmente
5. Exporta PNG na resolução alvo

```typescript
interface RecompositionRules {
  // Para cada formato, de onde recortar da imagem original
  cropStrategy: 'center' | 'face-aware' | 'product-aware'
  // Onde reposicionar o texto
  textPosition: 'maintain' | 'reflow'
  // Escala da fonte relativa à altura do canvas
  fontScaleFactor: number
}
```

## Preview antes de exportar

- Modal mostra preview miniatura de cada formato selecionado
- Usuário pode ver como ficou antes de baixar
- Se algum formato ficou ruim, pode desmarcar

## Diffs de implementação

### DIFF 13.1 — Modal de export com seleção de formatos
- Criar `ExportModal` com grid de checkboxes por categoria
- Estado: quais formatos estão selecionados
- Botão exportar desabilitado se nenhum selecionado

### DIFF 13.2 — Cache da imagem base
- Após geração, salvar imageBase64 no estado da sessão
- Identificar por hash (não regerar se mesma base)
- Limpar cache ao clicar "Nova geração"

### DIFF 13.3 — Renderer multi-formato
- Função `recomposeForFormat(imageBase64, textConfig, targetFormat)`
- Crop inteligente: preservar região central ou face detectada
- Reflow de texto: ajustar posição e tamanho para novo canvas

### DIFF 13.4 — Preview miniatura por formato
- Grid de previews no modal antes de confirmar export
- Renderizar cada formato selecionado em canvas pequeno
- Spinner individual por formato enquanto renderiza

### DIFF 13.5 — Download em ZIP
- Se mais de 1 formato selecionado: baixar como ZIP
- Nome dos arquivos: `creatyng_[nome]_[formato]_[data].png`
- Se só 1 formato: baixar direto sem ZIP

---

# FEATURE 16 — BRAND KIT + AVATAR PESSOAL

## Objetivo
Brand Kit: usuário salva identidade visual da marca (logo, cores, fontes, estilo).
Avatar: usuário treina um avatar pessoal a partir de fotos próprias — disponível para usar em qualquer composição futura.

**Plano Pago apenas.** Free vê o card bloqueado com lock icon e CTA de upgrade.

## Estrutura do Brand Kit

```typescript
interface BrandKit {
  id: string
  name: string                    // "Minha Marca" ou nome do cliente
  logo?: string                   // base64 ou URL do Supabase Storage
  colors: {
    primary: string               // hex
    secondary: string             // hex
    neutral: string               // hex
    extras: string[]              // até 5 cores extras
  }
  fonts: {
    headline: string              // Google Font name
    body: string                  // Google Font name
  }
  style: {
    preset: 'drama' | 'clean' | 'dark' | 'editorial' | 'neon'
    atmosphere: string
    lighting: string
  }
  avatar?: BrandAvatar            // avatar pessoal vinculado
  createdAt: string
  updatedAt: string
}
```

## UI do Brand Kit

```
┌─────────────────────────────────────────────────┐
│  Meus Brand Kits                    [+ Novo Kit] │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ [logo]   │  │ [logo]   │  │      +       │   │
│  │ Marca A  │  │ Marca B  │  │  Novo Brand  │   │
│  │ ● ● ●   │  │ ● ● ●   │  │     Kit      │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────┘
```

Ao abrir um Brand Kit:

```
┌──────────────────────────────────────────────────────┐
│  ✏ Marca A                                    [Salvar]│
│                                                      │
│  LOGO          [upload logo]  ou arrastar aqui        │
│                                                      │
│  CORES         ● Primária  ● Secundária  ● Neutra     │
│                [+ Adicionar cor]                     │
│                                                      │
│  FONTES        Headline: [Anton          ▼]          │
│                Corpo:    [Inter          ▼]          │
│                                                      │
│  ESTILO PADRÃO                                       │
│  [Drama] [Clean] [Dark] [Editorial] [Neon]           │
│                                                      │
│  AVATAR VINCULADO                                    │
│  [Foto do avatar]  Elder Silva                       │
│  [Trocar avatar]  [Ver composições com este avatar]  │
│                                                      │
│  [Usar este Kit como padrão]                        │
└──────────────────────────────────────────────────────┘
```

## Avatar Pessoal — o diferencial

### O que é
O usuário envia 5-10 fotos suas (ou do cliente). O sistema cria um "perfil visual" — um conjunto de referências que o motor usa para preservar a identidade da pessoa em qualquer composição nova.

Não é fine-tuning do modelo. É um conjunto de reference images salvas e passadas ao provider como style+identity references no modo img2img.

### Fluxo de criação do Avatar

```
PASSO 1 — FOTOS DE REFERÊNCIA
  "Envie entre 5 e 10 fotos suas para criar seu Avatar"
  Requisitos mostrados visualmente:
  ✓ Rosto visível e nítido
  ✓ Boa iluminação
  ✓ Ângulos variados (frontal, 3/4, perfil)
  ✗ Não usar fotos em grupo
  ✗ Não usar fotos com óculos escuros

PASSO 2 — NOME E DESCRIÇÃO
  Nome: [Elder Silva              ]
  Descrição: [Homem, 30 anos, barba, pele morena...] (auto-preenchido por IA)

PASSO 3 — PROCESSAMENTO
  [barra de progresso]
  "Analisando suas fotos..."
  "Criando perfil de identidade..."
  "Avatar pronto!"

RESULTADO
  [Grade com 4 previews gerados com o avatar em estilos diferentes]
  "Seu Avatar está pronto. Use em qualquer composição."
```

### Como o Avatar funciona tecnicamente

```typescript
interface BrandAvatar {
  id: string
  name: string
  description: string             // gerado por IA ao analisar as fotos
  referenceImages: string[]       // URLs das fotos no Supabase Storage (5-10 fotos)
  bestReference: string           // URL da foto de melhor qualidade (selecionada automaticamente)
  identityProfile: {              // extraído por IA das fotos
    gender: string
    approximateAge: string
    hairColor: string
    skinTone: string
    distinctiveFeatures: string   // barba, óculos, etc
  }
  previewImages: string[]         // 4 previews gerados no onboarding
  createdAt: string
}
```

Ao usar o Avatar em uma composição:
1. As reference images do avatar são passadas como imagens de entrada extras
2. O prompt inclui a identity profile em linguagem natural
3. O provider usa as referências para preservar a identidade
4. Strict Identity fica ON automaticamente

### Composições com Avatar

Na tela do editor, ao ativar o Brand Kit com Avatar:

```
Subject:
  ○ Fazer upload de foto
  ● Usar meu Avatar (Elder Silva)     ← opção que aparece se tem avatar
    [foto do avatar] + [Trocar]
```

O usuário não precisa fazer upload a cada vez. O avatar já está lá.

### Galeria de composições do Avatar

Dentro do perfil do Avatar:
- Grid com todas as imagens geradas usando esse avatar
- Filtro por preset, data, feature
- Botão "Regerar com este estilo" em qualquer imagem anterior

## Múltiplos Brand Kits (Agency)

- Plano Pro: até 3 Brand Kits
- Plano Agency: ilimitado
- Caso de uso: agência com múltiplos clientes, cada um com kit separado

## Aplicação automática do Brand Kit no Wizard

Quando o usuário tem um Brand Kit ativo:
- Passo 2 do Wizard já vem pré-preenchido com as cores e estilo do kit
- Passo 3 já vem com as fontes do kit
- O usuário pode sobrescrever para aquela geração específica sem alterar o kit

## Diffs de implementação

### DIFF 16.1 — Schema no Supabase
- Tabela `brand_kits` (id, user_id, name, colors, fonts, style, created_at)
- Tabela `brand_avatars` (id, brand_kit_id, name, description, reference_images[], identity_profile, preview_images[])
- Storage bucket `brand-assets` (logos + reference images)
- RLS policies: usuário só acessa seus próprios kits

### DIFF 16.2 — CRUD de Brand Kit
- Tela de listagem dos kits
- Formulário de criação/edição
- Integração com seletor de fontes e cores já criados na Feature 9
- Salvar/carregar do Supabase

### DIFF 16.3 — Criação de Avatar (upload + processamento)
- Upload de múltiplas fotos com validação (mínimo 5, máximo 10)
- Checklist visual de requisitos
- Análise por IA: gerar `identityProfile` e `description` automaticamente
- Salvar reference images no Storage

### DIFF 16.4 — Previews do Avatar
- Após criar, gerar 4 previews automáticos (Drama, Clean, Dark, Editorial)
- Usar as reference images como subject no pipeline normal
- Salvar previews no Storage e vincular ao avatar

### DIFF 16.5 — Integração com Wizard
- Passo 1 do Wizard: opção "Usar Avatar" se usuário tem avatar criado
- Passo 2: pré-carregar cores/estilo do Brand Kit ativo
- Passo 3: pré-carregar fontes do Brand Kit ativo

### DIFF 16.6 — Galeria de composições por Avatar
- Tela dentro do perfil do avatar com grid de imagens geradas
- Filtros e opção de regerar

---

---

# ════════════════════════════════════════
# FASE 2 — POLIMENTO DO MOTOR E EXPERIÊNCIA
# (Executar após Features 9, 13 e 16 concluídas)
# ════════════════════════════════════════

---

# FEATURE 1 — STREAMING VISUAL DE GERAÇÃO

## Objetivo
Substituir o spinner genérico por um feedback visual em tempo real que comunica
que algo premium está acontecendo. O usuário acompanha cada etapa do pipeline.

## Etapas visíveis para o usuário

```
● Analisando subject...          (~2s)
● Preprocessando imagem...       (~3s)
● Gerando cena com IA...         (~15-25s)  ← maior parte do tempo
● Compondo textos e efeitos...   (~3s)
● Upscalando para 2K...          (~5s)
✓ Criativo pronto!
```

## UI

```
┌─────────────────────────────────────────┐
│                                         │
│         [preview blur da imagem         │
│          sendo revelada gradualmente]   │
│                                         │
│  ████████████████░░░░░░  68%            │
│  Gerando cena com IA...                 │
│                                         │
│  Modelo: Gemini Nano Banana Pro  ●live  │
└─────────────────────────────────────────┘
```

- Imagem de fundo começa totalmente desfocada/blur e vai revelando conforme progresso
- Barra de progresso com porcentagem real (baseada no tempo estimado por etapa)
- Nome do modelo sendo usado aparece discretamente
- Badge "● live" piscando enquanto processa
- Mensagem de curiosidade rotacionando: "Processando iluminação cinematográfica...",
  "Preservando identidade do subject...", "Aplicando grading de cor..."

## Diffs de implementação

### DIFF 1.1 — Eventos de progresso no backend
- Edge function emite server-sent events (SSE) ou atualiza campo no Supabase realtime
- Etapas: `preprocessing` | `generating` | `composing` | `upscaling` | `done` | `error`
- Cada etapa tem estimativa de duração em ms

### DIFF 1.2 — Componente GenerationProgress no frontend
- Assinar SSE ou Supabase realtime channel
- Animar barra de progresso por etapa
- Revelar imagem gradualmente usando CSS filter blur (de 20px até 0)

### DIFF 1.3 — Mensagens rotacionais de contexto
- Array de mensagens por etapa (em pt-BR, en, es via i18n)
- Rotação a cada 3s dentro da mesma etapa

---

# FEATURE 2 — 3 VARIAÇÕES AUTOMÁTICAS

## Objetivo
Ao clicar em Gerar, o motor produz 3 versões com variações sutis de composição
e lighting. O usuário escolhe a melhor — sem retry manual.

## Como funciona

Ao receber o comando de geração, o sistema faz 3 chamadas paralelas com variações:

```typescript
const VARIATIONS = [
  { label: 'A', compositionShift: 'centered',   lightingVariant: 'base'      },
  { label: 'B', compositionShift: 'left-heavy',  lightingVariant: 'warmer'   },
  { label: 'C', compositionShift: 'right-heavy', lightingVariant: 'cooler'   },
]
```

Cada variação adiciona micro-instruções diferentes ao prompt, resultando em
composições visualmente distintas mas dentro do mesmo estilo.

## UI de seleção

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│          │   │          │   │          │
│  Versão A│   │  Versão B│   │  Versão C│
│          │   │  ★ melhor│   │          │
└──────────┘   └──────────┘   └──────────┘
     [Usar]        [Usar]         [Usar]

[Regerar variações]
```

- Score automático indica qual versão o sistema considera melhor (Feature 18)
- Clicar em qualquer versão a seleciona para edição e export
- "Regerar variações" descarta as 3 e gera 3 novas

## Créditos
- Gerar 3 variações = 2 créditos (não 3) — desconto por volume
- Gerar só 1 = 1 crédito (opção no wizard para quem quer economizar)

## Diffs de implementação

### DIFF 2.1 — Chamadas paralelas no backend
- `Promise.all` com 3 chamadas ao pipeline de geração
- Variações de prompt por composition shift e lighting variant
- Retornar array de 3 imagens

### DIFF 2.2 — UI de seleção de variações
- Grid 3 colunas com as variações
- Animação de entrada escalonada (A aparece, depois B, depois C)
- Estado selecionado: borda destacada + checkmark

### DIFF 2.3 — Lógica de créditos para variações
- Desconto automático: 3 gerações = 2 créditos
- Mostrar custo antes de confirmar no wizard

---

# FEATURE 3 — MODO "REFINAR SEM REGERAR"

## Objetivo
Após gerar, o usuário pode ajustar textos, cores e fontes sem chamar a IA novamente.
A imagem base fica cacheada. Economia de créditos + fluxo muito mais rápido.

## O que pode ser refinado sem novo crédito

```
✓ Headline, subheadline, CTA
✓ Fonte principal e secundária
✓ Cor de destaque do texto
✓ Posição do texto (TOP/BOTTOM/LEFT/RIGHT)
✓ Tamanho da fonte
✓ Blend mode do texto

✗ Preset de estilo (requer nova geração)
✗ Subject (requer nova geração)
✗ Atmosfera e iluminação (requer nova geração)
```

## UI

Após geração, painel lateral divide em duas seções:

```
┌─────────────────────┐
│  REFINAMENTO        │  ← sem crédito
│  ─────────────────  │
│  Headline           │
│  Fonte              │
│  Cor destaque       │
│  Posição do texto   │
│                     │
│  NOVA GERAÇÃO       │  ← consome crédito
│  ─────────────────  │
│  Preset de estilo   │
│  Atmosfera          │
│  [✦ Regerar]        │
└─────────────────────┘
```

Alterações em "Refinamento" atualizam o resultado em tempo real (re-render HTML/CSS).
Alterações em "Nova Geração" mostram badge "Vai consumir 1 crédito" antes de confirmar.

## Diffs de implementação

### DIFF 3.1 — Cache da imagem base por sessão
- Salvar imageBase64 gerada no estado global com hash identificador
- Indicador visual "Imagem em cache" no painel

### DIFF 3.2 — Re-render em tempo real
- Toda alteração em texto/fonte/cor/posição chama o renderer local (sem IA)
- Debounce de 300ms para não re-renderizar a cada tecla
- Preview atualiza instantaneamente no canvas

### DIFF 3.3 — Separação visual refinamento vs nova geração
- Painel lateral com seções claramente separadas
- Badge de custo em créditos antes de ações que consomem

---

# FEATURE 4 — HISTÓRICO VISUAL DE GERAÇÕES

## Objetivo
Strip horizontal com as últimas gerações da sessão.
Nunca perder uma geração boa por acidente. Voltar para qualquer estado anterior.

## UI

```
Histórico da sessão:
┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
│img │  │img │  │img │  │img │  │img │  │img │  │img │  │img │
│  1 │  │  2 │  │  3 │◄ │  4 │  │  5 │  │  6 │  │  7 │  │  8 │
└────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘
                        atual
```

- Strip horizontal fixa na parte inferior do editor
- Thumbnails 60x60px clicáveis
- Item ativo: borda destacada
- Hover: tooltip com preset e textos usados
- Scroll horizontal se mais de 8 itens
- Máximo 20 itens por sessão (os mais antigos saem)

## O que é salvo por item do histórico

```typescript
interface HistoryItem {
  id: string
  thumbnail: string           // base64 reduzido 60x60
  imageBase64: string         // imagem completa cacheada
  wizardState: WizardState    // estado completo do wizard naquele momento
  timestamp: number
  preset: string
  headline: string
}
```

- Clicar em um item restaura o estado completo do wizard + a imagem
- Permite editar a partir de qualquer ponto anterior

## Persistência
- Histórico da sessão: memória (não persiste entre sessões)
- Favoritar uma geração: salva no Supabase permanentemente (icone ★)

## Diffs de implementação

### DIFF 4.1 — Store de histórico
- `useHistoryStore` com array de `HistoryItem`
- Adicionar ao histórico após cada geração bem-sucedida
- Limitar a 20 itens (FIFO)

### DIFF 4.2 — Componente HistoryStrip
- Strip horizontal com scroll
- Thumbnails com estado ativo destacado
- Tooltip no hover

### DIFF 4.3 — Restaurar estado ao clicar
- Clicar no item: restaurar `wizardState` no wizard store
- Restaurar `imageBase64` no cache
- Canvas atualiza imediatamente

### DIFF 4.4 — Favoritar geração
- Ícone ★ em cada thumbnail
- Salvar no Supabase tabela `saved_generations`
- Tela "Minhas gerações" na dashboard

---

# FEATURE 5 — CANVAS COM ZONAS DE COMPOSIÇÃO VISÍVEIS

## Objetivo
Antes de gerar, o canvas mostra overlay indicando onde o texto vai ficar
e onde a IA vai preservar espaço. O usuário vê o layout antes de gastar crédito.

## Comportamento

Enquanto o usuário está no wizard (antes de gerar), o canvas mostra:

```
┌─────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← zona de texto (overlay escuro semi-transparente)
│  [HEADLINE AQUI]            │     com o texto do usuário já posicionado
│  [Subheadline]              │
│  [CTA]                      │
│─────────────────────────────│
│                             │
│    [subject será aqui]      │  ← zona do subject (ícone de pessoa/produto no centro)
│                             │
└─────────────────────────────┘
```

- Overlay de texto: fundo escuro 60% opacidade + texto simulado com a fonte escolhida
- Zona do subject: ícone placeholder + label "Subject aparecerá aqui"
- Se o usuário já fez upload: mostra a foto real (preprocessada) na zona do subject
- Ao mudar posição do texto: animação suave de transição da zona

## Interação

- Canvas é interativo antes da geração: arrastar a zona de texto reposiciona
- Mudança no canvas atualiza o seletor de posição no wizard automaticamente
- Resize das fontes: slider de tamanho reflete em tempo real no canvas

## Diffs de implementação

### DIFF 5.1 — Canvas de preview pré-geração
- Componente `PreviewCanvas` que renderiza zonas sem chamar IA
- Zona de texto com overlay + texto simulado
- Zona de subject com placeholder ou foto do usuário

### DIFF 5.2 — Sincronização bidirecional canvas ↔ wizard
- Arrastar zona de texto atualiza `textPosition` no wizard store
- Mudar posição no wizard anima a zona no canvas

---

# FEATURE 7 — DRAG PARA REPOSICIONAR TEXTO NO RESULTADO

## Objetivo
Após geração, o usuário arrasta o bloco de texto para qualquer posição.
O renderer recompõe em tempo real sem nova geração de IA.

## Comportamento

```
┌─────────────────────────────┐
│                             │
│    [imagem gerada]          │
│                             │
│  ┌─────────────────────┐    │
│  │ EU QUERIA SER FORTE │◄── drag handle
│  │ Mas ela não deixava │
│  │ [VEJA O QUE ACONT.] │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

- Bloco de texto tem handle de drag visível (ícone de mover no canto)
- Arrastar reposiciona em tempo real
- Snap para zonas de segurança: top/bottom/left/right/center (guias magnéticas)
- Posição salva automaticamente ao soltar

## Snap zones (guias magnéticas)

Ao aproximar de uma zona de snap, o bloco "gruda" com feedback visual:
```
Snap TOP:    y < 15% da altura
Snap BOTTOM: y > 70% da altura
Snap LEFT:   x < 20% da largura
Snap RIGHT:  x > 60% da largura
Snap CENTER: dentro de 10% do centro
```

## Diffs de implementação

### DIFF 7.1 — Bloco de texto draggável
- Wrapper com `draggable` ou biblioteca `@dnd-kit`
- Posição relativa ao canvas em porcentagem (não pixels absolutos)
- Persiste no estado da geração atual

### DIFF 7.2 — Snap zones com feedback visual
- Guias aparecendo quando próximo de zona de snap
- Animação de "grudar" ao entrar na zona
- Re-render do texto na nova posição

---

# FEATURE 8 — COMPARADOR ANTES/DEPOIS

## Objetivo
Slider que divide a tela: esquerda mostra a imagem base (só IA, sem texto),
direita mostra o resultado final com texto e efeitos.

## UI

```
┌───────────────────┬───────────────────┐
│                   │ EU QUERIA SER     │
│   [imagem base    │ FORTE             │
│    sem texto]     │ Mas ela não...    │
│                   │ [VEJA O QUE...]   │
│    SEM TEXTO  ←  ║  → COM TEXTO      │
└───────────────────┴───────────────────┘
```

- Divisor vertical arrastável
- Label "Sem texto" à esquerda, "Com texto" à direita
- Botão toggle para alternar entre os dois sem o slider
- Disponível após geração via botão "Comparar" no painel

## Diffs de implementação

### DIFF 8.1 — Componente BeforeAfterSlider
- Dois layers sobrepostos, clip-path controlado pela posição do divisor
- Divisor arrastável com handle central
- Labels nos lados

### DIFF 8.2 — Botão toggle rápido
- Botão "Ver base / Ver resultado" alterna sem arrastar

---

# FEATURE 10 — MODO RÁPIDO / AVANÇADO (COMPLEMENTO DA FEATURE 9)

> Já especificado dentro da Feature 9 (DIFF 9.5).
> Esta feature é o toggle e a lógica de colapso — implementar junto com o wizard.

---

# FEATURE 12 — ATALHOS DE TECLADO

## Objetivo
Atalhos para usuários avançados (designers, agências) que aceleram o workflow.

## Atalhos

```typescript
const SHORTCUTS = {
  'g':         'Gerar criativo',
  'r':         'Refinar sem regerar',
  'e':         'Abrir modal de export',
  'z':         'Zoom in',
  'x':         'Zoom out',
  'f':         'Fit to screen',
  'ArrowLeft': 'Item anterior no histórico',
  'ArrowRight':'Próximo item no histórico',
  'cmd+z':     'Desfazer última ação',
  'cmd+s':     'Salvar geração atual',
  '1':         'Selecionar variação A',
  '2':         'Selecionar variação B',
  '3':         'Selecionar variação C',
  '?':         'Mostrar lista de atalhos',
}
```

## UI de help

Pressionar `?` abre overlay com lista de atalhos organizados por categoria.

## Diffs de implementação

### DIFF 12.1 — Hook useKeyboardShortcuts
- Listener global de teclado
- Mapeamento de tecla → ação
- Desabilitado quando foco em input de texto

### DIFF 12.2 — Modal de atalhos
- Overlay acionado por `?`
- Lista organizada: Geração | Navegação | Export | Zoom

---

# FEATURE 14 — PREVIEW EM DISPOSITIVO REAL

## Objetivo
Botão "Ver no Instagram" simula como o post aparece no feed real,
aumentando confiança do usuário antes de exportar.

## Modos de preview

```
[Instagram Feed]  [Instagram Stories]  [TikTok]  [Facebook]
```

### Instagram Feed

```
┌──────────────────────────┐
│ ○ usuario_exemplo    ···  │
│                          │
│  [imagem gerada]         │
│                          │
│ ♡ 1.234  💬 56  ➤        │
│ Curtido por fulano e     │
│ outras 1.234 pessoas     │
│ usuario_exemplo Legenda  │
│ do post aqui...          │
└──────────────────────────┘
```

### Stories

```
┌─────────┐
│▓░░░░░░░░│  ← barra de progresso do story
│         │
│ [imagem]│
│         │
│ [Enviar │
│mensagem]│
└─────────┘
```

- Preview em frame de smartphone para dar contexto real
- Dimensões corretas por plataforma
- Usuário pode digitar username e legenda para personalizar o preview

## Diffs de implementação

### DIFF 14.1 — Componente DevicePreview
- Frame de smartphone SVG ou PNG como wrapper
- Imagem gerada dentro do frame
- Elementos de UI da plataforma (likes, comentários, etc)

### DIFF 14.2 — Seletor de plataforma
- Tabs: Instagram Feed | Stories | TikTok | Facebook
- Cada tab muda o frame e a composição

---

# FEATURE 15 — MARCA D'ÁGUA ELEGANTE

## Objetivo
Free: marca d'água discreta no canto. Pago: sem marca.
A marca d'água deve ser elegante — funciona como marketing orgânico quando o resultado é bom.

## Especificação visual

```
Posição: canto inferior direito
Tamanho: 80px de largura máxima
Opacidade: 35% (visível mas não intrusiva)
Conteúdo: logotipo Creatyng + "creatyng.com"
Fonte: mesma fonte do produto, fina
Cor: branco se fundo escuro, preto se fundo claro (detectado automaticamente)
```

## Comportamento por plano

```
Free:     marca d'água sempre presente, não removível
Creator:  pode remover por crédito extra (+0.5 crédito)
Pro:      sem marca d'água por padrão
Agency:   sem marca d'água + pode usar logo próprio no lugar
```

## Diffs de implementação

### DIFF 15.1 — Renderer aplica marca d'água
- Detectar luminosidade do canto inferior direito da imagem
- Aplicar logotipo na cor correta (branco/preto)
- Baseado no plano do usuário: aplicar ou não

### DIFF 15.2 — Opção de remoção por crédito (Creator)
- Botão "Remover marca d'água" no painel de export
- Tooltip com custo de créditos
- Confirmar e re-renderizar sem a marca

---

# FEATURE 17 — ESTILO SALVO ("MEU ESTILO")

## Objetivo
Após uma geração que agradou, botão "Salvar como meu estilo".
Na próxima vez, aparece como opção de preset pessoal no wizard.

## UI

Após geração, no painel de resultado:

```
[★ Salvar como Meu Estilo]
```

Ao clicar, modal pede nome:
```
┌──────────────────────────────┐
│  Salvar estilo               │
│                              │
│  Nome: [Dramático Azul   ]   │
│                              │
│  [Cancelar]  [✓ Salvar]      │
└──────────────────────────────┘
```

No wizard (Passo 2), seção "Meus Estilos" aparece acima dos presets do sistema:

```
MEUS ESTILOS
[Dramático Azul]  [Fitness Dark]  [Clean Produto]

ESTILOS CREATYNG
[Drama] [Clean] [Dark] [Editorial] [Neon]
```

## O que é salvo

```typescript
interface SavedStyle {
  id: string
  name: string
  thumbnail: string     // miniatura da geração que originou o estilo
  preset: string
  atmosphere: string
  lighting: string
  colors: ColorSystem
  fonts: FontSystem
  textPosition: string
  createdAt: string
}
```

## Diffs de implementação

### DIFF 17.1 — Botão e modal de salvar estilo
- Botão no painel de resultado
- Modal com campo de nome
- Salvar no Supabase tabela `saved_styles`

### DIFF 17.2 — Seção "Meus Estilos" no Wizard
- Carregar estilos salvos do usuário ao abrir o wizard
- Cards com thumbnail e nome
- Aplicar todos os parâmetros ao selecionar

---

# FEATURE 18 — SCORE DE QUALIDADE AUTOMÁTICO

## Objetivo
Após gerar, o sistema analisa a imagem e exibe um score de qualidade
com checklist visual. Educa o usuário e aumenta confiança no produto.

## UI

```
┌─────────────────────────────────┐
│  Qualidade do criativo          │
│                                 │
│  ████████████████░░  87/100     │
│                                 │
│  ✓ Identidade preservada        │
│  ✓ Texto legível                │
│  ✓ Iluminação consistente       │
│  ✓ Composição equilibrada       │
│  ⚠ Mãos podem estar distorcidas │
│                                 │
│  [Regerar para melhorar]        │
└─────────────────────────────────┘
```

- Score de 0-100
- Checklist com itens positivos (✓) e alertas (⚠)
- Se score < 70: botão "Regerar para melhorar" em destaque
- Se score ≥ 90: badge "✦ Qualidade Premium" na imagem

## Como calcular o score

Análise via Claude Vision (ou Gemini Vision) após geração:

```typescript
const QUALITY_CHECKS = [
  { id: 'text_legible',        weight: 25, label: 'Texto legível'            },
  { id: 'identity_preserved',  weight: 25, label: 'Identidade preservada'    },
  { id: 'lighting_consistent', weight: 20, label: 'Iluminação consistente'   },
  { id: 'composition',         weight: 15, label: 'Composição equilibrada'   },
  { id: 'no_artifacts',        weight: 15, label: 'Sem artefatos visuais'    },
]
// Score = soma dos pesos dos checks que passaram
```

Prompt de análise (internal, não exposto ao usuário):
```
Analyze this marketing creative image and evaluate:
1. Is the text legible and correctly spelled? (yes/no)
2. Is the subject identity preserved (no distortion)? (yes/no)
3. Is the lighting consistent across the image? (yes/no)
4. Is the composition balanced for marketing use? (yes/no)
5. Are there any visual artifacts, wrong anatomy, or distortions? (yes/no)
Return JSON only: { text_legible: bool, identity_preserved: bool, ... }
```

## Retry inteligente (se score < 70)

- Ao clicar "Regerar para melhorar", sistema muda o provider automaticamente
  (Gemini → Replicate ou vice-versa)
- Ajusta 2-3 parâmetros de composição automaticamente
- Não cobra crédito extra no primeiro retry automático

## Diffs de implementação

### DIFF 18.1 — Análise de qualidade via Vision
- Após geração, chamar Claude Vision ou Gemini Vision com a imagem
- Parsear resposta JSON com os checks
- Calcular score ponderado

### DIFF 18.2 — Componente QualityScore
- Exibir score + checklist no painel de resultado
- Animação de contagem do score (0 → valor final)
- Badge "Premium" se ≥ 90

### DIFF 18.3 — Retry inteligente
- Lógica de troca de provider no retry
- Não cobrar crédito no primeiro retry pós-geração
- Máximo 1 retry automático gratuito por geração

---

# ════════════════════════════════════
# ORDEM FINAL DE EXECUÇÃO — ROADMAP COMPLETO
# ════════════════════════════════════

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — MVP (executar primeiro)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEMANA 1 — Feature 9 (Wizard de 3 Passos)
  DIFF 9.1 → 9.2 → 9.3 → 9.4 → 9.5

SEMANA 2 — Feature 13 (Export Multi-formato)
  DIFF 13.1 → 13.2 → 13.3 → 13.4 → 13.5

SEMANA 3 — Feature 16 (Brand Kit + Avatar)
  DIFF 16.1 → 16.2 → 16.3 → 16.4 → 16.5 → 16.6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — POLIMENTO (após MVP validado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEMANA 4 — Features 3 + 4 (Refinar sem regerar + Histórico)
  DIFF 3.1 → 3.2 → 3.3
  DIFF 4.1 → 4.2 → 4.3 → 4.4

SEMANA 5 — Features 5 + 7 + 8 (Canvas + Drag + Comparador)
  DIFF 5.1 → 5.2
  DIFF 7.1 → 7.2
  DIFF 8.1 → 8.2

SEMANA 6 — Features 1 + 2 (Streaming + Variações)
  DIFF 1.1 → 1.2 → 1.3
  DIFF 2.1 → 2.2 → 2.3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — EXPANSÃO (produto maduro)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEMANA 7 — Features 17 + 18 (Estilo Salvo + Score)
  DIFF 17.1 → 17.2
  DIFF 18.1 → 18.2 → 18.3

SEMANA 8 — Features 12 + 14 + 15 (Atalhos + Preview + Marca d'água)
  DIFF 12.1 → 12.2
  DIFF 14.1 → 14.2
  DIFF 15.1 → 15.2
```

---

# PROMPT PARA O CLAUDE CODE INICIAR

```
Leia o CLAUDE.md e o CREATYNG_FEATURES_SPEC.md.

Estamos na FASE 1. Vamos começar pela Feature 9 — Wizard de 3 Passos.

Antes de implementar:
1. Mostre como o editor atual está estruturado (qual componente é o principal,
   como o estado dos campos está organizado hoje)
2. Identifique quais campos existem hoje e em qual passo do wizard cada um ficaria
3. Confirme se já existe algum gerenciador de estado (Zustand, Context, Redux)

Não implemente nada ainda. Só mapeie a estrutura atual.
Depois que confirmar o mapeamento, começamos pelo DIFF 9.1.
```
