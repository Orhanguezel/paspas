import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { hareketler } from "@/modules/hareketler/schema";
import { makineler, makineKuyrugu } from "@/modules/makine_havuzu/schema";
import { notifications } from "@/modules/notifications/schema";
import { receteKalemleri, receteler } from "@/modules/receteler/schema";
import { durusNedenleri, vardiyalar } from "@/modules/tanimlar/schema";
import { uretimEmirleri, uretimEmriOperasyonlari } from "@/modules/uretim_emirleri/schema";
import { urunler, urunOperasyonlari } from "@/modules/urunler/schema";

import {
  durusKayitlari,
  operatorGunlukKayitlari,
  vardiyaKayitlari,
} from "../schema";
import {
  repoDevamEt,
  repoDuraklat,
  repoGunlukUretimGir,
  repoListMakineKuyrugu,
  repoUretimBaslat,
  repoUretimBitir,
} from "../repository";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  vardiya: "it-real-op-vrd-000000000001",
  durusNedeni: "it-real-op-drs-000000000001",
  makine: "it-real-op-mak-000000000001",
  urun: "it-real-op-urun-00000000001",
  hammadde: "it-real-op-hm-000000000001",
  recete: "it-real-op-rec-00000000001",
  receteKalem: "it-real-op-rk-000000000001",
  urunOperasyon: "it-real-op-uop-00000000001",
  emir: "it-real-op-emir-00000000001",
  emirOp: "it-real-op-emop-00000000001",
  kuyruk: "it-real-op-kuy-000000000001",
} as const;

const codes = {
  durus: "IT-REAL-OP-DURUS",
  makine: "IT-REAL-OP-MAK",
  urun: "IT-REAL-OP-URUN",
  hammadde: "IT-REAL-OP-HM",
  recete: "IT-REAL-OP-REC",
  emir: "UE-IT-REAL-OP-001",
} as const;

async function cleanup() {
  await db.delete(notifications).where(inArray(notifications.title, ["Uretim tamamlandi", "Gunluk uretim girisi alindi"]));
  await db.delete(durusKayitlari).where(eq(durusKayitlari.makine_kuyruk_id, ids.kuyruk));
  await db.delete(operatorGunlukKayitlari).where(eq(operatorGunlukKayitlari.uretim_emri_id, ids.emir));
  await db.delete(vardiyaKayitlari).where(eq(vardiyaKayitlari.makine_id, ids.makine));
  await db.delete(makineKuyrugu).where(eq(makineKuyrugu.id, ids.kuyruk));
  await db.delete(hareketler).where(eq(hareketler.referans_id, ids.emir));
  await db.delete(uretimEmriOperasyonlari).where(eq(uretimEmriOperasyonlari.id, ids.emirOp));
  await db.delete(uretimEmirleri).where(eq(uretimEmirleri.id, ids.emir));
  await db.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, ids.recete));
  await db.delete(receteler).where(eq(receteler.id, ids.recete));
  await db.delete(urunOperasyonlari).where(eq(urunOperasyonlari.id, ids.urunOperasyon));
  await db.delete(urunler).where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
  await db.delete(durusNedenleri).where(eq(durusNedenleri.id, ids.durusNedeni));
  await db.delete(vardiyalar).where(eq(vardiyalar.id, ids.vardiya));
}

