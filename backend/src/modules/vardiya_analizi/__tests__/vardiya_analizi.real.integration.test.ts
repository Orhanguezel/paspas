import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { makineler } from "@/modules/makine_havuzu/schema";
import { operatorGunlukKayitlari, vardiyaKayitlari } from "@/modules/operator/schema";
import { uretimEmirleri, uretimEmriOperasyonlari } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import { getVardiyaAnalizi } from "../service";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  makineBaski: "it-real-va-mak-baski-0000001",
  makineDiger: "it-real-va-mak-diger-0000001",
  vardiyaBaski: "it-real-va-vrd-baski-0000001",
  vardiyaDiger: "it-real-va-vrd-diger-0000001",
  urun: "it-real-va-urun-000000000001",
  emirBaski: "it-real-va-emir-baski-000001",
  emirMontaj: "it-real-va-emir-montaj-0001",
  opBaski: "it-real-va-op-baski-0000001",
  opMontaj: "it-real-va-op-montaj-000001",
  kayitDevam: "it-real-va-kay-devam-000001",
  kayitGunSonu: "it-real-va-kay-gunsonu-0001",
  kayitBitir: "it-real-va-kay-bitir-000001",
  kayitMontaj: "it-real-va-kay-montaj-00001",
} as const;

async function cleanup() {
  await db.delete(operatorGunlukKayitlari).where(
    inArray(operatorGunlukKayitlari.id, [
      ids.kayitDevam,
      ids.kayitGunSonu,
      ids.kayitBitir,
      ids.kayitMontaj,
    ]),
  );
  await db.delete(vardiyaKayitlari).where(inArray(vardiyaKayitlari.id, [ids.vardiyaBaski, ids.vardiyaDiger]));
  await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.id, [ids.opBaski, ids.opMontaj]));
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.emirBaski, ids.emirMontaj]));
  await db.delete(urunler).where(eq(urunler.id, ids.urun));
  await db.delete(makineler).where(inArray(makineler.id, [ids.makineBaski, ids.makineDiger]));
}

