import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import {
  repoGetById as repoGetIsYukuById,
  repoList as repoListIsYukleri,
  repoUpdate as repoUpdateIsYuku,
} from "@/modules/is_yukler/repository";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { hammaddeRezervasyonlari, urunler, urunOperasyonlari } from "@/modules/urunler/schema";
import { repoCreate as repoCreateUretimEmri } from "@/modules/uretim_emirleri/repository";
import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "@/modules/uretim_emirleri/schema";

import { repoAtaOperasyon, repoKuyrukCikar } from "../repository";
import { makineler, makineKuyrugu } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  makine: "it-real-isy-mak-000000000001",
  urun: "it-real-isy-urun-00000000001",
  hammadde: "it-real-isy-hm-000000000001",
  recete: "it-real-isy-rec-00000000001",
  receteKalem: "it-real-isy-rk-000000000001",
  urunOperasyon: "it-real-isy-uop-00000000001",
} as const;

const codes = {
  makine: "IT-REAL-ISY-MAK",
  urun: "IT-REAL-ISY-URUN",
  hammadde: "IT-REAL-ISY-HM",
  recete: "IT-REAL-ISY-REC",
  emirA: "UE-IT-REAL-ISY-A",
  emirB: "UE-IT-REAL-ISY-B",
} as const;

async function getEmirIds() {
  const rows = await db
    .select({ id: uretimEmirleri.id })
    .from(uretimEmirleri)
    .where(inArray(uretimEmirleri.emir_no, [codes.emirA, codes.emirB]));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const emirIds = await getEmirIds();
  if (emirIds.length > 0) {
    await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.uretim_emri_id, emirIds));
    await db.delete(hareketler).where(inArray(hareketler.referans_id, emirIds));
    await db.delete(hammaddeRezervasyonlari).where(inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds));
    await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds));
    await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));
    await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, emirIds));
  }

  await db.delete(hareketler).where(eq(hareketler.urun_id, ids.hammadde));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.recete));
  await db.delete(receteler).where(eq(receteler.id, ids.recete));
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.urun_id, ids.urun));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seed() {
  await db.insert(makineler).values({
    id: ids.makine,
    kod: codes.makine,
    ad: "IT Gerçek İş Yükü Makinesi",
    durum: "aktif",
    is_active: 1,
  });

  await db.insert(urunler).values([
    {
      id: ids.urun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urun,
      ad: "IT Gerçek İş Yükü Ürünü",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
      is_active: 1,
    },
    {
      id: ids.hammadde,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Gerçek İş Yükü Hammaddesi",
      birim: "kg",
      stok: "100.0000",
      kritik_stok: "0.0000",
      rezerve_stok: "0.0000",
      stok_takip_aktif: 1,
      kdv_orani: "20.00",
      is_active: 1,
    },
  ]);

  await db.insert(urunOperasyonlari).values({
    id: ids.urunOperasyon,
    urun_id: ids.urun,
    sira: 1,
    operasyon_adi: "IT Gerçek İş Yükü Baskı",
    hazirlik_suresi_dk: 5,
    cevrim_suresi_sn: "6.00",
    montaj: 0,
    is_active: 1,
  });

  await db.insert(receteler).values({
    id: ids.recete,
    kod: codes.recete,
    ad: "IT Gerçek İş Yükü Reçetesi",
    urun_id: ids.urun,
    hedef_miktar: "1.0000",
    is_active: 1,
  });

  await db.insert(receteKalemleri).values({
    id: ids.receteKalem,
    recete_id: ids.recete,
    urun_id: ids.hammadde,
    miktar: "2.0000",
    fire_orani: "0.00",
    sira: 1,
  });
}

