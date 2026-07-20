import { randomUUID } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { recalcMakineKuyrukTarihleri } from '@/modules/_shared/planlama';
import { hareketler } from '@/modules/hareketler/schema';
import { makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { receteKalemleri, receteler } from '@/modules/receteler/schema';
import { siparisKalemleri, type KalemUretimDurumu } from '@/modules/satis_siparisleri/schema';
import { canTransitionKalem, transitionMultipleKalemDurum } from '@/modules/satis_siparisleri/kalem-durum.service';
import { urunler } from '@/modules/urunler/schema';

import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from './schema';
import { iptalRezervasyon, rezerveHammaddeler } from './hammadde_service';
import { repoCreate, repoGetNextEmirNo, type CreateResult } from './repository';

type Opts = {
  baslangicTarihi?: string;
  bitisTarihi?: string;
  terminTarihi?: string;
  miktarOverride?: number;
  partiNo?: string;
};

const OPERASYON_KAYNAGI_KATEGORILERI = ['operasyonel_ym', 'yarimamul'] as const;

export function pickOperasyonKaynakKalemler<T extends { kategori: string }>(kalemler: T[]): T[] {
  const operasyonelYmKalemleri = kalemler.filter((kalem) => kalem.kategori === 'operasyonel_ym');
  if (operasyonelYmKalemleri.length > 0) {
    return operasyonelYmKalemleri;
  }
  return kalemler.filter((kalem) => kalem.kategori === 'yarimamul');
}

export function calculateOperasyonKaynakPlanlananMiktar(receteKalemMiktar: number | string, siparisMiktar: number | string) {
  return Number(receteKalemMiktar) * Number(siparisMiktar);
}

export class SiparisUretimEmirHatasi extends Error {
  constructor(public readonly code: string, public readonly detay?: string) {
    super(code);
    this.name = 'SiparisUretimEmirHatasi';
  }
}

export async function updateMamulEmri(
  partiNo: string,
  mamulUrunId: string,
  patch: {
    planlananMiktar: number;
    siparisTahsisleri?: Array<{ siparisKalemId: string; miktar: number }>;
  },
): Promise<{ emirIds: string[]; planlananMiktar: number }> {
  return db.transaction(async (tx) => {
    const emirler = await tx
      .select({
        id: uretimEmirleri.id,
        urunId: uretimEmirleri.urun_id,
        receteId: uretimEmirleri.recete_id,
        durum: uretimEmirleri.durum,
        taraf: uretimEmirleri.taraf,
      })
      .from(uretimEmirleri)
      .where(and(
        eq(uretimEmirleri.parti_no, partiNo),
        eq(uretimEmirleri.mamul_urun_id, mamulUrunId),
      ));

    if (emirler.length === 0) throw new Error('mamul_emri_bulunamadi');
    if (emirler.some((emir) => emir.durum === 'tamamlandi')) {
      throw new Error('uretim_emri_tamamlandi');
    }

    const emirIds = emirler.map((emir) => emir.id);

    if (patch.siparisTahsisleri !== undefined) {
      const kalemIds = patch.siparisTahsisleri.map((tahsis) => tahsis.siparisKalemId);
      const kalemler = kalemIds.length > 0
        ? await tx.select({
          id: siparisKalemleri.id,
          urunId: siparisKalemleri.urun_id,
          miktar: siparisKalemleri.miktar,
          uretimDurumu: siparisKalemleri.uretim_durumu,
        }).from(siparisKalemleri).where(inArray(siparisKalemleri.id, kalemIds))
        : [];
      if (kalemler.length !== new Set(kalemIds).size || kalemler.some((kalem) => kalem.urunId !== mamulUrunId)) {
        throw new Error('urun_uyumsuzlugu');
      }
      for (const tahsis of patch.siparisTahsisleri) {
        const kalem = kalemler.find((row) => row.id === tahsis.siparisKalemId)!;
        const [diger] = await tx
          .select({ toplam: sql<string>`COALESCE(SUM(${uretimEmriSiparisKalemleri.miktar}), 0)` })
          .from(uretimEmriSiparisKalemleri)
          .innerJoin(uretimEmirleri, eq(uretimEmirleri.id, uretimEmriSiparisKalemleri.uretim_emri_id))
          .where(and(
            eq(uretimEmriSiparisKalemleri.siparis_kalem_id, tahsis.siparisKalemId),
            sql`${uretimEmriSiparisKalemleri.uretim_emri_id} NOT IN (${sql.join(emirIds.map((id) => sql`${id}`), sql`, `)})`,
            sql`${uretimEmirleri.durum} <> 'iptal'`,
          ));
        if (Number(diger?.toplam ?? 0) + tahsis.miktar > Number(kalem.miktar) + 1e-9) {
          throw new Error('asiri_aktarim');
        }
      }

      await tx.delete(uretimEmriSiparisKalemleri).where(inArray(uretimEmriSiparisKalemleri.uretim_emri_id, emirIds));
      if (patch.siparisTahsisleri.length > 0) {
        const tasiyiciId = [...emirler].sort((a, b) => {
          const sira = { sag: 0, sol: 1, parca: 2 } as Record<string, number>;
          return (sira[a.taraf ?? ''] ?? 3) - (sira[b.taraf ?? ''] ?? 3) || a.id.localeCompare(b.id);
        })[0]!.id;
        await tx.insert(uretimEmriSiparisKalemleri).values(
          emirler.flatMap((emir) => patch.siparisTahsisleri!.map((tahsis) => ({
            id: randomUUID(),
            uretim_emri_id: emir.id,
            siparis_kalem_id: tahsis.siparisKalemId,
            miktar: (emir.id === tasiyiciId ? tahsis.miktar : 0).toFixed(4),
          }))),
        );
        const gecisKalemleri = kalemler
          .filter((kalem) => kalem.uretimDurumu === 'beklemede')
          .map((kalem) => kalem.id);
        await transitionMultipleKalemDurum(gecisKalemleri, 'uretime_aktarildi', tx);
      }
    }

    const miktar = patch.planlananMiktar.toFixed(4);
    await tx
      .update(uretimEmirleri)
      .set({ planlanan_miktar: miktar })
      .where(inArray(uretimEmirleri.id, emirIds));
    await tx
      .update(uretimEmriOperasyonlari)
      .set({ planlanan_miktar: miktar })
      .where(inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds));

    for (const emir of emirler) {
      await iptalRezervasyon(emir.id, tx);
      let receteId = emir.receteId ?? undefined;
      if (!receteId) {
        const [aktifRecete] = await tx
          .select({ id: receteler.id })
          .from(receteler)
          .where(and(eq(receteler.urun_id, emir.urunId), eq(receteler.is_active, 1)))
          .limit(1);
        receteId = aktifRecete?.id;
      }
      await rezerveHammaddeler(emir.id, receteId, patch.planlananMiktar, tx);
    }

    const kuyrukRows = await tx
      .select({
        kuyrukId: makineKuyrugu.id,
        makineId: makineKuyrugu.makine_id,
        cevrimSuresiSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
      })
      .from(makineKuyrugu)
      .leftJoin(uretimEmriOperasyonlari, eq(uretimEmriOperasyonlari.id, makineKuyrugu.emir_operasyon_id))
      .where(inArray(makineKuyrugu.uretim_emri_id, emirIds));

    const affectedMachines = new Set<string>();
    for (const row of kuyrukRows) {
      const planlananSureDk = Math.ceil((Number(row.cevrimSuresiSn ?? 0) * patch.planlananMiktar) / 60);
      await tx
        .update(makineKuyrugu)
        .set({ planlanan_sure_dk: planlananSureDk })
        .where(eq(makineKuyrugu.id, row.kuyrukId));
      affectedMachines.add(row.makineId);
    }
    for (const makineId of affectedMachines) {
      await recalcMakineKuyrukTarihleri(makineId, tx);
    }

    return { emirIds, planlananMiktar: patch.planlananMiktar };
  });
}

