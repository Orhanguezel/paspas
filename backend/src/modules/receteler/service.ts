import { inArray, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { urunler } from '@/modules/urunler/schema';

type KategoriValidationItem = { urunId: string };

export type KategoriValidationResult =
  | { ok: true }
  | { ok: false; code: KategoriValidationErrorCode; detay?: string };

export type KategoriValidationErrorCode =
  | 'hammadde_urununun_recetesi_olmaz'
  | 'urun_recetesinde_gecersiz_kalem'
  | 'yarimamul_recetesinde_sadece_hammadde_olur'
  | 'kalem_urunu_bulunamadi';

export async function assertReceteKategoriTutarliligi(
  hedefUrunId: string | undefined | null,
  items: KategoriValidationItem[],
): Promise<KategoriValidationResult> {
  if (items.length === 0) return { ok: true };

  const hedefKategori = hedefUrunId ? await getUrunKategori(hedefUrunId) : null;

  if (hedefKategori === 'hammadde') {
    return { ok: false, code: 'hammadde_urununun_recetesi_olmaz' };
  }

  const kalemIds = Array.from(new Set(items.map((i) => i.urunId)));
  const kalemRows = await db
    .select({ id: urunler.id, kategori: urunler.kategori })
    .from(urunler)
    .where(inArray(urunler.id, kalemIds));

  if (kalemRows.length !== kalemIds.length) {
    return { ok: false, code: 'kalem_urunu_bulunamadi' };
  }

  if (hedefKategori === 'urun') {
    const gecersiz = kalemRows.find((r) => r.kategori !== 'yarimamul' && r.kategori !== 'hammadde');
    if (gecersiz) {
      return { ok: false, code: 'urun_recetesinde_gecersiz_kalem', detay: gecersiz.id };
    }
  }

  if (hedefKategori === 'yarimamul') {
    const gecersiz = kalemRows.find((r) => r.kategori !== 'hammadde');
    if (gecersiz) {
      return { ok: false, code: 'yarimamul_recetesinde_sadece_hammadde_olur', detay: gecersiz.id };
    }
  }

  return { ok: true };
}

async function getUrunKategori(urunId: string): Promise<string | null> {
  const rows = await db
    .select({ kategori: urunler.kategori })
    .from(urunler)
    .where(eq(urunler.id, urunId))
    .limit(1);
  return rows[0]?.kategori ?? null;
}
