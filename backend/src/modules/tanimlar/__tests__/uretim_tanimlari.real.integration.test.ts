import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import {
  repoCreate as repoCreateMakine,
  repoDelete as repoDeleteMakine,
  repoGetById as repoGetMakineById,
  repoList as repoListMakineler,
  repoUpdate as repoUpdateMakine,
} from "@/modules/makine_havuzu/repository";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { uretimEmirleri, uretimEmriOperasyonlari } from "@/modules/uretim_emirleri/schema";
import { urunler, urunOperasyonlari } from "@/modules/urunler/schema";

import {
  repoCreateBirim,
  repoCreateDurusNedeni,
  repoCreateKalip,
  repoDeleteBirim,
  repoDeleteDurusNedeni,
  repoDeleteKalip,
  repoGetBirimById,
  repoGetDurusNedeniById,
  repoGetKalipById,
  repoListUyumluMakineler,
  repoSetUyumluMakineler,
  repoUpdateBirim,
  repoUpdateDurusNedeni,
  repoUpdateKalip,
} from "../repository";
import { birimler, durusNedenleri, kaliplar, kalipUyumluMakineler } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const codes = {
  kalip: "IT-REAL-KLP-001",
  kalipGuncel: "IT-REAL-KLP-001-G",
  makine: "IT-REAL-MAK-001",
  makineGuncel: "IT-REAL-MAK-001-G",
  durus: "IT-REAL-DUR-001",
  durusGuncel: "IT-REAL-DUR-001-G",
  birim: "IT-REAL-BRM",
  birimGuncel: "IT-REAL-BRMG",
} as const;

const ids = {
  bagliMakine: "it-real-mak-bagli-000000000001",
  bagliKalip: "it-real-klp-bagli-000000000001",
  kuyrukUrun: "it-real-kuy-urun-000000000001",
  kuyrukEmir: "it-real-kuy-emir-000000000001",
  kuyrukOp: "it-real-kuy-op-0000000000001",
  kuyruk: "it-real-kuy-row-000000000001",
  kalipUrun: "it-real-klp-urun-000000000001",
  kalipUrunOp: "it-real-klp-uop-000000000001",
} as const;

const bagliCodes = {
  makine: "IT-REAL-MAK-BAGLI",
  kalip: "IT-REAL-KLP-BAGLI",
  kuyrukUrun: "IT-REAL-KUY-URUN",
  kalipUrun: "IT-REAL-KLP-URUN",
} as const;

async function cleanup() {
  await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.id, [ids.kuyruk]));
  await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.id, [ids.kuyrukOp]));
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.kuyrukEmir]));
  await db.delete(urunOperasyonlari).where(inArray(urunOperasyonlari.id, [ids.kalipUrunOp]));
  await db.delete(urunler).where(inArray(urunler.id, [ids.kuyrukUrun, ids.kalipUrun]));

  const kalipRows = await db
    .select({ id: kaliplar.id })
    .from(kaliplar)
    .where(inArray(kaliplar.kod, [codes.kalip, codes.kalipGuncel, bagliCodes.kalip]));
  const makineRows = await db
    .select({ id: makineler.id })
    .from(makineler)
    .where(inArray(makineler.kod, [codes.makine, codes.makineGuncel, bagliCodes.makine]));

  const kalipIds = kalipRows.map((row) => row.id);
  const makineIds = makineRows.map((row) => row.id);

  if (kalipIds.length > 0) {
    await db.delete(kalipUyumluMakineler).where(inArray(kalipUyumluMakineler.kalip_id, kalipIds));
  }
  if (makineIds.length > 0) {
    await db.delete(kalipUyumluMakineler).where(inArray(kalipUyumluMakineler.makine_id, makineIds));
    await db.delete(makineler).where(inArray(makineler.id, makineIds));
  }
  if (kalipIds.length > 0) {
    await db.delete(kaliplar).where(inArray(kaliplar.id, kalipIds));
  }

  await db.delete(durusNedenleri).where(inArray(durusNedenleri.kod, [codes.durus, codes.durusGuncel]));
  await db.delete(birimler).where(inArray(birimler.kod, [codes.birim, codes.birimGuncel]));
}

