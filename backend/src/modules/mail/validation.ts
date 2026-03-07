// ===================================================================
// FILE: src/modules/mail/validation.ts
// ===================================================================

import { z } from "zod";

export const sendMailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  text: z.string().optional(),
  html: z.string().optional(),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;

/**
 * Sipariş oluşturma maili için payload
 * (orders controller + /mail/order-created endpoint’inden kullanmak için)
 *
 * NOT:
 *  - site_name artık çağıran için OPSİYONEL.
 *  - locale, email-templates / tarih formatı vs. için opsiyonel.
 */
export const orderCreatedMailSchema = z.object({
  to: z.string().email(),
  customer_name: z.string().min(1),
  order_number: z.string().min(1),
  final_amount: z.string().min(1), // "199.90" gibi string
  status: z.string().min(1),       // "pending" | "processing" | ...
  site_name: z.string().min(1).optional(),
  locale: z.string().max(10).optional(),
});

export type OrderCreatedMailInput = z.infer<typeof orderCreatedMailSchema>;
