import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { repoAtaOperasyon, repoKuyrukCikar } from "@/modules/makine_havuzu/repository";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { hammaddeRezervasyonlari, urunler, urunOperasyonlari } from "@/modules/urunler/schema";

import { repoCreate, repoDelete } from "../repository";
import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  urun: "it-stok-akis-urun-000000000001",
  hammaddeAktif: "it-stok-akis-hm-a-00000000001",
  hammaddeKapali: "it-stok-akis-hm-k-00000000001",
  recete: "it-stok-akis-rec-000000000001",
  receteKalemAktif: "it-stok-akis-rk-a-00000000001",
  receteKalemKapali: "it-stok-akis-rk-k-00000000001",
  urunOperasyon: "it-stok-akis-op-0000000000001",
  makine: "it-stok-akis-mak-000000000001",
} as const;

const emirNo = "IT-STOK-AKIS-001";

async function getEmirIds() {
  const rows = await db.select({ id: uretimEmirleri.id }).from(uretimEmirleri).where(eq(uretimEmirleri.emir_no, emirNo));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const emirIds = await getEmirIds();
  if (emirIds.length > 0) {
    await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.uretim_emri_id, emirIds));
    await db.delete(hareketler).where(inArray(hareketler.referans_id, emirIds));
    await db.delete(hammaddeRezervasyonlari).where(inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds));
    await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds));
    await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));
    await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, emirIds));
  }

  await db.delete(hareketler).where(inArray(hareketler.urun_id, [ids.hammaddeAktif, ids.hammaddeKapali]));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.recete));
  await db.delete(receteler).where(eq(receteler.id, ids.recete));
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.urun_id, ids.urun));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urun, ids.hammaddeAktif, ids.hammaddeKapali]));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seed() {
  await db.insert(makineler).values({
    id: ids.makine,
    kod: "IT-STOK-MAK",
    ad: "IT Stok Test Makinesi",
  });
  await db.insert(urunler).values([
    {
      id: ids.urun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-STOK-URUN",
      ad: "IT Stok Akış Ürünü",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
    },
    {
      id: ids.hammaddeAktif,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: "IT-STOK-HM-A",
      ad: "IT Stok Takip Aktif Hammadde",
      birim: "kg",
      stok: "100.0000",
      kritik_stok: "0.0000",
      rezerve_stok: "0.0000",
      stok_takip_aktif: 1,
      kdv_orani: "20.00",
    },
    {
      id: ids.hammaddeKapali,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: "IT-STOK-HM-K",
      ad: "IT Stok Takip Kapalı Hammadde",
      birim: "kg",
      stok: "5.0000",
      kritik_stok: "0.0000",
      rezerve_stok: "0.0000",
      stok_takip_aktif: 0,
      kdv_orani: "20.00",
    },
  ]);
  await db.insert(urunOperasyonlari).values({
    id: ids.urunOperasyon,
    urun_id: ids.urun,
    sira: 1,
    operasyon_adi: "IT Stok Baskı",
    hazirlik_suresi_dk: 10,
    cevrim_suresi_sn: "6.00",
    montaj: 0,
  });
  await db.insert(receteler).values({
    id: ids.recete,
    kod: "IT-STOK-REC",
    ad: "IT Stok Akış Reçetesi",
    urun_id: ids.urun,
    hedef_miktar: "1.0000",
  });
  await db.insert(receteKalemleri).values([
    {
      id: ids.receteKalemAktif,
      recete_id: ids.recete,
      urun_id: ids.hammaddeAktif,
      miktar: "2.0000",
      fire_orani: "0.00",
      sira: 1,
    },
    {
      id: ids.receteKalemKapali,
      recete_id: ids.recete,
      urun_id: ids.hammaddeKapali,
      miktar: "3.0000",
      fire_orani: "0.00",
      sira: 2,
    },
  ]);
}

async function getStockRows() {
  const rows = await db
    .select({
      id: urunler.id,
      stok: urunler.stok,
      rezerveStok: urunler.rezerve_stok,
      stokTakipAktif: urunler.stok_takip_aktif,
    })
    .from(urunler)
    .where(inArray(urunler.id, [ids.hammaddeAktif, ids.hammaddeKapali]));
  return new Map(rows.map((row) => [row.id, row]));
}

