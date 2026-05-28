/// <reference lib="deno.ns" />
// supabase/functions/send-email/index.ts
// CREATYNG — Edge Function: send-email
// Envia emails transacionais via Resend API com 6 templates HTML inline.
//
// Env vars necessárias:
//   RESEND_API_KEY — API key da Resend (configurar via supabase secrets set)

import { corsHeaders } from "../_shared/cors.ts";

const VALID_TEMPLATES = [
  "welcome",
  "credits-low",
  "payment-ok",
  "payment-fail",
  "plan-activated",
  "receipt",
] as const;

type Template = (typeof VALID_TEMPLATES)[number];

interface EmailRequest {
  to: string;
  template: Template;
  data?: Record<string, unknown>;
}

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

// ── Shared styles ──

const ACCENT = "#ff713d";
const ACCENT_GRADIENT = "linear-gradient(135deg,#ff713d,#FF9B70)";
const GRAY_BG = "#F3F4F6";
const DARK = "#111827";
const MUTED = "#6B7280";

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${GRAY_BG};font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_BG};padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:#ffffff;padding:22px 32px;text-align:center;border-bottom:1px solid #F3F4F6;">
    <img src="${APP_URL}/email-logo.png" alt="Creatyng" width="160" style="display:inline-block;height:auto;max-width:160px;border:0;outline:none;text-decoration:none;" />
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    ${body}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:16px 32px;border-top:1px solid #E5E7EB;text-align:center;">
    <span style="color:${MUTED};font-size:12px;">Creatyng — Criação visual com IA</span>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
<tr><td style="background:${ACCENT};border-radius:8px;padding:12px 28px;">
  <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${label}</a>
</td></tr></table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${DARK};">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${DARK};">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:${MUTED};">${text}</p>`;
}

// ── Template builders ──

const APP_URL = "https://app.creatyng.com";

function buildWelcome(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || "Criador";
  return {
    subject: `Bem-vindo ao Creatyng, ${name}! 🎨`,
    html: wrapHtml(
      "Bem-vindo ao Creatyng",
      heading(`Olá, ${name}!`) +
        paragraph("Sua conta no Creatyng foi criada com sucesso. Você já tem <strong>50 créditos gratuitos</strong> para começar a criar visuais incríveis com IA.") +
        paragraph("Crie banners profissionais, fotos estilizadas e ensaios fotográficos — tudo direto do navegador.") +
        ctaButton("Criar primeiro criativo", `${APP_URL}/app/create`) +
        muted("Se tiver dúvidas, acesse nossa página de ajuda ou fale conosco pelo chat de suporte.")
    ),
  };
}

function buildCreditsLow(data: Record<string, unknown>): { subject: string; html: string } {
  const remaining = data.remaining ?? 0;
  return {
    subject: `Seus créditos estão acabando (${remaining} restantes)`,
    html: wrapHtml(
      "Créditos baixos",
      heading("Seus créditos estão acabando") +
        paragraph(`Você tem apenas <strong>${remaining} crédito${Number(remaining) === 1 ? "" : "s"}</strong> restante${Number(remaining) === 1 ? "" : "s"}. Recarregue para continuar criando sem interrupção.`) +
        paragraph("Pacotes a partir de R$ 9,90 com créditos que nunca expiram.") +
        ctaButton("Recarregar créditos", `${APP_URL}/app/billing`)
    ),
  };
}

function buildPaymentOk(data: Record<string, unknown>): { subject: string; html: string } {
  const amount = data.amount ?? "—";
  const credits = data.credits ?? "—";
  return {
    subject: "Pagamento confirmado ✅",
    html: wrapHtml(
      "Pagamento confirmado",
      heading("Pagamento confirmado!") +
        paragraph(`Recebemos seu pagamento de <strong>R$ ${amount}</strong>. Foram adicionados <strong>${credits} créditos</strong> à sua conta.`) +
        paragraph("Seus créditos já estão disponíveis para uso imediato.") +
        ctaButton("Ver saldo", `${APP_URL}/app/billing`)
    ),
  };
}

