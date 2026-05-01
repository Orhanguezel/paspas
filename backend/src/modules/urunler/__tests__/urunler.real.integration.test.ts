import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import {
  repoCreate as repoCreateRecete,
  repoGetByUrunId as repoGetReceteByUrunId,
} from "@/modules/receteler/repository";

import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoList,
  repoListOperasyonlar,
  repoUpdate,
} from "../repository";
import { urunler, urunOperasyonlari } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const codes = {
  hammadde: "IT-REAL-HM-001",
  operasyonelYm: "IT-REAL-OYM-001",
  anaUrun: "IT-REAL-URN-001",
  bagimliUrun: "IT-REAL-BAG-001",
} as const;

async function findProductIds(): Promise<string[]> {
  const rows = await db
    .select({ id: urunler.id })
    .from(urunler)
    .where(inArray(urunler.kod, Object.values(codes)));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const ids = await findProductIds();
  if (ids.length === 0) return;

  const recipeRows = await db
    .select({ id: receteler.id })
    .from(receteler)
    .where(inArray(receteler.urun_id, ids));
  const recipeIds = recipeRows.map((row) => row.id);

  await db.delete(receteKalemleri).where(inArray(receteKalemleri.urun_id, ids));
  if (recipeIds.length > 0) {
    await db.delete(receteKalemleri).where(inArray(receteKalemleri.recete_id, recipeIds));
    await db.delete(receteler).where(inArray(receteler.id, recipeIds));
  }
  await db.delete(urunOperasyonlari).where(inArray(urunOperasyonlari.urun_id, ids));
  await db.delete(urunler).where(inArray(urunler.id, ids));
}