/**
 * Bir satış siparişi kaleminden, asıl ürünün reçetesindeki operasyonel YM'ler için
 * ayrı ayrı üretim emri oluşturur.
 *
 * Örnek: 10 adet çift op. ürün → 10 Sağ + 10 Sol (2 emir)
 *        10 adet tek op. ürün  → 20 Parça (1 emir)
 */
export async function createUretimEmirleriFromSiparisKalemi(
  siparisKalemId: string,
  opts: Opts = {},
): Promise<CreateResult[]> {
  const kalemRows = await db.select().from(siparisKalemleri).where(eq(siparisKalemleri.id, siparisKalemId)).limit(1);
  const kalem = kalemRows[0];
  if (!kalem) throw new SiparisUretimEmirHatasi('siparis_kalemi_bulunamadi');

  // Pre-check: kalem 'uretime_aktarildi' geçişine izin veriyor mu?
  // Aksi halde repoCreate içindeki transition sonradan hata atar ve kısmi insert yetim emirler bırakır.
  const mevcutDurum = kalem.uretim_durumu as KalemUretimDurumu;
  if (!canTransitionKalem(mevcutDurum, 'uretime_aktarildi')) {
    throw new SiparisUretimEmirHatasi(`gecersiz_gecis:${mevcutDurum}_to_uretime_aktarildi`);
  }

  const urunRows = await db.select().from(urunler).where(eq(urunler.id, kalem.urun_id)).limit(1);
  const urun = urunRows[0];
  if (!urun) throw new SiparisUretimEmirHatasi('urun_bulunamadi');
  if (urun.kategori !== 'urun') {
    throw new SiparisUretimEmirHatasi('siparis_kalemi_asil_urun_olmali', urun.kategori);
  }

  const asilReceteRows = await db
    .select()
    .from(receteler)
    .where(and(eq(receteler.urun_id, urun.id), eq(receteler.is_active, 1)))
    .limit(1);
  const asilRecete = asilReceteRows[0];
  if (!asilRecete) throw new SiparisUretimEmirHatasi('asil_urun_recetesi_yok');

  const operasyonKaynakKalemleri = await db
    .select({
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      sira: receteKalemleri.sira,
      kategori: urunler.kategori,
      kod: urunler.kod,
      ad: urunler.ad,
    })
    .from(receteKalemleri)
    .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(
      and(
        eq(receteKalemleri.recete_id, asilRecete.id),
        inArray(urunler.kategori, OPERASYON_KAYNAGI_KATEGORILERI as unknown as string[]),
      ),
    )
    .orderBy(receteKalemleri.sira);

  const yariMamulKalemler = pickOperasyonKaynakKalemler(operasyonKaynakKalemleri);

  if (yariMamulKalemler.length === 0) {
    throw new SiparisUretimEmirHatasi('asil_urun_yarimamul_icermiyor');
  }

  const kalemMiktar = opts.miktarOverride && opts.miktarOverride > 0 ? opts.miktarOverride : Number(kalem.miktar);
  const results: CreateResult[] = [];

  for (const [index, k] of yariMamulKalemler.entries()) {
    const planlananMiktar = yariMamulKalemler.length > 1
      ? kalemMiktar
      : calculateOperasyonKaynakPlanlananMiktar(k.miktar, kalemMiktar);
    const emirNo = await repoGetNextEmirNo();
    const created = await repoCreate(
      {
        emirNo,
        partiNo: opts.partiNo,
        urunId: k.urun_id,
        mamulUrunId: urun.id,
        taraf: yariMamulKalemler.length === 1 ? 'parca' : index === 0 ? 'sag' : 'sol',
        planlananMiktar,
        uretilenMiktar: 0,
        siparisKalemIds: [kalem.id],
        siparisTahsisleri: [{ siparisKalemId: kalem.id, miktar: index === 0 ? kalemMiktar : 0 }],
        durum: 'atanmamis',
        baslangicTarihi: opts.baslangicTarihi,
        bitisTarihi: opts.bitisTarihi,
        terminTarihi: opts.terminTarihi,
      },
    );
    // V7 Not 1d: Otomatik makine ataması kaldırıldı. Yeni emirler temiz "Atanmamış"
    // doğar; atama "Makine ve Montaj Planlama" bloğundan repoAtaOperasyon ile yapılır.
    results.push(created);
  }

  return results;
}

