import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { gorevler } from "@/modules/gorevler/schema";
import { hareketler } from "@/modules/hareketler/schema";
import { musteriler } from "@/modules/musteriler/schema";
import { sevkiyatKalemleri, sevkiyatlar } from "@/modules/operator/schema";
import { repoCreate as repoCreateSatis, repoGetById as repoGetSatis, repoGetSiparisOzetleri } from "@/modules/satis_siparisleri/repository";
import { satisSiparisleri, siparisKalemleri } from "@/modules/satis_siparisleri/schema";
import { urunler } from "@/modules/urunler/schema";

import {
  repoCreateSevkEmri,
  repoGetSevkEmriById,
  repoListBekleyenler,
  repoListSevkEmirleri,
  repoPatchSevkEmri,
} from "../repository";
import { sevkEmirleri } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "11111111-1111-4111-8111-111111111401",
  urun: "11111111-1111-4111-8111-111111111402",
} as const;

const codes = {
  musteri: "IT-REAL-SVK-MUS",
  urun: "IT-REAL-SVK-URN",
  siparis: "SS-IT-REAL-SVK-001",
  notlar: "IT gerçek sevkiyat",
} as const;

async function getSiparisIds() {
  const rows = await db
    .select({ id: satisSiparisleri.id })
    .from(satisSiparisleri)
    .where(eq(satisSiparisleri.siparis_no, codes.siparis));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const siparisIds = await getSiparisIds();
  const sevkEmriRows = siparisIds.length > 0
    ? await db.select({ id: sevkEmirleri.id }).from(sevkEmirleri).where(inArray(sevkEmirleri.siparis_id, siparisIds))
    : [];
  const sevkEmriIds = sevkEmriRows.map((row) => row.id);
  if (sevkEmriIds.length > 0) {
    await db.delete(gorevler).where(inArray(gorevler.ilgili_kayit_id, sevkEmriIds));
  }

  const sevkiyatKalemRows = siparisIds.length > 0
    ? await db
      .select({ sevkiyatId: sevkiyatKalemleri.sevkiyat_id })
      .from(sevkiyatKalemleri)
      .where(inArray(sevkiyatKalemleri.siparis_id, siparisIds))
    : [];
  const sevkiyatIds = sevkiyatKalemRows.map((row) => row.sevkiyatId);
  if (sevkiyatIds.length > 0) {
    await db.delete(hareketler).where(inArray(hareketler.referans_id, sevkiyatIds));
    await db.delete(sevkiyatKalemleri).where(inArray(sevkiyatKalemleri.sevkiyat_id, sevkiyatIds));
    await db.delete(sevkiyatlar).where(inArray(sevkiyatlar.id, sevkiyatIds));
  }
  if (sevkEmriIds.length > 0) {
    await db.delete(sevkEmirleri).where(inArray(sevkEmirleri.id, sevkEmriIds));
  }
  if (siparisIds.length > 0) {
    await db.delete(siparisKalemleri).where(inArray(siparisKalemleri.siparis_id, siparisIds));
    await db.delete(satisSiparisleri).where(inArray(satisSiparisleri.id, siparisIds));
  }
  await db.delete(hareketler).where(eq(hareketler.urun_id, ids.urun));
  await db.delete(urunler).where(eq(urunler.id, ids.urun));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seed() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: codes.musteri,
    ad: "IT Gerçek Sevkiyat Müşterisi",
    is_active: 1,
  });
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "urun",
    tedarik_tipi: "uretim",
    kod: codes.urun,
    ad: "IT Gerçek Sevkiyat Ürünü",
    birim: "adet",
    stok: "12.0000",
    rezerve_stok: "0.0000",
    kritik_stok: "2.0000",
    kdv_orani: "20.00",
    stok_takip_aktif: 1,
    is_active: 1,
  });
}

async function createSiparis(miktar = 10) {
  return repoCreateSatis({
    siparisNo: codes.siparis,
    musteriId: ids.musteri,
    siparisTarihi: "2031-12-01",
    terminTarihi: "2031-12-10",
    durum: "onaylandi",
    aciklama: "IT gerçek sevkiyat siparişi",
    ekstraIndirimOrani: 0,
    items: [{ urunId: ids.urun, miktar, birimFiyat: 100, sira: 1 }],
  });
}