async function getMaterialStock() {
  const [row] = await db
    .select({ stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(eq(urunler.id, ids.hammadde))
    .limit(1);
  return {
    stok: Number(row?.stok ?? 0),
    rezerveStok: Number(row?.rezerveStok ?? 0),
  };
}

async function getEmirDurum(emirId: string) {
  const [row] = await db
    .select({ durum: uretimEmirleri.durum })
    .from(uretimEmirleri)
    .where(eq(uretimEmirleri.id, emirId))
    .limit(1);
  return row?.durum ?? null;
}

async function getOperasyonId(emirId: string) {
  const [row] = await db
    .select({ id: uretimEmriOperasyonlari.id })
    .from(uretimEmriOperasyonlari)
    .where(eq(uretimEmriOperasyonlari.uretim_emri_id, emirId))
    .limit(1);
  if (!row) throw new Error("emir_operasyonu_bulunamadi");
  return row.id;
}

describeIntegration("gerçek veri makine iş yükleri", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("üretim emirlerini kuyruğa atar, sıralar ve kuyruktan çıkarınca stok/rezervasyonu geri alır", async () => {
    const emirA = await repoCreateUretimEmri({
      emirNo: codes.emirA,
      urunId: ids.urun,
      planlananMiktar: 10,
      uretilenMiktar: 0,
      durum: "atanmamis",
    });
    const emirB = await repoCreateUretimEmri({
      emirNo: codes.emirB,
      urunId: ids.urun,
      planlananMiktar: 5,
      uretilenMiktar: 0,
      durum: "atanmamis",
    });

    expect(await getMaterialStock()).toEqual({ stok: 100, rezerveStok: 30 });

    await repoAtaOperasyon({ emirOperasyonId: await getOperasyonId(emirA.row.id), makineId: ids.makine });
    await repoAtaOperasyon({ emirOperasyonId: await getOperasyonId(emirB.row.id), makineId: ids.makine });

    expect(await getMaterialStock()).toEqual({ stok: 70, rezerveStok: 0 });
    expect(await getEmirDurum(emirA.row.id)).toBe("planlandi");
    expect(await getEmirDurum(emirB.row.id)).toBe("planlandi");

    let isYukleri = await repoListIsYukleri({
      makineId: ids.makine,
      tamamlananlariGoster: false,
      limit: 50,
      offset: 0,
    });
    expect(isYukleri.map((row) => ({ emirNo: row.emirNo, sira: row.sira, planlananSureDk: row.planlananSureDk }))).toEqual([
      { emirNo: codes.emirA, sira: 1, planlananSureDk: 1 },
      { emirNo: codes.emirB, sira: 2, planlananSureDk: 1 },
    ]);

    const ikinciIs = isYukleri.find((row) => row.emirNo === codes.emirB);
    expect(ikinciIs).toBeDefined();
    await repoUpdateIsYuku(ikinciIs!.kuyrukId, { sira: 1 });

    isYukleri = await repoListIsYukleri({
      makineId: ids.makine,
      tamamlananlariGoster: false,
      limit: 50,
      offset: 0,
    });
    expect(isYukleri.map((row) => ({ emirNo: row.emirNo, sira: row.sira }))).toEqual([
      { emirNo: codes.emirB, sira: 1 },
      { emirNo: codes.emirA, sira: 2 },
    ]);
    expect(isYukleri.every((row) => Boolean(row.planlananBaslangic && row.planlananBitis))).toBe(true);

    await repoKuyrukCikar(ikinciIs!.kuyrukId);

    expect(await repoGetIsYukuById(ikinciIs!.kuyrukId)).toBeNull();
    expect(await getEmirDurum(emirB.row.id)).toBe("atanmamis");
    expect(await getMaterialStock()).toEqual({ stok: 80, rezerveStok: 10 });

    const kalanIsler = await repoListIsYukleri({
      makineId: ids.makine,
      tamamlananlariGoster: false,
      limit: 50,
      offset: 0,
    });
    expect(kalanIsler.map((row) => ({ emirNo: row.emirNo, sira: row.sira }))).toEqual([
      { emirNo: codes.emirA, sira: 1 },
    ]);
  });
});
