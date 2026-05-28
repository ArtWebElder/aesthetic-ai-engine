# CREATYNG — PLANO DE EXECUÇÃO DO MOTOR (DIFF A DIFF)

> Leia este arquivo antes de qualquer task de geração.
> Objetivo: sair de "imagens aleatórias" para "criativos prontos para uso".

---

## 🔍 DIAGNÓSTICO — POR QUE ESTÁ PÉSSIMO HOJE

### Problema 1 — Subject não está sendo incorporado
**Causa:** A imagem do subject provavelmente está sendo passada como URL em texto no prompt,
não como imagem de entrada real no modo img2img.
**Efeito:** A IA ignora o subject e gera uma pessoa/produto genérico.
**Fix:** Passar subject como base64 no campo correto da API (img2img real).

### Problema 2 — Referência visual não serve de nada
**Causa:** A referência de estilo está sendo descrita em texto ("estilo dramático com fogo"),
não passada como image reference no modelo.
**Efeito:** A IA interpreta o texto de forma aleatória.
**Fix:** Passar referência como style_image separado da subject_image.

### Problema 3 — Texto gerado pela IA livre = erro garantido
**Causa:** O prompt pede para a IA "escrever o texto na imagem".
**Efeito:** Letras erradas, palavras inventadas, posicionamento aleatório.
**Fix:** IA gera APENAS o fundo/cenário/atmosfera sem texto.
Texto entra via HTML/CSS renderer por cima com controle total.
(Isso é exatamente o que o Design Builder fazia nas imagens de referência.)

### Problema 4 — Sem instrução de composição
**Causa:** O prompt não define onde o subject fica, qual o enquadramento, onde o texto vai.
**Efeito:** Composição aleatória, subject centralizado sempre, sem espaço para texto.
**Fix:** Prompt deve incluir instrução explícita de composição e layout.

### Problema 5 — Sem preprocess do subject
**Causa:** A imagem do usuário vai crua para a IA (fundo, tamanho errado, proporção ruim).
**Efeito:** A IA "briga" com o fundo do subject e gera resultado inconsistente.
**Fix:** Preprocess obrigatório antes de chamar qualquer provider.

---

## 🎯 OBJETIVO DO MVP (O MÍNIMO QUE PRECISA FUNCIONAR)

```
Usuário faz:
1. Upload do subject (pessoa, produto, logo, carro, qualquer coisa)
2. Escolhe um preset de estilo (Drama / Clean / Dark)
3. Digita: Headline + Subheadline + CTA
4. Clica em "Gerar"

Sistema entrega:
- Imagem gerada pela IA com subject incorporado no cenário correto
- Texto renderizado por HTML/CSS por cima (legível, sem erro, ambientado)
- Export 2K pronto para uso
```

---

## 📋 ORDEM DOS DIFFS (DO ZERO AO MVP)

