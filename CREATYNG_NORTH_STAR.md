# CREATYNG — NORTH STAR
# A visão do produto na voz do dono. Leia antes de qualquer decisão técnica.
# Este documento tem prioridade sobre qualquer outro spec técnico.

---

## O QUE É O CREATYNG EM UMA FRASE

> Um mordomo do design. O usuário traz o ingrediente bruto.
> O Creatyng devolve o criativo profissional pronto.

Não é um gerador de imagens com texto colado por cima.
Não é um Canva com IA.
É um diretor de arte autônomo que entende brief, toma decisões de design
e entrega resultado de nível agência — mesmo para usuários que não sabem nada de design.

---

## O QUE O USUÁRIO FORNECEE

```
OBRIGATÓRIO:
  1. Subject          — foto da pessoa, produto, animal, objeto
                        (se não tiver: opção de gerar ou usar avatar salvo)
  2. Textos           — headline, subtexto, CTA, texto extra livre
                        (ex: "quero um balão com 50% OFF")

OPCIONAL (guia o resultado, não comanda):
  3. Referência       — imagem do Behance, concorrente, inspiração
                        (o sistema extrai o DNA visual, não copia)
  4. Estilo base      — preset pré-moldado (Drama, Clean, Dark, etc)
                        ou descrição livre ("quero algo sombrio e agressivo")
  5. Cores            — 1 a 6 cores predominantes
                        (seletor com opção de excluir campos, não obrigatório)
  6. Tipografia       — combinações de fontes pré-moldadas com preview visual
                        (opcional — sistema escolhe se não informado)
  7. Posição de texto — arrastar no preview como sugestão, não como comando
                        (o sistema pode ignorar se a cena pedir outra coisa)
  8. Formato/tamanho  — 1:1, 9:16, 16:9, 4:5, custom
  9. Orientações livres — campo de texto aberto no último passo
                          ("quero algo que pareça agressivo mas profissional")
```

---

## O QUE O CREATYNG DECIDE SOZINHO

Quando o usuário não informa, o sistema decide com sabedoria de designer:

```
→ Estilo visual completo (baseado no subject + intenção detectada)
→ Atmosfera e iluminação da cena
→ Posição e hierarquia dos textos
→ Tipografia compatível com o estilo
→ Cores se não informadas (extrai da referência ou do subject)
→ Composição (onde o subject fica, onde o texto respira)
→ Efeitos de texto (glow, textura, sombra — baseados no preset)
→ Qualidade e acabamento final
```

**Regra de ouro:** o usuário tem livre arbítrio para dar pitacos.
Mas o Creatyng tem a sabedoria máxima de um designer sênior.
Se o usuário não der pitaco, o resultado ainda será excelente.
Se der pitaco errado, o sistema absorve a intenção e ajusta com bom senso.

---

## O QUE O CREATYNG NUNCA FAZ

```
✗ Não gera texto dentro da imagem pela IA (tipografia é sempre HTML/CSS)
✗ Não entrega resultado genérico de "IA amadora"
✗ Não coloca neon em tudo achando que é estilo
✗ Não gera imagens com cara de stock photo
✗ Não distorce faces, mãos ou anatomia
✗ Não expõe prompt para o usuário
✗ Não pede que o usuário configure coisa que o sistema deveria saber
✗ Não entrega resultado raso só para ser rápido
```

---

## O FLUXO DO WIZARD (COMO DEVE SER)

```
PASSO 1 — SUBJECT + REFERÊNCIA
  Upload da foto do subject (pessoa/produto/animal/objeto)
  Upload de referência visual (opcional mas recomendado)
  Opção: "Não tenho foto" → gerar subject ou usar avatar salvo
  Formatos: múltiplos subjects aceitos, múltiplas referências aceitas
  Logo da marca (opcional, vai ser inserida no criativo)

PASSO 2 — ESTILO
  Cards visuais de preset (Drama, Clean, Dark, Editorial, Neon, etc)
  OU campo livre: "descreva o estilo que você quer"
  Cores: 1-6 cores com seletor flexível (adicionar/excluir campos)
  Nenhum campo obrigatório — sistema decide se vazio

PASSO 3 — TEXTOS
  Headline (campo grande)
  Subtexto (campo menor)
  CTA (campo pequeno)
  Campo livre: "instruções adicionais de texto"
  (ex: "quero um balão amarelo escrito FRETE GRÁTIS")

PASSO 4 — TIPOGRAFIA + POSIÇÃO (OPCIONAL)
  Combinações de tipografia pré-moldadas com preview visual real
  Preview de posição (arrastar como sugestão — não como comando)
  Formatos de saída: checkboxes múltiplos
  Campo final: "Orientações gerais" (texto livre)

PASSO 5 — GERAR
  Botão único: ✦ Gerar Criativo
  Sem mais campos. Sem mais decisões.
  O sistema trabalha.
```

