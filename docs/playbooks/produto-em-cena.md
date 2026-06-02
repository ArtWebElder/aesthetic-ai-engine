---
feature: generate
title: Produto em Cena
tiers: [pro]
status: pro-live          # reusa bg_removal (browser) + background_gen (Flux) + compositor (Canvas)
anon: false
flow_id: product-scene    # PRESET_FLOWS['product-scene'] no Studio
updated: 2026-06-01
---

# Produto em Cena

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Recorta seu **produto real** (sem regenerar) e compõe sobre um **cenário profissional gerado por IA**.
O produto é sagrado — fica idêntico à foto; só o fundo é criado. Ideal pra catálogo, marketplace e
social sem precisar de estúdio.

## Como funciona (pipeline)
- `Foto do produto` → `BG Removal` (recorte no navegador, custo R$0)
- `Prompt do cenário` → `Gerar Fundo` (text-to-image, só o cenário, sem produto)
- `BG Removal` + `Gerar Fundo` → `Compositor` (Canvas: produto sobre o fundo, com sombra) → `Export`

## Melhor input (pra resultado high)
- **Produto:** foto nítida, bem iluminada, fundo simples (facilita o recorte limpo).
- **Cenário:** descreva ambiente/luz no Prompt Builder (ex: "mármore claro, luz suave lateral, tons quentes").
- O cenário é gerado **sem produto** e com espaço central — o produto entra por cima.

## Do & Don't
- ✅ Produto com borda nítida (cabelo/transparência são mais difíceis no recorte Eco).
- ✅ Ajuste `subjectScale`/`subjectPosition` no Compositor pra encaixar bem.
- ✅ Sombra ligada (`shadowEnabled`) dá realismo — ajuste opacidade/blur se ficar pesada.
- ❌ Não peça o produto no prompt do cenário (o produto é o seu recorte real, não a IA).

## Troubleshooting
| Sintoma | Causa | O que fazer |
|---|---|---|
| Produto "flutuando" | sombra fraca/ausente | aumentar shadowOpacity/blur no Compositor |
| Produto grande/pequeno demais | escala | ajustar subjectScale (0.5–0.7) |
| Recorte comeu borda | foto de baixo contraste | usar foto com fundo mais separado |
| Fundo com cara de produto/poluído | prompt do cenário vago | descrever ambiente + "clear central space" |

## Roadmap de qualidade
> `src/lib/featureTiers.ts` → `FEATURE_TIERS.generate` (cenário) + `remove_bg` (recorte).

| Parte | Eco (atual) | Pro/Ultra (futuro) |
|---|---|---|
| Recorte | @imgly browser (R$0) | Bria RMBG-2.0 (borda premium) |
| Cenário | Flux text-to-image (~R$0,22) | Flux 1.1 Pro Ultra |

Custo total hoje: ~R$ 0,22 (só o fundo) → cobra **5 cr**. Recorte e composição são grátis (browser/Canvas).

## Ângulo comercial
- **Público:** e-commerce, marketplace (Amazon/ML), social — quem vende produto e não tem estúdio.
- **Pitch:** "foto de produto nível estúdio sem estúdio — seu produto, cenário de agência".
- Diferença pro Banner Criativo: aqui é a foto limpa (sem copy/texto); o Banner é o anúncio completo.
