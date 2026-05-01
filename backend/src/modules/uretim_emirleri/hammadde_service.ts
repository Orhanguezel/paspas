import { randomUUID } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { hareketler } from '@/modules/hareketler/schema';
import { receteler, receteKalemleri } from '@/modules/receteler/schema';
import { urunler, hammaddeRezervasyonlari } from '@/modules/urunler/schema';

type RezervasyonKalem = {
  urunId: string;
  miktar: number;
};

export type ReceteIhtiyacKalemi = {
  urunId: string;
  miktar: number | string | null;
  fireOrani: number | string | null;
};

export type StokAkisState = {
  stok: number;
  rezerveStok: number;
  stokTakipAktif: boolean;
};

export type HammaddeUyari = {
  urunId: string;
  urunAd: string;
  urunKod: string;
  gerekliMiktar: number;
  mevcutStok: number;
  eksikMiktar: number;
};

export function calculateReceteIhtiyaclari(
  kalemler: ReceteIhtiyacKalemi[],
  hedefMiktar: number,
  planlananMiktar: number,
): RezervasyonKalem[] {
  const carpan = planlananMiktar / (hedefMiktar || 1);
  return kalemler.map((kalem) => {
    const baseMiktar = Number(kalem.miktar ?? 0) * carpan;
    const fireOrani = Number(kalem.fireOrani ?? 0);
    const rawMiktar = baseMiktar * (1 + fireOrani / 100);
    return {
      urunId: kalem.urunId,
      miktar: Math.ceil(rawMiktar),
    };
  });
}

export function previewRezervasyonSonrasi(state: StokAkisState, miktar: number): StokAkisState {
  if (!state.stokTakipAktif) return { ...state };
  return {
    ...state,
    rezerveStok: state.rezerveStok + miktar,
  };
}

export function previewStokDusSonrasi(state: StokAkisState, miktar: number): StokAkisState {
  if (!state.stokTakipAktif) return { ...state };
  return {
    ...state,
    stok: state.stok - miktar,
    rezerveStok: Math.max(state.rezerveStok - miktar, 0),
  };
}

export function previewStokGeriAlSonrasi(state: StokAkisState, miktar: number): StokAkisState {
  if (!state.stokTakipAktif) return { ...state };
  return {
    ...state,
    stok: state.stok + miktar,
    rezerveStok: state.rezerveStok + miktar,
  };
}

/**
 * Reçeteden hammadde ihtiyaçlarını hesaplar.
 * gerekenMiktar = (planlananMiktar / hedefMiktar) × kalemMiktar × (1 + fireOrani/100)
 */
async function getReceteIhtiyaclari(
  receteId: string,
  planlananMiktar: number,
): Promise<RezervasyonKalem[]> {
  const [recete] = await db
    .select({ hedefMiktar: receteler.hedef_miktar })
    .from(receteler)
    .where(eq(receteler.id, receteId))
    .limit(1);

  if (!recete) return [];

  const hedefMiktar = Number(recete.hedefMiktar ?? 1);

  const kalemRows = await db
    .select({
      urunId: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      fireOrani: receteKalemleri.fire_orani,
    })
    .from(receteKalemleri)
    .where(eq(receteKalemleri.recete_id, receteId));

  return calculateReceteIhtiyaclari(kalemRows, hedefMiktar, planlananMiktar);
}

/**
 * Üretim emri oluşturulduğunda hammaddeleri rezerve eder.
 * - urunler.rezerve_stok artırılır
 * - hammadde_rezervasyonlari tablosuna kayıt eklenir
 * - Stok yetersizse uyarı listesi döner (rezervasyon yine yapılır)
 */
