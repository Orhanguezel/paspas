import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { musteriler } from "@/modules/musteriler/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { satisSiparisleri, siparisKalemleri } from "@/modules/satis_siparisleri/schema";
import { urunler, urunOperasyonlari, hammaddeRezervasyonlari } from "@/modules/urunler/schema";

import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "../schema";
import { repoGetHammaddeYeterlilik } from "../repository";
import { createUretimEmirleriFromSiparisKalemi, SiparisUretimEmirHatasi } from "../service";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "it-sip-urt-mus-0001-0000000001",
  siparis: "it-sip-urt-sip-0001-0000000001",
  siparisKalem: "it-sip-urt-kal-0001-0000000001",
  asil: "it-sip-urt-asil-001-0000000001",
  oymSag: "it-sip-urt-oym-sag-0000000001",
  oymSol: "it-sip-urt-oym-sol-0000000001",
  hammaddeAna: "it-sip-urt-hm-ana-00000000001",
  hammaddeSag: "it-sip-urt-hm-sag-00000000001",
  hammaddeSol: "it-sip-urt-hm-sol-00000000001",
  receteAsil: "it-sip-urt-rec-asil-000000001",
  receteSag: "it-sip-urt-rec-sag-0000000001",
  receteSol: "it-sip-urt-rec-sol-0000000001",
  kalemSag: "it-sip-urt-rk-sag-0000000001",
  kalemSol: "it-sip-urt-rk-sol-0000000001",
  kalemAnaHammadde: "it-sip-urt-rk-hm-ana-0000001",
  kalemSagHammadde: "it-sip-urt-rk-hm-sag-0000001",
  kalemSolHammadde: "it-sip-urt-rk-hm-sol-0000001",
  opSag: "it-sip-urt-op-sag-00000000001",
  opSol: "it-sip-urt-op-sol-00000000001",
} as const;

async function cleanup() {
  const urunIds = [ids.asil, ids.oymSag, ids.oymSol, ids.hammaddeAna, ids.hammaddeSag, ids.hammaddeSol];
  const siparisKalemIds = [ids.siparisKalem];
  const siparisIds = [ids.siparis];
  const receteIds = [ids.receteAsil, ids.receteSag, ids.receteSol];

  await db.delete(hammaddeRezervasyonlari).where(sql`${hammaddeRezervasyonlari.uretim_emri_id} IN (
    SELECT ${uretimEmriSiparisKalemleri.uretim_emri_id}
    FROM ${uretimEmriSiparisKalemleri}
    WHERE ${uretimEmriSiparisKalemleri.siparis_kalem_id} IN (${sql.join(siparisKalemIds.map((id) => sql`${id}`), sql`, `)})
  )`);
  await db.delete(uretimEmriOperasyonlari).where(sql`${uretimEmriOperasyonlari.uretim_emri_id} IN (
    SELECT ${uretimEmriSiparisKalemleri.uretim_emri_id}
    FROM ${uretimEmriSiparisKalemleri}
    WHERE ${uretimEmriSiparisKalemleri.siparis_kalem_id} IN (${sql.join(siparisKalemIds.map((id) => sql`${id}`), sql`, `)})
  )`);
  await db.delete(uretimEmirleri).where(sql`${uretimEmirleri.id} IN (
    SELECT ${uretimEmriSiparisKalemleri.uretim_emri_id}
    FROM ${uretimEmriSiparisKalemleri}
    WHERE ${uretimEmriSiparisKalemleri.siparis_kalem_id} IN (${sql.join(siparisKalemIds.map((id) => sql`${id}`), sql`, `)})
  )`);
  await db.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemIds));
  await db.delete(uretimEmriOperasyonlari).where(sql`${uretimEmriOperasyonlari.uretim_emri_id} IN (
    SELECT ${uretimEmirleri.id} FROM ${uretimEmirleri}
    WHERE ${uretimEmirleri.urun_id} IN (${sql.join([ids.oymSag, ids.oymSol].map((id) => sql`${id}`), sql`, `)})
      AND ${uretimEmirleri.emir_no} LIKE 'UE-%'
  )`);
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.urun_id, [ids.oymSag, ids.oymSol]));
  await db.delete(siparisKalemleri).where(inArray(siparisKalemleri.id, siparisKalemIds));
  await db.delete(satisSiparisleri).where(inArray(satisSiparisleri.id, siparisIds));
  await db.delete(receteKalemleri).where(inArray(receteKalemleri.recete_id, receteIds));
  await db.delete(receteler).where(inArray(receteler.id, receteIds));
  await db.delete(urunOperasyonlari).where(inArray(urunOperasyonlari.urun_id, urunIds));
  await db.delete(urunler).where(inArray(urunler.id, urunIds));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
}