export type MontajSonuc =
  | { basarili: true; urunId: string; uretilenMiktar: number; eksikYariMamuller?: undefined }
  | { basarili: false; urunId: string; uretilenMiktar: number; eksikYariMamuller: Array<{ urunId: string; ad: string; gerekli: number; mevcut: number }> };

/**
 * Bir operasyonel YM üretim emri tamamlandığında, emirin bağlı olduğu sipariş
 * kaleminin asıl ürünü için montaj denemesi yapar.
 *
 * Kullanım: operatörün üretim bitirme akışında, tamamlanan operasyon
 * `montaj=true` işaretli ise çağrılır.
 *
 * Başarılı: operasyonel YM stokları düş, asıl ürün stoğu art, ambalaj hammaddeleri düş,
 *          emir durumunu `tamamlandi` yap.
 * Yetersiz: emir durumunu `montaj_bekliyor` yap, karşı operasyonel YM beklenir.
 */
export async function tryMontajForUretimEmri(
  uretimEmriId: string,
  operatorUserId?: string | null,
): Promise<MontajSonuc | null> {
  const emirRow = (await db.select().from(uretimEmirleri).where(eq(uretimEmirleri.id, uretimEmriId)).limit(1))[0];
  if (!emirRow) return null;

  const yariMamulRow = (await db.select().from(urunler).where(eq(urunler.id, emirRow.urun_id)).limit(1))[0];
  if (
    !yariMamulRow ||
    !OPERASYON_KAYNAGI_KATEGORILERI.includes(
      yariMamulRow.kategori as (typeof OPERASYON_KAYNAGI_KATEGORILERI)[number],
    )
  ) {
    return null;
  }

  const linkedKalem = await db
    .select({ kalemId: uretimEmriSiparisKalemleri.siparis_kalem_id, urun_id: siparisKalemleri.urun_id, miktar: siparisKalemleri.miktar })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId))
    .limit(1);
  if (!linkedKalem[0]) return null;

  const asilUrunId = linkedKalem[0].urun_id;
  const kalemMiktar = Number(linkedKalem[0].miktar);

  const asilRecete = (
    await db.select().from(receteler).where(and(eq(receteler.urun_id, asilUrunId), eq(receteler.is_active, 1))).limit(1)
  )[0];
  if (!asilRecete) return null;

  const kalemler = await db
    .select({
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      kategori: urunler.kategori,
      ad: urunler.ad,
      stok: urunler.stok,
      stokTakipAktif: urunler.stok_takip_aktif,
    })
    .from(receteKalemleri)
    .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(eq(receteKalemleri.recete_id, asilRecete.id));

  const operasyonKaynaklari = pickOperasyonKaynakKalemler(kalemler);
  const operasyonKaynakIds = new Set(operasyonKaynaklari.map((k) => k.urun_id));
  const ambalajYariMamuller = kalemler.filter((k) => k.kategori === 'yarimamul' && !operasyonKaynakIds.has(k.urun_id));
  const yariMamuller = [...operasyonKaynaklari, ...ambalajYariMamuller];
  const hammaddeler = kalemler.filter((k) => k.kategori === 'hammadde');
  if (operasyonKaynaklari.length === 0) return null;

  // Achievable montaj: sipariş miktarına kilitli "hep-ya-hiç" yerine, eldeki
  // bileşenlerle yapılabilecek TAM TAKIM sayısını montajla. Kalem miktarını aşma.
  // GATE (montaj miktarını kısıtlayan) kümesi: yalnız operasyonel-YM taraflar + hammadde.
  // Ambalaj yarımamulleri (kartela/etiket/koli vb.) TÜKETİLİR ama montaj miktarını
  // KISITLAMAZ — bu kalemler sistemde çoğunlukla negatif/takipsiz stokta olduğundan
  // gate'e alınırsa montaj tümüyle bloke olur (YN-V13 review; V8 ambalaj eklemesi).
  let montajMiktar = kalemMiktar;
  for (const ym of operasyonKaynaklari) {
    if (ym.stokTakipAktif === 0) continue;
    const perUnit = Number(ym.miktar);
    if (perUnit <= 0) continue;
    const yapilabilir = Math.floor((Number(ym.stok) + 1e-9) / perUnit);
    if (yapilabilir < montajMiktar) montajMiktar = yapilabilir;
  }
  for (const hm of hammaddeler) {
    if (hm.stokTakipAktif === 0) continue;
    const perUnit = Number(hm.miktar);
    if (perUnit <= 0) continue;
    const yapilabilir = Math.floor((Number(hm.stok) + 1e-9) / perUnit);
    if (yapilabilir < montajMiktar) montajMiktar = yapilabilir;
  }

  if (montajMiktar <= 0) {
    // Hiçbir tam takım yapılamıyor → beklemede kal. Bilgi amaçlı eksik listesi üret
    // (yalnız gate kümesi: taraflar + hammadde; ambalaj kısıtlamadığı için hariç).
    await db.update(uretimEmirleri).set({ durum: 'montaj_bekliyor' }).where(eq(uretimEmirleri.id, uretimEmriId));
    const eksikYariMamuller = [...operasyonKaynaklari, ...hammaddeler]
      .filter((k) => k.stokTakipAktif === 1 && Number(k.stok) + 1e-9 < Number(k.miktar) * kalemMiktar)
      .map((k) => ({ urunId: k.urun_id, ad: k.ad, gerekli: Number(k.miktar) * kalemMiktar, mevcut: Number(k.stok) }));
    return { basarili: false, urunId: asilUrunId, uretilenMiktar: kalemMiktar, eksikYariMamuller };
  }

  // Kısmi montaj (montajMiktar < kalemMiktar): kalan üretim gelebilir mi?
  // Tüm kardeş üretim operasyonları bittiyse daha fazla üretim yok → tamamlandi.
  // Değilse montaj_bekliyor'da kal; sonraki stok artışında eldeki kadar yeniden montajla.
  const yeniDurum: 'tamamlandi' | 'montaj_bekliyor' =
    montajMiktar + 1e-9 >= kalemMiktar || (await tumKardesOperasyonBitti(uretimEmriId))
      ? 'tamamlandi'
      : 'montaj_bekliyor';

  await db.transaction(async (tx) => {
    for (const ym of yariMamuller) {
      const dus = Number(ym.miktar) * montajMiktar;
      if (ym.stokTakipAktif === 1) {
        await tx.update(urunler).set({ stok: sql`${urunler.stok} - ${dus.toFixed(4)}` }).where(eq(urunler.id, ym.urun_id));
      }
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: ym.urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'montaj',
        referans_id: uretimEmriId,
        miktar: dus.toFixed(4),
        aciklama: operasyonKaynakIds.has(ym.urun_id) ? 'Montaj: operasyonel YM tüketimi' : 'Montaj: yarımamul tüketimi',
        created_by_user_id: operatorUserId ?? null,
      });
    }

    for (const hm of hammaddeler) {
      const dus = Number(hm.miktar) * montajMiktar;
      if (hm.stokTakipAktif === 1) {
        await tx.update(urunler).set({ stok: sql`${urunler.stok} - ${dus.toFixed(4)}` }).where(eq(urunler.id, hm.urun_id));
      }
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: hm.urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'montaj',
        referans_id: uretimEmriId,
        miktar: dus.toFixed(4),
        aciklama: 'Montaj: hammadde/ambalaj tüketimi',
        created_by_user_id: operatorUserId ?? null,
      });
    }

    await tx
      .update(urunler)
      .set({ stok: sql`${urunler.stok} + ${montajMiktar.toFixed(4)}` })
      .where(and(eq(urunler.id, asilUrunId), eq(urunler.stok_takip_aktif, 1)));
    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: asilUrunId,
      hareket_tipi: 'giris',
      referans_tipi: 'montaj',
      referans_id: uretimEmriId,
      miktar: montajMiktar.toFixed(4),
      aciklama: 'Montaj tamamlandı: asıl ürün girişi',
      created_by_user_id: operatorUserId ?? null,
    });

    await tx.update(uretimEmirleri).set({ durum: yeniDurum }).where(eq(uretimEmirleri.id, uretimEmriId));
  });

  return { basarili: true, urunId: asilUrunId, uretilenMiktar: montajMiktar };
}

