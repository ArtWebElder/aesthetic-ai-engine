# CREATYNG — ISSUES PRIORIZADOS (SOCIAL POST + MOTOR)

> Leia junto com CLAUDE.md e CREATYNG_MOTOR_PLAN.md.
> Execute um issue por vez. Não agrupe issues diferentes num mesmo diff.

---

## 🚨 ISSUE 1 — DOIS SISTEMAS DE TEXTO CONFLITANDO (CRÍTICO)

**Problema:**
O sistema está gerando texto de duas formas ao mesmo tempo:
1. IA gera texto integrado à cena (grunge, textura, ambientado) — fica atrás
2. HTML/CSS renderer coloca texto branco limpo por cima — fica na frente

Resultado: dois textos sobrepostos, um destruindo o outro.

**Fix:**
Escolher UMA abordagem por geração. Para o MVP:
- IA gera o cenário/fundo/subject **SEM texto** (adicionar `"Do NOT generate any text, letters, words, numbers or typography in the image"` como instrução hard no prompt)
- HTML/CSS renderer é o único responsável pelo texto final
- Remover qualquer instrução de typography do prompt enviado à IA

**Arquivo provável:** `supabase/functions/generate-image/index.ts` ou `promptCompiler.ts`

**Validação:** Imagem gerada pela IA não deve conter nenhum texto. Texto só aparece após o renderer.

---

## 🚨 ISSUE 2 — FORMATO SEMPRE GERA 1:1 (CRÍTICO)

**Problema:**
Independente do formato escolhido pelo usuário (16:9, 9:16, 4:5), a imagem gerada sempre sai 1:1.

**Fix:**
- Mapear onde o aspect ratio é definido no payload da API
- Garantir que o formato escolhido no frontend chega corretamente ao provider
- Gemini e Replicate aceitam aspect_ratio como parâmetro — verificar se está sendo passado

**Parâmetros corretos por formato:**
```typescript
const ASPECT_RATIOS = {
  square:    { gemini: '1:1',  replicate: '1:1',  width: 1080, height: 1080 },
  portrait:  { gemini: '9:16', replicate: '9:16', width: 1080, height: 1920 },
  landscape: { gemini: '16:9', replicate: '16:9', width: 1920, height: 1080 },
  banner:    { gemini: '16:9', replicate: '16:9', width: 1920, height: 1080 },
  story:     { gemini: '9:16', replicate: '9:16', width: 1080, height: 1920 },
}
```

**Validação:** Gerar com formato 9:16 deve retornar imagem 1080x1920.

---

## 🔴 ISSUE 3 — REFERÊNCIA VISUAL NÃO ESTÁ PESANDO

**Problema:**
A reference image está sendo passada com weight 55/100 mas o resultado final ignora o estilo dela.
Provavelmente está sendo passada como URL em texto no prompt, não como imagem real.

**Fix:**
- Verificar se a reference image está sendo passada como `image` no payload da API (base64 real)
- Gemini suporta múltiplas imagens de entrada: subject image + style reference image
- Replicate Flux Kontext também suporta image reference
- Separar claramente: `subjectImage` (preservar identidade) vs `styleReferenceImage` (só estilo/lighting/mood)

**Prompt instruction para reference:**
```
Style reference image attached: extract ONLY the lighting style, color grading, 
atmospheric mood, and texture quality. Do NOT copy people, faces, or specific objects.
Apply extracted style to the new scene. Style weight: 70/100.
```

**Validação:** Gerar com foto de referência dark/blue deve resultar em imagem dark/blue mesmo com subject diferente.

---

## 🔴 ISSUE 4 — PRESETS EXCESSIVOS ENCHENDO O PROMPT

**Problema:**
Muitos presets ativados ao mesmo tempo geram prompt gigante com instruções contraditórias.
Ex: "glassmorphism" + "drama" + "neon" + "foggy" ao mesmo tempo = IA fica confusa e gera algo genérico.

**Fix — Regra dos presets:**
- Máximo 3 presets ativos ao mesmo tempo
- Presets se dividem em categorias que não podem acumular:
  ```
  CATEGORIA A (escolha 1): Estilo base
    → Drama/Impact | Clean/Premium | Dark/Cinematic | Neon/Futuristic | Editorial/Magazine
  
  CATEGORIA B (escolha 1): Atmosfera  
    → Fog/Smoke | Particles/Sparks | Glass Shards | Clean/None | Rain/Wet
  
  CATEGORIA C (escolha 1): Iluminação
    → Rim Purple | Rim Blue/Cyan | Natural Soft | Hard Studio | Neon Colored
  ```
