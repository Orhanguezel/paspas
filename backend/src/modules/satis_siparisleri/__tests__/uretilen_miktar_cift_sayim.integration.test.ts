/**
 * Regresyon testi — Risk 3 (çift sayım bug):
 *
 * Çift taraflı üretimde aynı sipariş kalemine 2 üretim emri (sağ + sol Operasyonel YM)
 * bağlanır. Önceki implementasyon `SUM(uretim_emirleri.uretilen_miktar)` kullandığı için
 * sağ ve sol miktarları topluyordu (çift sayım).
 *
 * Yeni implementasyon `hareketler` tablosundaki **asıl ürünün giriş hareketlerini**
 * topluyor; sipariş kalemi başına bir kez sayılıyor.
 *
 * Senaryo:
 *   - Sipariş kalemi: 10 adet ana ürün
 *   - Sağ OYM emri:   uretilen_miktar = 10  (10 sağ baskı)
 *   - Sol OYM emri:   uretilen_miktar = 20  (her ana ürün için 2 sol parça → reçete kalemi miktarı 2)
 *   - Montaj: 10 ana ürün üretildi → hareketler.giris (asıl ürün) = 10
 *
 * Beklenti: `repoGetKalemUretilenMiktarlari` = 10 (eski bug: 30)
 *           `repoListIslemler[*].uretilenMiktar` = 10
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { musteriler } from "@/modules/musteriler/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import {
  satisSiparisleri,
  siparisKalemleri,
} from "@/modules/satis_siparisleri/schema";
import {
  uretimEmirleri,
  uretimEmriSiparisKalemleri,
} from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import {
  repoGetKalemUretilenMiktarlari,
  repoListIslemler,
} from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "it-cs-mus-0001-00000000000001",
  siparis: "it-cs-sip-0001-00000000000001",
  siparisKalem: "it-cs-kal-0001-00000000000001",
  asil: "it-cs-asil-001-00000000000001",
  oymSag: "it-cs-oym-sag-00000000000001",
  oymSol: "it-cs-oym-sol-00000000000001",
  receteAsil: "it-cs-rec-asil-00000000000001",
  kalemSag: "it-cs-rk-sag-000000000000001",
  kalemSol: "it-cs-rk-sol-000000000000001",
  uretimSag: "it-cs-ue-sag-000000000000001",
  uretimSol: "it-cs-ue-sol-000000000000001",
  hareketMontaj: "it-cs-h-montaj-00000000000001",
  // Sağ ve sol Operasyonel YM çıkış hareketleri (yan etki — gerçek senaryoda olur)
  hareketCikisSag: "it-cs-h-cikis-sag-0000000001",
  hareketCikisSol: "it-cs-h-cikis-sol-0000000001",
} as const;

async function cleanup() {
  await db.delete(hareketler).where(
    inArray(hareketler.id, [ids.hareketMontaj, ids.hareketCikisSag, ids.hareketCikisSol]),
  );
  await db.delete(uretimEmriSiparisKalemleri).where(
    inArray(uretimEmriSiparisKalemleri.uretim_emri_id, [ids.uretimSag, ids.uretimSol]),
  );
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.uretimSag, ids.uretimSol]));
  await db.delete(siparisKalemleri).where(eq(siparisKalemleri.id, ids.siparisKalem));
  await db.delete(satisSiparisleri).where(eq(satisSiparisleri.id, ids.siparis));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.receteAsil));
  await db.delete(receteler).where(eq(receteler.id, ids.receteAsil));
  await db.delete(urunler).where(inArray(urunler.id, [ids.asil, ids.oymSag, ids.oymSol]));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seed() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: "IT-CS-MUS",
    ad: "IT Cift Sayim Musteri",
    iskonto: "0.00",
  });

  await db.insert(urunler).values([
    {
      id: ids.asil,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-CS-ASIL",
      ad: "IT Cift Sayim Ana Urun",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "cift_tarafli",
    },
    {
      id: ids.oymSag,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-CS-OYM-SAG",
      ad: "IT Cift Sayim OYM Sag",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.oymSol,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-CS-OYM-SOL",
      ad: "IT Cift Sayim OYM Sol",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
  ]);

  await db.insert(receteler).values({
    id: ids.receteAsil,
    kod: "IT-CS-REC-ASIL",
    ad: "IT Cift Sayim Recete",
    urun_id: ids.asil,
    hedef_miktar: "1.0000",
  });

  await db.insert(receteKalemleri).values([
    { id: ids.kalemSag, recete_id: ids.receteAsil, urun_id: ids.oymSag, miktar: "1.0000", fire_orani: "0.00", sira: 1 },
    { id: ids.kalemSol, recete_id: ids.receteAsil, urun_id: ids.oymSol, miktar: "2.0000", fire_orani: "0.00", sira: 2 },
  ]);

  await db.insert(satisSiparisleri).values({
    id: ids.siparis,
    siparis_no: "IT-CS-001",
    musteri_id: ids.musteri,
    siparis_tarihi: new Date("2026-04-30"),
    termin_tarihi: new Date("2026-05-05"),
    durum: "onaylandi",
  });

  await db.insert(siparisKalemleri).values({
    id: ids.siparisKalem,
    siparis_id: ids.siparis,
    urun_id: ids.asil,
    miktar: "10.0000",
    birim_fiyat: "100.00",
    sira: 1,
  });

  // İki ayrı üretim emri — sağ ve sol Operasyonel YM için
  await db.insert(uretimEmirleri).values([
    {
      id: ids.uretimSag,
      emir_no: "UE-IT-CS-SAG",
      urun_id: ids.oymSag,
      planlanan_miktar: "10.0000",
      uretilen_miktar: "10.0000", // 10 adet sağ baskı yapıldı
      durum: "tamamlandi",
    },
    {
      id: ids.uretimSol,
      emir_no: "UE-IT-CS-SOL",
      urun_id: ids.oymSol,
      planlanan_miktar: "20.0000",
      uretilen_miktar: "20.0000", // 20 adet sol baskı yapıldı (her asıl ürün için 2)
      durum: "tamamlandi",
    },
  ]);

  // Her iki emir aynı sipariş kalemine bağlı
  await db.insert(uretimEmriSiparisKalemleri).values([
    { id: randomUUID(), uretim_emri_id: ids.uretimSag, siparis_kalem_id: ids.siparisKalem },
    { id: randomUUID(), uretim_emri_id: ids.uretimSol, siparis_kalem_id: ids.siparisKalem },
  ]);

  // Montaj sonucu — asıl ürün için 10 adet GIRIS hareketi
  // (gerçek akışta `tryMontajForUretimEmri` yazardı; burada manuel insert ediyoruz
  //  çünkü senaryo özelinde stok hareketinin doğru sayılmasını test ediyoruz)
  await db.insert(hareketler).values({
    id: ids.hareketMontaj,
    urun_id: ids.asil, // asıl ürün
    hareket_tipi: "giris",
    referans_tipi: "montaj",
    referans_id: ids.uretimSol, // montaj emir id (genelde sol/montaj=true taraf)
    miktar: "10.0000",
    aciklama: "Test montaj girisi",
  });

  // Yan etki: OYM çıkış hareketleri (gerçek akışta vardır, test asıl ürün toplamını bunlardan
  // etkilenmemesini doğrular).
  await db.insert(hareketler).values([
    {
      id: ids.hareketCikisSag,
      urun_id: ids.oymSag,
      hareket_tipi: "cikis",
      referans_tipi: "montaj",
      referans_id: ids.uretimSol,
      miktar: "10.0000",
      aciklama: "Test sag OYM tuketim",
    },
    {
      id: ids.hareketCikisSol,
      urun_id: ids.oymSol,
      hareket_tipi: "cikis",
      referans_tipi: "montaj",
      referans_id: ids.uretimSol,
      miktar: "20.0000",
      aciklama: "Test sol OYM tuketim",
    },
  ]);
}

describeIntegration("repoGetKalemUretilenMiktarlari + repoListIslemler — cift sayim regresyon", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    // pool.end() bun:test cross-file olduğunda çift kapanabilir; idempotent yap
  });

  it("repoGetKalemUretilenMiktarlari sipariş kaleminin gerçek üretilen miktarını döndürür (10, 30 değil)", async () => {
    const map = await repoGetKalemUretilenMiktarlari(ids.siparis);
    const value = map.get(ids.siparisKalem);

    // Eski bug: SUM(uretim_emirleri.uretilen_miktar) = 10 + 20 = 30 ❌
    // Yeni: SUM(hareketler.miktar) [asıl ürün giriş] = 10 ✓
    expect(value).toBe(10);
  });

  it("repoListIslemler.uretilenMiktar OYM çıkış hareketlerinden etkilenmez", async () => {
    const { items } = await repoListIslemler({
      siparisId: ids.siparis,
      limit: 100,
      offset: 0,
      order: "desc",
    } as any);

    const row = items.find((r) => r.kalemId === ids.siparisKalem);
    expect(row).toBeDefined();
    expect(row!.uretilenMiktar).toBe(10);
  });

  it("hiç montaj yapılmamış sipariş kaleminde uretilenMiktar = 0", async () => {
    // Mevcut montaj hareketini sil
    await db.delete(hareketler).where(eq(hareketler.id, ids.hareketMontaj));

    const map = await repoGetKalemUretilenMiktarlari(ids.siparis);
    const value = map.get(ids.siparisKalem);

    // OYM çıkış hareketleri var ama asıl ürün giriş yok → 0
    expect(value).toBe(0);
  });
});
