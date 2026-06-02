---
feature: thumbnail
title: Thumbnail
tiers: [pro, ultra]
status: needs-activation   # código pronto; precisa de OPENAI_API_KEY + deploy da edge function
anon: false
flow_id: thumbnail         # PRESET_FLOWS['thumbnail'] no Studio
provider: openai-gpt-image
updated: 2026-06-01
---

# Thumbnail (YouTube / Reels) — texto na imagem (OpenAI)

> Playbook vivo. Fonte única pro FAQ in-app, tooltips, onboarding e copy de anúncio.

## O que faz
Gera uma thumbnail 16:9 com o **TÍTULO desenhado DENTRO da imagem pela IA** (OpenAI GPT Image),
não como camada Canvas por cima. Isso resolve o problema da v1 (texto "colado"/desconectado). Aceita
**upload de subject** (seu rosto/produto), e campos de **estilo, iluminação, assets e contexto do canal**.

## Como funciona (pipeline)
`Campos (título, canal, estilo, iluminação, assets)` + `Subject (opcional)` → `Image Gen [mode: thumbnail]`
→ `Export`.
- O `Image Gen` monta um prompt rico a partir dos campos e envia com `module: 'sys-img-thumbnail'`.
- O backend roteia esse module pro **provider OpenAI** (`openai-image.ts`):
  - **sem subject** → `images/generations` (text-to-image)
  - **com subject** → `images/edits` (mantém o subject, restila ao redor)

## Campos
| Campo | Pra quê |
|---|---|
| **Título** | O texto curto que a IA desenha integrado na imagem (ex: "GANHEI 10K"). |
| **Canal / contexto** | Nicho/tom do canal pra IA acertar o clima. |
| **Estilo** | Ex: gamer agressivo, cinematográfico, clean. |
| **Iluminação** | Ex: neon, dramática, dourada. |
| **Assets** | Elementos da cena (ex: explosão, dinheiro, seta). |

## Melhor input (pra resultado high)
- **Título curto** (≤ 4-5 palavras). Texto longo aumenta risco de erro de ortografia da IA.
- **Subject:** foto nítida e de frente, se quiser aparecer.
- Capriche em **estilo + iluminação** — é o que dá o "tapa" de thumbnail viral.

## Do & Don't
- ✅ Título curto e punchy; descreva estilo/luz/assets.
- ✅ Use subject pra thumbnails de "reação"/rosto.
- ❌ Frase longa no título (IA pode errar letras).
- ❌ Não espere o texto via Canvas — agora é a IA que desenha (integrado).

## ⚙️ Ativação (necessária — uma vez)
Este modo precisa de setup que **só você faz**:
1. Pegue uma **OpenAI API key** (platform.openai.com) com acesso ao GPT Image.
2. No Supabase → Edge Functions → Secrets, adicione **`OPENAI_API_KEY`** (e opcional
   `OPENAI_IMAGE_MODEL` se quiser fixar um modelo, ex: a versão mais nova; default `gpt-image-1`).
3. **Deploy** da edge function: `supabase functions deploy generate-image`.
Sem isso, o thumbnail falha com `openai_missing_api_key`.

## Roadmap de qualidade (Pro → Ultra)
> `src/lib/featureTiers.ts` → `FEATURE_TIERS.thumbnail`.

| Tier | Modelo | Qualidade | Custo/img | Créditos | Plano |
|---|---|---|---|---|---|
| 🔵 **Pro** | GPT Image (medium) | ótima | ~R$ 0,40 | 8 | pro (atual) |
| 🟣 Ultra | GPT Image (high) | máxima | ~R$ 0,80 | 16 | team |

> Créditos respeitam o piso de margem (`creditFloor`). GPT Image é mais caro que Flux, por isso
> custa mais créditos que os outros modos de geração — é o preço da qualidade de texto.

## Ângulo comercial
- **Público:** criador de conteúdo — paga e usa toda semana.
- **Pitch:** "thumbnail com texto nível agência, desenhado pela IA, em segundos".
- O texto-na-imagem é o diferencial: nada de tipografia "colada".
