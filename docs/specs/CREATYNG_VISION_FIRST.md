# CREATYNG — VISION FIRST ENGINE (CORE DO PRODUTO)

> Este é o documento mais importante do repositório.
> Tudo que não funciona hoje na geração tem raiz aqui.
> Leia este arquivo inteiro antes de tocar em qualquer linha de código relacionada à geração.
> Leia junto com CLAUDE.md, CREATYNG_MOTOR_PLAN.md e CREATYNG_VISUAL_SPEC.md.

---

## 🧠 O PROBLEMA FUNDAMENTAL (POR QUE AS IMAGENS ESTÃO RUINS)

O sistema atual trata a geração assim:

```
Usuário preenche campos
        ↓
Sistema concatena strings num prompt gigante
        ↓
Prompt vai para a IA
        ↓
IA gera o que entendeu (que é pouco)
        ↓
Resultado aleatório, genérico, sem relação com a referência
```

O problema não é o modelo de IA. Os modelos (Gemini Nano Banana Pro e FLUX Kontext)
são extremamente capazes. O problema é como o sistema está se comunicando com eles.

Analogia: é como contratar o melhor chef do mundo e dar para ele
uma lista de ingredientes escrita em texto ruim, sem mostrar a foto do prato,
sem explicar o contexto, e esperar que ele entregue exatamente o que você imaginou.

---

## 🎯 A SOLUÇÃO: VISION FIRST ARCHITECTURE

A arquitetura Vision First inverte a ordem do pipeline:

```
ANTES (errado):
Campos do usuário → prompt de texto → IA gera → resultado ruim

DEPOIS (correto):
Referência visual → Vision AI lê → DNA extraído → prompt gerado a partir do DNA
→ IA recebe imagem real + prompt preciso → resultado próximo da referência
```

**Princípio central:**
> Uma imagem de referência contém mais informação do que 500 palavras de prompt.
> O sistema deve ler a imagem, não pedir para o usuário descrever ela.

---

## 📐 ARQUITETURA COMPLETA DO NOVO PIPELINE

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISION FIRST PIPELINE                        │
│                                                                 │
│  INPUT                                                          │
│  ├── subjectImage (obrigatório)                                 │
│  ├── styleReference (opcional, mas prioritário se existir)      │
│  ├── compositionReference (opcional)                            │
│  └── userIntent: { headline, cta, preset, colors, textPos }     │
│                                                                 │
│  STAGE 1: VISION ANALYSIS (novo — acontece antes de tudo)       │
│  ├── Se styleReference existe:                                  │
│  │   └── Gemini Flash analisa → extrai VisualDNA               │
│  ├── Se subjectImage existe:                                    │
│  │   └── Gemini Flash analisa → extrai SubjectProfile          │
│  └── Retorna: { visualDNA, subjectProfile }                     │
│                                                                 │
│  STAGE 2: SMART PROMPT COMPILATION (substituir o atual)         │
│  ├── Base: VisualDNA (se existir referência)                    │
│  ├── Layer: SubjectProfile (preservar identidade)               │
│  ├── Layer: userIntent (o que o usuário quer adicionar)         │
│  ├── Layer: compositionInstructions (texto, espaço, posição)    │
│  └── Retorna: prompt otimizado + negative prompt                │
│                                                                 │
│  STAGE 3: PREPROCESSING                                         │
│  ├── Subject: remove fundo, upscale, padding                    │
│  └── Reference: resize para dimensão correta do provider        │
│                                                                 │
│  STAGE 4: GENERATION                                            │
│  ├── Provider selecionado: Gemini Nano Banana Pro (strict)      │
│  │   Payload: subject + reference + compiled prompt             │
│  ├── Fallback: FLUX Kontext Pro (Replicate)                     │
│  └── Retorna: imageBase64 + meta                                │
│                                                                 │
│  STAGE 5: QUALITY ANALYSIS                                      │
│  ├── Vision analisa resultado                                   │
│  ├── Score calculado                                            │
│  ├── Se score < 70: retry automático com provider alternativo   │
│  └── Retorna: imageBase64 final + qualityScore + meta           │
│                                                                 │
│  STAGE 6: TEXT RENDERING                                        │
│  ├── HTML/CSS renderer recebe imageBase64 + textConfig          │
│  ├── Posiciona headline + subheadline + CTA                     │
│  └── Retorna: PNG final 2K                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔬 STAGE 1: VISION ANALYSIS — ESPECIFICAÇÃO COMPLETA

