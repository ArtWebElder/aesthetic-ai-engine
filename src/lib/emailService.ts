// src/lib/emailService.ts
// CREATYNG — Email service scaffold
// TODO: Integrate with Resend when RESEND_API_KEY is configured

const LOGO_URL = 'https://creatyng.com/logo.png'; // TODO: replace with real logo URL
const BRAND_COLOR = '#F97316';
const BG_COLOR = '#FAFAF8';
const TEXT_COLOR = '#1A1A1A';
const MUTED_COLOR = '#6B7280';

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:${TEXT_COLOR};line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <!-- Header -->
        <tr><td style="padding:28px 32px 16px;text-align:center;">
          <img src="${LOGO_URL}" alt="Creatyng" width="120" style="display:inline-block;" />
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:0 32px 28px;">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:${MUTED_COLOR};">
            Creatyng &mdash; Criativos Profissionais com IA<br>
            <a href="https://creatyng.com" style="color:${BRAND_COLOR};text-decoration:none;">creatyng.com</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:suporte@creatyng.com" style="color:${BRAND_COLOR};text-decoration:none;">suporte@creatyng.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, link: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td style="background:${BRAND_COLOR};border-radius:8px;">
      <a href="${link}" style="display:inline-block;padding:12px 32px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">${text}</a>
    </td></tr>
  </table>`;
}

// ── Template functions ───────────────────────────────────────────────────────

export function renderWelcomeEmail(params: { nome: string }): string {
  return baseLayout('Bem-vindo ao Creatyng', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Bem-vindo, ${params.nome}!</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Sua conta foi criada com sucesso. Você já pode começar a criar criativos profissionais com IA.</p>
    <h3 style="margin:20px 0 8px;font-size:15px;font-weight:600;">Primeiros passos:</h3>
    <ol style="padding-left:20px;font-size:14px;color:${MUTED_COLOR};">
      <li>Envie a foto do seu produto ou subject</li>
      <li>Escolha o estilo visual (Food Pop, Pop Design)</li>
      <li>Preencha os textos e clique em Gerar</li>
    </ol>
    ${ctaButton('Criar meu primeiro criativo', 'https://creatyng.com/app/create')}
  `);
}

export function renderCreditsAddedEmail(params: { nome: string; quantidade: number; saldoAtual: number }): string {
  return baseLayout('Créditos adicionados', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Créditos adicionados!</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. <strong>${params.quantidade} créditos</strong> foram adicionados à sua conta.</p>
    <div style="background:${BG_COLOR};border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
      <span style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${params.saldoAtual}</span>
      <br><span style="font-size:12px;color:${MUTED_COLOR};">créditos disponíveis</span>
    </div>
    ${ctaButton('Criar agora', 'https://creatyng.com/app/create')}
  `);
}

export function renderCreditsLowEmail(params: { nome: string; saldoAtual: number }): string {
  return baseLayout('Créditos acabando', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Seus créditos estão acabando</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. Você tem apenas <strong>${params.saldoAtual} créditos</strong> restantes.</p>
    <p style="color:${MUTED_COLOR};font-size:14px;">Recarregue para continuar criando sem interrupções.</p>
    ${ctaButton('Recarregar créditos', 'https://creatyng.com/app/billing')}
  `);
}

export function renderCreditsDepletedEmail(params: { nome: string }): string {
  return baseLayout('Créditos esgotados', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Seus créditos acabaram</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. Seus créditos chegaram a zero. Faça upgrade ou recarregue para continuar criando.</p>
    ${ctaButton('Fazer upgrade', 'https://creatyng.com/app/billing')}
  `);
}

export function renderSubscriptionRenewedEmail(params: { nome: string; periodo: string; valor: string; creditosAdicionados: number }): string {
  return baseLayout('Assinatura renovada', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Assinatura renovada!</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. Sua assinatura foi renovada com sucesso.</p>
    <table role="presentation" style="width:100%;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Período:</td><td style="font-weight:600;">${params.periodo}</td></tr>
      <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Valor:</td><td style="font-weight:600;">${params.valor}</td></tr>
      <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Créditos adicionados:</td><td style="font-weight:600;color:${BRAND_COLOR};">+${params.creditosAdicionados}</td></tr>
    </table>
    ${ctaButton('Ir para o painel', 'https://creatyng.com/app/dashboard')}
  `);
}

export function renderSubscriptionExpiredEmail(params: { nome: string }): string {
  return baseLayout('Assinatura expirada', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Sua assinatura expirou</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. Sua assinatura do Creatyng expirou. Renove para continuar com acesso total às funcionalidades.</p>
    ${ctaButton('Renovar assinatura', 'https://creatyng.com/app/billing')}
  `);
}

export function renderPasswordResetEmail(params: { nome: string; link: string }): string {
  return baseLayout('Recuperação de senha', `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Redefinir senha</h1>
    <p style="color:${MUTED_COLOR};font-size:14px;">Olá, ${params.nome}. Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo (válido por 1 hora).</p>
    ${ctaButton('Redefinir minha senha', params.link)}
    <p style="font-size:12px;color:${MUTED_COLOR};margin-top:16px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
  `);
}

// TODO: Integrate with Resend
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
// export async function sendEmail(to: string, subject: string, html: string) {
//   return resend.emails.send({ from: 'Creatyng <noreply@creatyng.com>', to, subject, html });
// }