/**
 * Bu üretim emrinin bağlı olduğu sipariş kalem(ler)ine bağlı TÜM üretim emirlerinin
 * operasyonları `tamamlandi` mı? (Daha fazla üretim gelmeyecek mi?)
 * Kısmi montajda emrin `tamamlandi` mı yoksa `montaj_bekliyor` mu kalacağını belirler.
 */
async function tumKardesOperasyonBitti(uretimEmriId: string): Promise<boolean> {
  const kalemRows = await db
    .select({ kalemId: uretimEmriSiparisKalemleri.siparis_kalem_id })
    .from(uretimEmriSiparisKalemleri)
    .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId));
  const kalemIds = kalemRows.map((r) => r.kalemId).filter((x): x is string => Boolean(x));
  if (kalemIds.length === 0) return true;

  const emirRows = await db
    .selectDistinct({ emirId: uretimEmriSiparisKalemleri.uretim_emri_id })
    .from(uretimEmriSiparisKalemleri)
    .where(inArray(uretimEmriSiparisKalemleri.siparis_kalem_id, kalemIds));
  const emirIds = emirRows.map((r) => r.emirId).filter((x): x is string => Boolean(x));
  if (emirIds.length === 0) return true;

  const [bekleyen] = await db
    .select({ count: sql<number>`count(*)` })
    .from(uretimEmriOperasyonlari)
    .where(and(
      inArray(uretimEmriOperasyonlari.uretim_emri_id, emirIds),
      sql`${uretimEmriOperasyonlari.durum} != 'tamamlandi'`,
    ));
  return Number(bekleyen?.count ?? 0) === 0;
}