Este é o estágio mais novo e mais importante. Não existe hoje.

### 1A — Análise da referência de estilo (VisualDNA)

**Modelo usado:** Gemini Flash (rápido, barato — não usar Nano Banana Pro aqui)
**Quando:** Imediatamente após o usuário fazer upload da referência, em background
**Resultado:** Exibido para o usuário antes da geração (ele confirma ou edita)

**Prompt de análise (interno, nunca exposto):**

```
You are a professional art director analyzing a reference image for AI generation.
Analyze this image and extract the complete visual DNA.
Return ONLY valid JSON, no markdown, no explanation.

{
  "lighting": {
    "type": "string — describe the lighting setup (rim, key, fill, ambient)",
    "direction": "string — where is the main light coming from",
    "color": "string — color of the main light source",
    "rimColor": "string — color of rim/back light if present",
    "intensity": "string — soft/medium/dramatic/extreme",
    "shadows": "string — soft/medium/hard/deep"
  },
  "colorPalette": {
    "dominant": "string — hex of most dominant color",
    "secondary": "string — hex of second most present color", 
    "accent": "string — hex of accent/highlight color",
    "background": "string — hex of background tone",
    "overall": "string — describe the color mood in 5 words max"
  },
  "atmosphere": {
    "mood": "string — cinematic/dramatic/clean/dark/energetic/ethereal/etc",
    "particles": "boolean — are there particles/sparks/debris in the air",
    "particleType": "string — type of particles if present",
    "fog": "boolean",
    "glowEffects": "boolean",
    "depthOfField": "string — none/subtle/moderate/strong/extreme"
  },
  "composition": {
    "subjectPosition": "string — center/left/right/lower-center/etc",
    "subjectSize": "string — close-up/portrait/half-body/full-body",
    "cameraAngle": "string — eye-level/low-angle/high-angle/dutch-angle",
    "foregroundElements": "string — describe foreground if present",
    "backgroundElements": "string — describe background elements",
    "planes": "number — how many depth planes are visible (1-4)",
    "negativeSpace": "string — where is empty space (top/bottom/left/right/none)"
  },
  "style": {
    "genre": "string — superhero/fashion/commercial/editorial/dark-fantasy/sci-fi/etc",
    "realism": "string — photorealistic/cinematic/stylized/illustrated",
    "productionLevel": "string — amateur/commercial/blockbuster/luxury",
    "era": "string — modern/futuristic/retro/timeless",
    "references": "string — what movies/shows/brands does this remind you of"
  },
  "textures": {
    "skin": "string — how is skin rendered (natural/dramatic/stylized)",
    "materials": "string — describe key material textures present",
    "surfaceQuality": "string — matte/glossy/mixed"
  },
  "specialElements": {
    "effects3D": "boolean — floating 3D objects, crystals, glass",
    "effects3DDescription": "string — describe if present",
    "energyEffects": "boolean — portals, beams, neon, electricity",
    "energyDescription": "string — describe if present",
    "environmentalElements": "string — rocks, water, fire, smoke, etc"
  },
  "promptWeight": {
    "mostImportant": "string — the ONE thing that defines this image most",
    "doNotChange": "string — what must be preserved at all costs",
    "optional": "string — what could be varied without breaking the style"
  }
}
```

### 1B — Análise do subject (SubjectProfile)

**Quando:** Após upload do subject, em background
**Propósito:** Extrair descrição precisa para preservar identidade no prompt

```
You are analyzing a photo to extract identity information for AI image generation.
This information will be used to preserve the subject's exact appearance.
Return ONLY valid JSON.

{
  "subjectType": "string — person/product/animal/vehicle/food/logo/other",
  "person": {
    "gender": "string or null",
    "approximateAge": "string or null — young adult/adult/middle-aged/etc",
    "hairColor": "string or null",
    "hairStyle": "string or null",
    "skinTone": "string or null — use Fitzpatrick scale description",
    "eyeColor": "string or null",
    "facialHair": "string or null",
    "distinctiveFeatures": "string or null — glasses, tattoos, scars, etc",
    "bodyType": "string or null",
    "currentClothing": "string or null — describe what they are wearing"
  },
  "product": {
    "category": "string or null",
    "primaryColor": "string or null",
    "shape": "string or null",
    "distinctiveFeatures": "string or null"
  },
  "framing": {
    "currentCrop": "string — how the subject is currently framed",
    "faceVisible": "boolean",
    "faceQuality": "string — clear/partial/obscured"
  },
  "identityStrength": "number 0-100 — how confidently identity can be preserved",
  "preservationInstructions": "string — specific instructions to preserve this subject exactly"
}
```

