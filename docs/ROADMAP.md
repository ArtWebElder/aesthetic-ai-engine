# CREATYNG — Roadmap / Backlog de Tasks

> Plano vivo. Filosofia central: **produtos prontos, não IA solta.** O cliente lê
> poucas linhas, escolhe um TIPO (fluxo) → um ESTILO pré-moldado (subtipo), é guiado
> por 2-3 nodes + "Executar" e recebe um design completo. Tipos e subtipos ramificam
> infinitamente conforme as IAs avançam e o mercado pede.

## ✅ Concluído (em produção)
- 6 modos no Studio: Remover Fundo, Re-color, Thumbnail (OpenAI), Card de Citação, Headshot, Produto em Cena.
- Fundação de tiers (`featureTiers.ts`, Eco/Pro/Ultra + piso de margem).
- Thumbnail OpenAI (texto desenhado na imagem) + provider `openai-image` roteado por `module`.
- **Fase 0 — Sub-seletor de Estilos** do Thumbnail (categorias → estilos pré-moldados; 7 templates seed em `flowStyles.ts`).
- Fix Pix avulso (creditava só `credits` legado → agora `bonus_credits`).

## 🔜 Backlog priorizado

### 1. Memória de projetos criados (alta prioridade)
- Salvar/carregar fluxos do usuário (nodes + conexões + estilo escolhido) no Supabase.
- Histórico de gerações por projeto (thumbnail X, banner Y) com preview.
- "Meus projetos" — abrir, duplicar, continuar de onde parou.
- *Por quê:* hoje o trabalho do usuário some ao recarregar. É base pra retenção.

### 2. Cards de features na Dashboard → abre o Studio (alta)
- Dashboard mostra um card por feature (descoberta de "novas features").
- Clicar no card → abre o **modal do Studio já na categoria** (FlowSelector) → escolhe o estilo pré-moldado → carrega os nodes.
- Reaproveita o `FlowSelector` (categorias) + `flowStyles.ts` (subtipos).
- *Por quê:* é o funil de descoberta — guia o cliente pro produto pronto.

### 3. Mais estilos pré-moldados (contínuo)
- Gerar templates via prompt do Behance (ver `thumbnail.md` / `thumbnail-templates.md`).
- Adicionar styles a `flowStyles.ts` por feature (não só thumbnail).
- Cada feature nova nasce já com seu submenu de estilos.

### 4. Limpeza de ruído / bugs bobos (média, contínua)
- **Admin:** remover mocks/fakes — Churn e Conversão sempre 0 com badges hardcoded (`AdminFinance`); "tipo" de transação por chute de valor.
- **Recarga real vs bônus:** usar `credit_history.type` como fonte; verificar/corrigir a CHECK constraint do `credit_history` (pode rejeitar `subscription`/`admin_bonus`).
- **Node-add no canvas:** node nasce em posição fixa (ignora pan/zoom) → parece que "não adiciona". Nascer no centro da view atual.
- Auditoria dos 17 nodes (o que cada um faz / pass-through / funciona).
- *Origem:* mesma família dos bugs já corrigidos (Pix, créditos não creditados).

### 5. Híbrido do Thumbnail (flagship — parado por enquanto)
- Compositor multi-camada + multi-upload (logos/prints) + multi-texto + posicionamento.
- Subject perfeito + assets reais fiéis (composição Canvas) sobre fundo gerado por IA.
- *Status:* pesado e alto-toque; só atacar com ambiente **local + Chrome** (iteração visual rápida) ou decisão explícita de investir dias.

### 6. Tiers premium / providers (quando o mercado pedir)
- Backend tier-aware (eco→flux-schnell, pro→kontext, ultra→1.1-pro-ultra).
- Upscale (Replicate, Tier C), Bria RMBG-2.0 (remover fundo Pro), InstantID (headshot Ultra).
- OpenAI como fallback/primário em features além do thumbnail.

## Notas de processo
- Deploy: frontend via `vercel --prod` (CLI); edge functions via `supabase functions deploy <nome>`. Git auto-deploy NÃO está ligado (webhook GitHub→Vercel inativo).
- Cada feature: preset + i18n (EN/PT/ES) + custo no `featureTiers` + playbook em `docs/playbooks/`.
