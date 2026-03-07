// src/modules/auth/admin.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { users, refresh_tokens } from "@/modules/auth/schema";
import { getPrimaryRole } from "@/modules/userRoles/service";
import { userRoles } from "@/modules/userRoles/schema";
import { profiles } from "@/modules/profiles/schema";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { hash as argonHash } from "argon2";
import { ensureProfileRow } from "./controller";
import { makineler } from "@/modules/makine_havuzu/schema";
import {
  notifications,
  type NotificationInsert,
} from "@/modules/notifications/schema";
import { sendPasswordChangedMail } from "@/modules/mail/service";

/** Ortak tipler */
type UserRow = typeof users.$inferSelect;

const toBool = (v: unknown): boolean =>
  typeof v === "boolean" ? v : Number(v) === 1;

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0);

const createUserBody = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),
  role: z.enum(["admin", "sevkiyatci", "operator", "satin_almaci"]).default("operator"),
  erp_personel_kodu: z.string().trim().min(2).max(64).nullable().optional(),
  erp_departman: z.string().trim().min(2).max(64).nullable().optional(),
  erp_ekip: z.string().trim().min(2).max(64).nullable().optional(),
  varsayilan_makine_id: z.string().trim().min(1).nullable().optional(),
  erp_notlar: z.string().trim().max(500).nullable().optional(),
});

