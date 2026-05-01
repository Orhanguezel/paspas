import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { repoGetById as repoGetIsYukuById } from "@/modules/is_yukler/repository";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { uretimEmirleri, uretimEmriOperasyonlari } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import { repoGetById, repoList, repoUpdateById } from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  makine: "it-real-gantt-mak-0000000001",
  urun: "it-real-gantt-urun-000000001",
  emirA: "it-real-gantt-emir-a-0000001",
  emirB: "it-real-gantt-emir-b-0000001",
  opA: "it-real-gantt-op-a-000000001",
  opB: "it-real-gantt-op-b-000000001",
  kuyrukA: "it-real-gantt-kuy-a-00000001",
  kuyrukB: "it-real-gantt-kuy-b-00000001",
} as const;

const codes = {
  makine: "IT-REAL-GANTT-MAK",
  urun: "IT-REAL-GANTT-URUN",
  emirA: "UE-IT-REAL-GANTT-A",
  emirB: "UE-IT-REAL-GANTT-B",
} as const;

async function cleanup() {
  await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.id, [ids.kuyrukA, ids.kuyrukB]));
  await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.id, [ids.opA, ids.opB]));
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.emirA, ids.emirB]));
  await db.delete(urunler).where(eq(urunler.id, ids.urun));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seed() {
  await db.insert(makineler).values({
    id: ids.makine,
    kod: codes.makine,
    ad: "IT Gerçek Gantt Makinesi",
    durum: "aktif",
    is_active: 1,
  });
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "urun",
    tedarik_tipi: "uretim",
    kod: codes.urun,
    ad: "IT Gerçek Gantt Ürünü",
    birim: "adet",
    stok: "0.0000",
    kritik_stok: "0.0000",
    kdv_orani: "20.00",
    operasyon_tipi: "tek_tarafli",
    is_active: 1,
  });
  await db.insert(uretimEmirleri).values([
    {
      id: ids.emirA,
      emir_no: codes.emirA,
      urun_id: ids.urun,
      planlanan_miktar: "10.0000",
      uretilen_miktar: "0.0000",
      termin_tarihi: new Date("2031-08-10"),
      durum: "planlandi",
      is_active: 1,
    },
    {
      id: ids.emirB,
      emir_no: codes.emirB,
      urun_id: ids.urun,
      planlanan_miktar: "5.0000",
      uretilen_miktar: "0.0000",
      termin_tarihi: new Date("2031-08-11"),
      durum: "planlandi",
      is_active: 1,
    },
  ]);
  await db.insert(uretimEmriOperasyonlari).values([
    {
      id: ids.opA,
      uretim_emri_id: ids.emirA,
      sira: 1,
      operasyon_adi: "IT Gantt Baskı A",
      makine_id: ids.makine,
      hazirlik_suresi_dk: 10,
      cevrim_suresi_sn: "6.00",
      planlanan_miktar: "10.0000",
      planlanan_baslangic: new Date("2031-08-01T08:00:00"),
      planlanan_bitis: new Date("2031-08-01T10:00:00"),
      durum: "bekliyor",
    },
    {
      id: ids.opB,
      uretim_emri_id: ids.emirB,
      sira: 1,
      operasyon_adi: "IT Gantt Baskı B",
      makine_id: ids.makine,
      hazirlik_suresi_dk: 10,
      cevrim_suresi_sn: "6.00",
      planlanan_miktar: "5.0000",
      planlanan_baslangic: new Date("2031-08-02T08:00:00"),
      planlanan_bitis: new Date("2031-08-02T10:00:00"),
      durum: "bekliyor",
    },
  ]);
  await db.insert(makineKuyrugu).values([
    {
      id: ids.kuyrukA,
      makine_id: ids.makine,
      uretim_emri_id: ids.emirA,
      emir_operasyon_id: ids.opA,
      sira: 1,
      planlanan_sure_dk: 120,
      hazirlik_suresi_dk: 10,
      planlanan_baslangic: new Date("2031-08-01T08:00:00"),
      planlanan_bitis: new Date("2031-08-01T10:00:00"),
      durum: "bekliyor",
    },
    {
      id: ids.kuyrukB,
      makine_id: ids.makine,
      uretim_emri_id: ids.emirB,
      emir_operasyon_id: ids.opB,
      sira: 2,
      planlanan_sure_dk: 120,
      hazirlik_suresi_dk: 10,
      planlanan_baslangic: new Date("2031-08-02T08:00:00"),
      planlanan_bitis: new Date("2031-08-02T10:00:00"),
      durum: "bekliyor",
    },
  ]);
}

describeIntegration("gerçek veri Gantt planı", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("Gantt tarih değişikliğini makine planı ve iş yükü görünümüne yansıtır", async () => {
    const before = await repoList({
      dateFrom: "2031-08-01",
      dateTo: "2031-08-05",
      makineId: ids.makine,
      limit: 50,
      offset: 0,
    });
    expect(before.total).toBe(2);
    expect(before.items[0]?.items.map((item) => item.emirNo)).toEqual([codes.emirA, codes.emirB]);

    const updated = await repoUpdateById(ids.kuyrukA, {
      baslangicTarihi: "2031-08-04",
      bitisTarihi: "2031-08-04",
    });
    expect(updated?.kuyrukId).toBe(ids.kuyrukA);
    expect(updated?.planlananBaslangicTarihi?.slice(0, 10)).toBe("2031-08-04");
    expect(updated?.planlananBitisTarihi?.slice(0, 10)).toBe("2031-08-04");

    const ganttItem = await repoGetById(ids.kuyrukA);
    expect(ganttItem?.baslangicTarihi?.slice(0, 10)).toBe("2031-08-04");
    expect(ganttItem?.bitisTarihi?.slice(0, 10)).toBe("2031-08-04");

    const isYuku = await repoGetIsYukuById(ids.kuyrukA);
    expect(isYuku?.planlananBaslangic?.slice(0, 10)).toBe("2031-08-04");
    expect(isYuku?.planlananBitis?.slice(0, 10)).toBe("2031-08-04");

    const after = await repoList({
      dateFrom: "2031-08-04",
      dateTo: "2031-08-04",
      makineId: ids.makine,
      limit: 50,
      offset: 0,
    });
    expect(after.items[0]?.items.map((item) => item.kuyrukId)).toContain(ids.kuyrukA);
  });

  it("Gantt tarih değişikliği bağlı üretim emri operasyon tarihlerini de senkronlamalı", async () => {
    await repoUpdateById(ids.kuyrukA, {
      baslangicTarihi: "2031-08-04",
      bitisTarihi: "2031-08-04",
    });

    const [op] = await db
      .select({
        planlananBaslangic: uretimEmriOperasyonlari.planlanan_baslangic,
        planlananBitis: uretimEmriOperasyonlari.planlanan_bitis,
      })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, ids.opA))
      .limit(1);

    expect(op?.planlananBaslangic?.toISOString().slice(0, 10)).toBe("2031-08-04");
    expect(op?.planlananBitis?.toISOString().slice(0, 10)).toBe("2031-08-04");
  });

  it("Gantt aynı makinede çakışan tarih aralığını reddetmeli veya kuyruğu yeniden planlamalı", async () => {
    await expect(
      repoUpdateById(ids.kuyrukA, {
        baslangicTarihi: "2031-08-02",
        bitisTarihi: "2031-08-02",
      }),
    ).rejects.toThrow();
  });
});
