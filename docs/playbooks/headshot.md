---
feature: headshot
title: Headshot / Perfil
tiers: [pro, ultra]
status: pro-live          # roda hoje via image_gen strict-identity (Gemini img2img + Kontext fallback)
anon: false
flow_id: headshot         # PRESET_FLOWS['headshot'] no Studio
updated: 2026-05-31
---

# Headshot / Foto de Perfil

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Pega sua selfie e devolve um **retrato profissional** — mantém seu rosto/identidade (strict identity
img2img) e troca iluminação, fundo e clima. Formato quadrado 1080×1080 (foto de perfil).

## Como funciona (pipeline)
`Sua foto` + `Prompt de estilo` → `Image Gen (strict identity, identityStrength 92)` → `Export`.
Com subject presente o backend usa **Gemini img2img** (primário) e **Flux Kontext** (fallback),
preservando a identidade.

## Melhor input (pra resultado high)
- **Foto:** rosto bem iluminado, de frente, nítido, ombros à mostra. Evite óculos escuros, sombra forte,
  ângulo extremo.
- **1 pessoa só**, fundo simples ajuda.
- **Prompt de estilo:** descreva o contexto ("executivo", "criativo casual", "fundo claro"), não o rosto.

## Do & Don't
- ✅ Foto frontal nítida e bem iluminada.
- ✅ Ajuste o estilo no Prompt Builder (attire, fundo, mood).
- ❌ Não espere fidelidade de LoRA treinado (isso é o tier Ultra/InstantID — Fase C).
- ❌ Não use foto escura/desfocada — a identidade degrada.

## Troubleshooting
| Sintoma | Causa | O que fazer |
|---|---|---|
| Rosto "mudou" demais | identityStrength baixo / foto ruim | subir identityStrength, usar foto frontal nítida |
| Resultado plástico | estilo genérico | descrever luz/attire/contexto no prompt |
| Erro de provider | strict providers indisponíveis | tentar de novo (Gemini→Kontext fallback) |

## Roadmap de qualidade (Pro → Ultra)
> `src/lib/featureTiers.ts` → `FEATURE_TIERS.headshot`.

| Tier | Modelo | Custo/img | Créditos | Plano |
|---|---|---|---|---|
| 🔵 **Pro** | Flux Kontext img2img (atual) | ~R$ 0,22 | 5 | atual |
| 🟣 Ultra | InstantID / PuLID | ~R$ 0,27 | 7 | team — precisa provider novo + deploy |

> O salto de qualidade de identidade vem do **InstantID/PuLID** (tier Ultra), que preserva o rosto de
> 1 foto só bem melhor que img2img genérico. É Tier C: provider Replicate novo + deploy.

## Ângulo comercial
- **Mercado provado:** apps de "AI headshot" cobram R$ 100–200 por pacote.
- **Pitch:** "sua selfie vira foto de LinkedIn profissional em segundos".
- Venda por **pacote de estilos** (vários headshots) pra aumentar consumo de crédito.
