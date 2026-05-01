import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { musteriler } from "@/modules/musteriler/schema";
import { uretimEmirleri, uretimEmriSiparisKalemleri } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoGetSiparisOzetleri,
  repoList,
  repoListIslemler,
  repoUpdate,
} from "../repository";
import { satisSiparisleri, siparisKalemleri } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "44444444-4444-4444-8444-444444444401",
  urunA: "44444444-4444-4444-8444-444444444402",
  urunB: "44444444-4444-4444-8444-444444444403",
  emir: "44444444-4444-4444-8444-444444444404",
  bag: "44444444-4444-4444-8444-444444444405",
} as const;

const codes = {
  musteri: "IT-REAL-SS-MUS",
  urunA: "IT-REAL-SS-URN-A",
  urunB: "IT-REAL-SS-URN-B",
  siparis: "SS-IT-REAL-001",
  siparisGuncel: "SS-IT-REAL-001-G",
  kilitliSiparis: "SS-IT-REAL-KILIT",
} as const;

async function cleanup() {
  const siparisRows = await db
    .select({ id: satisSiparisleri.id })
    .from(satisSiparisleri)
    .where(inArray(satisSiparisleri.siparis_no, [codes.siparis, codes.siparisGuncel, codes.kilitliSiparis]));
  const siparisIds = siparisRows.map((row) => row.id);

  if (siparisIds.length > 0) {
    const kalemRows = await db
      .select({ id: siparisKalemleri.id })
      .from(siparisKalemleri)
      .where(inArray(siparisKalemleri.siparis_id, siparisIds));
    const kalemIds = kalemRows.map((row) => row.id);
    if (kalemIds.length > 0) {
      await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.siparis_kalem_id, kalemIds));
    }
    await db.delete(siparisKalemleri).where(inArray(siparisKalemleri.siparis_id, siparisIds));
    await db.delete(satisSiparisleri).where(inArray(satisSiparisleri.id, siparisIds));
  }

  await db.delete(uretimEmriSiparisKalemleri).where(eq(uretimEmriSiparisKalemleri.id, ids.bag));
  await db.delete(uretimEmirleri).where(eq(uretimEmirleri.id, ids.emir));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urunA, ids.urunB]));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seedBase() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: codes.musteri,
    ad: "IT Gerçek Satış Müşterisi",
    iskonto: "10.00",
    is_active: 1,
  });
  await db.insert(urunler).values([
    {
      id: ids.urunA,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urunA,
      ad: "IT Satış Ürünü A",
      birim: "adet",
      stok: "50.0000",
      kritik_stok: "5.0000",
      kdv_orani: "20.00",
      is_active: 1,
    },
    {
      id: ids.urunB,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urunB,
      ad: "IT Satış Ürünü B",
      birim: "adet",
      stok: "20.0000",
      kritik_stok: "2.0000",
      kdv_orani: "20.00",
      is_active: 1,
    },
  ]);
}

