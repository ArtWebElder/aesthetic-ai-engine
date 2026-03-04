# CREATYNG — CONTEXT PERMANENTE PARA O CLAUDE CODE

> Leia este arquivo inteiro antes de qualquer tarefa e confirme o estágio atual.
> Não implemente nada sem antes declarar: "Estamos no STAGE X. O próximo diff é Y."

---

## 🎯 O QUE É O CREATYNG

SaaS premium de criação visual com IA. O usuário preenche campos simples (headline, estilo, produto) e recebe na outra ponta uma imagem de nível agência — texto perfeito, layout profissional, sem cara de IA amadora.

**Frase central:** "Você joga os ingredientes. O motor entrega o bolo pronto."

**Mercado-alvo:** e-commerce, criadores, agências, social media managers — global (EN, PT-BR, ES).

---

## 🧩 AS 3 FEATURES CORE DO MVP

Essas são as únicas features que importam agora. Nada mais deve ser implementado antes delas estarem completas e testadas.

### 1. Ecom Banner
- Banners para e-commerce em tamanhos exatos (sem corte, sem distorção)
- Produto/logo preservado com fidelidade total (Strict Identity ON por padrão)
- Texto ambientado: tipografia real renderizada sobre a imagem, com textura e blend

### 2. Social Post
- Posts para redes sociais (Instagram, TikTok, Facebook)
- Headline + subheadline + CTA renderizados com HTML/CSS sobre base gerada pela IA
- Presets de estilo pré-moldados (usuário escolhe, não digita prompt)

### 3. Photoshoot
- Ensaio fotográfico ultra realista (pessoa, produto, marca, carro, comida, qualquer subject)
- Altíssima qualidade: sem cara de cera, sem distorção, iluminação cinematográfica
- Output 2K/4K, estilo controlado por presets

---

## 🔧 ARQUITETURA TÉCNICA

### Stack
- **Frontend:** React + TypeScript + Tailwind CSS + shadcn-ui (Vite)
- **Backend:** Supabase (Postgres + Storage + Edge Functions em Deno)
- **IA Engine:** Pipeline multi-modelo com roteamento inteligente
- **Render:** HTML/CSS server-side (Headless Chromium) para tipografia final — **PENDENTE (STAGE 3)**

### Pipeline de geração (como deve ser)
```
User Input (campos simples)
  ↓
Builder estruturado (spec JSON)
  ↓
Prompt Engine (compila spec → prompt interno)
  ↓
AI Generation (modelo escolhido automaticamente)
  ↓
Image Base (gerado pela IA — fundo + ambientação + efeitos visuais integrados)
  ↓
HTML/CSS Render (texto + logo + CTA por cima, com fontes reais) ← PENDENTE
  ↓
Export 2K / 4K
```

**Regra crítica:** texto nunca é gerado pela IA. A IA gera o fundo/ambientação/produto. O texto é renderizado com HTML/CSS por cima, com fontes reais, stroke, shadow, blend-mode.

**Regra crítica 2:** efeitos visuais (bokeh, vidro, névoa, neon) são DESCRITOS NO PROMPT para a IA gerar como parte da imagem. Não são CSS compostos por cima.

### Arquivos principais (fonte única de verdade)
- `src/features/editor/EditorPage.tsx` — editor principal
- `src/types/spec/index.ts` — tipos core do editor (source of truth)
- `src/types/index.ts` — tipos de UI/labels apenas (NÃO é o core)
- `supabase/functions/generate-image/index.ts` — Edge Function de geração (orquestrador)
- `supabase/functions/generate-image/providers/registry.ts` — roteamento de providers
- `supabase/functions/generate-image/providers/gemini-image.ts` — provider Gemini (primário strict)
- `supabase/functions/generate-image/providers/replicateFluxKontext.ts` — provider Replicate (fallback strict)
- `supabase/functions/generate-image/providers/replicate-flux.ts` — provider Replicate (text-to-image)
- `supabase/functions/generate-image/preprocess/subject.ts` — preprocess de imagem do subject
- `src/features/engine/prompt-compiler.ts` — compilador spec → prompt
- `src/features/editor/scene-presets.ts` — presets de cena com descriptions
- `src/features/editor/scene-moods.ts` — moods de cena
- `src/features/editor/scene-props.ts` — props de cena (bokeh, vidro, névoa etc.)
- `src/i18n/locales/en.json` — traduções EN
- `src/i18n/locales/pt-BR.json` — traduções PT-BR
- `src/i18n/locales/es.json` — traduções ES

