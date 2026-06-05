# Playbook — Upscale HD/4K

> Modo do Studio. Aumenta resolução e nitidez de qualquer imagem. Ideal pra impressão,
> telas grandes e dar "acabamento" em criativos exportados.

## Fluxo
`Imagem (image_upload)` → `Upscale` → `Export`

- **Upscale node** (`processing`, ícone `Maximize2`): opção de escala **2×** ou **4×**.
- 1 clique em "Executar fluxo" → imagem ampliada pronta pra baixar.

## Engine / Backend
- Frontend (`engine.ts` case `upscale`): pega a imagem upstream, faz cap de 1600px no maior
  lado (mantém payload < 6MB do Edge), e chama a edge function `upscale-image` com `{ image, scale }`.
- Edge function `supabase/functions/upscale-image/index.ts`:
  - Replicate **Real-ESRGAN** (`nightmareai/real-esrgan`), endpoint model-scoped (roda a última versão).
  - `Prefer: wait` (bloqueia ~60s) + fallback de polling.
  - Usa o secret **REPLICATE_API_TOKEN** já existente (sem chave nova).
  - Retorna `{ image: <url de saída> }`; o engine converte a URL → base64 pro export.

## Custo / Tier (`featureTiers.ts`)
- `upscale` → eco: Real-ESRGAN, ~R$0,01, **1 crédito** (acima do piso de margem).
- pro/ultra (futuro): `philz1337x/clarity-upscaler` (2 / 5 créditos) — quando quiser qualidade premium.
- `FLOW_TIER_MAP['upscale'] = { feature: 'upscale', tier: 'eco' }` → cobra 1 crédito.

## Deploy
- Frontend: `vercel --prod` (CLI).
- Edge function (1×): `supabase functions deploy upscale-image`.

## Boas práticas de resultado
- Melhor em imagens pequenas/médias (selfie, logo, foto de produto baixa-res).
- 4× pode demorar mais; em imagens já grandes, prefira 2×.
- `face_enhance` está OFF (evita "plastificar" rostos); ligar no futuro como toggle se pedirem.

## Próximos passos (quando o mercado pedir)
- Tier Pro/Ultra com Clarity Upscaler (mais detalhe, mais caro).
- Toggle de `face_enhance` no node.
- Página-isca pública de upscale (igual remover-fundo) com teto diário anônimo (Fase 2).
