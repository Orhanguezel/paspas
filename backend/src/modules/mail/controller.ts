// ===================================================================
// FILE: src/modules/mail/controller.ts
// ===================================================================

import type { RouteHandler } from "fastify";
import { sendMailRaw, sendOrderCreatedMail } from "./service";
import { sendMailSchema, orderCreatedMailSchema } from "./validation";

/**
 * Küçük yardımcı: req.user içinden email'i güvenli çek
 */
const getUserEmail = (req: any): string | undefined => {
  const u = req.user;
  if (!u || typeof u !== "object") return undefined;

  // "email" alanı var mı?
  if ("email" in u && (u as any).email != null) {
    return String((u as any).email);
  }

  // İstersen burada token payload'dan da çekebilirsin (sub claim vs.)
  return undefined;
};

/**
 * Test amaçlı: POST /mail/test
 * Body: { to?: string }
 */
export const sendTestMail: RouteHandler = async (req, reply) => {
  try {
    const body = (req.body ?? {}) as { to?: string };

    const to =
      body.to && body.to.length > 0 ? body.to : getUserEmail(req);

    if (!to) {
      return reply
        .code(400)
        .send({ error: { message: "to_required_for_test_mail" } });
    }

    await sendMailRaw({
      to,
      subject: "SMTP Test – Kaman ilan",
      text: "Bu bir test mailidir. SMTP ayarlarınız başarılı görünüyor.",
      html: "<p>Bu bir <strong>test mailidir</strong>. SMTP ayarlarınız başarılı görünüyor.</p>",
    });

    return reply.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "mail_test_failed", details: e?.message } });
  }
};


/**
 * Genel amaçlı mail gönderimi:
 * POST /mail/send
 * Body: { to, subject, text?, html? }
 * (Admin / panel için)
 */
export const sendMailHandler: RouteHandler = async (req, reply) => {
  try {
    const body = sendMailSchema.parse(req.body ?? {});
    await sendMailRaw(body);
    return reply.code(201).send({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "mail_send_failed", details: e?.message } });
  }
};


/**
 * Sipariş oluşturma mailini REST üzerinden tetiklemek istersen:
 * POST /mail/order-created
 * Body: OrderCreatedMailInput
 *
 * NOT: Artık HTML'i elle üretmiyoruz; email_templates içindeki
 * "order_received" template'ini kullanıyoruz.
 */
export const sendOrderCreatedMailHandler: RouteHandler = async (
  req,
  reply,
) => {
  try {
    const body = orderCreatedMailSchema.parse(req.body ?? {});
    await sendOrderCreatedMail(body);
    return reply.code(201).send({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({
      error: { message: "order_created_mail_failed", details: e?.message },
    });
  }
};
