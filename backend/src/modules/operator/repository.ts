import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler, makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';
import { hareketler } from '@/modules/hareketler/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { refreshSiparisDurum, getSiparisIdsByUretimEmriId, getKalemIdsByUretimEmriId } from '@/modules/satis_siparisleri/repository';
import { transitionMultipleKalemDurum } from '@/modules/satis_siparisleri/kalem-durum.service';
import { receteler, receteKalemleri } from '@/modules/receteler/schema';
import { tryMontajForUretimEmri, tryPendingMontajlarAfterStokArtis } from '@/modules/uretim_emirleri/service';
import { repoCreate as malKabulRepoCreate } from '@/modules/mal_kabul/repository';
import { createAdminNotification } from '@/modules/notifications/controller';
import { isMakineWorkingDay, recalcMakineKuyrukTarihleri } from '@/modules/_shared/planlama';
import { hammaddeRezervasyonlari } from '@/modules/urunler/schema';
import { vardiyalar } from '@/modules/tanimlar/schema';

import {
  durusKayitlari,
  operatorGunlukKayitlari,
  sevkiyatKalemleri,
  sevkiyatlar,
  vardiyaKayitlari,
  durusRowToDto,
  rowToGunlukGirisDto,
  sevkiyatRowToDto,
  sevkiyatKalemRowToDto,
  vardiyaRowToDto,
  type DurusKayitDto,
  type MalKabulDto,
  type OperatorGunlukGirisDto,
  type SevkiyatDto,
  type SevkiyatKalemDto,
  type VardiyaKayitDto,
} from './schema';
import type {
  DevamEtBody,
  DuraklatBody,
  ListGunlukGirislerQuery,
  ListMakineKuyruguQuery,
  MalKabulBody,
  SevkiyatBody,
  UretimBaslatBody,
  UretimBitirBody,
  VardiyaBasiBody,
  GunlukUretimBody,
  VardiyaSonuBody,
} from './validation';

const VARDIYA_SAATLERI = {
  gunduz: { baslangic: '07:30', bitis: '19:30' },
  gece: { baslangic: '19:30', bitis: '07:30' },
} as const;

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type VardiyaTipi = keyof typeof VARDIYA_SAATLERI;
type VardiyaTanimi = {
  vardiyaTipi: VardiyaTipi;
  ad: string;
  baslangicSaati: string;
  bitisSaati: string;
};
type VardiyaPenceresi = {
  vardiyaTipi: VardiyaTipi;
  ad: string;
  baslangic: Date;
  bitis: Date;
};
type MakineKuyrukBildirimOzeti = {
  emirNo: string | null;
  makineKod: string | null;
  makineAd: string | null;
  urunKod: string | null;
  urunAd: string | null;
  operasyonAdi: string | null;
};

function parseClockToMinutes(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  return (hour * 60) + minute;
}

function getCurrentMinutes(now: Date): number {
  return (now.getHours() * 60) + now.getMinutes();
}

function normalizeShiftName(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function inferVardiyaTipi(ad: string, baslangicSaati: string, bitisSaati: string): VardiyaTipi {
  const normalizedName = normalizeShiftName(ad);
  if (normalizedName.includes('gece')) return 'gece';
  if (normalizedName.includes('gunduz')) return 'gunduz';

  const baslangic = parseClockToMinutes(baslangicSaati);
  const bitis = parseClockToMinutes(bitisSaati);
  if (baslangic > bitis) return 'gece';
  return baslangic >= (12 * 60) ? 'gece' : 'gunduz';
}

function createDateForClock(reference: Date, clock: string): Date {
  const [hour, minute] = clock.split(':').map(Number);
  const date = new Date(reference);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildShiftWindow(now: Date, tanim: VardiyaTanimi): VardiyaPenceresi {
  const currentMinutes = getCurrentMinutes(now);
  const baslangicMinutes = parseClockToMinutes(tanim.baslangicSaati);
  const bitisMinutes = parseClockToMinutes(tanim.bitisSaati);
  const overnight = baslangicMinutes >= bitisMinutes;

  const baslangic = createDateForClock(now, tanim.baslangicSaati);
  const bitis = createDateForClock(now, tanim.bitisSaati);

  if (overnight) {
    if (currentMinutes >= baslangicMinutes) {
      bitis.setDate(bitis.getDate() + 1);
    } else {
      baslangic.setDate(baslangic.getDate() - 1);
    }
  }

  return {
    vardiyaTipi: tanim.vardiyaTipi,
    ad: tanim.ad,
    baslangic,
    bitis,
  };
}

function isNowWithinShiftWindow(now: Date, pencere: VardiyaPenceresi): boolean {
  return now >= pencere.baslangic && now < pencere.bitis;
}

async function listActiveVardiyaTanimlari(): Promise<VardiyaTanimi[]> {
  const rows = await db
    .select({
      ad: vardiyalar.ad,
      baslangicSaati: vardiyalar.baslangic_saati,
      bitisSaati: vardiyalar.bitis_saati,
    })
    .from(vardiyalar)
    .where(eq(vardiyalar.is_active, 1))
    .orderBy(asc(vardiyalar.baslangic_saati), asc(vardiyalar.ad));

  if (rows.length === 0) {
    return (Object.entries(VARDIYA_SAATLERI) as [VardiyaTipi, { baslangic: string; bitis: string }][]).map(([vardiyaTipi, saatler]) => ({
      vardiyaTipi,
      ad: vardiyaTipi,
      baslangicSaati: saatler.baslangic,
      bitisSaati: saatler.bitis,
    }));
  }

  return rows.map((row) => ({
    vardiyaTipi: inferVardiyaTipi(row.ad, row.baslangicSaati, row.bitisSaati),
    ad: row.ad,
    baslangicSaati: row.baslangicSaati,
    bitisSaati: row.bitisSaati,
  }));
}

async function getCurrentShiftWindow(now: Date): Promise<VardiyaPenceresi | null> {
  const tanimlar = await listActiveVardiyaTanimlari();
  const current = tanimlar
    .map((tanim) => buildShiftWindow(now, tanim))
    .filter((pencere) => isNowWithinShiftWindow(now, pencere))
    .sort((a, b) => b.baslangic.getTime() - a.baslangic.getTime());

  return current[0] ?? null;
}

async function ensureAutomaticShiftForMachine(
  tx: DbTransaction,
  {
    makineId,
    operatorUserId,
    now,
    preferredVardiyaTipi,
    notlar,
    strictNoExisting,
  }: {
    makineId: string;
    operatorUserId: string | null;
    now: Date;
    preferredVardiyaTipi?: VardiyaTipi;
    notlar?: string | null;
    strictNoExisting?: boolean;
  },
) {
  const [openShift] = await tx
    .select()
    .from(vardiyaKayitlari)
    .where(
      and(
        eq(vardiyaKayitlari.makine_id, makineId),
        sql`${vardiyaKayitlari.bitis} IS NULL`,
      ),
    )
    .orderBy(desc(vardiyaKayitlari.baslangic))
    .limit(1);

  if (openShift) {
    if (strictNoExisting) throw new Error('acik_vardiya_zaten_var');
    return openShift;
  }

  const vardiyaPenceresi = await getCurrentShiftWindow(now);
  if (!vardiyaPenceresi) throw new Error('vardiya_tanimi_bulunamadi');
  if (preferredVardiyaTipi && vardiyaPenceresi.vardiyaTipi !== preferredVardiyaTipi) {
    throw new Error('vardiya_saati_gecersiz');
  }

  const calismaDurumu = await isMakineWorkingDay(makineId, now);
  if (!calismaDurumu) {
    throw new Error('makine_bugun_calismiyor');
  }

  const id = randomUUID();
  await tx.insert(vardiyaKayitlari).values({
    id,
    makine_id: makineId,
    operator_user_id: operatorUserId,
    vardiya_tipi: vardiyaPenceresi.vardiyaTipi,
    baslangic: vardiyaPenceresi.baslangic,
    notlar: notlar ?? null,
  });

  const [createdShift] = await tx.select().from(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, id)).limit(1);
  return createdShift;
}

/**
 * Consumes raw materials based on the job's recipe and the produced quantity.
 * Triggered only for assembly (Montaj) or single-stage jobs (OP-1c).
 */
async function consumeRecipeMaterials(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  uretimEmriId: string,
  netMiktar: number,
  operatorUserId: string | null = null,
): Promise<void> {
  if (netMiktar <= 0) return;

  const [emir] = await tx
    .select({ recete_id: uretimEmirleri.recete_id })
    .from(uretimEmirleri)
    .where(eq(uretimEmirleri.id, uretimEmriId))
    .limit(1);

  if (!emir?.recete_id) return;

  const [recHeader] = await tx
    .select({ hedef_miktar: receteler.hedef_miktar })
    .from(receteler)
    .where(eq(receteler.id, emir.recete_id))
    .limit(1);

  if (!recHeader) return;
  const targetQty = Number(recHeader.hedef_miktar ?? 1);
  if (targetQty <= 0) return;

  const lines = await tx
    .select()
    .from(receteKalemleri)
    .where(eq(receteKalemleri.recete_id, emir.recete_id));

  for (const line of lines) {
    const rawQty = (Number(line.miktar) / targetQty) * netMiktar;
    if (rawQty <= 0) continue;

    await tx
      .update(urunler)
      .set({ stok: sql`${urunler.stok} - ${rawQty.toFixed(4)}` })
      .where(eq(urunler.id, line.urun_id));

    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: line.urun_id,
      hareket_tipi: 'cikis',
      referans_tipi: 'uretim',
      referans_id: uretimEmriId,
      miktar: rawQty.toFixed(4),
      aciklama: `Üretim hammadde sarfı (Emir: ${uretimEmriId})`,
      created_by_user_id: operatorUserId,
    });
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + (minutes * 60_000));
}

