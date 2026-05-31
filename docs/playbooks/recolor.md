---
feature: recolor
title: Re-color / Mood
tiers: [eco]
status: eco-live          # roda 100% no navegador (Canvas), custo R$0
anon: true
flow_id: recolor          # PRESET_FLOWS['recolor'] no Studio
updated: 2026-05-31
---

# Re-color / Mood

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Aplica um **clima de cor** sobre a imagem usando filtros de Canvas no navegador — sem IA, sem
servidor, **custo R$ 0**. Entrega instantânea. Bom ímã de aquisição secundário e "preenchedor"
de catálogo que dá sensação de app completo.

## Modos disponíveis
> Definidos em `engine.ts` → case `color_grade` (`filterMap`).

| Modo | Efeito |
|---|---|
| `warm` | Tons quentes, leve sépia — aconchegante |
| `cold` | Tons frios, leve azul — clean/tech |
| `vivid` | Cores saturadas e contrastadas — punchy (padrão) |
| `muted` | Dessaturado, suave — minimalista |
| `dramatic` | Alto contraste, escuro — cinematográfico |
| `vintage` | Sépia + baixo contraste — retrô |

## Como funciona (pipeline)
`Imagem (upload)` → `Color Grade (modo)` → `Export (PNG)`.
O modo é trocado no painel de propriedades do node Color Grade.

## Melhor input
- Qualquer foto. Funciona melhor em imagens já bem expostas (o filtro realça, não conserta).
- Exporte em PNG pra manter qualidade.

## Do & Don't
- ✅ Use pra padronizar o "look" de um feed (mesmo mood em várias fotos).
- ✅ Combine com Remover Fundo antes, se quiser produto recortado + tonalizado.
- ❌ Não espere correção de foto ruim — é estilização, não reparo.

## Roadmap de qualidade
Tier único **Eco** (Canvas, grátis). Evolução futura possível: presets de LUT mais ricos ou
re-color por IA (tier Pro) — só entra se houver demanda; o ganho sobre o filtro Canvas é marginal.

## Ângulo comercial
- Custo R$ 0 → entra no pacote free/anônimo sem risco.
- Aumenta tempo de uso e sensação de ferramenta completa, alimentando conversão pros modos pagos.
