/**
 * Integration testi — Risk 4 (montaj akışı):
 *
 * Çift taraflı üretimde montaj operasyonu tamamlandığında:
 *   1. Asıl ürün stoğu, sipariş kalemi miktarı kadar artar.
 *   2. Operasyonel YM (sağ + sol) stokları reçete kalemi miktarları kadar düşer.
 *   3. `hareketler` tablosuna 1 asıl ürün giriş + N OYM çıkış kaydı yazılır.
 *   4. Üretim emri durumu `tamamlandi` olur.
 *
 * Yetersiz stok senaryosu:
 *   1. tryMontaj false döner, eksik YM listesi dolar.
 *   2. Emir durumu `montaj_bekliyor` olur.
 *   3. Stoklar değişmez.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { makineler } from "@/modules/makine_havuzu/schema";
import { musteriler } from "@/modules/musteriler/schema";
import { operatorGunlukKayitlari, vardiyaKayitlari } from "@/modules/operator/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import {
  satisSiparisleri,
  siparisKalemleri,
} from "@/modules/satis_siparisleri/schema";
import { urunler } from "@/modules/urunler/schema";
import { getVardiyaAnalizi } from "@/modules/vardiya_analizi/service";

import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from "../schema";
import { tryMontajForUretimEmri } from "../service";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "it-mt-mus-0001-00000000000001",
  siparis: "it-mt-sip-0001-00000000000001",
  siparisKalem: "it-mt-kal-0001-00000000000001",
  asil: "it-mt-asil-001-00000000000001",
  oymSag: "it-mt-oym-sag-00000000000001",
  oymSol: "it-mt-oym-sol-00000000000001",
  hammaddeAmbalaj: "it-mt-hm-ambalaj-000000000001",
  receteAsil: "it-mt-rec-asil-00000000000001",
  kalemSag: "it-mt-rk-sag-000000000000001",
  kalemSol: "it-mt-rk-sol-000000000000001",
  kalemAmbalaj: "it-mt-rk-ambalaj-0000000001",
  uretimSag: "it-mt-ue-sag-000000000000001",
  uretimSol: "it-mt-ue-sol-000000000000001",
  makine: "it-mt-makine-000000000000001",
  vardiya: "it-mt-vardiya-0000000000001",
  opBaski: "it-mt-op-baski-0000000000001",
  opMontaj: "it-mt-op-montaj-000000000001",
  kayitBaski: "it-mt-kayit-baski-00000000001",
  kayitMontaj: "it-mt-kayit-montaj-000000001",
} as const;

async function cleanup() {
  await db.delete(operatorGunlukKayitlari).where(
    inArray(operatorGunlukKayitlari.id, [ids.kayitBaski, ids.kayitMontaj]),
  );
  await db.delete(vardiyaKayitlari).where(eq(vardiyaKayitlari.id, ids.vardiya));
  await db.delete(hareketler).where(inArray(hareketler.referans_id, [ids.uretimSag, ids.uretimSol]));
  await db.delete(uretimEmriOperasyonlari).where(
    inArray(uretimEmriOperasyonlari.id, [ids.opBaski, ids.opMontaj]),
  );
  await db.delete(uretimEmriSiparisKalemleri).where(
    inArray(uretimEmriSiparisKalemleri.uretim_emri_id, [ids.uretimSag, ids.uretimSol]),
  );
  await db.delete(uretimEmirleri).where(inArray(uretimEmirleri.id, [ids.uretimSag, ids.uretimSol]));
  await db.delete(siparisKalemleri).where(eq(siparisKalemleri.id, ids.siparisKalem));
  await db.delete(satisSiparisleri).where(eq(satisSiparisleri.id, ids.siparis));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.receteAsil));
  await db.delete(receteler).where(eq(receteler.id, ids.receteAsil));
  await db.delete(urunler).where(inArray(urunler.id, [ids.asil, ids.oymSag, ids.oymSol, ids.hammaddeAmbalaj]));
  await db.delete(musteriler).where(eq(musteriler.id, ids.musteri));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seedWithStocks(opts: {
  sagStok: string;
  solStok: string;
  sagStokTakipAktif?: 0 | 1;
  solStokTakipAktif?: 0 | 1;
  ambalaj?: {
    stok: string;
    stokTakipAktif: 0 | 1;
  };
}) {
  await db.insert(musteriler).values({
    id: ids.musteri,
    tur: "musteri",
    kod: "IT-MT-MUS",
    ad: "IT Montaj Musteri",
    iskonto: "0.00",
  });

  await db.insert(urunler).values([
    {
      id: ids.asil,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: "IT-MT-ASIL",
      ad: "IT Montaj Ana Urun",
      birim: "adet",
      stok: "0.0000", // başlangıç 0
      kritik_stok: "0.0000",
      kdv_orani: "20.00",
      operasyon_tipi: "cift_tarafli",
    },
    {
      id: ids.oymSag,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-MT-OYM-SAG",
      ad: "IT Montaj OYM Sag",
      birim: "adet",
      stok: opts.sagStok,
      kritik_stok: "0.0000",
      stok_takip_aktif: opts.sagStokTakipAktif ?? 1,
      kdv_orani: "20.00",
    },
    {
      id: ids.oymSol,
      kategori: "operasyonel_ym",
      tedarik_tipi: "uretim",
      kod: "IT-MT-OYM-SOL",
      ad: "IT Montaj OYM Sol",
      birim: "adet",
      stok: opts.solStok,
      kritik_stok: "0.0000",
      stok_takip_aktif: opts.solStokTakipAktif ?? 1,
      kdv_orani: "20.00",
    },
    ...(opts.ambalaj ? [{
      id: ids.hammaddeAmbalaj,
      kategori: "hammadde",
      tedarik_tipi: "satinalma",
      kod: "IT-MT-HM-AMB",
      ad: "IT Montaj Ambalaj",
      birim: "adet",
      stok: opts.ambalaj.stok,
      kritik_stok: "0.0000",
      stok_takip_aktif: opts.ambalaj.stokTakipAktif,
      kdv_orani: "20.00",
    }] : []),
  ]);

  await db.insert(receteler).values({
    id: ids.receteAsil,
    kod: "IT-MT-REC-ASIL",
    ad: "IT Montaj Recete",
    urun_id: ids.asil,
    hedef_miktar: "1.0000",
    is_active: 1,
  });

  await db.insert(receteKalemleri).values([
    { id: ids.kalemSag, recete_id: ids.receteAsil, urun_id: ids.oymSag, miktar: "1.0000", fire_orani: "0.00", sira: 1 },
    { id: ids.kalemSol, recete_id: ids.receteAsil, urun_id: ids.oymSol, miktar: "2.0000", fire_orani: "0.00", sira: 2 },
    ...(opts.ambalaj ? [
      { id: ids.kalemAmbalaj, recete_id: ids.receteAsil, urun_id: ids.hammaddeAmbalaj, miktar: "3.0000", fire_orani: "0.00", sira: 3 },
    ] : []),
  ]);

  await db.insert(satisSiparisleri).values({
    id: ids.siparis,
    siparis_no: "IT-MT-001",
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

  // İki üretim emri (sol = montaj tarafı, montaj fonksiyonu sol emri için çağrılır)
  await db.insert(uretimEmirleri).values([
    {
      id: ids.uretimSag,
      emir_no: "UE-IT-MT-SAG",
      urun_id: ids.oymSag,
      planlanan_miktar: "10.0000",
      uretilen_miktar: "10.0000",
      durum: "tamamlandi",
    },
    {
      id: ids.uretimSol,
      emir_no: "UE-IT-MT-SOL",
      urun_id: ids.oymSol,
      planlanan_miktar: "20.0000",
      uretilen_miktar: "20.0000",
      durum: "yapiliyor", // montaj bekliyor / yapiliyor durumunda
    },
  ]);

  await db.insert(uretimEmriSiparisKalemleri).values([
    { id: randomUUID(), uretim_emri_id: ids.uretimSag, siparis_kalem_id: ids.siparisKalem },
    { id: randomUUID(), uretim_emri_id: ids.uretimSol, siparis_kalem_id: ids.siparisKalem },
  ]);
}

async function getStokAndDurum() {
  const [asil] = await db.select({ stok: urunler.stok }).from(urunler).where(eq(urunler.id, ids.asil)).limit(1);
  const [sag] = await db.select({ stok: urunler.stok }).from(urunler).where(eq(urunler.id, ids.oymSag)).limit(1);
  const [sol] = await db.select({ stok: urunler.stok }).from(urunler).where(eq(urunler.id, ids.oymSol)).limit(1);
  const [emirSol] = await db.select({ durum: uretimEmirleri.durum }).from(uretimEmirleri).where(eq(uretimEmirleri.id, ids.uretimSol)).limit(1);
  return {
    asilStok: Number(asil?.stok ?? 0),
    sagStok: Number(sag?.stok ?? 0),
    solStok: Number(sol?.stok ?? 0),
    emirDurum: emirSol?.durum ?? null,
  };
}

describeIntegration("tryMontajForUretimEmri — montaj akışı", () => {
  afterAll(async () => {
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("yeterli stokla montaj: asıl ürün stoğu artar, OYM stokları düşer, hareketler yazılır, emir tamamlanır", async () => {
    // Setup: sağ stoğu 10, sol stoğu 20 (her ikisi de yeterli)
    await seedWithStocks({ sagStok: "10.0000", solStok: "20.0000" });

    const sonuc = await tryMontajForUretimEmri(ids.uretimSol);
    expect(sonuc).not.toBeNull();
    expect(sonuc!.basarili).toBe(true);
    expect(sonuc!.uretilenMiktar).toBe(10);
    expect(sonuc!.urunId).toBe(ids.asil);

    const after = await getStokAndDurum();
    expect(after.asilStok).toBe(10); // 0 + 10
    expect(after.sagStok).toBe(0); // 10 - (1 * 10)
    expect(after.solStok).toBe(0); // 20 - (2 * 10)
    expect(after.emirDurum).toBe("tamamlandi");

    const hareketRows = await db
      .select({
        urun_id: hareketler.urun_id,
        hareket_tipi: hareketler.hareket_tipi,
        referans_tipi: hareketler.referans_tipi,
        miktar: hareketler.miktar,
      })
      .from(hareketler)
      .where(eq(hareketler.referans_id, ids.uretimSol));

    // 1 asıl ürün giriş + 1 sağ OYM çıkış + 1 sol OYM çıkış = 3 kayıt
    expect(hareketRows).toHaveLength(3);

    const girisHareket = hareketRows.find((h) => h.hareket_tipi === "giris");
    expect(girisHareket).toBeDefined();
    expect(girisHareket!.urun_id).toBe(ids.asil);
    expect(girisHareket!.referans_tipi).toBe("montaj");
    expect(Number(girisHareket!.miktar)).toBe(10);

    const cikisHareketler = hareketRows.filter((h) => h.hareket_tipi === "cikis");
    expect(cikisHareketler).toHaveLength(2);
    const sagCikis = cikisHareketler.find((h) => h.urun_id === ids.oymSag);
    const solCikis = cikisHareketler.find((h) => h.urun_id === ids.oymSol);
    expect(Number(sagCikis!.miktar)).toBe(10);
    expect(Number(solCikis!.miktar)).toBe(20);
  });

  it("yetersiz sağ stok: tryMontaj false döner, emir 'montaj_bekliyor' olur, stoklar dokunulmaz", async () => {
    // Sağ stok yetersiz (5 < 10), sol yeterli
    await seedWithStocks({ sagStok: "5.0000", solStok: "20.0000" });

    const sonuc = await tryMontajForUretimEmri(ids.uretimSol);
    expect(sonuc).not.toBeNull();
    expect(sonuc!.basarili).toBe(false);
    if (!sonuc!.basarili) {
      expect(sonuc!.eksikYariMamuller.length).toBeGreaterThan(0);
      const eksikSag = sonuc!.eksikYariMamuller.find((e) => e.urunId === ids.oymSag);
      expect(eksikSag).toBeDefined();
      expect(eksikSag!.gerekli).toBe(10);
      expect(eksikSag!.mevcut).toBe(5);
    }

    const after = await getStokAndDurum();
    // Stoklar değişmemiş olmalı
    expect(after.asilStok).toBe(0);
    expect(after.sagStok).toBe(5);
    expect(after.solStok).toBe(20);
    expect(after.emirDurum).toBe("montaj_bekliyor");

    // hareketler tablosuna kayıt yazılmamış olmalı
    const hareketRows = await db
      .select({ id: hareketler.id })
      .from(hareketler)
      .where(eq(hareketler.referans_id, ids.uretimSol));
    expect(hareketRows).toHaveLength(0);
  });

  it("stok takibi kapalı OYM ve hammadde yeterlilikten muaftır ama montaj hareketi oluşturur", async () => {
    await seedWithStocks({
      sagStok: "0.0000",
      solStok: "20.0000",
      sagStokTakipAktif: 0,
      ambalaj: {
        stok: "0.0000",
        stokTakipAktif: 0,
      },
    });

    const sonuc = await tryMontajForUretimEmri(ids.uretimSol);
    expect(sonuc).not.toBeNull();
    expect(sonuc!.basarili).toBe(true);
    expect(sonuc!.uretilenMiktar).toBe(10);

    const stokRows = await db
      .select({ id: urunler.id, stok: urunler.stok })
      .from(urunler)
      .where(inArray(urunler.id, [ids.asil, ids.oymSag, ids.oymSol, ids.hammaddeAmbalaj]));
    const stokById = new Map(stokRows.map((row) => [row.id, Number(row.stok)]));
    expect(stokById.get(ids.asil)).toBe(10);
    expect(stokById.get(ids.oymSag)).toBe(0);
    expect(stokById.get(ids.oymSol)).toBe(0);
    expect(stokById.get(ids.hammaddeAmbalaj)).toBe(0);

    const hareketRows = await db
      .select({
        urun_id: hareketler.urun_id,
        hareket_tipi: hareketler.hareket_tipi,
        miktar: hareketler.miktar,
      })
      .from(hareketler)
      .where(eq(hareketler.referans_id, ids.uretimSol));

    expect(hareketRows.map((row) => ({
      urunId: row.urun_id,
      hareketTipi: row.hareket_tipi,
      miktar: Number(row.miktar),
    })).sort((a, b) => a.urunId.localeCompare(b.urunId))).toEqual([
      { urunId: ids.asil, hareketTipi: "giris", miktar: 10 },
      { urunId: ids.hammaddeAmbalaj, hareketTipi: "cikis", miktar: 30 },
      { urunId: ids.oymSag, hareketTipi: "cikis", miktar: 10 },
      { urunId: ids.oymSol, hareketTipi: "cikis", miktar: 20 },
    ].sort((a, b) => a.urunId.localeCompare(b.urunId)));
  });

  it("vardiya analiz toplamlarından muafiyet: montaj kaydı toplam üretime karışmaz", async () => {
    await seedWithStocks({ sagStok: "10.0000", solStok: "20.0000" });
    await tryMontajForUretimEmri(ids.uretimSol);

    const [girisHareket] = await db
      .select({ referans_tipi: hareketler.referans_tipi, urun_id: hareketler.urun_id })
      .from(hareketler)
      .where(and(eq(hareketler.referans_id, ids.uretimSol), eq(hareketler.hareket_tipi, "giris")))
      .limit(1);

    expect(girisHareket?.referans_tipi).toBe("montaj");
    expect(girisHareket?.urun_id).toBe(ids.asil);

    await db.insert(makineler).values({
      id: ids.makine,
      kod: "IT-MT-MAK",
      ad: "IT Montaj Analiz Makinesi",
      durum: "aktif",
      is_active: 1,
    });

    await db.insert(uretimEmriOperasyonlari).values([
      {
        id: ids.opBaski,
        uretim_emri_id: ids.uretimSol,
        sira: 1,
        operasyon_adi: "Baski",
        makine_id: ids.makine,
        planlanan_miktar: "20.0000",
        montaj: 0,
        durum: "tamamlandi",
      },
      {
        id: ids.opMontaj,
        uretim_emri_id: ids.uretimSol,
        sira: 2,
        operasyon_adi: "Montaj",
        makine_id: ids.makine,
        planlanan_miktar: "20.0000",
        montaj: 1,
        durum: "tamamlandi",
      },
    ]);

    await db.insert(vardiyaKayitlari).values({
      id: ids.vardiya,
      makine_id: ids.makine,
      vardiya_tipi: "gunduz",
      baslangic: new Date("2026-04-30T07:30:00"),
      bitis: new Date("2026-04-30T19:30:00"),
    });

    await db.insert(operatorGunlukKayitlari).values([
      {
        id: ids.kayitBaski,
        uretim_emri_id: ids.uretimSol,
        makine_id: ids.makine,
        emir_operasyon_id: ids.opBaski,
        gunluk_durum: "tamamlandi",
        ek_uretim_miktari: "8.0000",
        fire_miktari: "1.0000",
        net_miktar: "7.0000",
        kayit_tarihi: new Date("2026-04-30T10:00:00"),
      },
      {
        id: ids.kayitMontaj,
        uretim_emri_id: ids.uretimSol,
        makine_id: ids.makine,
        emir_operasyon_id: ids.opMontaj,
        gunluk_durum: "tamamlandi",
        ek_uretim_miktari: "99.0000",
        fire_miktari: "0.0000",
        net_miktar: "99.0000",
        kayit_tarihi: new Date("2026-04-30T11:00:00"),
      },
    ]);

    const analiz = await getVardiyaAnalizi({ tarih: "2026-04-30", makineId: ids.makine });

    expect(analiz.ozet.toplamUretim).toBe(7);
    expect(analiz.vardiyalar).toHaveLength(1);
    expect(analiz.vardiyalar[0].uretim.toplamMiktar).toBe(7);
    expect(analiz.vardiyalar[0].uretim.fireToplam).toBe(1);
    expect(analiz.makineler[0].toplamUretim).toBe(7);
    expect(analiz.vardiyalar[0].uretim.operasyonKirilimi).toEqual([
      expect.objectContaining({ operasyonId: ids.opBaski, operasyonAdi: "Baski", miktar: 7 }),
    ]);
    expect(analiz.vardiyalar[0].uretim.operasyonKirilimi).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ operasyonId: ids.opMontaj })]),
    );
  });
});
