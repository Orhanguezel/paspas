import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler, makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';
import { hareketler } from '@/modules/hareketler/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { satinAlmaKalemleri, satinAlmaSiparisleri } from '@/modules/satin_alma/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';

import {
  durusKayitlari,
  malKabulKayitlari,
  operatorGunlukKayitlari,
  sevkiyatKalemleri,
  sevkiyatlar,
  vardiyaKayitlari,
  durusRowToDto,
  malKabulRowToDto,
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
  VardiyaSonuBody,
} from './validation';

const VARDIYA_SAATLERI = {
  gunduz: { baslangic: '07:30', bitis: '19:30' },
  gece: { baslangic: '19:30', bitis: '07:30' },
} as const;

function parseClockToMinutes(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  return (hour * 60) + minute;
}

function getCurrentMinutes(now: Date): number {
  return (now.getHours() * 60) + now.getMinutes();
}

function isShiftTimeValid(now: Date, vardiyaTipi: 'gunduz' | 'gece'): boolean {
  const currentMinutes = getCurrentMinutes(now);
  const baslangic = parseClockToMinutes(VARDIYA_SAATLERI[vardiyaTipi].baslangic);
  const bitis = parseClockToMinutes(VARDIYA_SAATLERI[vardiyaTipi].bitis);
  if (vardiyaTipi === 'gunduz') {
    return currentMinutes >= baslangic && currentMinutes < bitis;
  }
  return currentMinutes >= baslangic || currentMinutes < bitis;
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

  const items: MakineKuyruguDetayDto[] = rows.map((r) => ({
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
  }));

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
        makine_id: null,
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

  // Return fresh data
  const { items } = await repoListMakineKuyrugu({ limit: 1, offset: 0, makineId: undefined, durum: undefined });
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
): Promise<MakineKuyruguDetayDto> {
  const now = new Date();

  await db.transaction(async (tx) => {
    // Get queue row
    const [kqRow] = await tx
      .select()
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.id, body.makineKuyrukId))
      .limit(1);
    if (!kqRow) throw new Error('kuyruk_kaydi_bulunamadi');

    // Update kuyruk -> tamamlandi
    await tx
      .update(makineKuyrugu)
      .set({ durum: 'tamamlandi', gercek_bitis: now })
      .where(eq(makineKuyrugu.id, body.makineKuyrukId));

    // Update emir operasyonu
    if (kqRow.emir_operasyon_id) {
      const uretilenStr = body.uretilenMiktar.toFixed(4);
      const fireStr = body.fireMiktar.toFixed(4);

      await tx
        .update(uretimEmriOperasyonlari)
        .set({
          uretilen_miktar: uretilenStr,
          fire_miktar: fireStr,
          durum: 'tamamlandi',
          gercek_bitis: now,
        })
        .where(eq(uretimEmriOperasyonlari.id, kqRow.emir_operasyon_id));
    }

    // Update parent emir uretilen_miktar
    // (siparis seviyesinde son operasyon tamamlandiysa emri tamamla)
    if (kqRow.uretim_emri_id) {
      // Check if all operasyonlar for this emir are done
      const pendingOps = await tx
        .select({ count: sql<number>`count(*)` })
        .from(uretimEmriOperasyonlari)
        .where(
          and(
            eq(uretimEmriOperasyonlari.uretim_emri_id, kqRow.uretim_emri_id),
            sql`${uretimEmriOperasyonlari.durum} != 'tamamlandi'`,
          ),
        );

      // -1 because current op hasn't been committed yet in the same tx read
      const remaining = Number(pendingOps[0]?.count ?? 0);

      if (remaining <= 0) {
        await tx
          .update(uretimEmirleri)
          .set({
            uretilen_miktar: body.uretilenMiktar.toFixed(4),
            durum: 'tamamlandi',
            bitis_tarihi: now,
          })
          .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id));
      } else {
        // Partially update emir uretilen
        await tx
          .update(uretimEmirleri)
          .set({ uretilen_miktar: body.uretilenMiktar.toFixed(4) })
          .where(eq(uretimEmirleri.id, kqRow.uretim_emri_id));
      }
    }

    // Log gunluk kayit
    await tx.insert(operatorGunlukKayitlari).values({
      id: randomUUID(),
      uretim_emri_id: kqRow.uretim_emri_id,
      makine_id: kqRow.makine_id,
      emir_operasyon_id: kqRow.emir_operasyon_id ?? null,
      operator_user_id: operatorUserId ?? null,
      gunluk_durum: 'tamamlandi',
      ek_uretim_miktari: body.uretilenMiktar.toFixed(4),
      fire_miktari: body.fireMiktar.toFixed(4),
      net_miktar: (body.uretilenMiktar - body.fireMiktar).toFixed(4),
      birim_tipi: body.birimTipi,
      notlar: body.notlar ?? null,
      kayit_tarihi: now,
    });

    // Shift following jobs on same machine
    await shiftFollowingJobs(tx, kqRow.makine_id, now);
  });

  // Return fresh data
  const result = await repoListMakineKuyrugu({ limit: 1, offset: 0 });
  const found = result.items.find((i) => i.id === body.makineKuyrukId);
  if (!found) throw new Error('kuyruk_kaydi_bulunamadi');
  return found;
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
      .select({ makine_id: makineKuyrugu.makine_id, emir_operasyon_id: makineKuyrugu.emir_operasyon_id })
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
      durus_tipi: body.makineArizasi ? 'ariza' : 'durus',
      neden: body.neden,
      baslangic: now,
    });

    // If machine failure, update machine status
    if (body.makineArizasi && kqRow?.makine_id) {
      await tx
        .update(makineler)
        .set({ durum: 'arizali' })
        .where(eq(makineler.id, kqRow.makine_id));
    }
  });

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
      .select({ makine_id: makineKuyrugu.makine_id, emir_operasyon_id: makineKuyrugu.emir_operasyon_id })
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

  return { success: true };
}