describeIntegration("gerçek veri üretim tanımları", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("makine oluşturur, düzenler, pasifleştirir ve bağlantı yokken siler", async () => {
    const makine = await repoCreateMakine({
      kod: codes.makine,
      ad: "IT Gerçek Baskı Makinesi",
      tonaj: 220,
      saatlikKapasite: 360,
      calisir24Saat: false,
      durum: "aktif",
      isActive: true,
    });

    let row = await repoGetMakineById(makine.id);
    expect(row?.kod).toBe(codes.makine);
    expect(Number(row?.tonaj)).toBe(220);
    expect(Number(row?.saatlik_kapasite)).toBe(360);
    expect(row?.durum).toBe("aktif");
    expect(row?.is_active).toBe(1);

    row = await repoUpdateMakine(makine.id, {
      kod: codes.makineGuncel,
      ad: "IT Gerçek Baskı Makinesi Güncel",
      tonaj: 240,
      saatlikKapasite: 420,
      calisir24Saat: true,
      durum: "bakim",
      isActive: false,
    });
    expect(row?.kod).toBe(codes.makineGuncel);
    expect(row?.ad).toBe("IT Gerçek Baskı Makinesi Güncel");
    expect(Number(row?.tonaj)).toBe(240);
    expect(Number(row?.saatlik_kapasite)).toBe(420);
    expect(row?.calisir_24_saat).toBe(1);
    expect(row?.durum).toBe("bakim");
    expect(row?.is_active).toBe(0);

    const passiveList = await repoListMakineler({
      q: "IT Gerçek Baskı Makinesi Güncel",
      durum: "bakim",
      isActive: false,
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(passiveList.items.map((item) => item.id)).toContain(makine.id);

    await repoDeleteMakine(makine.id);
    expect(await repoGetMakineById(makine.id)).toBeNull();
  });

  it("kalıp oluşturur, makine uyumluluğunu yazar ve uyumluluğu temizler", async () => {
    const kalip = await repoCreateKalip({
      kod: codes.kalip,
      ad: "IT Gerçek Kalıp",
      aciklama: "Gerçek veri smoke kalıbı",
      isActive: true,
    });
    const makine = await repoCreateMakine({
      kod: codes.makine,
      ad: "IT Kalıp Uyumlu Makine",
      tonaj: 180,
      saatlikKapasite: 360,
      calisir24Saat: true,
      durum: "aktif",
      isActive: true,
      kalipIds: [kalip.id],
    });

    let links = await repoListUyumluMakineler(kalip.id);
    expect(links.map((item) => item.makineId)).toContain(makine.id);

    const updated = await repoUpdateKalip(kalip.id, {
      kod: codes.kalipGuncel,
      ad: "IT Gerçek Kalıp Güncel",
      aciklama: "Pasif kalıp kontrolü",
      isActive: false,
    });
    expect(updated?.kod).toBe(codes.kalipGuncel);
    expect(updated?.is_active).toBe(0);

    links = await repoSetUyumluMakineler(kalip.id, { makineIds: [] });
    expect(links).toHaveLength(0);

    await repoDeleteMakine(makine.id);
    await repoDeleteKalip(kalip.id);
    expect(await repoGetMakineById(makine.id)).toBeNull();
    expect(await repoGetKalipById(kalip.id)).toBeNull();
  });

  it("duruş nedeni ve birim tanımlarını oluşturur, düzenler ve siler", async () => {
    const durus = await repoCreateDurusNedeni({
      kod: codes.durus,
      ad: "IT Gerçek Duruş",
      kategori: "makine",
      aciklama: "Makine arıza smoke",
      isActive: true,
    });

    let durusRow = await repoGetDurusNedeniById(durus.id);
    expect(durusRow?.kod).toBe(codes.durus);
    expect(durusRow?.kategori).toBe("makine");
    expect(durusRow?.is_active).toBe(1);

    durusRow = await repoUpdateDurusNedeni(durus.id, {
      kod: codes.durusGuncel,
      ad: "IT Gerçek Duruş Güncel",
      kategori: "planlama",
      isActive: false,
    });
    expect(durusRow?.kod).toBe(codes.durusGuncel);
    expect(durusRow?.kategori).toBe("planlama");
    expect(durusRow?.is_active).toBe(0);

    const birim = await repoCreateBirim({
      kod: codes.birim,
      ad: "IT Gerçek Birim",
      sira: 90,
      isActive: true,
    });

    let birimRow = await repoGetBirimById(birim.id);
    expect(birimRow?.kod).toBe(codes.birim);
    expect(birimRow?.sira).toBe(90);
    expect(birimRow?.is_active).toBe(1);

    birimRow = await repoUpdateBirim(birim.id, {
      kod: codes.birimGuncel,
      ad: "IT Gerçek Birim Güncel",
      sira: 91,
      isActive: false,
    });
    expect(birimRow?.kod).toBe(codes.birimGuncel);
    expect(birimRow?.sira).toBe(91);
    expect(birimRow?.is_active).toBe(0);

    await repoDeleteDurusNedeni(durus.id);
    await repoDeleteBirim(birim.id);
    expect(await repoGetDurusNedeniById(durus.id)).toBeNull();
    expect(await repoGetBirimById(birim.id)).toBeNull();
  });

  it("makine kuyruk ve üretim operasyonuna bağlıyken silmeyi reddetmeli", async () => {
    await db.insert(makineler).values({
      id: ids.bagliMakine,
      kod: bagliCodes.makine,
      ad: "IT Bağlı Makine",
      durum: "aktif",
      is_active: 1,
    });
    await db.insert(urunler).values({
      id: ids.kuyrukUrun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: bagliCodes.kuyrukUrun,
      ad: "IT Kuyruk Ürünü",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    });
    await db.insert(uretimEmirleri).values({
      id: ids.kuyrukEmir,
      emir_no: "UE-IT-REAL-MAK-BAGLI",
      urun_id: ids.kuyrukUrun,
      planlanan_miktar: "10.0000",
      durum: "makineye_atandi",
    });
    await db.insert(uretimEmriOperasyonlari).values({
      id: ids.kuyrukOp,
      uretim_emri_id: ids.kuyrukEmir,
      sira: 1,
      operasyon_adi: "IT Bağlı Baskı",
      makine_id: ids.bagliMakine,
      planlanan_miktar: "10.0000",
      durum: "bekliyor",
    });
    await db.insert(makineKuyrugu).values({
      id: ids.kuyruk,
      makine_id: ids.bagliMakine,
      uretim_emri_id: ids.kuyrukEmir,
      emir_operasyon_id: ids.kuyrukOp,
      sira: 1,
      planlanan_sure_dk: 30,
      durum: "bekliyor",
    });

    await expect(repoDeleteMakine(ids.bagliMakine)).rejects.toThrow();
  });

  it("kalıp ürün operasyonuna bağlıyken silmeyi reddetmeli", async () => {
    await db.insert(kaliplar).values({
      id: ids.bagliKalip,
      kod: bagliCodes.kalip,
      ad: "IT Bağlı Kalıp",
      is_active: 1,
    });
    await db.insert(urunler).values({
      id: ids.kalipUrun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: bagliCodes.kalipUrun,
      ad: "IT Kalıp Bağlı Ürün",
      birim: "adet",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    });
    await db.insert(urunOperasyonlari).values({
      id: ids.kalipUrunOp,
      urun_id: ids.kalipUrun,
      sira: 1,
      operasyon_adi: "IT Kalıplı Operasyon",
      kalip_id: ids.bagliKalip,
      hazirlik_suresi_dk: 10,
      cevrim_suresi_sn: "5.00",
      montaj: 0,
      is_active: 1,
    });

    await expect(repoDeleteKalip(ids.bagliKalip)).rejects.toThrow();
  });
});
