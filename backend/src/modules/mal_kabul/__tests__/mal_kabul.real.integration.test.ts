import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { musteriler } from "@/modules/musteriler/schema";
import { repoCreate as repoCreateSatinAlma, repoGetById as repoGetSatinAlma } from "@/modules/satin_alma/repository";
import { satinAlmaKalemleri, satinAlmaSiparisleri } from "@/modules/satin_alma/schema";
import { urunler } from "@/modules/urunler/schema";

import { repoCreate, repoDelete, repoGetById, repoList } from "../repository";
import { malKabulKayitlari } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  tedarikci: "11111111-1111-4111-8111-111111111301",
  urun: "11111111-1111-4111-8111-111111111302",
} as const;

const codes = {
  tedarikci: "IT-REAL-MK-TED",
  urun: "IT-REAL-MK-HM",
  siparis: "SA-IT-REAL-MK-001",
  partiKismi: "IT-MK-PARTI-1",
  partiTamam: "IT-MK-PARTI-2",
  partiRed: "IT-MK-RED",
} as const;

async function getSiparisIds() {
  const rows = await db
    .select({ id: satinAlmaSiparisleri.id })
    .from(satinAlmaSiparisleri)
    .where(eq(satinAlmaSiparisleri.siparis_no, codes.siparis));
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
    ad: "IT Gerçek Mal Kabul Tedarikçisi",
    is_active: 1,
  });
  await db.insert(urunler).values({
    id: ids.urun,
    kategori: "hammadde",
    tedarik_tipi: "satin_alma",
    kod: codes.urun,
    ad: "IT Gerçek Mal Kabul Hammaddesi",
    birim: "kg",
    stok: "0.0000",
    kritik_stok: "5.0000",
    kdv_orani: "20.00",
    stok_takip_aktif: 1,
    is_active: 1,
  });
}

async function createSiparis(miktar = 10) {
  return repoCreateSatinAlma({
    siparisNo: codes.siparis,
    tedarikciId: ids.tedarikci,
    siparisTarihi: "2031-11-01",
    terminTarihi: "2031-11-08",
    durum: "siparis_verildi",
    aciklama: "IT gerçek mal kabul siparişi",
    items: [{ urunId: ids.urun, miktar, birimFiyat: 8.5, sira: 1 }],
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

async function getMovementRows(referansIds: string[]) {
  return db
    .select({
      hareketTipi: hareketler.hareket_tipi,
      referansTipi: hareketler.referans_tipi,
      referansId: hareketler.referans_id,
      miktar: hareketler.miktar,
    })
    .from(hareketler)
    .where(inArray(hareketler.referans_id, referansIds));
}

function getAcceptedAmount(detail: Awaited<ReturnType<typeof repoGetSatinAlma>>) {
  return Number(detail?.items[0]?.kabul_miktar ?? 0);
}

function getRemainingAmount(detail: Awaited<ReturnType<typeof repoGetSatinAlma>>) {
  return Number(detail?.items[0]?.miktar ?? 0) - getAcceptedAmount(detail);
}

describeIntegration("gerçek veri mal kabul", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("satın alma üzerinden kısmi ve tam mal kabulde stok, hareket ve teslim durumunu doğrular", async () => {
    const siparis = await createSiparis(10);
    const kalemId = siparis.items[0].id;

    const kismi = await repoCreate({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: siparis.siparis.id,
      satinAlmaKalemId: kalemId,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 4,
      kaliteDurumu: "kabul",
      partiNo: codes.partiKismi,
      notlar: "IT kısmi mal kabul",
    }, null);

    expect(kismi.urunKod).toBe(codes.urun);
    expect(kismi.tedarikciAd).toBe("IT Gerçek Mal Kabul Tedarikçisi");
    expect(kismi.gelenMiktar).toBe(4);
    expect(await getStock()).toBe(4);

    let detail = await repoGetSatinAlma(siparis.siparis.id);
    expect(detail?.siparis.durum).toBe("kismen_teslim");
    expect(getAcceptedAmount(detail)).toBe(4);
    expect(getRemainingAmount(detail)).toBe(6);

    const tamam = await repoCreate({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: siparis.siparis.id,
      satinAlmaKalemId: kalemId,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 6,
      kaliteDurumu: "kabul",
      partiNo: codes.partiTamam,
      notlar: "IT tamamlama mal kabul",
    }, null);

    expect(tamam.gelenMiktar).toBe(6);
    expect(await getStock()).toBe(10);

    detail = await repoGetSatinAlma(siparis.siparis.id);
    expect(detail?.siparis.durum).toBe("tamamlandi");
    expect(getAcceptedAmount(detail)).toBe(10);
    expect(getRemainingAmount(detail)).toBe(0);

    const list = await repoList({
      q: "IT-MK-PARTI",
      limit: 20,
      offset: 0,
      sort: "kabul_tarihi",
      order: "desc",
    });
    expect(list.items.map((item) => item.id)).toEqual(expect.arrayContaining([kismi.id, tamam.id]));
    expect(list.summary.toplamKayit).toBe(2);
    expect(list.summary.satinAlmaMiktar).toBe(10);

    const hareketRows = await getMovementRows([kismi.id, tamam.id]);
    expect(hareketRows.map((row) => ({
      hareketTipi: row.hareketTipi,
      referansTipi: row.referansTipi,
      referansId: row.referansId,
      miktar: Number(row.miktar),
    })).sort((a, b) => a.miktar - b.miktar)).toEqual([
      { hareketTipi: "giris", referansTipi: "mal_kabul", referansId: kismi.id, miktar: 4 },
      { hareketTipi: "giris", referansTipi: "mal_kabul", referansId: tamam.id, miktar: 6 },
    ]);

    const fetched = await repoGetById(kismi.id);
    expect(fetched?.partiNo).toBe(codes.partiKismi);

    expect(await repoDelete(tamam.id)).toBe(true);
    expect(await getStock()).toBe(4);
    detail = await repoGetSatinAlma(siparis.siparis.id);
    expect(detail?.siparis.durum).toBe("kismen_teslim");
    expect(getAcceptedAmount(detail)).toBe(4);
  });

  it("reddedilen kalite mal kabulü teslim toplamını ilerletmemeli ve giriş hareketi üretmemeli", async () => {
    const siparis = await createSiparis(5);
    const red = await repoCreate({
      kaynakTipi: "satin_alma",
      satinAlmaSiparisId: siparis.siparis.id,
      satinAlmaKalemId: siparis.items[0].id,
      urunId: ids.urun,
      tedarikciId: ids.tedarikci,
      gelenMiktar: 3,
      kaliteDurumu: "red",
      partiNo: codes.partiRed,
      kaliteNotu: "IT red kalite kontrolü",
    }, null);

    expect(await getStock()).toBe(0);

    const detail = await repoGetSatinAlma(siparis.siparis.id);
    expect(detail?.siparis.durum).toBe("siparis_verildi");
    expect(getAcceptedAmount(detail)).toBe(0);

    const hareketRows = await getMovementRows([red.id]);
    expect(hareketRows).toHaveLength(0);
  });
});