describeIntegration("gerçek veri ürün operasyonları", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("hammadde oluşturur, düzenler, pasifleştirir ve bağlantı yokken siler", async () => {
    const created = await repoCreate({
      kategori: "hammadde",
      tedarikTipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Gerçek Hammadde",
      birim: "kg",
      stok: 125,
      kritikStok: 15,
      stokTakipAktif: true,
      birimFiyat: 42.5,
      kdvOrani: 20,
      isActive: true,
    });

    let row = await repoGetById(created.id);
    expect(row?.kod).toBe(codes.hammadde);
    expect(row?.kategori).toBe("hammadde");
    expect(Number(row?.stok)).toBe(125);
    expect(row?.stok_takip_aktif).toBe(1);

    row = await repoUpdate(created.id, {
      ad: "IT Gerçek Hammadde Güncel",
      stok: 130,
      kritikStok: 20,
      stokTakipAktif: false,
      isActive: false,
    });
    expect(row?.ad).toBe("IT Gerçek Hammadde Güncel");
    expect(Number(row?.stok)).toBe(130);
    expect(Number(row?.kritik_stok)).toBe(20);
    expect(row?.stok_takip_aktif).toBe(0);
    expect(row?.is_active).toBe(0);

    const passiveList = await repoList({
      q: "IT Gerçek Hammadde Güncel",
      kategori: "hammadde",
      isActive: false,
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(passiveList.items.map((item) => item.id)).toContain(created.id);

    await repoDelete(created.id);
    expect(await repoGetById(created.id)).toBeNull();
  });

  it("Operasyonel YM oluşturur ve operasyon bilgilerini kaydeder", async () => {
    const created = await repoCreate({
      kategori: "operasyonel_ym",
      tedarikTipi: "uretim",
      kod: codes.operasyonelYm,
      ad: "IT Gerçek Operasyonel YM",
      birim: "adet",
      stok: 0,
      kritikStok: 0,
      stokTakipAktif: false,
      kdvOrani: 20,
      operasyonTipi: "tek_tarafli",
      operasyonlar: [
        {
          operasyonAdi: "IT Gerçek Baskı",
          sira: 1,
          hazirlikSuresiDk: 12,
          cevrimSuresiSn: 4.5,
          montaj: false,
        },
      ],
    });

    const ops = await repoListOperasyonlar(created.id);
    expect(ops).toHaveLength(1);
    expect(ops[0].operasyon_adi).toBe("IT Gerçek Baskı");
    expect(ops[0].hazirlik_suresi_dk).toBe(12);
    expect(Number(ops[0].cevrim_suresi_sn)).toBe(4.5);
    expect((await repoGetById(created.id))?.stok_takip_aktif).toBe(0);
  });

  it("ana ürün reçetesine Operasyonel YM ve hammadde bağlar", async () => {
    const hammadde = await repoCreate({
      kategori: "hammadde",
      tedarikTipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Reçete Hammaddesi",
      birim: "kg",
      stok: 50,
      kritikStok: 5,
      stokTakipAktif: true,
      kdvOrani: 20,
    });
    const operasyonelYm = await repoCreate({
      kategori: "operasyonel_ym",
      tedarikTipi: "uretim",
      kod: codes.operasyonelYm,
      ad: "IT Reçete OYM",
      birim: "adet",
      stok: 0,
      kritikStok: 0,
      stokTakipAktif: false,
      kdvOrani: 20,
      operasyonTipi: "tek_tarafli",
      operasyonlar: [{ operasyonAdi: "IT Reçete Baskı", sira: 1, hazirlikSuresiDk: 10, cevrimSuresiSn: 5, montaj: false }],
    });
    const anaUrun = await repoCreate({
      kategori: "urun",
      tedarikTipi: "uretim",
      kod: codes.anaUrun,
      ad: "IT Reçeteli Ana Ürün",
      birim: "adet",
      stok: 0,
      kritikStok: 0,
      stokTakipAktif: true,
      kdvOrani: 20,
      operasyonTipi: "tek_tarafli",
    });

    await repoCreateRecete({
      kod: "IT-REAL-REC-001",
      ad: "IT Gerçek Ürün Reçetesi",
      urunId: anaUrun.id,
      hedefMiktar: 1,
      items: [
        { urunId: operasyonelYm.id, miktar: 1, fireOrani: 0, sira: 1 },
        { urunId: hammadde.id, miktar: 2.5, fireOrani: 3, sira: 2 },
      ],
    });

    const detail = await repoGetReceteByUrunId(anaUrun.id);
    expect(detail?.items).toHaveLength(2);
    expect(detail?.items.map((item) => item.malzemeKod).sort()).toEqual([codes.hammadde, codes.operasyonelYm].sort());
    const hmItem = detail?.items.find((item) => item.urun_id === hammadde.id);
    expect(Number(hmItem?.miktar)).toBe(2.5);
    expect(Number(hmItem?.fire_orani)).toBe(3);
  });

  it("başka ürün reçetesinde kullanılan ürünü silmeye izin vermez", async () => {
    const hammadde = await repoCreate({
      kategori: "hammadde",
      tedarikTipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Bağımlı Hammadde",
      birim: "kg",
      stok: 10,
      kritikStok: 1,
      stokTakipAktif: true,
      kdvOrani: 20,
    });
    const bagimliUrun = await repoCreate({
      kategori: "urun",
      tedarikTipi: "uretim",
      kod: codes.bagimliUrun,
      ad: "IT Bağımlı Ana Ürün",
      birim: "adet",
      stok: 0,
      kritikStok: 0,
      stokTakipAktif: true,
      kdvOrani: 20,
      operasyonTipi: "tek_tarafli",
    });
    await repoCreateRecete({
      kod: "IT-REAL-BAG-REC-001",
      ad: "IT Bağımlılık Reçetesi",
      urunId: bagimliUrun.id,
      hedefMiktar: 1,
      items: [{ urunId: hammadde.id, miktar: 1, fireOrani: 0, sira: 1 }],
    });

    await expect(repoDelete(hammadde.id)).rejects.toMatchObject({ message: "urun_bagimliligi_var" });
    expect(await repoGetById(hammadde.id)).not.toBeNull();
  });
});
