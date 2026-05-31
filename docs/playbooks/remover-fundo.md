---
feature: remove_bg
title: Remover Fundo
tiers: [eco, pro, ultra]
status: eco-live          # eco em produção; pro/ultra planejados (Bria + deploy)
anon: true                # tier eco aceita modo anônimo (teto diário — Fase 2)
flow_id: remove-bg        # PRESET_FLOWS['remove-bg'] no Studio
updated: 2026-05-31
---

# Remover Fundo

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.
> Quando mudar a feature, atualize **este** arquivo primeiro.

## O que faz
Recorta o fundo de uma imagem e devolve um **PNG com transparência**. Sem prompt, sem espera de
servidor: o tier **Eco** roda 100% no navegador (`@imgly/background-removal`, modelo ONNX), então o
custo por imagem pra gente é **R$ 0,00**. É o nosso melhor ímã de aquisição.

## Melhor input (pra resultado high)
- **Resolução:** 1000–2000px no lado maior. Muito pequena perde borda; muito grande deixa o browser lento.
- **Contraste sujeito × fundo:** quanto mais separado o objeto do fundo, mais limpa a borda.
- **Formato:** JPG ou PNG. Foto nítida e bem iluminada > foto escura/desfocada.
- **1 sujeito claro** no centro funciona melhor que cenas cheias.

## Receita (passo a passo)
1. Abra o Studio → escolha **Remover Fundo** no seletor de fluxos.
2. Suba a imagem no node **Imagem**.
3. Rode o node **BG Removal** (recorte acontece no navegador).
4. **Export** entrega o PNG transparente — formato travado em `png` pra preservar o alfa.

## Do & Don't
- ✅ Use foto com sujeito bem definido e boa luz.
- ✅ Exporte sempre em **PNG** (JPG não tem transparência — viraria fundo branco).
- ❌ Não espere milagre em cabelo voando / vidro / fumaça no tier Eco — isso é território do tier **Pro** (Bria RMBG-2.0).
- ❌ Não suba imagem gigante (>4000px): trava o navegador sem ganho de qualidade.

## Troubleshooting
| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Borda "comeu" parte do produto | sujeito encostado em fundo de cor parecida | aumentar contraste / reenquadrar |
| Sobrou pedaço de fundo | imagem muito pequena ou ruidosa | subir resolução do input |
| Fundo branco em vez de transparente | exportou JPG | exportar em PNG |
| Travou / muito lento | imagem enorme | reduzir pra ~2000px |

## Roadmap de qualidade (a escada Eco → Pro → Ultra)
> Definido em `src/lib/featureTiers.ts` → `FEATURE_TIERS.remove_bg`.

| Tier | Modelo | Custo/img | Créditos | Plano | Quando |
|---|---|---|---|---|---|
| 🟢 **Eco** | `@imgly` (browser) | R$ 0 | 0 (grátis) | free | **LIVE** |
| 🔵 **Pro** | Bria RMBG-2.0 | ~R$ 0,11 | 3 | pro | precisa chave Bria + deploy |
| 🟣 **Ultra** | Bria RMBG-2.0 + 4K/refino borda | ~R$ 0,11 | 4 | team | precisa deploy |

## Ângulo comercial
- **Topo de funil:** custo R$ 0 → dá pra anunciar "remova fundo grátis" sem queimar caixa.
- **Free anônimo (Fase 2):** teto diário (~1/dia por IP) pra atrair sem abuso.
- **Conversão:** quem entra pra recortar fundo já está logado no Creatyng — vende-se thumbnail,
  banner e assinatura na sequência. O Pro/Ultra (borda premium) viram motivo pra assinar.
