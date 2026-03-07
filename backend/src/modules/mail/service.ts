// ===================================================================
// FILE: src/modules/mail/service.ts
// ===================================================================

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  sendMailSchema,
  type SendMailInput,
  orderCreatedMailSchema,
  type OrderCreatedMailInput,
} from "./validation";
import {
  getSmtpSettings,
  type SmtpSettings,
} from "@/modules/siteSettings/service";
import { z } from "zod";

// Basit cache (aynı config için transporter'ı tekrar tekrar kurmamak için)
let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;

function buildSignature(cfg: SmtpSettings): string {
  return [
    cfg.host ?? "",
    cfg.port ?? "",
    cfg.username ?? "",
    cfg.secure ? "1" : "0",
  ].join("|");
}

/**
 * SMTP config'ini site_settings tablosundan okuyup transporter üretir
 */
async function getTransporter(): Promise<Transporter> {
  const cfg = await getSmtpSettings();

  if (!cfg.host) {
    throw new Error("smtp_host_not_configured");
  }

  // Port fallback:
  // - secure=true ise default 465
  // - secure=false ise default 587
  if (!cfg.port) {
    cfg.port = cfg.secure ? 465 : 587;
  }

  const signature = buildSignature(cfg);
  if (cachedTransporter && cachedSignature === signature) {
    return cachedTransporter;
  }

  const auth =
    cfg.username && cfg.password
      ? { user: cfg.username, pass: cfg.password }
      : undefined;

  // 🔍 DEBUG: Şifre hariç log (gerek kalmadığında silebilirsin)
  console.log("[SMTP CFG]", {
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
    secure: cfg.secure,
    hasPassword: !!cfg.password,
  });

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth,
  });

  cachedTransporter = transporter;
  cachedSignature = signature;
  return transporter;
}

/**
 * Düşük seviye mail gönderici (genel kullanım)
 * SMTP config'ini site_settings tablosundan okur.
 */
export async function sendMailRaw(input: SendMailInput) {
  const data = sendMailSchema.parse(input);

  const smtpCfg = await getSmtpSettings();

  // From alanını tamamen DB'den kur
  const fromEmail =
    smtpCfg.fromEmail ||
    smtpCfg.username ||
    "no-reply@example.com";

  const from =
    smtpCfg.fromName && fromEmail
      ? `${smtpCfg.fromName} <${fromEmail}>`
      : fromEmail;

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });

  return info;
}

/**
 * sendMailRaw için backward-compatible alias
 * (email-templates/mailer.ts gibi yerler sendMail bekliyor)
 */
export async function sendMail(input: SendMailInput) {
  return sendMailRaw(input);
}

// Basit HTML escape
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, '&quot;')
    .replace(/'/g, "&#039;");
}

/* ==================================================================
   ORDER CREATED MAIL (email_templates → order_received mantığı)
   ================================================================== */

/**
 * Sipariş oluşturma maili
 *
 * NOT:
 *  - email templates payload'ına uygun:
 *      { to, customer_name, order_number, final_amount, status, site_name?, locale? }
 *  - site_name çağıran için zorunlu değil → burada default veriyoruz.
 */
