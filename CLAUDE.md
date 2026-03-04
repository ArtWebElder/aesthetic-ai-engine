# CREATYNG — CONTEXT PERMANENTE PARA O CLAUDE CODE

> Cole este arquivo na raiz do repositório. O Claude Code lê automaticamente a cada sessão.
> Antes de qualquer tarefa, leia este arquivo inteiro e confirme o estágio atual.

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
- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Storage + Edge Functions em Deno)
- **IA Engine:** Pipeline multi-modelo com roteamento inteligente
- **Render:** HTML/CSS server-side (Headless Chromium) para tipografia final

### Pipeline de geração
```
User Input (campos simples)
  ↓
Builder estruturado (spec JSON)
  ↓
Prompt Engine (compila spec → prompt interno)
  ↓
AI Generation (modelo escolhido automaticamente)
  ↓
Image Base (gerado pela IA)
  ↓
HTML/CSS Render (texto + efeitos + composição)
  ↓
Export 2K / 4K
```

### Arquivos principais (fonte única de verdade)
- `src/features/editor/EditorPage.tsx` — EditorPage principal (auth/editor é só re-export)
- `src/types/spec/index.ts` — tipos core do editor (source of truth)
- `src/types/index.ts` — tipos de UI/labels apenas (NÃO é o core)
- `supabase/functions/generate-image/index.ts` — Edge Function de geração
- `src/i18n/locales/en.json` — traduções EN
- `src/i18n/locales/pt-BR.json` — traduções PT-BR
- `src/i18n/locales/es.json` — traduções ES

---

## 🤖 PIPELINE DE IA (PROVIDERS)

### Strict Identity ON (padrão para Ecom Banner e Photoshoot)
1. **Primário:** Gemini Nano Banana Pro (`gemini-3-pro-image-preview`) via Gemini API — modo EDIT/IMG2IMG
2. **Fallback:** FLUX.1 Kontext Pro via Replicate (`black-forest-labs/flux-kontext-pro`)
3. **Erro se ambos falharem:** `strict_identity_provider_unavailable`

### Preprocess obrigatório (antes de chamar qualquer provider no modo strict)
- Detectar alpha/transparência → compor fundo neutro
- Upscale: minSide >= 1024px
- Padding e centralização determinística
- Nunca pedir pro usuário "melhorar a imagem" — o preprocess resolve

### Variáveis de ambiente necessárias
- `GEMINI_API_KEY` — Google AI Studio
- `REPLICATE_API_TOKEN` — Replicate

### Response do backend deve sempre incluir meta/debug
```json
{
  "imageUrl": "...",
  "meta": {
    "providerName": "gemini_edit | replicate_kontext",
    "modeUsed": "img2img | text2img",
    "strictIdentity": true,
    "identityStrength": 90,
    "styleStrength": 45,
    "preprocessFlags": ["alpha_removed", "upscaled", "padded"],
    "preprocessedHash": "sha256...",
    "payloadKind": "gemini_edit | replicate_kontext"
  }
}
```

---

## 🎨 FILOSOFIA DO PRODUTO (NÃO NEGOCIÁVEL)

1. **O usuário nunca vê prompt.** Ele preenche campos: headline, estilo, intensidade, subject. O sistema compila o prompt internamente.
2. **Texto perfeito é obrigação.** Nunca depender da IA para tipografia. O HTML/CSS renderer entrega texto com: fontes reais, stroke, shadow, glow, textura, blend-mode.
3. **Resultado na primeira tentativa.** O usuário clica em "Gerar" e recebe a imagem pronta. Sem iteração manual obrigatória.
4. **Qualidade acima de velocidade.** Latência maior é aceitável se o resultado for nível agência.
5. **Leigo consegue usar.** Máximo ~10 campos/botões por feature. Nada de configuração avançada exposta.

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

## 🚦 ESTÁGIOS DO ROADMAP

```
STAGE 0 — Mapping         (mapeamento e diagnóstico)
STAGE 1 — Strict Providers (Gemini + Replicate conectados)
STAGE 2 — Preprocess       (alpha, upscale, padding)
STAGE 3 — Renderer         (HTML/CSS server-side)
STAGE 4 — Editor UX        (simplificação da interface)
STAGE 5 — MVP Polish       (landing page, billing, testes)
```

**Antes de qualquer tarefa:** informe em qual STAGE estamos e qual o próximo diff.

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

---

## 🔒 REGRA DE OURO FINAL

> Se você (Claude Code) não tiver certeza do escopo, **pergunte antes de implementar**.
> Nunca assuma. Nunca expanda o escopo sozinho. Uma task por vez.
