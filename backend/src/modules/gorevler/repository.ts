import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { createUserNotification } from '@/modules/notifications/controller';

import { gorevler, rowToDto, type GorevDto, type GorevRow, type GorevSummaryDto } from './schema';
import type { CreateGorevBody, ListQuery, UpdateGorevBody } from './validation';

type ListResult = {
  items: GorevDto[];
  total: number;
  summary: GorevSummaryDto;
};

function buildWhere(query: ListQuery, currentUserId?: string | null): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    conditions.push(or(
      like(gorevler.baslik, `%${query.q}%`),
      like(gorevler.aciklama, `%${query.q}%`),
      like(gorevler.modul, `%${query.q}%`),
    ) as SQL);
  }

  if (query.durum) conditions.push(eq(gorevler.durum, query.durum));
  if (query.oncelik) conditions.push(eq(gorevler.oncelik, query.oncelik));
  if (query.modul) conditions.push(eq(gorevler.modul, query.modul));
  if (query.atananKullaniciId) conditions.push(eq(gorevler.atanan_kullanici_id, query.atananKullaniciId));
  if (query.atananRol) conditions.push(eq(gorevler.atanan_rol, query.atananRol));
  if (query.sadeceBenim && currentUserId) conditions.push(eq(gorevler.atanan_kullanici_id, currentUserId));
  if (query.gecikenOnly) {
    conditions.push(sql`${gorevler.termin_tarihi} IS NOT NULL`);
    conditions.push(sql`${gorevler.termin_tarihi} < CURRENT_TIMESTAMP`);
    conditions.push(sql`${gorevler.durum} NOT IN ('tamamlandi', 'iptal')`);
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'created_at') return query.order === 'asc' ? asc(gorevler.created_at) : desc(gorevler.created_at);
  if (query.sort === 'oncelik') return query.order === 'asc' ? asc(gorevler.oncelik) : desc(gorevler.oncelik);
  if (query.sort === 'durum') return query.order === 'asc' ? asc(gorevler.durum) : desc(gorevler.durum);
  return query.order === 'asc' ? asc(gorevler.termin_tarihi) : desc(gorevler.termin_tarihi);
}

async function enrichRows(rows: GorevRow[]): Promise<GorevDto[]> {
  const userIds = Array.from(
    new Set(
      rows.flatMap((row) => [row.atanan_kullanici_id, row.olusturan_kullanici_id].filter(Boolean) as string[]),
    ),
  );

  const userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const userRows = await db
      .select({ id: users.id, fullName: users.full_name, email: users.email })
      .from(users)
      .where(inArray(users.id, userIds));

    for (const userRow of userRows) {
      userMap.set(userRow.id, userRow.fullName?.trim() || userRow.email);
    }
  }

  return rows.map((row) =>
    rowToDto(row, {
      atananKullaniciAd: row.atanan_kullanici_id ? userMap.get(row.atanan_kullanici_id) ?? null : null,
      olusturanKullaniciAd: row.olusturan_kullanici_id ? userMap.get(row.olusturan_kullanici_id) ?? null : null,
    }),
  );
}

async function maybeSendAssignmentNotification(row: GorevRow) {
  if (!row.atanan_kullanici_id) return;
  await createUserNotification({
    userId: row.atanan_kullanici_id,
    title: `Yeni gorev: ${row.baslik}`,
    message: row.termin_tarihi
      ? `Size yeni bir gorev atandi. Termin: ${row.termin_tarihi.toISOString().slice(0, 16).replace('T', ' ')}`
      : 'Size yeni bir gorev atandi.',
    type: 'gorev_atama',
  });
}

