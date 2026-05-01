import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { uretimEmirleri, uretimEmriOperasyonlari } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import { operatorGunlukKayitlari, vardiyaKayitlari } from "../schema";
import { repoGunlukUretimGir } from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  urun: "it-vardiya-urun-00000000000001",
  makine: "it-vardiya-mak-000000000000001",
  emir: "it-vardiya-emir-00000000000001",
  emirOp: "it-vardiya-emop-0000000000001",
  kuyruk: "it-vardiya-kuy-00000000000001",
  vardiya: "it-vardiya-vrd-00000000000001",
  expiredVardiya: "it-vardiya-vrd-expired-0000001",
} as const;

async function cleanup() {
  await db.delete(hareketler).where(eq(hareketler.referans_id, ids.emir));
  await db.delete(operatorGunlukKayitlari).where(eq(operatorGunlukKayitlari.uretim_emri_id, ids.emir));
  await db.delete(vardiyaKayitlari).where(eq(vardiyaKayitlari.makine_id, ids.makine));
  await db.delete(makineKuyrugu).where(eq(makineKuyrugu.id, ids.kuyruk));
  await db.delete(uretimEmriOperasyonlari).where(eq(uretimEmriOperasyonlari.id, ids.emirOp));
  await db.delete(uretimEmirleri).where(eq(uretimEmirleri.id, ids.emir));
  await db.delete(urunler).where(eq(urunler.id, ids.urun));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seed() {
  await db.insert(makineler).values({
    id: ids.makine,
    kod: "IT-VARD-MAK",
    ad: "IT Vardiya Makinesi",
  });
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "urun",
    tedarik_tipi: "uretim",
    kod: "IT-VARD-URUN",
    ad: "IT Vardiya Ürünü",
    birim: "adet",
    stok: "0.0000",
    kritik_stok: "0.0000",
    kdv_orani: "20.00",
    operasyon_tipi: "tek_tarafli",
  });
  await db.insert(uretimEmirleri).values({
    id: ids.emir,
    emir_no: "IT-VARD-001",
    urun_id: ids.urun,
    planlanan_miktar: "100.0000",
    uretilen_miktar: "0.0000",
    durum: "uretimde",
  });
  await db.insert(uretimEmriOperasyonlari).values({
    id: ids.emirOp,
    uretim_emri_id: ids.emir,
    sira: 1,
    operasyon_adi: "IT Vardiya Baskı",
    makine_id: ids.makine,
    hazirlik_suresi_dk: 10,
    cevrim_suresi_sn: "6.00",
    planlanan_miktar: "100.0000",
    durum: "calisiyor",
  });
  await db.insert(makineKuyrugu).values({
    id: ids.kuyruk,
    makine_id: ids.makine,
    uretim_emri_id: ids.emir,
    emir_operasyon_id: ids.emirOp,
    sira: 1,
    planlanan_sure_dk: 10,
    durum: "calisiyor",
  });
  await db.insert(vardiyaKayitlari).values({
    id: ids.vardiya,
    makine_id: ids.makine,
    vardiya_tipi: "gunduz",
    baslangic: new Date("2026-04-30T07:30:00"),
    bitis: new Date("2026-04-30T19:30:00"),
    notlar: "Otomatik kapanmış vardiya",
  });
}

describeIntegration("vardiya DB integration", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("allows production quantity entry on a closed shift", async () => {
    const entry = await repoGunlukUretimGir({
      makineId: ids.makine,
      vardiyaKayitId: ids.vardiya,
      uretilenMiktar: 15,
      fireMiktar: 2,
      birimTipi: "adet",
      notlar: "Kapanan vardiyaya sonradan giriş",
    }, null);

    expect(entry.vardiyaKayitId).toBeUndefined();
    expect(entry.uretimEmriId).toBe(ids.emir);
    expect(entry.makineId).toBe(ids.makine);
    expect(entry.emirOperasyonId).toBe(ids.emirOp);
    expect(entry.ekUretimMiktari).toBe(15);
    expect(entry.fireMiktari).toBe(2);
    expect(entry.netMiktar).toBe(13);
    expect(new Date(entry.kayitTarihi).getHours()).toBe(19);
    expect(new Date(entry.kayitTarihi).getMinutes()).toBe(30);

    const [emir] = await db
      .select({ uretilenMiktar: uretimEmirleri.uretilen_miktar })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, ids.emir))
      .limit(1);
    expect(Number(emir.uretilenMiktar)).toBe(13);

    const [op] = await db
      .select({ uretilenMiktar: uretimEmriOperasyonlari.uretilen_miktar })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, ids.emirOp))
      .limit(1);
    expect(Number(op.uretilenMiktar)).toBe(13);

    const [stock] = await db
      .select({ stok: urunler.stok })
      .from(urunler)
      .where(eq(urunler.id, ids.urun))
      .limit(1);
    expect(Number(stock.stok)).toBe(13);

    const [movementCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hareketler)
      .where(eq(hareketler.referans_id, ids.emir));
    expect(Number(movementCount.count)).toBe(1);
  });

  it("closes an expired open shift before recording a new daily production entry", async () => {
    await db.delete(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, ids.vardiya));

    const expiredStart = new Date();
    expiredStart.setDate(expiredStart.getDate() - 2);
    expiredStart.setHours(7, 30, 0, 0);

    await db.insert(vardiyaKayitlari).values({
      id: ids.expiredVardiya,
      makine_id: ids.makine,
      vardiya_tipi: "gunduz",
      baslangic: expiredStart,
      bitis: null,
      notlar: "Açık kalmış eski vardiya",
    });

    const entry = await repoGunlukUretimGir({
      makineId: ids.makine,
      uretilenMiktar: 8,
      fireMiktar: 1,
      birimTipi: "adet",
      notlar: "Açık kalmış vardiyadan sonra günlük giriş",
    }, null);

    expect(entry.uretimEmriId).toBe(ids.emir);
    expect(entry.makineId).toBe(ids.makine);
    expect(entry.netMiktar).toBe(7);

    const [expiredShift] = await db
      .select({ bitis: vardiyaKayitlari.bitis })
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.id, ids.expiredVardiya))
      .limit(1);
    expect(expiredShift.bitis).not.toBeNull();
    expect(new Date(expiredShift.bitis!).getHours()).toBe(19);
    expect(new Date(expiredShift.bitis!).getMinutes()).toBe(30);

    const [shiftCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.makine_id, ids.makine));
    expect(Number(shiftCount.count)).toBeGreaterThanOrEqual(2);

    const [emir] = await db
      .select({ uretilenMiktar: uretimEmirleri.uretilen_miktar })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, ids.emir))
      .limit(1);
    expect(Number(emir.uretilenMiktar)).toBe(7);
  });
});