/**
 * Bir operasyonel YM'nin stoğu arttıktan sonra, bu kaynağın karşılığında bekleyen
 * montajları tarar ve her birinde tekrar `tryMontajForUretimEmri` çalıştırır.
 *
 * Kullanım: operatör bir operasyonel YM üretim emri tamamlanınca (montaj olmayan tarafta)
 * stok artar; bu helper ile kardeş emirlerin `montaj_bekliyor` durumu çözümlenir.
 */
export async function tryPendingMontajlarAfterStokArtis(
  yariMamulId: string,
  operatorUserId?: string | null,
): Promise<MontajSonuc[]> {
  // Bu yarı mamulün kullanıldığı asıl ürünleri bul (reçetelerde)
  const asilUrunler = await db
    .selectDistinct({ urunId: receteler.urun_id })
    .from(receteKalemleri)
    .innerJoin(receteler, eq(receteler.id, receteKalemleri.recete_id))
    .where(eq(receteKalemleri.urun_id, yariMamulId));

  const asilUrunIds = asilUrunler.map((r) => r.urunId).filter((x): x is string => Boolean(x));
  if (asilUrunIds.length === 0) return [];

  // Bu asıl ürünlerin sipariş kalemlerine bağlı ve montaj_bekliyor durumunda olan
  // üretim emirlerini bul
  const bekleyenEmirler = await db
    .selectDistinct({ uretimEmriId: uretimEmirleri.id })
    .from(uretimEmirleri)
    .innerJoin(uretimEmriSiparisKalemleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(siparisKalemleri, eq(siparisKalemleri.id, uretimEmriSiparisKalemleri.siparis_kalem_id))
    .where(and(eq(uretimEmirleri.durum, 'montaj_bekliyor'), inArray(siparisKalemleri.urun_id, asilUrunIds)));

  const results: MontajSonuc[] = [];
  for (const row of bekleyenEmirler) {
    const sonuc = await tryMontajForUretimEmri(row.uretimEmriId, operatorUserId);
    if (sonuc) results.push(sonuc);
  }
  return results;
}

// ============================================================
// V20/R5 — Üretim erken bitince elde kalan operasyonel yarımamuller
// ============================================================
// Kullanıcı: üretim 1000 yerine 700'de bitirilirse elde 300 yarımamul kalır.
// Kural: her üretim bittiğinde admine kalan operasyonel_ym miktarları gösterilir,
// admin isterse sıfırlar (repoAdjustStock ile — hareket izi kalır, sessiz değişim yok).
// Yalnız operasyonel_ym; diğer yarımamullere dokunulmaz.

export type KalanYarimamul = {
  urunId: string;
  urunKod: string;
  urunAd: string;
  stok: number;
};

/** Bir üretim emrinin reçetesindeki operasyonel_ym parçalarının GÜNCEL stoğunu döner. */
export async function getKalanOperasyonelYarimamuller(emirId: string): Promise<KalanYarimamul[]> {
  const [emir] = await db
    .select({ receteId: uretimEmirleri.recete_id })
    .from(uretimEmirleri)
    .where(eq(uretimEmirleri.id, emirId))
    .limit(1);

  if (!emir?.receteId) return [];

  const parcalar = await db
    .select({
      urunId: urunler.id,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      stok: urunler.stok,
    })
    .from(receteKalemleri)
    .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(and(eq(receteKalemleri.recete_id, emir.receteId), eq(urunler.kategori, 'operasyonel_ym')));

  // Yalnız stoğu SIFIRDAN farklı olanları göster (sıfır zaten "kalan yok" demek).
  return parcalar
    .map((p) => ({
      urunId: p.urunId,
      urunKod: p.urunKod,
      urunAd: p.urunAd,
      stok: Number(p.stok ?? 0),
    }))
    .filter((p) => Math.abs(p.stok) >= 0.0001);
}

/**
 * Seçili operasyonel_ym parçalarının stoğunu sıfırlar (admin onayıyla).
 * Yalnız o emrin reçetesindeki operasyonel_ym kalemlerine izin verir — başka ürün sıfırlanamaz.
 */
export async function sifirlaOperasyonelYarimamuller(
  emirId: string,
  urunIds: string[],
  userId: string | null,
): Promise<{ sifirlanan: KalanYarimamul[] }> {
  const kalanlar = await getKalanOperasyonelYarimamuller(emirId);
  const izinliMap = new Map(kalanlar.map((k) => [k.urunId, k]));
  const hedefler = urunIds.filter((id) => izinliMap.has(id));

  if (hedefler.length === 0) return { sifirlanan: [] };

  const sifirlanan: KalanYarimamul[] = [];
  await db.transaction(async (tx) => {
    for (const urunId of hedefler) {
      const kalan = izinliMap.get(urunId)!;
      if (Math.abs(kalan.stok) < 0.0001) continue;
      // Ters işaretli düzeltme ile sıfıra çek.
      await tx
        .update(urunler)
        .set({ stok: '0.0000' })
        .where(eq(urunler.id, urunId));
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: urunId,
        hareket_tipi: 'duzeltme',
        referans_tipi: 'stok_duzeltme',
        referans_id: emirId,
        miktar: Math.abs(kalan.stok).toFixed(4),
        aciklama: `Üretim bitişi — kalan yarımamul sıfırlandı (emir tamamlandı)`,
        created_by_user_id: userId ?? null,
      });
      sifirlanan.push(kalan);
    }
  });

  return { sifirlanan };
}