type SevkiyatKalemInsert = {
  musteriId: string;
  siparisId: string | null;
  siparisKalemId: string | null;
  urunId: string;
  miktar: number;
  birim: string;
};

async function autoAllocateShipmentOrderLines(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  line: SevkiyatBody['kalemler'][number],
): Promise<SevkiyatKalemInsert[]> {
  const candidates = await tx
    .select({
      siparisId: satisSiparisleri.id,
      siparisKalemId: siparisKalemleri.id,
      miktar: siparisKalemleri.miktar,
      siparisTarihi: satisSiparisleri.siparis_tarihi,
      sira: siparisKalemleri.sira,
    })
    .from(siparisKalemleri)
    .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
    .where(
      and(
        eq(satisSiparisleri.musteri_id, line.musteriId),
        eq(siparisKalemleri.urun_id, line.urunId),
        inArray(satisSiparisleri.durum, ['taslak', 'planlandi', 'onaylandi', 'uretimde', 'kismen_sevk']),
        eq(satisSiparisleri.is_active, 1),
      ),
    )
    .orderBy(asc(satisSiparisleri.siparis_tarihi), asc(siparisKalemleri.sira));

  if (candidates.length === 0) {
    return [{
      musteriId: line.musteriId,
      siparisId: line.siparisId ?? null,
      siparisKalemId: line.siparisKalemId ?? null,
      urunId: line.urunId,
      miktar: line.miktar,
      birim: line.birim,
    }];
  }

  const candidateKalemIds = candidates.map((candidate) => candidate.siparisKalemId);
  const shippedRows = candidateKalemIds.length
    ? await tx
        .select({
          siparisKalemId: sevkiyatKalemleri.siparis_kalem_id,
          toplam: sql<string>`coalesce(sum(${sevkiyatKalemleri.miktar}), 0)`,
        })
        .from(sevkiyatKalemleri)
        .where(inArray(sevkiyatKalemleri.siparis_kalem_id, candidateKalemIds))
        .groupBy(sevkiyatKalemleri.siparis_kalem_id)
    : [];

  const shippedMap = new Map(shippedRows.map((row) => [row.siparisKalemId ?? '', Number(row.toplam ?? 0)]));
  const allocations: SevkiyatKalemInsert[] = [];
  let remaining = line.miktar;

  for (const candidate of candidates) {
    if (remaining <= 0) break;
    const shipped = shippedMap.get(candidate.siparisKalemId) ?? 0;
    const orderRemaining = Math.max(Number(candidate.miktar ?? 0) - shipped, 0);
    if (orderRemaining <= 0) continue;

    const allocated = Math.min(orderRemaining, remaining);
    allocations.push({
      musteriId: line.musteriId,
      siparisId: candidate.siparisId,
      siparisKalemId: candidate.siparisKalemId,
      urunId: line.urunId,
      miktar: allocated,
      birim: line.birim,
    });
    remaining -= allocated;
  }

  if (remaining > 0 || allocations.length === 0) {
    allocations.push({
      musteriId: line.musteriId,
      siparisId: line.siparisId ?? null,
      siparisKalemId: line.siparisKalemId ?? null,
      urunId: line.urunId,
      miktar: remaining > 0 ? remaining : line.miktar,
      birim: line.birim,
    });
  }

  return allocations;
}

async function refreshShipmentOrderStatuses(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  orderIds: string[],
): Promise<void> {
  const uniqueOrderIds = Array.from(new Set(orderIds.filter(Boolean)));
  if (uniqueOrderIds.length === 0) return;

  for (const orderId of uniqueOrderIds) {
    const orderLines = await tx
      .select({
        id: siparisKalemleri.id,
        miktar: siparisKalemleri.miktar,
      })
      .from(siparisKalemleri)
      .where(eq(siparisKalemleri.siparis_id, orderId));

    if (orderLines.length === 0) continue;

    const shippedRows = await tx
      .select({
        siparisKalemId: sevkiyatKalemleri.siparis_kalem_id,
        toplam: sql<string>`coalesce(sum(${sevkiyatKalemleri.miktar}), 0)`,
      })
      .from(sevkiyatKalemleri)
      .where(eq(sevkiyatKalemleri.siparis_id, orderId))
      .groupBy(sevkiyatKalemleri.siparis_kalem_id);

    const shippedMap = new Map(shippedRows.map((row) => [row.siparisKalemId ?? '', Number(row.toplam ?? 0)]));
    const allShipped = orderLines.every((line) => (shippedMap.get(line.id) ?? 0) >= Number(line.miktar ?? 0));
    const anyShipped = orderLines.some((line) => (shippedMap.get(line.id) ?? 0) > 0);

    if (!allShipped && !anyShipped) continue;

    await tx
      .update(satisSiparisleri)
      .set({ durum: allShipped ? 'tamamlandi' : 'kismen_sevk' })
      .where(
        and(
          eq(satisSiparisleri.id, orderId),
          sql`${satisSiparisleri.durum} NOT IN ('kapali', 'iptal')`,
        ),
      );
  }
}

// ============================================================
// Makine Kuyrugu DTO (join sonucu)
// ============================================================

export type MakineKuyruguDetayDto = {
  id: string;
  makineId: string;
  makineKod: string;
  makineAd: string;
  uretimEmriId: string;
  emirNo: string;
  emirOperasyonId: string | null;
  operasyonAdi: string | null;
  operasyonSira: number | null;
  urunId: string;
  urunKod: string;
  urunAd: string;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
  oncekiUretimToplam: number;
  oncekiFireToplam: number;
  eksikMalzemeler: { urunKod: string; urunAd: string; eksikMiktar: number }[];
};

const toStr = (v: Date | string | null | undefined): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

// ============================================================
// 1) Makine Kuyrugu Listeleme
// ============================================================

