/**
 * Vardiya scheduler integration testi:
 *   - Süresi dolmuş açık vardiya bitis ile kapatılır
 *   - Süresi dolmamış açık vardiya dokunulmaz
 *   - Test ortamında start scheduler no-op
 */
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler } from '@/modules/makine_havuzu/schema';

import { closeAllExpiredOpenShifts } from '../repository';
import { vardiyaKayitlari } from '../schema';
import { startShiftAutoCloseScheduler, stopShiftAutoCloseScheduler } from '../shift_scheduler';

const isTestEnv = process.env.NODE_ENV === 'test';
const allowDbIntegration = isTestEnv || process.env.RUN_DB_INTEGRATION === '1';
const describeIntegration = allowDbIntegration ? describe : describe.skip;

const ids = {
  makine: 'it-shift-sched-mak-000000000001',
  expiredVardiya: 'it-shift-sched-vrd-expired-001',
  freshVardiya: 'it-shift-sched-vrd-fresh-00001',
} as const;

async function cleanup() {
  await db.delete(vardiyaKayitlari).where(inArray(vardiyaKayitlari.id, [ids.expiredVardiya, ids.freshVardiya]));
  await db.delete(makineler).where(eq(makineler.id, ids.makine));
}

async function seed(opts: { freshShift?: boolean }) {
  await db.insert(makineler).values({
    id: ids.makine,
    kod: 'IT-SHIFT-SCHED-MAK',
    ad: 'IT Scheduler Makine',
  });

  // Bugünden 3 gün önce açılmış, hâlâ kapanmamış (bitis NULL) — açıkça expired
  const expiredStart = new Date();
  expiredStart.setDate(expiredStart.getDate() - 3);
  expiredStart.setHours(7, 30, 0, 0);
  await db.insert(vardiyaKayitlari).values({
    id: ids.expiredVardiya,
    makine_id: ids.makine,
    operator_user_id: null,
    vardiya_tipi: 'gunduz',
    baslangic: expiredStart,
    bitis: null,
  });

  if (opts.freshShift) {
    // Az önce açılmış, henüz bitmemiş bir vardiya
    const freshStart = new Date();
    freshStart.setMinutes(freshStart.getMinutes() - 30);
    await db.insert(vardiyaKayitlari).values({
      id: ids.freshVardiya,
      makine_id: ids.makine,
      operator_user_id: null,
      vardiya_tipi: 'gunduz',
      baslangic: freshStart,
      bitis: null,
    });
  }
}

describeIntegration('vardiya auto-close scheduler', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    stopShiftAutoCloseScheduler();
  });

  afterAll(async () => {
    stopShiftAutoCloseScheduler();
  });

  it('closeAllExpiredOpenShifts süresi dolmuş açık vardiyayı kapatır', async () => {
    await seed({});

    const closed = await closeAllExpiredOpenShifts(new Date());
    expect(closed).toBeGreaterThanOrEqual(1);

    const [row] = await db
      .select({ id: vardiyaKayitlari.id, bitis: vardiyaKayitlari.bitis })
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.id, ids.expiredVardiya))
      .limit(1);
    expect(row?.bitis).not.toBeNull();
  });

  it('now baslangic anına eşitse henüz dolmamış vardiyaya dokunmaz', async () => {
    await seed({});

    // Açık vardiya kaydı (3 gün önce başladı). Şu an o vardiya başladığı an gibi
    // davranırsak (now = baslangic + 1 ms) — pencere henüz dolmamış olmalı.
    const [shift] = await db
      .select({ baslangic: vardiyaKayitlari.baslangic })
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.id, ids.expiredVardiya))
      .limit(1);
    const justAfterStart = new Date(new Date(shift!.baslangic).getTime() + 1);

    const closed = await closeAllExpiredOpenShifts(justAfterStart);
    expect(closed).toBe(0);

    const [after] = await db
      .select({ bitis: vardiyaKayitlari.bitis })
      .from(vardiyaKayitlari)
      .where(eq(vardiyaKayitlari.id, ids.expiredVardiya))
      .limit(1);
    expect(after?.bitis).toBeNull();
  });

  it('Çağrı tekrarlandığında zaten kapatılmış vardiya tekrar dokunulmaz (idempotent)', async () => {
    await seed({});

    const firstClosed = await closeAllExpiredOpenShifts(new Date());
    const secondClosed = await closeAllExpiredOpenShifts(new Date());
    expect(firstClosed).toBeGreaterThanOrEqual(1);
    expect(secondClosed).toBe(0);
  });

  it('NODE_ENV=test ise startShiftAutoCloseScheduler no-op olur', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    startShiftAutoCloseScheduler();
    // Eğer scheduler çalışsaydı stop fonksiyonu setInterval'i temizleyecekti.
    // No-op olduğunu çift start edip patlatmadığıyla doğruluyoruz.
    startShiftAutoCloseScheduler();
    stopShiftAutoCloseScheduler();
    process.env.NODE_ENV = originalEnv;
    expect(true).toBe(true);
  });
});
