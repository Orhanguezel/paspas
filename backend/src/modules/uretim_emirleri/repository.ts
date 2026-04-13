import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, getTableColumns, inArray, like, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler, makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { recalcMakineKuyrukTarihleri } from '@/modules/_shared/planlama';
import { musteriler } from '@/modules/musteriler/schema';
import { operatorGunlukKayitlari } from '@/modules/operator/schema';
import { receteler } from '@/modules/receteler/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { refreshSiparisDurum, getSiparisIdsByUretimEmriId, getKalemIdsByUretimEmriId } from '@/modules/satis_siparisleri/repository';
import { transitionMultipleKalemDurum } from '@/modules/satis_siparisleri/kalem-durum.service';
import { urunler, urunOperasyonlari, hammaddeRezervasyonlari } from '@/modules/urunler/schema';

import {
  emirOperasyonRowToDto,
  uretimEmirleri,
  uretimEmriOperasyonlari,
  uretimEmriSiparisKalemleri,
  type EmirOperasyonDto,
  type UretimEmriAdayDto,
  type UretimEmriRow,
} from './schema';
import { iptalRezervasyon, rezerveHammaddeler, type HammaddeUyari } from './hammadde_service';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: EnrichedUretimEmriRow[];
  total: number;
};

type EnrichedUretimEmriRow = UretimEmriRow & {
  siparisKalemIds: string[];
  siparisNo: string | null;
  urunKod: string | null;
  urunAd: string | null;
  receteAd: string | null;
  etkinTerminTarihi: Date | string | null;
  musteriAd: string | null;
  musteriDetay: string | null;
  musteriOzetTipi: 'manuel' | 'tekil' | 'toplam';
  planlanan_bitis_tarihi: Date | string | null;
  terminRiski: boolean;
  makineAtamaSayisi: number;
  makineAdlari: string | null;
  silinebilir: boolean;
  silmeNedeni: string | null;
  urunGorsel: string | null;
};

type EmirOperasyonPlanRow = {
  uretimEmriId: string;
  makineId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  planlananBaslangic: Date | string | null;
  planlananBitis: Date | string | null;
  gercekBaslangic: Date | string | null;
  gercekBitis: Date | string | null;
  uretilenMiktar: number;
  fireMiktar: number;
  durum: string;
};

type DeleteState = {
  silinebilir: boolean;
  silmeNedeni: string | null;
};

const DELETE_REASON = {
  operatorKaydi: 'Operator kaydi bulunan uretim emri silinemez.',
  uretimBasladi: 'Uretimi baslamis uretim emri silinemez.',
  makinePlani: 'Makine plani yapilmis uretim emri silinemez.',
  durumKilidi: 'Durumu aktif olan uretim emri silinemez.',
} as const;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function maxDate(values: Array<Date | string | null | undefined>): Date | null {
  let latest: Date | null = null;
  for (const value of values) {
    const parsed = toDate(value);
    if (!parsed) continue;
    if (!latest || parsed.getTime() > latest.getTime()) latest = parsed;
  }
  return latest;
}

function minDate(values: Array<Date | string | null | undefined>): Date | null {
  let earliest: Date | null = null;
  for (const value of values) {
    const parsed = toDate(value);
    if (!parsed) continue;
    if (!earliest || parsed.getTime() < earliest.getTime()) earliest = parsed;
  }
  return earliest;
}

function estimatePlanlananBitis(row: UretimEmriRow, operasyonlar: EmirOperasyonPlanRow[]): Date | null {
  if (operasyonlar.length === 0) return toDate(row.bitis_tarihi);

  const explicitPlanlananBitis = maxDate(operasyonlar.map((operasyon) => operasyon.planlananBitis));
  if (explicitPlanlananBitis) return explicitPlanlananBitis;

  const baseStart =
    minDate(operasyonlar.map((operasyon) => operasyon.planlananBaslangic)) ??
    toDate(row.baslangic_tarihi) ??
    toDate(row.created_at);

  if (!baseStart) return null;

  const machineBuckets = new Map<string, number>();
  for (const operasyon of operasyonlar) {
    const dakika =
      Number(operasyon.hazirlikSuresiDk ?? 0) +
      ((Number(operasyon.cevrimSuresiSn ?? 0) * Number(operasyon.planlananMiktar ?? 0)) / 60);
    const key = operasyon.makineId ?? 'unassigned';
    machineBuckets.set(key, (machineBuckets.get(key) ?? 0) + dakika);
  }

  const totalMinutes = Math.max(...machineBuckets.values(), 0);
  return new Date(baseStart.getTime() + (totalMinutes * 60 * 1000));
}