// ============================================================
// 5) Vardiya Basi / Sonu
// ============================================================

export async function repoVardiyaBasi(
  body: VardiyaBasiBody,
  operatorUserId: string | null,
): Promise<VardiyaKayitDto> {
  const id = randomUUID();
  const now = new Date();

  if (!isShiftTimeValid(now, body.vardiyaTipi)) {
    throw new Error('vardiya_saati_gecersiz');
  }

  const [openShift] = await db
    .select({ id: vardiyaKayitlari.id })
    .from(vardiyaKayitlari)
    .where(
      and(
        eq(vardiyaKayitlari.makine_id, body.makineId),
        sql`${vardiyaKayitlari.bitis} IS NULL`,
      ),
    )
    .limit(1);

  if (openShift) {
    throw new Error('acik_vardiya_zaten_var');
  }

  await db.insert(vardiyaKayitlari).values({
    id,
    makine_id: body.makineId,
    operator_user_id: operatorUserId ?? null,
    vardiya_tipi: body.vardiyaTipi,
    baslangic: now,
    notlar: body.notlar ?? null,
  });

  const [row] = await db.select().from(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, id)).limit(1);
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

  // If production amounts provided, log them
  if (body.uretilenMiktar !== undefined && body.uretilenMiktar > 0) {
    // Find current running job on this machine
    const [runningJob] = await db
      .select()
      .from(makineKuyrugu)
      .where(
        and(
          eq(makineKuyrugu.makine_id, body.makineId),
          eq(makineKuyrugu.durum, 'calisiyor'),
        ),
      )
      .limit(1);

    if (runningJob) {
      await db.insert(operatorGunlukKayitlari).values({
        id: randomUUID(),
        uretim_emri_id: runningJob.uretim_emri_id,
        makine_id: body.makineId,
        emir_operasyon_id: runningJob.emir_operasyon_id ?? null,
        operator_user_id: operatorUserId ?? null,
        gunluk_durum: 'devam_ediyor',
        ek_uretim_miktari: (body.uretilenMiktar ?? 0).toFixed(4),
        fire_miktari: body.fireMiktar.toFixed(4),
        net_miktar: ((body.uretilenMiktar ?? 0) - body.fireMiktar).toFixed(4),
        birim_tipi: body.birimTipi,
        notlar: body.notlar ?? null,
        kayit_tarihi: now,
      });
    }
  }

  const [updated] = await db.select().from(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, openVardiya.id)).limit(1);
  return vardiyaRowToDto(updated);
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
  const id = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(malKabulKayitlari).values({
      id,
      satin_alma_siparis_id: body.satinAlmaSiparisId,
      satin_alma_kalem_id: body.satinAlmaKalemId,
      urun_id: body.urunId,
      gelen_miktar: body.gelenMiktar.toFixed(4),
      operator_user_id: operatorUserId ?? null,
      kabul_tarihi: now,
      notlar: body.notlar ?? null,
    });

    // Stok artirmasi
    await tx
      .update(urunler)
      .set({ stok: sql`${urunler.stok} + ${body.gelenMiktar.toFixed(4)}` })
      .where(eq(urunler.id, body.urunId));

    // Hareket kaydi
    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: body.urunId,
      hareket_tipi: 'giris',
      referans_tipi: 'mal_kabul',
      referans_id: id,
      miktar: body.gelenMiktar.toFixed(4),
      aciklama: `Mal kabul`,
      created_by_user_id: operatorUserId ?? null,
    });

    // Satin alma siparisi durumunu otomatik guncelle
    const kalemleri = await tx
      .select({ id: satinAlmaKalemleri.id, miktar: satinAlmaKalemleri.miktar })
      .from(satinAlmaKalemleri)
      .where(eq(satinAlmaKalemleri.siparis_id, body.satinAlmaSiparisId));

    if (kalemleri.length > 0) {
      const kalemIds = kalemleri.map((k) => k.id);
      const kabulTotals = await tx
        .select({
          kalemId: malKabulKayitlari.satin_alma_kalem_id,
          totalKabul: sql<string>`COALESCE(SUM(${malKabulKayitlari.gelen_miktar}), 0)`,
        })
        .from(malKabulKayitlari)
        .where(inArray(malKabulKayitlari.satin_alma_kalem_id, kalemIds))
        .groupBy(malKabulKayitlari.satin_alma_kalem_id);

      const kabulMap = new Map(kabulTotals.map((r) => [r.kalemId, Number(r.totalKabul)]));
      const allDone = kalemleri.every((k) => (kabulMap.get(k.id) ?? 0) >= Number(k.miktar));
      const anyKabul = kalemleri.some((k) => (kabulMap.get(k.id) ?? 0) > 0);

      const yeniDurum = allDone ? 'tamamlandi' : anyKabul ? 'kismen_teslim' : undefined;
      if (yeniDurum) {
        await tx
          .update(satinAlmaSiparisleri)
          .set({ durum: yeniDurum })
          .where(
            and(
              eq(satinAlmaSiparisleri.id, body.satinAlmaSiparisId),
              sql`${satinAlmaSiparisleri.durum} != 'iptal'`,
            ),
          );
      }
    }
  });

  const [row] = await db.select().from(malKabulKayitlari).where(eq(malKabulKayitlari.id, id)).limit(1);
  return malKabulRowToDto(row);
}

// ============================================================
// 8) Gunluk Girisler + Durus Listesi
// ============================================================

export async function repoListGunlukGirisler(
  query: ListGunlukGirislerQuery,
): Promise<{ items: OperatorGunlukGirisDto[]; total: number }> {
  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(operatorGunlukKayitlari)
      .orderBy(desc(operatorGunlukKayitlari.kayit_tarihi), desc(operatorGunlukKayitlari.created_at))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(operatorGunlukKayitlari),
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
