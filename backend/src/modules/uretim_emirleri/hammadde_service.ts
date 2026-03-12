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

export type HammaddeUyari = {
  urunId: string;
  urunAd: string;
  urunKod: string;
  gerekliMiktar: number;
  mevcutStok: number;
  eksikMiktar: number;
};

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
  const carpan = planlananMiktar / hedefMiktar;

  const kalemRows = await db
    .select({
      urunId: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      fireOrani: receteKalemleri.fire_orani,
    })
    .from(receteKalemleri)
    .where(eq(receteKalemleri.recete_id, receteId));

  return kalemRows.map((k) => {
    const baseMiktar = Number(k.miktar ?? 0) * carpan;
    const fireOrani = Number(k.fireOrani ?? 0);
    return {
      urunId: k.urunId,
      miktar: baseMiktar * (1 + fireOrani / 100),
    };
  });
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
    .select({ id: urunler.id, ad: urunler.ad, kod: urunler.kod, stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(inArray(urunler.id, urunIds));

  const stokMap = new Map(stokRows.map((r) => [r.id, r]));

  const uyarilar: HammaddeUyari[] = [];

  await db.transaction(async (tx) => {
    for (const kalem of ihtiyaclar) {
      // rezerve_stok artır
      await tx
        .update(urunler)
        .set({
          rezerve_stok: sql`${urunler.rezerve_stok} + ${kalem.miktar.toFixed(4)}`,
        })
        .where(eq(urunler.id, kalem.urunId));

      // Rezervasyon kaydı ekle
      await tx.insert(hammaddeRezervasyonlari).values({
        id: randomUUID(),
        uretim_emri_id: uretimEmriId,
        urun_id: kalem.urunId,
        miktar: kalem.miktar.toFixed(4),
        durum: 'rezerve',
      });

      // Stok yeterlilik kontrolü
      const info = stokMap.get(kalem.urunId);
      if (info) {
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
        .where(eq(urunler.id, rez.urun_id));

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
        .where(eq(urunler.id, rez.urun_id));

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
    .select({ id: urunler.id, ad: urunler.ad, kod: urunler.kod, stok: urunler.stok, rezerveStok: urunler.rezerve_stok })
    .from(urunler)
    .where(inArray(urunler.id, urunIds));

  const stokMap = new Map(stokRows.map((r) => [r.id, r]));

  const uyarilar: HammaddeUyari[] = [];
  for (const rez of rezervasyonlar) {
    const info = stokMap.get(rez.urunId);
    if (!info) continue;
    const miktar = Number(rez.miktar);
    const mevcutStok = Number(info.stok ?? 0);
    if (mevcutStok < miktar) {
      uyarilar.push({
        urunId: rez.urunId,
        urunAd: info.ad ?? '',
        urunKod: info.kod ?? '',
        gerekliMiktar: miktar,
        mevcutStok,
        eksikMiktar: miktar - mevcutStok,
      });
    }
  }

  return uyarilar;
}