---

## 🔨 STAGE 2: SMART PROMPT COMPILATION — ESPECIFICAÇÃO COMPLETA

### O compilador atual vs o novo

**ATUAL (problema):**
```typescript
// Simplesmente concatena strings — não tem inteligência
const prompt = `${stylePrompt} ${subjectDescription} ${scenePrompt} ${typographyPrompt}`
// Resultado: prompt genérico, IA interpreta aleatoriamente
```

**NOVO (correto):**
```typescript
function compileSmartPrompt(
  visualDNA: VisualDNA | null,
  subjectProfile: SubjectProfile,
  userIntent: UserIntent,
  compositionConfig: CompositionConfig
): CompiledPrompt {
  // 1. Base vem do DNA visual (se existe referência)
  // 2. Camadas são adicionadas em ordem de prioridade
  // 3. Conflitos são resolvidos (DNA prevalece sobre preset)
  // 4. Resultado é um prompt cirúrgico, não um parágrafo genérico
}
```

### Estrutura do prompt compilado (ordem importa)

A IA presta mais atenção ao início e ao fim do prompt.
O meio tende a ser menos lido. Estruturar assim:

```
[BLOCO 1 — IDENTIDADE DA GERAÇÃO] ← início, alta atenção
  O que é essa imagem, qual o nível de qualidade esperado

[BLOCO 2 — SUBJECT] ← preservação de identidade
  Quem/o que é o subject, como preservar exatamente

[BLOCO 3 — ESTILO VISUAL] ← extraído do DNA ou do preset
  Iluminação, paleta, atmosfera — o mais específico possível

[BLOCO 4 — CENA E COMPOSIÇÃO] ← o cenário
  O que existe no fundo, foreground, planos de profundidade

[BLOCO 5 — INSTRUÇÕES TÉCNICAS] ← regras do motor
  Sem texto, sem watermark, espaço para texto, qualidade

[BLOCO 6 — NEGATIVE PROMPT] ← fim, alta atenção
  O que nunca deve aparecer
```

### Implementação do compilador

```typescript
// src/features/editor/engine/smartPromptCompiler.ts

interface CompiledPrompt {
  positive: string
  negative: string
  structuredBlocks: PromptBlocks  // para debug
  dnaUsed: boolean
  warnings: string[]  // ex: "DNA e preset conflitam em iluminação — DNA prevalece"
}

interface PromptBlocks {
  identity: string
  subject: string
  visualStyle: string
  scene: string
  technical: string
}

export function compileSmartPrompt(
  visualDNA: VisualDNA | null,
  subjectProfile: SubjectProfile,
  userIntent: UserIntent,
  compositionConfig: CompositionConfig
): CompiledPrompt {

  const blocks: PromptBlocks = {

    // BLOCO 1 — IDENTIDADE
    identity: buildIdentityBlock(visualDNA, userIntent),

    // BLOCO 2 — SUBJECT
    subject: buildSubjectBlock(subjectProfile, userIntent),

    // BLOCO 3 — ESTILO VISUAL
    // Se tem DNA: usa DNA. Se não: usa preset.
    // DNA sempre prevalece sobre preset quando há conflito.
    visualStyle: visualDNA
      ? buildStyleFromDNA(visualDNA)
      : buildStyleFromPreset(userIntent.preset, userIntent.colors),

    // BLOCO 4 — CENA
    scene: buildSceneBlock(visualDNA, userIntent),

    // BLOCO 5 — TÉCNICO
    technical: buildTechnicalBlock(compositionConfig),
  }

  return {
    positive: [
      blocks.identity,
      blocks.subject,
      blocks.visualStyle,
      blocks.scene,
      blocks.technical,
    ].join('\n\n'),
    negative: buildNegativePrompt(),
    structuredBlocks: blocks,
    dnaUsed: !!visualDNA,
    warnings: detectConflicts(visualDNA, userIntent),
  }
}
```

### Builders de cada bloco

```typescript
function buildIdentityBlock(dna: VisualDNA | null, intent: UserIntent): string {
  const productionLevel = dna?.style.productionLevel ?? 'blockbuster'
  const genre = dna?.style.genre ?? 'cinematic commercial'

  return `Photorealistic ${genre} image. ${productionLevel}-level production quality.