export async function repoListMakineKuyrugu(
  query: ListMakineKuyruguQuery,
): Promise<{ items: MakineKuyruguDetayDto[]; total: number }> {
  const conditions = [];
  if (query.makineId) conditions.push(eq(makineKuyrugu.makine_id, query.makineId));
  if (query.durum) conditions.push(eq(makineKuyrugu.durum, query.durum));

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        kq: makineKuyrugu,
        m_kod: makineler.kod,
        m_ad: makineler.ad,
        ue_emir_no: uretimEmirleri.emir_no,
        ue_urun_id: uretimEmirleri.urun_id,
        u_kod: urunler.kod,
        u_ad: urunler.ad,
        op_operasyon_adi: uretimEmriOperasyonlari.operasyon_adi,
        op_sira: uretimEmriOperasyonlari.sira,
        op_planlanan_miktar: uretimEmriOperasyonlari.planlanan_miktar,
        op_uretilen_miktar: uretimEmriOperasyonlari.uretilen_miktar,
        op_fire_miktar: uretimEmriOperasyonlari.fire_miktar,
        op_montaj: uretimEmriOperasyonlari.montaj,
        op_cevrim_suresi_sn: uretimEmriOperasyonlari.cevrim_suresi_sn,
      })
      .from(makineKuyrugu)
      .leftJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
      .leftJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
      .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
      .where(where)
      .orderBy(asc(makineKuyrugu.makine_id), asc(makineKuyrugu.sira))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(makineKuyrugu)
      .where(where),
  ]);

  // Batch query accumulated measurements for active/paused jobs
  const activeOpIds = rows
    .filter((r) => r.kq.durum === 'calisiyor' || r.kq.durum === 'duraklatildi')
    .map((r) => r.kq.emir_operasyon_id ?? r.kq.uretim_emri_id)
    .filter(Boolean) as string[];

  const measurementMap = new Map<string, { uretim: number; fire: number }>();

  if (activeOpIds.length > 0) {
    // Query by emir_operasyon_id where available, else by uretim_emri_id
    const opRows = rows.filter((r) => r.kq.durum === 'calisiyor' || r.kq.durum === 'duraklatildi');
    const withOpId = opRows.filter((r) => r.kq.emir_operasyon_id);
    const withoutOpId = opRows.filter((r) => !r.kq.emir_operasyon_id);

    if (withOpId.length > 0) {
      const opIds = withOpId.map((r) => r.kq.emir_operasyon_id!);
      const totals = await db
        .select({
          key: operatorGunlukKayitlari.emir_operasyon_id,
          uretim: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.ek_uretim_miktari}), 0)`,
          fire: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.fire_miktari}), 0)`,
        })
        .from(operatorGunlukKayitlari)
        .where(inArray(operatorGunlukKayitlari.emir_operasyon_id, opIds))
        .groupBy(operatorGunlukKayitlari.emir_operasyon_id);

      for (const t of totals) {
        if (t.key) measurementMap.set(t.key, { uretim: Number(t.uretim), fire: Number(t.fire) });
      }
    }

    if (withoutOpId.length > 0) {
      const emirIds = withoutOpId.map((r) => r.kq.uretim_emri_id);
      const totals = await db
        .select({
          key: operatorGunlukKayitlari.uretim_emri_id,
          uretim: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.ek_uretim_miktari}), 0)`,
          fire: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.fire_miktari}), 0)`,
        })
        .from(operatorGunlukKayitlari)
        .where(inArray(operatorGunlukKayitlari.uretim_emri_id, emirIds))
        .groupBy(operatorGunlukKayitlari.uretim_emri_id);

      for (const t of totals) {
        if (t.key) measurementMap.set(t.key, { uretim: Number(t.uretim), fire: Number(t.fire) });
      }
    }
  }

  // Toplu hammadde eksiklik kontrolu
  const emirIds = [...new Set(rows.map((r) => r.kq.uretim_emri_id))];
  const eksikMap = new Map<string, { urunKod: string; urunAd: string; eksikMiktar: number }[]>();

  if (emirIds.length > 0) {
    const rezervasyonlar = await db
      .select({
        emirId: hammaddeRezervasyonlari.uretim_emri_id,
        urunId: hammaddeRezervasyonlari.urun_id,
        miktar: hammaddeRezervasyonlari.miktar,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        stok: urunler.stok,
      })
      .from(hammaddeRezervasyonlari)
      .innerJoin(urunler, eq(urunler.id, hammaddeRezervasyonlari.urun_id))
      .where(
        and(
          inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds),
          eq(hammaddeRezervasyonlari.durum, 'rezerve'),
        ),
      );

    for (const rez of rezervasyonlar) {
      const gerekli = Number(rez.miktar);
      const stok = Number(rez.stok);
      if (stok < gerekli) {
        const list = eksikMap.get(rez.emirId) ?? [];
        list.push({
          urunKod: rez.urunKod ?? '',
          urunAd: rez.urunAd ?? '',
          eksikMiktar: Math.round(gerekli - stok),
        });
        eksikMap.set(rez.emirId, list);
      }
    }
  }

  const items: MakineKuyruguDetayDto[] = rows.map((r) => {
    const lookupKey = r.kq.emir_operasyon_id ?? r.kq.uretim_emri_id;
    const prev = measurementMap.get(lookupKey);
    return {
      id: r.kq.id,
      makineId: r.kq.makine_id,
      makineKod: r.m_kod ?? '',
      makineAd: r.m_ad ?? '',
      uretimEmriId: r.kq.uretim_emri_id,
      emirNo: r.ue_emir_no ?? '',
      emirOperasyonId: r.kq.emir_operasyon_id ?? null,
      operasyonAdi: r.op_operasyon_adi ?? null,
      operasyonSira: r.op_sira ?? null,
      urunId: r.ue_urun_id ?? '',
      urunKod: r.u_kod ?? '',
      urunAd: r.u_ad ?? '',
      planlananMiktar: Number(r.op_planlanan_miktar ?? 0),
      uretilenMiktar: Number(r.op_uretilen_miktar ?? 0),
      fireMiktar: Number(r.op_fire_miktar ?? 0),
      montaj: (r.op_montaj ?? 0) === 1,
      sira: r.kq.sira,
      planlananSureDk: r.kq.planlanan_sure_dk,
      hazirlikSuresiDk: r.kq.hazirlik_suresi_dk,
      cevrimSuresiSn: Number(r.op_cevrim_suresi_sn ?? 0),
      planlananBaslangic: toStr(r.kq.planlanan_baslangic),
      planlananBitis: toStr(r.kq.planlanan_bitis),
      gercekBaslangic: toStr(r.kq.gercek_baslangic),
      gercekBitis: toStr(r.kq.gercek_bitis),
      durum: r.kq.durum,
      oncekiUretimToplam: prev?.uretim ?? 0,
      oncekiFireToplam: prev?.fire ?? 0,
      eksikMalzemeler: eksikMap.get(r.kq.uretim_emri_id) ?? [],
    };
  });

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

// ============================================================
// 2) Uretim Baslat
// ============================================================