async function seed() {
  await db.insert(vardiyalar).values({
    id: ids.vardiya,
    ad: "IT Gerçek Operatör Gündüz",
    baslangic_saati: "00:00",
    bitis_saati: "23:59",
    is_active: 1,
    aciklama: "Gerçek operatör testi için gün boyu vardiya",
  });
  await db.insert(durusNedenleri).values({
    id: ids.durusNedeni,
    kod: codes.durus,
    ad: "IT Gerçek Operatör Duruş",
    kategori: "makine",
    is_active: 1,
  });
  await db.insert(makineler).values({
    id: ids.makine,
    kod: codes.makine,
    ad: "IT Gerçek Operatör Makinesi",
    durum: "aktif",
    is_active: 1,
  });
  await db.insert(urunler).values([
    {
      id: ids.urun,
      kategori: "urun",
      tedarik_tipi: "uretim",
      kod: codes.urun,
      ad: "IT Gerçek Operatör Ürünü",
      birim: "adet",
      stok: "0.0000",
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
      ad: "IT Gerçek Operatör Hammaddesi",
      birim: "kg",
      stok: "100.0000",
      kritik_stok: "0.0000",
      rezerve_stok: "0.0000",
      kdv_orani: "20.00",
      stok_takip_aktif: 1,
      is_active: 1,
    },
  ]);
  await db.insert(urunOperasyonlari).values({
    id: ids.urunOperasyon,
    urun_id: ids.urun,
    sira: 1,
    operasyon_adi: "IT Gerçek Operatör Baskı",
    hazirlik_suresi_dk: 5,
    cevrim_suresi_sn: "6.00",
    montaj: 0,
    is_active: 1,
  });
  await db.insert(receteler).values({
    id: ids.recete,
    kod: codes.recete,
    ad: "IT Gerçek Operatör Reçetesi",
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
  await db.insert(uretimEmirleri).values({
    id: ids.emir,
    emir_no: codes.emir,
    urun_id: ids.urun,
    recete_id: ids.recete,
    planlanan_miktar: "20.0000",
    uretilen_miktar: "0.0000",
    durum: "planlandi",
    is_active: 1,
  });
  await db.insert(uretimEmriOperasyonlari).values({
    id: ids.emirOp,
    uretim_emri_id: ids.emir,
    urun_operasyon_id: ids.urunOperasyon,
    sira: 1,
    operasyon_adi: "IT Gerçek Operatör Baskı",
    makine_id: ids.makine,
    hazirlik_suresi_dk: 5,
    cevrim_suresi_sn: "6.00",
    planlanan_miktar: "20.0000",
    uretilen_miktar: "0.0000",
    fire_miktar: "0.0000",
    montaj: 0,
    durum: "bekliyor",
  });
  await db.insert(makineKuyrugu).values({
    id: ids.kuyruk,
    makine_id: ids.makine,
    uretim_emri_id: ids.emir,
    emir_operasyon_id: ids.emirOp,
    sira: 1,
    planlanan_sure_dk: 2,
    hazirlik_suresi_dk: 5,
    durum: "bekliyor",
  });
}

async function getStocks() {
  const rows = await db
    .select({ id: urunler.id, stok: urunler.stok })
    .from(urunler)
    .where(inArray(urunler.id, [ids.urun, ids.hammadde]));
  return Object.fromEntries(rows.map((row) => [row.id, Number(row.stok)]));
}

describeIntegration("gerçek veri operatör akışı", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("işe başlar, duruş girer, üretim adedi işler ve işi bitirir", async () => {
    const started = await repoUretimBaslat({ makineKuyrukId: ids.kuyruk }, null);
    expect(started.durum).toBe("calisiyor");
    expect(started.gercekBaslangic).not.toBeNull();

    let kuyruk = await repoListMakineKuyrugu({ makineId: ids.makine, limit: 20, offset: 0 });
    expect(kuyruk.items[0]?.durum).toBe("calisiyor");
    expect(kuyruk.items[0]?.oncekiUretimToplam).toBe(0);

    const [vardiya] = await db
      .select()
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.makine_id, ids.makine))
      .limit(1);
    expect(vardiya?.bitis).toBeNull();

    await repoDuraklat({
      makineKuyrukId: ids.kuyruk,
      durusNedeniId: ids.durusNedeni,
      neden: "Planlı bakım kontrolü",
      anlikUretimMiktari: 2,
    }, null);

    const [openDurus] = await db
      .select()
      .from(durusKayitlari)
      .where(eq(durusKayitlari.makine_kuyruk_id, ids.kuyruk))
      .limit(1);
    expect(openDurus?.bitis).toBeNull();
    expect(openDurus?.neden).toBe("Planlı bakım kontrolü");

    await repoDevamEt({
      makineKuyrukId: ids.kuyruk,
      uretilenMiktar: 4,
      fireMiktar: 1,
      birimTipi: "adet",
      notlar: "Duruş sonrası üretim",
    }, null);

    const [closedDurus] = await db
      .select({ bitis: durusKayitlari.bitis, sureDk: durusKayitlari.sure_dk })
      .from(durusKayitlari)
      .where(eq(durusKayitlari.makine_kuyruk_id, ids.kuyruk))
      .limit(1);
    expect(closedDurus?.bitis).not.toBeNull();
    expect(Number(closedDurus?.sureDk ?? 0)).toBeGreaterThanOrEqual(0);

    const gunluk = await repoGunlukUretimGir({
      makineId: ids.makine,
      uretilenMiktar: 5,
      fireMiktar: 1,
      birimTipi: "adet",
      notlar: "Vardiya içi günlük giriş",
    }, null);
    expect(gunluk.netMiktar).toBe(4);
    expect(gunluk.gunlukDurum).toBe("yarim_kaldi");

    kuyruk = await repoListMakineKuyrugu({ makineId: ids.makine, limit: 20, offset: 0 });
    expect(kuyruk.items[0]?.durum).toBe("calisiyor");
    expect(kuyruk.items[0]?.oncekiUretimToplam).toBe(9);
    expect(kuyruk.items[0]?.oncekiFireToplam).toBe(2);

    const finished = await repoUretimBitir({
      makineKuyrukId: ids.kuyruk,
      uretilenMiktar: 10,
      fireMiktar: 2,
      birimTipi: "adet",
      notlar: "Operatör gerçek DB bitiş",
    }, null);
    expect(finished.durum).toBe("tamamlandi");
    expect(finished.stokFarki).toBe(8);

    const [emir] = await db
      .select({ durum: uretimEmirleri.durum, uretilenMiktar: uretimEmirleri.uretilen_miktar })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, ids.emir))
      .limit(1);
    expect(emir?.durum).toBe("tamamlandi");
    expect(Number(emir?.uretilenMiktar ?? 0)).toBe(15);

    const [op] = await db
      .select({
        durum: uretimEmriOperasyonlari.durum,
        uretilenMiktar: uretimEmriOperasyonlari.uretilen_miktar,
        fireMiktar: uretimEmriOperasyonlari.fire_miktar,
      })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, ids.emirOp))
      .limit(1);
    expect(op?.durum).toBe("tamamlandi");
    expect(Number(op?.uretilenMiktar ?? 0)).toBe(15);
    expect(Number(op?.fireMiktar ?? 0)).toBe(4);

    expect(await getStocks()).toEqual({
      [ids.urun]: 15,
      [ids.hammadde]: 70,
    });

    const hareketTotals = await db
      .select({
        urunId: hareketler.urun_id,
        hareketTipi: hareketler.hareket_tipi,
        toplam: sql<string>`coalesce(sum(${hareketler.miktar}), 0)`,
      })
      .from(hareketler)
      .where(eq(hareketler.referans_id, ids.emir))
      .groupBy(hareketler.urun_id, hareketler.hareket_tipi);
    expect(hareketTotals.map((row) => ({
      urunId: row.urunId,
      hareketTipi: row.hareketTipi,
      toplam: Number(row.toplam),
    })).sort((a, b) => `${a.urunId}-${a.hareketTipi}`.localeCompare(`${b.urunId}-${b.hareketTipi}`))).toEqual([
      { urunId: ids.hammadde, hareketTipi: "cikis", toplam: 30 },
      { urunId: ids.urun, hareketTipi: "giris", toplam: 15 },
    ].sort((a, b) => `${a.urunId}-${a.hareketTipi}`.localeCompare(`${b.urunId}-${b.hareketTipi}`)));

    const [gunlukSummary] = await db
      .select({
        count: sql<number>`count(*)`,
        toplamNet: sql<string>`coalesce(sum(${operatorGunlukKayitlari.net_miktar}), 0)`,
        toplamFire: sql<string>`coalesce(sum(${operatorGunlukKayitlari.fire_miktari}), 0)`,
      })
      .from(operatorGunlukKayitlari)
      .where(
        and(
          eq(operatorGunlukKayitlari.uretim_emri_id, ids.emir),
          inArray(operatorGunlukKayitlari.gunluk_durum, ["devam_ediyor", "yarim_kaldi", "tamamlandi"]),
        ),
      );
    expect(Number(gunlukSummary?.count ?? 0)).toBe(3);
    expect(Number(gunlukSummary?.toplamNet ?? 0)).toBe(15);
    expect(Number(gunlukSummary?.toplamFire ?? 0)).toBe(4);
  });
});
