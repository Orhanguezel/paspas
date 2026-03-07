// src/modules/siteSettings/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { eq, like, inArray, asc, desc, and, sql } from 'drizzle-orm';
import { siteSettings } from './schema';
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

/** Tek satırı FE'nin beklediği DTO'ya çevir */
function rowToDto(r: typeof siteSettings.$inferSelect) {
  return {
    id: r.id,
    key: r.key,
    value: parseDbValue(r.value),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

/**
 * GET /site_settings
 * Query:
 * - select:   (yok sayılır; FE uyumu için var)
 * - key:      eşitlik
 * - key_in:   "a,b,c" -> IN(...)
 * - prefix:   LIKE 'prefix%'
 * - order:    "updated_at.desc" | "key.asc" (yoksa key.asc)
 * - limit, offset: sayı
 */
export const listSiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    select?: string;
    key?: string;
    key_in?: string; // mevcut
    keys?: string;   // <-- alias
    prefix?: string;
    order?: string;
    limit?: string | number;
    offset?: string | number;
  };

  let qb = db.select().from(siteSettings).$dynamic();
  const conditions: unknown[] = [];

  if (q.prefix) conditions.push(like(siteSettings.key, `${q.prefix}%`));
  if (q.key)    conditions.push(eq(siteSettings.key, q.key));

  const keyInParam = q.key_in ?? q.keys; // alias
  if (keyInParam) {
    const arr = keyInParam.split(',').map(s => s.trim()).filter(Boolean);
    if (arr.length) conditions.push(inArray(siteSettings.key, arr));
  }

  if (conditions.length === 1) qb = qb.where(conditions[0] as any);
  else if (conditions.length > 1) qb = qb.where(and(...(conditions as any)));

  // order
  if (q.order) {
    const [col, dir] = q.order.split('.');
    const colRef = (siteSettings as any)[col];
    if (colRef) {
      qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));
    } else {
      qb = qb.orderBy(asc(siteSettings.key));
    }
  } else {
    qb = qb.orderBy(asc(siteSettings.key));
  }

  // limit/offset
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

/** GET /site_settings/:key */
export const getSiteSettingByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };

  const rows = await db.select().from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(rowToDto(rows[0]));
};

/** GET /site_settings/app-locales */
export const getAppLocales: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'app_locales')).limit(1);
  if (!rows.length) return reply.send([]);
  return reply.send(normalizeAppLocalesValue(rows[0].value));
};

/** GET /site_settings/default-locale */
export const getDefaultLocale: RouteHandler = async (_req, reply) => {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'default_locale')).limit(1);
  if (!rows.length) return reply.send('tr');
  return reply.send(normalizeDefaultLocaleValue(parseDbValue(rows[0].value)) || 'tr');
};