Professional marketing creative, agency grade. Ultra-detailed.
${dna ? `Visual style inspired by: ${dna.style.references}.` : ''}
The result must be directly usable in a paid advertising campaign.`
}

function buildSubjectBlock(profile: SubjectProfile, intent: UserIntent): string {
  if (profile.subjectType === 'person' && profile.person) {
    const p = profile.person
    return `SUBJECT (preserve exactly — strict identity):
${p.gender ? `${p.gender}, ` : ''}${p.approximateAge ? `${p.approximateAge}, ` : ''}
${p.skinTone ? `skin tone: ${p.skinTone}, ` : ''}
${p.hairColor ? `hair: ${p.hairColor} ${p.hairStyle ?? ''}, ` : ''}
${p.facialHair ? `facial hair: ${p.facialHair}, ` : ''}
${p.distinctiveFeatures ? `distinctive features: ${p.distinctiveFeatures}.` : ''}
Framing: ${intent.framing}. Camera angle: ${intent.cameraAngle}.
${profile.preservationInstructions}
Do NOT alter face, do NOT replace with generic person, do NOT drift from reference.
Sharp focus on subject. No overprocessing. No plastic skin. No dead eyes.`
  }
  // ... outros tipos de subject (produto, logo, etc)
  return ''
}

function buildStyleFromDNA(dna: VisualDNA): string {
  return `VISUAL STYLE (extracted from reference — follow precisely):
Lighting: ${dna.lighting.type}, main light from ${dna.lighting.direction},
light color: ${dna.lighting.color},
${dna.lighting.rimColor ? `rim light: ${dna.lighting.rimColor},` : ''}
intensity: ${dna.lighting.intensity}, shadows: ${dna.lighting.shadows}.

Color palette (MANDATORY — non-negotiable):
Dominant: ${dna.colorPalette.dominant}, secondary: ${dna.colorPalette.secondary},
accent: ${dna.colorPalette.accent}, background tone: ${dna.colorPalette.background}.
Overall color mood: ${dna.colorPalette.overall}.
The dominant visual atmosphere MUST reflect these exact colors.

Atmosphere: ${dna.atmosphere.mood} mood.
${dna.atmosphere.particles ? `Particles in the air: ${dna.atmosphere.particleType}.` : ''}
${dna.atmosphere.fog ? 'Atmospheric fog/haze present.' : ''}
${dna.atmosphere.glowEffects ? 'Glow and bloom effects on light sources.' : ''}
Depth of field: ${dna.atmosphere.depthOfField}.

Style: ${dna.style.realism}, ${dna.style.era} aesthetic.
${dna.style.references ? `Cinematic references: ${dna.style.references}.` : ''}`
}

function buildStyleFromPreset(preset: string, colors: ColorSystem): string {
  // Fallback quando não há referência — usa presets definidos em CREATYNG_MOTOR_PLAN.md
  const presetConfig = PRESETS[preset]
  return `VISUAL STYLE (from selected preset):
${presetConfig.scenePrompt}
${presetConfig.lightingPrompt}

COLOR PALETTE (MANDATORY):
Primary accent ${colors.primary} — use for rim lighting, neon elements, energy effects.
Secondary ${colors.secondary} — use for particles, reflections, detail highlights.
Neutral ${colors.neutral} — use for background depth and shadow areas.
The dominant atmosphere MUST reflect these colors. Non-negotiable.`
}

function buildSceneBlock(dna: VisualDNA | null, intent: UserIntent): string {
  const sceneBase = dna
    ? buildSceneFromDNA(dna)
    : intent.sceneDescription ?? ''

  const userExtras = intent.extraElements
    ? `Additional scene elements requested: ${intent.extraElements}.`
    : ''

  const textSpaceInstruction = buildTextSpaceInstruction(intent.textPosition)

  return `SCENE:
${sceneBase}
${userExtras}
${textSpaceInstruction}`
}

function buildSceneFromDNA(dna: VisualDNA): string {
  return `Scene inspired by reference:
Background: ${dna.composition.backgroundElements}.
${dna.composition.foregroundElements
  ? `Foreground: ${dna.composition.foregroundElements}.`
  : ''}
${dna.specialElements.effects3D
  ? `3D elements: ${dna.specialElements.effects3DDescription}.`
  : ''}
${dna.specialElements.energyEffects
  ? `Energy effects: ${dna.specialElements.energyDescription}.`
  : ''}
${dna.specialElements.environmentalElements
  ? `Environment: ${dna.specialElements.environmentalElements}.`
  : ''}