export async function repoUretimBaslat(
  body: UretimBaslatBody,
  operatorUserId: string | null,
): Promise<MakineKuyruguDetayDto> {
  const now = new Date();

  await db.transaction(async (tx) => {
    // Hedef kuyruk kaydini bul
    const [target] = await tx
      .select({ makine_id: makineKuyrugu.makine_id, durum: makineKuyrugu.durum })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);
    if (!target) throw new Error('kuyruk_kaydi_bulunamadi');
    if (target.durum !== 'bekliyor') throw new Error('sadece_bekliyor_baslatilabilir');

    // Hafta sonu / tatil kontrolu: makine icin bugun calisma plani var mi?
    const calismaDurumu = await isMakineWorkingDay(target.makine_id, now);
    if (!calismaDurumu) {
      throw new Error('makine_bugun_calismiyor');
    }

    await ensureAutomaticShiftForMachine(tx, {
      makineId: target.makine_id,
      operatorUserId,
      now,
    });

    // Ayni makinede zaten calisan veya duraklatilmis is var mi?
    const [activeJob] = await tx
      .select({ id: makineKuyrugu.id })
      .from(makineKuyrugu)
      .where(
        and(
          eq(makineKuyrugu.makine_id, target.makine_id),
          inArray(makineKuyrugu.durum, ['calisiyor', 'duraklatildi']),
        ),
      )
      .limit(1);
    if (activeJob) throw new Error('makinede_aktif_is_var');

    // Update kuyruk -> calisiyor
    await tx
      .update(makineKuyrugu)
      .set({ durum: 'calisiyor', gercek_baslangic: now })
      .where(eq(makineKuyrugu.id, body.makineKuyrukId));

    // Get associated emir_operasyon_id
    const [kqRow] = await tx
      .select({ emir_operasyon_id: makineKuyrugu.emir_operasyon_id, uretim_emri_id: makineKuyrugu.uretim_emri_id })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);

    if (kqRow?.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({ durum: 'calisiyor', gercek_baslangic: now })
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
    }

    // Set parent emir to uretimde if not already
    if (kqRow?.uretim_emri_id) {
      await tx
        .update(uretimEmirleri)
        .set({ durum: 'uretimde', baslangic_tarihi: now })
        .where(
          and(
            eq(uretimEmirleri.id, kqRow.uretim_emri_id),
            eq(uretimEmirleri.durum, 'planlandi'),
          ),
        );
    }

    // Vardiya kaydi (opsiyonel log)
    if (operatorUserId) {
      await tx.insert(operatorGunlukKayitlari).values({
        id: randomUUID(),
        uretim_emri_id: kqRow?.uretim_emri_id ?? '',
        makine_id: target.makine_id,
        emir_operasyon_id: kqRow?.emir_operasyon_id ?? null,
        operator_user_id: operatorUserId,
        gunluk_durum: 'devam_ediyor',
        ek_uretim_miktari: '0.0000',
        fire_miktari: '0.0000',
        net_miktar: '0.0000',
        birim_tipi: 'adet',
        notlar: 'Uretim baslatildi',
        kayit_tarihi: now,
      });
    }
  });

  // Auto-refresh linked sipariş durum (onaylandi/planlandi → uretimde)
  const [kqRef] = await db
    .select({ uretim_emri_id: makineKuyrugu.uretim_emri_id })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, body.makineKuyrukId))
    .limit(1);
  if (kqRef?.uretim_emri_id) {
    // Kalem durumunu uretiliyor yap
    const kalemIds = await getKalemIdsByUretimEmriId(kqRef.uretim_emri_id);
    await transitionMultipleKalemDurum(kalemIds, 'uretiliyor');
    const sids = await getSiparisIdsByUretimEmriId(kqRef.uretim_emri_id);
    for (const sid of sids) await refreshSiparisDurum(sid);
  }

  // Return fresh data
  const { items } = await repoListMakineKuyrugu({ limit: 500, offset: 0, makineId: undefined, durum: undefined });
  const found = items.find((i) => i.id === body.makineKuyrukId);
  if (!found) throw new Error('kuyruk_kaydi_bulunamadi');
  return found;
}

// ============================================================
// 3) Uretim Bitir + Plan Shifting
// ============================================================