export async function rezerveHammaddeler(
  uretimEmriId: string,
  receteId: string | undefined,
  planlananMiktar: number,
): Promise<HammaddeUyari[]> {
  if (!receteId) return [];

  const ihtiyaclar = await getReceteIhtiyaclari(receteId, planlananMiktar);
  if (ihtiyaclar.length === 0) return [];

  // Stok bilgilerini çek — uyarı üretmek için
  const urunIds = ihtiyaclar.map((k) => k.urunId);
  const stokRows = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      kod: urunler.kod,
      stok: urunler.stok,
      rezerveStok: urunler.rezerve_stok,
      stokTakipAktif: urunler.stok_takip_aktif,
    })
    .from(urunler)
    .where(inArray(urunler.id, urunIds));

  const stokMap = new Map(stokRows.map((r) => [r.id, r]));

  const uyarilar: HammaddeUyari[] = [];

  await db.transaction(async (tx) => {
    for (const kalem of ihtiyaclar) {
      const info = stokMap.get(kalem.urunId);
      const stokTakipAktif = info?.stokTakipAktif !== 0;

      if (stokTakipAktif) {
        // rezerve_stok artır
        await tx
          .update(urunler)
          .set({
            rezerve_stok: sql`${urunler.rezerve_stok} + ${kalem.miktar.toFixed(4)}`,
          })
          .where(eq(urunler.id, kalem.urunId));
      }

      // Rezervasyon kaydı ekle
      await tx.insert(hammaddeRezervasyonlari).values({
        id: randomUUID(),
        uretim_emri_id: uretimEmriId,
        urun_id: kalem.urunId,
        miktar: kalem.miktar.toFixed(4),
        durum: 'rezerve',
      });

      // Stok yeterlilik kontrolü
      if (info && stokTakipAktif) {
        const mevcutStok = Number(info.stok ?? 0) - Number(info.rezerveStok ?? 0);
        if (mevcutStok < kalem.miktar) {
          uyarilar.push({
            urunId: kalem.urunId,
            urunAd: info.ad ?? '',
            urunKod: info.kod ?? '',
            gerekliMiktar: kalem.miktar,
            mevcutStok,
            eksikMiktar: kalem.miktar - mevcutStok,
          });
        }
      }
    }
  });

  return uyarilar;
}

/**
 * Üretim emri iptal/silindiğinde rezervasyonları geri alır.
 * - urunler.rezerve_stok azaltılır
 * - hammadde_rezervasyonlari durumu 'iptal' yapılır
 */
export async function iptalRezervasyon(uretimEmriId: string): Promise<void> {
  const rezervasyonlar = await db
    .select()
    .from(hammaddeRezervasyonlari)
    .where(
      and(
        eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
        eq(hammaddeRezervasyonlari.durum, 'rezerve'),
      ),
    );

  if (rezervasyonlar.length === 0) return;

  await db.transaction(async (tx) => {
    for (const rez of rezervasyonlar) {
      const [urun] = await tx
        .select({ stokTakipAktif: urunler.stok_takip_aktif })
        .from(urunler)
        .where(eq(urunler.id, rez.urun_id))
        .limit(1);
      if (urun?.stokTakipAktif === 0) continue;

      // rezerve_stok azalt (negatife düşmesini engelle)
      await tx
        .update(urunler)
        .set({
          rezerve_stok: sql`GREATEST(${urunler.rezerve_stok} - ${Number(rez.miktar).toFixed(4)}, 0)`,
        })
        .where(eq(urunler.id, rez.urun_id));
    }

    // Tüm aktif rezervasyonları iptal et
    await tx
      .update(hammaddeRezervasyonlari)
      .set({ durum: 'iptal' })
      .where(
        and(
          eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
          eq(hammaddeRezervasyonlari.durum, 'rezerve'),
        ),
      );
  });
}

/**
 * Makineye atandığında gerçek stoktan düşer ve rezervasyonu tamamlar.
 * - urunler.stok azaltılır
 * - urunler.rezerve_stok azaltılır
 * - hammadde_rezervasyonlari durumu 'tamamlandi' yapılır
 * - hareketler tablosuna kayıt eklenir
 */
export async function stokDus(uretimEmriId: string): Promise<void> {
  const rezervasyonlar = await db
    .select()
    .from(hammaddeRezervasyonlari)
    .where(
      and(
        eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
        eq(hammaddeRezervasyonlari.durum, 'rezerve'),
      ),
    );

  if (rezervasyonlar.length === 0) return;

  await db.transaction(async (tx) => {
    for (const rez of rezervasyonlar) {
      const miktar = Number(rez.miktar);

      // Gerçek stoktan düş (negatif stok kabul edilir — tedarik süreci devam edebilir)
      await tx
        .update(urunler)
        .set({
          stok: sql`${urunler.stok} - ${miktar.toFixed(4)}`,
          rezerve_stok: sql`GREATEST(${urunler.rezerve_stok} - ${miktar.toFixed(4)}, 0)`,
        })
        .where(and(eq(urunler.id, rez.urun_id), eq(urunler.stok_takip_aktif, 1)));

      // Hareket kaydı oluştur
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: rez.urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'uretim_emri',
        referans_id: uretimEmriId,
        miktar: (-miktar).toFixed(4),
        aciklama: `Üretim emri hammadde tüketimi`,
      });
    }

    // Rezervasyonları tamamlandı olarak işaretle
    await tx
      .update(hammaddeRezervasyonlari)
      .set({ durum: 'tamamlandi' })
      .where(
        and(
          eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
          eq(hammaddeRezervasyonlari.durum, 'rezerve'),
        ),
      );
  });
}