function getDeleteState(row: UretimEmriRow, operasyonlar: EmirOperasyonPlanRow[], makineAtamaSayisi: number, operatorKayitSayisi: number): DeleteState {
  const hasStartedOperasyon = operasyonlar.some((operasyon) =>
    operasyon.gercekBaslangic ||
    operasyon.gercekBitis ||
    Number(operasyon.uretilenMiktar ?? 0) > 0 ||
    Number(operasyon.fireMiktar ?? 0) > 0 ||
    (operasyon.durum !== 'bekliyor' && operasyon.durum !== 'planlandi'),
  );
  const hasMakinePlani =
    makineAtamaSayisi > 0 ||
    operasyonlar.some((operasyon) => Boolean(operasyon.makineId || operasyon.planlananBaslangic || operasyon.planlananBitis));
  const hasDurumKilidi = row.durum === 'uretimde' || row.durum === 'tamamlandi';

  if (operatorKayitSayisi > 0) return { silinebilir: false, silmeNedeni: DELETE_REASON.operatorKaydi };
  if (hasStartedOperasyon) return { silinebilir: false, silmeNedeni: DELETE_REASON.uretimBasladi };
  if (hasMakinePlani) return { silinebilir: false, silmeNedeni: DELETE_REASON.makinePlani };
  if (hasDurumKilidi) return { silinebilir: false, silmeNedeni: DELETE_REASON.durumKilidi };
  return { silinebilir: true, silmeNedeni: null };
}

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.q) conditions.push(like(uretimEmirleri.emir_no, `%${query.q}%`));
  if (query.siparisId) {
    conditions.push(
      sql`${uretimEmirleri.id} IN (
        SELECT uesk.uretim_emri_id FROM uretim_emri_siparis_kalemleri uesk
        INNER JOIN siparis_kalemleri sk ON sk.id = uesk.siparis_kalem_id
        WHERE sk.siparis_id = ${query.siparisId}
      )`,
    );
  }
  if (query.urunId) conditions.push(eq(uretimEmirleri.urun_id, query.urunId));
  if (query.durum === 'atanmamis') {
    // Emir bazli degil, operasyon bazli kontrol: en az bir operasyonu makineye atanmamis olan emirler
    conditions.push(
      sql`${uretimEmirleri.id} IN (
        SELECT DISTINCT uretim_emri_id FROM uretim_emri_operasyonlari
        WHERE makine_id IS NULL AND durum = 'bekliyor'
      )`,
    );
  } else if (query.durum) {
    conditions.push(eq(uretimEmirleri.durum, query.durum));
  }
  if (!query.tamamlananlariGoster && !query.durum) {
    conditions.push(sql`${uretimEmirleri.durum} NOT IN ('tamamlandi', 'iptal')`);
  }
  if (typeof query.isActive === 'boolean') conditions.push(eq(uretimEmirleri.is_active, query.isActive ? 1 : 0));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'emir_no') return query.order === 'asc' ? asc(uretimEmirleri.emir_no) : desc(uretimEmirleri.emir_no);
  if (query.sort === 'baslangic_tarihi') return query.order === 'asc' ? asc(uretimEmirleri.baslangic_tarihi) : desc(uretimEmirleri.baslangic_tarihi);
  if (query.sort === 'bitis_tarihi') return query.order === 'asc' ? asc(uretimEmirleri.bitis_tarihi) : desc(uretimEmirleri.bitis_tarihi);
  return query.order === 'asc' ? asc(uretimEmirleri.created_at) : desc(uretimEmirleri.created_at);
}