export async function repoUretimBitir(
  body: UretimBitirBody,
  operatorUserId: string | null,
): Promise<MakineKuyruguDetayDto & { stokFarki: number }> {
  const now = new Date();
  let stokFarki = 0;
  let tamamlananMakineId = '';

  await db.transaction(async (tx) => {
    // Get queue row
    const [kqRow] = await tx
      .select()
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);
    if (!kqRow) throw new Error('kuyruk_kaydi_bulunamadi');
    tamamlananMakineId = kqRow.makine_id;

    // Update kuyruk -> tamamlandi
    await tx
      .update(makineKuyrugu)
      .set({ durum: 'tamamlandi', gercek_bitis: now })
      .where(eq(makineKuyrugu.id, body.makineKuyrukId));

    // body.uretilenMiktar = gerçek toplam üretim (tüm iş emri boyunca)
    // body.fireMiktar = gerçek toplam fire
    const gercekNet = body.uretilenMiktar - body.fireMiktar;

    // Sum previous incremental stock entries from measurements
    const opFilter = kqRow.emir_operasyon_id
      ? eq(operatorGunlukKayitlari.emir_operasyon_id, kqRow.emir_operasyon_id)
      : eq(operatorGunlukKayitlari.uretim_emri_id, kqRow.uretim_emri_id);

    const [prevTotals] = await tx
      .select({
        onceki_net: sql<string>`COALESCE(SUM(${operatorGunlukKayitlari.net_miktar}), 0)`,
      })
      .from(operatorGunlukKayitlari)
      .where(opFilter);

    const oncekiNet = Number(prevTotals?.onceki_net ?? 0);

    // Difference = what still needs to be added/corrected in stock
    // positive = measurements were short, need to add more
    // negative = measurements were over, need correction
    stokFarki = gercekNet - oncekiNet;

    // Log final günlük kayıt with the correction amount
    await tx.insert(operatorGunlukKayitlari).values({
      id: randomUUID(),
      uretim_emri_id: kqRow.uretim_emri_id,
      makine_id: kqRow.makine_id,
      emir_operasyon_id: kqRow.emir_operasyon_id ?? null,
      operator_user_id: operatorUserId ?? null,
      gunluk_durum: 'tamamlandi',
      ek_uretim_miktari: (body.uretilenMiktar - oncekiNet).toFixed(4),
      fire_miktari: body.fireMiktar.toFixed(4),
      net_miktar: stokFarki.toFixed(4),
      birim_tipi: body.birimTipi,
      notlar: body.notlar ?? null,
      kayit_tarihi: now,
    });

    // OP-10: Determine stock impact upfront — used for both stock update AND parent qty.
    // For dual-sided (çift taraflı) products only the montaj operation affects stock & progress.
    // Single-sided or legacy (no emir_operasyon_id) always affect stock.
    let hasStockImpact = true;
    if (kqRow.emir_operasyon_id && kqRow.uretim_emri_id) {
      const [opCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(uretimEmriOperasyonlari)
        .where(eq(uretimEmriOperasyonlari.uretim_emri_id, kqRow.uretim_emri_id));
      const isSingleSided = Number(opCount?.count ?? 0) <= 1;

      const [opRow] = await tx
        .select({ montaj: uretimEmriOperasyonlari.montaj })
        .from(uretimEmriOperasyonlari)
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id))
        .limit(1);

      hasStockImpact = isSingleSided || (Number(opRow?.montaj ?? 0) === 1);
    }

    // Apply stock correction (reconcile measurements vs actual)
    // Only for montaj or single-sided operations.
    if (stokFarki !== 0 && kqRow.uretim_emri_id && hasStockImpact) {
      const [emirRow] = await tx
        .select({ urun_id: uretimEmirleri.urun_id, recete_id: uretimEmirleri.recete_id })
        .from(uretimEmirleri)
        .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id))
        .limit(1);

      if (emirRow?.urun_id) {
        await tx
          .update(urunler)
          .set({ stok: sql`${urunler.stok} + ${stokFarki.toFixed(4)}` })
          .where(eq(urunler.id, emirRow.urun_id));

        await tx.insert(hareketler).values({
          id: randomUUID(),
          urun_id: emirRow.urun_id,
          hareket_tipi: stokFarki > 0 ? 'giris' : 'cikis',
          referans_tipi: 'uretim',
          referans_id: kqRow.uretim_emri_id,
          miktar: Math.abs(stokFarki).toFixed(4),
          aciklama: stokFarki > 0
            ? `Üretim tamamlandı — ek stok (fark: +${stokFarki.toFixed(0)})`
            : `Üretim tamamlandı — stok düzeltme (fark: ${stokFarki.toFixed(0)})`,
          created_by_user_id: operatorUserId ?? null,
        });

        // Consume raw materials for the delta
        await consumeRecipeMaterials(tx, kqRow.uretim_emri_id, stokFarki, operatorUserId);
      }
    }

    // Update emir operasyonu with final actual totals
    if (kqRow.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({
          uretilen_miktar: body.uretilenMiktar.toFixed(4),
          fire_miktar: body.fireMiktar.toFixed(4),
          durum: 'tamamlandi',
          gercek_bitis: now,
        })
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
    }

    // Update parent emir
    // uretilen_miktar is only updated from the montaj (or single-sided) operation.
    // Non-montaj ops in a dual-sided product don't define the finished quantity.
    // bitis_tarihi and durum are always updated when all ops finish.
    if (kqRow.uretim_emri_id) {
      const pendingOps = await tx
        .select({ count: sql<number>`count(*)` })
        .from(uretimEmriOperasyonlari)
        .where(
          and(
            eq(uretimEmriOperasyonlari.uretim_emri_id, kqRow.uretim_emri_id),
            sql`${uretimEmriOperasyonlari.durum} != 'tamamlandi'`,
          ),
        );

      const remaining = Number(pendingOps[0]?.count ?? 0);

      const emirUpdate: Record<string, unknown> = {};
      if (hasStockImpact) emirUpdate.uretilen_miktar = body.uretilenMiktar.toFixed(4);
      if (remaining <= 0) { emirUpdate.durum = 'tamamlandi'; emirUpdate.bitis_tarihi = now; }

      if (Object.keys(emirUpdate).length > 0) {
        await tx
          .update(uretimEmirleri)
          .set(emirUpdate)
          .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id));
      }
    }

  });

  // Recalc planned dates for all pending jobs on the machine using working hours, tatil, weekends
  if (tamamlananMakineId) {
    await recalcMakineKuyrukTarihleri(tamamlananMakineId);
  }

  // Auto-refresh linked sipariş durum after production complete
  const [kqRef2] = await db
    .select({
      uretim_emri_id: makineKuyrugu.uretim_emri_id,
      emir_operasyon_id: makineKuyrugu.emir_operasyon_id,
    })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, body.makineKuyrukId))
    .limit(1);
  if (kqRef2?.uretim_emri_id) {
    // UE tamamlandi mi? (transaction sonrası taze oku)
    const [emirRow] = await db
      .select({ durum: uretimEmirleri.durum })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, kqRef2.uretim_emri_id))
      .limit(1);
    const isEmirTamamlandi = emirRow?.durum === 'tamamlandi';

    // Cift tarafli uretim kontrolu:
    // montaj operasyonu VEYA tek taraflı VEYA tüm operasyonlar bitti (UE tamamlandi) ise kalem tamamlandi
    let shouldCompleteKalem = isEmirTamamlandi;
    if (!shouldCompleteKalem && kqRef2.emir_operasyon_id) {
      const [op] = await db
        .select({ montaj: uretimEmriOperasyonlari.montaj })
        .from(uretimEmriOperasyonlari)
        .where(eq(uretimEmriOperasyonlari.id, kqRef2.emir_operasyon_id))
        .limit(1);
      const isMontajOp = (op?.montaj ?? 0) === 1;

      // Tek tarafli mi kontrol et
      const [opCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(uretimEmriOperasyonlari)
        .where(eq(uretimEmriOperasyonlari.uretim_emri_id, kqRef2.uretim_emri_id));
      const isSingleSided = Number(opCount?.count ?? 0) <= 1;

      shouldCompleteKalem = isMontajOp || isSingleSided;
    } else if (!shouldCompleteKalem) {
      shouldCompleteKalem = true;
    }

    if (shouldCompleteKalem) {
      const kalemIds = await getKalemIdsByUretimEmriId(kqRef2.uretim_emri_id);
      await transitionMultipleKalemDurum(kalemIds, 'uretim_tamamlandi');
    } else {
      // Çift taraflı üretimde ara operasyon tamamlandı — kalem "uretiliyor" takılı kalmasın.
      // Makine ataması bitti, bir sonraki operasyon için kuyruğa alınmayı bekliyor.
      // VALID_TRANSITIONS bu yönü desteklemez, doğrudan güncelle.
      const kalemIds = await getKalemIdsByUretimEmriId(kqRef2.uretim_emri_id);
      if (kalemIds.length > 0) {
        await db
          .update(siparisKalemleri)
          .set({ uretim_durumu: 'uretime_aktarildi' })
          .where(
            and(
              inArray(siparisKalemleri.id, kalemIds),
              inArray(siparisKalemleri.uretim_durumu, ['uretiliyor', 'duraklatildi']),
            ),
          );
      }
    }

    const sids = await getSiparisIdsByUretimEmriId(kqRef2.uretim_emri_id);
    for (const sid of sids) await refreshSiparisDurum(sid);

    // Yeni mimari: emir operasyonel YM/legacy yarı mamul için ve operasyon montaj=true ise montaj denemesi.
    if (kqRef2.emir_operasyon_id) {
      const [opRow] = await db
        .select({ montaj: uretimEmriOperasyonlari.montaj, urunId: uretimEmirleri.urun_id })
        .from(uretimEmriOperasyonlari)
        .innerJoin(uretimEmirleri, eq(uretimEmirleri.id, uretimEmriOperasyonlari.uretim_emri_id))
        .where(eq(uretimEmriOperasyonlari.id, kqRef2.emir_operasyon_id))
        .limit(1);
      if (opRow?.urunId) {
        const [urunRow] = await db.select({ kategori: urunler.kategori }).from(urunler).where(eq(urunler.id, opRow.urunId)).limit(1);
        if (urunRow?.kategori === 'operasyonel_ym' || urunRow?.kategori === 'yarimamul') {
          if (opRow.montaj === 1) {
            // Montaj makinesinde üretim bitti: montaj denemesi
            await tryMontajForUretimEmri(kqRef2.uretim_emri_id, operatorUserId);
          } else {
            // Stok artan operasyonel YM için bekleyen montajları tara
            await tryPendingMontajlarAfterStokArtis(opRow.urunId, operatorUserId);
          }
        }
      }
    }
  }

  try {
    const summary = await getMakineKuyrukBildirimOzeti(body.makineKuyrukId);
    if (summary) {
      const machineLabel = [summary.makineKod, summary.makineAd].filter(Boolean).join(' - ');
      const productLabel = [summary.urunKod, summary.urunAd].filter(Boolean).join(' - ');
      const operationLabel = summary.operasyonAdi ? ` / ${summary.operasyonAdi}` : '';

      await createAdminNotification({
        title: 'Uretim tamamlandi',
        message: `${machineLabel || 'Makine'} uzerinde ${summary.emirNo || 'uretim emri'} / ${productLabel || 'urun'}${operationLabel} tamamlandi. Gercek uretim ${body.uretilenMiktar} ${body.birimTipi}, fire ${body.fireMiktar}.`,
        type: 'system',
      });
    }
  } catch {
    // Notification failures must not block production completion.
  }

  // Return fresh data
  const result = await repoListMakineKuyrugu({ limit: 500, offset: 0 });
  const found = result.items.find((i) => i.id === body.makineKuyrukId);
  if (!found) throw new Error('kuyruk_kaydi_bulunamadi');
  return { ...found, stokFarki };
}

/**
 * Recalculate planned start/end for all pending/waiting jobs on a machine
 * starting from `now`. Each job's planned start = previous job's planned end.
 * Duration = hazirlik_suresi_dk + planlanan_sure_dk
 */
async function shiftFollowingJobs(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  makineId: string,
  now: Date,
): Promise<void> {
  const pendingJobs = await tx
    .select()
    .from(makineKuyrugu)
    .where(
      and(
        eq(makineKuyrugu.makine_id, makineId),
        sql`${makineKuyrugu.durum} IN ('bekliyor', 'calisiyor', 'duraklatildi')`,
      ),
    )
    .orderBy(asc(makineKuyrugu.sira));

  let cursor = now;

  for (const job of pendingJobs) {
    const totalMinutes = job.hazirlik_suresi_dk + job.planlanan_sure_dk;

    if (job.durum === 'calisiyor' || job.durum === 'duraklatildi') {
      const [durusSummary] = await tx
        .select({
          toplamDurusDk: sql<number>`coalesce(sum(${durusKayitlari.sure_dk}), 0)`,
          acikDurusBaslangic: sql<Date | string | null>`max(case when ${durusKayitlari.bitis} is null then ${durusKayitlari.baslangic} else null end)`,
        })
        .from(durusKayitlari)
        .where(eq(durusKayitlari.makine_kuyruk_id, job.id));

      const aktifReferans = job.durum === 'duraklatildi' && durusSummary?.acikDurusBaslangic
        ? new Date(durusSummary.acikDurusBaslangic)
        : now;
      const gercekBaslangic = job.gercek_baslangic ? new Date(job.gercek_baslangic) : now;
      const calisilanDakika = Math.max(
        0,
        Math.floor((aktifReferans.getTime() - gercekBaslangic.getTime()) / 60_000) - Number(durusSummary?.toplamDurusDk ?? 0),
      );
      const kalanDakika = Math.max(totalMinutes - calisilanDakika, 0);
      const yeniPlanlananBitis = addMinutes(now, kalanDakika);

      await tx
        .update(makineKuyrugu)
        .set({
          planlanan_bitis: yeniPlanlananBitis,
        })
        .where(eq(makineKuyrugu.id, job.id));

      if (job.emir_operasyon_id) {
        await tx
          .update(uretimEmriOperasyonlari)
          .set({
            planlanan_bitis: yeniPlanlananBitis,
          })
          .where(eq(uretimEmriOperasyonlari.id, job.emir_operasyon_id));
      }

      cursor = yeniPlanlananBitis;
      continue;
    }

    const endTime = addMinutes(cursor, totalMinutes);

    await tx
      .update(makineKuyrugu)
      .set({
        planlanan_baslangic: cursor,
        planlanan_bitis: endTime,
      })
      .where(eq(makineKuyrugu.id, job.id));

    // Also update the linked operasyon
    if (job.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({
          planlanan_baslangic: cursor,
          planlanan_bitis: endTime,
        })
        .where(eq(uretimEmriOperasyonlari.id, job.emir_operasyon_id));
    }

    cursor = endTime;
  }
}

