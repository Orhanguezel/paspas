// =============================================================
// FILE: src/modules/storage/repository.ts
// =============================================================
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  like,
  sql as dsql,
} from "drizzle-orm";

import { db } from "@/db/client";
import { storageAssets } from "./schema";
import type { StorageListQuery } from "./validation";

/** MySQL dup guard */
export function isDup(err: unknown) {
  const e = err as any;
  const codes = [e?.code, e?.errno, e?.cause?.code, e?.cause?.errno];
  return codes.includes("ER_DUP_ENTRY") || codes.includes(1062);
}

/** Sorgu WHERE */
function buildWhere(q: StorageListQuery) {
  return and(
    q.bucket ? eq(storageAssets.bucket, q.bucket) : dsql`1=1`,
    q.folder != null ? eq(storageAssets.folder, q.folder) : dsql`1=1`,
    q.mime ? like(storageAssets.mime, `${q.mime}%`) : dsql`1=1`,
    q.q ? like(storageAssets.name, `%${q.q}%`) : dsql`1=1`,
  );
}

/** ORDER */
const ORDER = {
  created_at: storageAssets.created_at,
  name: storageAssets.name,
  size: storageAssets.size,
} as const;

function parseOrder(q: StorageListQuery) {
  const sort = q.sort ?? "created_at";
  const order = q.order ?? "desc";
  const col = ORDER[sort] ?? storageAssets.created_at;
  return order === "asc" ? asc(col) : desc(col);
}

/** List + count */
export async function listAndCount(q: StorageListQuery) {
  const where = buildWhere(q);
  const [{ total }] = await db
    .select({ total: dsql<number>`COUNT(*)` })
    .from(storageAssets)
    .where(where);

  const limit = typeof q.limit === "number" && q.limit > 0 ? q.limit : 50;
  const offset = typeof q.offset === "number" && q.offset >= 0 ? q.offset : 0;

  const rows = await db
    .select()
    .from(storageAssets)
    .where(where)
    .orderBy(parseOrder(q))
    .limit(limit)
    .offset(offset);

  return { rows, total };
}

/** Tekil getir */
export async function getById(id: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(eq(storageAssets.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Çoklu getir */
export async function getByIds(ids: string[]) {
  if (!ids.length) return [];
  return db
    .select()
    .from(storageAssets)
    .where(inArray(storageAssets.id, ids));
}

/** bucket+path ile getir */
export async function getByBucketPath(bucket: string, path: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(
      and(eq(storageAssets.bucket, bucket), eq(storageAssets.path, path)),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Insert */
export async function insert(values: Record<string, unknown>) {
  await db.insert(storageAssets).values(values as any);
}

/** Update by id (partial) */
export async function updateById(id: string, sets: Record<string, unknown>) {
  await db
    .update(storageAssets)
    .set(sets)
    .where(eq(storageAssets.id, id));
}

/** Delete by id */
export async function deleteById(id: string) {
  await db.delete(storageAssets).where(eq(storageAssets.id, id));
}

/** Delete many by ids */
export async function deleteManyByIds(ids: string[]) {
  if (!ids.length) return 0;
  await db
    .delete(storageAssets)
    .where(inArray(storageAssets.id, ids));
  return ids.length;
}

/** Klasör listesi (distinct) */
export async function listFolders(): Promise<string[]> {
  const rows = await db
    .select({ folder: storageAssets.folder })
    .from(storageAssets)
    .where(dsql`${storageAssets.folder} IS NOT NULL`)
    .groupBy(storageAssets.folder);

  return rows
    .map((r) => r.folder as string)
    .filter(Boolean);
}