Depth: ${dna.composition.planes} distinct depth planes.
Camera: ${dna.composition.cameraAngle}, subject ${dna.composition.subjectPosition}.`
}

function buildTextSpaceInstruction(textPosition: string): string {
  const instructions: Record<string, string> = {
    bottom: `IMPORTANT: Keep the lower 35% of the frame darker and with lower contrast.
This area will receive text overlay — ensure clean, text-ready space there.`,
    top: `IMPORTANT: Keep the upper 30% of the frame darker and with lower contrast.
This area will receive text overlay — ensure clean, text-ready space there.`,
    left: `IMPORTANT: Keep the left 40% of the frame darker with negative space.
Subject should be positioned right-center. Left area receives text overlay.`,
    right: `IMPORTANT: Keep the right 40% of the frame darker with negative space.
Subject should be positioned left-center. Right area receives text overlay.`,
    none: `IMPORTANT: Do NOT generate any text, letters, words or numbers.
The full image is the subject — no text space reservation needed.`,
  }
  return instructions[textPosition] ?? instructions.bottom
}

function buildTechnicalBlock(config: CompositionConfig): string {
  return `TECHNICAL REQUIREMENTS:
Output format: ${config.aspectRatio} aspect ratio, ${config.width}x${config.height}px equivalent.
Do NOT generate any text, letters, words, numbers or typography in the image.
Do NOT add watermarks, logos, copyright stamps or tool signatures.
Anatomically correct proportions. No distorted hands or extra fingers.
Consistent lighting — the light direction on subject must match the scene light source.
No white halo or edge fringe around the subject.
No JPEG artifacts. No pixelation. No over-compression.
Print-ready quality. Ultra-detailed. 8K resolution equivalent.`
}

function buildNegativePrompt(): string {
  return `plastic skin, waxy face, dead eyes, glass eyes, lifeless expression,
distorted hands, extra fingers, wrong anatomy, disfigured body, floating limbs,
blurry text, garbled letters, invented words, misspelled text, any text in image,
watermark, tool logo, brand logo overlay, copyright stamp, signature,
stock photo generic background, inconsistent lighting, two suns,
dual contradictory light sources, white halo around subject, edge fringe,
cutout artifact, JPEG noise, pixelated, over-compressed,
wrong product category, unrelated object, replaced product,
cartoon, anime, illustration, painting, drawing, sketch,
low quality, low resolution, blurry, out of focus, grainy`
}
```

---

## 📦 STAGE 3: PREPROCESSING — ESPECIFICAÇÃO COMPLETA

```typescript
// supabase/functions/generate-image/preprocessing.ts

interface PreprocessingResult {
  subject: {
    base64: string
    width: number
    height: number
    flags: PreprocessFlag[]
    sha256: string
  }
  reference?: {
    base64: string
    width: number
    height: number
    resizedForProvider: 'gemini' | 'replicate'
  }
}

type PreprocessFlag =
  | 'background_removed'
  | 'background_neutralized'    // fundo composto para cinza neutro
  | 'upscaled'                  // minSide estava < 1024
  | 'padded'                    // padding adicionado para proporção
  | 'centered'                  // subject centralizado no canvas
  | 'orientation_corrected'     // EXIF rotation corrigida

async function preprocessSubject(base64: string): Promise<PreprocessResult['subject']> {
  // 1. Corrigir orientação EXIF
  // 2. Detectar e remover fundo (se transparente: compor cinza #808080)
  // 3. Upscale se minSide < 1024px (usar sharp ou equivalent em Deno)
  // 4. Centralizar e adicionar padding proporcional
  // 5. Calcular sha256 para cache
}

async function preprocessReference(
  base64: string,
  targetProvider: 'gemini' | 'replicate'
): Promise<PreprocessResult['reference']> {
  // Gemini: máximo 4096x4096, aceita qualquer proporção
  // Replicate: recomendar 1024x1024 mínimo
  // Resize mantendo proporção, sem distorção
  // Não remover fundo da referência — queremos o estilo completo
}
```

---

## 🤖 STAGE 4: GENERATION — PAYLOADS CORRETOS POR PROVIDER

### Gemini Nano Banana Pro — payload correto

