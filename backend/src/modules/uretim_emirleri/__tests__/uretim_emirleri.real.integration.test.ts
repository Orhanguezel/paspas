import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { musteriler } from "@/modules/musteriler/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { satisSiparisleri, siparisKalemleri } from "@/modules/satis_siparisleri/schema";
import { hammaddeRezervasyonlari, urunler, urunOperasyonlari } from "@/modules/urunler/schema";

import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoGetOperasyonlar,
  repoListAdaylar,
  repoUpdate,
} from "../repository";
import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "55555555-5555-4555-8555-555555555501",
  urun: "55555555-5555-4555-8555-555555555502",
  hammadde: "55555555-5555-4555-8555-555555555503",
  recete: "55555555-5555-4555-8555-555555555504",
  receteKalem: "55555555-5555-4555-8555-555555555505",
  urunOperasyon: "55555555-5555-4555-8555-555555555506",
  siparis: "55555555-5555-4555-8555-555555555507",
  siparisKalem: "55555555-5555-4555-8555-555555555508",
} as const;

const codes = {
  musteri: "IT-REAL-UE-MUS",
  urun: "IT-REAL-UE-URN",
  hammadde: "IT-REAL-UE-HM",
  recete: "IT-REAL-UE-REC",
  siparis: "SS-IT-REAL-UE-001",
  emir: "UE-IT-REAL-001",
  emirGuncel: "UE-IT-REAL-001-G",
  manuelEmir: "UE-IT-REAL-MANUEL",
} as const;

async function getEmirIds() {
  const rows = await db
    .select({ id: uretimEmirleri.id })
    .from(uretimEmirleri)
    .where(inArray(uretimEmirleri.emir_no, [codes.emir, codes.emirGuncel, codes.manuelEmir]));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const emirIds = await getEmirIds();
  if (emirIds.length > 0) {
    await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds));
    await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));
    await db.delete(hammaddeRezervasyonlari).where(inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds));
    await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, emirIds));
  }

  await db.delete(siparisKalemleri).where(eq(siparisKalemleri.siparis_id, ids.siparis));
  await db.delete(satisSiparisleri).where(eq(satisSiparisleri.id, ids.siparis));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.recete));
  await db.delete(receteler).where(eq(receteler.id, ids.recete));
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.urun_id, ids.urun));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seedBase() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: codes.musteri,
    ad: "IT Gerçek Üretim Müşterisi",
    is_active: 1,
  });
  await db.insert(urunler).values([
    {
      id: ids.urun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urun,
      ad: "IT Gerçek Üretim Ürünü",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
      is_active: 1,
    },
    {
      id: ids.hammadde,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Gerçek Üretim Hammaddesi",
      birim: "kg",
      stok: "100.0000",
      rezerve_stok: "0.0000",
      kritik_stok: "5.0000",
      stok_takip_aktif: 1,
      kdv_orani: "20.00",
      is_active: 1,
    },
  ]);
  await db.insert(urunOperasyonlari).values({
    id: ids.urunOperasyon,
    urun_id: ids.urun,
    sira: 1,
    operasyon_adi: "IT Gerçek Baskı Operasyonu",
    hazirlik_suresi_dk: 10,
    cevrim_suresi_sn: "6.00",
    montaj: 0,
    is_active: 1,
  });
  await db.insert(receteler).values({
    id: ids.recete,
    kod: codes.recete,
    ad: "IT Gerçek Üretim Reçetesi",
    urun_id: ids.urun,
    hedef_miktar: "1.0000",
    is_active: 1,
  });
  await db.insert(receteKalemleri).values({
    id: ids.receteKalem,
    recete_id: ids.recete,
    urun_id: ids.hammadde,
    miktar: "2.0000",
    fire_orani: "0.00",
    sira: 1,
  });
  await db.insert(satisSiparisleri).values({
    id: ids.siparis,
    siparis_no: codes.siparis,
    musteri_id: ids.musteri,
    siparis_tarihi: new Date("2031-07-01"),
    termin_tarihi: new Date("2031-07-20"),
    durum: "onaylandi",
    is_active: 1,
  });
  await db.insert(siparisKalemleri).values({
    id: ids.siparisKalem,
    siparis_id: ids.siparis,
    urun_id: ids.urun,
    miktar: "10.0000",
    birim_fiyat: "100.00",
    sira: 1,
    uretim_durumu: "beklemede",
  });
}

