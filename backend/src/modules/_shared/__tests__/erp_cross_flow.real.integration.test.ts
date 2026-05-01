import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { gorevler } from "@/modules/gorevler/schema";
import { hareketler } from "@/modules/hareketler/schema";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { repoAtaOperasyon } from "@/modules/makine_havuzu/repository";
import { musteriler } from "@/modules/musteriler/schema";
import { notifications } from "@/modules/notifications/schema";
import { repoUretimBaslat, repoUretimBitir } from "@/modules/operator/repository";
import { operatorGunlukKayitlari, sevkiyatKalemleri, sevkiyatlar, vardiyaKayitlari } from "@/modules/operator/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { repoCreate as repoCreateSatis, repoGetById as repoGetSatis, repoGetSiparisOzetleri } from "@/modules/satis_siparisleri/repository";
import { satisSiparisleri, siparisKalemleri } from "@/modules/satis_siparisleri/schema";
import { repoCreateSevkEmri, repoPatchSevkEmri } from "@/modules/sevkiyat/repository";
import { sevkEmirleri } from "@/modules/sevkiyat/schema";
import { vardiyalar } from "@/modules/tanimlar/schema";
import { repoCreate as repoCreateUretimEmri } from "@/modules/uretim_emirleri/repository";
import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "@/modules/uretim_emirleri/schema";
import { hammaddeRezervasyonlari, urunler, urunOperasyonlari } from "@/modules/urunler/schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "11111111-1111-4111-8111-111111111501",
  vardiya: "11111111-1111-4111-8111-111111111502",
  makine: "11111111-1111-4111-8111-111111111503",
  urun: "11111111-1111-4111-8111-111111111504",
  hammadde: "11111111-1111-4111-8111-111111111505",
  recete: "11111111-1111-4111-8111-111111111506",
  receteKalem: "11111111-1111-4111-8111-111111111507",
  urunOperasyon: "11111111-1111-4111-8111-111111111508",
} as const;

const codes = {
  musteri: "IT-REAL-X-MUS",
  makine: "IT-REAL-X-MAK",
  urun: "IT-REAL-X-URN",
  hammadde: "IT-REAL-X-HM",
  recete: "IT-REAL-X-REC",
  siparis: "SS-IT-REAL-X-001",
  emir: "UE-IT-REAL-X-001",
} as const;

async function getSiparisIds() {
  const rows = await db
    .select({ id: satisSiparisleri.id })
    .from(satisSiparisleri)
    .where(eq(satisSiparisleri.siparis_no, codes.siparis));
  return rows.map((row) => row.id);
}

async function getEmirIds() {
  const rows = await db
    .select({ id: uretimEmirleri.id })
    .from(uretimEmirleri)
    .where(eq(uretimEmirleri.emir_no, codes.emir));
  return rows.map((row) => row.id);
}

