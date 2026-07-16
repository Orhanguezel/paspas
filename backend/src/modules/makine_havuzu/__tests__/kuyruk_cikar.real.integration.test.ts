import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { uretimEmirleri } from "@/modules/uretim_emirleri/schema";
import { urunler } from "@/modules/urunler/schema";

import { repoKuyrukCikar } from "../repository";
import { makineler, makineKuyrugu } from "../schema";

const describeIntegration = process.env.RUN_DB_INTEGRATION === "1" ? describe : describe.skip;
const makineId = "it-kuy-cikar-makine-000000000001";
const urunId = "it-kuy-cikar-urun-0000000000001";
const emirIds = Array.from({ length: 12 }, (_, i) => `it-kuy-cikar-emir-${String(i + 1).padStart(2, "0")}`);
const kuyrukIds = Array.from({ length: 12 }, (_, i) => `it-kuy-cikar-row-${String(i + 1).padStart(2, "0")}`);

async function cleanup() {
  await db.delete(makineKuyrugu).where(eq(makineKuyrugu.makine_id, makineId));
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, emirIds));
  await db.delete(urunler).where(eq(urunler.id, urunId));
  await db.delete(makineler).where(eq(makineler.id, makineId));
}

async function seed(count: number) {
  await db.insert(makineler).values({
    id: makineId,
    kod: "IT-KUY-CIKAR",
    ad: "IT Kuyruk Cikar Makinesi",
    durum: "aktif",
    is_active: 1,
  });
  await db.insert(urunler).values({
    id: urunId,
    kategori: "urun",
    tedarik_tipi: "uretim",
    kod: "IT-KUY-CIKAR-URUN",
    ad: "IT Kuyruk Cikar Urunu",
    birim: "adet",
    kritik_stok: "0.0000",
    kdv_orani: "20.00",
  });
  await db.insert(uretimEmirleri).values(
    emirIds.slice(0, count).map((id, index) => ({
      id,
      emir_no: `UE-IT-CIKAR-${index + 1}`,
      urun_id: urunId,
      mamul_urun_id: urunId,
      planlanan_miktar: "10.0000",
      durum: "planlandi",
    })),
  );
  await db.insert(makineKuyrugu).values(
    kuyrukIds.slice(0, count).map((id, index) => ({
      id,
      makine_id: makineId,
      uretim_emri_id: emirIds[index],
      sira: index + 1,
      planlanan_sure_dk: 30,
      durum: "bekliyor",
    })),
  );
}

async function siralar() {
  const rows = await db
    .select({ sira: makineKuyrugu.sira })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.makine_id, makineId))
    .orderBy(asc(makineKuyrugu.sira));
  return rows.map((row) => row.sira);
}

describeIntegration("makine havuzu — kuyruktan çakışmasız çıkarma", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it("beş kaydın ortasından sıra 2'yi çıkarıp kesintisiz sıralar", async () => {
    await seed(5);
    await repoKuyrukCikar(kuyrukIds[1]);
    expect(await siralar()).toEqual([1, 2, 3, 4]);
  });

  it("yeni sıra 2 dahil art arda iki kaydı çıkarır", async () => {
    await seed(5);
    await repoKuyrukCikar(kuyrukIds[1]);
    await repoKuyrukCikar(kuyrukIds[2]);
    expect(await siralar()).toEqual([1, 2, 3]);
  });

  it("on iki kayıtlı uzun kuyruğun ortasından çakışmadan çıkarır", async () => {
    await seed(12);
    await repoKuyrukCikar(kuyrukIds[5]);
    expect(await siralar()).toEqual(Array.from({ length: 11 }, (_, index) => index + 1));
  });
});