async function seed() {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: "IT-SIP-URT-MUS",
    ad: "IT Sipariş Üretim Müşteri",
    iskonto: "0.00",
  });
  await db.insert(urunler).values([
    {
      id: ids.asil,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-SIP-ASIL",
      ad: "IT Sipariş Ana Ürün",
      image_url: "/uploads/it-siparis-ana-urun.png",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "cift_tarafli",
    },
    {
      id: ids.oymSag,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-SIP-OYM-SAG",
      ad: "IT Sipariş OYM Sağ",
      image_url: "/uploads/it-siparis-oym-sag.png",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.oymSol,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-SIP-OYM-SOL",
      ad: "IT Sipariş OYM Sol",
      image_url: "/uploads/it-siparis-oym-sol.png",
      birim: "adet",
      stok: "0.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.hammaddeAna,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-SIP-HM-ANA",
      ad: "IT Sipariş Ana Ambalaj",
      image_url: "/uploads/it-siparis-hm-ana.png",
      birim: "adet",
      stok: "100.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.hammaddeSag,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-SIP-HM-SAG",
      ad: "IT Sipariş Sağ Hammadde",
      image_url: "/uploads/it-siparis-hm-sag.png",
      birim: "kg",
      stok: "100.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
    {
      id: ids.hammaddeSol,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-SIP-HM-SOL",
      ad: "IT Sipariş Sol Hammadde",
      image_url: "/uploads/it-siparis-hm-sol.png",
      birim: "kg",
      stok: "100.0000",
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
    },
  ]);
  await db.insert(urunOperasyonlari).values([
    {
      id: ids.opSag,
      urun_id: ids.oymSag,
      sira: 1,
      operasyon_adi: "IT Sağ Baskı",
      hazirlik_suresi_dk: 20,
      cevrim_suresi_sn: "10.00",
      montaj: 0,
    },
    {
      id: ids.opSol,
      urun_id: ids.oymSol,
      sira: 1,
      operasyon_adi: "IT Sol Baskı",
      hazirlik_suresi_dk: 30,
      cevrim_suresi_sn: "12.00",
      montaj: 1,
    },
  ]);
  await db.insert(receteler).values({
    id: ids.receteAsil,
    kod: "IT-SIP-REC-ASIL",
    ad: "IT Sipariş Ana Ürün Reçetesi",
    urun_id: ids.asil,
    hedef_miktar: "1.0000",
  });
  await db.insert(receteler).values([
    {
      id: ids.receteSag,
      kod: "IT-SIP-REC-SAG",
      ad: "IT Sipariş Sağ OYM Reçetesi",
      urun_id: ids.oymSag,
      hedef_miktar: "1.0000",
    },
    {
      id: ids.receteSol,
      kod: "IT-SIP-REC-SOL",
      ad: "IT Sipariş Sol OYM Reçetesi",
      urun_id: ids.oymSol,
      hedef_miktar: "1.0000",
    },
  ]);
  await db.insert(receteKalemleri).values([
    { id: ids.kalemSag, recete_id: ids.receteAsil, urun_id: ids.oymSag, miktar: "1.0000", fire_orani: "0.00", sira: 1 },
    { id: ids.kalemSol, recete_id: ids.receteAsil, urun_id: ids.oymSol, miktar: "2.0000", fire_orani: "0.00", sira: 2 },
    { id: ids.kalemAnaHammadde, recete_id: ids.receteAsil, urun_id: ids.hammaddeAna, miktar: "3.0000", fire_orani: "0.00", sira: 3 },
    { id: ids.kalemSagHammadde, recete_id: ids.receteSag, urun_id: ids.hammaddeSag, miktar: "4.0000", fire_orani: "0.00", sira: 1 },
    { id: ids.kalemSolHammadde, recete_id: ids.receteSol, urun_id: ids.hammaddeSol, miktar: "5.0000", fire_orani: "0.00", sira: 1 },
  ]);
  await db.insert(satisSiparisleri).values({
    id: ids.siparis,
    siparis_no: "IT-SIP-URT-001",
    musteri_id: ids.musteri,
    siparis_tarihi: new Date("2026-04-30"),
    termin_tarihi: new Date("2026-05-05"),
    durum: "onaylandi",
  });
  await db.insert(siparisKalemleri).values({
    id: ids.siparisKalem,
    siparis_id: ids.siparis,
    urun_id: ids.asil,
    miktar: "10.0000",
    birim_fiyat: "100.00",
    sira: 1,
  });
}

