import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { urunler } from "@/modules/urunler/schema";

import { hareketler } from "../schema";
import { repoList } from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  aktifUrun: "it-hrk-aktif-00000000000001",
  pasifUrun: "it-hrk-pasif-00000000000001",
  aktifHareket: "it-hrk-row-aktif-0000000001",
  pasifHareket: "it-hrk-row-pasif-0000000001",
} as const;

async function cleanup() {
  await db.delete(hareketler).where(inArray(hareketler.id, [ids.aktifHareket, ids.pasifHareket]));
  await db.delete(urunler).where(inArray(urunler.id, [ids.aktifUrun, ids.pasifUrun]));
}

async function seed() {
  await db.insert(urunler).values([
    {
      id: ids.aktifUrun,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-HRK-AKTIF",
      ad: "IT Hareket Aktif Stok",
      birim: "kg",
      stok: "0.0000",
      kritik_stok: "0.0000",
      stok_takip_aktif: 1,
      kdv_orani: "20.00",
    },
    {
      id: ids.pasifUrun,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-HRK-PASIF",
      ad: "IT Hareket Takip Kapali",
      birim: "kg",
      stok: "0.0000",
      kritik_stok: "0.0000",
      stok_takip_aktif: 0,
      kdv_orani: "20.00",
    },
  ]);

  await db.insert(hareketler).values([
    {
      id: ids.aktifHareket,
      urun_id: ids.aktifUrun,
      hareket_tipi: "giris",
      referans_tipi: "uretim",
      miktar: "10.0000",
      aciklama: "IT aktif stok hareketi",
    },
    {
      id: ids.pasifHareket,
      urun_id: ids.pasifUrun,
      hareket_tipi: "giris",
      referans_tipi: "uretim",
      miktar: "99.0000",
      aciklama: "IT takip kapali stok hareketi",
    },
  ]);
}

describeIntegration("hareketler DB integration", () => {
  afterAll(async () => {
  });

  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("stok takibi kapalı ürün hareketlerini liste ve özet toplamlarından gizler", async () => {
    const result = await repoList({ limit: 100, offset: 0, sort: "created_at", order: "desc" });

    expect(result.items.map((item) => item.id)).toContain(ids.aktifHareket);
    expect(result.items.map((item) => item.id)).not.toContain(ids.pasifHareket);
    expect(result.summary.toplamGiris).toBe(10);
    expect(result.summary.toplamKayit).toBe(1);

    const byDisabledProduct = await repoList({
      limit: 100,
      offset: 0,
      sort: "created_at",
      order: "desc",
      urunId: ids.pasifUrun,
    });
    expect(byDisabledProduct.items).toHaveLength(0);
    expect(byDisabledProduct.summary.toplamKayit).toBe(0);
  });

  it("stok takibi kapalı hareket kaydı veritabanında durur", async () => {
    const [row] = await db
      .select({ id: hareketler.id })
      .from(hareketler)
      .where(eq(hareketler.id, ids.pasifHareket))
      .limit(1);

    expect(row?.id).toBe(ids.pasifHareket);
  });
});
