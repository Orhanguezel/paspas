import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db/client";
import { musteriler } from "@/modules/musteriler/schema";

import { repoCreateCase, repoCreateRun, repoListRuns } from "../repository";
import { testCenterCases, testCenterRuns } from "../schema";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const codes = {
  caseCode: "real:e2e:temizlik-geri-donus-it",
  musteriBase: "IT-REAL-CLEAN-MUS",
  musteriTemp: "IT-REAL-CLEAN-TEMP",
  snapshotSafe: "it-real-clean-snapshot-safe",
  snapshotRisk: "it-real-clean-snapshot-risk",
} as const;

async function cleanup() {
  await db.delete(testCenterRuns).where(inArray(testCenterRuns.snapshot_id, [codes.snapshotSafe, codes.snapshotRisk]));
  await db.delete(testCenterCases).where(eq(testCenterCases.kod, codes.caseCode));
  await db.delete(musteriler).where(inArray(musteriler.kod, [codes.musteriBase, codes.musteriTemp]));
}

async function seed() {
  await db.insert(musteriler).values({
    id: "11111111-1111-4111-8111-111111111601",
    tur: "musteri",
    kod: codes.musteriBase,
    ad: "IT Temizlik Snapshot Öncesi",
    is_active: 1,
  });
}

async function snapshotMusteriler() {
  return db
    .select()
    .from(musteriler)
    .where(inArray(musteriler.kod, [codes.musteriBase, codes.musteriTemp]));
}

async function restoreMusteriler(rows: Awaited<ReturnType<typeof snapshotMusteriler>>) {
  await db.delete(musteriler).where(inArray(musteriler.kod, [codes.musteriBase, codes.musteriTemp]));
  if (rows.length > 0) {
    await db.insert(musteriler).values(rows);
  }
}

async function snapshotRunsBySnapshotId(snapshotId: string) {
  return db.select().from(testCenterRuns).where(eq(testCenterRuns.snapshot_id, snapshotId));
}

async function restoreRunsBySnapshotId(snapshotId: string, rows: Awaited<ReturnType<typeof snapshotRunsBySnapshotId>>) {
  // Test Merkezi run kayıtları audit log niteliğinde — snapshot restore sırasında
  // silinmemeli. Bu helper non-destructive davranır: yalnızca snapshot'taki rows
  // mevcut değilse geri ekler. Restore öncesi yazılmış yeni run'lar korunur.
  const existing = await db
    .select({ id: testCenterRuns.id })
    .from(testCenterRuns)
    .where(eq(testCenterRuns.snapshot_id, snapshotId));
  const existingIds = new Set(existing.map((r) => r.id));
  const toAdd = rows.filter((r) => !existingIds.has(r.id));
  if (toAdd.length > 0) {
    await db.insert(testCenterRuns).values(toAdd);
  }
}

describeIntegration("gerçek veri temizlik ve geri dönüş", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
  });

  it("snapshot sonrası kirlenen test verisini geri alır ve restore sonrasında sonuç kaydını snapshot id ile saklar", async () => {
    const caseRow = await repoCreateCase({
      kod: codes.caseCode,
      baslik: "IT gerçek temizlik/geri dönüş",
      kategori: "real-db-e2e",
      kapsam: "backend",
      komut: "bun test src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts",
      dosyaYolu: "backend/src/modules/test_center/__tests__/temizlik_geri_donus.real.integration.test.ts",
      durum: "active",
      riskNotu: "Scoped snapshot restore sözleşmesi",
      sira: 116,
      isActive: true,
    });

    const snapshot = await snapshotMusteriler();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].ad).toBe("IT Temizlik Snapshot Öncesi");

    await db
      .update(musteriler)
      .set({ ad: "IT Temizlik Test Sırasında Değişti" })
      .where(eq(musteriler.kod, codes.musteriBase));
    await db.insert(musteriler).values({
      id: "11111111-1111-4111-8111-111111111602",
      tur: "musteri",
      kod: codes.musteriTemp,
      ad: "IT Temizlik Geçici Kayıt",
      is_active: 1,
    });

    expect(await snapshotMusteriler()).toHaveLength(2);

    await restoreMusteriler(snapshot);
    const restored = await snapshotMusteriler();
    expect(restored).toHaveLength(1);
    expect(restored[0].kod).toBe(codes.musteriBase);
    expect(restored[0].ad).toBe("IT Temizlik Snapshot Öncesi");

    const run = await repoCreateRun({
      caseId: caseRow.id,
      baslik: "IT temizlik restore sonrası sonuç",
      komut: caseRow.komut ?? undefined,
      status: "passed",
      passCount: 1,
      failCount: 0,
      skipCount: 0,
      expectCount: 5,
      outputExcerpt: "Scoped snapshot restore geçti",
      snapshotId: codes.snapshotSafe,
      startedAt: new Date("2032-02-01T08:00:00"),
      finishedAt: new Date("2032-02-01T08:01:00"),
    }, null);

    const runs = await repoListRuns({ caseId: caseRow.id, limit: 20, offset: 0 });
    expect(runs.items.map((item) => item.id)).toContain(run.id);
    expect(runs.items.find((item) => item.id === run.id)?.snapshot_id).toBe(codes.snapshotSafe);
  });

  it("restore sonuç kaydı yazıldıktan sonra çalışsa bile Test Merkezi run kaydını korumalı", async () => {
    const caseRow = await repoCreateCase({
      kod: codes.caseCode,
      baslik: "IT gerçek temizlik/geri dönüş",
      kategori: "real-db-e2e",
      kapsam: "backend",
      durum: "active",
      sira: 116,
      isActive: true,
    });
    const beforeRuns = await snapshotRunsBySnapshotId(codes.snapshotRisk);
    expect(beforeRuns).toHaveLength(0);

    const run = await repoCreateRun({
      caseId: caseRow.id,
      baslik: "IT restore öncesi yazılmış sonuç",
      status: "passed",
      passCount: 1,
      failCount: 0,
      snapshotId: codes.snapshotRisk,
    }, null);

    await restoreRunsBySnapshotId(codes.snapshotRisk, beforeRuns);

    const rows = await db.select().from(testCenterRuns).where(eq(testCenterRuns.id, run.id));
    expect(rows).toHaveLength(1);
  });
});