function mapCreateInput(data: CreateBody): typeof uretimEmirleri.$inferInsert {
  return {
    id: randomUUID(),
    emir_no: data.emirNo,
    urun_id: data.urunId,
    recete_id: data.receteId,
    musteri_ozet: data.musteriOzet,
    musteri_detay: data.musteriDetay,
    planlanan_miktar: data.planlananMiktar.toFixed(4),
    uretilen_miktar: data.uretilenMiktar.toFixed(4),
    baslangic_tarihi: data.baslangicTarihi ? new Date(data.baslangicTarihi) : undefined,
    bitis_tarihi: data.bitisTarihi ? new Date(data.bitisTarihi) : undefined,
    termin_tarihi: data.terminTarihi ? new Date(data.terminTarihi) : undefined,
    durum: data.durum,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof uretimEmirleri.$inferInsert> {
  const payload: Partial<typeof uretimEmirleri.$inferInsert> = {};
  if (data.emirNo !== undefined) payload.emir_no = data.emirNo;
  if (data.urunId !== undefined) payload.urun_id = data.urunId;
  if (data.receteId !== undefined) payload.recete_id = data.receteId;
  if (data.musteriOzet !== undefined) payload.musteri_ozet = data.musteriOzet;
  if (data.musteriDetay !== undefined) payload.musteri_detay = data.musteriDetay;
  if (data.planlananMiktar !== undefined) payload.planlanan_miktar = data.planlananMiktar.toFixed(4);
  if (data.uretilenMiktar !== undefined) payload.uretilen_miktar = data.uretilenMiktar.toFixed(4);
  if (data.baslangicTarihi !== undefined) payload.baslangic_tarihi = data.baslangicTarihi ? new Date(data.baslangicTarihi) : null;
  if (data.bitisTarihi !== undefined) payload.bitis_tarihi = data.bitisTarihi ? new Date(data.bitisTarihi) : null;
  if (data.terminTarihi !== undefined) payload.termin_tarihi = data.terminTarihi ? new Date(data.terminTarihi) : null;
  if (data.durum !== undefined) payload.durum = data.durum;
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

async function syncJunctionRows(uretimEmriId: string, kalemIds: string[], expectedUrunId?: string): Promise<void> {
  await db.delete(uretimEmriSiparisKalemleri).where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId));
  if (kalemIds.length === 0) return;

  // Validate all kalemleri belong to the same product as the emir
  if (expectedUrunId) {
    const kalemleri = await db
      .select({ id: siparisKalemleri.id, urunId: siparisKalemleri.urun_id })
      .from(siparisKalemleri)
      .where(inArray(siparisKalemleri.id, kalemIds));

    const mismatch = kalemleri.find((k) => k.urunId !== expectedUrunId);
    if (mismatch) {
      throw Object.assign(new Error('urun_uyumsuzlugu'), {
        detail: 'Siparis kalemleri ile uretim emrinin urunu ayni olmali.',
      });
    }
  }

  const rows = kalemIds.map((kalemId) => ({
    id: randomUUID(),
    uretim_emri_id: uretimEmriId,
    siparis_kalem_id: kalemId,
  }));
  await db.insert(uretimEmriSiparisKalemleri).values(rows);
}

/** Urun operasyonlarindan emir operasyonlarini otomatik olusturur */
async function autoPopulateOperasyonlar(emirId: string, urunId: string, planlananMiktar: string): Promise<void> {
  const ops = await db
    .select()
    .from(urunOperasyonlari)
    .where(and(eq(urunOperasyonlari.urun_id, urunId), eq(urunOperasyonlari.is_active, 1)))
    .orderBy(asc(urunOperasyonlari.sira));

  if (ops.length === 0) return;

  const values = ops.map((op) => ({
    id: randomUUID(),
    uretim_emri_id: emirId,
    urun_operasyon_id: op.id,
    sira: op.sira,
    operasyon_adi: op.operasyon_adi,
    kalip_id: op.kalip_id,
    hazirlik_suresi_dk: op.hazirlik_suresi_dk,
    cevrim_suresi_sn: String(op.cevrim_suresi_sn),
    planlanan_miktar: planlananMiktar,
    montaj: op.montaj,
    durum: 'bekliyor' as const,
  }));

  await db.insert(uretimEmriOperasyonlari).values(values);
}

/** Emir operasyonlarini listele */
export async function repoGetOperasyonlar(emirId: string): Promise<EmirOperasyonDto[]> {
  const rows = await db
    .select()
    .from(uretimEmriOperasyonlari)
    .where(eq(uretimEmriOperasyonlari.uretim_emri_id, emirId))
    .orderBy(asc(uretimEmriOperasyonlari.sira));

  return rows.map(emirOperasyonRowToDto);
}

async function enrichRows(rows: UretimEmriRow[]): Promise<EnrichedUretimEmriRow[]> {
  if (rows.length === 0) return [];

  const emirIds = rows.map((row) => row.id);

  const [queueRows, operasyonRows, operatorRows, junctionRows] = await Promise.all([
    db
      .select({
        uretimEmriId: makineKuyrugu.uretim_emri_id,
        planlananBitisTarihi: sql<Date | string | null>`max(${makineKuyrugu.planlanan_bitis})`,
        makineAtamaSayisi: sql<number>`count(*)`,
        makineAdlari: sql<string | null>`group_concat(distinct ${makineler.ad} order by ${makineler.ad} separator ', ')`,
      })
      .from(makineKuyrugu)
      .leftJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
      .where(inArray(makineKuyrugu.uretim_emri_id, emirIds))
      .groupBy(makineKuyrugu.uretim_emri_id),
    db
      .select({
        uretimEmriId: uretimEmriOperasyonlari.uretim_emri_id,
        makineId: uretimEmriOperasyonlari.makine_id,
        hazirlikSuresiDk: uretimEmriOperasyonlari.hazirlik_suresi_dk,
        cevrimSuresiSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
        planlananMiktar: uretimEmriOperasyonlari.planlanan_miktar,
        planlananBaslangic: uretimEmriOperasyonlari.planlanan_baslangic,
        planlananBitis: uretimEmriOperasyonlari.planlanan_bitis,
        gercekBaslangic: uretimEmriOperasyonlari.gercek_baslangic,
        gercekBitis: uretimEmriOperasyonlari.gercek_bitis,
        uretilenMiktar: uretimEmriOperasyonlari.uretilen_miktar,
        fireMiktar: uretimEmriOperasyonlari.fire_miktar,
        durum: uretimEmriOperasyonlari.durum,
      })
      .from(uretimEmriOperasyonlari)
      .where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds))
      .orderBy(asc(uretimEmriOperasyonlari.sira)),
    db
      .select({
        uretimEmriId: operatorGunlukKayitlari.uretim_emri_id,
        // Only count records with actual production — start logs (net_miktar=0) must not block deletion
        kayitSayisi: sql<number>`sum(case when ${operatorGunlukKayitlari.net_miktar} > 0 or ${operatorGunlukKayitlari.ek_uretim_miktari} > 0 then 1 else 0 end)`,
      })
      .from(operatorGunlukKayitlari)
      .where(inArray(operatorGunlukKayitlari.uretim_emri_id, emirIds))
      .groupBy(operatorGunlukKayitlari.uretim_emri_id),
    db
      .select({
        uretimEmriId: uretimEmriSiparisKalemleri.uretim_emri_id,
        siparisKalemIds: sql<string>`group_concat(distinct ${uretimEmriSiparisKalemleri.siparis_kalem_id})`,
        siparisNo: sql<string | null>`group_concat(distinct ${satisSiparisleri.siparis_no} order by ${satisSiparisleri.siparis_no} separator ', ')`,
        musteriAd: sql<string | null>`group_concat(distinct ${musteriler.ad} order by ${musteriler.ad} separator ', ')`,
        musteriDetay: sql<string | null>`group_concat(distinct concat(${musteriler.ad}, ': ', cast(${siparisKalemleri.miktar} as char)) order by ${satisSiparisleri.siparis_no} separator ' | ')`,
        musteriSayisi: sql<number>`count(distinct ${musteriler.id})`,
        terminTarihi: sql<Date | string | null>`min(${satisSiparisleri.termin_tarihi})`,
      })
      .from(uretimEmriSiparisKalemleri)
      .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
      .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .innerJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds))
      .groupBy(uretimEmriSiparisKalemleri.uretim_emri_id),
  ]);

  const queueMap = new Map(
    queueRows.map((row) => [
      row.uretimEmriId,
      { planlananBitisTarihi: row.planlananBitisTarihi, makineAtamaSayisi: Number(row.makineAtamaSayisi ?? 0), makineAdlari: row.makineAdlari ?? null },
    ]),
  );

  const operasyonMap = new Map<string, EmirOperasyonPlanRow[]>();
  for (const row of operasyonRows) {
    const key = row.uretimEmriId;
    const items = operasyonMap.get(key) ?? [];
    items.push({
      uretimEmriId: row.uretimEmriId,
      makineId: row.makineId ?? null,
      hazirlikSuresiDk: Number(row.hazirlikSuresiDk ?? 0),
      cevrimSuresiSn: Number(row.cevrimSuresiSn ?? 0),
      planlananMiktar: Number(row.planlananMiktar ?? 0),
      planlananBaslangic: row.planlananBaslangic,
      planlananBitis: row.planlananBitis,
      gercekBaslangic: row.gercekBaslangic,
      gercekBitis: row.gercekBitis,
      uretilenMiktar: Number(row.uretilenMiktar ?? 0),
      fireMiktar: Number(row.fireMiktar ?? 0),
      durum: row.durum,
    });
    operasyonMap.set(key, items);
  }

  const operatorMap = new Map(
    operatorRows.map((row) => [row.uretimEmriId, Number(row.kayitSayisi ?? 0)]),
  );

  const junctionMap = new Map(
    junctionRows.map((row) => [
      row.uretimEmriId,
      {
        siparisKalemIds: row.siparisKalemIds ? String(row.siparisKalemIds).split(',') : [],
        siparisNo: row.siparisNo,
        musteriAd: row.musteriAd,
        musteriDetay: row.musteriDetay,
        musteriOzetTipi: (Number(row.musteriSayisi) > 1 ? 'toplam' : 'tekil') as 'tekil' | 'toplam',
        terminTarihi: row.terminTarihi,
      },
    ]),
  );

  return rows.map((row) => {
    const q = queueMap.get(row.id);
    const j = junctionMap.get(row.id);
    const operasyonlar = operasyonMap.get(row.id) ?? [];
    const planlananBitis =
      q?.planlananBitisTarihi ??
      estimatePlanlananBitis(row, operasyonlar) ??
      row.bitis_tarihi ??
      null;
    const etkinTermin = row.termin_tarihi ?? j?.terminTarihi ?? null;
    const terminRiski = Boolean(
      etkinTermin &&
      planlananBitis &&
      new Date(planlananBitis).getTime() > new Date(etkinTermin).getTime(),
    );
    const deleteState = getDeleteState(row, operasyonlar, q?.makineAtamaSayisi ?? 0, operatorMap.get(row.id) ?? 0);

    const hasSiparis = (j?.siparisKalemIds.length ?? 0) > 0;

    return {
      ...row,
      siparisKalemIds: j?.siparisKalemIds ?? [],
      siparisNo: j?.siparisNo ?? null,
      urunKod: (row as EnrichedUretimEmriRow).urunKod ?? null,
      urunAd: (row as EnrichedUretimEmriRow).urunAd ?? null,
      receteAd: (row as EnrichedUretimEmriRow).receteAd ?? null,
      etkinTerminTarihi: etkinTermin,
      musteriAd: j?.musteriAd ?? row.musteri_ozet ?? null,
      musteriDetay: j?.musteriDetay ?? row.musteri_detay ?? null,
      planlanan_bitis_tarihi: planlananBitis,
      terminRiski,
      makineAtamaSayisi: q?.makineAtamaSayisi ?? 0,
      makineAdlari: q?.makineAdlari ?? null,
      silinebilir: deleteState.silinebilir,
      silmeNedeni: deleteState.silmeNedeni,
      musteriOzetTipi: hasSiparis ? j!.musteriOzetTipi : 'manuel',
      urunGorsel: (row as EnrichedUretimEmriRow).urunGorsel ?? null,
    } satisfies EnrichedUretimEmriRow;
  });
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);
  const [items, countResult] = await Promise.all([
    db
      .select({
        ...getTableColumns(uretimEmirleri),
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        urunGorsel: urunler.image_url,
        receteAd: receteler.ad,
      })
      .from(uretimEmirleri)
      .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(receteler, eq(uretimEmirleri.recete_id, receteler.id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(uretimEmirleri).where(where),
  ]);
  return { items: await enrichRows(items as UretimEmriRow[]), total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<EnrichedUretimEmriRow | null> {
  const rows = await db
    .select({
      ...getTableColumns(uretimEmirleri),
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      urunGorsel: urunler.image_url,
      receteAd: receteler.ad,
    })
    .from(uretimEmirleri)
    .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(receteler, eq(uretimEmirleri.recete_id, receteler.id))
    .where(eq(uretimEmirleri.id, id))
    .limit(1);
  const enriched = await enrichRows(rows as UretimEmriRow[]);
  return enriched[0] ?? null;
}

export type CreateResult = {
  row: EnrichedUretimEmriRow;
  hammaddeUyarilari: HammaddeUyari[];
};

export async function repoCreate(data: CreateBody): Promise<CreateResult> {
  // receteId verilmemisse urunun aktif recetesini otomatik bul
  let effectiveReceteId = data.receteId;
  if (!effectiveReceteId) {
    const [aktifRecete] = await db
      .select({ id: receteler.id })
      .from(receteler)
      .where(and(eq(receteler.urun_id, data.urunId), eq(receteler.is_active, 1)))
      .limit(1);
    effectiveReceteId = aktifRecete?.id;
  }
  const payload = mapCreateInput({ ...data, receteId: effectiveReceteId });
  await db.insert(uretimEmirleri).values(payload);
  if (data.siparisKalemIds && data.siparisKalemIds.length > 0) {
    await syncJunctionRows(payload.id, data.siparisKalemIds, data.urunId);
    // Siparis kalemlerinin durumunu uretime_aktarildi yap
    await transitionMultipleKalemDurum(data.siparisKalemIds, 'uretime_aktarildi');
  }
  // Urun operasyonlarindan emir operasyonlarini otomatik olustur
  await autoPopulateOperasyonlar(payload.id, data.urunId, data.planlananMiktar.toFixed(4));
  // Hammadde rezervasyonu olustur (uyarilarla birlikte)
  const hammaddeUyarilari = await rezerveHammaddeler(payload.id, effectiveReceteId, data.planlananMiktar);
  // Auto-refresh linked sipariş durum (taslak/onaylandi → planlandi)
  const siparisIds = await getSiparisIdsByUretimEmriId(payload.id);
  for (const sid of siparisIds) await refreshSiparisDurum(sid);
  const row = await repoGetById(payload.id);
  if (!row) throw new Error('insert_failed');
  return { row, hammaddeUyarilari };
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<EnrichedUretimEmriRow | null> {
  // Tamamlanmış üretim emri düzenlenemez
  const existing = await repoGetById(id);
  if (!existing) return null;
  if (existing.durum === 'tamamlandi') {
    const err = new Error('uretim_emri_tamamlandi');
    (err as any).detail = 'Tamamlanmış üretim emri düzenlenemez.';
    throw err;
  }

  const payload = mapPatchInput(patch);
  if (Object.keys(payload).length > 0) {
    await db.update(uretimEmirleri).set(payload).where(eq(uretimEmirleri.id, id));
  }
  if (patch.siparisKalemIds !== undefined) {
    // Resolve urunId: from patch or from existing row
    const urunId = patch.urunId ?? (await repoGetById(id))?.urun_id;
    await syncJunctionRows(id, patch.siparisKalemIds ?? [], urunId ?? undefined);
  }

  // Miktar degistiyse operasyonlarin planlanan_miktar'ini ve kuyruk surelerini guncelle
  if (patch.planlananMiktar !== undefined) {
    const miktarStr = patch.planlananMiktar.toFixed(4);
    // Operasyonlarin planlanan miktarini guncelle
    await db
      .update(uretimEmriOperasyonlari)
      .set({ planlanan_miktar: miktarStr })
      .where(eq(uretimEmriOperasyonlari.uretim_emri_id, id));

    // Kuyruk surelerini yeniden hesapla (cevrim_suresi * yeni miktar)
    const kuyrukRows = await db
      .select({
        kuyrukId: makineKuyrugu.id,
        makineId: makineKuyrugu.makine_id,
        emirOpId: makineKuyrugu.emir_operasyon_id,
      })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.uretim_emri_id, id));

    const affectedMachines = new Set<string>();
    for (const kRow of kuyrukRows) {
      if (!kRow.emirOpId) continue;
      // Operasyondan cevrim suresini al
      const [op] = await db
        .select({ cevrimSuresiSn: uretimEmriOperasyonlari.cevrim_suresi_sn, hazirlikSuresiDk: uretimEmriOperasyonlari.hazirlik_suresi_dk })
        .from(uretimEmriOperasyonlari)
        .where(eq(uretimEmriOperasyonlari.id, kRow.emirOpId))
        .limit(1);
      if (op) {
        const planlananSureDk = Math.ceil((Number(op.cevrimSuresiSn ?? 0) * patch.planlananMiktar) / 60);
        await db.update(makineKuyrugu).set({ planlanan_sure_dk: planlananSureDk }).where(eq(makineKuyrugu.id, kRow.kuyrukId));
      }
      affectedMachines.add(kRow.makineId);
    }

    // Etkilenen makinelerin kuyruklarini recalc et
    for (const makineId of affectedMachines) {
      await recalcMakineKuyrukTarihleri(makineId);
    }
  }

  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  const row = await repoGetById(id);
  if (!row) return;
  if (!row.silinebilir) {
    const error = new Error('uretim_emri_silinemez');
    (error as Error & { detail?: string }).detail = row.silmeNedeni ?? DELETE_REASON.uretimBasladi;
    throw error;
  }
  // Hammadde rezervasyonlarını geri al
  await iptalRezervasyon(id);
  // Siparis kalemlerinin durumunu beklemede'ye geri al (tersine guncelleme)
  const kalemIds = await getKalemIdsByUretimEmriId(id);
  await db.delete(uretimEmriSiparisKalemleri).where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, id));
  await db.delete(uretimEmriOperasyonlari).where(eq(uretimEmriOperasyonlari.uretim_emri_id, id));
  await db.delete(uretimEmirleri).where(eq(uretimEmirleri.id, id));
  // Junction silindikten sonra kalemleri beklemede'ye dondur
  for (const kalemId of kalemIds) {
    await db
      .update(siparisKalemleri)
      .set({ uretim_durumu: 'beklemede' })
      .where(eq(siparisKalemleri.id, kalemId));
  }
}

