import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { repoList as repoListHareketler } from "@/modules/hareketler/repository";
import { urunler } from "@/modules/urunler/schema";

import { repoAdjustStock, repoGetById, repoList } from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  aktifUrun: "it-real-stok-aktif-000000001",
  kapaliUrun: "it-real-stok-kapali-0000001",
} as const;

async function cleanup() {
  await db.delete(hareketler).where(inArray(hareketler.urun_id, [ids.aktifUrun, ids.kapaliUrun]));
  await db.delete(urunler).where(inArray(urunler.id, [ids.aktifUrun, ids.kapaliUrun]));
}

async function seed() {
  await db.insert(urunler).values([
    {
      id: ids.aktifUrun,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: "IT-REAL-STOK-AKTIF",
      ad: "IT Gerçek Stok Aktif",
      birim: "kg",
      stok: "10.0000",
      kritik_stok: "5.0000",
      rezerve_stok: "2.0000",
      stok_takip_aktif: 1,
      kdv_orani: "20.00",
      is_active: 1,
    },
    {
      id: ids.kapaliUrun,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: "IT-REAL-STOK-KAPALI",
      ad: "IT Gerçek Stok Takip Kapalı",
      birim: "kg",
      stok: "99.0000",
      kritik_stok: "0.0000",
      rezerve_stok: "0.0000",
      stok_takip_aktif: 0,
      kdv_orani: "20.00",
      is_active: 1,
    },
  ]);
  await db.insert(hareketler).values({
    id: "it-real-stok-kapali-hrk-0001",
    urun_id: ids.kapaliUrun,
    hareket_tipi: "giris",
    referans_tipi: "uretim",
    miktar: "99.0000",
    aciklama: "Takip kapalı ürün DB hareketi",
  });
}

describeIntegration("gerçek veri stoklar", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("manuel stok düzeltmesini ürün stoku, hareket kaydı ve liste görünürlüğüyle doğrular", async () => {
    const adjusted = await repoAdjustStock(ids.aktifUrun, {
      miktarDegisimi: 7,
      aciklama: "IT gerçek stok düzeltme",
    }, null);

    expect(Number(adjusted?.stok ?? 0)).toBe(17);
    expect(Number(adjusted?.rezerve_stok ?? 0)).toBe(2);

    const stockRow = await repoGetById(ids.aktifUrun);
    expect(Number(stockRow?.stok ?? 0)).toBe(17);

    await expect(repoAdjustStock(ids.aktifUrun, {
      miktarDegisimi: -999,
      aciklama: "Negatif stok engeli",
    }, null)).rejects.toThrow("negative_stock_not_allowed");
    expect(Number((await repoGetById(ids.aktifUrun))?.stok ?? 0)).toBe(17);

    const stokList = await repoList({
      q: "IT-REAL-STOK",
      limit: 100,
      offset: 0,
      sort: "kod",
      order: "asc",
    });
    expect(stokList.items.map((item) => item.id)).toContain(ids.aktifUrun);
    expect(stokList.items.map((item) => item.id)).not.toContain(ids.kapaliUrun);

    expect(await repoGetById(ids.kapaliUrun)).toBeNull();

    const hareketList = await repoListHareketler({
      limit: 100,
      offset: 0,
      sort: "created_at",
      order: "desc",
      urunId: ids.aktifUrun,
    });
    expect(hareketList.items).toHaveLength(1);
    expect(hareketList.items[0]).toMatchObject({
      urun_id: ids.aktifUrun,
      hareket_tipi: "duzeltme",
      referans_tipi: "stok_duzeltme",
    });
    expect(Number(hareketList.items[0].miktar)).toBe(7);
    expect(hareketList.summary.duzeltmeAdet).toBe(1);

    const kapaliHareketList = await repoListHareketler({
      limit: 100,
      offset: 0,
      sort: "created_at",
      order: "desc",
      urunId: ids.kapaliUrun,
    });
    expect(kapaliHareketList.items).toHaveLength(0);
    expect(kapaliHareketList.summary.toplamKayit).toBe(0);
  });
});
