---
feature: generate
title: Thumbnail
tiers: [eco, pro, ultra]
status: pro-live          # roda hoje via text-to-image (Replicate Flux); tier pro
anon: false
flow_id: thumbnail        # PRESET_FLOWS['thumbnail'] no Studio
updated: 2026-05-31
---

# Thumbnail (YouTube / Reels)

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Gera um **fundo 16:9 de alto impacto** com IA (text-to-image) e renderiza o **título por cima
via Canvas** — texto sempre nítido, nunca dependente da IA. É a vantagem do Creatyng sobre
gerador comum: a IA cuida da cena, o Canvas cuida da tipografia.

## Como funciona (pipeline)
`Tema da cena (texto)` → `Prompt Builder` → `Image Gen (1280×720, text-to-image)` →
`Overlay de Texto (título)` → `Export (PNG)`.
Sem subject = geração pura (`strictIdentity:false`). O `negativePrompt` já bloqueia texto/logo
na imagem, deixando espaço limpo pro título.

## Melhor input (pra resultado high)
- **Tema da cena:** descreva o clima, não o texto. Ex: "explosão de dinheiro, fundo dourado dramático,
  estilo gamer agressivo". Quanto mais visual e específico, melhor.
- **Título:** curto e punchy (3–6 palavras). Títulos longos competem com a imagem.
- Deixe a IA criar o foco visual; o título entra no espaço vazio.

## Do & Don't
- ✅ Descreva luz, cor e emoção da cena ("dramático", "vibrante", "cinematográfico").
- ✅ Título curto e em CAIXA quando quiser impacto.
- ❌ Não peça o texto dentro do prompt da cena — o texto é renderizado depois, nítido.
- ❌ Não escreva frase inteira no título — thumbnail é gancho, não legenda.

## Troubleshooting
| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Cena "sem graça" | tema vago | adicionar luz/cor/emoção ao tema |
| Texto sobrepôs o foco | título muito longo | encurtar o título |
| Apareceu texto torto na imagem | raro (IA tentou escrever) | regenerar — o overlay é quem renderiza o texto |
| Proporção errada | dims alteradas | manter 1280×720 (16:9) |

## Roadmap de qualidade (Eco → Pro → Ultra)
> Definido em `src/lib/featureTiers.ts` → `FEATURE_TIERS.generate`.

| Tier | Modelo | Custo/img | Créditos | Plano |
|---|---|---|---|---|
| 🟢 Eco | Flux schnell | ~R$ 0,02 | 2 | free |
| 🔵 **Pro** | Flux Kontext Pro | ~R$ 0,22 | 5 | pro (atual) |
| 🟣 Ultra | Flux 1.1 Pro Ultra | ~R$ 0,33 | 7 | team |

> Hoje o backend usa o provider padrão (Flux text-to-image) independente do tier — o tier define o
> **preço**. Seleção de modelo por tier entra na Fase 2 (backend tier-aware + deploy).

## Ângulo comercial
- **Público que paga e usa toda semana:** criador de conteúdo.
- **Pitch:** "thumbnail nível agência em 10s, com texto nítido de verdade".
- Margem confortável: 5 créditos (~R$ 0,50) sobre custo ~R$ 0,22.