```typescript
// supabase/functions/generate-image/providers/gemini.ts

async function generateWithGemini(
  subjectBase64: string,
  referenceBase64: string | null,
  compiledPrompt: CompiledPrompt,
  config: GenerationConfig
): Promise<GenerationResult> {

  const parts: GeminiPart[] = [
    // 1. Prompt textual PRIMEIRO
    { text: compiledPrompt.positive },

    // 2. Subject como imagem real
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: subjectBase64
      }
    },
  ]

  // 3. Referência como imagem real (se existe) — NUNCA como texto
  if (referenceBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: referenceBase64
      }
    })
    // Instrução específica sobre o papel da referência
    parts.push({
      text: `The second image above is the STYLE REFERENCE.
Extract from it: lighting, color grading, atmosphere, depth of field, particle effects,
background elements, and overall visual quality.
Apply this exact style to the scene. Style fidelity weight: 80/100.
Do NOT copy people or specific branded objects from the reference.`
    })
  }

  // 4. Negative prompt por último (alta atenção no final)
  parts.push({ text: `Avoid: ${compiledPrompt.negative}` })

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      // Proporção correta (não sempre 1:1)
      imageGenerationConfig: {
        aspectRatio: config.aspectRatio,  // '1:1' | '9:16' | '16:9' | '4:5'
      }
    }
  }

  // Chamar API com retry exponential backoff
  const response = await callGeminiWithRetry(payload, {
    model: 'gemini-3-pro-image-preview',
    maxRetries: 2,
    timeoutMs: 120000,
  })

  return {
    imageBase64: extractImageFromResponse(response),
    meta: {
      provider: 'gemini_nano_banana_pro',
      model: 'gemini-3-pro-image-preview',
      dnaUsed: compiledPrompt.dnaUsed,
      aspectRatio: config.aspectRatio,
    }
  }
}
```

### FLUX Kontext Pro — payload correto

```typescript
// supabase/functions/generate-image/providers/replicate.ts

async function generateWithReplicate(
  subjectBase64: string,
  referenceBase64: string | null,
  compiledPrompt: CompiledPrompt,
  config: GenerationConfig
): Promise<GenerationResult> {

  // FLUX Kontext Pro aceita image como base64 data URI
  const subjectDataURI = `data:image/jpeg;base64,${subjectBase64}`

  const input: ReplicateInput = {
    prompt: compiledPrompt.positive,
    image: subjectDataURI,           // subject como imagem de entrada real
    aspect_ratio: config.aspectRatio,
    output_format: 'png',
    output_quality: 100,
    safety_tolerance: 5,
    // Parâmetros de controle de identidade
    prompt_upsampling: false,        // não alterar o prompt — já está otimizado
  }

  // Se tem referência, adicionar como style reference
  if (referenceBase64) {
    // FLUX Kontext aceita múltiplas imagens via array
    // A instrução no prompt já diz como tratar cada imagem
    input.prompt = `[STYLE_REFERENCE_FOLLOWS_IN_SECOND_IMAGE] ${compiledPrompt.positive}`
    // Nota: verificar documentação atual do flux-kontext-pro para multi-image support
    // Alternativa: passar referência como parte do prompt com URL pública temporária
  }

  // Iniciar predição
  const prediction = await replicateClient.predictions.create({
    model: 'black-forest-labs/flux-kontext-pro',
    input,
  })

  // Polling com timeout
  const result = await pollPrediction(prediction.id, {
    intervalMs: 2000,
    timeoutMs: 120000,
  })

  return {
    imageBase64: await urlToBase64(result.output),
    meta: {
      provider: 'replicate_flux_kontext_pro',
      model: 'black-forest-labs/flux-kontext-pro',
      dnaUsed: compiledPrompt.dnaUsed,
      aspectRatio: config.aspectRatio,
    }
  }
}
```

---

## ✅ STAGE 5: QUALITY ANALYSIS — ESPECIFICAÇÃO COMPLETA

