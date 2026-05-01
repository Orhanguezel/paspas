import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { makineler } from "@/modules/makine_havuzu/schema";
import { kaliplar } from "@/modules/tanimlar/schema";

import { repoListOperasyonlar, repoListOperasyonMakineleri, repoPatchOperasyon } from "../repository";
import { urunler, urunOperasyonlari, urunOperasyonMakineleri } from "../schema";
import { syncBagliAsilUrunOperasyonlariFromYariMamul } from "../service";

// NODE_ENV=test zorunluğu: izole `promats_erp_test` DB'sini kullanmak için.
// `bun run test` paket script'i bu env'i set eder; manuel `bun test` çağrısında
// canlı DB'yi korumak için skip'e düşer.
const isTestEnv = process.env.NODE_ENV === "test";
const allowDbIntegration = isTestEnv || process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = allowDbIntegration ? describe : describe.skip;

const ids = {
  asil1: "it-oym-asil-0001-000000000001",
  asil2: "it-oym-asil-0002-000000000002",
  oym: "it-oym-kaynak-0001-0000000001",
  recete1: "it-oym-recet-0001-0000000001",
  recete2: "it-oym-recet-0002-0000000002",
  kalem1: "it-oym-kalem-0001-0000000001",
  kalem2: "it-oym-kalem-0002-0000000002",
  oymOp: "it-oym-op-src-001-0000000001",
  asil1StaleOp: "it-oym-op-old-001-0000000001",
  asil2StaleOp: "it-oym-op-old-002-0000000002",
  oldKalip: "it-oym-kalip-old-000000000001",
  newKalip: "it-oym-kalip-new-000000000001",
  machineA: "it-oym-mak-a-0001-00000000001",
  machineB: "it-oym-mak-b-0001-00000000001",
  staleMachine: "it-oym-mak-old-01-00000000001",
  oymMachineA: "it-oym-map-src-a-000000000001",
  oymMachineB: "it-oym-map-src-b-000000000001",
  staleMap1: "it-oym-map-old-001-0000000001",
  staleMap2: "it-oym-map-old-002-0000000002",
} as const;

async function cleanup() {
  const urunIds = [ids.asil1, ids.asil2, ids.oym];
  const receteIds = [ids.recete1, ids.recete2];
  const machineIds = [ids.machineA, ids.machineB, ids.staleMachine];
  const kalipIds = [ids.oldKalip, ids.newKalip];

  await db.execute(sql`
    DELETE FROM ${urunOperasyonMakineleri}
    WHERE ${urunOperasyonMakineleri.urun_operasyon_id} IN (
      SELECT ${urunOperasyonlari.id} FROM ${urunOperasyonlari}
      WHERE ${urunOperasyonlari.urun_id} IN (${sql.join(urunIds.map((id) => sql`${id}`), sql`, `)})
    )
    OR ${urunOperasyonMakineleri.makine_id} IN (${sql.join(machineIds.map((id) => sql`${id}`), sql`, `)})
  `);
  await db.delete(urunOperasyonlari).where(inArray(urunOperasyonlari.urun_id, urunIds));
  await db.delete(receteKalemleri).where(inArray(receteKalemleri.recete_id, receteIds));
  await db.delete(receteler).where(inArray(receteler.id, receteIds));
  await db.delete(urunler).where(inArray(urunler.id, urunIds));
  await db.delete(makineler).where(inArray(makineler.id, machineIds));
  await db.delete(kaliplar).where(inArray(kaliplar.id, kalipIds));
}