async function seed() {
  await db.insert(makineler).values([
    {
      id: ids.makineBaski,
      kod: "IT-REAL-VA-BASKI",
      ad: "IT Gerçek VA Baskı",
      saatlik_kapasite: "100.00",
      durum: "aktif",
      is_active: 1,
    },
    {
      id: ids.makineDiger,
      kod: "IT-REAL-VA-DIGER",
      ad: "IT Gerçek VA Diğer",
      saatlik_kapasite: "100.00",
      durum: "aktif",
      is_active: 1,
    },
  ]);
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "urun",
    tedarik_tipi: "uretim",
    kod: "IT-REAL-VA-URUN",
    ad: "IT Gerçek VA Ürünü",
    birim: "adet",
    kritik_stok: "0.0000",
    kdv_orani: "20.00",
    operasyon_tipi: "cift_tarafli",
    is_active: 1,
  });
  await db.insert(uretimEmirleri).values([
    {
      id: ids.emirBaski,
      emir_no: "UE-IT-REAL-VA-BASKI",
      urun_id: ids.urun,
      planlanan_miktar: "100.0000",
      uretilen_miktar: "25.0000",
      durum: "uretimde",
    },
    {
      id: ids.emirMontaj,
      emir_no: "UE-IT-REAL-VA-MONTAJ",
      urun_id: ids.urun,
      planlanan_miktar: "100.0000",
      uretilen_miktar: "11.0000",
      durum: "uretimde",
    },
  ]);
  await db.insert(uretimEmriOperasyonlari).values([
    {
      id: ids.opBaski,
      uretim_emri_id: ids.emirBaski,
      sira: 1,
      operasyon_adi: "IT VA Baskı Operasyonu",
      makine_id: ids.makineBaski,
      cevrim_suresi_sn: "30.00",
      planlanan_miktar: "100.0000",
      uretilen_miktar: "25.0000",
      montaj: 0,
      durum: "calisiyor",
    },
    {
      id: ids.opMontaj,
      uretim_emri_id: ids.emirMontaj,
      sira: 2,
      operasyon_adi: "IT VA Montaj Operasyonu",
      makine_id: ids.makineBaski,
      cevrim_suresi_sn: "30.00",
      planlanan_miktar: "100.0000",
      uretilen_miktar: "11.0000",
      montaj: 1,
      durum: "calisiyor",
    },
  ]);
  await db.insert(vardiyaKayitlari).values([
    {
      id: ids.vardiyaBaski,
      makine_id: ids.makineBaski,
      vardiya_tipi: "gunduz",
      baslangic: new Date("2031-09-01T07:30:00"),
      bitis: new Date("2031-09-01T19:30:00"),
    },
    {
      id: ids.vardiyaDiger,
      makine_id: ids.makineDiger,
      vardiya_tipi: "gunduz",
      baslangic: new Date("2031-09-01T07:30:00"),
      bitis: new Date("2031-09-01T19:30:00"),
    },
  ]);
  await db.insert(operatorGunlukKayitlari).values([
    {
      id: ids.kayitDevam,
      uretim_emri_id: ids.emirBaski,
      makine_id: ids.makineBaski,
      emir_operasyon_id: ids.opBaski,
      gunluk_durum: "devam_ediyor",
      ek_uretim_miktari: "11.0000",
      fire_miktari: "1.0000",
      net_miktar: "10.0000",
      kayit_tarihi: new Date("2031-09-01T09:00:00"),
    },
    {
      id: ids.kayitGunSonu,
      uretim_emri_id: ids.emirBaski,
      makine_id: ids.makineBaski,
      emir_operasyon_id: ids.opBaski,
      gunluk_durum: "yarim_kaldi",
      ek_uretim_miktari: "9.0000",
      fire_miktari: "2.0000",
      net_miktar: "7.0000",
      kayit_tarihi: new Date("2031-09-01T12:00:00"),
    },
    {
      id: ids.kayitBitir,
      uretim_emri_id: ids.emirBaski,
      makine_id: ids.makineBaski,
      emir_operasyon_id: ids.opBaski,
      gunluk_durum: "tamamlandi",
      ek_uretim_miktari: "10.0000",
      fire_miktari: "2.0000",
      net_miktar: "8.0000",
      kayit_tarihi: new Date("2031-09-01T18:00:00"),
    },
    {
      id: ids.kayitMontaj,
      uretim_emri_id: ids.emirMontaj,
      makine_id: ids.makineBaski,
      emir_operasyon_id: ids.opMontaj,
      gunluk_durum: "tamamlandi",
      ek_uretim_miktari: "12.0000",
      fire_miktari: "1.0000",
      net_miktar: "11.0000",
      kayit_tarihi: new Date("2031-09-01T18:30:00"),
    },
  ]);
}

describeIntegration("gerçek veri vardiya analizi", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("makine bazlı baskı adetlerini toplar ve montaj kayıtlarını analizden muaf tutar", async () => {
    const analiz = await getVardiyaAnalizi({ tarih: "2031-09-01" });

    expect(analiz.ozet.toplamUretim).toBe(25);
    expect(analiz.ozet.aktifVardiyaSayisi).toBe(0);

    const baskiMakinesi = analiz.makineler.find((makine) => makine.makineId === ids.makineBaski);
    expect(baskiMakinesi).toEqual(expect.objectContaining({
      makineId: ids.makineBaski,
      toplamUretim: 25,
      vardiyaSayisi: 1,
    }));
    expect(baskiMakinesi?.operasyonKirilimi).toEqual([
      expect.objectContaining({
        operasyonId: ids.opBaski,
        operasyonAdi: "IT VA Baskı Operasyonu",
        miktar: 25,
      }),
    ]);
    expect(baskiMakinesi?.operasyonKirilimi).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ operasyonId: ids.opMontaj })]),
    );

    const vardiya = analiz.vardiyalar.find((item) => item.makineId === ids.makineBaski);
    expect(vardiya?.uretim.netToplam).toBe(25);
    expect(vardiya?.uretim.fireToplam).toBe(5);
    expect(vardiya?.uretim.urunKirilimi).toEqual([
      expect.objectContaining({ urunId: ids.urun, miktar: 25 }),
    ]);
  });

  it("makine filtresi verildiğinde sadece seçili makinenin baskı adetlerini döndürür", async () => {
    const analiz = await getVardiyaAnalizi({ tarih: "2031-09-01", makineId: ids.makineBaski });

    expect(analiz.ozet.toplamUretim).toBe(25);
    expect(analiz.makineler).toHaveLength(1);
    expect(analiz.makineler[0]).toEqual(expect.objectContaining({
      makineId: ids.makineBaski,
      toplamUretim: 25,
    }));
  });
});
