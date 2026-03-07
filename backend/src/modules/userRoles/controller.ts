import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq } from "drizzle-orm";
import { rolePermissions, userRoles } from "./schema";
import {
  userRoleListQuerySchema,
  createUserRoleSchema,
  roleSlugSchema,
  setRolePermissionsSchema,
  type UserRoleListQuery,
  type CreateUserRoleInput,
} from "./validation";
import { ERP_PERMISSION_CATALOG, resolveRolePermissionKeys } from "@/common/middleware/permissions";

const ROLE_META: Record<"admin" | "sevkiyatci" | "operator" | "satin_almaci", { name: string; description: string }> = {
  admin: { name: "Admin", description: "Tum ERP modullerine tam erisim" },
  sevkiyatci: { name: "Sevkiyatci", description: "Satis, sevkiyat ve hareket akislarina odaklanir" },
  operator: { name: "Operator", description: "Makine kuyrugu, operator ve uretim akislarini kullanir" },
  satin_almaci: { name: "Satin Almaci", description: "Stok, satin alma ve tedarikci akislarini kullanir" },
};

// src/modules/userRoles/controller.ts
export const listUserRoles: RouteHandler = async (req, reply) => {
  const q = userRoleListQuerySchema.parse(req.query ?? {}) as UserRoleListQuery;

  const conds: unknown[] = [];
  if (q.user_id) conds.push(eq(userRoles.user_id, q.user_id));
  if (q.role)    conds.push(eq(userRoles.role, q.role));

  let qb = db.select().from(userRoles).$dynamic();

  if (conds.length === 1) qb = qb.where(conds[0] as any);
  else if (conds.length > 1) qb = qb.where(and(...(conds as any)));

  const dir = q.direction === "desc" ? desc : asc;
  qb = qb.orderBy(dir(userRoles.created_at));

  // default limit: 50
  if (q.limit && q.limit > 0) qb = qb.limit(q.limit);
  else qb = qb.limit(50);

  if (q.offset && q.offset >= 0) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows);
};


export const createUserRole: RouteHandler = async (req, reply) => {
  try {
    const body = createUserRoleSchema.parse(req.body ?? {}) as CreateUserRoleInput;
    const id = randomUUID();

    await db.insert(userRoles).values({ id, user_id: body.user_id, role: body.role });
    const [row] = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (err: any) {
    // mysql2: err?.code === 'ER_DUP_ENTRY'
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'user_role_already_exists' } });
    }
    throw err;
  }
};


export const deleteUserRole: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(userRoles).where(eq(userRoles.id, id));
  return reply.code(204).send();
};

export const listPermissions: RouteHandler = async (_req, reply) => {
  return reply.send(ERP_PERMISSION_CATALOG);
};

export const listRoles: RouteHandler = async (_req, reply) => {
  const slugs = Object.keys(ROLE_META) as Array<keyof typeof ROLE_META>;
  const items = await Promise.all(
    slugs.map(async (slug) => ({
      slug,
      name: ROLE_META[slug].name,
      description: ROLE_META[slug].description,
      permissions: await resolveRolePermissionKeys(slug),
      created_at: new Date(0).toISOString(),
      updated_at: new Date().toISOString(),
    })),
  );
  return reply.send(items);
};

export const getRole: RouteHandler = async (req, reply) => {
  const parsed = roleSlugSchema.safeParse(req.params);
  if (!parsed.success) return reply.code(400).send({ error: { message: "gecersiz_rol" } });
  const { slug } = parsed.data;
  return reply.send({
    slug,
    name: ROLE_META[slug].name,
    description: ROLE_META[slug].description,
    permissions: await resolveRolePermissionKeys(slug),
    created_at: new Date(0).toISOString(),
    updated_at: new Date().toISOString(),
  });
};

export const setRolePermissions: RouteHandler = async (req, reply) => {
  const parsedSlug = roleSlugSchema.safeParse(req.params);
  if (!parsedSlug.success) return reply.code(400).send({ error: { message: "gecersiz_rol" } });
  const parsedBody = setRolePermissionsSchema.safeParse(req.body ?? {});
  if (!parsedBody.success) return reply.code(400).send({ error: { message: "gecersiz_istek_govdesi" } });

  const { slug } = parsedSlug.data;
  const catalog = new Set<string>(ERP_PERMISSION_CATALOG.map((item) => item.key));
  const permissions = parsedBody.data.permissions.filter((key: string) => catalog.has(key));

  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.role, slug));
    if (permissions.length === 0) return;
    await tx.insert(rolePermissions).values(
      permissions.map((permissionKey) => ({
        id: randomUUID(),
        role: slug,
        permission_key: permissionKey,
        is_allowed: 1,
      })),
    );
  });

  return reply.send({ ok: true });
};