/**
 * Kuyruktan çıkarılınca tüketilen stoku geri alır ve rezervasyona döner.
 * stokDus'un tersi: stok geri eklenir, rezerve_stok yeniden artırılır,
 * hareketler'e düzeltme kaydı yazılır, durum 'tamamlandi' → 'rezerve' olur.
 */
export async function stokGeriAl(uretimEmriId: string): Promise<void> {
  const tamamlananlar = await db
    .select()
    .from(hammaddeRezervasyonlari)
    .where(
      and(
        eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
        eq(hammaddeRezervasyonlari.durum, 'tamamlandi'),
      ),
    );

  if (tamamlananlar.length === 0) return;

  await db.transaction(async (tx) => {
    for (const rez of tamamlananlar) {
      const miktar = Number(rez.miktar);

      // Stoku geri ekle, rezerve_stok'u yeniden artır
      await tx
        .update(urunler)
        .set({
          stok: sql`${urunler.stok} + ${miktar.toFixed(4)}`,
          rezerve_stok: sql`${urunler.rezerve_stok} + ${miktar.toFixed(4)}`,
        })
        .where(and(eq(urunler.id, rez.urun_id), eq(urunler.stok_takip_aktif, 1)));

      // Düzeltme hareket kaydı
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: rez.urun_id,
        hareket_tipi: 'giris',
        referans_tipi: 'uretim_emri',
        referans_id: uretimEmriId,
        miktar: miktar.toFixed(4),
        aciklama: 'Kuyruktan çıkarma — hammadde stok iadesi',
      });
    }

    // Rezervasyonları tekrar 'rezerve' durumuna al
    await tx
      .update(hammaddeRezervasyonlari)
      .set({ durum: 'rezerve' })
      .where(
        and(
          eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
          eq(hammaddeRezervasyonlari.durum, 'tamamlandi'),
        ),
      );
  });
}

/**
 * Makineye atama öncesi hammadde yeterlilik kontrolü.
 * Stok yetersizse uyarı listesi döner.
 */
export async function checkHammaddeYeterlilik(uretimEmriId: string): Promise<HammaddeUyari[]> {
  const rezervasyonlar = await db
    .select({
      urunId: hammaddeRezervasyonlari.urun_id,
      miktar: hammaddeRezervasyonlari.miktar,
    })
    .from(hammaddeRezervasyonlari)
    .where(
      and(
        eq(hammaddeRezervasyonlari.uretim_emri_id, uretimEmriId),
        eq(hammaddeRezervasyonlari.durum, 'rezerve'),
      ),
    );

  if (rezervasyonlar.length === 0) return [];

  const urunIds = rezervasyonlar.map((r) => r.urunId);
  const stokRows = await db
    .select({
      id: urunler.id,
      ad: urunler.ad,
      kod: urunler.kod,
      stok: urunler.stok,
      rezerveStok: urunler.rezerve_stok,
      stokTakipAktif: urunler.stok_takip_aktif,
    })
    .from(urunler)
    .where(inArray(urunler.id, urunIds));

  const stokMap = new Map(stokRows.map((r) => [r.id, r]));

  // Aynı ürün için birden fazla rezervasyon satırı olabilir (cift tarafli operasyon gibi)
  // Ürün bazında topla
  const urunBazliMiktar = new Map<string, number>();
  for (const rez of rezervasyonlar) {
    const miktar = Number(rez.miktar);
    urunBazliMiktar.set(rez.urunId, (urunBazliMiktar.get(rez.urunId) ?? 0) + miktar);
  }

  const uyarilar: HammaddeUyari[] = [];
  for (const [urunId, miktar] of urunBazliMiktar) {
    const info = stokMap.get(urunId);
    if (!info) continue;
    if (info.stokTakipAktif === 0) continue;
    // mevcutStok = fiziksel stok (müşteri beklentisi: basit karşılaştırma)
    const mevcutStok = Math.max(Number(info.stok ?? 0), 0);
    const eksikMiktar = Math.max(miktar - mevcutStok, 0);
    if (eksikMiktar > 0) {
      uyarilar.push({
        urunId,
        urunAd: info.ad ?? '',
        urunKod: info.kod ?? '',
        gerekliMiktar: miktar,
        mevcutStok,
        eksikMiktar,
      });
    }
  }

  return uyarilar;
}