describeIntegration("stok ve hareket DB integration", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("reserves, consumes and returns stock while recording movements for stock tracking disabled materials", async () => {
    const created = await repoCreate({
      emirNo,
      urunId: ids.urun,
      planlananMiktar: 10,
      uretilenMiktar: 0,
      durum: "atanmamis",
    });
    const emirId = created.row.id;

    let stockRows = await getStockRows();
    expect(Number(stockRows.get(ids.hammaddeAktif)?.stok)).toBe(100);
    expect(Number(stockRows.get(ids.hammaddeAktif)?.rezerveStok)).toBe(20);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.stok)).toBe(5);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.rezerveStok)).toBe(0);

    let rezervasyonlar = await db
      .select()
      .from(hammaddeRezervasyonlari)
      .where(eq(hammaddeRezervasyonlari.uretim_emri_id, emirId));
    expect(rezervasyonlar.map((row) => ({
      urunId: row.urun_id,
      miktar: Number(row.miktar),
      durum: row.durum,
    })).sort((a, b) => a.urunId.localeCompare(b.urunId))).toEqual([
      { urunId: ids.hammaddeAktif, miktar: 20, durum: "rezerve" },
      { urunId: ids.hammaddeKapali, miktar: 30, durum: "rezerve" },
    ].sort((a, b) => a.urunId.localeCompare(b.urunId)));

    const [emirOperasyon] = await db
      .select()
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.uretim_emri_id, emirId))
      .limit(1);
    await repoAtaOperasyon({ emirOperasyonId: emirOperasyon.id, makineId: ids.makine });

    stockRows = await getStockRows();
    expect(Number(stockRows.get(ids.hammaddeAktif)?.stok)).toBe(80);
    expect(Number(stockRows.get(ids.hammaddeAktif)?.rezerveStok)).toBe(0);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.stok)).toBe(5);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.rezerveStok)).toBe(0);

    rezervasyonlar = await db
      .select()
      .from(hammaddeRezervasyonlari)
      .where(eq(hammaddeRezervasyonlari.uretim_emri_id, emirId));
    expect(new Set(rezervasyonlar.map((row) => row.durum))).toEqual(new Set(["tamamlandi"]));

    let hareketRows = await db.select().from(hareketler).where(eq(hareketler.referans_id, emirId));
    expect(hareketRows.map((row) => ({
      urunId: row.urun_id,
      hareketTipi: row.hareket_tipi,
      miktar: Number(row.miktar),
    })).sort((a, b) => `${a.urunId}-${a.miktar}`.localeCompare(`${b.urunId}-${b.miktar}`))).toEqual([
      { urunId: ids.hammaddeAktif, hareketTipi: "cikis", miktar: -20 },
      { urunId: ids.hammaddeKapali, hareketTipi: "cikis", miktar: -30 },
    ].sort((a, b) => `${a.urunId}-${a.miktar}`.localeCompare(`${b.urunId}-${b.miktar}`)));

    const [queueRow] = await db
      .select()
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.uretim_emri_id, emirId))
      .limit(1);
    await repoKuyrukCikar(queueRow.id);

    stockRows = await getStockRows();
    expect(Number(stockRows.get(ids.hammaddeAktif)?.stok)).toBe(100);
    expect(Number(stockRows.get(ids.hammaddeAktif)?.rezerveStok)).toBe(20);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.stok)).toBe(5);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.rezerveStok)).toBe(0);

    rezervasyonlar = await db
      .select()
      .from(hammaddeRezervasyonlari)
      .where(eq(hammaddeRezervasyonlari.uretim_emri_id, emirId));
    expect(new Set(rezervasyonlar.map((row) => row.durum))).toEqual(new Set(["rezerve"]));

    hareketRows = await db.select().from(hareketler).where(eq(hareketler.referans_id, emirId));
    expect(hareketRows.map((row) => ({
      urunId: row.urun_id,
      hareketTipi: row.hareket_tipi,
      miktar: Number(row.miktar),
    })).sort((a, b) => `${a.urunId}-${a.miktar}`.localeCompare(`${b.urunId}-${b.miktar}`))).toEqual([
      { urunId: ids.hammaddeAktif, hareketTipi: "cikis", miktar: -20 },
      { urunId: ids.hammaddeAktif, hareketTipi: "giris", miktar: 20 },
      { urunId: ids.hammaddeKapali, hareketTipi: "cikis", miktar: -30 },
      { urunId: ids.hammaddeKapali, hareketTipi: "giris", miktar: 30 },
    ].sort((a, b) => `${a.urunId}-${a.miktar}`.localeCompare(`${b.urunId}-${b.miktar}`)));
  });

  it("cancels active reservations and restores order state when a deletable production order is deleted", async () => {
    const created = await repoCreate({
      emirNo,
      urunId: ids.urun,
      planlananMiktar: 10,
      uretilenMiktar: 0,
      durum: "atanmamis",
    });
    const emirId = created.row.id;

    let stockRows = await getStockRows();
    expect(Number(stockRows.get(ids.hammaddeAktif)?.rezerveStok)).toBe(20);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.rezerveStok)).toBe(0);

    await repoDelete(emirId);

    stockRows = await getStockRows();
    expect(Number(stockRows.get(ids.hammaddeAktif)?.stok)).toBe(100);
    expect(Number(stockRows.get(ids.hammaddeAktif)?.rezerveStok)).toBe(0);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.stok)).toBe(5);
    expect(Number(stockRows.get(ids.hammaddeKapali)?.rezerveStok)).toBe(0);

    const [emirCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, emirId));
    expect(Number(emirCount.count)).toBe(0);

    const rezervasyonlar = await db
      .select()
      .from(hammaddeRezervasyonlari)
      .where(eq(hammaddeRezervasyonlari.uretim_emri_id, emirId));
    expect(rezervasyonlar).toHaveLength(2);
    expect(new Set(rezervasyonlar.map((row) => row.durum))).toEqual(new Set(["iptal"]));
    expect(rezervasyonlar.map((row) => ({
      urunId: row.urun_id,
      miktar: Number(row.miktar),
    })).sort((a, b) => a.urunId.localeCompare(b.urunId))).toEqual([
      { urunId: ids.hammaddeAktif, miktar: 20 },
      { urunId: ids.hammaddeKapali, miktar: 30 },
    ].sort((a, b) => a.urunId.localeCompare(b.urunId)));
  });
});