async function findActiveMachineJob(
  tx: DbTransaction,
  makineId: string,
): Promise<{
  id: string;
  makine_id: string;
  emir_operasyon_id: string | null;
  uretim_emri_id: string;
  durum: string;
} | null> {
  const [job] = await tx
    .select({
      id: makineKuyrugu.id,
      makine_id: makineKuyrugu.makine_id,
      emir_operasyon_id: makineKuyrugu.emir_operasyon_id,
      uretim_emri_id: makineKuyrugu.uretim_emri_id,
      durum: makineKuyrugu.durum,
    })
    .from(makineKuyrugu)
    .where(
      and(
        eq(makineKuyrugu.makine_id, makineId),
        inArray(makineKuyrugu.durum, ['calisiyor', 'duraklatildi']),
      ),
    )
    .orderBy(
      sql`case when ${makineKuyrugu.durum} = 'calisiyor' then 0 else 1 end`,
      asc(makineKuyrugu.sira),
    )
    .limit(1);

  return job ?? null;
}

async function hasIncrementalStockImpact(
  tx: DbTransaction,
  kqRow: {
    emir_operasyon_id: string | null;
    uretim_emri_id: string;
  },
): Promise<boolean> {
  if (kqRow.emir_operasyon_id) {
    const [opCount] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.uretim_emri_id, kqRow.uretim_emri_id));

    const isSingleSided = Number(opCount?.count ?? 0) <= 1;
    const [opRow] = await tx
      .select({ montaj: uretimEmriOperasyonlari.montaj })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id))
      .limit(1);

    return isSingleSided || (Number(opRow?.montaj ?? 0) === 1);
  }

  return true;
}

async function recordIncrementalProductionEntry(
  tx: DbTransaction,
  {
    kqRow,
    operatorUserId,
    uretilenMiktar,
    fireMiktar,
    birimTipi,
    notlar,
    gunlukDurum = 'devam_ediyor',
  }: {
    kqRow: {
      makine_id: string;
      emir_operasyon_id: string | null;
      uretim_emri_id: string;
    };
    operatorUserId: string | null;
    uretilenMiktar: number;
    fireMiktar: number;
    birimTipi: 'adet' | 'takim';
    notlar?: string | null;
    gunlukDurum?: 'devam_ediyor' | 'yarim_kaldi' | 'tamamlandi';
  },
): Promise<OperatorGunlukGirisDto | null> {
  if (uretilenMiktar <= 0) return null;

  const netMiktar = uretilenMiktar - fireMiktar;
  const kayitId = randomUUID();

  await tx.insert(operatorGunlukKayitlari).values({
    id: kayitId,
    uretim_emri_id: kqRow.uretim_emri_id,
    makine_id: kqRow.makine_id,
    emir_operasyon_id: kqRow.emir_operasyon_id ?? null,
    operator_user_id: operatorUserId ?? null,
    gunluk_durum: gunlukDurum,
    ek_uretim_miktari: uretilenMiktar.toFixed(4),
    fire_miktari: fireMiktar.toFixed(4),
    net_miktar: netMiktar.toFixed(4),
    birim_tipi: birimTipi,
    notlar: notlar ?? null,
    kayit_tarihi: new Date(),
  });

  if (kqRow.emir_operasyon_id) {
    await tx
      .update(uretimEmriOperasyonlari)
      .set({
        uretilen_miktar: sql`${uretimEmriOperasyonlari.uretilen_miktar} + ${netMiktar.toFixed(4)}`,
      })
      .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
  }

  await tx
    .update(uretimEmirleri)
    .set({
      uretilen_miktar: sql`${uretimEmirleri.uretilen_miktar} + ${netMiktar.toFixed(4)}`,
    })
    .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id));

  if (netMiktar > 0 && await hasIncrementalStockImpact(tx, kqRow)) {
    const [emirRow] = await tx
      .select({ urun_id: uretimEmirleri.urun_id })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id))
      .limit(1);

    if (emirRow) {
      await tx
        .update(urunler)
        .set({ stok: sql`${urunler.stok} + ${netMiktar.toFixed(4)}` })
        .where(eq(urunler.id, emirRow.urun_id));

      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: emirRow.urun_id,
        hareket_tipi: 'giris',
        referans_tipi: 'uretim',
        referans_id: kqRow.uretim_emri_id,
        miktar: netMiktar.toFixed(4),
        aciklama: gunlukDurum === 'yarim_kaldi'
          ? 'Günlük üretim girişi'
          : 'Artımlı üretim kaydı',
        created_by_user_id: operatorUserId ?? null,
      });

      await consumeRecipeMaterials(tx, kqRow.uretim_emri_id, netMiktar, operatorUserId);
    }
  }

  const [row] = await tx
    .select()
    .from(operatorGunlukKayitlari)
    .where(eq(operatorGunlukKayitlari.id, kayitId))
    .limit(1);

  return row ? rowToGunlukGirisDto(row) : null;
}

async function getMakineKuyrukBildirimOzeti(
  makineKuyrukId: string,
): Promise<MakineKuyrukBildirimOzeti | null> {
  const [row] = await db
    .select({
      emirNo: uretimEmirleri.emir_no,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
    })
    .from(makineKuyrugu)
    .leftJoin(makineler, eq(makineler.id, makineKuyrugu.makine_id))
    .leftJoin(uretimEmirleri, eq(uretimEmirleri.id, makineKuyrugu.uretim_emri_id))
    .leftJoin(urunler, eq(urunler.id, uretimEmirleri.urun_id))
    .leftJoin(
      uretimEmriOperasyonlari,
      eq(uretimEmriOperasyonlari.id, makineKuyrugu.emir_operasyon_id),
    )
    .where(eq(makineKuyrugu.id, makineKuyrukId))
    .limit(1);

  return row ?? null;
}

// ============================================================
// 4) Duraklat / Devam Et
// ============================================================

export async function repoDuraklat(
  body: DuraklatBody,
  operatorUserId: string | null,
): Promise<{ success: boolean }> {
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(makineKuyrugu)
      .set({ durum: 'duraklatildi' })
      .where(eq(makineKuyrugu.id, body.makineKuyrukId));

    const [kqRow] = await tx
      .select({
        makine_id: makineKuyrugu.makine_id,
        emir_operasyon_id: makineKuyrugu.emir_operasyon_id,
        uretim_emri_id: makineKuyrugu.uretim_emri_id,
      })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);

    if (kqRow?.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({ durum: 'duraklatildi' })
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
    }

    await tx.insert(durusKayitlari).values({
      id: randomUUID(),
      makine_id: kqRow?.makine_id ?? '',
      makine_kuyruk_id: body.makineKuyrukId,
      operator_user_id: operatorUserId ?? null,
      durus_nedeni_id: body.durusNedeniId,
      durus_tipi: 'durus',
      neden: body.neden,
      anlik_uretim_miktari: body.anlikUretimMiktari !== undefined ? body.anlikUretimMiktari.toFixed(4) : null,
      baslangic: now,
    });
  });

  // Kalem durumunu duraklatildi yap
  const [kqRefD] = await db
    .select({ uretim_emri_id: makineKuyrugu.uretim_emri_id })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, body.makineKuyrukId))
    .limit(1);
  if (kqRefD?.uretim_emri_id) {
    const kalemIds = await getKalemIdsByUretimEmriId(kqRefD.uretim_emri_id);
    await transitionMultipleKalemDurum(kalemIds, 'duraklatildi');
  }

  return { success: true };
}

