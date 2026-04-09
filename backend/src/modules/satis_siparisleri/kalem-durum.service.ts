import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siparisKalemleri, type KalemUretimDurumu } from './schema';
import type { MySql2Database } from 'drizzle-orm/mysql2';

/**
 * Siparis kalemi uretim durumu gecis kurallari.
 * Her durum icin izin verilen hedef durumlar tanimli.
 */
const VALID_TRANSITIONS: Record<KalemUretimDurumu, KalemUretimDurumu[]> = {
  beklemede: ['uretime_aktarildi'],
  uretime_aktarildi: ['makineye_atandi', 'beklemede'],
  makineye_atandi: ['uretiliyor', 'uretime_aktarildi'],
  uretiliyor: ['duraklatildi', 'uretim_tamamlandi'],
  duraklatildi: ['uretiliyor', 'uretim_tamamlandi'],
  uretim_tamamlandi: [],
};

type TxOrDb = MySql2Database<any> | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Siparis kaleminin uretim durumunu gecerli bir sonraki duruma gecirir.
 * Gecersiz gecislerde hata firlatir.
 */
export async function transitionKalemDurum(
  kalemId: string,
  yeniDurum: KalemUretimDurumu,
  tx?: TxOrDb,
): Promise<void> {
  const conn = tx ?? db;

  const [kalem] = await conn
    .select({ uretim_durumu: siparisKalemleri.uretim_durumu })
    .from(siparisKalemleri)
    .where(eq(siparisKalemleri.id, kalemId))
    .limit(1);

  if (!kalem) throw new Error('kalem_bulunamadi');

  const mevcutDurum = kalem.uretim_durumu as KalemUretimDurumu;
  const gecerliGecisler = VALID_TRANSITIONS[mevcutDurum];

  if (!gecerliGecisler?.includes(yeniDurum)) {
    throw new Error(`gecersiz_gecis:${mevcutDurum}_to_${yeniDurum}`);
  }

  await conn
    .update(siparisKalemleri)
    .set({ uretim_durumu: yeniDurum })
    .where(eq(siparisKalemleri.id, kalemId));
}

/**
 * Birden fazla siparis kaleminin durumunu toplu olarak gecirir.
 * Tum gecislerin gecerli olmasi gerekir.
 */
export async function transitionMultipleKalemDurum(
  kalemIds: string[],
  yeniDurum: KalemUretimDurumu,
  tx?: TxOrDb,
): Promise<void> {
  for (const kalemId of kalemIds) {
    await transitionKalemDurum(kalemId, yeniDurum, tx);
  }
}

/**
 * Siparis silinebilir mi? Tum kalemler beklemede olmali.
 */
export function canDeleteSiparis(kalemDurumlari: KalemUretimDurumu[]): boolean {
  return kalemDurumlari.every((d) => d === 'beklemede');
}

/**
 * Siparis duzenlenebilir mi? Tum kalemler beklemede olmali.
 */
export function canEditSiparis(kalemDurumlari: KalemUretimDurumu[]): boolean {
  return kalemDurumlari.every((d) => d === 'beklemede');
}

/**
 * Siparis kapatilabilir mi? Tum kalemler beklemede veya uretim tamamlandi olmali.
 */
export function canCloseSiparis(kalemDurumlari: KalemUretimDurumu[]): boolean {
  return kalemDurumlari.every((d) => d === 'beklemede' || d === 'uretim_tamamlandi');
}