async function getMaterialStock() {
  const [row] = await db
    .select({ stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(eq(urunler.id, ids.hammadde))
    .limit(1);
  return {
    stok: Number(row?.stok ?? 0),
    rezerveStok: Number(row?.rezerveStok ?? 0),
  };
}

describeIntegration("gerçek veri üretim emirleri", () => {
  beforeEach(async () => {
    await cleanup();
    await seedBase();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("satış kaleminden üretim emri oluşturur, operasyon ve rezervasyonu kurar, silince kalemi geri alır", async () => {
    const adaylar = await repoListAdaylar();
    expect(adaylar.map((aday) => aday.siparisKalemId)).toContain(ids.siparisKalem);

    const created = await repoCreate({
      emirNo: codes.emir,
      siparisKalemIds: [ids.siparisKalem],
      urunId: ids.urun,
      planlananMiktar: 10,
      uretilenMiktar: 0,
      durum: "atanmamis",
      terminTarihi: "2031-07-20",
    });

    expect(created.row.emir_no).toBe(codes.emir);
    expect(created.row.siparisKalemIds).toEqual([ids.siparisKalem]);
    expect(created.row.musteriAd).toBe("IT Gerçek Üretim Müşterisi");
    expect(created.hammaddeUyarilari).toEqual([]);

    const kalem = await db
      .select({ uretimDurumu: siparisKalemleri.uretim_durumu })
      .from(siparisKalemleri)
      .where(eq(siparisKalemleri.id, ids.siparisKalem))
      .limit(1);
    expect(kalem[0]?.uretimDurumu).toBe("uretime_aktarildi");

    const operasyonlar = await repoGetOperasyonlar(created.row.id);
    expect(operasyonlar).toHaveLength(1);
    expect(operasyonlar[0].operasyonAdi).toBe("IT Gerçek Baskı Operasyonu");
    expect(operasyonlar[0].planlananMiktar).toBe(10);

    const stock = await getMaterialStock();
    expect(stock.stok).toBe(100);
    expect(stock.rezerveStok).toBe(20);

    const rezervasyonRows = await db
      .select({ miktar: hammaddeRezervasyonlari.miktar, durum: hammaddeRezervasyonlari.durum })
      .from(hammaddeRezervasyonlari)
      .where(eq(hammaddeRezervasyonlari.uretim_emri_id, created.row.id));
    expect(rezervasyonRows).toHaveLength(1);
    expect(Number(rezervasyonRows[0].miktar)).toBe(20);
    expect(rezervasyonRows[0].durum).toBe("rezerve");

    await repoDelete(created.row.id);

    const deleted = await repoGetById(created.row.id);
    expect(deleted).toBeNull();
    expect((await getMaterialStock()).rezerveStok).toBe(0);

    const [kalemAfterDelete] = await db
      .select({ uretimDurumu: siparisKalemleri.uretim_durumu })
      .from(siparisKalemleri)
      .where(eq(siparisKalemleri.id, ids.siparisKalem));
    expect(kalemAfterDelete?.uretimDurumu).toBe("beklemede");
  });

  it("manuel üretim emrini düzenler ve bağlantısızken siler", async () => {
    const created = await repoCreate({
      emirNo: codes.manuelEmir,
      urunId: ids.urun,
      planlananMiktar: 5,
      uretilenMiktar: 0,
      baslangicTarihi: "2031-07-02",
      bitisTarihi: "2031-07-05",
      durum: "atanmamis",
      musteriOzet: "Manuel test müşterisi",
    });

    let row = await repoGetById(created.row.id);
    expect(row?.emir_no).toBe(codes.manuelEmir);
    expect(Number(row?.planlanan_miktar)).toBe(5);
    expect((await getMaterialStock()).rezerveStok).toBe(10);

    row = await repoUpdate(created.row.id, {
      emirNo: codes.emirGuncel,
      planlananMiktar: 6,
      bitisTarihi: "2031-07-06",
      musteriOzet: "Manuel test müşterisi güncel",
    });
    expect(row?.emir_no).toBe(codes.emirGuncel);
    expect(Number(row?.planlanan_miktar)).toBe(6);

    const operasyonlar = await repoGetOperasyonlar(created.row.id);
    expect(operasyonlar[0].planlananMiktar).toBe(6);

    await repoDelete(created.row.id);
    expect(await repoGetById(created.row.id)).toBeNull();

    const [emirCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, created.row.id));
    expect(Number(emirCount.count)).toBe(0);
  });

  it("planlanan miktar güncellenince hammadde rezervasyonu da artıp azalmalı", async () => {
    const created = await repoCreate({
      emirNo: codes.manuelEmir,
      urunId: ids.urun,
      planlananMiktar: 5,
      uretilenMiktar: 0,
      durum: "atanmamis",
    });

    expect((await getMaterialStock()).rezerveStok).toBe(10);

    await repoUpdate(created.row.id, { planlananMiktar: 8 });

    const stock = await getMaterialStock();
    expect(stock.rezerveStok).toBe(16);

    // Aktif (durum='rezerve') rezervasyon yeni miktarda olmalı.
    // İptal edilmiş eski rezervasyonlar audit için saklanır.
    const [rezervasyon] = await db
      .select({ miktar: hammaddeRezervasyonlari.miktar })
      .from(hammaddeRezervasyonlari)
      .where(
        and(
          eq(hammaddeRezervasyonlari.uretim_emri_id, created.row.id),
          eq(hammaddeRezervasyonlari.durum, "rezerve"),
        ),
      );
    expect(Number(rezervasyon?.miktar)).toBe(16);

    // Miktar düşünce de senkron olmalı.
    await repoUpdate(created.row.id, { planlananMiktar: 3 });
    expect((await getMaterialStock()).rezerveStok).toBe(6);
  });
});