function buildPaymentFail(data: Record<string, unknown>): { subject: string; html: string } {
  const reason = (data.reason as string) || "Não foi possível processar seu pagamento.";
  return {
    subject: "Falha no pagamento ⚠️",
    html: wrapHtml(
      "Falha no pagamento",
      heading("Houve um problema com seu pagamento") +
        paragraph(reason) +
        paragraph("Verifique os dados do cartão ou tente outro método de pagamento.") +
        ctaButton("Tentar novamente", `${APP_URL}/app/billing`) +
        muted("Se o problema persistir, entre em contato com nosso suporte.")
    ),
  };
}

function buildPlanActivated(data: Record<string, unknown>): { subject: string; html: string } {
  const plan = (data.plan as string) || "Pro";
  return {
    subject: `Plano ${plan} ativado! 🚀`,
    html: wrapHtml(
      "Plano ativado",
      heading(`Seu plano ${plan} está ativo!`) +
        paragraph(`Parabéns! Você agora tem acesso a todos os recursos do plano <strong>${plan}</strong>.`) +
        paragraph("Explore templates exclusivos, prioridade na fila de geração e suporte prioritário.") +
        ctaButton("Explorar recursos", `${APP_URL}/app/dashboard`)
    ),
  };
}

function buildReceipt(data: Record<string, unknown>): { subject: string; html: string } {
  const amount = data.amount ?? "—";
  const date = data.date ?? new Date().toLocaleDateString("pt-BR");
  const method = data.method ?? "—";
  const credits = data.credits ?? "";

  return {
    subject: "Recibo Creatyng",
    html: wrapHtml(
      "Recibo",
      heading("Recibo de pagamento") +
        `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};border-bottom:1px solid #E5E7EB;">Valor</td>
            <td style="padding:8px 0;font-size:14px;font-weight:600;color:${DARK};text-align:right;border-bottom:1px solid #E5E7EB;">R$ ${amount}</td>
          </tr>
          ${credits ? `<tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};border-bottom:1px solid #E5E7EB;">Créditos</td>
            <td style="padding:8px 0;font-size:14px;font-weight:600;color:${DARK};text-align:right;border-bottom:1px solid #E5E7EB;">${credits}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};border-bottom:1px solid #E5E7EB;">Data</td>
            <td style="padding:8px 0;font-size:14px;color:${DARK};text-align:right;border-bottom:1px solid #E5E7EB;">${date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};">Método</td>
            <td style="padding:8px 0;font-size:14px;color:${DARK};text-align:right;">${method}</td>
          </tr>
        </table>` +
        muted("Guarde este email como comprovante. Dúvidas? Fale conosco pelo suporte.")
    ),
  };
}

const TEMPLATE_BUILDERS: Record<
  Template,
  (data: Record<string, unknown>) => { subject: string; html: string }
> = {
  welcome: buildWelcome,
  "credits-low": buildCreditsLow,
  "payment-ok": buildPaymentOk,
  "payment-fail": buildPaymentFail,
  "plan-activated": buildPlanActivated,
  receipt: buildReceipt,
};

// ── Main handler ──

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[send-email] RESEND_API_KEY not configured");
      return json({ error: "email_not_configured" }, 500, cors);
    }

    const body: EmailRequest = await req.json();
    const { to, template, data = {} } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return json({ error: "invalid_recipient" }, 400, cors);
    }

    if (!template || !VALID_TEMPLATES.includes(template as Template)) {
      return json(
        { error: "invalid_template", valid: VALID_TEMPLATES },
        400,
        cors
      );
    }

    const builder = TEMPLATE_BUILDERS[template as Template];
    const { subject, html } = builder(data as Record<string, unknown>);

    console.log(`[send-email] sending template="${template}" to="${to}"`);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Creatyng <no-reply@creatyng.com>",
        reply_to: "support@creatyng.com",
        to: [to],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(`[send-email] Resend error ${resendRes.status}:`, errBody);
      return json(
        { error: "send_failed", status: resendRes.status, detail: errBody },
        502,
        cors
      );
    }

    const resendData = await resendRes.json();
    console.log(`[send-email] sent ok — id=${resendData.id}`);

    return json({ success: true, id: resendData.id }, 200, cors);
  } catch (err) {
    console.error("[send-email] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