async function cleanup() {
  const siparisIds = await getSiparisIds();
  const emirIds = await getEmirIds();

  if (siparisIds.length > 0) {
    const sevkEmriRows = await db
      .select({ id: sevkEmirleri.id })
      .from(sevkEmirleri)
      .where(inArray(sevkEmirleri.siparis_id, siparisIds));
    const sevkEmriIds = sevkEmriRows.map((row) => row.id);
    if (sevkEmriIds.length > 0) {
      await db.delete(gorevler).where(inArray(gorevler.ilgili_kayit_id, sevkEmriIds));
      await db.delete(sevkEmirleri).where(inArray(sevkEmirleri.id, sevkEmriIds));
    }

    const sevkiyatRows = await db
      .select({ sevkiyatId: sevkiyatKalemleri.sevkiyat_id })
      .from(sevkiyatKalemleri)
      .where(inArray(sevkiyatKalemleri.siparis_id, siparisIds));
    const sevkiyatIds = sevkiyatRows.map((row) => row.sevkiyatId);
    if (sevkiyatIds.length > 0) {
      await db.delete(hareketler).where(inArray(hareketler.referans_id, sevkiyatIds));
      await db.delete(sevkiyatKalemleri).where(inArray(sevkiyatKalemleri.sevkiyat_id, sevkiyatIds));
      await db.delete(sevkiyatlar).where(inArray(sevkiyatlar.id, sevkiyatIds));
    }
  }

  await db.delete(notifications).where(inArray(notifications.title, ["Uretim tamamlandi", "Gunluk uretim girisi alindi"]));
  await db.delete(operatorGunlukKayitlari).where(inArray(operatorGunlukKayitlari.uretim_emri_id, emirIds.length > 0 ? emirIds : [""]));
  await db.delete(vardiyaKayitlari).where(eq(vardiyaKayitlari.makine_id, ids.makine));
  if (emirIds.length > 0) {
    await db.delete(makineKuyrugu).where(inArray(makineKuyrugu.uretim_emri_id, emirIds));
    await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds));
    await db.delete(uretimEmriOperasyonlari).where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));
    await db.delete(hammaddeRezervasyonlari).where(inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds));
    await db.delete(hareketler).where(inArray(hareketler.referans_id, emirIds));
    await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, emirIds));
  }

  if (siparisIds.length > 0) {
    await db.delete(siparisKalemleri).where(inArray(siparisKalemleri.siparis_id, siparisIds));
    await db.delete(satisSiparisleri).where(inArray(satisSiparisleri.id, siparisIds));
  }
  await db.delete(hareketler).where(inArray(hareketler.urun_id, [ids.urun, ids.hammadde]));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.recete));
  await db.delete(receteler).where(eq(receteler.id, ids.recete));
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.id, ids.urunOperasyon));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
  await db.delete(vardiyalar).where(eq(vardiyalar.id, ids.vardiya));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seed() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: codes.musteri,
    ad: "IT Gerçek Çapraz Müşteri",
    is_active: 1,
  });
  await db.insert(vardiyalar).values({
    id: ids.vardiya,
    ad: "IT Gerçek Çapraz Vardiya",
    baslangic_saati: "00:00",
    bitis_saati: "23:59",
    is_active: 1,
  });
  await db.insert(makineler).values({
    id: ids.makine,
    kod: codes.makine,
    ad: "IT Gerçek Çapraz Makine",
    durum: "aktif",
    is_active: 1,
  });
  await db.insert(urunler).values([
    {
      id: ids.urun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urun,
      ad: "IT Gerçek Çapraz Ürün",
      birim: "adet",
      stok: "0.0000",
      rezerve_stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "tek_tarafli",
      stok_takip_aktif: 1,
      is_active: 1,
    },
    {
      id: ids.hammadde,
      kategori: "hammadde",
      tedarik_tipi: "satin_alma",
      kod: codes.hammadde,
      ad: "IT Gerçek Çapraz Hammadde",
      birim: "kg",
      stok: "100.0000",
      rezerve_stok: "0.0000",
      kritik_stok: "5.0000",
      kdv_orani: "20.00",
      stok_takip_aktif: 1,
      is_active: 1,
    },
  ]);
  await db.insert(urunOperasyonlari).values({
    id: ids.urunOperasyon,
    urun_id: ids.urun,
    sira: 1,
    operasyon_adi: "IT Gerçek Çapraz Baskı",
    hazirlik_suresi_dk: 5,
    cevrim_suresi_sn: "6.00",
    montaj: 0,
    is_active: 1,
  });
  await db.insert(receteler).values({
    id: ids.recete,
    kod: codes.recete,
    ad: "IT Gerçek Çapraz Reçete",
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

async function getStocks() {
  const rows = await db
    .select({ id: urunler.id, stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  return Object.fromEntries(rows.map((row) => [row.id, {
    stok: Number(row.stok ?? 0),
    rezerveStok: Number(row.rezerveStok ?? 0),
  }]));
}

async function getSingleOperationId(uretimEmriId: string) {
  const [row] = await db
    .select({ id: uretimEmriOperasyonlari.id })
    .from(uretimEmriOperasyonlari)
    .where(eq(uretimEmriOperasyonlari.uretim_emri_id, uretimEmriId))
    .limit(1);
  if (!row) throw new Error("emir_operasyonu_yok");
  return row.id;
}

async function getQueueId(uretimEmriId: string) {
  const [row] = await db
    .select({ id: makineKuyrugu.id })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.uretim_emri_id, uretimEmriId))
    .limit(1);
  if (!row) throw new Error("makine_kuyrugu_yok");
  return row.id;
}

describeIntegration("gerçek veri çapraz ERP akışı", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("ürün/reçete/sipariş/üretim/sevkiyat zincirinde stok, hareket ve durum toplamlarını tutarlı tutar", async () => {
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 0, rezerveStok: 0 },
      [ids.hammadde]: { stok: 100, rezerveStok: 0 },
    });

    const siparis = await repoCreateSatis({
      siparisNo: codes.siparis,
      musteriId: ids.musteri,
      siparisTarihi: "2032-01-01",
      terminTarihi: "2032-01-15",
      durum: "onaylandi",
      ekstraIndirimOrani: 0,
      items: [{ urunId: ids.urun, miktar: 10, birimFiyat: 100, sira: 1 }],
    });
    expect((await repoGetSiparisOzetleri([siparis.siparis.id])).get(siparis.siparis.id)?.toplamMiktar).toBe(10);

    const uretim = await repoCreateUretimEmri({
      emirNo: codes.emir,
      siparisKalemIds: [siparis.items[0].id],
      urunId: ids.urun,
      planlananMiktar: 10,
      uretilenMiktar: 0,
      durum: "atanmamis",
      terminTarihi: "2032-01-12",
    });
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 0, rezerveStok: 0 },
      [ids.hammadde]: { stok: 100, rezerveStok: 20 },
    });

    await repoAtaOperasyon({
      emirOperasyonId: await getSingleOperationId(uretim.row.id),
      makineId: ids.makine,
      planlananBaslangic: "2032-01-03T08:00:00",
    });
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 0, rezerveStok: 0 },
      [ids.hammadde]: { stok: 80, rezerveStok: 0 },
    });

    const queueId = await getQueueId(uretim.row.id);
    await repoUretimBaslat({ makineKuyrukId: queueId }, null);
    const finished = await repoUretimBitir({
      makineKuyrukId: queueId,
      uretilenMiktar: 10,
      fireMiktar: 0,
      birimTipi: "adet",
      notlar: "Çapraz akış üretim bitiş",
    }, null);
    expect(finished.durum).toBe("tamamlandi");
    expect(finished.stokFarki).toBe(10);
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 10, rezerveStok: 0 },
      [ids.hammadde]: { stok: 80, rezerveStok: 0 },
    });

    let satisDetail = await repoGetSatis(siparis.siparis.id);
    // Üretim tamamlanınca refreshSiparisDurum siparişi 'uretimde'/'planlandi' gibi
    // ara duruma geçirir; sevk tamamlanmadan 'tamamlandi' olmamalı.
    expect(["onaylandi", "planlandi", "uretimde"]).toContain(satisDetail?.siparis.durum);

    const sevkEmri = await repoCreateSevkEmri({
      siparisId: siparis.siparis.id,
      siparisKalemId: siparis.items[0].id,
      musteriId: ids.musteri,
      urunId: ids.urun,
      miktar: 10,
      tarih: "2032-01-14",
      notlar: "Çapraz akış sevkiyat",
    }, null);
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 10, rezerveStok: 10 },
      [ids.hammadde]: { stok: 80, rezerveStok: 0 },
    });

    await repoPatchSevkEmri(sevkEmri.id, { durum: "onaylandi" }, null);
    await repoPatchSevkEmri(sevkEmri.id, { durum: "sevk_edildi" }, null);
    expect(await getStocks()).toEqual({
      [ids.urun]: { stok: 0, rezerveStok: 0 },
      [ids.hammadde]: { stok: 80, rezerveStok: 0 },
    });

    satisDetail = await repoGetSatis(siparis.siparis.id);
    expect(satisDetail?.siparis.durum).toBe("tamamlandi");
    const ozet = (await repoGetSiparisOzetleri([siparis.siparis.id])).get(siparis.siparis.id);
    expect(ozet?.uretimTamamlananMiktar).toBe(10);
    expect(ozet?.sevkEdilenMiktar).toBe(10);

    const hareketTotals = await db
      .select({
        urunId: hareketler.urun_id,
        hareketTipi: hareketler.hareket_tipi,
        referansTipi: hareketler.referans_tipi,
        toplam: sql<string>`coalesce(sum(${hareketler.miktar}), 0)`,
      })
      .from(hareketler)
      .where(inArray(hareketler.urun_id, [ids.urun, ids.hammadde]))
      .groupBy(hareketler.urun_id, hareketler.hareket_tipi, hareketler.referans_tipi);
    // Hareket konvansiyonu:
    //   - `stokDus` (makine atama, hammadde) → referans_tipi='uretim_emri' miktar negatif
    //   - `consumeRecipeMaterials` (operatör, hammadde) → guard ile çift sayım engellendi (boş)
    //   - Operatör üretim girişi (asıl ürün stoğu artar) → referans_tipi='uretim' miktar pozitif
    //   - Sevkiyat → referans_tipi='sevkiyat' miktar negatif
    expect(hareketTotals.map((row) => ({
      urunId: row.urunId,
      hareketTipi: row.hareketTipi,
      referansTipi: row.referansTipi,
      toplam: Number(row.toplam),
    })).sort((a, b) => `${a.urunId}-${a.referansTipi}`.localeCompare(`${b.urunId}-${b.referansTipi}`))).toEqual([
      { urunId: ids.hammadde, hareketTipi: "cikis", referansTipi: "uretim_emri", toplam: -20 },
      { urunId: ids.urun, hareketTipi: "giris", referansTipi: "uretim", toplam: 10 },
      { urunId: ids.urun, hareketTipi: "cikis", referansTipi: "sevkiyat", toplam: -10 },
    ].sort((a, b) => `${a.urunId}-${a.referansTipi}`.localeCompare(`${b.urunId}-${b.referansTipi}`)));
  });
});
