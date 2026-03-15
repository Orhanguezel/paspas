import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { urunler } from '@/modules/urunler/schema';

import { hareketler, type HareketOzetDto, type HareketRow } from './schema';
import type { CreateBody, ListQuery } from './validation';

type ListResult = { items: HareketRow[]; total: number; summary: HareketOzetDto };

function getDateRange(query: ListQuery): { start: Date; end: Date } | null {
  const now = new Date();

  if (!query.period) return null; // Tumu — filtre yok

  if (query.period === 'custom' && query.startDate && query.endDate) {
    const start = new Date(`${query.startDate}T00:00:00`);
    const end = new Date(`${query.endDate}T23:59:59`);
    return { start, end };
  }

  if (query.period === 'week') {
    const current = new Date(now);
    const day = current.getDay();
    const diff = day === 0 ? 6 : day - 1;
    current.setDate(current.getDate() - diff);
    current.setHours(0, 0, 0, 0);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: current, end };
  }

  if (query.period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return null;
}

function kaynakTipiExpression() {
  return sql<string>`
    case
      when ${hareketler.referans_tipi} = 'sevkiyat' then 'sevkiyat'
      when ${hareketler.referans_tipi} = 'mal_kabul' then 'mal_kabul'
      when ${hareketler.referans_tipi} = 'stok_duzeltme' then 'stok_duzeltme'
      when ${hareketler.referans_tipi} = 'fire' then 'fire'
      when ${hareketler.referans_tipi} = 'uretim' then 'uretim'
      else 'manuel'
    end
  `;
}

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const dateRange = getDateRange(query);

  if (dateRange) {
    conditions.push(gte(hareketler.created_at, dateRange.start));
    conditions.push(lte(hareketler.created_at, dateRange.end));
  }

  if (query.urunId) conditions.push(eq(hareketler.urun_id, query.urunId));
  if (query.hareketTipi) conditions.push(eq(hareketler.hareket_tipi, query.hareketTipi));
  if (query.kaynakTipi) conditions.push(eq(kaynakTipiExpression(), query.kaynakTipi));
  if (query.q) {
    conditions.push(or(
      like(urunler.ad, `%${query.q}%`),
      like(urunler.kod, `%${query.q}%`),
      like(hareketler.aciklama, `%${query.q}%`),
    ) as SQL);
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = query.order === 'asc' ? asc(hareketler.created_at) : desc(hareketler.created_at);
  const [items, countResult, summaryRows] = await Promise.all([
    db
      .select({
        id: hareketler.id,
        urun_id: hareketler.urun_id,
        urun_kod: urunler.kod,
        urun_ad: urunler.ad,
        hareket_tipi: hareketler.hareket_tipi,
        referans_tipi: hareketler.referans_tipi,
        referans_id: hareketler.referans_id,
        miktar: hareketler.miktar,
        aciklama: hareketler.aciklama,
        created_by_user_id: hareketler.created_by_user_id,
        created_by_name: sql<string | null>`coalesce(${users.full_name}, ${users.email})`,
        kaynak_tipi: kaynakTipiExpression(),
        created_at: hareketler.created_at,
      })
      .from(hareketler)
      .innerJoin(urunler, eq(urunler.id, hareketler.urun_id))
      .leftJoin(users, eq(users.id, hareketler.created_by_user_id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(hareketler)
      .innerJoin(urunler, eq(urunler.id, hareketler.urun_id))
      .where(where),
    db
      .select({
        toplam_kayit: sql<number>`count(*)`,
        toplam_giris: sql<number>`coalesce(sum(case when ${hareketler.hareket_tipi} = 'giris' then ${hareketler.miktar} else 0 end), 0)`,
        toplam_cikis: sql<number>`coalesce(sum(case when ${hareketler.hareket_tipi} = 'cikis' then abs(${hareketler.miktar}) else 0 end), 0)`,
        sevkiyat_adet: sql<number>`sum(case when ${hareketler.referans_tipi} = 'sevkiyat' then 1 else 0 end)`,
        sevkiyat_miktar: sql<number>`coalesce(sum(case when ${hareketler.referans_tipi} = 'sevkiyat' then abs(${hareketler.miktar}) else 0 end), 0)`,
        mal_kabul_adet: sql<number>`sum(case when ${hareketler.referans_tipi} = 'mal_kabul' then 1 else 0 end)`,
        mal_kabul_miktar: sql<number>`coalesce(sum(case when ${hareketler.referans_tipi} = 'mal_kabul' then abs(${hareketler.miktar}) else 0 end), 0)`,
        duzeltme_adet: sql<number>`sum(case when ${hareketler.hareket_tipi} = 'duzeltme' then 1 else 0 end)`,
      })
      .from(hareketler)
      .innerJoin(urunler, eq(urunler.id, hareketler.urun_id))
      .where(where),
  ]);

  const summary = summaryRows[0];
  return {
    items: items as HareketRow[],
    total: Number(countResult[0]?.count ?? 0),
    summary: {
      toplamKayit: Number(summary?.toplam_kayit ?? 0),
      toplamGiris: Number(summary?.toplam_giris ?? 0),
      toplamCikis: Number(summary?.toplam_cikis ?? 0),
      sevkiyatAdet: Number(summary?.sevkiyat_adet ?? 0),
      sevkiyatMiktar: Number(summary?.sevkiyat_miktar ?? 0),
      malKabulAdet: Number(summary?.mal_kabul_adet ?? 0),
      malKabulMiktar: Number(summary?.mal_kabul_miktar ?? 0),
      duzeltmeAdet: Number(summary?.duzeltme_adet ?? 0),
    },
  };
}

export async function repoCreate(body: CreateBody, createdByUserId: string | null): Promise<HareketRow> {
  const id = randomUUID();

  await db.transaction(async (tx) => {
    const signedAmount = body.hareketTipi === 'cikis'
      ? -Math.abs(body.miktar)
      : Math.abs(body.miktar);

    await tx.insert(hareketler).values({
      id,
      urun_id: body.urunId,
      hareket_tipi: body.hareketTipi,
      referans_tipi: body.referansTipi,
      referans_id: body.referansId,
      miktar: signedAmount.toFixed(4),
      aciklama: body.aciklama,
      created_by_user_id: createdByUserId,
    });

    const urun = await tx.select().from(urunler).where(eq(urunler.id, body.urunId)).limit(1);
    const currentStock = Number(urun[0]?.stok ?? 0);
    const delta = signedAmount;
    const nextStock = currentStock + delta;

    if (!urun[0]) throw new Error('urun_bulunamadi');
    if (nextStock < 0) throw new Error('negative_stock_not_allowed');

    await tx.update(urunler).set({ stok: nextStock.toFixed(4) }).where(eq(urunler.id, body.urunId));
  });

  const rows = await db.select().from(hareketler).where(eq(hareketler.id, id)).limit(1);
  if (!rows[0]) throw new Error('insert_failed');
  return rows[0];
}
