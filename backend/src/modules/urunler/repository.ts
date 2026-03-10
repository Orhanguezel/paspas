import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories } from '@/modules/categories/schema';

import { inArray } from 'drizzle-orm';

import {
  urunler,
  urunOperasyonlari,
  urunOperasyonMakineleri,
  urunBirimDonusumleri,
  urunMedya,
  operasyonMakineRowToDto,
  type UrunRow,
  type UrunOperasyonRow,
  type UrunOperasyonMakineRow,
  type UrunOperasyonMakineDto,
  type BirimDonusumRow,
  type UrunMedyaRow,
} from './schema';
import type {
  CreateBody,
  ListQuery,
  PatchBody,
  OperasyonItem,
  BirimDonusumItem,
  OperasyonPatchBody,
  OperasyonMakineItem,
  MedyaItem,
} from './validation';

type ListResult = {
  items: UrunRow[];
  total: number;
};

function nullIfBlank(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    conditions.push(or(like(urunler.ad, `%${query.q}%`), like(urunler.kod, `%${query.q}%`)) as SQL);
  }
  if (typeof query.isActive === 'boolean') {
    conditions.push(eq(urunler.is_active, query.isActive ? 1 : 0));
  }
  if (query.kategori) {
    conditions.push(eq(urunler.kategori, query.kategori));
  }
  if (query.tedarikTipi) {
    conditions.push(eq(urunler.tedarik_tipi, query.tedarikTipi));
  }
  if (query.urunGrubu) {
    conditions.push(eq(urunler.urun_grubu, query.urunGrubu));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function mapCreateInput(data: CreateBody): typeof urunler.$inferInsert {
  return {
    id: randomUUID(),
    kategori: data.kategori,
    tedarik_tipi: data.tedarikTipi,
    urun_grubu: data.urunGrubu ?? null,
    kod: data.kod,
    ad: data.ad,
    aciklama: data.aciklama,
    birim: data.birim,
    renk: data.renk,
    image_url: nullIfBlank(data.imageUrl),
    storage_asset_id: nullIfBlank(data.storageAssetId),
    image_alt: nullIfBlank(data.imageAlt),
    stok: data.stok.toFixed(4),
    kritik_stok: data.kritikStok.toFixed(4),
    birim_fiyat: typeof data.birimFiyat === 'number' ? data.birimFiyat.toFixed(2) : undefined,
    kdv_orani: data.kdvOrani.toFixed(2),
    operasyon_tipi: data.operasyonTipi ?? null,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof urunler.$inferInsert> {
  const payload: Partial<typeof urunler.$inferInsert> = {};
  if (data.kategori !== undefined) payload.kategori = data.kategori;
  if (data.tedarikTipi !== undefined) payload.tedarik_tipi = data.tedarikTipi;
  if (data.urunGrubu !== undefined) payload.urun_grubu = data.urunGrubu ?? null;
  if (data.kod !== undefined) payload.kod = data.kod;
  if (data.ad !== undefined) payload.ad = data.ad;
  if (data.aciklama !== undefined) payload.aciklama = data.aciklama;
  if (data.birim !== undefined) payload.birim = data.birim;
  if (data.renk !== undefined) payload.renk = data.renk;
  if (data.imageUrl !== undefined) payload.image_url = nullIfBlank(data.imageUrl);
  if (data.storageAssetId !== undefined) payload.storage_asset_id = nullIfBlank(data.storageAssetId);
  if (data.imageAlt !== undefined) payload.image_alt = nullIfBlank(data.imageAlt);
  if (data.stok !== undefined) payload.stok = data.stok.toFixed(4);
  if (data.kritikStok !== undefined) payload.kritik_stok = data.kritikStok.toFixed(4);
  if (data.birimFiyat !== undefined) payload.birim_fiyat = data.birimFiyat.toFixed(2);
  if (data.kdvOrani !== undefined) payload.kdv_orani = data.kdvOrani.toFixed(2);
  if (data.operasyonTipi !== undefined) payload.operasyon_tipi = data.operasyonTipi ?? null;
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'ad') return query.order === 'asc' ? asc(urunler.ad) : desc(urunler.ad);
  if (query.sort === 'kod') return query.order === 'asc' ? asc(urunler.kod) : desc(urunler.kod);
  if (query.sort === 'stok') return query.order === 'asc' ? asc(urunler.stok) : desc(urunler.stok);
  if (query.sort === 'kritik_stok') return query.order === 'asc' ? asc(urunler.kritik_stok) : desc(urunler.kritik_stok);
  return query.order === 'asc' ? asc(urunler.created_at) : desc(urunler.created_at);
}


// -- Kod Onerisi --

export async function repoGetNextCode(kategori: string): Promise<string> {
  const categoryRows = await db
    .select({ prefix: categories.varsayilan_kod_prefixi })
    .from(categories)
    .where(eq(categories.kod, kategori))
    .limit(1);

  const prefix = categoryRows[0]?.prefix?.trim() || 'URN';
  const pattern = `${prefix}-%`;

  const rows = await db
    .select({ kod: urunler.kod })
    .from(urunler)
    .where(like(urunler.kod, pattern))
    .orderBy(desc(urunler.kod));

  let maxNum = 0;
  for (const row of rows) {
    const suffix = row.kod.slice(prefix.length + 1);
    const num = Number.parseInt(suffix, 10);
    if (Number.isFinite(num) && num > maxNum) maxNum = num;
  }

  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}


// -- Urun CRUD --

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);

  const [items, countResult] = await Promise.all([
    db.select().from(urunler).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(urunler).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<UrunRow | null> {
  const rows = await db.select().from(urunler).where(eq(urunler.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreate(data: CreateBody): Promise<UrunRow> {
  const payload = mapCreateInput(data);
  await db.insert(urunler).values(payload);

  // Auto-create operations based on kategori and operasyonTipi
  if (data.operasyonlar && data.operasyonlar.length > 0) {
    await insertOperasyonlar(payload.id, data.operasyonlar);
  } else {
    await autoCreateOperasyonlar(payload.id, data);
  }

  // Insert birim donusumleri if provided
  if (data.birimDonusumleri && data.birimDonusumleri.length > 0) {
    await insertBirimDonusumleri(payload.id, data.birimDonusumleri);
  }

  const row = await repoGetById(payload.id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<UrunRow | null> {
  const payload = mapPatchInput(patch);
  await db.update(urunler).set(payload).where(eq(urunler.id, id));

  // If operasyonlar provided, replace them
  if (patch.operasyonlar !== undefined) {
    await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.urun_id, id));
    if (patch.operasyonlar.length > 0) {
      await insertOperasyonlar(id, patch.operasyonlar);
    }
  }

  // If birimDonusumleri provided, replace them
  if (patch.birimDonusumleri !== undefined) {
    await db.delete(urunBirimDonusumleri).where(eq(urunBirimDonusumleri.urun_id, id));
    if (patch.birimDonusumleri.length > 0) {
      await insertBirimDonusumleri(id, patch.birimDonusumleri);
    }
  }

  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.urun_id, id));
  await db.delete(urunBirimDonusumleri).where(eq(urunBirimDonusumleri.urun_id, id));
  await db.delete(urunler).where(eq(urunler.id, id));
}

// -- Operasyon Helpers --

async function autoCreateOperasyonlar(
  urunId: string,
  data: Pick<CreateBody, 'kategori' | 'tedarikTipi' | 'operasyonTipi' | 'ad' | 'renk'>,
): Promise<void> {
  const categoryRows = await db
    .select({
      productionFieldsEnabled: categories.uretim_alanlari_aktif,
      operationTypeRequired: categories.operasyon_tipi_gerekli,
    })
    .from(categories)
    .where(eq(categories.kod, data.kategori))
    .limit(1);

  const categoryConfig = categoryRows[0];
  const showProductionFields = Boolean(categoryConfig?.productionFieldsEnabled) && data.tedarikTipi === 'uretim';
  if (!showProductionFields) {
    return;
  }

  // Operasyon adina renk ekle (eger ad zaten renk icermiyorsa)
  const renk = data.renk?.trim();
  const baseAd = renk && !data.ad.toLowerCase().includes(renk.toLowerCase())
    ? `${data.ad} ${renk}`
    : data.ad;

  if (!categoryConfig?.operationTypeRequired) {
    await db.insert(urunOperasyonlari).values({
      id: randomUUID(),
      urun_id: urunId,
      sira: 1,
      operasyon_adi: baseAd,
      hazirlik_suresi_dk: 60,
      cevrim_suresi_sn: '45.00',
      montaj: 0,
    });
    return;
  }

  if (data.operasyonTipi === 'cift_tarafli') {
    await db.insert(urunOperasyonlari).values([
      {
        id: randomUUID(),
        urun_id: urunId,
        sira: 1,
        operasyon_adi: `${baseAd} - Sol`,
        hazirlik_suresi_dk: 60,
        cevrim_suresi_sn: '45.00',
        montaj: 0,
      },
      {
        id: randomUUID(),
        urun_id: urunId,
        sira: 2,
        operasyon_adi: `${baseAd} - Sağ`,
        hazirlik_suresi_dk: 60,
        cevrim_suresi_sn: '45.00',
        montaj: 0,
      },
    ]);
  } else {
    await db.insert(urunOperasyonlari).values({
      id: randomUUID(),
      urun_id: urunId,
      sira: 1,
      operasyon_adi: baseAd,
      hazirlik_suresi_dk: 60,
      cevrim_suresi_sn: '45.00',
      montaj: 0,
    });
  }
}

async function insertOperasyonlar(urunId: string, items: OperasyonItem[]): Promise<void> {
  const values = items.map((item) => ({
    id: randomUUID(),
    urun_id: urunId,
    sira: item.sira,
    operasyon_adi: item.operasyonAdi,
    kalip_id: item.kalipId ?? null,
    hazirlik_suresi_dk: item.hazirlikSuresiDk,
    cevrim_suresi_sn: item.cevrimSuresiSn.toFixed(2),
    montaj: item.montaj ? 1 : 0,
  }));
  await db.insert(urunOperasyonlari).values(values);

  // Sync makineler for each operation
  for (let i = 0; i < items.length; i++) {
    if (items[i].makineler && items[i].makineler!.length > 0) {
      await syncOperasyonMakineleri(values[i].id, items[i].makineler!);
    }
  }
}

async function insertBirimDonusumleri(urunId: string, items: BirimDonusumItem[]): Promise<void> {
  const values = items.map((item) => ({
    id: randomUUID(),
    urun_id: urunId,
    hedef_birim: item.hedefBirim,
    carpan: item.carpan.toFixed(4),
  }));
  await db.insert(urunBirimDonusumleri).values(values);
}

// -- Operasyon CRUD --

// -- Urun CRUD --

export async function repoListOperasyonlar(urunId: string): Promise<UrunOperasyonRow[]> {
  return db
    .select()
    .from(urunOperasyonlari)
    .where(eq(urunOperasyonlari.urun_id, urunId))
    .orderBy(asc(urunOperasyonlari.sira));
}

export async function repoPatchOperasyon(
  opId: string,
  data: OperasyonPatchBody,
): Promise<UrunOperasyonRow | null> {
  const payload: Partial<typeof urunOperasyonlari.$inferInsert> = {};
  if (data.operasyonAdi !== undefined) payload.operasyon_adi = data.operasyonAdi;
  if (data.sira !== undefined) payload.sira = data.sira;
  if (data.kalipId !== undefined) payload.kalip_id = data.kalipId;
  if (data.hazirlikSuresiDk !== undefined) payload.hazirlik_suresi_dk = data.hazirlikSuresiDk;
  if (data.cevrimSuresiSn !== undefined) payload.cevrim_suresi_sn = data.cevrimSuresiSn.toFixed(2);
  if (data.montaj !== undefined) payload.montaj = data.montaj ? 1 : 0;
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;

  await db.update(urunOperasyonlari).set(payload).where(eq(urunOperasyonlari.id, opId));

  if (data.makineler !== undefined) {
    await syncOperasyonMakineleri(opId, data.makineler);
  }

  const rows = await db.select().from(urunOperasyonlari).where(eq(urunOperasyonlari.id, opId)).limit(1);
  return rows[0] ?? null;
}

// -- Operasyon Makineleri --

export async function syncOperasyonMakineleri(
  operasyonId: string,
  items: OperasyonMakineItem[],
): Promise<void> {
  await db.delete(urunOperasyonMakineleri).where(eq(urunOperasyonMakineleri.urun_operasyon_id, operasyonId));
  if (items.length === 0) return;
  const values = items.map((item) => ({
    id: randomUUID(),
    urun_operasyon_id: operasyonId,
    makine_id: item.makineId,
    oncelik_sira: item.oncelikSira,
  }));
  await db.insert(urunOperasyonMakineleri).values(values);
}

// -- Urun CRUD --

export async function repoListOperasyonMakineleri(
  operasyonIds: string[],
): Promise<Map<string, UrunOperasyonMakineDto[]>> {
  if (operasyonIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(urunOperasyonMakineleri)
    .where(inArray(urunOperasyonMakineleri.urun_operasyon_id, operasyonIds))
    .orderBy(asc(urunOperasyonMakineleri.oncelik_sira));

  const map = new Map<string, UrunOperasyonMakineDto[]>();
  for (const row of rows) {
    const opId = row.urun_operasyon_id;
    if (!map.has(opId)) map.set(opId, []);
    map.get(opId)!.push(operasyonMakineRowToDto(row));
  }
  return map;
}

// -- Birim Donusumleri --

// -- Urun CRUD --

export async function repoListBirimDonusumleri(urunId: string): Promise<BirimDonusumRow[]> {
  return db
    .select()
    .from(urunBirimDonusumleri)
    .where(eq(urunBirimDonusumleri.urun_id, urunId));
}

// -- Medya --

// -- Urun CRUD --

export async function repoListMedya(urunId: string): Promise<UrunMedyaRow[]> {
  return db
    .select()
    .from(urunMedya)
    .where(eq(urunMedya.urun_id, urunId))
    .orderBy(asc(urunMedya.sira), asc(urunMedya.created_at));
}

export async function repoSaveMedya(urunId: string, items: MedyaItem[]): Promise<UrunMedyaRow[]> {
  await db.delete(urunMedya).where(eq(urunMedya.urun_id, urunId));

  if (items.length > 0) {
    const values = items.map((item, idx) => ({
      id: item.id || randomUUID(),
      urun_id: urunId,
      tip: item.tip,
      url: item.url,
      storage_asset_id: item.storageAssetId ?? null,
      baslik: item.baslik ?? null,
      sira: item.sira ?? idx,
      is_cover: item.isCover ? 1 : 0,
    }));
    await db.insert(urunMedya).values(values);
  }

  return repoListMedya(urunId);
}

export async function repoDeleteMedyaItem(medyaId: string): Promise<void> {
  await db.delete(urunMedya).where(eq(urunMedya.id, medyaId));
}