```typescript
// supabase/functions/generate-image/qualityAnalysis.ts

interface QualityResult {
  score: number           // 0-100
  passed: boolean         // score >= 70
  checks: QualityCheck[]
  recommendation: 'approve' | 'retry_same' | 'retry_other_provider' | 'fail'
  retryProvider?: 'gemini' | 'replicate'
}

interface QualityCheck {
  id: string
  label: string
  passed: boolean
  weight: number
  detail?: string    // se falhou, por quê
}

const QUALITY_WEIGHTS = {
  text_absent:           20,  // IA não gerou texto (nós não pedimos)
  subject_preserved:     25,  // identidade do subject mantida
  lighting_consistent:   20,  // iluminação coerente na imagem toda
  composition_balanced:  15,  // composição serve para marketing
  no_artifacts:          10,  // sem distorções, halos, mãos erradas
  style_matches_dna:     10,  // se tinha DNA, resultado bate com ele
}

async function analyzeQuality(
  imageBase64: string,
  visualDNA: VisualDNA | null,
  subjectProfile: SubjectProfile,
  usedProvider: string
): Promise<QualityResult> {

  const analysisPrompt = buildQualityAnalysisPrompt(visualDNA, subjectProfile)

  // Usar Gemini Flash (rápido e barato para análise)
  const analysis = await geminiFlash.analyze(imageBase64, analysisPrompt)
  const parsed = JSON.parse(analysis)

  const checks = buildChecks(parsed)
  const score = calculateScore(checks)

  return {
    score,
    passed: score >= 70,
    checks,
    recommendation: determineRecommendation(score, usedProvider),
    retryProvider: score < 70
      ? (usedProvider === 'gemini' ? 'replicate' : 'gemini')
      : undefined
  }
}

function buildQualityAnalysisPrompt(
  dna: VisualDNA | null,
  subject: SubjectProfile
): string {
  return `Analyze this generated marketing image and evaluate quality.
Return ONLY valid JSON.

Evaluate:
1. text_absent: Is the image completely free of text/letters/numbers? (true = good)
2. subject_preserved: Does the main subject look like a real person/product
   without plastic skin, dead eyes, or anatomical errors? (true = good)
3. lighting_consistent: Is the lighting consistent — subject lit by same light
   as the scene, no contradictory dual lighting? (true = good)
4. composition_balanced: Is the composition usable for marketing —
   subject clearly visible, no awkward cropping? (true = good)
5. no_artifacts: No white halos, edge fringing, JPEG artifacts,
   distorted hands, extra fingers? (true = good)
${dna ? `6. style_matches_dna: Does the color palette match approximately
   ${dna.colorPalette.dominant} and ${dna.colorPalette.secondary}?
   Does the lighting style match ${dna.lighting.type}? (true = good)` : ''}

{
  "text_absent": boolean,
  "subject_preserved": boolean,
  "lighting_consistent": boolean,
  "composition_balanced": boolean,
  "no_artifacts": boolean,
  ${dna ? '"style_matches_dna": boolean,' : ''}
  "issues": ["string — describe any specific issues found"]
}`
}
```

---

## 🖼 STAGE 6: TEXT RENDERING — ESPECIFICAÇÃO COMPLETA

```typescript
// src/features/editor/engine/textRenderer.ts

interface TextRenderConfig {
  imageBase64: string
  texts: {
    headline?: string
    subheadline?: string
    cta?: string
  }
  style: {
    headlineFont: string      // Google Font name
    bodyFont: string          // Google Font name
    headlineColor: string     // hex
    accentColor: string       // hex — para palavra de destaque ou CTA
    textPosition: TextPosition
    blendMode?: BlendMode     // para integração visual
  }
  canvas: {
    width: number
    height: number
  }
}

// Blend modes disponíveis para ambientação do texto
type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light'

// O renderer monta um HTML, renderiza via canvas API do browser,
// e exporta PNG final combinando imagem base + textos
async function renderTextOnImage(config: TextRenderConfig): Promise<string> {
  // Criar canvas do tamanho correto
  // Desenhar imagem base
  // Calcular posição dos textos baseada em textPosition
  // Aplicar overlay escuro na zona de texto (garantir legibilidade)
  // Renderizar headline com font-face correto + efeitos (shadow, stroke)
  // Renderizar subheadline + CTA
  // Exportar como PNG base64
}
```

---

## 🗂 ESTRUTURA DE ARQUIVOS A CRIAR/MODIFICAR

```
supabase/functions/generate-image/
  ├── index.ts                    MODIFICAR — orquestrar os 6 stages
  ├── visionAnalysis.ts           CRIAR — Stage 1 (Vision First)
  ├── smartPromptCompiler.ts      CRIAR — Stage 2 (substitui compiler atual)
  ├── preprocessing.ts            CRIAR/MODIFICAR — Stage 3
  ├── qualityAnalysis.ts          CRIAR — Stage 5
  ├── providers/
  │   ├── gemini.ts               CRIAR/MODIFICAR — Stage 4 Gemini
  │   └── replicate.ts            CRIAR/MODIFICAR — Stage 4 Replicate
  └── types.ts                    CRIAR — todas as interfaces

src/features/editor/engine/
  ├── textRenderer.ts             CRIAR/MODIFICAR — Stage 6
  └── visionDNADisplay.ts         CRIAR — UI que mostra o DNA extraído ao usuário
```

