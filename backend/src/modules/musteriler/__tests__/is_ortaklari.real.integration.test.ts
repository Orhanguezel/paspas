import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { satisSiparisleri } from "@/modules/satis_siparisleri/schema";
import { satinAlmaSiparisleri } from "@/modules/satin_alma/schema";
import {
  repoCreate as repoCreateMusteri,
  repoDelete as repoDeleteMusteri,
  repoGetById as repoGetMusteriById,
  repoList as repoListMusteriler,
  repoUpdate as repoUpdateMusteri,
} from "@/modules/musteriler/repository";
import {
  repoCreate as repoCreateTedarikci,
  repoDelete as repoDeleteTedarikci,
  repoGetById as repoGetTedarikciById,
  repoList as repoListTedarikciler,
  repoUpdate as repoUpdateTedarikci,
} from "@/modules/tedarikci/repository";

import { musteriler } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  musteri: "11111111-1111-4111-8111-111111111111",
  musteriSiparis: "11111111-1111-4111-8111-111111111112",
  tedarikci: "22222222-2222-4222-8222-222222222221",
  satinAlmaSiparis: "22222222-2222-4222-8222-222222222222",
} as const;

const codes = {
  musteri: "IT-REAL-MUS-001",
  tedarikci: "IT-REAL-TED-001",
} as const;

async function cleanup() {
  await db.delete(satisSiparisleri).where(eq(satisSiparisleri.id, ids.musteriSiparis));
  await db.delete(satinAlmaSiparisleri).where(eq(satinAlmaSiparisleri.id, ids.satinAlmaSiparis));
  await db.delete(musteriler).where(inArray(musteriler.id, [ids.musteri, ids.tedarikci]));
  await db.delete(musteriler).where(inArray(musteriler.kod, [codes.musteri, codes.tedarikci]));
}

describeIntegration("gerçek veri iş ortakları operasyonları", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("müşteri oluşturur, düzenler, pasifleştirir ve bağlantı yokken siler", async () => {
    const created = await repoCreateMusteri({
      tur: "musteri",
      kod: codes.musteri,
      ad: "IT Gerçek Müşteri",
      ilgiliKisi: "Test Yetkilisi",
      telefon: "02120000000",
      email: "it-gercek-musteri@example.com",
      cariKodu: "IT-CARI-MUS",
      sevkiyatNotu: "Test sevkiyat notu",
      iskonto: 5,
      isActive: true,
    });
    await db.update(musteriler).set({ id: ids.musteri }).where(eq(musteriler.id, created.id));

    let row = await repoGetMusteriById(ids.musteri);
    expect(row?.kod).toBe(codes.musteri);
    expect(row?.tur).toBe("musteri");
    expect(Number(row?.iskonto)).toBe(5);

    row = await repoUpdateMusteri(ids.musteri, {
      ad: "IT Gerçek Müşteri Güncel",
      iskonto: 7.5,
      isActive: false,
    });
    expect(row?.ad).toBe("IT Gerçek Müşteri Güncel");
    expect(Number(row?.iskonto)).toBe(7.5);
    expect(row?.is_active).toBe(0);

    const passiveList = await repoListMusteriler({
      tur: "musteri",
      isActive: false,
      q: "IT Gerçek Müşteri Güncel",
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(passiveList.items.map((item) => item.id)).toContain(ids.musteri);

    await repoDeleteMusteri(ids.musteri);
    expect(await repoGetMusteriById(ids.musteri)).toBeNull();
  });

  it("satış siparişi bağlantısı olan müşteriyi silmeye izin vermez", async () => {
    const created = await repoCreateMusteri({
      tur: "musteri",
      kod: codes.musteri,
      ad: "IT Bağlı Müşteri",
    });
    await db.update(musteriler).set({ id: ids.musteri }).where(eq(musteriler.id, created.id));
    await db.insert(satisSiparisleri).values({
      id: ids.musteriSiparis,
      siparis_no: "IT-MUS-SIP-001",
      musteri_id: ids.musteri,
      siparis_tarihi: "2026-04-30",
      durum: "taslak",
    });

    await expect(repoDeleteMusteri(ids.musteri)).rejects.toMatchObject({
      message: "musteri_bagimliligi_var",
    });

    expect(await repoGetMusteriById(ids.musteri)).not.toBeNull();
  });

  it("tedarikçi oluşturur, düzenler, pasifleştirir ve bağlantı yokken siler", async () => {
    const created = await repoCreateTedarikci({
      kod: codes.tedarikci,
      ad: "IT Gerçek Tedarikçi",
      ilgiliKisi: "Satın Alma Yetkilisi",
      telefon: "02120000001",
      email: "it-gercek-tedarikci@example.com",
      adres: "Test adres",
      iskonto: 3,
      isActive: true,
    });
    await db.update(musteriler).set({ id: ids.tedarikci }).where(eq(musteriler.id, created.id));

    let row = await repoGetTedarikciById(ids.tedarikci);
    expect(row?.kod).toBe(codes.tedarikci);
    expect(row?.tur).toBe("tedarikci");

    row = await repoUpdateTedarikci(ids.tedarikci, {
      ad: "IT Gerçek Tedarikçi Güncel",
      iskonto: 4.5,
      isActive: false,
    });
    expect(row?.ad).toBe("IT Gerçek Tedarikçi Güncel");
    expect(Number(row?.iskonto)).toBe(4.5);
    expect(row?.is_active).toBe(0);

    const passiveList = await repoListTedarikciler({
      isActive: false,
      q: "IT Gerçek Tedarikçi Güncel",
      limit: 50,
      offset: 0,
      sort: "created_at",
      order: "desc",
    });
    expect(passiveList.items.map((item) => item.id)).toContain(ids.tedarikci);

    await repoDeleteTedarikci(ids.tedarikci);
    expect(await repoGetTedarikciById(ids.tedarikci)).toBeNull();
  });

  it("satın alma bağlantısı olan tedarikçiyi silmeye izin vermez", async () => {
    const created = await repoCreateTedarikci({
      kod: codes.tedarikci,
      ad: "IT Bağlı Tedarikçi",
    });
    await db.update(musteriler).set({ id: ids.tedarikci }).where(eq(musteriler.id, created.id));
    await db.insert(satinAlmaSiparisleri).values({
      id: ids.satinAlmaSiparis,
      siparis_no: "IT-TED-SAS-001",
      tedarikci_id: ids.tedarikci,
      siparis_tarihi: "2026-04-30",
      durum: "taslak",
    });

    await expect(repoDeleteTedarikci(ids.tedarikci)).rejects.toThrow();
    expect(await repoGetTedarikciById(ids.tedarikci)).not.toBeNull();
  });
});
