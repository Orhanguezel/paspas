// =============================================================
// FILE: src/modules/subCategories/admin.controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { nullIfEmpty, toBool } from '@/modules/_shared/normalizers';
import { storageAssets } from '@/modules/storage/schema';
import { env } from '@/core/env';

import { subCategories } from './schema';
import {
  subCategoryCreateSchema,
  subCategoryUpdateSchema,
  subCategorySetImageSchema,
  type SubCategoryCreateInput,
  type SubCategoryUpdateInput,
  type SubCategorySetImageInput,
} from './validation';

const toNum = (v: unknown, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function publicUrlOf(bucket: string, path: string, providerUrl?: string | null) {
  if (providerUrl) return providerUrl;
  const encSeg = (s: string) => encodeURIComponent(s);
  const encPath = (p: string) => p.split('/').map(encSeg).join('/');
  const cdnBase = (env.CDN_PUBLIC_BASE || '').replace(/\/+$/, '');
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || '').replace(/\/+$/, '');
  return `${apiBase || ''}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

function isDup(err: unknown) {
  const code = (err as { code?: string; errno?: number })?.code ?? (err as { errno?: number })?.errno;
  return code === 'ER_DUP_ENTRY' || code === 1062;
}

// ── LIST ────────────────────────────────────────────────────────

export type AdminListSubCategoriesQS = {
  q?: string;
  category_id?: string;
  is_active?: string | boolean;
  is_featured?: string | boolean;
  limit?: number | string;
  offset?: number | string;
  sort?: 'display_order' | 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
};

export const adminListSubCategories: RouteHandler<{
  Querystring: AdminListSubCategoriesQS;
}> = async (req, reply) => {
  const {
    q,
    category_id,
    is_active,
    is_featured,
    limit = 500,
    offset = 0,
    sort = 'display_order',
    order = 'asc',
  } = req.query ?? {};

  const conds: ReturnType<typeof eq>[] = [];

  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    conds.push(or(like(subCategories.name, pattern), like(subCategories.slug, pattern)) as ReturnType<typeof eq>);
  }
  if (category_id) conds.push(eq(subCategories.category_id, category_id));

  const a = typeof is_active === 'boolean' ? is_active : is_active !== undefined ? toBool(is_active) : undefined;
  if (a !== undefined) conds.push(eq(subCategories.is_active, a));
  const f = typeof is_featured === 'boolean' ? is_featured : is_featured !== undefined ? toBool(is_featured) : undefined;
  if (f !== undefined) conds.push(eq(subCategories.is_featured, f));

  const col =
    sort === 'name'
      ? subCategories.name
      : sort === 'created_at'
        ? subCategories.created_at
        : sort === 'updated_at'
          ? subCategories.updated_at
          : subCategories.display_order;

  let qb = db.select().from(subCategories).$dynamic();
  if (conds.length) qb = qb.where(and(...conds));

  const rows = await qb
    .orderBy(order === 'desc' ? desc(col) : asc(col))
    .limit(toNum(limit, 500))
    .offset(toNum(offset, 0));

  return reply.send(rows);
};

// ── GET by ID ───────────────────────────────────────────────────

export const adminGetSubCategoryById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// ── GET by slug ─────────────────────────────────────────────────

export const adminGetSubCategoryBySlug: RouteHandler<{
  Params: { slug: string };
  Querystring: { category_id?: string };
}> = async (req, reply) => {
  const conds = [eq(subCategories.slug, req.params.slug)];
  if (req.query.category_id) conds.push(eq(subCategories.category_id, req.query.category_id));

  const rows = await db.select().from(subCategories).where(and(...conds)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// ── CREATE ──────────────────────────────────────────────────────

export const adminCreateSubCategory: RouteHandler<{ Body: SubCategoryCreateInput }> = async (req, reply) => {
  const parsed = subCategoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const data = parsed.data;
  const id = data.id ?? randomUUID();
  const payload = {
    id,
    category_id: data.category_id,
    name: data.name.trim(),
    slug: data.slug.trim(),
    description: (nullIfEmpty(data.description) as string | null) ?? null,
    image_url: (nullIfEmpty(data.image_url) as string | null) ?? null,
    storage_asset_id: null,
    alt: (nullIfEmpty(data.alt) as string | null) ?? null,
    icon: (nullIfEmpty(data.icon) as string | null) ?? null,
    has_cart: data.has_cart === undefined ? true : toBool(data.has_cart),
    is_active: data.is_active === undefined ? true : toBool(data.is_active),
    is_featured: data.is_featured === undefined ? false : toBool(data.is_featured),
    display_order: data.display_order ?? 0,
  };

  try {
    await db.insert(subCategories).values(payload);
  } catch (err: unknown) {
    if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    return reply.code(500).send({ error: { message: 'db_error', detail: String((err as Error)?.message ?? err) } });
  }

  const [row] = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
  return reply.code(201).send(row);
};

// ── PATCH ───────────────────────────────────────────────────────

export const adminPatchSubCategory: RouteHandler<{
  Params: { id: string };
  Body: SubCategoryUpdateInput;
}> = async (req, reply) => {
  const parsed = subCategoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const patch = parsed.data;
  const set: Record<string, unknown> = { updated_at: sql`CURRENT_TIMESTAMP(3)` };

  if (patch.category_id !== undefined) set.category_id = patch.category_id;
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.slug !== undefined) set.slug = patch.slug.trim();
  if (patch.description !== undefined) set.description = nullIfEmpty(patch.description) as string | null;
  if (patch.image_url !== undefined) set.image_url = nullIfEmpty(patch.image_url) as string | null;
  if (patch.alt !== undefined) set.alt = nullIfEmpty(patch.alt) as string | null;
  if (patch.icon !== undefined) set.icon = nullIfEmpty(patch.icon) as string | null;
  if (patch.has_cart !== undefined) set.has_cart = toBool(patch.has_cart);
  if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active);
  if (patch.is_featured !== undefined) set.is_featured = toBool(patch.is_featured);
  if (patch.display_order !== undefined) set.display_order = Number(patch.display_order) || 0;

  try {
    await db.update(subCategories).set(set as never).where(eq(subCategories.id, req.params.id));
  } catch (err: unknown) {
    if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    return reply.code(500).send({ error: { message: 'db_error', detail: String((err as Error)?.message ?? err) } });
  }

  const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// ── DELETE ──────────────────────────────────────────────────────

export const adminDeleteSubCategory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(subCategories).where(eq(subCategories.id, req.params.id));
  return reply.code(204).send();
};

// ── REORDER ─────────────────────────────────────────────────────

export const adminReorderSubCategories: RouteHandler<{
  Body: { items: Array<{ id: string; display_order: number }> };
}> = async (req, reply) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return reply.send({ ok: true });

  for (const it of items) {
    await db
      .update(subCategories)
      .set({ display_order: Number(it.display_order) || 0, updated_at: sql`CURRENT_TIMESTAMP(3)` } as never)
      .where(eq(subCategories.id, it.id));
  }
  return reply.send({ ok: true });
};

// ── TOGGLE ACTIVE ───────────────────────────────────────────────

export const adminToggleSubCategoryActive: RouteHandler<{
  Params: { id: string };
  Body: { is_active: boolean };
}> = async (req, reply) => {
  const v = !!req.body?.is_active;
  await db
    .update(subCategories)
    .set({ is_active: v, updated_at: sql`CURRENT_TIMESTAMP(3)` } as never)
    .where(eq(subCategories.id, req.params.id));

  const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// ── TOGGLE FEATURED ─────────────────────────────────────────────

export const adminToggleSubCategoryFeatured: RouteHandler<{
  Params: { id: string };
  Body: { is_featured: boolean };
}> = async (req, reply) => {
  const v = !!req.body?.is_featured;
  await db
    .update(subCategories)
    .set({ is_featured: v, updated_at: sql`CURRENT_TIMESTAMP(3)` } as never)
    .where(eq(subCategories.id, req.params.id));

  const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// ── SET IMAGE ───────────────────────────────────────────────────

export const adminSetSubCategoryImage: RouteHandler<{
  Params: { id: string };
  Body: SubCategorySetImageInput;
}> = async (req, reply) => {
  const parsed = subCategorySetImageSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const assetId = parsed.data.asset_id ?? null;
  const alt = parsed.data.alt;

  if (!assetId) {
    const patch: Record<string, unknown> = {
      image_url: null,
      storage_asset_id: null,
      updated_at: sql`CURRENT_TIMESTAMP(3)`,
    };
    if (alt !== undefined) patch.alt = alt as string | null;
    await db.update(subCategories).set(patch as never).where(eq(subCategories.id, req.params.id));

    const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  }

  const [asset] = await db
    .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);

  if (!asset) return reply.code(404).send({ error: { message: 'asset_not_found' } });

  const publicUrl = publicUrlOf(asset.bucket, asset.path, asset.url ?? null);
  const patch: Record<string, unknown> = {
    image_url: publicUrl,
    storage_asset_id: assetId,
    updated_at: sql`CURRENT_TIMESTAMP(3)`,
  };
  if (alt !== undefined) patch.alt = alt as string | null;

  await db.update(subCategories).set(patch as never).where(eq(subCategories.id, req.params.id));

  const rows = await db.select().from(subCategories).where(eq(subCategories.id, req.params.id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};
