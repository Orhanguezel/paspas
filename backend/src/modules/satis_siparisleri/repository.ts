import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, getTableColumns, inArray, like, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { satisSiparisleri, siparisKalemleri, type EnrichedSatisSiparisRow, type EnrichedSiparisKalemRow } from './schema';
import { musteriler } from '@/modules/musteriler/schema';
import { urunler } from '@/modules/urunler/schema';
import { sevkiyatKalemleri } from '@/modules/operator/schema';
import { uretimEmirleri, uretimEmriSiparisKalemleri } from '@/modules/uretim_emirleri/schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: EnrichedSatisSiparisRow[];
  total: number;
};

type DetailResult = {
  siparis: EnrichedSatisSiparisRow;
  items: EnrichedSiparisKalemRow[];
};

export type SiparisOzet = {
  kalemSayisi: number;
  toplamMiktar: number;
  uretimeAktarilanKalemSayisi: number;
  uretimPlanlananMiktar: number;
  uretimTamamlananMiktar: number;
  sevkEdilenMiktar: number;
  kilitli: boolean;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.q) conditions.push(like(satisSiparisleri.siparis_no, `%${query.q}%`));
  if (query.musteriId) conditions.push(eq(satisSiparisleri.musteri_id, query.musteriId));
  if (query.durum) conditions.push(eq(satisSiparisleri.durum, query.durum));
  if (typeof query.isActive === 'boolean') conditions.push(eq(satisSiparisleri.is_active, query.isActive ? 1 : 0));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'siparis_tarihi') return query.order === 'asc' ? asc(satisSiparisleri.siparis_tarihi) : desc(satisSiparisleri.siparis_tarihi);
  if (query.sort === 'siparis_no') return query.order === 'asc' ? asc(satisSiparisleri.siparis_no) : desc(satisSiparisleri.siparis_no);
  return query.order === 'asc' ? asc(satisSiparisleri.created_at) : desc(satisSiparisleri.created_at);
}