### DIFF 01 — Preprocess do subject (base de tudo)
**Arquivo:** `supabase/functions/generate-image/preprocess.ts` (criar)
**O que faz:**
- Recebe a imagem do subject em base64
- Remove fundo (alpha composite → fundo neutro #808080)
- Upscale para minSide >= 1024px
- Centraliza e adiciona padding proporcional
- Retorna base64 processado + flags + sha256
**Por que primeiro:** Sem preprocess, todos os outros diffs são inúteis.

```typescript
// Interface esperada
interface PreprocessResult {
  base64: string;
  width: number;
  height: number;
  flags: ('alpha_removed' | 'upscaled' | 'padded' | 'centered')[];
  sha256: string;
}
```

---

### DIFF 02 — Pipeline img2img real com Gemini Nano Banana Pro
**Arquivo:** `supabase/functions/generate-image/providers/gemini.ts`
**O que faz:**
- Recebe: subject_base64 (preprocessado) + style_prompt + composition_instructions
- Chama Gemini `gemini-3-pro-image-preview` em modo EDIT/IMG2IMG
- Passa subject como imagem de entrada real (não URL em texto)
- Prompt interno estruturado (não escrito pelo usuário)
- Retorna: imagem base gerada + meta

**Prompt interno estruturado (nunca exposto ao usuário):**
```
You are a professional marketing creative director.

TASK: Place the provided subject into a new cinematic scene.

SUBJECT: The uploaded image is the subject. Preserve it exactly.
Maintain identity, features, proportions. Do not alter the subject.

SCENE: [SCENE_PROMPT compilado pelo sistema]

COMPOSITION: [COMPOSITION_RULES do preset escolhido]
- Subject position: [left|center|right] third
- Subject size: [full-body|portrait|close-up]
- Leave [top|bottom] 35% of frame for text overlay area
- Text area background: darker, lower contrast, text-ready

LIGHTING: [LIGHTING do preset]

STYLE: [STYLE_PROMPT do preset]

CRITICAL RULES:
- Do NOT generate any text, letters, words or numbers in the image
- Do NOT add watermarks
- Leave clear space at [POSITION] for text overlay
- Subject must be the clear focal point
- Photorealistic, ultra-detailed, 8K quality
- No plastic skin, no dead eyes, anatomically correct
```

**Notar:** "Do NOT generate any text" — a IA gera APENAS o visual.

---

### DIFF 03 — Fallback Replicate FLUX Kontext Pro
**Arquivo:** `supabase/functions/generate-image/providers/replicate.ts`
**O que faz:**
- Mesmo contrato do Gemini provider
- Chama `black-forest-labs/flux-kontext-pro` via Replicate API
- Polling até completar (timeout 120s)
- Retorna mesma interface de resposta

---

### DIFF 04 — Roteamento inteligente no generate-image
**Arquivo:** `supabase/functions/generate-image/index.ts`
**O que faz:**
- Recebe payload do frontend
- Roda preprocess (Diff 01)
- Tenta Gemini (Diff 02)
- Se falhar → tenta Replicate (Diff 03)
- Se ambos falharem → retorna erro `generation_failed` com detalhes
- Retorna imagem base + meta completo

```typescript
interface GenerationPayload {
  subjectBase64: string;          // imagem do subject
  preset: 'drama' | 'clean' | 'dark';
  format: 'square' | 'portrait' | 'landscape' | 'banner';
  textPosition: 'bottom' | 'top' | 'left' | 'right';
  // textos NÃO vão para a IA — vão para o renderer
}

interface GenerationResponse {
  imageBase64: string;            // imagem sem texto
  meta: {
    provider: string;
    preset: string;
    preprocessFlags: string[];
    generationMs: number;
  }
}
```

---

### DIFF 05 — HTML/CSS Renderer (texto perfeito por cima)
**Arquivo:** `src/services/renderer/textRenderer.ts` (frontend) ou render-service separado
**O que faz:**
- Recebe: imageBase64 + { headline, subheadline, cta } + preset + textPosition
- Monta canvas HTML com:
  - Background: imageBase64
  - Overlay escuro semi-transparente na área do texto (garante legibilidade)
  - Headline: fonte bold, tamanho proporcional ao canvas
  - Subheadline: fonte regular, menor
  - CTA: outline button ou texto com underline
- Exporta PNG final 2K

**Estilos por preset:**

```css
/* DRAMA */
.headline-drama {
  font-family: 'Anton', 'Impact', sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  color: #FFFFFF;
  text-shadow: 0 0 30px rgba(123, 47, 255, 0.8),
               2px 2px 0px #000,
               -2px -2px 0px #000;
  letter-spacing: -0.02em;
}
.accent-drama { color: #7B2FFF; }

/* CLEAN */
.headline-clean {
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  color: #000000;
  letter-spacing: -0.03em;
}

/* DARK */
.headline-dark {
  font-family: 'Cinzel Decorative', serif;
  font-weight: 700;
  text-transform: uppercase;
  color: #FFFFFF;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
  letter-spacing: 0.05em;
}
```

---

### DIFF 06 — Presets de estilo no frontend (o que o usuário escolhe)

**3 presets iniciais com tudo pré-configurado:**

```typescript
const PRESETS = {
  drama: {
    name: "Drama / Impact",
    scenePrompt: "cinematic dramatic scene, intense purple magenta rim lighting from behind, bokeh background, sparks and embers particles in air, high contrast, deep shadows, professional film photography",
    compositionRules: "subject in center-right, full portrait, bottom 35% darker for text",
    lightingPrompt: "3-point lighting: soft key front, strong purple rim back-left, dark fill right",
    textPosition: "bottom",
    accentColor: "#7B2FFF",
  },
  clean: {
    name: "Clean / Premium",
    scenePrompt: "clean professional setting, soft natural window light, near-white or light gray background, architectural space, high-end studio feel, no particles no effects",
    compositionRules: "subject right 60%, left 40% negative space for text, bipartite layout",
    lightingPrompt: "flat soft natural light, no harsh shadows, professional corporate photography",
    textPosition: "left",
    accentColor: "#000000",
  },
  dark: {
    name: "Dark / Cinematic",
    scenePrompt: "dark cinematic scene, deep perspective corridor or tunnel background, cold cyan-blue rim lighting, god rays, atmospheric depth, moody professional photography",
    compositionRules: "subject centered, portrait close-up, top 20% and bottom 20% for text",
    lightingPrompt: "cold frontal key light, cyan-blue rim lights both sides, very dark fill, deep shadows",
    textPosition: "top-bottom",
    accentColor: "#00E5FF",
  }
}
```

---

### DIFF 07 — Interface do usuário simplificada

**O que o usuário vê (máximo de campos):**
```
[ Upload do Subject ]          ← foto/produto/logo

[ Escolha o Estilo ]
  ○ Drama / Impact
  ○ Clean / Premium  
  ○ Dark / Cinematic

[ Formato ]
  ○ Post Quadrado (1:1)
  ○ Stories (9:16)
  ○ Banner (16:9)

[ Textos ]
  Headline:    [________________]
  Subheadline: [________________]
  CTA:         [________________]

[ GERAR CRIATIVO ]
```

**O que o usuário NÃO vê:**
- Prompt
- Parâmetros de IA
- Strength/weight sliders (para o MVP)
- Configurações técnicas

---

## 🔄 FLUXO COMPLETO DO MVP

```
1. Usuário faz upload do subject
2. Frontend faz preprocess (remove fundo, normaliza tamanho)
3. Usuário escolhe preset + formato + digita textos
4. Clica "Gerar"
5. Frontend envia para /generate-image:
   { subjectBase64, preset, format, textPosition }
   (textos NÃO vão para a IA)
6. Backend:
   a. Roda preprocess final
   b. Compila scene prompt + composition baseado no preset
   c. Chama Gemini img2img → recebe imagem base (SEM TEXTO)
   d. Se falhar → Replicate → recebe imagem base
   e. Retorna imageBase64 + meta
7. Frontend recebe imageBase64
8. Renderer sobrepõe headline + subheadline + CTA com CSS correto para o preset
9. Exporta PNG final 2K
10. Usuário vê resultado pronto
```

---

## ⚡ ORDEM DE PRIORIDADE PARA COMEÇAR HOJE

```
PRIORITY 1 (sem isso nada funciona):
→ DIFF 01: Preprocess do subject
→ DIFF 02: Gemini img2img real

PRIORITY 2 (garante o MVP básico):
→ DIFF 04: Roteamento
→ DIFF 05: HTML/CSS Renderer com textos

PRIORITY 3 (completa o produto):
→ DIFF 03: Replicate fallback
→ DIFF 06: Presets no frontend
→ DIFF 07: UI simplificada
```

---

## 📝 PROMPT PARA INICIAR NO CLAUDE CODE

Cole isso no Claude Code para começar:

```
Leia o CLAUDE.md e o CREATYNG_MOTOR_PLAN.md.

Diagnóstico atual: o motor está gerando imagens aleatórias porque:
1. Subject não está sendo passado como img2img real
2. Referência visual não está conectada ao provider
3. IA está tentando gerar texto (erros garantidos)
4. Sem preprocess do subject

Antes de implementar, me mostre:
1. Como o subject está sendo passado hoje para a API do provider
2. Como o prompt está sendo montado hoje
3. Se existe preprocess ou não

Mostre os arquivos relevantes. Não implemente nada ainda.
```

Depois que ele mapear, execute um diff por vez começando pelo DIFF 01.
