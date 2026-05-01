import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { repoCreate as repoCreateMalKabul } from "@/modules/mal_kabul/repository";
import { malKabulKayitlari } from "@/modules/mal_kabul/schema";
import { musteriler } from "@/modules/musteriler/schema";
import { urunler } from "@/modules/urunler/schema";

import {
  repoCreate,
  repoGetById,
  repoList,
  repoUpdate,
} from "../repository";
import { satinAlmaKalemleri, satinAlmaSiparisleri } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  tedarikci: "11111111-1111-4111-8111-111111111201",
  urun: "11111111-1111-4111-8111-111111111202",
} as const;

const codes = {
  tedarikci: "IT-REAL-SA-TED",
  urun: "IT-REAL-SA-HM",
  siparis: "SA-IT-REAL-001",
  siparisGuncel: "SA-IT-REAL-001-G",
} as const;

async function getSiparisIds() {
  const rows = await db
    .select({ id: satinAlmaSiparisleri.id })
    .from(satinAlmaSiparisleri)
    .where(inArray(satinAlmaSiparisleri.siparis_no, [codes.siparis, codes.siparisGuncel]));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const siparisIds = await getSiparisIds();
  const malKabulRows = siparisIds.length > 0
    ? await db
      .select({ id: malKabulKayitlari.id })
      .from(malKabulKayitlari)
      .where(inArray(malKabulKayitlari.satin_alma_siparis_id, siparisIds))
    : [];
  const malKabulIds = malKabulRows.map((row) => row.id);
  if (malKabulIds.length > 0) {
    await db.delete(hareketler).where(inArray(hareketler.referans_id, malKabulIds));
    await db.delete(malKabulKayitlari).where(inArray(malKabulKayitlari.id, malKabulIds));
  }
  if (siparisIds.length > 0) {
    await db.delete(satinAlmaKalemleri).where(inArray(satinAlmaKalemleri.siparis_id, siparisIds));
    await db.delete(satinAlmaSiparisleri).where(inArray(satinAlmaSiparisleri.id, siparisIds));
  }
  await db.delete(hareketler).where(eq(hareketler.urun_id, ids.urun));
  await db.delete(urunler).where(eq(urunler.id, ids.urun));
  await db.delete(musteriler).where(eq(musteriler.id, ids.tedarikci));
}

async function seed() {
  await db.insert(musteriler).values({
    id: ids.tedarikci,
    tur: "tedarikci",
    kod: codes.tedarikci,
    ad: "IT Gerçek Satın Alma Tedarikçisi",
    is_active: 1,
  });
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "hammadde",
    tedarik_tipi: "satin_alma",
    kod: codes.urun,
    ad: "IT Gerçek Satın Alma Hammaddesi",
    birim: "kg",
    stok: "0.0000",
    kritik_stok: "5.0000",
    kdv_orani: "20.00",
    stok_takip_aktif: 1,
    is_active: 1,
  });
}

async function getStock() {
  const [row] = await db
    .select({ stok: urunler.stok })
    .from(urunler)
    .where(eq(urunler.id, ids.urun))
    .limit(1);
  return Number(row?.stok ?? 0);
}