---

## O QUE PRESERVAR DO QUE JÁ FOI CONSTRUÍDO

```
✅ Sistema de presets (CreatygnPreset, tipos universais)
✅ WizardState e useWizardStore
✅ Cards visuais de preset
✅ Seletor de fonte com preview
✅ Export multi-formato
✅ Brand Kit (estrutura)
✅ Pipeline Gemini → Replicate fallback
✅ Preprocess no frontend (Canvas API)
✅ Negative prompt fortalecido (sem texto gerado pela IA)
✅ HTML/CSS renderer (Stage 3) — ATIVO, não suspenso
```

---

## ARQUITETURA DO RESULTADO FINAL

```
IA GERA:
  → Cena visual (fundo + atmosfera + iluminação + partículas)
  → Subject integrado na cena com identidade preservada
  → SEM texto, SEM tipografia, SEM letras

HTML/CSS RENDERER COMPÕE:
  → Texto com fonte real, peso, tracking, line-height exatos
  → Efeitos: glow, textura, sombra, gradiente, stroke
  → Posição inteligente baseada na cena gerada
  → Accent word na cor de destaque
  → Logo da marca se fornecida

EXPORT FINAL:
  → Imagem composta (cena + texto) em 2K/4K
  → Múltiplos formatos simultaneamente
  → Pronto para download e uso direto nas redes
```

---

## QUALIDADE MÍNIMA ACEITÁVEL

O Creatyng só entrega resultado que passa neste checklist:

```
□ Subject preservado com fidelidade (rosto/produto reconhecível)
□ Iluminação consistente e cinematográfica
□ Fundo substituído com coerência de cena
□ Texto legível, correto, sem distorção
□ Tipografia com personalidade (não texto cru por cima)
□ Composição equilibrada (subject + texto respiram juntos)
□ Resultado parece feito por designer, não por IA amadora
□ Usuário conseguiria publicar direto nas redes sem editar
```

Se não passar: retry automático antes de entregar ao usuário.

---

## PRIORIDADE DE DESENVOLVIMENTO

```
AGORA — 1 feature, perfeita:
  → Social Post com subject + headline + preset
  → Resultado: nível Designer Builder
  → Tudo funcionando end-to-end

DEPOIS — quando o Social Post estiver perfeito:
  → Ecom Banner
  → Photoshoot
  → Múltiplos formatos simultâneos
  → Avatar pessoal
  → Brand Kit completo
  → Marketplace de presets
```

**Uma feature perfeita vale mais do que dez features mediocres.**

---

## ARQUIVOS QUE O CLAUDE CODE DEVE LER

```
LEITURA OBRIGATÓRIA (nesta ordem):
1. CLAUDE.md                    — stack, regras técnicas, erros comuns
2. CREATYNG_NORTH_STAR.md       — visão do produto (este arquivo)

LEITURA QUANDO RELEVANTE:
3. CREATYNG_MASTER_SPEC.md      — diffs detalhados (consultar por diff específico)
4. CREATYNG_VISION_FIRST.md     — pipeline de análise de referência

IGNORAR (conflitam ou estão desatualizados):
- CREATYNG_FEATURES_SPEC.md     — substituído pelo MASTER_SPEC
- CREATYNG_ISSUES.md            — issues antigas, maioria resolvida
- CREATYNG_MOTOR_PLAN.md        — substituído pelo VISION_FIRST
- CREATYNG_VISUAL_SPEC.md       — incorporado no NORTH_STAR
- CREATYNG_EXECUTION_LOG.md     — histórico, não spec
```