---

## 🤖 PIPELINE DE IA (PROVIDERS) — STATUS ATUAL

### Strict Identity ON (padrão para Ecom Banner e Photoshoot)
1. **Primário:** Gemini (`gemini-3-pro-image-preview`) via Gemini API — modo IMG2IMG ✅ **IMPLEMENTADO**
2. **Fallback:** FLUX.1 Kontext Pro via Replicate (`replicateFluxKontext.ts`) ✅ **IMPLEMENTADO**
3. **Erro se ambos falharem:** `strict_identity_provider_unavailable` ✅ **IMPLEMENTADO**

### Strict Identity OFF (Social Post text-to-image)
- **Provider:** Replicate FLUX (`replicate-flux.ts`) via text-to-image ✅ **IMPLEMENTADO**

### Preprocess (antes de chamar qualquer provider no modo strict)
- Detectar alpha/transparência → compor fundo neutro (`#111827`) ✅ **IMPLEMENTADO**
- Upscale: minSide >= 1024px ✅ **IMPLEMENTADO**
- Padding e centralização (12% por padrão) ✅ **IMPLEMENTADO**
- SHA-256 hash determinístico ✅ **IMPLEMENTADO**
- Fallback: se `PREPROCESS_DECODE_ENABLED != "true"`, passa original sem transformar ✅ **IMPLEMENTADO**

### Variáveis de ambiente necessárias
- `GEMINI_API_KEY` — Google AI Studio
- `REPLICATE_API_TOKEN` — Replicate
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `GENS_BUCKET` (default: `generations-private`)
- `PREPROCESS_DECODE_ENABLED=true` — ativa pixel-level preprocess (opcional)
- `GCP_PROJECT_ID` / `GCP_SA_KEY_B64` — legacy Vertex (não usar mais)