/** Zod şemaları */
const listQuery = z.object({
  q: z.string().optional(),
  role: z.enum(["admin", "sevkiyatci", "operator", "satin_almaci"]).optional(),
  erp_departman: z.string().trim().min(1).max(64).optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  sort: z.enum(["created_at", "email", "last_login_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const updateUserBody = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(6).max(50).optional(),
    email: z.string().email().optional(),
    erp_personel_kodu: z.string().trim().min(2).max(64).nullable().optional(),
    erp_departman: z.string().trim().min(2).max(64).nullable().optional(),
    erp_ekip: z.string().trim().min(2).max(64).nullable().optional(),
    varsayilan_makine_id: z.string().trim().min(1).nullable().optional(),
    erp_notlar: z.string().trim().max(500).nullable().optional(),
    is_active: z
      .union([z.boolean(), z.number().int().min(0).max(1)])
      .optional(),
  })
  .strict();

const setActiveBody = z.object({
  is_active: z.union([z.boolean(), z.number().int().min(0).max(1)]),
});

const setRolesBody = z.object({
  roles: z.array(z.enum(["admin", "sevkiyatci", "operator", "satin_almaci"])).default([]),
});

const setPasswordBody = z.object({
  password: z.string().min(8).max(200),
});

async function hydrateAdminUsers(rows: UserRow[]) {
  const withRole = await Promise.all(
    rows.map(async (u) => ({
      ...u,
      role: await getPrimaryRole(u.id),
    })),
  );

  const machineIds = Array.from(
    new Set(
      withRole
        .map((u) => u.varsayilan_makine_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const machineRows = machineIds.length > 0
    ? await db.select().from(makineler).where(inArray(makineler.id, machineIds))
    : [];
  const machineMap = new Map(machineRows.map((m) => [m.id, m]));

  return withRole.map((u) => {
    const defaultMachine = u.varsayilan_makine_id ? machineMap.get(u.varsayilan_makine_id) : null;
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name ?? null,
      phone: u.phone ?? null,
      email_verified: u.email_verified,
      is_active: u.is_active,
      created_at: u.created_at,
      last_login_at: u.last_sign_in_at,
      role: u.role,
      wallet_balance: toNum(u.wallet_balance),
      erp_personel_kodu: u.erp_personel_kodu ?? null,
      erp_departman: u.erp_departman ?? null,
      erp_ekip: u.erp_ekip ?? null,
      varsayilan_makine_id: u.varsayilan_makine_id ?? null,
      varsayilan_makine_kod: defaultMachine?.kod ?? null,
      varsayilan_makine_ad: defaultMachine?.ad ?? null,
      erp_notlar: u.erp_notlar ?? null,
    };
  });
}

export function makeAdminController(_app: FastifyInstance) {
  return {
    /** GET /admin/users */
    list: async (req: FastifyRequest, reply: FastifyReply) => {
      const q = listQuery.parse(req.query ?? {});

      const conds: any[] = [];
      if (q.q) {
        conds.push(or(
          like(users.email, `%${q.q}%`),
          like(users.full_name, `%${q.q}%`),
          like(users.phone, `%${q.q}%`),
          like(users.erp_personel_kodu, `%${q.q}%`),
          like(users.erp_departman, `%${q.q}%`),
          like(users.erp_ekip, `%${q.q}%`),
        ));
      }
      if (typeof q.is_active === "boolean") {
        conds.push(eq(users.is_active, q.is_active ? 1 : 0));
      }
      if (q.erp_departman) {
        conds.push(eq(users.erp_departman, q.erp_departman));
      }
      const where =
        conds.length === 0
          ? undefined
          : conds.length === 1
          ? conds[0]
          : and(...conds);

      const sortCol =
        q.sort === "email"
          ? users.email
          : q.sort === "last_login_at"
          ? users.last_sign_in_at
          : users.created_at;
      const orderFn = q.order === "asc" ? asc : desc;

      const base = await db
        .select()
        .from(users)
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(q.limit)
        .offset(q.offset);

      const withRole = await hydrateAdminUsers(base);

      const filtered = q.role
        ? withRole.filter((u) => u.role === q.role)
        : withRole;
      return reply.send(filtered);
    },

    /** POST /admin/users */
    create: async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createUserBody.safeParse(req.body);
      if (!body.success)
        return reply.status(400).send({ error: { message: "invalid_body", issues: body.error.flatten() } });

      const { email, password, role, full_name, phone, ...erpFields } = body.data;

      const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (exists.length > 0)
        return reply.status(409).send({ error: { message: "user_exists" } });

      const id = randomUUID();
      const password_hash = await argonHash(password);

      await db.insert(users).values({
        id,
        email,
        password_hash,
        full_name: full_name ?? null,
        phone: phone ?? null,
        erp_personel_kodu: erpFields.erp_personel_kodu ?? null,
        erp_departman: erpFields.erp_departman ?? null,
        erp_ekip: erpFields.erp_ekip ?? null,
        varsayilan_makine_id: erpFields.varsayilan_makine_id ?? null,
        erp_notlar: erpFields.erp_notlar ?? null,
        is_active: 1,
        email_verified: 1,
      });

      await db.insert(userRoles).values({
        id: randomUUID(),
        user_id: id,
        role,
      });

      await ensureProfileRow(id, { full_name: full_name ?? null, phone: phone ?? null });

      const created = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!created)
        return reply.status(500).send({ error: { message: "create_failed" } });

      const [detail] = await hydrateAdminUsers([created]);
      return reply.status(201).send(detail);
    },

    /** GET /admin/users/:id */
    get: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u)
        return reply.status(404).send({ error: { message: "not_found" } });

      const [detail] = await hydrateAdminUsers([u]);
      return reply.send(detail);
    },

    /** PATCH /admin/users/:id */
    update: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const body = updateUserBody.parse(req.body ?? {});

      const existing = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!existing)
        return reply.status(404).send({ error: { message: "not_found" } });

      const patch: Partial<UserRow> = {
        ...(body.full_name ? { full_name: body.full_name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(body.erp_personel_kodu !== undefined ? { erp_personel_kodu: body.erp_personel_kodu } : {}),
        ...(body.erp_departman !== undefined ? { erp_departman: body.erp_departman } : {}),
        ...(body.erp_ekip !== undefined ? { erp_ekip: body.erp_ekip } : {}),
        ...(body.varsayilan_makine_id !== undefined ? { varsayilan_makine_id: body.varsayilan_makine_id } : {}),
        ...(body.erp_notlar !== undefined ? { erp_notlar: body.erp_notlar } : {}),
        ...(body.is_active != null
          ? { is_active: toBool(body.is_active) ? 1 : 0 }
          : {}),
        updated_at: new Date(),
      };

      await db.update(users).set(patch).where(eq(users.id, id));

      const updated = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!updated)
        return reply.status(404).send({ error: { message: "not_found" } });

      const [detail] = await hydrateAdminUsers([updated]);
      return reply.send(detail);
    },

    /** POST /admin/users/:id/active  { is_active } */
    setActive: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { is_active } = setActiveBody.parse(req.body ?? {});

      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u)
        return reply.status(404).send({ error: { message: "not_found" } });

      const active = toBool(is_active);

      await db
        .update(users)
        .set({
          is_active: active ? 1 : 0,
          ...(active ? { email_verified: 1 } : {}),
          updated_at: new Date(),
        })
        .where(eq(users.id, id));

      return reply.send({ ok: true });
    },

    /** POST /admin/users/:id/roles  { roles: string[] }  (tam set) */
    setRoles: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { roles } = setRolesBody.parse(req.body ?? {});
      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u)
        return reply.status(404).send({ error: { message: "not_found" } });

      await db.transaction(async (tx) => {
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        if (roles.length > 0) {
          await tx.insert(userRoles).values(
            roles.map((r) => ({
              id: randomUUID(),
              user_id: id,
              role: r,
            }))
          );
        }
      });

      return reply.send({ ok: true });
    },

    /** POST /admin/users/:id/password  { password } */
    setPassword: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { password } = setPasswordBody.parse(req.body ?? {});

      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u)
        return reply.status(404).send({ error: { message: "not_found" } });

      const password_hash = await argonHash(password);

      await db
        .update(users)
        .set({
          password_hash,
          is_active: 1,       // 🔹 Şifre atanıyorsa kullanıcı aktif olsun
          email_verified: 1,  // 🔹 Verify zorunluluğu kalksın
          updated_at: new Date(),
        })
        .where(eq(users.id, id));

      // 🔔 Notification
      try {
        const notif: NotificationInsert = {
          id: randomUUID(),
          user_id: id,
          title: "Şifreniz güncellendi",
          message:
            "Hesap şifreniz yönetici tarafından güncellendi. Bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.",
          type: "password_changed",
          is_read: false,
          created_at: new Date(),
        };
        await db.insert(notifications).values(notif);
      } catch (err) {
        req.log?.error?.(err, "admin_password_change_notification_failed");
      }

      // ✉ Mail
      const targetEmail = u.email;
      if (targetEmail) {
        const userName =
          (u.full_name && u.full_name.length > 0
            ? u.full_name
            : targetEmail.split("@")[0]) || "Kullanıcı";
        void sendPasswordChangedMail({
          to: targetEmail,
          user_name: userName,
          site_name: "Dijital Market",
        }).catch((err) => {
          req.log?.error?.(err, "admin_password_change_mail_failed");
        });
      }

      return reply.send({ ok: true });
    },

    /** DELETE /admin/users/:id */
    remove: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);

      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u)
        return reply.status(404).send({ error: { message: "not_found" } });

      await db.transaction(async (tx) => {
        await tx
          .delete(refresh_tokens)
          .where(eq(refresh_tokens.user_id, id));
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        await tx.delete(profiles).where(eq(profiles.id, id));
        await tx.delete(users).where(eq(users.id, id));
      });

      return reply.send({ ok: true });
    },
  };
}