export async function sendOrderCreatedMail(input: OrderCreatedMailInput) {
  const data = orderCreatedMailSchema.parse(input);

  const locale = data.locale ?? "tr-TR";
  const siteName = data.site_name ?? "Dijital Market";
  const createdAt = new Date();
  const dateStr = createdAt.toLocaleString(locale);

  const statusLabelMap: Record<string, string> = {
    pending: "Beklemede",
    processing: "Hazırlanıyor",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
    refunded: "İade Edildi",
  };

  const statusLabel = statusLabelMap[data.status] ?? data.status;

  const subject = `${siteName} – Siparişiniz oluşturuldu (#${data.order_number})`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${escapeHtml(
        data.customer_name,
      )},</h2>
      <p style="margin:0 0 12px 0;">
        <strong>#${escapeHtml(data.order_number)}</strong> numaralı siparişiniz
        <strong>${escapeHtml(siteName)}</strong> üzerinde başarıyla oluşturuldu.
      </p>

      <p style="margin:0 0 16px 0;">
        Durum: <strong>${escapeHtml(statusLabel)}</strong><br/>
        Toplam Tutar: <strong>${escapeHtml(
          data.final_amount,
        )}</strong><br/>
        Tarih: <strong>${escapeHtml(dateStr)}</strong>
      </p>

      <p style="margin:0 0 16px 0;">
        Sipariş detaylarınızı hesap sayfanızdan görüntüleyebilirsiniz.
      </p>

      <p style="margin-top:24px;">
        Teşekkür ederiz,<br/>
        <strong>${escapeHtml(siteName)} Ekibi</strong>
      </p>
    </div>
  `;

  const text = [
    `Merhaba ${data.customer_name},`,
    ``,
    `#${data.order_number} numaralı siparişiniz ${siteName} üzerinde oluşturuldu.`,
    `Durum: ${statusLabel}`,
    `Toplam Tutar: ${data.final_amount}`,
    `Tarih: ${dateStr}`,
    ``,
    `Sipariş detaylarınızı hesap sayfanızdan görüntüleyebilirsiniz.`,
    ``,
    `Teşekkür ederiz,`,
    `${siteName} Ekibi`,
  ].join("\n");

  const info = await sendMailRaw({
    to: data.to,
    subject,
    html,
    text,
  });

  return info;
}

/* ==================================================================
   DEPOSIT SUCCESS MAIL (email_templates → deposit_success)
   ================================================================== */

const depositSuccessMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  amount: z.union([z.string(), z.number()]),
  new_balance: z.union([z.string(), z.number()]),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type DepositSuccessMailInput = z.infer<typeof depositSuccessMailSchema>;

export async function sendDepositSuccessMail(input: DepositSuccessMailInput) {
  const data = depositSuccessMailSchema.parse(input);

  const locale = data.locale ?? "tr-TR";
  const siteName = data.site_name ?? "Dijital Market";
  const amountStr =
    typeof data.amount === "number"
      ? data.amount.toFixed(2)
      : String(data.amount);
  const newBalanceStr =
    typeof data.new_balance === "number"
      ? data.new_balance.toFixed(2)
      : String(data.new_balance);

  const subject = `Bakiye Yükleme Onaylandı - ${siteName}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;text-align:center;">✓ Bakiye Yükleme Başarılı</h1>
      <p>Merhaba <strong>${escapeHtml(data.user_name)}</strong>,</p>
      <p>Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.</p>
      <p><br/></p>
      <p><strong>Yüklenen Tutar:</strong> ${escapeHtml(amountStr)} TL</p>
      <p><strong>Yeni Bakiye:</strong> ${escapeHtml(newBalanceStr)} TL</p>
      <p>Artık alışverişe başlayabilirsiniz!</p>
      <p>Saygılarımızla,</p>
      <p>${escapeHtml(siteName)} Ekibi</p>
    </div>
  `;

  const text = [
    `Merhaba ${data.user_name},`,
    ``,
    `Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.`,
    ``,
    `Yüklenen Tutar: ${amountStr} TL`,
    `Yeni Bakiye: ${newBalanceStr} TL`,
    ``,
    `Artık alışverişe başlayabilirsiniz!`,
    ``,
    `Saygılarımızla,`,
    `${siteName} Ekibi`,
  ].join("\n");

  return sendMailRaw({
    to: data.to,
    subject,
    html,
    text,
  });
}

/* ==================================================================
   TICKET REPLIED MAIL (email_templates → ticket_replied)
   ================================================================== */

const ticketRepliedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  ticket_id: z.string(),
  ticket_subject: z.string(),
  reply_message: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type TicketRepliedMailInput = z.infer<typeof ticketRepliedMailSchema>;

