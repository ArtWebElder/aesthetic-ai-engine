---
feature: generate
title: Card de Citação
tiers: [pro]
status: pro-live          # roda hoje via background_gen (text-to-image)
anon: false
flow_id: quote-card       # PRESET_FLOWS['quote-card'] no Studio
updated: 2026-05-31
---

# Card de Citação (Quote / Post Social)

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Gera um **fundo abstrato/gradiente elegante** com IA e renderiza a **frase + autor por cima via
Canvas** — texto nítido, controlado. Formato quadrado 1080×1080 (Instagram/feed).

## Como funciona (pipeline)
`Prompt do fundo` → `Gerar Fundo (1080×1080, text-to-image)` → `Overlay de Texto (frase + autor)` →
`Export (PNG)`. O `Gerar Fundo` produz só o cenário (sem texto); a tipografia entra depois.

## Melhor input (pra resultado high)
- **Frase:** curta e de impacto. Frases longas exigem fonte menor e perdem força.
- **Autor:** no campo `contact` (vai renderizado discreto).
- **Fundo:** ajuste o `customPrompt` do Prompt Builder pro mood (ex: "gradiente quente, dourado, premium").

## Do & Don't
- ✅ Frase curta + autor curto.
- ✅ Combine o mood do fundo com o tom da frase (calmo, motivacional, sério).
- ❌ Não coloque a frase no prompt do fundo — o texto é renderizado pelo overlay, nítido.
- ❌ Não use parágrafo inteiro — é card, não artigo.

## Troubleshooting
| Sintoma | Causa | O que fazer |
|---|---|---|
| Fundo "poluído" pra texto | prompt do fundo com muitos elementos | pedir mais "negative space", abstrato/minimal |
| Frase cortada / pequena | frase muito longa | encurtar |
| Autor não apareceu | campo contact vazio | preencher o campo autor |

## Roadmap de qualidade (Eco → Pro → Ultra)
> `src/lib/featureTiers.ts` → `FEATURE_TIERS.generate`.

| Tier | Modelo | Custo/img | Créditos | Plano |
|---|---|---|---|---|
| 🟢 Eco | Flux schnell | ~R$ 0,02 | 2 | free (após backend tier-aware) |
| 🔵 **Pro** | Flux (atual) | ~R$ 0,22 | 5 | atual |
| 🟣 Ultra | Flux 1.1 Pro Ultra | ~R$ 0,33 | 7 | team |

> Hoje cobra **5 cr** (Pro) porque o backend sempre usa Flux. O tier Eco (2 cr) só liga quando o
> backend rotear flux-schnell (Fase 2) — senão seria prejuízo.

## Ângulo comercial
- **Público:** social media manager, criador de frases/motivacional — uso recorrente diário.
- **Pitch:** "post de citação pronto pra feed em segundos, com tipografia de verdade".
