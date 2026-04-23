// ===================================================================
// FILE: src/modules/notifications/controller.ts
// ===================================================================

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, desc, eq, sql } from "drizzle-orm";
import { userRoles } from "@/modules/userRoles/schema";
import {
  notifications,
  type NotificationRow,
  type NotificationInsert,
  type NotificationType,
} from "./schema";
import {
  publishNotification,
  subscribeToUserNotifications,
} from "./realtime";
import {
  notificationCreateSchema,
  notificationUpdateSchema,
  notificationMarkAllReadSchema,
} from "./validation";

/* ---------------------------------------------------------------
 * Ortak user helper (orders modülündeki pattern ile aynı)
 * --------------------------------------------------------------- */

function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error("unauthorized");
  return String(sub);
}

function writeSseEvent(
  stream: NodeJS.WritableStream,
  event: string,
  payload: unknown
): void {
  stream.write(`event: ${event}\n`);
  stream.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/* ---------------------------------------------------------------
 * Programatik kullanım: createUserNotification (orders vs. çağıracak)
 * --------------------------------------------------------------- */

export async function createUserNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}): Promise<NotificationRow> {
  const insert: NotificationInsert = {
    id: randomUUID(),
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "system",
    is_read: false,
    created_at: new Date(),
  };

  await db.insert(notifications).values(insert);
  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, insert.id))
    .limit(1);

  if (row) publishNotification(row);
  return row;
}

export async function createAdminNotification(input: {
  title: string;
  message: string;
  type?: NotificationType;
}): Promise<NotificationRow[]> {
  const adminRows = await db
    .selectDistinct({ userId: userRoles.user_id })
    .from(userRoles)
    .where(eq(userRoles.role, "admin"));

  if (adminRows.length === 0) return [];

  return Promise.all(
    adminRows.map(({ userId }) =>
      createUserNotification({
        userId,
        title: input.title,
        message: input.message,
        type: input.type,
      })
    )
  );
}

/* ---------------------------------------------------------------
 * HTTP Handlers
 * --------------------------------------------------------------- */

// GET /notifications  → aktif kullanıcının bildirim listesi
export const listNotifications: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);

    const {
      is_read,
      type,
      limit = 50,
      offset = 0,
    } = (req.query ?? {}) as {
      is_read?: string | boolean;
      type?: string;
      limit?: number;
      offset?: number;
    };

    const whereConds = [eq(notifications.user_id, userId)];

    if (typeof type === "string" && type.trim().length > 0) {
      whereConds.push(eq(notifications.type, type.trim()));
    }

    if (typeof is_read !== "undefined") {
      const b =
        typeof is_read === "boolean"
          ? is_read
          : ["1", "true", "yes"].includes(String(is_read).toLowerCase());
      whereConds.push(eq(notifications.is_read, b));
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...whereConds))
      .orderBy(desc(notifications.created_at))
      .limit(Number(limit))
      .offset(Number(offset));

    return reply.send(rows);
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notifications_list_failed" } });
  }
};

// GET /notifications/unread-count → okunmamış bildirim sayısı
export const getUnreadCount: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);

    const [row] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(notifications)
      .where(
        and(eq(notifications.user_id, userId), eq(notifications.is_read, false))
      );

    const count = Number(row?.count ?? 0);
    return reply.send({ count });
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notifications_unread_count_failed" } });
  }
};

// GET /notifications/stream → SSE canlı bildirim akışı
export const streamNotifications: RouteHandler = async (req, reply) => {
  let userId = "";

  try {
    userId = getAuthUserId(req);
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notifications_stream_failed" } });
  }

  reply.hijack();
  const stream = reply.raw;

  stream.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  stream.write("retry: 5000\n\n");

  const unsubscribe = subscribeToUserNotifications(userId, (notification) => {
    try {
      writeSseEvent(stream, "notification", notification);
    } catch (error) {
      req.log.warn({ error }, "notifications_stream_write_failed");
    }
  });

  let closed = false;
  const heartbeat = setInterval(() => {
    if (closed || stream.writableEnded || stream.destroyed) return;
    try {
      writeSseEvent(stream, "ping", {
        ts: new Date().toISOString(),
      });
    } catch {
      cleanup();
    }
  }, 25_000);

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
    req.raw.off("close", cleanup);
    req.raw.off("end", cleanup);
    req.raw.off("error", cleanup);
    if (!stream.writableEnded && !stream.destroyed) stream.end();
  };

  req.raw.on("close", cleanup);
  req.raw.on("end", cleanup);
  req.raw.on("error", cleanup);

  writeSseEvent(stream, "connected", {
    ok: true,
    userId,
    ts: new Date().toISOString(),
  });
};

// POST /notifications → manuel bildirim oluşturma (örn. panelden)
export const createNotificationHandler: RouteHandler = async (req, reply) => {
  try {
    const authUserId = getAuthUserId(req);

    const body = notificationCreateSchema.parse(req.body ?? {});
    const targetUserId = body.user_id ?? authUserId;

    const row = await createUserNotification({
      userId: targetUserId,
      title: body.title,
      message: body.message,
      type: body.type,
    });

    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notification_create_failed" } });
  }
};

// PATCH /notifications/:id → okundu/okunmadı
export const markNotificationRead: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    const userId = getAuthUserId(req);
    const patch = notificationUpdateSchema.parse(req.body ?? {});

    // Varsayılan: is_read true
    const isRead = patch.is_read ?? true;

    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing || existing.user_id !== userId) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    await db
      .update(notifications)
      .set({ is_read: isRead })
      .where(eq(notifications.id, id));

    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notification_update_failed" } });
  }
};

// POST /notifications/mark-all-read → tüm bildirimleri okundu yap
export const markAllRead: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    notificationMarkAllReadSchema.parse(req.body ?? {});

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(
        and(eq(notifications.user_id, userId), eq(notifications.is_read, false))
      );

    return reply.send({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notifications_mark_all_read_failed" } });
  }
};

// DELETE /notifications/:id → tek bildirim sil
export const deleteNotification: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    const userId = getAuthUserId(req);

    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing || existing.user_id !== userId) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    await db.delete(notifications).where(eq(notifications.id, id));

    return reply.send({ ok: true });
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ error: { message: "unauthorized" } });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "notification_delete_failed" } });
  }
};