describeIntegration("gerçek veri satın alma", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("sipariş oluşturur, düzenler ve mal kabul bağlantılı durum geçişleriyle iptal korumasını doğrular", async () => {
    const created = await repoCreate({
      siparisNo: codes.siparis,
      tedarikciId: ids.tedarikci,
      siparisTarihi: "2031-10-01",
      terminTarihi: "2031-10-10",
      durum: "taslak",
      aciklama: "IT gerçek satın alma",
      isActive: true,
      items: [{ urunId: ids.urun, miktar: 10, birimFiyat: 12.5, sira: 1 }],
    });

    expect(created.siparis.siparis_no).toBe(codes.siparis);
    expect(created.siparis.tedarikci_ad).toBe("IT Gerçek Satın Alma Tedarikçisi");
    expect(created.items).toHaveLength(1);
    expect(Number(created.items[0]?.miktar)).toBe(10);

    let list = await repoList({
      q: codes.siparis,
      limit: 20,
      offset: 0,
      sort: "siparis_no",
      order: "asc",
    });
    expect(list.items.map((item) => item.id)).toContain(created.siparis.id);

    const updated = await repoUpdate(created.siparis.id, {
      siparisNo: codes.siparisGuncel,
      terminTarihi: "2031-10-12",
      durum: "siparis_verildi",
      aciklama: "IT gerçek satın alma güncel",
      items: [{ urunId: ids.urun, miktar: 12, birimFiyat: 13, sira: 1 }],
    });
    expect(updated?.siparis.siparis_no).toBe(codes.siparisGuncel);
    expect(updated?.siparis.durum).toBe("siparis_verildi");
    expect(Number(updated?.items[0]?.miktar ?? 0)).toBe(12);

    const malKabulKismi = await repoCreateMalKabul({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: created.siparis.id,
      satinAlmaKalemId: updated!.items[0].id,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 5,
      kaliteDurumu: "kabul",
      partiNo: "IT-SA-PARTI-1",
      notlar: "Kısmi kabul",
    }, null);
    expect(malKabulKismi.satinAlmaSiparisId).toBe(created.siparis.id);
    expect(await getStock()).toBe(5);

    let detail = await repoGetById(created.siparis.id);
    expect(detail?.siparis.durum).toBe("kismen_teslim");
    expect(Number(detail?.items[0]?.kabul_miktar ?? 0)).toBe(5);

    const malKabulTamam = await repoCreateMalKabul({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: created.siparis.id,
      satinAlmaKalemId: updated!.items[0].id,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 7,
      kaliteDurumu: "kabul",
      partiNo: "IT-SA-PARTI-2",
      notlar: "Tamamlama kabulü",
    }, null);
    expect(malKabulTamam.satinAlmaKalemId).toBe(updated!.items[0].id);
    expect(await getStock()).toBe(12);

    detail = await repoGetById(created.siparis.id);
    expect(detail?.siparis.durum).toBe("tamamlandi");
    expect(Number(detail?.items[0]?.kabul_miktar ?? 0)).toBe(12);
    expect(Number(detail?.items[0]?.kalanMiktar ?? 0)).toBe(0);

    const hareketRows = await db
      .select({ hareketTipi: hareketler.hareket_tipi, referansTipi: hareketler.referans_tipi, miktar: hareketler.miktar })
      .from(hareketler)
      .where(inArray(hareketler.referans_id, [malKabulKismi.id, malKabulTamam.id]));
    expect(hareketRows.map((row) => ({
      hareketTipi: row.hareketTipi,
      referansTipi: row.referansTipi,
      miktar: Number(row.miktar),
    })).sort((a, b) => a.miktar - b.miktar)).toEqual([
      { hareketTipi: "giris", referansTipi: "mal_kabul", miktar: 5 },
      { hareketTipi: "giris", referansTipi: "mal_kabul", miktar: 7 },
    ]);

    await expect(repoUpdate(created.siparis.id, { durum: "iptal" })).rejects.toThrow("satin_alma_kilitli");
    expect(await getStock()).toBe(12);
  });

  it("mal kabul bağlantısı olan satın alma siparişi iptal edilememeli veya kontrollü iade akışı istemeli", async () => {
    const created = await repoCreate({
      siparisNo: codes.siparis,
      tedarikciId: ids.tedarikci,
      siparisTarihi: "2031-10-01",
      durum: "siparis_verildi",
      items: [{ urunId: ids.urun, miktar: 4, birimFiyat: 10, sira: 1 }],
    });

    await repoCreateMalKabul({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: created.siparis.id,
      satinAlmaKalemId: created.items[0].id,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 4,
      kaliteDurumu: "kabul",
    }, null);

    await expect(repoUpdate(created.siparis.id, { durum: "iptal" })).rejects.toThrow();
  });
});
