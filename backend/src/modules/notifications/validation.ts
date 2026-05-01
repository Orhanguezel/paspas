// ===================================================================
// FILE: src/modules/notifications/validation.ts
// ===================================================================

import { z } from "zod";
import type { NotificationType } from "./schema";

export const notificationCreateSchema = z.object({
  // Eğer sistem tarafından başka kullanıcıya bildirim gönderilecekse gerekli
  user_id: z.string().uuid().optional(),

  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.string().min(1).max(50) as unknown as z.ZodType<NotificationType>,
});

export const notificationUpdateSchema = z.object({
  // Şimdilik sadece okundu bilgisini güncelliyoruz
  is_read: z.boolean().optional(),
});

/**
 * Mark-all-read için ekstra body alanı eklemek istersen buraya ekleyebilirsin.
 * Şimdilik body boş, sadece auth user için çalışıyor.
 */
export const notificationMarkAllReadSchema = z.object({}).optional();