export async function repoDevamEt(
  body: DevamEtBody,
  operatorUserId: string | null,
): Promise<{ success: boolean }> {
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(makineKuyrugu)
      .set({ durum: 'calisiyor' })
      .where(eq(makineKuyrugu.id, body.makineKuyrukId));

    const [kqRow] = await tx
      .select({
        makine_id: makineKuyrugu.makine_id,
        emir_operasyon_id: makineKuyrugu.emir_operasyon_id,
        uretim_emri_id: makineKuyrugu.uretim_emri_id,
      })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);

    if (kqRow?.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({ durum: 'calisiyor' })
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
    }

    // Close open durus record
    await tx
      .update(durusKayitlari)
      .set({
        bitis: now,
        sure_dk: sql<number>`TIMESTAMPDIFF(MINUTE, ${durusKayitlari.baslangic}, ${now.toISOString().replace('T', ' ').slice(0, 19)})`,
      })
      .where(
        and(
          eq(durusKayitlari.makine_kuyruk_id, body.makineKuyrukId),
          sql`${durusKayitlari.bitis} IS NULL`,
        ),
      );

    // Log incremental production during downtime + update stock
    if (body.uretilenMiktar !== undefined && body.uretilenMiktar > 0 && kqRow) {
      await recordIncrementalProductionEntry(tx, {
        kqRow,
        operatorUserId,
        uretilenMiktar: body.uretilenMiktar,
        fireMiktar: body.fireMiktar,
        birimTipi: body.birimTipi,
        notlar: body.notlar ?? 'Duruş sonu artımlı üretim kaydı',
        gunlukDurum: 'devam_ediyor',
      });
    }

    // Restore machine status if it was arizali
    if (kqRow?.makine_id) {
      await tx
        .update(makineler)
        .set({ durum: 'aktif' })
        .where(
          and(
            eq(makineler.id, kqRow.makine_id),
            eq(makineler.durum, 'arizali'),
          ),
        );
    }

    // Shift plans since downtime changes timeline
    await shiftFollowingJobs(tx, kqRow?.makine_id ?? '', now);
  });

  // Kalem durumunu uretiliyor'a geri al (duraklama bitti)
  const [kqRefR] = await db
    .select({ uretim_emri_id: makineKuyrugu.uretim_emri_id })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, body.makineKuyrukId))
    .limit(1);
  if (kqRefR?.uretim_emri_id) {
    const kalemIds = await getKalemIdsByUretimEmriId(kqRefR.uretim_emri_id);
    await transitionMultipleKalemDurum(kalemIds, 'uretiliyor');
  }

  return { success: true };
}

// ============================================================
// 5) Vardiya Basi / Sonu
// ============================================================

export async function repoVardiyaBasi(
  body: VardiyaBasiBody,
  operatorUserId: string | null,
): Promise<VardiyaKayitDto> {
  const now = new Date();
  const row = await db.transaction(async (tx) => ensureAutomaticShiftForMachine(tx, {
    makineId: body.makineId,
    operatorUserId: operatorUserId ?? null,
    now,
    preferredVardiyaTipi: body.vardiyaTipi,
    notlar: body.notlar ?? null,
    strictNoExisting: true,
  }));
  return vardiyaRowToDto(row);
}

export async function repoVardiyaSonu(
  body: VardiyaSonuBody,
  operatorUserId: string | null,
): Promise<VardiyaKayitDto | null> {
  const now = new Date();

  // Find open vardiya for this machine
  const [openVardiya] = await db
    .select()
    .from(vardiyaKayitlari)
    .where(
      and(
        eq(vardiyaKayitlari.makine_id, body.makineId),
        sql`${vardiyaKayitlari.bitis} IS NULL`,
      ),
    )
    .orderBy(desc(vardiyaKayitlari.baslangic))
    .limit(1);

  if (!openVardiya) return null;

  await db
    .update(vardiyaKayitlari)
    .set({ bitis: now })
    .where(eq(vardiyaKayitlari.id, openVardiya.id));

  // Log incremental production at shift end + update stock
  if (body.uretilenMiktar !== undefined && body.uretilenMiktar > 0) {
    await db.transaction(async (tx) => {
      const runningJob = await findActiveMachineJob(tx, body.makineId);
      if (!runningJob) return;

      await recordIncrementalProductionEntry(tx, {
        kqRow: runningJob,
        operatorUserId,
        uretilenMiktar: body.uretilenMiktar ?? 0,
        fireMiktar: body.fireMiktar,
        birimTipi: body.birimTipi,
        notlar: body.notlar ?? 'Vardiya sonu günlük üretim girişi',
        gunlukDurum: 'yarim_kaldi',
      });
    });
  }

  const [updated] = await db.select().from(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, openVardiya.id)).limit(1);
  return vardiyaRowToDto(updated);
}

export async function repoGunlukUretimGir(
  body: GunlukUretimBody,
  operatorUserId: string | null,
): Promise<OperatorGunlukGirisDto> {
  const now = new Date();

  const kayit = await db.transaction(async (tx) => {
    await ensureAutomaticShiftForMachine(tx, {
      makineId: body.makineId,
      operatorUserId,
      now,
    });

    const activeJob = await findActiveMachineJob(tx, body.makineId);
    if (!activeJob) throw new Error('aktif_uretim_bulunamadi');

    return recordIncrementalProductionEntry(tx, {
      kqRow: activeJob,
      operatorUserId,
      uretilenMiktar: body.uretilenMiktar,
      fireMiktar: body.fireMiktar,
      birimTipi: body.birimTipi,
      notlar: body.notlar ?? 'Vardiya sonu günlük üretim girişi',
      gunlukDurum: 'yarim_kaldi',
    });
  });

  if (!kayit) throw new Error('gunluk_kayit_olusturulamadi');

  try {
    const [activeQueue] = await db
      .select({ id: makineKuyrugu.id })
      .from(makineKuyrugu)
      .where(
        and(
          eq(makineKuyrugu.makine_id, body.makineId),
          inArray(makineKuyrugu.durum, ['calisiyor', 'duraklatildi']),
        ),
      )
      .orderBy(
        sql`case when ${makineKuyrugu.durum} = 'calisiyor' then 0 else 1 end`,
        asc(makineKuyrugu.sira),
      )
      .limit(1);

    const summary = activeQueue
      ? await getMakineKuyrukBildirimOzeti(activeQueue.id)
      : null;
    if (summary) {
      const machineLabel = [summary.makineKod, summary.makineAd].filter(Boolean).join(' - ');
      const productLabel = [summary.urunKod, summary.urunAd].filter(Boolean).join(' - ');
      const operationLabel = summary.operasyonAdi ? ` / ${summary.operasyonAdi}` : '';

      await createAdminNotification({
        title: 'Gunluk uretim girisi alindi',
        message: `${machineLabel || 'Makine'} uzerinde ${productLabel || 'urun'}${operationLabel} icin ${body.uretilenMiktar} ${body.birimTipi} uretim ve ${body.fireMiktar} fire girildi.`,
        type: 'system',
      });
    }
  } catch {
    // Notification failures must not block production tracking.
  }

  return kayit;
}

// ============================================================
// 5b) Acik Vardiya Durumu — makine bazli
// ============================================================

export type AcikVardiyaDto = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  acikVardiyaId: string | null;
  vardiyaTipi: string | null;
  baslangic: Date | null;
};

