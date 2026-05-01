import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { musteriler } from '@/modules/musteriler/schema';
import { urunler } from '@/modules/urunler/schema';
import { malKabulKayitlari } from '@/modules/mal_kabul/schema';

import { satinAlmaKalemleri, satinAlmaSiparisleri, type SatinAlmaKalemRow, type SatinAlmaSiparisRow } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

const AUTO_DRAFT_NOTE = 'Kritik stok nedeniyle otomatik oluştu.';
const OPEN_ORDER_STATUSES = ['taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim'] as const;

type SatinAlmaSiparisListRow = SatinAlmaSiparisRow & {
  tedarikci_ad: string | null;
  items?: SatinAlmaKalemDetailRow[];
};

type SatinAlmaKalemDetailRow = SatinAlmaKalemRow & {
  urun_kod: string | null;
  urun_ad: string | null;
  birim: string | null;
  kabul_miktar: string | null;
  urun_stok: string | null;
  urun_kritik_stok: string | null;
};

type ListResult = { items: SatinAlmaSiparisListRow[]; total: number };
type DetailResult = { siparis: SatinAlmaSiparisListRow; items: SatinAlmaKalemDetailRow[] };

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.q) {
    conditions.push(or(
      like(satinAlmaSiparisleri.siparis_no, `%${query.q}%`),
      like(musteriler.ad, `%${query.q}%`),
    ) as SQL);
  }
  if (query.tedarikciId) conditions.push(eq(satinAlmaSiparisleri.tedarikci_id, query.tedarikciId));
  if (query.durum) conditions.push(eq(satinAlmaSiparisleri.durum, query.durum));
  if (typeof query.isActive === 'boolean') conditions.push(eq(satinAlmaSiparisleri.is_active, query.isActive ? 1 : 0));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'siparis_tarihi') return query.order === 'asc' ? asc(satinAlmaSiparisleri.siparis_tarihi) : desc(satinAlmaSiparisleri.siparis_tarihi);
  if (query.sort === 'siparis_no') return query.order === 'asc' ? asc(satinAlmaSiparisleri.siparis_no) : desc(satinAlmaSiparisleri.siparis_no);
  return query.order === 'asc' ? asc(satinAlmaSiparisleri.created_at) : desc(satinAlmaSiparisleri.created_at);
}