---

## 🔢 ORDEM DOS DIFFS — DO MAIS IMPORTANTE AO MENOS

```
DIFF VF.1 — Types (base de tudo)
  Criar types.ts com todas as interfaces deste documento
  Sem lógica, só tipos — garante que o TypeScript não quebra nos próximos diffs

DIFF VF.2 — Vision Analysis (Stage 1)
  Criar visionAnalysis.ts
  Implementar analyzeReference() e analyzeSubject()
  Usar Gemini Flash (não o Nano Banana — economizar custo aqui)
  Testar: enviar a imagem do poster verde → deve retornar DNA correto

DIFF VF.3 — Smart Prompt Compiler (Stage 2)
  Criar smartPromptCompiler.ts
  Implementar todos os builders
  Regra: se DNA existe → usar DNA. Presets são fallback apenas.
  Testar: compilar com DNA do poster verde → prompt deve mencionar verde neon, rocks, energy

DIFF VF.4 — Preprocessing (Stage 3)
  Atualizar preprocessing.ts
  Garantir: subject sem fundo, upscale, padding
  Garantir: reference resized corretamente por provider

DIFF VF.5 — Gemini Provider com payload correto (Stage 4A)
  Reescrever providers/gemini.ts
  Subject como inlineData real
  Reference como inlineData real (segunda imagem)
  Aspect ratio correto no generationConfig
  Testar: geração com referência → resultado DEVE ter paleta da referência

DIFF VF.6 — Replicate Provider com payload correto (Stage 4B)
  Reescrever providers/replicate.ts
  Subject como data URI no campo image
  Polling correto com timeout
  Testar: fallback funciona quando Gemini falha

DIFF VF.7 — Orquestrador principal (index.ts)
  Conectar todos os stages em sequência
  Stage 1 → 2 → 3 → 4 → 5 → 6
  Retry automático se score < 70 (troca provider)
  Meta completo no response

DIFF VF.8 — DNA Display no frontend
  Componente que mostra o que o sistema entendeu da referência
  "✦ Entendemos sua referência" com itens extraídos
  Usuário pode confirmar, editar ou ignorar
  Se editar: campos editáveis que sobrescrevem o DNA

DIFF VF.9 — Preview do subject após upload
  Miniatura imediata após seleção do arquivo
  Indicador de preprocessing em background
  "✓ Subject analisado" quando SubjectProfile estiver pronto
```

---

## 📋 PROMPT PARA O CLAUDE CODE COMEÇAR

```
Leia TODOS estes arquivos antes de qualquer implementação:
- CLAUDE.md
- CREATYNG_VISION_FIRST.md  ← este arquivo
- CREATYNG_MOTOR_PLAN.md
- CREATYNG_VISUAL_SPEC.md

Este documento descreve o core do produto — o motor de geração.
O que existe hoje não funciona porque:
1. A referência não é passada como imagem real para o provider
2. O prompt é compilado sem inteligência (concatenação de strings)
3. As cores não chegam nos providers de forma eficaz
4. Não existe análise de qualidade pós-geração

Vamos reconstruir o pipeline do zero, diff a diff.

Antes de qualquer implementação:
1. Leia o arquivo atual supabase/functions/generate-image/index.ts
2. Leia os providers atuais (gemini, replicate, ou equivalente)
3. Leia o prompt compiler atual
4. Me mostre um diagrama do que existe hoje vs o que precisamos construir
5. Identifique quais arquivos precisam ser criados e quais modificados

Não implemente nada ainda. Só mapeie.
Após o mapeamento e minha aprovação: começamos pelo DIFF VF.1 (types).
```

---

## ⚠️ REGRAS INEGOCIÁVEIS PARA ESTES DIFFS

1. **Referência NUNCA como texto no prompt** — sempre como imagem real no payload
2. **DNA prevalece sobre preset** — se há referência, o preset é apenas fallback
3. **Aspect ratio no provider** — nunca gerar 1:1 quando o usuário pediu 9:16
4. **IA não gera texto** — nunca incluir typography block no prompt da IA
5. **Negative prompt sempre presente** — no final de toda chamada
6. **Qualidade verificada antes de entregar** — nunca entregar imagem com score < 70 sem tentar retry
7. **Um diff por vez** — não misturar VF.1 com VF.2 nunca