export async function sendTicketRepliedMail(input: TicketRepliedMailInput) {
  const data = ticketRepliedMailSchema.parse(input);

  const locale = data.locale ?? "tr-TR";
  const siteName = data.site_name ?? "Destek Sistemi";

  const subject = `Destek Talebiniz Yanıtlandı - ${siteName}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;text-align:center;">Destek Talebiniz Yanıtlandı</h1>
      <p>Merhaba <strong>${escapeHtml(data.user_name)}</strong>,</p>
      <p>Destek talebiniz yanıtlandı.</p>
      <p><br/></p>
      <p><strong>Talep No:</strong> ${escapeHtml(data.ticket_id)}</p>
      <p><strong>Konu:</strong> ${escapeHtml(data.ticket_subject)}</p>
      <p><br/></p>
      <p><strong>Yanıt:</strong></p>
      <p>${escapeHtml(data.reply_message).replace(/\n/g, "<br/>")}</p>
      <p><br/></p>
      <p>Detayları görüntülemek için kullanıcı paneline giriş yapabilirsiniz.</p>
      <p>Saygılarımızla,</p>
      <p>${escapeHtml(siteName)} Ekibi</p>
    </div>
  `;

  const text = [
    `Merhaba ${data.user_name},`,
    ``,
    `Destek talebiniz yanıtlandı.`,
    ``,
    `Talep No: ${data.ticket_id}`,
    `Konu: ${data.ticket_subject}`,
    ``,
    `Yanıt:`,
    data.reply_message,
    ``,
    `Detayları görüntülemek için kullanıcı paneline giriş yapabilirsiniz.`,
    ``,
    `Saygılarımızla,`,
    `${siteName} Ekibi`,
  ].join("\n");

  return sendMailRaw({
    to: data.to,
    subject,
    html,
    text,
  });
}

/* ==================================================================
   WELCOME MAIL (email_templates → welcome)
   ================================================================== */

const welcomeMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  user_email: z.string().email(),
  site_name: z.string().optional(),
});

export type WelcomeMailInput = z.infer<typeof welcomeMailSchema>;

export async function sendWelcomeMail(input: WelcomeMailInput) {
  const data = welcomeMailSchema.parse(input);

  const siteName = data.site_name ?? "Dijital Market";

  const subject = `Hesabınız Oluşturuldu - ${siteName}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;text-align:center;">Hesabınız Oluşturuldu</h1>
      <p>Merhaba <strong>${escapeHtml(data.user_name)}</strong>,</p>
      <p>${escapeHtml(siteName)} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
      <p><br/></p>
      <p>E-posta: <strong>${escapeHtml(data.user_email)}</strong></p>
      <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
      <p>Saygılarımızla,</p>
      <p>${escapeHtml(siteName)} Ekibi</p>
    </div>
  `;

  const text = [
    `Merhaba ${data.user_name},`,
    ``,
    `${siteName} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.`,
    ``,
    `E-posta: ${data.user_email}`,
    ``,
    `Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.`,
    ``,
    `Saygılarımızla,`,
    `${siteName} Ekibi`,
  ].join("\n");

  return sendMailRaw({
    to: data.to,
    subject,
    html,
    text,
  });
}

/* ==================================================================
   PASSWORD CHANGED MAIL (şifre değişikliğinde güvenlik maili)
   ================================================================== */

const passwordChangedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string().optional(),
  site_name: z.string().optional(),
});

export type PasswordChangedMailInput = z.infer<typeof passwordChangedMailSchema>;

export async function sendPasswordChangedMail(
  input: PasswordChangedMailInput,
) {
  const data = passwordChangedMailSchema.parse(input);

  const siteName = data.site_name ?? "Dijital Market";
  const displayName = data.user_name ?? "Kullanıcımız";

  const subject = `Şifreniz Güncellendi - ${siteName}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;text-align:center;">Şifreniz Güncellendi</h1>
      <p>Merhaba <strong>${escapeHtml(displayName)}</strong>,</p>
      <p>Hesap şifreniz başarıyla değiştirildi.</p>
      <p>Eğer bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.</p>
      <p>Saygılarımızla,</p>
      <p>${escapeHtml(siteName)} Ekibi</p>
    </div>
  `;

  const text = [
    `Merhaba ${displayName},`,
    ``,
    `Hesap şifreniz başarıyla değiştirildi.`,
    `Eğer bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.`,
    ``,
    `Saygılarımızla,`,
    `${siteName} Ekibi`,
  ].join("\n");

  return sendMailRaw({
    to: data.to,
    subject,
    html,
    text,
  });
}