- Cada categoria tem opção "Nenhum / Choose" que não adiciona nada ao prompt
- Presets de categorias diferentes se somam (Drama + Fog + Rim Blue = válido)
- Presets da mesma categoria se excluem (não pode ter Drama + Clean ao mesmo tempo)

**UI change:** Seletores em grupos visuais, não lista solta. Radio button por grupo.

---

## 🟡 ISSUE 5 — FONTES GOOGLE + PREVIEW VISUAL

**Problema:**
Usuário não tem controle sobre tipografia. Texto renderizado com fonte padrão do sistema.

**Fix:**
- Integrar Google Fonts API para carregar preview das fontes
- Criar seletor de fonte com preview visual (o nome da fonte renderizado nela mesma)
- Máximo 2 fontes por criativo: Fonte Principal (headline) + Fonte Secundária (subheadline/CTA)
- Sugestões por estilo:

```typescript
const FONT_SUGGESTIONS = {
  drama: ['Anton', 'Bebas Neue', 'Black Han Sans', 'Oswald'],
  clean: ['Inter', 'Montserrat', 'Raleway', 'Poppins'],
  dark:  ['Cinzel Decorative', 'UnifrakturMaguntia', 'MedievalSharp', 'Pirata One'],
}
```

- Fontes carregadas dinamicamente via `@import` Google Fonts
- Preview mostra "EU QUERIA SER FORTE" na fonte escolhida

---

## 🟡 ISSUE 6 — POSICIONAMENTO DO TEXTO

**Problema:**
Usuário não controla onde o texto aparece na imagem. Sempre vai para posição default.

**Fix — 5 posições de texto:**
```
TOP         → texto no terço superior, subject no centro/baixo
BOTTOM      → texto no terço inferior (default atual)
LEFT        → texto na metade esquerda, subject na direita
RIGHT       → texto na metade direita, subject na esquerda
OVER        → texto sobre o subject (centralizado, precisa de overlay escuro)
```

- Cada posição instrui a IA sobre onde deixar espaço escuro/neutro para o texto
- Composition instruction muda no prompt conforme posição escolhida:
  ```
  TOP:    "Keep upper 35% of frame dark and clean for text overlay. Subject in lower 2/3."
  BOTTOM: "Keep lower 35% of frame dark and clean for text overlay. Subject in upper 2/3."
  LEFT:   "Keep left 45% of frame dark and clean for text overlay. Subject right-aligned."
  RIGHT:  "Keep right 45% of frame dark and clean for text overlay. Subject left-aligned."
  OVER:   "Subject centered. Ensure subject area has contrast variation for text readability."
  ```

---

## 🟡 ISSUE 7 — SISTEMA DE CORES (PRIMÁRIA / SECUNDÁRIA / NEUTRA)

**Problema:**
Seletor de cores atual não instrui a IA de forma eficaz sobre onde aplicar cada cor.

**Fix:**
```typescript
interface ColorSystem {
  primary: string;    // cor dominante da cena e accent do texto
  secondary: string;  // cor dos efeitos, partículas, rim light secundário
  neutral: string;    // cor do fundo/sombras
  extras: string[];   // cores adicionais (botão "+more colors")
}
```

- Cor primária → instrui rim light principal, accent da tipografia, elementos de destaque
- Cor secundária → partículas, reflexos, detalhes
- Neutra → tom do fundo escuro, área de texto

**Prompt instruction:**
```
Color palette: primary accent #[PRIMARY] for rim lighting and typography highlight,
secondary accent #[SECONDARY] for particles and reflections,
neutral base #[NEUTRAL] for background shadow areas.
```

- Botão "+ Adicionar cor" expande para campo extra com label descritivo

---

## 🟡 ISSUE 8 — SEPARAR "CONTEXTO" DE "DETALHES EXTRAS"

**Problema:**
Usuário não entende a diferença entre os dois campos. Ambos parecem fazer a mesma coisa.

**Fix — Definição clara:**

**Campo: "Sobre o criativo" (antigo Contexto)**
→ Quem são as pessoas? O que está acontecendo? Qual o nicho?
→ Alimenta o SCENE prompt
→ Exemplo: "Casal fitness, ele treina ela ri, energia motivacional"