describeIntegration("gerçek veri satış siparişleri", () => {
  beforeEach(async () => {
    await cleanup();
    await seedBase();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("müşteri ve ürünlerle sipariş oluşturur, özetleri hesaplar, düzenler ve siler", async () => {
    const created = await repoCreate({
      siparisNo: codes.siparis,
      musteriId: ids.musteri,
      siparisTarihi: "2031-06-01",
      terminTarihi: "2031-06-10",
      durum: "onaylandi",
      aciklama: "Gerçek satış siparişi smoke",
      ekstraIndirimOrani: 5,
      isActive: true,
      items: [
        { urunId: ids.urunA, miktar: 10, birimFiyat: 100, sira: 1 },
        { urunId: ids.urunB, miktar: 5, birimFiyat: 200, sira: 2 },
      ],
    });

    expect(created.siparis.siparis_no).toBe(codes.siparis);
    expect(created.siparis.musteri_ad).toBe("IT Gerçek Satış Müşterisi");
    expect(created.items).toHaveLength(2);
    expect(created.items.map((item) => item.urun_kod).sort()).toEqual([codes.urunA, codes.urunB].sort());

    const ozet = (await repoGetSiparisOzetleri([created.siparis.id])).get(created.siparis.id);
    expect(ozet?.kalemSayisi).toBe(2);
    expect(ozet?.toplamMiktar).toBe(15);
    expect(ozet?.toplamFiyat).toBe(2052);
    expect(ozet?.kilitli).toBe(false);

    const list = await repoList({
      q: codes.siparis,
      musteriId: ids.musteri,
      durum: "onaylandi",
      isActive: true,
      tamamlananlariGoster: true,
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(list.items.map((item) => item.id)).toContain(created.siparis.id);

    const islemler = await repoListIslemler({
      q: codes.siparis,
      musteriId: ids.musteri,
      gizleTamamlanan: true,
      gorunum: "duz",
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(islemler.items).toHaveLength(2);
    expect(islemler.items.every((item) => item.uretimDurumu === "beklemede")).toBe(true);

    const updated = await repoUpdate(created.siparis.id, {
      siparisNo: codes.siparisGuncel,
      terminTarihi: "2031-06-12",
      durum: "planlandi",
      aciklama: "Güncel satış siparişi",
      ekstraIndirimOrani: 0,
      items: [{ urunId: ids.urunA, miktar: 12, birimFiyat: 110, sira: 1 }],
    });
    expect(updated?.siparis.siparis_no).toBe(codes.siparisGuncel);
    expect(updated?.siparis.durum).toBe("planlandi");
    expect(updated?.items).toHaveLength(1);
    expect(Number(updated?.items[0].miktar)).toBe(12);
    expect(Number(updated?.items[0].birim_fiyat)).toBe(110);

    await repoDelete(created.siparis.id);
    expect(await repoGetById(created.siparis.id)).toBeNull();
  });

  it("üretime aktarılmış kalemde düzenleme ve silme korumasını çalıştırır", async () => {
    const created = await repoCreate({
      siparisNo: codes.kilitliSiparis,
      musteriId: ids.musteri,
      siparisTarihi: "2031-06-02",
      terminTarihi: "2031-06-15",
      durum: "planlandi",
      ekstraIndirimOrani: 0,
      items: [{ urunId: ids.urunA, miktar: 8, birimFiyat: 125, sira: 1 }],
    });
    const kalemId = created.items[0].id;

    await db.insert(uretimEmirleri).values({
      id: ids.emir,
      emir_no: "UE-IT-REAL-SS-001",
      siparis_id: created.siparis.id,
      siparis_kalem_id: kalemId,
      urun_id: ids.urunA,
      planlanan_miktar: "8.0000",
      durum: "atanmamis",
      is_active: 1,
    });
    await db.insert(uretimEmriSiparisKalemleri).values({
      id: ids.bag,
      uretim_emri_id: ids.emir,
      siparis_kalem_id: kalemId,
    });
    await db
      .update(siparisKalemleri)
      .set({ uretim_durumu: "uretime_aktarildi" })
      .where(eq(siparisKalemleri.id, kalemId));

    const ozet = (await repoGetSiparisOzetleri([created.siparis.id])).get(created.siparis.id);
    expect(ozet?.uretimeAktarilanKalemSayisi).toBe(1);
    expect(ozet?.kilitli).toBe(true);

    await expect(
      repoUpdate(created.siparis.id, {
        items: [{ urunId: ids.urunA, miktar: 9, birimFiyat: 125, sira: 1 }],
      }),
    ).rejects.toMatchObject({ message: "siparis_kilitli" });

    await expect(repoDelete(created.siparis.id)).rejects.toMatchObject({ message: "siparis_kilitli" });
  });

  it("üretime aktarılmış sipariş iptali reddedilmeli", async () => {
    const created = await repoCreate({
      siparisNo: codes.kilitliSiparis,
      musteriId: ids.musteri,
      siparisTarihi: "2031-06-03",
      durum: "planlandi",
      ekstraIndirimOrani: 0,
      items: [{ urunId: ids.urunA, miktar: 4, birimFiyat: 100, sira: 1 }],
    });

    await db
      .update(siparisKalemleri)
      .set({ uretim_durumu: "uretime_aktarildi" })
      .where(eq(siparisKalemleri.id, created.items[0].id));

    await expect(repoUpdate(created.siparis.id, { durum: "iptal" })).rejects.toMatchObject({ message: "siparis_kilitli" });
  });
});