async function seed() {
  await db.insert(kaliplar).values([
    { id: ids.oldKalip, kod: "IT-OYM-KALIP-OLD", ad: "IT OYM Eski Kalıp" },
    { id: ids.newKalip, kod: "IT-OYM-KALIP-NEW", ad: "IT OYM Yeni Kalıp" },
  ]);
  await db.insert(makineler).values([
    { id: ids.machineA, kod: "IT-OYM-MAK-A", ad: "IT OYM Makine A" },
    { id: ids.machineB, kod: "IT-OYM-MAK-B", ad: "IT OYM Makine B" },
    { id: ids.staleMachine, kod: "IT-OYM-MAK-OLD", ad: "IT OYM Eski Makine" },
  ]);
  await db.insert(urunler).values([
    {
      id: ids.asil1,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-OYM-ASIL-1",
      ad: "IT OYM Ana Ürün 1",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
    },
    {
      id: ids.asil2,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-OYM-ASIL-2",
      ad: "IT OYM Ana Ürün 2",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
    },
    {
      id: ids.oym,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-OYM-KAYNAK",
      ad: "IT OYM Kaynak",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
  ]);
  await db.insert(receteler).values([
    { id: ids.recete1, kod: "IT-OYM-RECETE-1", ad: "IT OYM Ana Ürün 1 Reçetesi", urun_id: ids.asil1 },
    { id: ids.recete2, kod: "IT-OYM-RECETE-2", ad: "IT OYM Ana Ürün 2 Reçetesi", urun_id: ids.asil2 },
  ]);
  await db.insert(receteKalemleri).values([
    { id: ids.kalem1, recete_id: ids.recete1, urun_id: ids.oym, miktar: "1.0000", fire_orani: "0.00", sira: 1 },
    { id: ids.kalem2, recete_id: ids.recete2, urun_id: ids.oym, miktar: "1.0000", fire_orani: "0.00", sira: 1 },
  ]);
  await db.insert(urunOperasyonlari).values([
    {
      id: ids.oymOp,
      urun_id: ids.oym,
      sira: 1,
      operasyon_adi: "IT OYM Eski Operasyon",
      kalip_id: ids.oldKalip,
      hazirlik_suresi_dk: 10,
      cevrim_suresi_sn: "5.00",
      montaj: 0,
    },
    {
      id: ids.asil1StaleOp,
      urun_id: ids.asil1,
      sira: 1,
      operasyon_adi: "Silinmesi Gereken Operasyon 1",
      kalip_id: ids.oldKalip,
      hazirlik_suresi_dk: 1,
      cevrim_suresi_sn: "1.00",
      montaj: 0,
    },
    {
      id: ids.asil2StaleOp,
      urun_id: ids.asil2,
      sira: 1,
      operasyon_adi: "Silinmesi Gereken Operasyon 2",
      kalip_id: ids.oldKalip,
      hazirlik_suresi_dk: 1,
      cevrim_suresi_sn: "1.00",
      montaj: 0,
    },
  ]);
  await db.insert(urunOperasyonMakineleri).values([
    { id: ids.staleMap1, urun_operasyon_id: ids.asil1StaleOp, makine_id: ids.staleMachine, oncelik_sira: 1 },
    { id: ids.staleMap2, urun_operasyon_id: ids.asil2StaleOp, makine_id: ids.staleMachine, oncelik_sira: 1 },
  ]);
}

describeIntegration("operasyonel YM DB integration", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("rewrites all linked main product operations after an operasyonel YM operation update", async () => {
    await repoPatchOperasyon(ids.oymOp, {
      operasyonAdi: "IT OYM Güncel Baskı",
      kalipId: ids.newKalip,
      hazirlikSuresiDk: 35,
      cevrimSuresiSn: 14.75,
      montaj: true,
      makineler: [
        { makineId: ids.machineB, oncelikSira: 1 },
        { makineId: ids.machineA, oncelikSira: 2 },
      ],
    });

    const syncedIds = await syncBagliAsilUrunOperasyonlariFromYariMamul(ids.oym);
    expect(new Set(syncedIds)).toEqual(new Set([ids.asil1, ids.asil2]));

    for (const asilUrunId of [ids.asil1, ids.asil2]) {
      const operations = await repoListOperasyonlar(asilUrunId);
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        urun_id: asilUrunId,
        sira: 1,
        operasyon_adi: "IT OYM Güncel Baskı",
        kalip_id: ids.newKalip,
        hazirlik_suresi_dk: 35,
        montaj: 1,
      });
      expect(Number(operations[0].cevrim_suresi_sn)).toBe(14.75);
      expect(operations[0].id).not.toBe(ids.asil1StaleOp);
      expect(operations[0].id).not.toBe(ids.asil2StaleOp);

      const machineMap = await repoListOperasyonMakineleri([operations[0].id]);
      expect(machineMap.get(operations[0].id)?.map((item) => ({
        makineId: item.makineId,
        oncelikSira: item.oncelikSira,
      }))).toEqual([
        { makineId: ids.machineB, oncelikSira: 1 },
        { makineId: ids.machineA, oncelikSira: 2 },
      ]);
    }
  });
});