**Campo: "Elementos extras" (antigo Detalhes Extras)**
→ Objetos físicos, props, assets que devem aparecer
→ Alimenta o ASSETS section do prompt
→ Exemplo: "Halteres ao fundo, garrafa de água, tênis Nike visível"

**Placeholders no campo que explicam o uso:**
```
Sobre o criativo: "Ex: casal comemorando, fundo de academia, energia alta..."
Elementos extras: "Ex: fogos azuis, fragmentos de vidro, névoa no chão..."
```

---

## 🟡 ISSUE 9 — ZOOM/PAN DO CANVAS

**Problema:**
Zoom atual não funciona bem. Difícil navegar no canvas.

**Fix recomendado:**
- Usar `transform: scale()` com `transform-origin: center center` no container da imagem
- Controles: botões +/- na tela + scroll do mouse + pinch no mobile
- Zoom range: 25% até 300%
- Botão "Fit to screen" que centraliza e ajusta para o container
- Mini-mapa opcional no canto inferior direito para imagens grandes

```typescript
const ZOOM_LEVELS = [25, 33, 50, 67, 75, 100, 125, 150, 200, 300]
// Scroll: incrementa/decrementa no array
// Botões: mesmo comportamento
// Double-click: zoom 100% centralizado no ponto clicado
```

---

## 🔵 ISSUE 10 — EXPORT SEM TEXTO DA IA (MODO LIMPO)

**Problema:**
Quando exportar, o usuário quer a imagem com texto do renderer, não com texto da IA.
Mas hoje os dois textos se sobrepõem.

**Fix (após resolver Issue 1):**
Após Issue 1 resolvido (IA não gera texto), o export sempre entrega:
- Imagem base da IA (sem texto)
- Texto renderizado via HTML/CSS por cima
- PNG final 2K com tudo composto

Opção extra: "Exportar sem texto" (só a imagem base) para quem quer usar em outro editor.

---

## 🔵 ISSUE 11 — AGENTES PRÉ-MOLDADOS (INSPIRAÇÃO PLETOR.AI)

**O que o Pletor.ai tem que queremos implementar:**
- Quick product shot (foto de produto rápida)
- UGC product video
- Ads Localizer + Resizer
- Multi-Angle Photo Reshoot
- Ad Format Resizer
- Static Ad Animator

**Como implementar no Creatyng (diferente do Pletor):**
- Não como agentes separados com editor diferente
- Como **"Modos de uso"** dentro do mesmo editor, com campos pré-configurados
- Usuário escolhe: Social Post | Ecom Banner | Photoshoot | [futuro: UGC | Resizer | Localizer]
- Cada modo carrega presets, campos e configurações específicas
- Mesmo motor de geração, interface adaptada por modo

**Roadmap de modos:**
```
MVP (agora):     Social Post | Ecom Banner | Photoshoot
V2 (próximo):    Ads Resizer (multi-formato) | Ads Localizer (multi-idioma)
V3 (futuro):     UGC Creator | Product Shot | Multi-angle
```

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

```
SEMANA 1 (motor funcionando):
  → Issue 1: Eliminar duplo texto
  → Issue 2: Formato/aspect ratio correto
  → Issue 3: Reference image como imagem real

SEMANA 2 (UX melhorada):
  → Issue 4: Presets por categoria (máximo 3)
  → Issue 6: Posicionamento do texto
  → Issue 8: Separar campos contexto/extras

SEMANA 3 (polimento):
  → Issue 5: Google Fonts + preview
  → Issue 7: Sistema de cores
  → Issue 9: Zoom do canvas
  → Issue 10: Export limpo
```

---

## 📝 PROMPT PARA O CLAUDE CODE COMEÇAR

```
Leia o CLAUDE.md, CREATYNG_MOTOR_PLAN.md e CREATYNG_ISSUES.md.

Vamos resolver o Issue 1 primeiro: o sistema está gerando texto de duas formas
ao mesmo tempo (IA gera texto integrado + HTML/CSS coloca texto por cima).
Resultado: dois textos sobrepostos destruindo a imagem.

Antes de implementar:
1. Mostre onde o typography block está sendo adicionado ao prompt da IA
2. Mostre onde o HTML/CSS renderer aplica o texto
3. Confirme que entendeu o fix: IA não deve gerar NENHUM texto,
   toda tipografia vem exclusivamente do renderer

Não implemente nada ainda. Só mapeie.
```
