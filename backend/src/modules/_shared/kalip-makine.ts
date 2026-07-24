import { and, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';

import { db } from '@/db/client';
import { kalipUyumluMakineler } from '@/modules/tanimlar/schema';

type TxOrDb = MySql2Database<Record<string, never>> | typeof db;

/**
 * Kalıbın uyumluluk kaydı varsa hedef makinenin bu kayıtlardan biri olması gerekir.
 * Uyumluluk kaydı veya kalıp yoksa atama serbesttir.
 */
export async function assertKalipMakineUyumlu(
  conn: TxOrDb,
  kalipId: string | null,
  makineId: string,
): Promise<void> {
  if (!kalipId) return;

  const [uyumluMakine] = await conn
    .select({ makineId: kalipUyumluMakineler.makine_id })
    .from(kalipUyumluMakineler)
    .where(and(eq(kalipUyumluMakineler.kalip_id, kalipId), eq(kalipUyumluMakineler.makine_id, makineId)))
    .limit(1);

  const [kalipUyumlulukKaydi] = await conn
    .select({ kalipId: kalipUyumluMakineler.kalip_id })
    .from(kalipUyumluMakineler)
    .where(eq(kalipUyumluMakineler.kalip_id, kalipId))
    .limit(1);

  if (kalipUyumlulukKaydi && !uyumluMakine) {
    throw new Error('kalip_makine_uyumsuz');
  }
}