function mapSiparisInsert(data: CreateBody): typeof satinAlmaSiparisleri.$inferInsert {
  return {
    id: randomUUID(),
    siparis_no: data.siparisNo,
    tedarikci_id: data.tedarikciId,
    siparis_tarihi: new Date(data.siparisTarihi),
    termin_tarihi: data.terminTarihi ? new Date(data.terminTarihi) : undefined,
    durum: data.durum,
    aciklama: data.aciklama,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapSiparisPatch(data: PatchBody): Partial<typeof satinAlmaSiparisleri.$inferInsert> {
  const payload: Partial<typeof satinAlmaSiparisleri.$inferInsert> = {};
  if (data.siparisNo !== undefined) payload.siparis_no = data.siparisNo;
  if (data.tedarikciId !== undefined) payload.tedarikci_id = data.tedarikciId;
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

function hashCode(value: string): number {
  let total = 0;
  for (const char of value) total += char.charCodeAt(0);
  return total;
}

async function getNextSiparisNoBatch(count: number): Promise<string[]> {
  if (count <= 0) return [];
  const year = new Date().getFullYear();
  const prefix = `SA-${year}-`;
  const rows = await db
    .select({ no: satinAlmaSiparisleri.siparis_no })
    .from(satinAlmaSiparisleri)
    .where(like(satinAlmaSiparisleri.siparis_no, `${prefix}%`))
    .orderBy(desc(satinAlmaSiparisleri.siparis_no))
    .limit(1);

  let next = 1;
  if (rows[0]) {
    const suffix = rows[0].no.replace(prefix, '');
    const num = Number.parseInt(suffix, 10);
    if (!Number.isNaN(num)) next = num + 1;
  }

  return Array.from({ length: count }, (_, index) => `${prefix}${String(next + index).padStart(3, '0')}`);
}

function buildAutoDraftNote(
  urunlerById: Map<string, { kod: string; ad: string; stok: string | number | null; kritikStok: string | number | null }>,
  urunIds: string[],
  referansAciklama?: string,
): string {
  const detaylar = urunIds
    .map((urunId) => {
      const urun = urunlerById.get(urunId);
      if (!urun) return null;
      const mevcutStok = Number(urun.stok ?? 0);
      const kritikStok = Number(urun.kritikStok ?? 0);
      const eksik = Math.max(kritikStok - mevcutStok, 0);
      return `${urun.kod} (${urun.ad}) | mevcut: ${mevcutStok.toFixed(4)} | kritik: ${kritikStok.toFixed(4)} | eksik: ${eksik.toFixed(4)}`;
    })
    .filter((satir): satir is string => Boolean(satir));

  const base = referansAciklama ? `${referansAciklama}. ` : '';
  if (detaylar.length === 0) return `${base}${AUTO_DRAFT_NOTE}`;
  return `${base}${AUTO_DRAFT_NOTE} ${detaylar.join(' ; ')}`;
}

export async function ensureCriticalStockDrafts(referansAciklama?: string): Promise<void> {
  const [kritikUrunler, tedarikciler, acikSiparisKalemleri] = await Promise.all([
    db
      .select({
        id: urunler.id,
        kod: urunler.kod,
        ad: urunler.ad,
        stok: urunler.stok,
        kritikStok: urunler.kritik_stok,
        birimFiyat: urunler.birim_fiyat,
      })
      .from(urunler)
      .where(and(
        eq(urunler.is_active, 1),
        inArray(urunler.tedarik_tipi, ['satin_alma', 'fason']),
        sql`${urunler.kritik_stok} > ${urunler.stok}`,
      )),
    db
      .select({ id: musteriler.id, ad: musteriler.ad })
      .from(musteriler)
      .where(and(eq(musteriler.tur, 'tedarikci'), eq(musteriler.is_active, 1)))
      .orderBy(asc(musteriler.ad)),
    db
      .select({ urunId: satinAlmaKalemleri.urun_id })
      .from(satinAlmaKalemleri)
      .innerJoin(satinAlmaSiparisleri, eq(satinAlmaSiparisleri.id, satinAlmaKalemleri.siparis_id))
      .where(and(
        eq(satinAlmaSiparisleri.is_active, 1),
        inArray(satinAlmaSiparisleri.durum, OPEN_ORDER_STATUSES as unknown as string[]),
      )),
  ]);

  if (kritikUrunler.length === 0 || tedarikciler.length === 0) return;
  const urunById = new Map(
    kritikUrunler.map((urun) => [
      urun.id,
      { kod: urun.kod, ad: urun.ad, stok: urun.stok, kritikStok: urun.kritikStok },
    ]),
  );

  const existingOpenProductIds = new Set(acikSiparisKalemleri.map((row) => row.urunId));
  const eksikUrunler = kritikUrunler.filter((urun) => !existingOpenProductIds.has(urun.id));
  if (eksikUrunler.length === 0) return;

  const urunIds = eksikUrunler.map((urun) => urun.id);
  const oncekiAlimlar = await db
    .select({
      urunId: satinAlmaKalemleri.urun_id,
      tedarikciId: satinAlmaSiparisleri.tedarikci_id,
    })
    .from(satinAlmaKalemleri)
    .innerJoin(satinAlmaSiparisleri, eq(satinAlmaSiparisleri.id, satinAlmaKalemleri.siparis_id))
    .where(inArray(satinAlmaKalemleri.urun_id, urunIds))
    .orderBy(desc(satinAlmaSiparisleri.created_at));

  const supplierByProduct = new Map<string, string>();
  for (const alim of oncekiAlimlar) {
    if (!supplierByProduct.has(alim.urunId)) {
      supplierByProduct.set(alim.urunId, alim.tedarikciId);
    }
  }

  const groupedItems = new Map<string, Array<{
    urunId: string;
    miktar: number;
    birimFiyat: number;
    sira: number;
  }>>();

  for (const urun of eksikUrunler) {
    const supplierId = supplierByProduct.get(urun.id)
      ?? tedarikciler[hashCode(urun.kod) % tedarikciler.length]?.id;
    if (!supplierId) continue;

    const kritikAcik = Math.max(Number(urun.kritikStok ?? 0) - Number(urun.stok ?? 0), 0);
    if (kritikAcik <= 0) continue;

    const items = groupedItems.get(supplierId) ?? [];
    items.push({
      urunId: urun.id,
      miktar: Number(kritikAcik.toFixed(4)),
      birimFiyat: Number(Number(urun.birimFiyat ?? 0).toFixed(2)),
      sira: items.length + 1,
    });
    groupedItems.set(supplierId, items);
  }

  if (groupedItems.size === 0) return;

  const orderNos = await getNextSiparisNoBatch(groupedItems.size);
  const today = new Date().toISOString().slice(0, 10);
  const supplierIds = Array.from(groupedItems.keys());

  await db.transaction(async (tx) => {
    for (const [index, supplierId] of supplierIds.entries()) {
      const siparisId = randomUUID();
      const plannedKalemler = groupedItems.get(supplierId) ?? [];
      const plannedUrunIds = plannedKalemler.map((kalem) => kalem.urunId);
      if (plannedUrunIds.length === 0) continue;

      const existingOpenRows = await tx
        .select({ urunId: satinAlmaKalemleri.urun_id })
        .from(satinAlmaKalemleri)
        .innerJoin(satinAlmaSiparisleri, eq(satinAlmaSiparisleri.id, satinAlmaKalemleri.siparis_id))
        .where(and(
          inArray(satinAlmaKalemleri.urun_id, plannedUrunIds),
          eq(satinAlmaSiparisleri.is_active, 1),
          inArray(satinAlmaSiparisleri.durum, OPEN_ORDER_STATUSES as unknown as string[]),
        ));

      const existingProductIds = new Set(existingOpenRows.map((row) => row.urunId));
      const kalemler = plannedKalemler.filter((kalem) => !existingProductIds.has(kalem.urunId));
      if (kalemler.length === 0) continue;

      await tx.insert(satinAlmaSiparisleri).values({
        id: siparisId,
        siparis_no: orderNos[index],
        tedarikci_id: supplierId,
        siparis_tarihi: new Date(today),
        durum: 'taslak',
        aciklama: buildAutoDraftNote(urunById, kalemler.map((kalem) => kalem.urunId), referansAciklama),
        is_active: 1,
      });

      await tx.insert(satinAlmaKalemleri).values(
        kalemler.map((kalem, kalemIndex) => ({
          id: randomUUID(),
          siparis_id: siparisId,
          urun_id: kalem.urunId,
          miktar: kalem.miktar.toFixed(4),
          birim_fiyat: kalem.birimFiyat.toFixed(2),
          sira: kalemIndex + 1,
        })),
      );
    }
  });
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);
  const [items, countResult] = await Promise.all([
    db
      .select({
        id: satinAlmaSiparisleri.id,
        siparis_no: satinAlmaSiparisleri.siparis_no,
        tedarikci_id: satinAlmaSiparisleri.tedarikci_id,
        tedarikci_ad: musteriler.ad,
        siparis_tarihi: satinAlmaSiparisleri.siparis_tarihi,
        termin_tarihi: satinAlmaSiparisleri.termin_tarihi,
        durum: satinAlmaSiparisleri.durum,
        aciklama: satinAlmaSiparisleri.aciklama,
        is_active: satinAlmaSiparisleri.is_active,
        created_at: satinAlmaSiparisleri.created_at,
        updated_at: satinAlmaSiparisleri.updated_at,
      })
      .from(satinAlmaSiparisleri)
      .leftJoin(musteriler, eq(musteriler.id, satinAlmaSiparisleri.tedarikci_id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(satinAlmaSiparisleri)
      .leftJoin(musteriler, eq(musteriler.id, satinAlmaSiparisleri.tedarikci_id))
      .where(where),
  ]);
  if (items.length === 0) {
    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  const siparisIds = items.map((item) => item.id);
  const kalemRows = await db
    .select({
      id: satinAlmaKalemleri.id,
      siparis_id: satinAlmaKalemleri.siparis_id,
      urun_id: satinAlmaKalemleri.urun_id,
      urun_kod: urunler.kod,
      urun_ad: urunler.ad,
      birim: urunler.birim,
      miktar: satinAlmaKalemleri.miktar,
      birim_fiyat: satinAlmaKalemleri.birim_fiyat,
      sira: satinAlmaKalemleri.sira,
      kabul_miktar: sql<string>`(SELECT COALESCE(SUM(m.gelen_miktar), 0) FROM mal_kabul_kayitlari m WHERE m.satin_alma_kalem_id = ${satinAlmaKalemleri.id} AND m.kalite_durumu IN ('kabul', 'kosullu'))`,
      urun_stok: urunler.stok,
      urun_kritik_stok: urunler.kritik_stok,
      created_at: satinAlmaKalemleri.created_at,
      updated_at: satinAlmaKalemleri.updated_at,
    })
    .from(satinAlmaKalemleri)
    .leftJoin(urunler, eq(urunler.id, satinAlmaKalemleri.urun_id))
    .where(inArray(satinAlmaKalemleri.siparis_id, siparisIds))
    .orderBy(asc(satinAlmaKalemleri.sira));

  const kalemlerBySiparisId = new Map<string, SatinAlmaKalemDetailRow[]>();
  for (const row of kalemRows) {
    const existing = kalemlerBySiparisId.get(row.siparis_id) ?? [];
    existing.push(row);
    kalemlerBySiparisId.set(row.siparis_id, existing);
  }

  const enrichedItems = items.map((item) => ({
    ...item,
    items: kalemlerBySiparisId.get(item.id) ?? [],
  }));

  return { items: enrichedItems, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<DetailResult | null> {
  const siparisRows = await db
    .select({
      id: satinAlmaSiparisleri.id,
      siparis_no: satinAlmaSiparisleri.siparis_no,
      tedarikci_id: satinAlmaSiparisleri.tedarikci_id,
      tedarikci_ad: musteriler.ad,
      siparis_tarihi: satinAlmaSiparisleri.siparis_tarihi,
      termin_tarihi: satinAlmaSiparisleri.termin_tarihi,
      durum: satinAlmaSiparisleri.durum,
      aciklama: satinAlmaSiparisleri.aciklama,
      is_active: satinAlmaSiparisleri.is_active,
      created_at: satinAlmaSiparisleri.created_at,
      updated_at: satinAlmaSiparisleri.updated_at,
    })
    .from(satinAlmaSiparisleri)
    .leftJoin(musteriler, eq(musteriler.id, satinAlmaSiparisleri.tedarikci_id))
    .where(eq(satinAlmaSiparisleri.id, id))
    .limit(1);

  const siparis = siparisRows[0];
  if (!siparis) return null;

  const items = await db
    .select({
      id: satinAlmaKalemleri.id,
      siparis_id: satinAlmaKalemleri.siparis_id,
      urun_id: satinAlmaKalemleri.urun_id,
      urun_kod: urunler.kod,
      urun_ad: urunler.ad,
      birim: urunler.birim,
      miktar: satinAlmaKalemleri.miktar,
      birim_fiyat: satinAlmaKalemleri.birim_fiyat,
      sira: satinAlmaKalemleri.sira,
      kabul_miktar: sql<string>`(SELECT COALESCE(SUM(m.gelen_miktar), 0) FROM mal_kabul_kayitlari m WHERE m.satin_alma_kalem_id = ${satinAlmaKalemleri.id} AND m.kalite_durumu IN ('kabul', 'kosullu'))`,
      urun_stok: urunler.stok,
      urun_kritik_stok: urunler.kritik_stok,
      created_at: satinAlmaKalemleri.created_at,
      updated_at: satinAlmaKalemleri.updated_at,
    })
    .from(satinAlmaKalemleri)
    .leftJoin(urunler, eq(urunler.id, satinAlmaKalemleri.urun_id))
    .where(eq(satinAlmaKalemleri.siparis_id, id))
    .orderBy(asc(satinAlmaKalemleri.sira));

  return { siparis, items };
}

export async function repoCreate(data: CreateBody): Promise<DetailResult> {
  const siparisPayload = mapSiparisInsert(data);
  const siparisId = siparisPayload.id;
  const kalemPayloads = mapKalemInsert(siparisId, data.items);

  await db.transaction(async (tx) => {
    await tx.insert(satinAlmaSiparisleri).values(siparisPayload);
    if (kalemPayloads.length > 0) {
      await tx.insert(satinAlmaKalemleri).values(kalemPayloads);
    }
  });
  const detail = await repoGetById(siparisId);
  if (!detail) throw new Error('insert_failed');
  return detail;
}

export async function repoNextSiparisNo(): Promise<string> {
  const [nextNo] = await getNextSiparisNoBatch(1);
  return nextNo;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<DetailResult | null> {
  const current = await repoGetById(id);
  if (!current) return null;

  const eskiDurum = current.siparis.durum;

  // İptal koruması: bu satın almaya bağlı mal kabul kaydı varsa iptal edilemez.
  // Aksi halde stok girişi yapılmış malı iptal etmek hayalet hareket bırakır.
  if (patch.durum === 'iptal' && eskiDurum !== 'iptal') {
    const [malKabulRow] = await db
      .select({ id: malKabulKayitlari.id })
      .from(malKabulKayitlari)
      .where(eq(malKabulKayitlari.satin_alma_siparis_id, id))
      .limit(1);
    if (malKabulRow) {
      const err = new Error('satin_alma_kilitli');
      (err as any).detail = 'Bu satın alma siparişine bağlı mal kabul kaydı var; iptal edilemez. Önce mal kabul kayıtlarını iptal edin.';
      throw err;
    }
  }

  await db.transaction(async (tx) => {
    const siparisPatch = mapSiparisPatch(patch);
    if (Object.keys(siparisPatch).length > 0) {
      await tx.update(satinAlmaSiparisleri).set(siparisPatch).where(eq(satinAlmaSiparisleri.id, id));
    }
    if (patch.items) {
      await tx.delete(satinAlmaKalemleri).where(eq(satinAlmaKalemleri.siparis_id, id));
      await tx.insert(satinAlmaKalemleri).values(mapKalemInsert(id, patch.items));
    }
  });

  // Durum 'tamamlandi' olunca mal fabrikaya gelmis demek — her kalem icin mal kabul kaydi olustur
  const yeniDurum = patch.durum;
  if (yeniDurum === 'tamamlandi' && eskiDurum !== 'tamamlandi') {
    const kalemler = await db
      .select({
        id: satinAlmaKalemleri.id,
        urunId: satinAlmaKalemleri.urun_id,
        miktar: satinAlmaKalemleri.miktar,
      })
      .from(satinAlmaKalemleri)
      .where(eq(satinAlmaKalemleri.siparis_id, id));

    for (const kalem of kalemler) {
      // Ayni SA kalem icin zaten mal kabul kaydi varsa tekrar olusturma
      const [existing] = await db
        .select({ id: malKabulKayitlari.id })
        .from(malKabulKayitlari)
        .where(
          and(
            eq(malKabulKayitlari.satin_alma_siparis_id, id),
            eq(malKabulKayitlari.satin_alma_kalem_id, kalem.id),
          ),
        )
        .limit(1);
      if (existing) continue;

      await db.insert(malKabulKayitlari).values({
        id: randomUUID(),
        kaynak_tipi: 'satin_alma',
        satin_alma_siparis_id: id,
        satin_alma_kalem_id: kalem.id,
        urun_id: kalem.urunId,
        tedarikci_id: current.siparis.tedarikci_id ?? null,
        gelen_miktar: String(kalem.miktar),
        kalite_durumu: 'bekliyor',
        notlar: `SA ${current.siparis.siparis_no} teslim alındı — mal kabul onayı bekliyor`,
      });
    }
  }

  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(satinAlmaKalemleri).where(eq(satinAlmaKalemleri.siparis_id, id));
    await tx.delete(satinAlmaSiparisleri).where(eq(satinAlmaSiparisleri.id, id));
  });
}