### Response do backend inclui meta/debug
```json
{
  "generationId": "...",
  "signedUrl": "...",
  "provider": "gemini-nano-banana-pro",
  "meta": {
    "providerName": "gemini-nano-banana-pro | replicate-flux-kontext-pro",
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

## 🎨 FILOSOFIA DO PRODUTO (NÃO NEGOCIÁVEL)

1. **O usuário nunca vê prompt.** Ele preenche campos: headline, estilo, intensidade, subject. O sistema compila o prompt internamente.
2. **Texto perfeito é obrigação.** Nunca depender da IA para tipografia. O HTML/CSS renderer entrega texto com: fontes reais, stroke, shadow, glow, textura, blend-mode.
3. **Efeitos visuais pertencem à IA.** Bokeh, névoa, vidro, neon, sombra — são instruções de prompt, gerados pela IA como parte da imagem. Nunca CSS compostos por cima.
4. **Resultado na primeira tentativa.** O usuário clica em "Gerar" e recebe a imagem pronta. Sem iteração manual obrigatória.
5. **Qualidade acima de velocidade.** Latência maior é aceitável se o resultado for nível agência.
6. **Leigo consegue usar.** Máximo ~10 campos/botões por feature. Nada de configuração avançada exposta.

---

## 🌍 REGRAS DE I18N (PERMANENTES)

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

### Namespaces de keys
```
editor.*          editor.preset.*       editor.actions.*
editor.format.*   editor.debug.*        editor.generic.*
social.*          photoshoot.*          ecom.*          ambient.*
```

### Regra de ouro
Toda feature nova: primeiro cria a estrutura interna → depois aplica i18n → depois UX → depois otimiza.

---

## 🚦 ESTÁGIOS DO ROADMAP

```
STAGE 0 — Mapping         ✅ CONCLUÍDO  (CLAUDE.md criado, arquitetura mapeada)
STAGE 1 — Strict Providers ✅ CONCLUÍDO  (Gemini IMG2IMG + Replicate Kontext Pro + fallback)
STAGE 2 — Preprocess       ✅ CONCLUÍDO  (alpha, upscale 1024px, padding 12%, SHA-256 hash)
STAGE 3 — Renderer         ❌ PENDENTE   (HTML/CSS server-side para texto final)
STAGE 4 — Editor UX        🔧 EM CURSO   (canvas limpo, bugs ativos — ver seção abaixo)
STAGE 5 — MVP Polish       ❌ PENDENTE   (landing page, billing, testes)
```

### 🐛 BUGS ATIVOS NO STAGE 4 (a corrigir antes de avançar para STAGE 3)

1. **Canvas pré-poluído** — `spec-defaults.ts` define `headline`, `subheadline`, `ctaText`, `price` com valores default ("New Collection", "Shop now" etc). O canvas exibe esses textos mesmo antes de qualquer imagem ser gerada. **Fix:** zerar os defaults de content.

2. **Scene props com defaults ativos** — `scene-props.ts` define `SCENE_PROP_DEFAULTS` com `["floating_elements", "bokeh_lights"]` para social_post. Esses overlays CSS aparecem no canvas mesmo sem imagem, sem contexto. **Fix:** zerar defaults; usuário escolhe ativamente.

3. **Overlays CSS compostos sobre a imagem (abordagem errada)** — `overlay-library.tsx` e `renderSceneOverlays()` em `EditorPage.tsx` renderizam divs CSS (vidro, bokeh, névoa) por cima da imagem gerada. Isso cria camadas desconexas sem ambientação. **Fix:** remover a composição CSS; os scene props devem apenas influenciar o prompt para que a IA gere esses efeitos nativamente.

4. **`compositeAwareLine` no prompt-compiler** — instrui a IA a "preparar o fundo para overlays post-composite". Com a correção acima, esse conceito deixa de existir. **Fix:** remover o bloco `COMPOSITE_OVERLAY_PROPS` e `compositeAwareLine`.

---

## 📏 REGRAS DE EXECUÇÃO PARA O CLAUDE CODE

### Tamanho das tasks (CRÍTICO)
- ❌ Não: prompt que mexe em 10 arquivos diferentes
- ❌ Não: prompt microscópico que altera 1 string
- ✅ Sim: 1 objetivo claro, máximo 2 arquivos, 1 bloco lógico

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

## 📋 TEMPLATE DE PROMPT PADRÃO (use sempre)

```
You are working on Creatyng — a premium AI visual creation SaaS.

CURRENT STAGE: [STAGE X]
GOAL: [1 sentence describing the goal]
FILES ALLOWED TO MODIFY: [list max 2 files]

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

## ⚠️ ERROS COMUNS — NUNCA REPETIR

- Usar `src/features/auth/editor/EditorPage.tsx` como fonte principal (é só re-export)
- Misturar `src/types/index.ts` com `src/types/spec/index.ts` como source of truth
- Chamar IA diretamente sem passar pelo `aiEngineService` (wrapper obrigatório)
- Rodar Headless Chromium dentro de Supabase Edge (Deno não suporta) — usar render-service Node separado (Vercel/Railway/Render) ou Browserless
- Deixar texto de UI hardcoded em JSX
- Alterar `value` de qualquer option/enum
- Compor overlays CSS por cima da imagem gerada (efeitos visuais pertencem ao prompt/IA)
- Implementar features de STAGE futuro antes de resolver bugs do STAGE atual

---

## 🔒 REGRA DE OURO FINAL

> Se você (Claude Code) não tiver certeza do escopo, **pergunte antes de implementar**.
> Nunca assuma. Nunca expanda o escopo sozinho. Uma task por vez.
> Sempre declare o STAGE atual e o próximo diff antes de qualquer execução.