export async function repoList(query: ListQuery, currentUserId?: string | null): Promise<ListResult> {
  const where = buildWhere(query, currentUserId);
  const orderBy = getOrderBy(query);

  const [items, countRows, summaryRows] = await Promise.all([
    db.select().from(gorevler).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(gorevler).where(where),
    db.select({
      toplam: sql<number>`count(*)`,
      acik: sql<number>`sum(case when ${gorevler.durum} in ('acik','devam_ediyor','beklemede') then 1 else 0 end)`,
      bugunTerminli: sql<number>`sum(case when ${gorevler.termin_tarihi} is not null and date(${gorevler.termin_tarihi}) = current_date() and ${gorevler.durum} not in ('tamamlandi','iptal') then 1 else 0 end)`,
      geciken: sql<number>`sum(case when ${gorevler.termin_tarihi} is not null and ${gorevler.termin_tarihi} < current_timestamp and ${gorevler.durum} not in ('tamamlandi','iptal') then 1 else 0 end)`,
      tamamlanan: sql<number>`sum(case when ${gorevler.durum} = 'tamamlandi' then 1 else 0 end)`,
    }).from(gorevler).where(where),
  ]);

  const summaryRow = summaryRows[0];

  return {
    items: await enrichRows(items),
    total: Number(countRows[0]?.count ?? 0),
    summary: {
      toplam: Number(summaryRow?.toplam ?? 0),
      acik: Number(summaryRow?.acik ?? 0),
      bugunTerminli: Number(summaryRow?.bugunTerminli ?? 0),
      geciken: Number(summaryRow?.geciken ?? 0),
      tamamlanan: Number(summaryRow?.tamamlanan ?? 0),
    },
  };
}

export async function repoGetById(id: string): Promise<GorevDto | null> {
  const rows = await db.select().from(gorevler).where(eq(gorevler.id, id)).limit(1);
  if (!rows[0]) return null;
  const [dto] = await enrichRows([rows[0]]);
  return dto ?? null;
}

export async function repoCreate(body: CreateGorevBody, createdByUserId: string | null): Promise<GorevDto> {
  const id = randomUUID();
  const row = {
    id,
    baslik: body.baslik.trim(),
    aciklama: body.aciklama?.trim() || null,
    tip: body.tip,
    modul: body.modul?.trim() || null,
    ilgili_kayit_id: body.ilgiliKayitId ?? null,
    atanan_kullanici_id: body.atananKullaniciId ?? null,
    atanan_rol: body.atananRol ?? null,
    durum: body.durum,
    oncelik: body.oncelik,
    termin_tarihi: body.terminTarihi ?? null,
    olusturan_kullanici_id: createdByUserId,
  } satisfies typeof gorevler.$inferInsert;

  await db.insert(gorevler).values(row);
  const createdRows = await db.select().from(gorevler).where(eq(gorevler.id, id)).limit(1);
  const created = createdRows[0];
  await maybeSendAssignmentNotification(created);
  const dto = await repoGetById(id);
  if (!dto) throw new Error('gorev_olusturulamadi');
  return dto;
}

export async function repoUpdate(id: string, body: UpdateGorevBody): Promise<GorevDto | null> {
  const currentRows = await db.select().from(gorevler).where(eq(gorevler.id, id)).limit(1);
  const current = currentRows[0];
  if (!current) return null;

  const nextDurum = body.durum ?? current.durum;
  const patch: Partial<typeof gorevler.$inferInsert> = {
    baslik: body.baslik?.trim(),
    aciklama: body.aciklama === undefined ? undefined : body.aciklama.trim() || null,
    tip: body.tip,
    modul: body.modul === undefined ? undefined : body.modul.trim() || null,
    ilgili_kayit_id: body.ilgiliKayitId === undefined ? undefined : body.ilgiliKayitId || null,
    atanan_kullanici_id: body.atananKullaniciId === undefined ? undefined : body.atananKullaniciId || null,
    atanan_rol: body.atananRol === undefined ? undefined : body.atananRol || null,
    durum: nextDurum,
    oncelik: body.oncelik,
    termin_tarihi: body.terminTarihi === undefined ? undefined : body.terminTarihi || null,
    tamamlandi_at: nextDurum === 'tamamlandi' ? new Date() : nextDurum === 'iptal' || nextDurum === 'acik' || nextDurum === 'beklemede' || nextDurum === 'devam_ediyor' ? null : undefined,
  };

  await db.update(gorevler).set(patch).where(eq(gorevler.id, id));

  const updatedRows = await db.select().from(gorevler).where(eq(gorevler.id, id)).limit(1);
  const updated = updatedRows[0];
  if (
    updated &&
    updated.atanan_kullanici_id &&
    updated.atanan_kullanici_id !== current.atanan_kullanici_id
  ) {
    await maybeSendAssignmentNotification(updated);
  }
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<boolean> {
  const existing = await db.select({ id: gorevler.id }).from(gorevler).where(eq(gorevler.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(gorevler).where(eq(gorevler.id, id));
  return true;
}
