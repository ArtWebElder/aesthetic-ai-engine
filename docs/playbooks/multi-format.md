# Playbook — Variações de Formato (Multi-formato)

> Modo do Studio. Uma imagem → todas as redes de uma vez. **Grátis** (client-side, canvas).

## Fluxo
`Imagem (image_upload)` → `Multi-formato` → `Export`

- **Multi-formato node** (`processing`, ícone `LayoutGrid`, 0 cr): gera 4 formatos num clique:
  - **1:1 Feed** (1080×1080) · **4:5 Feed** (1080×1350) · **9:16 Story** (1080×1920) · **16:9 Banner** (1920×1080)
- Cada formato tem botão **↓ download** próprio no corpo do node (grid 2×2).
- O Export pega o **1:1** como primário (botão "Baixar" do Studio).

## Como reenquadra (sem distorcer)
Para cada formato, o canvas desenha:
1. um **fundo desfocado** da própria imagem em modo *cover* (preenche as bordas, look premium);
2. a **imagem inteira** por cima em modo *contain*, centralizada.
Nada é esticado; a imagem aparece completa sobre um fundo coerente.

## Custo / Tier
- `featureTiers.multiformat` → eco `browser:canvas`, **0 crédito**.
- `FLOW_TIER_MAP['multi-format'] = { feature: 'multiformat', tier: 'eco' }` → `calculateCost('multi-format')` = 0.

## Onde aparece
- Card na Dashboard (categoria "Grátis & Rápido"), seletor de fluxos do Studio, e node no painel (PROCESSING).
- Funciona com qualquer imagem upstream: upload, **upscale**, gerada (image_gen), composta, recortada.

## Deploy
- Só frontend: `vercel --prod`. (Sem edge function — roda no navegador.)

## Próximos passos
- "Variações = regenerar N opções" (botão "gerar mais 3") nos modos de IA — fácil, fica pra depois.
- Reenquadre por **AI outpaint** (Pro) em vez de blur-fill, quando quiser qualidade máxima.
- Combos prontos: ex. fluxo "Upscale → Multi-formato" (amplia e já entrega em todas as redes).
