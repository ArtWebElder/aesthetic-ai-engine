# CREATYNG — ESPECIFICAÇÃO VISUAL DO MOTOR DE GERAÇÃO

> Leia este documento antes de qualquer task que envolva `prompt-compiler.ts`, `scene-moods.ts`, `scene-presets.ts`, `scene-props.ts` ou providers de IA.

---

## 🎯 FILOSOFIA DO RESULTADO FINAL

O Creatyng não gera "imagens com IA". O Creatyng gera **criativos de marketing prontos para uso**.

**Critério de aprovação:**
> "Um designer profissional olharia para isso e diria: está pronto."

- Texto torto, ilegível ou sem relação com o cenário → **reprovado**
- Iluminação do subject não bate com o cenário → **reprovado**
- Subject distorcido → **reprovado**
- Cara de IA (pele plástica, olhos mortos, proporções erradas) → **reprovado**

---

## 🎨 OS 3 ESTILOS VISUAIS SUPORTADOS

### ESTILO 1 — DRAMA / IMPACT
**Moods mapeados:** `cinematic_moody`, `energetic_pop`

Atmosfera:
- Iluminação de 3 pontos: key light frontal suave + rim light roxo/magenta intenso atrás + fill escuro
- Fundo desfocado com bokeh agressivo (f/1.4)
- Partículas no ar: faíscas, ember, poeira de luz
- Saturação alta, contraste extremo, sombras densas

Tipografia integrada:
- Bold display com textura grunge metálica
- Palavra de destaque em cor vibrante (roxo #7B2FFF, laranja #FF5500, ciano #00E5FF)
- Posição: terço inferior do frame
- Texto interage com a luz do cenário

### ESTILO 2 — CLEAN / PREMIUM CORPORATIVO
**Moods mapeados:** `luxury_premium`, `clean_bright`

Atmosfera:
- Luz natural difusa (janela/exterior), sem sombras duras
- Fundo quase branco ou cinza neutro
- Sensação de estúdio high-end ou ambiente arquitetônico limpo

Tipografia integrada:
- Sans-serif bold, preta ou branca
- Alinhada à esquerda, hierarquia em 2 níveis
- CTA como outline button

### ESTILO 3 — DARK / CINEMATIC
**Moods mapeados:** `night_neon`, `cool_modern`

Atmosfera:
- Paleta monocromática: azul/ciano escuro ou roxo/preto
- Profundidade de campo extrema: corredor, túnel, perspectiva
- Luz frontal fria no subject, fundo quase negro
- Névoa, partículas de luz, God Rays
- Objetos 3D flutuantes: prismas de vidro, cristais, correntes

Tipografia integrada:
- Gótica/blackletter ou serif pesada
- Branco puro ou dourado/prata
- Posição: topo (título) + base (créditos)

---

## 🧠 ESTRUTURA DE PROMPT INTERNO (5 BLOCOS)

O `prompt-compiler.ts` compila a spec em linguagem natural instrucional com esta estrutura:

```
[STYLE_BLOCK]
Photorealistic cinematic [módulo]. Professional marketing creative, agency quality.
Ultra-detailed, 8K equivalent. Style: [DRAMA/CLEAN/DARK].

[SUBJECT_BLOCK]
SUBJECT: [descrição]. Strict identity preservation. Sharp focus. No plastic skin.

[SCENE_BLOCK]
SCENE: [scene preset]. [mood description detalhado com iluminação + partículas].
[scene props gerados pela IA nativamente]. Accent color: [cor].

[TYPOGRAPHY_BLOCK] (apenas se headline preenchido, módulo != photoshoot)
TYPOGRAPHY (integrated into the scene, NOT pasted on top):
Headline: "[texto]" — [estilo tipográfico do mood]. Subheadline: "[texto]".
CTA: "[texto]". Positioned at [posição]. All text correctly spelled, legible.

[QUALITY_BLOCK]
QUALITY REQUIREMENTS: No plastic skin. No dead eyes. No distorted hands.
Consistent lighting. No white halo. Print-ready. Direct use in paid campaigns.
```

---

## 🔑 DECISÕES ARQUITETURAIS (CONFIRMADAS)

| Decisão | Escolha | Motivo |
|---|---|---|
| Tipografia | **IA gera integrada na cena** | HTML/CSS overlay produzia resultados genéricos e desconexos |
| Scene props | **Descritos no prompt, gerados pela IA** | Overlays CSS não tinham ambientação com a cena |
| Stage 3 (HTML/CSS renderer) | **SUSPENSO** | Caminho IA-first produz resultados muito superiores |
| Modelo Gemini | `gemini-2.0-flash-preview-image-generation` | Único modelo que suporta img2img com geração de imagem |

---

## ❌ O QUE NUNCA DEVE APARECER EM UMA IMAGEM CREATYNG

- Texto ilegível, letras inventadas, palavras erradas
- Pele plástica / olhos sem vida / mãos com dedos errados
- Iluminação inconsistente (sol de dois lados opostos)
- Halos brancos ao redor do subject (recorte mal feito)
- Watermarks, logos de outras ferramentas
- Artifacts de compressão, pixelização
- Mais de 2 famílias tipográficas por imagem
- Cenário genérico de stock photo sem atmosfera

---

## ✅ CHECKLIST DE APROVAÇÃO DE UMA IMAGEM GERADA

Antes de entregar ao usuário:
- [ ] Texto legível e ortograficamente correto?
- [ ] Subject com identidade preservada (se strict ON)?
- [ ] Iluminação do subject bate com a iluminação do cenário?
- [ ] Texto parece integrado à cena (não colado por cima)?
- [ ] Proporções anatômicas corretas?
- [ ] Resolução mínima atingida?
- [ ] Estilo escolhido está representado fielmente?
- [ ] A imagem poderia ir direto para um anúncio pago?

---

## 📐 ESPECIFICAÇÕES TÉCNICAS MÍNIMAS

| Feature | Proporção | Resolução mínima |
|---|---|---|
| Ecom Banner | 16:9 ou 4:3 | 1920×1080 |
| Social Post Feed | 1:1 ou 4:5 | 1080×1080 |
| Social Post Stories | 9:16 | 1080×1920 |
| Photoshoot | Livre | 2048px lado menor |

---

## 📁 REFERÊNCIAS VISUAIS

```
/docs/references/
  style-drama-impact.jpg       → referência estilo 1
  style-clean-premium.jpg      → referência estilo 2
  style-dark-cinematic.jpg     → referência estilo 3
  approved-outputs/            → imagens aprovadas (histórico do motor)
  rejected-outputs/            → imagens reprovadas (aprender o que não funciona)
```
