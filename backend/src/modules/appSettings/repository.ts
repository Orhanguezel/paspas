import { randomUUID } from 'node:crypto';

import { and, asc, eq, inArray, like, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { appSettingsTable, type AppSettingRow } from './schema';
import type { BulkUpsertBody, DeleteManyQuery, ListQuery, UpsertBody, UpdateBody } from './validation';

function stringifyValue(value: unknown): string {
  return JSON.stringify(value);
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function normalizeAppLocales(value: unknown): Array<{ code: string; label?: string; is_active?: boolean; is_default?: boolean }> {
  const source = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' && Array.isArray((value as { locales?: unknown[] }).locales)
      ? (value as { locales: unknown[] }).locales
      : []);

  const out: Array<{ code: string; label?: string; is_active?: boolean; is_default?: boolean }> = [];
  for (const item of source) {
    const record = (item ?? {}) as Record<string, unknown>;
    const code = String(record.code ?? item ?? '').trim().toLowerCase();
    if (!code) continue;
    out.push({
      code,
      label: typeof record.label === 'string' ? record.label : undefined,
      is_active: typeof record.is_active === 'boolean' ? record.is_active : true,
      is_default: typeof record.is_default === 'boolean' ? record.is_default : undefined,
    });
  }
  return out;
}

function normalizeDefaultLocale(value: unknown): string {
  if (typeof value === 'string') return value.trim().toLowerCase();
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

function buildListWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.q) conditions.push(like(appSettingsTable.key, `%${query.q}%`));
  if (query.prefix) conditions.push(like(appSettingsTable.key, `${query.prefix}%`));

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function buildDeleteWhere(query: DeleteManyQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.key) conditions.push(eq(appSettingsTable.key, query.key));
  if (query.keyNe) conditions.push(ne(appSettingsTable.key, query.keyNe));
  if (query.prefix) conditions.push(like(appSettingsTable.key, `${query.prefix}%`));

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoList(query: ListQuery): Promise<AppSettingRow[]> {
  return db
    .select()
    .from(appSettingsTable)
    .where(buildListWhere(query))
    .orderBy(asc(appSettingsTable.key))
    .limit(query.limit)
    .offset(query.offset);
}

export async function repoGetByKey(key: string): Promise<AppSettingRow | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key)).limit(1);
  return rows[0] ?? null;
}

export async function repoUpsert(body: UpsertBody): Promise<AppSettingRow> {
  const now = new Date();
  await db
    .insert(appSettingsTable)
    .values({
      id: randomUUID(),
      key: body.key,
      value: stringifyValue(body.value),
      created_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        value: stringifyValue(body.value),
        updated_at: now,
      },
    });

  const row = await repoGetByKey(body.key);
  if (!row) throw new Error('upsert_failed');
  return row;
}

export async function repoUpdateByKey(key: string, body: UpdateBody): Promise<AppSettingRow> {
  return repoUpsert({ key, value: body.value });
}

export async function repoBulkUpsert(body: BulkUpsertBody): Promise<AppSettingRow[]> {
  const now = new Date();
  const values = body.items.map((item) => ({
    id: randomUUID(),
    key: item.key,
    value: stringifyValue(item.value),
    created_at: now,
    updated_at: now,
  }));

  await db.insert(appSettingsTable).values(values).onDuplicateKeyUpdate({
    set: {
      value: sql`VALUES(${appSettingsTable.value})`,
      updated_at: sql`VALUES(${appSettingsTable.updated_at})`,
    },
  });

  const keys = body.items.map((item) => item.key);
  return db.select().from(appSettingsTable).where(inArray(appSettingsTable.key, keys));
}

export async function repoDeleteMany(query: DeleteManyQuery): Promise<void> {
  const where = buildDeleteWhere(query);
  if (!where) return;
  await db.delete(appSettingsTable).where(where);
}

export async function repoDeleteByKey(key: string): Promise<void> {
  await db.delete(appSettingsTable).where(eq(appSettingsTable.key, key));
}

export async function repoGetAppLocales(): Promise<Array<{ code: string; label?: string; is_active?: boolean; is_default?: boolean }>> {
  const row = await repoGetByKey('app_locales');
  if (!row) return [];
  return normalizeAppLocales(parseValue(row.value));
}

export async function repoGetDefaultLocale(): Promise<string> {
  const row = await repoGetByKey('default_locale');
  if (!row) return 'tr';
  return normalizeDefaultLocale(parseValue(row.value)) || 'tr';
}
