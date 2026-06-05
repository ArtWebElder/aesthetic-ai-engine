# Playbook — Adaptar Formato (IA) / AI Reframe

> Modo PAGO do Studio. Adapta o MESMO criativo pra outra proporção **expandindo a cena
> com IA** (outpaint) — o produto/sujeito **nunca é cortado**, só ganha cenário coerente
> ao redor. Versão premium do Multi-formato (que é o recorte seco grátis).

## Fluxo
`Imagem (image_upload)` → `Adaptar Formato (IA)` (escolhe proporção) → `Export`

- Node `reframe_ai` (`ai`, ícone `Expand`): **multi-seleção** de proporções (chips 1:1 / 4:5 / 9:16 / 16:9).
- **Batch**: gera todos os formatos selecionados num run (loop de chamadas Bria), com download por formato no node.
- Custo **dinâmico = nº de formatos × 3 cr** (débito calculado no StudioPage a partir de `node.data.ratios`).

## Como funciona (outpaint, sem corte)
- Frontend (`engine.ts` case `reframe_ai`): faz cap de 1280px, calcula a **canvas alvo** e a
  **posição do original centralizado**, e manda pra edge function.
- Edge `expand-image`: **Bria Expand** (`bria/expand-image`, Replicate, `Prefer: wait` + poll).
  Mantém os pixels originais e **gera só as bordas** que faltam (luz/fundo coerentes).
  Prompt trava pra não inventar pessoas/produtos/texto. Reusa **REPLICATE_API_TOKEN**.
- ⚠️ Não reposiciona texto **já embutido** na imagem (só estende cena). Pra criativos com texto
  separado (banner/quote), o ideal futuro é expandir o visual + re-renderizar o texto por proporção.

## Custo / Tier (`featureTiers.reframe`)
- eco: `bria/expand-image`, ~R$0,15 → **3 créditos** (acima do piso de margem).
- ultra (futuro): 5 créditos.
- `FLOW_TIER_MAP['reframe-ai'] = { feature: 'reframe', tier: 'eco' }`.

## Grátis vs Pago (comparação)
| | Multi-formato (grátis) | Adaptar Formato IA (3 cr) |
|---|---|---|
| Método | recorte + fundo blur | outpaint (estende cena) |
| Corta elementos? | não, mas adiciona barra borrada | não — cena real expandida |
| Qualidade | ok pra preencher | premium |

## Deploy
- Frontend: `vercel --prod`.
- Edge (1×): `supabase functions deploy expand-image`.

## ⚠️ Validar no 1º teste
Os nomes dos campos de input do Bria no Replicate (`canvas_size` / `original_image_size` /
`original_image_location`) seguem a API documentada da Bria. Se o modelo no Replicate usar
nomes diferentes, a edge function retorna `replicate_error` com o detalhe — aí é ajuste de 1 linha
no objeto `input` de `expand-image/index.ts`.

## Próximos
- Batch: gerar todas as proporções num run (cobra por formato).
- Outpaint + re-render de texto por proporção (premium total).
- Combo "Upscale → Adaptar Formato".