export async function repoGetNextEmirNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `UE-${year}-`;
  const rows = await db
    .select({ emir_no: uretimEmirleri.emir_no })
    .from(uretimEmirleri)
    .where(like(uretimEmirleri.emir_no, `${prefix}%`))
    .orderBy(desc(uretimEmirleri.emir_no))
    .limit(1);
  const last = rows[0]?.emir_no;
  if (!last) return `${prefix}0001`;
  const seq = Number.parseInt(last.replace(prefix, ''), 10);
  return `${prefix}${String(seq + 1).padStart(4, '0')}`;
}

export async function repoListAdaylar(): Promise<UretimEmriAdayDto[]> {
  // Individual siparis kalemleri NOT yet linked to any active uretim emri
  const rawRows = await db
    .select({
      siparisKalemId: siparisKalemleri.id,
      siparisNo: satisSiparisleri.siparis_no,
      urunId: siparisKalemleri.urun_id,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      receteId: sql<string | null>`(
        SELECT r.id
        FROM receteler r
        WHERE r.urun_id = ${siparisKalemleri.urun_id} AND r.is_active = 1
        ORDER BY r.updated_at DESC, r.created_at DESC
        LIMIT 1
      )`,
      musteriAd: musteriler.ad,
      miktar: siparisKalemleri.miktar,
      terminTarihi: satisSiparisleri.termin_tarihi,
    })
    .from(siparisKalemleri)
    .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
    .innerJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
    .innerJoin(urunler, eq(siparisKalemleri.urun_id, urunler.id))
    .leftJoin(
      uretimEmriSiparisKalemleri,
      and(
        eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id),
        sql`${uretimEmriSiparisKalemleri.uretim_emri_id} IN (
          SELECT ue.id FROM uretim_emirleri ue
          WHERE ue.is_active = 1 AND ue.durum != 'iptal'
        )`,
      ),
    )
    .where(and(
      eq(satisSiparisleri.is_active, 1),
      eq(urunler.is_active, 1),
      sql`${uretimEmriSiparisKalemleri.id} IS NULL`,
    ))
    .orderBy(asc(satisSiparisleri.termin_tarihi), asc(urunler.ad), asc(musteriler.ad));

  return rawRows.map((row) => ({
    siparisKalemId: row.siparisKalemId,
    siparisNo: row.siparisNo,
    urunId: row.urunId,
    urunKod: row.urunKod ?? null,
    urunAd: row.urunAd ?? null,
    receteId: row.receteId ?? null,
    musteriAd: row.musteriAd,
    miktar: Number(row.miktar ?? 0),
    terminTarihi: row.terminTarihi
      ? (row.terminTarihi instanceof Date
        ? row.terminTarihi.toISOString().slice(0, 10)
        : String(row.terminTarihi).slice(0, 10))
      : null,
  }));
}

