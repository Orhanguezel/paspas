// ===================================================================
// FILE: src/modules/notifications/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  listNotifications,
  getUnreadCount,
  streamNotifications,
  createNotificationHandler,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from "./controller";

const BASE = "/notifications";

export async function registerNotifications(app: FastifyInstance) {
  // Liste + unread sayısı
  app.get(BASE, { preHandler: [requireAuth] }, listNotifications);
  app.get(
    `${BASE}/unread-count`,
    { preHandler: [requireAuth] },
    getUnreadCount
  );
  app.get(`${BASE}/stream`, { preHandler: [requireAuth] }, streamNotifications);

  // CRUD / aksiyonlar
  app.post(BASE, { preHandler: [requireAuth] }, createNotificationHandler);
  app.patch(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    markNotificationRead
  );
  app.post(
    `${BASE}/mark-all-read`,
    { preHandler: [requireAuth] },
    markAllRead
  );
  app.delete(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    deleteNotification
  );
}
