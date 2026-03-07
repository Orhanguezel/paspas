import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { siteSettings } from './schema';
import { and, asc, desc, eq, inArray, like, ne, sql } from 'drizzle-orm';
import {
  siteSettingUpsertSchema,
  siteSettingBulkUpsertSchema,
  type JsonLike,
} from './validation';

function parseDbValue(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}
function stringifyValue(v: JsonLike): string {
  return JSON.stringify(v);
}

function normalizeAppLocalesValue(v: unknown): Array<{ code: string; label?: string; is_active?: boolean; is_default?: boolean }> {
  const raw = typeof v === 'string' ? parseDbValue(v) : v;
  const source = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === 'object' && Array.isArray((raw as any).locales) ? (raw as any).locales : []);

  const out: Array<{ code: string; label?: string; is_active?: boolean; is_default?: boolean }> = [];
  for (const item of source as any[]) {
    const code = String(item?.code ?? item ?? '').trim().toLowerCase();
    if (!code) continue;
    out.push({
      code,
      label: typeof item?.label === 'string' ? item.label : undefined,
      is_active: typeof item?.is_active === 'boolean' ? item.is_active : true,
      is_default: typeof item?.is_default === 'boolean' ? item.is_default : undefined,
    });
  }
  return out;
}

function normalizeDefaultLocaleValue(v: unknown): string {
  if (typeof v === 'string') return v.trim().toLowerCase();
  if (v == null) return '';
  return String(v).trim().toLowerCase();
}
function rowToDto(r: typeof siteSettings.$inferSelect) {
  return {
    id: r.id,
    key: r.key,
    value: parseDbValue(r.value),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

/** GET /admin/site_settings  (opsiyonel ama kullanışlı) */
export const adminListSiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    q?: string;          // key/description like
    group?: string;
    keys?: string;       // "a,b,c"
    prefix?: string;     // LIKE prefix%
    order?: string;      // "updated_at.desc" | "key.asc"
    limit?: string | number;
    offset?: string | number;
  };

  let qb = db.select().from(siteSettings).$dynamic();

  const conds: any[] = []; // group kolonu şeman yoksa kaldır
  if (q.prefix) conds.push(like(siteSettings.key, `${q.prefix}%`));
  if (q.keys) {
    const arr = q.keys.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length) conds.push(inArray(siteSettings.key, arr));
  }
  if (q.q) conds.push(like(siteSettings.key, `%${q.q}%`));

  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  if (q.order) {
    const [col, dir] = q.order.split('.');
    const colRef = (siteSettings as any)[col];
    qb = colRef ? qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef)) : qb.orderBy(asc(siteSettings.key));
  } else {
    qb = qb.orderBy(asc(siteSettings.key));
  }

  if (q.limit != null && q.limit !== '') {
    const n = Number(q.limit);
    if (!Number.isNaN(n) && n > 0) qb = qb.limit(n);
  }
  if (q.offset != null && q.offset !== '') {
    const m = Number(q.offset);
    if (!Number.isNaN(m) && m >= 0) qb = qb.offset(m);
  }

  const rows = await qb;
  return reply.send(rows.map(rowToDto));
};

/** GET /admin/site_settings/:key (opsiyonel) */
export const adminGetSiteSettingByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rowToDto(rows[0]));
};

/** GET /admin/site_settings/app-locales */
export const adminGetAppLocales: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'app_locales')).limit(1);
  if (!rows.length) return reply.send([]);
  return reply.send(normalizeAppLocalesValue(rows[0].value));
};

/** GET /admin/site_settings/default-locale */
export const adminGetDefaultLocale: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'default_locale')).limit(1);
  if (!rows.length) return reply.send('tr');
  return reply.send(normalizeDefaultLocaleValue(parseDbValue(rows[0].value)) || 'tr');
};

/** POST /admin/site_settings  body: { key, value }  (create/update - upsert) */
export const adminCreateSiteSetting: RouteHandler = async (req, reply) => {
  try {
    const input = siteSettingUpsertSchema.parse(req.body || {});
    const now = new Date();

    await db.insert(siteSettings).values({
      id: randomUUID(),
      key: input.key,
      value: stringifyValue(input.value),
      created_at: now,
      updated_at: now,
    }).onDuplicateKeyUpdate({
      set: { value: stringifyValue(input.value), updated_at: now },
    });

    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1);
    return reply.code(201).send(rowToDto(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** PUT /admin/site_settings/:key  body: { value } (upsert by key) */
export const adminUpdateSiteSetting: RouteHandler = async (req, reply) => {
  try {
    const { key } = req.params as { key: string };
    const body = (req.body || {}) as Partial<{ key: string; value: JsonLike }>;
    const parsed = siteSettingUpsertSchema.parse({ key, value: body.value });

    const now = new Date();
    await db.insert(siteSettings).values({
      id: randomUUID(),
      key: parsed.key,
      value: stringifyValue(parsed.value),
      created_at: now,
      updated_at: now,
    }).onDuplicateKeyUpdate({
      set: { value: stringifyValue(parsed.value), updated_at: now },
    });

    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return reply.send(rowToDto(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** POST /admin/site_settings/bulk-upsert  body: { items: [{ key, value }, ...] } */
/** POST /admin/site_settings/bulk-upsert  body: { items: [{ key, value }, ...] } */
export const adminBulkUpsertSiteSettings: RouteHandler = async (req, reply) => {
  try {
    const input = siteSettingBulkUpsertSchema.parse(req.body || {});
    const now = new Date();

    const values = input.items.map(i => ({
      id: randomUUID(),
      key: i.key,
      value: stringifyValue(i.value),
      created_at: now,
      updated_at: now,
    }));

    await db.insert(siteSettings).values(values).onDuplicateKeyUpdate({
      set: {
        value: sql`VALUES(${siteSettings.value})`,
        updated_at: sql`VALUES(${siteSettings.updated_at})`,
      },
    });

    const keys = input.items.map(i => i.key);
    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, keys));

    return reply.send(rows.map(rowToDto));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/**
 * DELETE /admin/site_settings (filtreli toplu silme)
 * FE geçici olarak: DELETE /admin/site_settings?id!=0000... şeklinde çağırıyor.
 * Aşağıda id!=, key!=, key_in, prefix desteklenir.
 */
export const adminDeleteManySiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as Record<string, string | undefined>;

  const conds: any[] = [];
  const idNe = q['id!'] ?? q['id_ne'];
  const key = q['key'];
  const keyNe = q['key!'] ?? q['key_ne'];
  const keyIn = q['key_in'] ?? q['keys'];
  const prefix = q['prefix'];

  if (idNe) conds.push(ne(siteSettings.id, idNe));
  if (key)  conds.push(eq(siteSettings.key, key));
  if (keyNe) conds.push(ne(siteSettings.key, keyNe));
  if (keyIn) {
    const arr = keyIn.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length) conds.push(inArray(siteSettings.key, arr));
  }
  if (prefix) conds.push(like(siteSettings.key, `${prefix}%`));

  let d = db.delete(siteSettings).$dynamic();
  if (conds.length === 1) d = d.where(conds[0]);
  else if (conds.length > 1) d = d.where(and(...conds));

  await d;
  return reply.code(204).send();
};

/** DELETE /admin/site_settings/:key  (tek kayıt) */
export const adminDeleteSiteSetting: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
  return reply.code(204).send();
};
