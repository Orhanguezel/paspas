// =============================================================
// FILE: src/modules/_shared/test_calisma_gunu.ts
// Integration test helpers — bugun makinenin "calisma gunu" olmasini
// garanti eder. Operator/uretim akisi testlerinde kullanilir.
// =============================================================

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { haftaSonuPlanlari, tatiller } from '@/modules/tanimlar/schema';

type TatilRow = typeof tatiller.$inferSelect;

/** Test sirasinda gecici olarak silinmis tatil kayitlarinin yedegi. */
export type CalismaGunuYedek = {
  silinenTatiller: TatilRow[];
  eklenenHaftaSonuPlaniId: string | null;
};

/** Yalnizca tarih kismi (saat=00:00) olan yeni Date dondurur. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Testin calistigi gun tatil veya hafta sonu olabilir. Bu yardimci, makine
 * icin "bugun calisma gunu" garantisi verir:
 *   1) Bugune ait tatil kayitlari varsa — yedekle ve gecici sil
 *   2) Bugun hafta sonu ise — makine icin override hafta_sonu_plani ekle
 *
 * Cleanup icin `restoreCalismaGunu(yedek)` cagrilmali.
 */
export async function ensureMakineCalisirBugun(
  makineId: string,
  haftaSonuPlaniId: string,
): Promise<CalismaGunuYedek> {
  const today = startOfDay(new Date());
  const yedek: CalismaGunuYedek = {
    silinenTatiller: [],
    eklenenHaftaSonuPlaniId: null,
  };

  // 1. Bugun tatil mi? Yedekle + sil
  const holidayRows = await db.select().from(tatiller).where(eq(tatiller.tarih, today));
  if (holidayRows.length) {
    yedek.silinenTatiller = holidayRows;
    await db.delete(tatiller).where(eq(tatiller.tarih, today));
  }

  // 2. Bugun hafta sonu mu? Override ekle
  const dayOfWeek = today.getDay(); // 0=Pzr, 1=Pzt..., 6=Cmt
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const monday = new Date(today);
    const offset = (dayOfWeek + 6) % 7; // Pzr=6, Cmt=5
    monday.setDate(today.getDate() - offset);

    await db.insert(haftaSonuPlanlari).values({
      id: haftaSonuPlaniId,
      hafta_baslangic: monday,
      makine_id: makineId,
      cumartesi_calisir: dayOfWeek === 6 ? 1 : 0,
      pazar_calisir: dayOfWeek === 0 ? 1 : 0,
      aciklama: 'IT testi: bugun makine calisir override',
    });
    yedek.eklenenHaftaSonuPlaniId = haftaSonuPlaniId;
  }

  return yedek;
}

/**
 * `ensureMakineCalisirBugun` ile yapilan degisiklikleri geri alir.
 * Test cleanup() icinde cagrilir.
 */
export async function restoreCalismaGunu(yedek: CalismaGunuYedek): Promise<void> {
  if (yedek.silinenTatiller.length) {
    for (const row of yedek.silinenTatiller) {
      await db.insert(tatiller).values(row).onDuplicateKeyUpdate({
        set: {
          ad: row.ad,
          tarih: row.tarih,
          baslangic_saati: row.baslangic_saati,
          bitis_saati: row.bitis_saati,
        },
      });
    }
    yedek.silinenTatiller = [];
  }

  if (yedek.eklenenHaftaSonuPlaniId) {
    await db
      .delete(haftaSonuPlanlari)
      .where(eq(haftaSonuPlanlari.id, yedek.eklenenHaftaSonuPlaniId));
    yedek.eklenenHaftaSonuPlaniId = null;
  }
}