export type UretimKarsilastirma = {
  planlananMiktar: number;
  toplamUretilen: number;
  toplamFire: number;
  netUretilen: number;
  fark: number;
};

export type HammaddeYeterlilikItemDto = {
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  urunGorsel: string | null;
  gerekliMiktar: number;
  toplamStok: number;
  rezerveKuyruk: number;
  kalanSerbest: number;
  eksikMiktar: number;
};

export type HammaddeYeterlilikDto = {
  yeterli: boolean;
  items: HammaddeYeterlilikItemDto[];
};

/**
 * İş emri kapanışında planlanan miktar ile vardiya kayıtlarından
 * toplanan gerçek üretim miktarını karşılaştırır.
 */
export async function repoGetUretimKarsilastirma(id: string): Promise<UretimKarsilastirma | null> {
  const row = await repoGetById(id);
  if (!row) return null;

  const planlananMiktar = Number(row.planlanan_miktar ?? 0);

  const [agg] = await db
    .select({
      toplamUretilen: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.ek_uretim_miktari}), 0)`,
      toplamFire: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.fire_miktari}), 0)`,
      netUretilen: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.net_miktar}), 0)`,
    })
    .from(operatorGunlukKayitlari)
    .where(eq(operatorGunlukKayitlari.uretim_emri_id, id));

  const toplamUretilen = Number(agg?.toplamUretilen ?? 0);
  const toplamFire = Number(agg?.toplamFire ?? 0);
  const netUretilen = Number(agg?.netUretilen ?? 0);

  return {
    planlananMiktar,
    toplamUretilen,
    toplamFire,
    netUretilen,
    fark: netUretilen - planlananMiktar,
  };
}

export async function repoGetHammaddeYeterlilik(id: string): Promise<HammaddeYeterlilikDto | null> {
  const target = await repoGetById(id);
  if (!target) return null;

  // 1. Get our requirements
  const myRez = await db
    .select({
      urunId: hammaddeRezervasyonlari.urun_id,
      miktar: hammaddeRezervasyonlari.miktar,
    })
    .from(hammaddeRezervasyonlari)
    .where(and(eq(hammaddeRezervasyonlari.uretim_emri_id, id), eq(hammaddeRezervasyonlari.durum, 'rezerve')));

  if (myRez.length === 0) return { yeterli: true, items: [] };

  const uniqueUrunIds = Array.from(new Set(myRez.map((r) => r.urunId)));

  // 2. Get all active reservations for these materials (except ours)
  const others = await db
    .select({
      uretimEmriId: hammaddeRezervasyonlari.uretim_emri_id,
      urunId: hammaddeRezervasyonlari.urun_id,
      miktar: hammaddeRezervasyonlari.miktar,
      planBitis: sql<string | null>`(
        SELECT MAX(planlanan_bitis) FROM makine_kuyrugu
        WHERE uretim_emri_id = ${hammaddeRezervasyonlari.uretim_emri_id}
      )`,
      altBitis: uretimEmirleri.bitis_tarihi,
      createdAt: uretimEmirleri.created_at,
    })
    .from(hammaddeRezervasyonlari)
    .innerJoin(uretimEmirleri, eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmirleri.id))
    .where(
      and(
        inArray(hammaddeRezervasyonlari.urun_id, uniqueUrunIds),
        eq(hammaddeRezervasyonlari.durum, 'rezerve'),
        sql`${hammaddeRezervasyonlari.uretim_emri_id} != ${id}`,
        eq(uretimEmirleri.is_active, 1),
      ),
    );

  // 3. Get actual stocks
  const stocks = await db
    .select({
      id: urunler.id,
      kod: urunler.kod,
      ad: urunler.ad,
      gorsel: urunler.image_url,
      stok: urunler.stok,
    })
    .from(urunler)
    .where(inArray(urunler.id, uniqueUrunIds));

  const stockMap = new Map(stocks.map((s) => [s.id, s]));

  // 4. Determine target priority date
  const [targetPlanResult] = await db
    .select({ val: sql<string | null>`MAX(planlanan_bitis)` })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.uretim_emri_id, id));
  
  const targetPlanDate = targetPlanResult?.val ?? target.bitis_tarihi ?? target.created_at;

  const resultItems: HammaddeYeterlilikItemDto[] = [];
  let overallYeterli = true;

  for (const urunId of uniqueUrunIds) {
    const sInfo = stockMap.get(urunId);
    const myNeeded = myRez.filter((r) => r.urunId === urunId).reduce((sum, r) => sum + Number(r.miktar), 0);
    
    // Sum "others" that end BEFORE us
    const higherPriorityRezMiktar = others
      .filter((o) => o.urunId === urunId)
      .filter((o) => {
        const oPlan = o.planBitis ?? o.altBitis ?? o.createdAt;
        if (!oPlan) return true; 
        if (!targetPlanDate) return false;
        return new Date(oPlan).getTime() <= new Date(targetPlanDate).getTime();
      })
      .reduce((sum, o) => sum + Number(o.miktar), 0);

    const totalStok = Number(sInfo?.stok ?? 0);
    const kalanSerbest = Math.max(0, totalStok - higherPriorityRezMiktar);
    const eksik = Math.max(0, myNeeded - kalanSerbest);

    if (eksik > 0) overallYeterli = false;

    resultItems.push({
      urunId,
      urunKod: sInfo?.kod ?? null,
      urunAd: sInfo?.ad ?? null,
      urunGorsel: sInfo?.gorsel ?? null,
      gerekliMiktar: myNeeded,
      toplamStok: totalStok,
      rezerveKuyruk: higherPriorityRezMiktar,
      kalanSerbest,
      eksikMiktar: eksik,
    });
  }

  return {
    yeterli: overallYeterli,
    items: resultItems,
  };
}