describeIntegration("siparisten uretime DB integration", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("creates operasyonel YM production orders with planned quantities and main product display info", async () => {
    const results = await createUretimEmirleriFromSiparisKalemi(ids.siparisKalem, {
      baslangicTarihi: "2026-04-30",
      bitisTarihi: "2026-05-02",
    });

    expect(results).toHaveLength(2);

    const byProduct = new Map(results.map((result) => [result.row.urun_id, result.row]));
    expect(Number(byProduct.get(ids.oymSag)?.planlanan_miktar)).toBe(10);
    expect(Number(byProduct.get(ids.oymSol)?.planlanan_miktar)).toBe(20);

    for (const row of byProduct.values()) {
      expect(row.siparisKalemIds).toEqual([ids.siparisKalem]);
      expect(row.siparisUrunKod).toBe("IT-SIP-ASIL");
      expect(row.siparisUrunAd).toBe("IT Sipariş Ana Ürün");
      expect(row.siparisUrunGorsel).toBe("/uploads/it-siparis-ana-urun.png");
      expect(row.siparisNo).toBe("IT-SIP-URT-001");
      expect(row.musteriAd).toBe("IT Sipariş Üretim Müşteri");
    }

    const emirIds = results.map((result) => result.row.id);
    const operasyonRows = await db
      .select()
      .from(uretimEmriOperasyonlari)
      .where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));
    expect(operasyonRows).toHaveLength(2);
    expect(operasyonRows.map((row) => ({
      urunOperasyonId: row.urun_operasyon_id,
      planlananMiktar: Number(row.planlanan_miktar),
      operasyonAdi: row.operasyon_adi,
    })).sort((a, b) => a.operasyonAdi.localeCompare(b.operasyonAdi))).toEqual([
      { urunOperasyonId: ids.opSag, planlananMiktar: 10, operasyonAdi: "IT Sağ Baskı" },
      { urunOperasyonId: ids.opSol, planlananMiktar: 20, operasyonAdi: "IT Sol Baskı" },
    ].sort((a, b) => a.operasyonAdi.localeCompare(b.operasyonAdi)));

    const rezervasyonRows = await db
      .select({
        uretimEmriId: hammaddeRezervasyonlari.uretim_emri_id,
        urunId: hammaddeRezervasyonlari.urun_id,
        miktar: hammaddeRezervasyonlari.miktar,
        durum: hammaddeRezervasyonlari.durum,
      })
      .from(hammaddeRezervasyonlari)
      .where(inArray(hammaddeRezervasyonlari.uretim_emri_id, emirIds));
    expect(rezervasyonRows.map((row) => ({
      urunId: row.urunId,
      miktar: Number(row.miktar),
      durum: row.durum,
    })).sort((a, b) => a.urunId.localeCompare(b.urunId))).toEqual([
      { urunId: ids.hammaddeSag, miktar: 40, durum: "rezerve" },
      { urunId: ids.hammaddeSol, miktar: 100, durum: "rezerve" },
    ].sort((a, b) => a.urunId.localeCompare(b.urunId)));

    const stokRows = await db
      .select({ id: urunler.id, stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
      .from(urunler)
      .where(inArray(urunler.id, [ids.hammaddeAna, ids.hammaddeSag, ids.hammaddeSol]));
    const stokById = new Map(stokRows.map((row) => [row.id, row]));
    expect(Number(stokById.get(ids.hammaddeAna)?.rezerveStok)).toBe(0);
    expect(Number(stokById.get(ids.hammaddeSag)?.stok)).toBe(100);
    expect(Number(stokById.get(ids.hammaddeSag)?.rezerveStok)).toBe(40);
    expect(Number(stokById.get(ids.hammaddeSol)?.stok)).toBe(100);
    expect(Number(stokById.get(ids.hammaddeSol)?.rezerveStok)).toBe(100);

    const [updatedKalem] = await db
      .select({ uretimDurumu: siparisKalemleri.uretim_durumu })
      .from(siparisKalemleri)
      .where(eq(siparisKalemleri.id, ids.siparisKalem))
      .limit(1);
    expect(updatedKalem.uretimDurumu).toBe("uretime_aktarildi");
  });

  it("keeps main product display image separate from technical OYM material sufficiency", async () => {
    const results = await createUretimEmirleriFromSiparisKalemi(ids.siparisKalem, {
      baslangicTarihi: "2026-04-30",
      bitisTarihi: "2026-05-02",
    });
    const sagEmir = results.find((result) => result.row.urun_id === ids.oymSag);
    expect(sagEmir).toBeDefined();

    expect(sagEmir!.row.siparisUrunGorsel).toBe("/uploads/it-siparis-ana-urun.png");
    expect(sagEmir!.row.urunGorsel).toBe("/uploads/it-siparis-oym-sag.png");

    const yeterlilik = await repoGetHammaddeYeterlilik(sagEmir!.row.id);
    expect(yeterlilik?.items).toEqual([
      expect.objectContaining({
        urunId: ids.hammaddeSag,
        urunGorsel: "/uploads/it-siparis-hm-sag.png",
        gerekliMiktar: 40,
      }),
    ]);
    expect(yeterlilik?.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ urunId: ids.hammaddeAna }),
        expect.objectContaining({ urunGorsel: "/uploads/it-siparis-ana-urun.png" }),
      ]),
    );
  });

  it("rejects duplicate transfer for the same sales order line", async () => {
    await createUretimEmirleriFromSiparisKalemi(ids.siparisKalem, {
      baslangicTarihi: "2026-04-30",
      bitisTarihi: "2026-05-02",
    });

    await expect(createUretimEmirleriFromSiparisKalemi(ids.siparisKalem)).rejects.toMatchObject({
      name: "SiparisUretimEmirHatasi",
      code: "siparis_kalemi_zaten_uretime_aktarildi",
    } satisfies Partial<SiparisUretimEmirHatasi>);

    const linkedRows = await db
      .select({ uretimEmriId: uretimEmriSiparisKalemleri.uretim_emri_id })
      .from(uretimEmriSiparisKalemleri)
      .where(eq(uretimEmriSiparisKalemleri.siparis_kalem_id, ids.siparisKalem));
    expect(linkedRows).toHaveLength(2);
  });

  it("rolls back production order rows when sales order line status transition fails", async () => {
    await db
      .update(siparisKalemleri)
      .set({ uretim_durumu: "uretim_tamamlandi" })
      .where(eq(siparisKalemleri.id, ids.siparisKalem));

    await expect(createUretimEmirleriFromSiparisKalemi(ids.siparisKalem, {
      baslangicTarihi: "2026-04-30",
      bitisTarihi: "2026-05-02",
    })).rejects.toThrow("gecersiz_gecis:uretim_tamamlandi_to_uretime_aktarildi");

    const linkedRows = await db
      .select({ uretimEmriId: uretimEmriSiparisKalemleri.uretim_emri_id })
      .from(uretimEmriSiparisKalemleri)
      .where(eq(uretimEmriSiparisKalemleri.siparis_kalem_id, ids.siparisKalem));
    expect(linkedRows).toHaveLength(0);

    const orphanOrders = await db
      .select({ id: uretimEmirleri.id })
      .from(uretimEmirleri)
      .where(inArray(uretimEmirleri.urun_id, [ids.oymSag, ids.oymSol]));
    expect(orphanOrders).toHaveLength(0);
  });
});
