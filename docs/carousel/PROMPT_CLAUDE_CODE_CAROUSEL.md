# 🎬 PROMPT PARA CLAUDE CODE: Implementar Motor de Carrossel no Creatyng

## CONTEXTO DO PROJETO

Você está trabalhando no **Creatyng** — um SaaS premium de criação visual com IA.

**Arquivos de referência obrigatória:**
- `CLAUDE.md` — contexto permanente do projeto
- `CREATYNG_MOTOR_PLAN.md` — arquitetura do motor de imagens
- `src/app/create/studio/types.ts` — tipos do Studio

---

## 🎯 OBJETIVO: NOVA FEATURE — MOTOR DE CARROSSEL

### O que é:
Um **novo tipo de criativo** no Studio: gera um **carrossel (6-12 slides) em sequência** — cada slide com perspectiva/ângulo diferente, mas visual coeso.

**Exemplo:**
```
Usuário faz: Upload de produto + escolhe "Product 360" + clica "Run"
Sistema entrega: 6 imagens diferentes do mesmo produto
(frontal, lado, detalhe, lifestyle, etc) - tudo com mesmo estilo
Prontas para Instagram Carousel
```

---

## 📋 REQUISITOS

### Novo:
- Node `carousel_gen` no Studio
- Inputs: Subject + Preset + CarouselType + SlideCount
- Output: Array de 6-12 imagens base (sem texto)

### Reutiliza:
- BG Removal (preprocess 1x)
- Reference Analyzer (estilo)
- Image Gen (loop 6x com prompts diferentes)
- Color Grade (unificar paleta)
- Text Overlay (textos em todos)

---

## 🔧 IMPLEMENTAÇÃO: 3 FASES

### FASE 1: Entendimento (SEM CÓDIGO)
Responda:

1. Onde está executeNode em engine.ts?
2. Como um node acessa outputs de outros nodes?
3. Existe fallback Gemini → Replicate codificado?
4. Text overlay usa Canvas 2D ou HTML?
5. Qual arquivo rota entre providers?

### FASE 2: Design (PLANEJAMENTO)
Você propõe:

1. Estrutura carousel_gen em types.ts
2. Função executeCarouselNode (pseudocódigo)
3. UI do node (inputs + preview)
4. Como reutiliza image_gen para 6 slides

### FASE 3: Implementação (4 DIFFS)

**DIFF 1:** Registrar carousel_gen em types.ts + UI inputs
**DIFF 2:** executeCarouselNode em engine.ts (loop de 6)
**DIFF 3:** Preview inline (thumbnail gallery)
**DIFF 4:** Text overlay multi-slide + export

---

## 📊 TEMPLATES CAROUSEL

```
product_360: "Frontal, Side 45°, Close-up, Elevated, Low angle, Lifestyle"
lifestyle: "In-hand, On-desk, In-action, Portrait, Flat-lay, Packaging"
beauty: "Product, Swatches, Application, Before-after, Flatlay, Portrait"
fashion: "Full-body, Detail, Styled, Movement, Flat-lay, Lifestyle"
food: "Plated, Close-up, Ingredients, Eating, Styled, Lifestyle"
```

---

## 🚀 COMECE AGORA

```
1. Leia CLAUDE.md + CREATYNG_MOTOR_PLAN.md
2. Responda as 5 perguntas diagnósticas da FASE 1
3. Proponha arquitetura (FASE 2)
4. Implemente DIFF por DIFF (FASE 3)

Tempo: 2-3 dias
Resultado: Feature nova + receita (18 créditos por carrossel)
```

---

## 💡 INSIGHTS

- ✅ Reutiliza 90% do motor existente
- ✅ Novo node isolado (zero impacto)
- ✅ Cada slide = 3 créditos (6 slides = 18)
- ✅ Pronto em 2-3 dias
