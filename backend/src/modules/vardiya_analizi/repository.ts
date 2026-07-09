import { and, desc, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { makineler as makinelerTbl } from '@/modules/makine_havuzu/schema';
import { operatorGunlukKayitlari, vardiyaKayitlari } from '@/modules/operator/schema';
import { kaliplar } from '@/modules/tanimlar/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

import { toLocal, VARDIYA_TZ_OFFSET_DK, type UretimKaydi, type VardiyaTipi } from './core';

const netMiktarSql = sql<number>`GREATEST(CASE WHEN ${operatorGunlukKayitlari.net_miktar} <> 0 THEN ${operatorGunlukKayitlari.net_miktar} ELSE (${operatorGunlukKayitlari.ek_uretim_miktari} - ${operatorGunlukKayitlari.fire_miktari}) END, 0)`;
const hasProductionSql = sql`(${operatorGunlukKayitlari.net_miktar} <> 0 OR ${operatorGunlukKayitlari.ek_uretim_miktari} <> 0 OR ${operatorGunlukKayitlari.fire_miktari} <> 0)`;

function localDateKey(date: Date): string {
  const local = toLocal(date, VARDIYA_TZ_OFFSET_DK);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function fetchUretimKayitlari(
  pencere: { baslangic: Date; bitis: Date },
  makineIds?: string[],
): Promise<UretimKaydi[]> {
  const rows = await db
    .select({
      id: operatorGunlukKayitlari.id,
      makineId: operatorGunlukKayitlari.makine_id,
      makineKod: makinelerTbl.kod,
      makineAd: makinelerTbl.ad,
      kayitTarihi: operatorGunlukKayitlari.kayit_tarihi,
      net: netMiktarSql,
      fire: operatorGunlukKayitlari.fire_miktari,
      ek: operatorGunlukKayitlari.ek_uretim_miktari,
      montaj: uretimEmriOperasyonlari.montaj,
      urunId: urunler.id,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      operasyonId: uretimEmriOperasyonlari.id,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      operasyonTipi: urunler.operasyon_tipi,
      kalipId: kaliplar.id,
      kalipKod: kaliplar.kod,
      kalipAd: kaliplar.ad,
      cevrimSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
      operatorUserId: operatorGunlukKayitlari.operator_user_id,
      operatorAd: users.full_name,
      gunlukDurum: operatorGunlukKayitlari.gunluk_durum,
      notlar: operatorGunlukKayitlari.notlar,
      uretimEmriId: uretimEmirleri.id,
      emirNo: uretimEmirleri.emir_no,
      planlananMiktar: uretimEmirleri.planlanan_miktar,
      uretilenMiktar: uretimEmirleri.uretilen_miktar,
      operasyonBaslangic: uretimEmriOperasyonlari.gercek_baslangic,
      operasyonBitis: uretimEmriOperasyonlari.gercek_bitis,
      vardiyaKayitId: operatorGunlukKayitlari.vardiya_kayit_id,
      vardiyaTipi: vardiyaKayitlari.vardiya_tipi,
      vardiyaBaslangic: vardiyaKayitlari.baslangic,
      vardiyaBitis: vardiyaKayitlari.bitis,
    })
    .from(operatorGunlukKayitlari)
    .innerJoin(uretimEmirleri, sql`${operatorGunlukKayitlari.uretim_emri_id} = ${uretimEmirleri.id}`)
    .innerJoin(urunler, sql`${uretimEmirleri.urun_id} = ${urunler.id}`)
    .innerJoin(makinelerTbl, sql`${operatorGunlukKayitlari.makine_id} = ${makinelerTbl.id}`)
    .leftJoin(uretimEmriOperasyonlari, sql`${operatorGunlukKayitlari.emir_operasyon_id} = ${uretimEmriOperasyonlari.id}`)
    .leftJoin(kaliplar, sql`${uretimEmriOperasyonlari.kalip_id} = ${kaliplar.id}`)
    .leftJoin(users, sql`${operatorGunlukKayitlari.operator_user_id} = ${users.id}`)
    .leftJoin(vardiyaKayitlari, sql`${operatorGunlukKayitlari.vardiya_kayit_id} = ${vardiyaKayitlari.id}`)
    .where(
      and(
        gte(operatorGunlukKayitlari.kayit_tarihi, pencere.baslangic),
        lte(operatorGunlukKayitlari.kayit_tarihi, pencere.bitis),
        makineIds && makineIds.length > 0 ? inArray(operatorGunlukKayitlari.makine_id, makineIds) : sql`1 = 1`,
        hasProductionSql,
      ),
    )
    .orderBy(desc(operatorGunlukKayitlari.kayit_tarihi));

  return rows
    .filter((row) => row.makineId && row.makineAd)
    .map((row) => {
      const vardiyaBaslangic = row.vardiyaBaslangic ? new Date(row.vardiyaBaslangic) : null;
      const vardiyaBitis = row.vardiyaBitis ? new Date(row.vardiyaBitis) : null;
      return {
      id: row.id,
      makineId: row.makineId!,
      makineKod: row.makineKod ?? null,
      makineAd: row.makineAd!,
      kayitTarihi: new Date(row.kayitTarihi),
      net: Number(row.net ?? 0),
      fire: Number(row.fire ?? 0),
      ek: Number(row.ek ?? 0),
      montaj: Number(row.montaj ?? 0) === 1,
      urunId: row.urunId,
      urunKod: row.urunKod ?? null,
      urunAd: row.urunAd,
      operasyonId: row.operasyonId ?? null,
      operasyonAdi: row.operasyonAdi ?? (Number(row.montaj ?? 0) === 1 ? 'Montaj' : 'Baskı'),
      operasyonTipi: row.operasyonTipi ?? null,
      kalipId: row.kalipId ?? null,
      kalipKod: row.kalipKod ?? null,
      kalipAd: row.kalipAd ?? null,
      cevrimSn: row.cevrimSn === null || row.cevrimSn === undefined ? null : Number(row.cevrimSn),
      operatorUserId: row.operatorUserId ?? null,
      operatorAd: row.operatorAd ?? null,
      gunlukDurum: row.gunlukDurum,
      notlar: row.notlar ?? null,
      uretimEmriId: row.uretimEmriId,
      emirNo: row.emirNo,
      planlananMiktar: Number(row.planlananMiktar ?? 0),
      uretilenMiktar: Number(row.uretilenMiktar ?? 0),
      operasyonBaslangic: row.operasyonBaslangic ? new Date(row.operasyonBaslangic) : null,
      operasyonBitis: row.operasyonBitis ? new Date(row.operasyonBitis) : null,
      vardiyaKayitId: row.vardiyaKayitId ?? null,
      vardiyaSlotOverride: row.vardiyaKayitId && row.vardiyaTipi && vardiyaBaslangic
        ? {
          gun: localDateKey(vardiyaBaslangic),
          vardiyaTipi: row.vardiyaTipi as VardiyaTipi,
          baslangic: vardiyaBaslangic,
          bitis: vardiyaBitis ?? new Date(vardiyaBaslangic.getTime() + 12 * 60 * 60_000),
        }
        : undefined,
    };
    });
}