export async function repoGetAcikVardiyalar(): Promise<AcikVardiyaDto[]> {
  const now = new Date();

  const targetMachines = await db
    .select({
      makineId: makineler.id,
    })
    .from(makineler)
    .where(
      and(
        eq(makineler.is_active, 1),
        eq(makineler.durum, 'aktif'),
        sql`EXISTS (
          SELECT 1 FROM makine_kuyrugu mk
          WHERE mk.makine_id = ${makineler.id}
            AND mk.durum IN ('bekliyor', 'calisiyor', 'duraklatildi')
        )`,
      ),
    )
    .orderBy(asc(makineler.kod));

  for (const machine of targetMachines) {
    try {
      await db.transaction(async (tx) => {
        await ensureAutomaticShiftForMachine(tx, {
          makineId: machine.makineId,
          operatorUserId: null,
          now,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'makine_bugun_calismiyor' || message === 'vardiya_tanimi_bulunamadi') {
        continue;
      }
      throw error;
    }
  }

  // Sadece kuyrukta bekliyor/devam_ediyor is emri olan makineleri getir
  const rows = await db
    .select({
      makineId: makineler.id,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
      acikVardiyaId: vardiyaKayitlari.id,
      vardiyaTipi: vardiyaKayitlari.vardiya_tipi,
      baslangic: vardiyaKayitlari.baslangic,
    })
    .from(makineler)
    .leftJoin(
      vardiyaKayitlari,
      and(
        eq(vardiyaKayitlari.makine_id, makineler.id),
        sql`${vardiyaKayitlari.bitis} IS NULL`,
      ),
    )
    .where(
      and(
        eq(makineler.is_active, 1),
        eq(makineler.durum, 'aktif'),
        sql`EXISTS (
          SELECT 1 FROM makine_kuyrugu mk
          WHERE mk.makine_id = ${makineler.id}
            AND mk.durum IN ('bekliyor', 'calisiyor', 'duraklatildi')
        )`,
      ),
    )
    .orderBy(asc(makineler.kod));

  return rows.map((r) => ({
    makineId: r.makineId,
    makineKod: r.makineKod,
    makineAd: r.makineAd,
    acikVardiyaId: r.acikVardiyaId ?? null,
    vardiyaTipi: r.vardiyaTipi ?? null,
    baslangic: r.baslangic ?? null,
  }));
}

// ============================================================
// 6) Sevkiyat
// ============================================================

export async function repoSevkiyatOlustur(
  body: SevkiyatBody,
  operatorUserId: string | null,
): Promise<{ sevkiyat: SevkiyatDto; kalemler: SevkiyatKalemDto[] }> {
  const sevkiyatId = randomUUID();
  const now = new Date();
  const sevkNo = `SVK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${randomUUID().slice(0, 6).toUpperCase()}`;

  await db.transaction(async (tx) => {
    const touchedOrderIds = new Set<string>();
    const musteriIds = Array.from(new Set(body.kalemler.map((kalem) => kalem.musteriId)));
    const musteriRows = musteriIds.length
      ? await tx
          .select({
            id: musteriler.id,
            ad: musteriler.ad,
            sevkiyatNotu: musteriler.sevkiyat_notu,
          })
          .from(musteriler)
          .where(inArray(musteriler.id, musteriIds))
      : [];

    const otomatikNotlar = musteriRows
      .filter((row) => row.sevkiyatNotu && row.sevkiyatNotu.trim().length > 0)
      .map((row) => `${row.ad}: ${row.sevkiyatNotu?.trim()}`);

    const birlesikNotlar = [body.notlar?.trim(), ...otomatikNotlar]
      .filter((note): note is string => !!note && note.length > 0)
      .join('\n');

    await tx.insert(sevkiyatlar).values({
      id: sevkiyatId,
      sevk_no: sevkNo,
      operator_user_id: operatorUserId ?? null,
      sevk_tarihi: now,
      notlar: birlesikNotlar || null,
    });

    for (const kalem of body.kalemler) {
      const allocations = await autoAllocateShipmentOrderLines(tx, kalem);
      const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.miktar, 0);

      for (const allocation of allocations) {
        await tx.insert(sevkiyatKalemleri).values({
          id: randomUUID(),
          sevkiyat_id: sevkiyatId,
          musteri_id: allocation.musteriId,
          siparis_id: allocation.siparisId,
          siparis_kalem_id: allocation.siparisKalemId,
          urun_id: allocation.urunId,
          miktar: allocation.miktar.toFixed(4),
          birim: allocation.birim,
        });

        if (allocation.siparisId) {
          touchedOrderIds.add(allocation.siparisId);
        }
      }

      await tx
        .update(urunler)
        .set({ stok: sql`${urunler.stok} - ${totalAllocated.toFixed(4)}` })
        .where(eq(urunler.id, kalem.urunId));

      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: kalem.urunId,
        hareket_tipi: 'cikis',
        referans_tipi: 'sevkiyat',
        referans_id: sevkiyatId,
        miktar: totalAllocated.toFixed(4),
        aciklama: `Sevkiyat: ${sevkNo}`,
        created_by_user_id: operatorUserId ?? null,
      });
    }

    await refreshShipmentOrderStatuses(tx, Array.from(touchedOrderIds));
  });

  // Return result
  const [sevkRow] = await db.select().from(sevkiyatlar).where(eq(sevkiyatlar.id, sevkiyatId)).limit(1);
  const kalemRows = await db.select().from(sevkiyatKalemleri).where(eq(sevkiyatKalemleri.sevkiyat_id, sevkiyatId));

  return {
    sevkiyat: sevkiyatRowToDto(sevkRow),
    kalemler: kalemRows.map(sevkiyatKalemRowToDto),
  };
}

// ============================================================
// 7) Mal Kabul
// ============================================================

export async function repoMalKabul(
  body: MalKabulBody,
  operatorUserId: string | null,
): Promise<MalKabulDto> {
  const result = await malKabulRepoCreate(
    {
      kaynakTipi: 'satin_alma',
      satinAlmaSiparisId: body.satinAlmaSiparisId,
      satinAlmaKalemId: body.satinAlmaKalemId,
      urunId: body.urunId,
      gelenMiktar: body.gelenMiktar,
      notlar: body.notlar,
      kaliteDurumu: 'kabul',
    },
    operatorUserId,
  );
  return {
    id: result.id,
    kaynakTipi: result.kaynakTipi,
    satinAlmaSiparisId: result.satinAlmaSiparisId,
    satinAlmaKalemId: result.satinAlmaKalemId,
    urunId: result.urunId,
    gelenMiktar: result.gelenMiktar,
    operatorUserId: result.operatorUserId,
    kabulTarihi: typeof result.kabulTarihi === 'string' ? result.kabulTarihi : (result.kabulTarihi as Date).toISOString(),
    notlar: result.notlar,
  };
}

// ============================================================
// 8) Gunluk Girisler + Durus Listesi
// ============================================================

export async function repoListGunlukGirisler(
  query: ListGunlukGirislerQuery,
): Promise<{ items: OperatorGunlukGirisDto[]; total: number }> {
  const conditions: SQL[] = [];
  if (query.dateFrom) {
    conditions.push(gte(operatorGunlukKayitlari.kayit_tarihi, new Date(`${query.dateFrom}T00:00:00`)));
  }
  if (query.dateTo) {
    conditions.push(lte(operatorGunlukKayitlari.kayit_tarihi, new Date(`${query.dateTo}T23:59:59`)));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(operatorGunlukKayitlari)
      .where(where)
      .orderBy(desc(operatorGunlukKayitlari.kayit_tarihi), desc(operatorGunlukKayitlari.created_at))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(operatorGunlukKayitlari).where(where),
  ]);

  return {
    items: rows.map(rowToGunlukGirisDto),
    total: Number(countResult[0]?.count ?? 0),
  };
}

export async function repoListDuruslar(
  makineId?: string,
  limit = 50,
  offset = 0,
): Promise<{ items: DurusKayitDto[]; total: number }> {
  const where = makineId ? eq(durusKayitlari.makine_id, makineId) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(durusKayitlari)
      .where(where)
      .orderBy(desc(durusKayitlari.baslangic))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(durusKayitlari).where(where),
  ]);

  return {
    items: rows.map(durusRowToDto),
    total: Number(countResult[0]?.count ?? 0),
  };
}