async function getStock() {
  const [row] = await db
    .select({ stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(eq(urunler.id, ids.urun))
    .limit(1);
  return {
    stok: Number(row?.stok ?? 0),
    rezerveStok: Number(row?.rezerveStok ?? 0),
  };
}

async function getSevkiyatIdsForSiparis(siparisId: string) {
  const rows = await db
    .select({ sevkiyatId: sevkiyatKalemleri.sevkiyat_id })
    .from(sevkiyatKalemleri)
    .where(eq(sevkiyatKalemleri.siparis_id, siparisId));
  return rows.map((row) => row.sevkiyatId);
}

describeIntegration("gerçek veri sevkiyat", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("satış siparişinden sevk emri oluşturur, sevk eder ve stok/hareket/sipariş durumunu doğrular", async () => {
    const siparis = await createSiparis(10);
    const siparisId = siparis.siparis.id;
    const kalemId = siparis.items[0].id;

    const bekleyenBaslangic = await repoListBekleyenler({
      q: codes.siparis,
      stokFiltre: "stoklu",
      limit: 20,
      offset: 0,
    });
    expect(bekleyenBaslangic.items).toHaveLength(1);
    expect(bekleyenBaslangic.items[0].kalanMiktar).toBe(10);
    expect(bekleyenBaslangic.items[0].stokMiktar).toBe(12);

    const ilkEmir = await repoCreateSevkEmri({
      siparisId,
      siparisKalemId: kalemId,
      musteriId: ids.musteri,
      urunId: ids.urun,
      miktar: 4,
      tarih: "2031-12-05",
      notlar: codes.notlar,
    }, null);

    expect(ilkEmir.durum).toBe("bekliyor");
    expect(ilkEmir.musteriAd).toBe("IT Gerçek Sevkiyat Müşterisi");
    expect(ilkEmir.urunKod).toBe(codes.urun);
    expect(await getStock()).toEqual({ stok: 12, rezerveStok: 4 });

    const bekleyenRezerve = await repoListBekleyenler({
      q: codes.siparis,
      stokFiltre: "stoklu",
      limit: 20,
      offset: 0,
    });
    expect(bekleyenRezerve.items[0].acikSevkEmriMiktar).toBe(4);
    expect(bekleyenRezerve.items[0].kalanMiktar).toBe(6);

    const onayli = await repoPatchSevkEmri(ilkEmir.id, { durum: "onaylandi" }, null);
    expect(onayli?.durum).toBe("onaylandi");
    expect(await getStock()).toEqual({ stok: 12, rezerveStok: 4 });

    const sevkEdildi = await repoPatchSevkEmri(ilkEmir.id, { durum: "sevk_edildi" }, null);
    expect(sevkEdildi?.durum).toBe("sevk_edildi");
    expect(await getStock()).toEqual({ stok: 8, rezerveStok: 0 });

    let satisDetail = await repoGetSatis(siparisId);
    expect(satisDetail?.siparis.durum).toBe("kismen_sevk");
    let ozet = (await repoGetSiparisOzetleri([siparisId])).get(siparisId);
    expect(ozet?.sevkEdilenMiktar).toBe(4);

    const ikinciEmir = await repoCreateSevkEmri({
      siparisId,
      siparisKalemId: kalemId,
      musteriId: ids.musteri,
      urunId: ids.urun,
      miktar: 6,
      tarih: "2031-12-06",
      notlar: "IT tamamlama sevki",
    }, null);
    await repoPatchSevkEmri(ikinciEmir.id, { durum: "onaylandi" }, null);
    await repoPatchSevkEmri(ikinciEmir.id, { durum: "sevk_edildi" }, null);
    expect(await getStock()).toEqual({ stok: 2, rezerveStok: 0 });

    satisDetail = await repoGetSatis(siparisId);
    expect(satisDetail?.siparis.durum).toBe("tamamlandi");
    ozet = (await repoGetSiparisOzetleri([siparisId])).get(siparisId);
    expect(ozet?.sevkEdilenMiktar).toBe(10);

    const sevkiyatIds = await getSevkiyatIdsForSiparis(siparisId);
    expect(sevkiyatIds).toHaveLength(2);
    const hareketRows = await db
      .select({ hareketTipi: hareketler.hareket_tipi, referansTipi: hareketler.referans_tipi, referansId: hareketler.referans_id, miktar: hareketler.miktar })
      .from(hareketler)
      .where(inArray(hareketler.referans_id, sevkiyatIds));
    expect(hareketRows.map((row) => ({
      hareketTipi: row.hareketTipi,
      referansTipi: row.referansTipi,
      miktar: Number(row.miktar),
    })).sort((a, b) => a.miktar - b.miktar)).toEqual([
      { hareketTipi: "cikis", referansTipi: "sevkiyat", miktar: -6 },
      { hareketTipi: "cikis", referansTipi: "sevkiyat", miktar: -4 },
    ]);
    expect(hareketRows.map((row) => row.referansId).sort()).toEqual([...sevkiyatIds].sort());

    const list = await repoListSevkEmirleri({
      q: codes.urun,
      durum: "sevk_edildi",
      musteriId: ids.musteri,
      limit: 20,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(list.items.map((item) => item.id)).toEqual(expect.arrayContaining([ilkEmir.id, ikinciEmir.id]));

    const fetched = await repoGetSevkEmriById(ilkEmir.id);
    expect(fetched?.durum).toBe("sevk_edildi");
  });

  it("sevk edilmemiş emri iptal edince rezervasyonu geri alır", async () => {
    const siparis = await createSiparis(5);
    const emir = await repoCreateSevkEmri({
      siparisId: siparis.siparis.id,
      siparisKalemId: siparis.items[0].id,
      musteriId: ids.musteri,
      urunId: ids.urun,
      miktar: 3,
      tarih: "2031-12-07",
    }, null);
    expect(await getStock()).toEqual({ stok: 12, rezerveStok: 3 });

    const iptal = await repoPatchSevkEmri(emir.id, { durum: "iptal" }, null);
    expect(iptal?.durum).toBe("iptal");
    expect(await getStock()).toEqual({ stok: 12, rezerveStok: 0 });
  });

  it("sevk edilmiş emir iptal edilememeli veya stok/hareket/sipariş durumunu geri almalı", async () => {
    const siparis = await createSiparis(4);
    const emir = await repoCreateSevkEmri({
      siparisId: siparis.siparis.id,
      siparisKalemId: siparis.items[0].id,
      musteriId: ids.musteri,
      urunId: ids.urun,
      miktar: 4,
      tarih: "2031-12-08",
    }, null);
    await repoPatchSevkEmri(emir.id, { durum: "onaylandi" }, null);
    await repoPatchSevkEmri(emir.id, { durum: "sevk_edildi" }, null);

    await expect(repoPatchSevkEmri(emir.id, { durum: "iptal" }, null)).rejects.toThrow();
  });
});
