import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { uretimEmirleri } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import { makineler, makineKuyrugu } from "../schema";
import { repoKuyrukSirala } from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  makineA: "it-kuy-mak-a-00000000000001",
  makineB: "it-kuy-mak-b-00000000000001",
  urunA: "it-kuy-urun-a-0000000000001",
  urunB: "it-kuy-urun-b-0000000000001",
  emirA: "it-kuy-emir-a-0000000000001",
  emirB: "it-kuy-emir-b-0000000000001",
  kuyrukA: "it-kuy-row-a-00000000000001",
  kuyrukB: "it-kuy-row-b-00000000000001",
} as const;

async function cleanup() {
  await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.id, [ids.kuyrukA, ids.kuyrukB]));
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.emirA, ids.emirB]));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urunA, ids.urunB]));
  await db.delete(makineler).where(inArray(makineler.id, [ids.makineA, ids.makineB]));
}

async function seed() {
  await db.insert(makineler).values([
    {
      id: ids.makineA,
      kod: "IT-KUY-A",
      ad: "IT Kuyruk Makine A",
      durum: "aktif",
      is_active: 1,
    },
    {
      id: ids.makineB,
      kod: "IT-KUY-B",
      ad: "IT Kuyruk Makine B",
      durum: "aktif",
      is_active: 1,
    },
  ]);

  await db.insert(urunler).values([
    {
      id: ids.urunA,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-KUY-URUN-A",
      ad: "IT Kuyruk Urun A",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.urunB,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-KUY-URUN-B",
      ad: "IT Kuyruk Urun B",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
  ]);

  await db.insert(uretimEmirleri).values([
    {
      id: ids.emirA,
      emir_no: "UE-IT-KUY-A",
      urun_id: ids.urunA,
      planlanan_miktar: "10.0000",
      durum: "makineye_atandi",
    },
    {
      id: ids.emirB,
      emir_no: "UE-IT-KUY-B",
      urun_id: ids.urunB,
      planlanan_miktar: "10.0000",
      durum: "makineye_atandi",
    },
  ]);

  await db.insert(makineKuyrugu).values([
    {
      id: ids.kuyrukA,
      makine_id: ids.makineA,
      uretim_emri_id: ids.emirA,
      sira: 0,
      planlanan_sure_dk: 30,
      durum: "bekliyor",
    },
    {
      id: ids.kuyrukB,
      makine_id: ids.makineB,
      uretim_emri_id: ids.emirB,
      sira: 0,
      planlanan_sure_dk: 30,
      durum: "bekliyor",
    },
  ]);
}

async function getSira(kuyrukId: string) {
  const [row] = await db
    .select({ sira: makineKuyrugu.sira })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, kuyrukId))
    .limit(1);
  return row?.sira ?? null;
}

describeIntegration("makine havuzu — kuyruk sıralama", () => {
  afterAll(async () => {
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("başka makinenin kuyruk satırı aynı sürükle-bırak isteğinde reddedilir", async () => {
    await seed();

    await expect(
      repoKuyrukSirala({
        makineId: ids.makineA,
        siralar: [
          { kuyruguId: ids.kuyrukA, sira: 1 },
          { kuyruguId: ids.kuyrukB, sira: 0 },
        ],
      }),
    ).rejects.toThrow("kuyruk_makine_uyumsuz");

    expect(await getSira(ids.kuyrukA)).toBe(0);
    expect(await getSira(ids.kuyrukB)).toBe(0);
  });
});