function mapSiparisInsert(data: CreateBody): typeof satisSiparisleri.$inferInsert {
  return {
    id: randomUUID(),
    siparis_no: data.siparisNo,
    musteri_id: data.musteriId,
    siparis_tarihi: new Date(data.siparisTarihi),
    termin_tarihi: data.terminTarihi ? new Date(data.terminTarihi) : undefined,
    durum: data.durum,
    aciklama: data.aciklama,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapSiparisPatch(data: PatchBody): Partial<typeof satisSiparisleri.$inferInsert> {
  const payload: Partial<typeof satisSiparisleri.$inferInsert> = {};
  if (data.siparisNo !== undefined) payload.siparis_no = data.siparisNo;
  if (data.musteriId !== undefined) payload.musteri_id = data.musteriId;
  if (data.siparisTarihi !== undefined) payload.siparis_tarihi = new Date(data.siparisTarihi);
  if (data.terminTarihi !== undefined) payload.termin_tarihi = new Date(data.terminTarihi);
  if (data.durum !== undefined) payload.durum = data.durum;
  if (data.aciklama !== undefined) payload.aciklama = data.aciklama;
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

function mapKalemInsert(siparisId: string, items: CreateBody['items'] | PatchBody['items']) {
  if (!items || items.length === 0) return [];
  return items.map((item) => ({
    id: randomUUID(),
    siparis_id: siparisId,
    urun_id: item.urunId,
    miktar: item.miktar.toFixed(4),
    birim_fiyat: item.birimFiyat.toFixed(2),
    sira: item.sira,
  }));
}

export async function repoGetSiparisOzetleri(siparisIds: string[]): Promise<Map<string, SiparisOzet>> {
  const empty = new Map<string, SiparisOzet>();
  if (siparisIds.length === 0) return empty;

  const [kalemRows, uretimeAktarimRows, sevkiyatRows] = await Promise.all([
    db
      .select({
        siparisId: siparisKalemleri.siparis_id,
        kalemSayisi: sql<number>`count(*)`,
        toplamMiktar: sql<string>`coalesce(sum(${siparisKalemleri.miktar}), 0)`,
      })
      .from(siparisKalemleri)
      .where(inArray(siparisKalemleri.siparis_id, siparisIds))
      .groupBy(siparisKalemleri.siparis_id),
    db
      .select({
        siparisId: siparisKalemleri.siparis_id,
        uretimeAktarilanKalemSayisi: sql<number>`count(distinct ${uretimEmriSiparisKalemleri.siparis_kalem_id})`,
      })
      .from(uretimEmriSiparisKalemleri)
      .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
      .where(inArray(siparisKalemleri.siparis_id, siparisIds))
      .groupBy(siparisKalemleri.siparis_id),
    db
      .select({
        siparisId: siparisKalemleri.siparis_id,
        sevkEdilenMiktar: sql<string>`coalesce(sum(${sevkiyatKalemleri.miktar}), 0)`,
      })
      .from(sevkiyatKalemleri)
      .innerJoin(siparisKalemleri, eq(sevkiyatKalemleri.siparis_kalem_id, siparisKalemleri.id))
      .where(inArray(siparisKalemleri.siparis_id, siparisIds))
      .groupBy(siparisKalemleri.siparis_id),
  ]);

  for (const siparisId of siparisIds) {
    empty.set(siparisId, {
        kalemSayisi: 0,
        toplamMiktar: 0,
        uretimeAktarilanKalemSayisi: 0,
        uretimPlanlananMiktar: 0,
        uretimTamamlananMiktar: 0,
        sevkEdilenMiktar: 0,
        kilitli: false,
      });
  }

  for (const row of kalemRows) {
    empty.set(row.siparisId, {
      ...(empty.get(row.siparisId) ?? {
        kalemSayisi: 0,
        toplamMiktar: 0,
        uretimeAktarilanKalemSayisi: 0,
        uretimPlanlananMiktar: 0,
        uretimTamamlananMiktar: 0,
        sevkEdilenMiktar: 0,
        kilitli: false,
      }),
      kalemSayisi: Number(row.kalemSayisi ?? 0),
      toplamMiktar: Number(row.toplamMiktar ?? 0),
    });
  }

  for (const row of uretimeAktarimRows) {
    const current = empty.get(row.siparisId);
    if (!current) continue;
    const uretimeAktarilanKalemSayisi = Number(row.uretimeAktarilanKalemSayisi ?? 0);
    empty.set(row.siparisId, {
      ...current,
      uretimeAktarilanKalemSayisi,
      kilitli: uretimeAktarilanKalemSayisi > 0,
    });
  }

  for (const row of sevkiyatRows) {
    const current = empty.get(row.siparisId);
    if (!current) continue;
    empty.set(row.siparisId, {
      ...current,
      sevkEdilenMiktar: Number(row.sevkEdilenMiktar ?? 0),
    });
  }

  const uretimRows = await db
    .select({
      siparisId: siparisKalemleri.siparis_id,
      uretimEmriId: uretimEmriSiparisKalemleri.uretim_emri_id,
      planlananMiktar: sql<string>`max(${uretimEmirleri.planlanan_miktar})`,
      uretilenMiktar: sql<string>`max(${uretimEmirleri.uretilen_miktar})`,
    })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .innerJoin(uretimEmirleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .where(inArray(siparisKalemleri.siparis_id, siparisIds))
    .groupBy(siparisKalemleri.siparis_id, uretimEmriSiparisKalemleri.uretim_emri_id);

  for (const row of uretimRows) {
    const current = empty.get(row.siparisId);
    if (!current) continue;
    empty.set(row.siparisId, {
      ...current,
      uretimPlanlananMiktar: current.uretimPlanlananMiktar + Number(row.planlananMiktar ?? 0),
      uretimTamamlananMiktar: current.uretimTamamlananMiktar + Number(row.uretilenMiktar ?? 0),
    });
  }

  return empty;
}

export async function repoGetKalemSevkMiktarlari(siparisId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({
      siparisKalemId: sevkiyatKalemleri.siparis_kalem_id,
      miktar: sql<string>`coalesce(sum(${sevkiyatKalemleri.miktar}), 0)`,
    })
    .from(sevkiyatKalemleri)
    .where(eq(sevkiyatKalemleri.siparis_id, siparisId))
    .groupBy(sevkiyatKalemleri.siparis_kalem_id);

  const result = new Map<string, number>();
  for (const row of rows) {
    if (row.siparisKalemId) result.set(row.siparisKalemId, Number(row.miktar ?? 0));
  }
  return result;
}

export async function repoGetKalemUretilenMiktarlari(siparisId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({
      siparisKalemId: uretimEmriSiparisKalemleri.siparis_kalem_id,
      miktar: sql<string>`coalesce(sum(${uretimEmirleri.uretilen_miktar}), 0)`,
    })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .innerJoin(uretimEmirleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .where(eq(siparisKalemleri.siparis_id, siparisId))
    .groupBy(uretimEmriSiparisKalemleri.siparis_kalem_id);

  const result = new Map<string, number>();
  for (const row of rows) {
    if (row.siparisKalemId) result.set(row.siparisKalemId, Number(row.miktar ?? 0));
  }
  return result;
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);
  const [items, countResult] = await Promise.all([
    db
      .select({
        ...getTableColumns(satisSiparisleri),
        musteri_ad: musteriler.ad,
      })
      .from(satisSiparisleri)
      .leftJoin(musteriler, eq(musteriler.id, satisSiparisleri.musteri_id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(satisSiparisleri).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<DetailResult | null> {
  const siparisRows = await db
    .select({
      ...getTableColumns(satisSiparisleri),
      musteri_ad: musteriler.ad,
      musteri_iskonto: musteriler.iskonto,
    })
    .from(satisSiparisleri)
    .leftJoin(musteriler, eq(musteriler.id, satisSiparisleri.musteri_id))
    .where(eq(satisSiparisleri.id, id))
    .limit(1);
  const siparis = siparisRows[0];
  if (!siparis) return null;
  const items = await db
    .select({
      ...getTableColumns(siparisKalemleri),
      urun_ad: urunler.ad,
      urun_kod: urunler.kod,
      kdv_orani: urunler.kdv_orani,
    })
    .from(siparisKalemleri)
    .leftJoin(urunler, eq(urunler.id, siparisKalemleri.urun_id))
    .where(eq(siparisKalemleri.siparis_id, id))
    .orderBy(asc(siparisKalemleri.sira));
  return { siparis, items };
}

export async function repoCreate(data: CreateBody): Promise<DetailResult> {
  const siparisPayload = mapSiparisInsert(data);
  const siparisId = siparisPayload.id;
  await db.transaction(async (tx) => {
    await tx.insert(satisSiparisleri).values(siparisPayload);
    await tx.insert(siparisKalemleri).values(mapKalemInsert(siparisId, data.items));
  });
  const detail = await repoGetById(siparisId);
  if (!detail) throw new Error('insert_failed');
  return detail;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<DetailResult | null> {
  const current = await repoGetById(id);
  if (!current) return null;
  const ozet = await repoGetSiparisOzetleri([id]);
  const isLocked = ozet.get(id)?.kilitli === true;
  const yapisalDegisiklikVar =
    patch.siparisNo !== undefined ||
    patch.musteriId !== undefined ||
    patch.siparisTarihi !== undefined ||
    patch.items !== undefined;

  if (isLocked && yapisalDegisiklikVar) {
    throw new Error('siparis_kilitli');
  }

  await db.transaction(async (tx) => {
    const siparisPatch = mapSiparisPatch(patch);
    if (Object.keys(siparisPatch).length > 0) {
      await tx.update(satisSiparisleri).set(siparisPatch).where(eq(satisSiparisleri.id, id));
    }
    if (patch.items) {
      await tx.delete(siparisKalemleri).where(eq(siparisKalemleri.siparis_id, id));
      await tx.insert(siparisKalemleri).values(mapKalemInsert(id, patch.items));
    }
  });

  return repoGetById(id);
}

export async function repoGetNextSiparisNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SS-${year}-`;
  const rows = await db
    .select({ siparis_no: satisSiparisleri.siparis_no })
    .from(satisSiparisleri)
    .where(like(satisSiparisleri.siparis_no, `${prefix}%`))
    .orderBy(desc(satisSiparisleri.siparis_no))
    .limit(1);
  const last = rows[0]?.siparis_no;
  if (!last) return `${prefix}0001`;
  const seq = Number.parseInt(last.replace(prefix, ''), 10);
  return `${prefix}${String(seq + 1).padStart(4, '0')}`;
}

// ── Auto sipariş durum refresh ────────────────────────────
// Determines the correct sipariş durum from linked üretim emirleri & sevkiyat data.
// Called after: üretim emri create, operator başlat, operator bitir.
export async function refreshSiparisDurum(siparisId: string): Promise<void> {
  const [siparis] = await db
    .select({ durum: satisSiparisleri.durum })
    .from(satisSiparisleri)
    .where(eq(satisSiparisleri.id, siparisId))
    .limit(1);
  if (!siparis || siparis.durum === 'kapali' || siparis.durum === 'iptal') return;

  const ozet = await repoGetSiparisOzetleri([siparisId]);
  const o = ozet.get(siparisId);
  if (!o) return;

  // Check if any linked üretim emri is actively in 'uretimde' state
  const [uretimdeRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .innerJoin(uretimEmirleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .where(
      and(
        eq(siparisKalemleri.siparis_id, siparisId),
        inArray(uretimEmirleri.durum, ['uretimde', 'tamamlandi']),
      ),
    );
  const anyUretimStarted = Number(uretimdeRow?.count ?? 0) > 0;

  // Priority: sevkiyat > üretim > planlama
  let yeniDurum: string | null = null;
  if (o.toplamMiktar > 0 && o.sevkEdilenMiktar >= o.toplamMiktar) {
    yeniDurum = 'tamamlandi';
  } else if (o.sevkEdilenMiktar > 0) {
    yeniDurum = 'kismen_sevk';
  } else if (o.uretimTamamlananMiktar > 0 || anyUretimStarted) {
    yeniDurum = 'uretimde';
  } else if (o.uretimeAktarilanKalemSayisi > 0) {
    yeniDurum = 'planlandi';
  }

  if (yeniDurum && yeniDurum !== siparis.durum) {
    await db
      .update(satisSiparisleri)
      .set({ durum: yeniDurum })
      .where(eq(satisSiparisleri.id, siparisId));
  }
}

// Returns distinct sipariş IDs linked to a given üretim emri via junction table
export async function getSiparisIdsByUretimEmriId(uretimEmriId: string): Promise<string[]> {
  const rows = await db
    .select({ siparisId: siparisKalemleri.siparis_id })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId));
  return [...new Set(rows.map((r) => r.siparisId))];
}

export async function repoDelete(id: string): Promise<void> {
  const ozet = await repoGetSiparisOzetleri([id]);
  if (ozet.get(id)?.kilitli) {
    throw new Error('siparis_kilitli');
  }
  await db.transaction(async (tx) => {
    await tx.delete(siparisKalemleri).where(eq(siparisKalemleri.siparis_id, id));
    await tx.delete(satisSiparisleri).where(eq(satisSiparisleri.id, id));
  });
}
