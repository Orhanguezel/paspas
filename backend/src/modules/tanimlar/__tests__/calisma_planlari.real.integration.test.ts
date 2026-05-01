import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray, sql } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { isMakineWorkingDay } from "@/modules/_shared/planlama";
import { makineler } from "@/modules/makine_havuzu/schema";

import {
  repoCreateHaftaSonuPlan,
  repoCreateTatil,
  repoCreateVardiya,
  repoDeleteHaftaSonuPlan,
  repoDeleteTatil,
  repoDeleteVardiya,
  repoGetHaftaSonuPlanByDate,
  repoGetTatilById,
  repoGetVardiyaById,
  repoUpdateHaftaSonuPlan,
  repoUpdateTatil,
  repoUpdateVardiya,
} from "../repository";
import { haftaSonuPlanlari, tatiller, vardiyalar } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const ids = {
  makineA: "it-real-plan-mak-a-0000000001",
  makineB: "it-real-plan-mak-b-0000000001",
} as const;

const codes = {
  makineA: "IT-REAL-PLAN-MAK-A",
  makineB: "IT-REAL-PLAN-MAK-B",
} as const;

const dates = {
  tatilIlk: "2031-04-30",
  tatilGuncel: "2031-05-01",
  cumartesi: "2031-05-03",
  pazar: "2031-05-04",
} as const;

const vardiyaAdlari = ["IT Gerçek Vardiya", "IT Gerçek Vardiya Güncel"] as const;

async function cleanup() {
  await db
    .delete(haftaSonuPlanlari)
    .where(sql`${haftaSonuPlanlari.hafta_baslangic} IN (${dates.cumartesi}, ${dates.pazar})`);
  await db
    .delete(tatiller)
    .where(sql`${tatiller.tarih} IN (${dates.tatilIlk}, ${dates.tatilGuncel})`);
  await db.delete(vardiyalar).where(inArray(vardiyalar.ad, [...vardiyaAdlari]));
  await db.delete(makineler).where(inArray(makineler.id, [ids.makineA, ids.makineB]));
}

async function seedMachines() {
  await db.insert(makineler).values([
    {
      id: ids.makineA,
      kod: codes.makineA,
      ad: "IT Plan Makine A",
      durum: "aktif",
      is_active: 1,
    },
    {
      id: ids.makineB,
      kod: codes.makineB,
      ad: "IT Plan Makine B",
      durum: "aktif",
      is_active: 1,
    },
  ]);
}

describeIntegration("gerçek veri çalışma planları", () => {
  beforeEach(async () => {
    await cleanup();
    await seedMachines();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("vardiya oluşturur, 07:30 başlangıçla günceller, pasifleştirir ve siler", async () => {
    const vardiya = await repoCreateVardiya({
      ad: vardiyaAdlari[0],
      baslangicSaati: "08:00",
      bitisSaati: "16:00",
      aciklama: "Gerçek veri vardiya smoke",
      isActive: true,
    });

    let row = await repoGetVardiyaById(vardiya.id);
    expect(row?.ad).toBe(vardiyaAdlari[0]);
    expect(row?.baslangic_saati).toBe("08:00");
    expect(row?.bitis_saati).toBe("16:00");
    expect(row?.is_active).toBe(1);

    row = await repoUpdateVardiya(vardiya.id, {
      ad: vardiyaAdlari[1],
      baslangicSaati: "07:30",
      bitisSaati: "15:30",
      aciklama: "07:30 başlangıç doğrulandı",
      isActive: false,
    });
    expect(row?.ad).toBe(vardiyaAdlari[1]);
    expect(row?.baslangic_saati).toBe("07:30");
    expect(row?.bitis_saati).toBe("15:30");
    expect(row?.is_active).toBe(0);

    await repoDeleteVardiya(vardiya.id);
    expect(await repoGetVardiyaById(vardiya.id)).toBeNull();
  });

  it("tatil günü planlamada çalışma gününü kapatır, güncellenince yeni tarihe taşır", async () => {
    expect(await isMakineWorkingDay(ids.makineA, new Date(`${dates.tatilIlk}T12:00:00`))).toBe(true);

    const tatil = await repoCreateTatil({
      ad: "IT Gerçek Tatil",
      tarih: dates.tatilIlk,
      baslangicSaati: "00:00",
      bitisSaati: "23:59",
      aciklama: "Planlama tatil smoke",
    });

    expect(await isMakineWorkingDay(ids.makineA, new Date(`${dates.tatilIlk}T12:00:00`))).toBe(false);

    const updated = await repoUpdateTatil(tatil.id, {
      ad: "IT Gerçek Tatil Güncel",
      tarih: dates.tatilGuncel,
      baslangicSaati: "00:00",
      bitisSaati: "23:59",
    });
    expect(updated?.ad).toBe("IT Gerçek Tatil Güncel");
    expect(await isMakineWorkingDay(ids.makineA, new Date(`${dates.tatilIlk}T12:00:00`))).toBe(true);
    expect(await isMakineWorkingDay(ids.makineA, new Date(`${dates.tatilGuncel}T12:00:00`))).toBe(false);

    await repoDeleteTatil(tatil.id);
    expect(await repoGetTatilById(tatil.id)).toBeNull();
    expect(await isMakineWorkingDay(ids.makineA, new Date(`${dates.tatilGuncel}T12:00:00`))).toBe(true);
  });

  it("hafta sonu planı seçili makine için çalışma gününü açar ve makine seçimi güncellenince taşır", async () => {
    const saturday = new Date(`${dates.cumartesi}T12:00:00`);

    expect(await isMakineWorkingDay(ids.makineA, saturday)).toBe(false);
    expect(await isMakineWorkingDay(ids.makineB, saturday)).toBe(false);

    const plan = await repoCreateHaftaSonuPlan({
      haftaBaslangic: dates.cumartesi,
      makineIds: [ids.makineA],
      aciklama: "Cumartesi A makinesi çalışır",
    });

    expect((plan as typeof plan & { makine_ids?: string[] }).makine_ids).toEqual([ids.makineA]);
    expect(await isMakineWorkingDay(ids.makineA, saturday)).toBe(true);
    expect(await isMakineWorkingDay(ids.makineB, saturday)).toBe(false);
    expect(await repoGetHaftaSonuPlanByDate(saturday, ids.makineA)).toEqual({ calisiyor: true });

    const updated = await repoUpdateHaftaSonuPlan(plan.id, {
      haftaBaslangic: dates.cumartesi,
      makineIds: [ids.makineB],
      aciklama: "Cumartesi B makinesi çalışır",
    });
    expect((updated as typeof updated & { makine_ids?: string[] })?.makine_ids).toEqual([ids.makineB]);
    expect(await isMakineWorkingDay(ids.makineA, saturday)).toBe(false);
    expect(await isMakineWorkingDay(ids.makineB, saturday)).toBe(true);

    expect(await repoDeleteHaftaSonuPlan(updated!.id)).toBe(true);
    expect(await isMakineWorkingDay(ids.makineB, saturday)).toBe(false);
  });

  it("pazar hafta sonu planı seçili makine için pazar gününü açmalı", async () => {
    const sunday = new Date(`${dates.pazar}T12:00:00`);

    const plan = await repoCreateHaftaSonuPlan({
      haftaBaslangic: dates.pazar,
      makineIds: [ids.makineB],
      aciklama: "Pazar B makinesi çalışır",
    });

    expect((plan as typeof plan & { makine_ids?: string[] }).makine_ids).toEqual([ids.makineB]);
    expect(await isMakineWorkingDay(ids.makineB, sunday)).toBe(true);
  });
});
