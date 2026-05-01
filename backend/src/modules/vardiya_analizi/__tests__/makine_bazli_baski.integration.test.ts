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
  makineSag: "it-va-mak-sag-00000000000001",
  makineSol: "it-va-mak-sol-00000000000001",
  vardiyaSag: "it-va-vard-sag-0000000000001",
  vardiyaSol: "it-va-vard-sol-0000000000001",
  urunSag: "it-va-oym-sag-00000000000001",
  urunSol: "it-va-oym-sol-00000000000001",
  emirSag: "it-va-ue-sag-000000000000001",
  emirSol: "it-va-ue-sol-000000000000001",
  opSag: "it-va-op-sag-000000000000001",
  opSol: "it-va-op-sol-000000000000001",
  kayitSag: "it-va-kay-sag-0000000000001",
  kayitSol: "it-va-kay-sol-0000000000001",
} as const;

async function cleanup() {
  await db.delete(operatorGunlukKayitlari).where(
    inArray(operatorGunlukKayitlari.id, [ids.kayitSag, ids.kayitSol]),
  );
  await db.delete(vardiyaKayitlari).where(
    inArray(vardiyaKayitlari.id, [ids.vardiyaSag, ids.vardiyaSol]),
  );
  await db.delete(uretimEmriOperasyonlari).where(
    inArray(uretimEmriOperasyonlari.id, [ids.opSag, ids.opSol]),
  );
  await db.delete(uretimEmirleri).where(
    inArray(uretimEmirleri.id, [ids.emirSag, ids.emirSol]),
  );
  await db.delete(urunler).where(inArray(urunler.id, [ids.urunSag, ids.urunSol]));
  await db.delete(makineler).where(inArray(makineler.id, [ids.makineSag, ids.makineSol]));
}

async function seed() {
  await db.insert(makineler).values([
    {
      id: ids.makineSag,
      kod: "IT-VA-MAK-SAG",
      ad: "IT VA Sag Baski",
      saatlik_kapasite: "100.00",
      durum: "aktif",
      is_active: 1,
    },
    {
      id: ids.makineSol,
      kod: "IT-VA-MAK-SOL",
      ad: "IT VA Sol Baski",
      saatlik_kapasite: "100.00",
      durum: "aktif",
      is_active: 1,
    },
  ]);

  await db.insert(urunler).values([
    {
      id: ids.urunSag,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-VA-OYM-SAG",
      ad: "IT VA OYM Sag",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "cift_tarafli",
    },
    {
      id: ids.urunSol,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-VA-OYM-SOL",
      ad: "IT VA OYM Sol",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "cift_tarafli",
    },
  ]);

  await db.insert(uretimEmirleri).values([
    {
      id: ids.emirSag,
      emir_no: "UE-IT-VA-SAG",
      urun_id: ids.urunSag,
      planlanan_miktar: "20.0000",
      uretilen_miktar: "12.0000",
      durum: "uretimde",
    },
    {
      id: ids.emirSol,
      emir_no: "UE-IT-VA-SOL",
      urun_id: ids.urunSol,
      planlanan_miktar: "20.0000",
      uretilen_miktar: "18.0000",
      durum: "uretimde",
    },
  ]);

  await db.insert(uretimEmriOperasyonlari).values([
    {
      id: ids.opSag,
      uretim_emri_id: ids.emirSag,
      sira: 1,
      operasyon_adi: "Sag Baski",
      makine_id: ids.makineSag,
      cevrim_suresi_sn: "30.00",
      planlanan_miktar: "20.0000",
      uretilen_miktar: "12.0000",
      montaj: 0,
      durum: "yapiliyor",
    },
    {
      id: ids.opSol,
      uretim_emri_id: ids.emirSol,
      sira: 1,
      operasyon_adi: "Sol Baski",
      makine_id: ids.makineSol,
      cevrim_suresi_sn: "45.00",
      planlanan_miktar: "20.0000",
      uretilen_miktar: "18.0000",
      montaj: 0,
      durum: "yapiliyor",
    },
  ]);

  await db.insert(vardiyaKayitlari).values([
    {
      id: ids.vardiyaSag,
      makine_id: ids.makineSag,
      vardiya_tipi: "gunduz",
      baslangic: new Date("2026-04-30T07:30:00"),
      bitis: new Date("2026-04-30T19:30:00"),
    },
    {
      id: ids.vardiyaSol,
      makine_id: ids.makineSol,
      vardiya_tipi: "gunduz",
      baslangic: new Date("2026-04-30T07:30:00"),
      bitis: new Date("2026-04-30T19:30:00"),
    },
  ]);

  await db.insert(operatorGunlukKayitlari).values([
    {
      id: ids.kayitSag,
      uretim_emri_id: ids.emirSag,
      makine_id: ids.makineSag,
      emir_operasyon_id: ids.opSag,
      gunluk_durum: "tamamlandi",
      ek_uretim_miktari: "13.0000",
      fire_miktari: "1.0000",
      net_miktar: "12.0000",
      kayit_tarihi: new Date("2026-04-30T09:00:00"),
    },
    {
      id: ids.kayitSol,
      uretim_emri_id: ids.emirSol,
      makine_id: ids.makineSol,
      emir_operasyon_id: ids.opSol,
      gunluk_durum: "tamamlandi",
      ek_uretim_miktari: "20.0000",
      fire_miktari: "2.0000",
      net_miktar: "18.0000",
      kayit_tarihi: new Date("2026-04-30T09:30:00"),
    },
  ]);
}

describeIntegration("vardiya analizi — makine bazlı çift taraflı baskı", () => {
  afterAll(async () => {
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("iki baskı makinesinin adetlerini ayrı rollup olarak gösterir", async () => {
    await seed();

    const analiz = await getVardiyaAnalizi({ tarih: "2026-04-30" });

    expect(analiz.ozet.toplamUretim).toBe(30);
    expect(analiz.makineler).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          makineId: ids.makineSag,
          makineAd: "IT VA Sag Baski",
          toplamUretim: 12,
          operasyonKirilimi: [
            expect.objectContaining({ operasyonId: ids.opSag, operasyonAdi: "Sag Baski", miktar: 12 }),
          ],
        }),
        expect.objectContaining({
          makineId: ids.makineSol,
          makineAd: "IT VA Sol Baski",
          toplamUretim: 18,
          operasyonKirilimi: [
            expect.objectContaining({ operasyonId: ids.opSol, operasyonAdi: "Sol Baski", miktar: 18 }),
          ],
        }),
      ]),
    );

    const sagMakine = analiz.makineler.find((m) => m.makineId === ids.makineSag);
    const solMakine = analiz.makineler.find((m) => m.makineId === ids.makineSol);
    expect(sagMakine?.operasyonKirilimi).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ operasyonId: ids.opSol })]),
    );
    expect(solMakine?.operasyonKirilimi).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ operasyonId: ids.opSag })]),
    );
  });

  it("makine filtresi verildiğinde sadece ilgili baskı adedini döndürür", async () => {
    await seed();

    const analiz = await getVardiyaAnalizi({ tarih: "2026-04-30", makineId: ids.makineSag });

    expect(analiz.ozet.toplamUretim).toBe(12);
    expect(analiz.makineler).toHaveLength(1);
    expect(analiz.makineler[0]).toEqual(
      expect.objectContaining({
        makineId: ids.makineSag,
        toplamUretim: 12,
      }),
    );
  });
});
