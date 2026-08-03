// =============================================================
// FILE: src/modules/teklifler/repository.ts
// Teklif Modülü — DB mantığı (transpalet hesaplama/durum motorundan uyarlanmıştır)
// =============================================================

import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';

import { db, pool } from '@/db/client';
import { repoCreate as musteriRepoCreate } from '@/modules/musteriler/repository';
import { musteriler } from '@/modules/musteriler/schema';
import { urunler } from '@/modules/urunler/schema';

import {
  type TeklifKalemRow,
  type TeklifRow,
  type TeklifTalepRow,
  teklifKalemleri,
  teklifKalemRowToDto,
  teklifler,
  teklifRowToDto,
  teklifTalepleri,
  teklifTalepRowToDto,
} from './schema';
import type {
  KalemCreateBody, KalemPatchBody, TalepDonusturBody, TalepListQuery, TalepPatchBody,
  TalepPublicBody, TeklifCreateBody, TeklifListQuery, TeklifPatchBody,
} from './validation';

// ── Durum makinesi (transpalet repository.ts:7-29) ───────────

type TeklifDurum =
  'taslak' | 'onay_bekliyor' | 'gonderildi' | 'goruntulendi' | 'revizyon' | 'kabul' | 'red' | 'suresi_doldu';

const GECISLER: Record<TeklifDurum, TeklifDurum[]> = {
  taslak: ['onay_bekliyor', 'gonderildi'],
  onay_bekliyor: ['taslak', 'gonderildi', 'red'],
  gonderildi: ['goruntulendi', 'revizyon', 'kabul', 'red', 'suresi_doldu'],
  goruntulendi: ['revizyon', 'kabul', 'red', 'suresi_doldu'],
  revizyon: ['taslak'],
  kabul: [],
  red: ['revizyon'],
  suresi_doldu: ['revizyon'],
};

export function assertGecis(mevcut: string, hedef: string): void {
  if (mevcut === hedef) return;
  const izin = GECISLER[mevcut as TeklifDurum] ?? [];
  if (!izin.includes(hedef as TeklifDurum)) {
    throw new Error('gecersiz_teklif_gecisi');
  }
}

// ── Merkezi toplam motoru (transpalet repository.ts:36-68) ────

export function hesaplaToplamlar(
  lines: Array<{ miktar: number; birimFiyat: number; iskontoOrani?: number }>,
  discount = 0, shipping = 0, tax = 20, kdvDahil = false,
): { araToplam: number; iskontoTutari: number; kdvTutari: number; genelToplam: number } {
  const araToplam = lines.reduce(
    (sum, l) => sum + l.miktar * l.birimFiyat * (1 - (l.iskontoOrani ?? 0) / 100),
    0,
  );
  const iskontoTutari = araToplam * (discount / 100);
  const brut = araToplam - iskontoTutari + shipping;
  let kdvTutari: number;
  let genelToplam: number;
  if (kdvDahil) {
    const matrah = brut / (1 + tax / 100);
    kdvTutari = brut - matrah;
    genelToplam = brut;
  } else {
    kdvTutari = brut * (tax / 100);
    genelToplam = brut + kdvTutari;
  }
  return {
    araToplam: Number(araToplam.toFixed(2)),
    iskontoTutari: Number(iskontoTutari.toFixed(2)),
    kdvTutari: Number(kdvTutari.toFixed(2)),
    genelToplam: Number(genelToplam.toFixed(2)),
  };
}

function satirToplamHesapla(miktar: number, birimFiyat: number, iskontoOrani: number): number {
  return Number((miktar * birimFiyat * (1 - iskontoOrani / 100)).toFixed(2));
}

// ── Yıllık numara (TK-YYYY-NNNN) — yarış-güvenli sayaç ───────

async function generateTeklifNo(): Promise<string> {
  const year = new Date().getFullYear();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO teklif_no_sayaclari (yil, son_no) VALUES (?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE son_no = LAST_INSERT_ID(son_no + 1)',
      [year],
    );
    const [rows] = await conn.query('SELECT LAST_INSERT_ID() AS no');
    await conn.commit();
    const no = Number((rows as Array<{ no: number }>)[0]?.no ?? 1);
    return `TK-${year}-${String(no).padStart(4, '0')}`;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Yardımcılar ──────────────────────────────────────────────

async function getTeklifRow(id: string): Promise<TeklifRow | null> {
  const rows = await db.select().from(teklifler).where(eq(teklifler.id, id)).limit(1);
  return rows[0] ?? null;
}

async function getKalemRows(teklifId: string): Promise<TeklifKalemRow[]> {
  return db.select().from(teklifKalemleri)
    .where(eq(teklifKalemleri.teklif_id, teklifId))
    .orderBy(asc(teklifKalemleri.sira), asc(teklifKalemleri.created_at));
}

async function getMusteriAd(musteriId: string): Promise<string | null> {
  const rows = await db.select({ ad: musteriler.ad }).from(musteriler).where(eq(musteriler.id, musteriId)).limit(1);
  return rows[0]?.ad ?? null;
}

/** Kalemlerden ve başlıktan toplamları yeniden hesaplayıp teklifi günceller. */
async function recalcTeklif(id: string): Promise<void> {
  const row = await getTeklifRow(id);
  if (!row) return;
  const kalemler = await getKalemRows(id);
  const t = hesaplaToplamlar(
    kalemler.map((k) => ({ miktar: Number(k.miktar), birimFiyat: Number(k.birim_fiyat), iskontoOrani: Number(k.iskonto_orani) })),
    Number(row.iskonto_orani), Number(row.nakliye), Number(row.kdv_orani), row.kdv_dahil === 1,
  );
  await db.update(teklifler).set({
    ara_toplam: t.araToplam.toFixed(2),
    iskonto_tutari: t.iskontoTutari.toFixed(2),
    kdv_tutari: t.kdvTutari.toFixed(2),
    genel_toplam: t.genelToplam.toFixed(2),
  }).where(eq(teklifler.id, id));
}

// ── Teklif CRUD ──────────────────────────────────────────────

export async function repoListTeklifler(q: TeklifListQuery): Promise<{ items: ReturnType<typeof teklifRowToDto>[]; total: number }> {
  const conds = [];
  if (q.durum) conds.push(eq(teklifler.durum, q.durum));
  if (q.musteriId) conds.push(eq(teklifler.musteri_id, q.musteriId));
  if (q.q) conds.push(or(like(teklifler.teklif_no, `%${q.q}%`), like(musteriler.ad, `%${q.q}%`)));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, countRes] = await Promise.all([
    db.select({ t: teklifler, musteriAd: musteriler.ad })
      .from(teklifler)
      .leftJoin(musteriler, eq(musteriler.id, teklifler.musteri_id))
      .where(where)
      .orderBy(desc(teklifler.created_at))
      .limit(q.limit).offset(q.offset),
    db.select({ c: sql<number>`count(*)` }).from(teklifler)
      .leftJoin(musteriler, eq(musteriler.id, teklifler.musteri_id))
      .where(where),
  ]);

  return {
    items: rows.map((r) => teklifRowToDto(r.t, { musteriAd: r.musteriAd })),
    total: Number(countRes[0]?.c ?? 0),
  };
}

export async function repoGetTeklif(id: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  const [kalemler, musteriAd] = await Promise.all([getKalemRows(id), getMusteriAd(row.musteri_id)]);
  return teklifRowToDto(row, { musteriAd, kalemler: kalemler.map(teklifKalemRowToDto) });
}

export async function repoCreateTeklif(body: TeklifCreateBody, userId: string | null): Promise<ReturnType<typeof teklifRowToDto>> {
  // Mevcut müşteri ya da satır içi yeni "aday müşteri"
  let musteriId = body.musteriId ?? null;
  if (!musteriId && body.yeniMusteri) {
    const created = await musteriRepoCreate({
      tur: 'musteri',
      musteriDurumu: 'aday',
      ad: body.yeniMusteri.ad,
      telefon: body.yeniMusteri.telefon,
      email: body.yeniMusteri.email,
      adres: body.yeniMusteri.adres,
    });
    musteriId = created.id;
  }
  if (!musteriId) throw new Error('musteri_gerekli');

  const id = randomUUID();
  const teklifNo = await generateTeklifNo();
  await db.insert(teklifler).values({
    id,
    teklif_no: teklifNo,
    musteri_id: musteriId,
    talep_id: body.talepId ?? null,
    durum: 'taslak',
    dil: body.dil,
    para_birimi: body.paraBirimi,
    kdv_orani: String(body.kdvOrani),
    kdv_dahil: body.kdvDahil ? 1 : 0,
    gecerlilik_tarihi: body.gecerlilikTarihi ? new Date(body.gecerlilikTarihi) : null,
    created_by: userId,
  });
  const dto = await repoGetTeklif(id);
  if (!dto) throw new Error('teklif_olusturulamadi');
  return dto;
}

export async function repoPatchTeklif(id: string, body: TeklifPatchBody): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  if (row.durum !== 'taslak') throw new Error('sadece_taslak_duzenlenir');

  const set: Partial<TeklifRow> = {};
  if (body.paraBirimi !== undefined) set.para_birimi = body.paraBirimi;
  if (body.dil !== undefined) set.dil = body.dil;
  if (body.kdvOrani !== undefined) set.kdv_orani = String(body.kdvOrani);
  if (body.kdvDahil !== undefined) set.kdv_dahil = body.kdvDahil ? 1 : 0;
  if (body.iskontoOrani !== undefined) set.iskonto_orani = String(body.iskontoOrani);
  if (body.nakliye !== undefined) set.nakliye = String(body.nakliye);
  if (body.gecerlilikTarihi !== undefined) set.gecerlilik_tarihi = body.gecerlilikTarihi ? new Date(body.gecerlilikTarihi) : null;
  if (body.odemeKosullari !== undefined) set.odeme_kosullari = body.odemeKosullari ?? null;
  if (body.teslimKosullari !== undefined) set.teslim_kosullari = body.teslimKosullari ?? null;
  if (body.aciklama !== undefined) set.aciklama = body.aciklama ?? null;

  if (Object.keys(set).length > 0) await db.update(teklifler).set(set).where(eq(teklifler.id, id));
  await recalcTeklif(id);
  return repoGetTeklif(id);
}

export async function repoDeleteTeklif(id: string): Promise<boolean> {
  const row = await getTeklifRow(id);
  if (!row) return false;
  if (row.durum !== 'taslak') throw new Error('sadece_taslak_silinir');
  await db.delete(teklifler).where(eq(teklifler.id, id));
  return true;
}

export async function repoSetTeklifDurum(id: string, durum: string, redNedeni?: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  assertGecis(row.durum, durum);
  await db.update(teklifler).set({
    durum,
    red_nedeni: durum === 'red' ? (redNedeni ?? null) : row.red_nedeni,
  }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

// ── Teklif kalemleri ─────────────────────────────────────────

async function assertTaslak(teklifId: string): Promise<TeklifRow> {
  const row = await getTeklifRow(teklifId);
  if (!row) throw new Error('teklif_bulunamadi');
  if (row.durum !== 'taslak') throw new Error('sadece_taslak_duzenlenir');
  return row;
}

export async function repoAddKalem(teklifId: string, body: KalemCreateBody): Promise<ReturnType<typeof teklifRowToDto> | null> {
  await assertTaslak(teklifId);
  // Ürün seçildiyse kod/ad/fiyat/birim snapshot al (ürün kartı değişse teklif değişmez)
  let urunKod: string | null = null;
  let urunAd: string | null = null;
  let birim = body.birim || 'adet';
  let birimFiyat = body.birimFiyat;
  if (body.urunId) {
    const u = await db.select({ kod: urunler.kod, ad: urunler.ad, birim: urunler.birim, fiyat: urunler.birim_fiyat })
      .from(urunler).where(eq(urunler.id, body.urunId)).limit(1);
    if (u[0]) {
      urunKod = u[0].kod;
      urunAd = u[0].ad;
      birim = body.birim || u[0].birim || 'adet';
      if ((body.birimFiyat ?? 0) === 0 && u[0].fiyat != null) birimFiyat = Number(u[0].fiyat);
    }
  }
  const maxSira = await db.select({ m: sql<number>`COALESCE(MAX(${teklifKalemleri.sira}), -1)` })
    .from(teklifKalemleri).where(eq(teklifKalemleri.teklif_id, teklifId));
  const sira = Number(maxSira[0]?.m ?? -1) + 1;

  await db.insert(teklifKalemleri).values({
    id: randomUUID(),
    teklif_id: teklifId,
    urun_id: body.urunId ?? null,
    urun_kod: urunKod,
    urun_ad: urunAd,
    aciklama: body.aciklama,
    birim,
    miktar: String(body.miktar),
    birim_fiyat: String(birimFiyat),
    iskonto_orani: String(body.iskontoOrani),
    satir_toplam: satirToplamHesapla(body.miktar, birimFiyat, body.iskontoOrani).toFixed(2),
    sira,
  });
  await recalcTeklif(teklifId);
  return repoGetTeklif(teklifId);
}

export async function repoPatchKalem(teklifId: string, kalemId: string, body: KalemPatchBody): Promise<ReturnType<typeof teklifRowToDto> | null> {
  await assertTaslak(teklifId);
  const rows = await db.select().from(teklifKalemleri)
    .where(and(eq(teklifKalemleri.id, kalemId), eq(teklifKalemleri.teklif_id, teklifId))).limit(1);
  const kalem = rows[0];
  if (!kalem) throw new Error('kalem_bulunamadi');

  const miktar = body.miktar ?? Number(kalem.miktar);
  const birimFiyat = body.birimFiyat ?? Number(kalem.birim_fiyat);
  const iskontoOrani = body.iskontoOrani ?? Number(kalem.iskonto_orani);

  await db.update(teklifKalemleri).set({
    aciklama: body.aciklama ?? kalem.aciklama,
    birim: body.birim ?? kalem.birim,
    miktar: String(miktar),
    birim_fiyat: String(birimFiyat),
    iskonto_orani: String(iskontoOrani),
    satir_toplam: satirToplamHesapla(miktar, birimFiyat, iskontoOrani).toFixed(2),
  }).where(eq(teklifKalemleri.id, kalemId));
  await recalcTeklif(teklifId);
  return repoGetTeklif(teklifId);
}

export async function repoDeleteKalem(teklifId: string, kalemId: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  await assertTaslak(teklifId);
  await db.delete(teklifKalemleri).where(and(eq(teklifKalemleri.id, kalemId), eq(teklifKalemleri.teklif_id, teklifId)));
  await recalcTeklif(teklifId);
  return repoGetTeklif(teklifId);
}

// ── Teklif talepleri (web lead) ──────────────────────────────

export async function repoListTalepler(q: TalepListQuery): Promise<{ items: ReturnType<typeof teklifTalepRowToDto>[]; total: number }> {
  const conds = [];
  if (q.durum) conds.push(eq(teklifTalepleri.durum, q.durum));
  if (q.q) conds.push(or(like(teklifTalepleri.ad, `%${q.q}%`), like(teklifTalepleri.firma, `%${q.q}%`), like(teklifTalepleri.email, `%${q.q}%`)));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, countRes] = await Promise.all([
    db.select().from(teklifTalepleri).where(where).orderBy(desc(teklifTalepleri.created_at)).limit(q.limit).offset(q.offset),
    db.select({ c: sql<number>`count(*)` }).from(teklifTalepleri).where(where),
  ]);
  return { items: rows.map(teklifTalepRowToDto), total: Number(countRes[0]?.c ?? 0) };
}

export async function repoGetTalep(id: string): Promise<ReturnType<typeof teklifTalepRowToDto> | null> {
  const rows = await db.select().from(teklifTalepleri).where(eq(teklifTalepleri.id, id)).limit(1);
  return rows[0] ? teklifTalepRowToDto(rows[0]) : null;
}

export async function repoPatchTalep(id: string, body: TalepPatchBody): Promise<ReturnType<typeof teklifTalepRowToDto> | null> {
  const set: Partial<TeklifTalepRow> = {};
  if (body.durum !== undefined) set.durum = body.durum;
  if (body.atananUserId !== undefined) set.atanan_user_id = body.atananUserId ?? null;
  if (Object.keys(set).length > 0) await db.update(teklifTalepleri).set(set).where(eq(teklifTalepleri.id, id));
  return repoGetTalep(id);
}

export async function repoCreateTalepPublic(body: TalepPublicBody, ipHash: string | null): Promise<{ id: string }> {
  const id = randomUUID();
  await db.insert(teklifTalepleri).values({
    id,
    kaynak_sayfa: body.kaynakSayfa ?? null,
    dil: body.dil,
    ad: body.ad,
    firma: body.firma ?? null,
    email: body.email ?? null,
    telefon: body.telefon ?? null,
    konu: body.konu ?? null,
    mesaj: body.mesaj ?? null,
    secili_urunler: body.seciliUrunler ?? null,
    utm: body.utm ?? null,
    kvkk_onay: body.kvkkOnay ? 1 : 0,
    durum: 'yeni',
    ip_hash: ipHash,
  });
  return { id };
}

/** Talebi mevcut/yeni müşteriye ve taslak teklife dönüştürür (tek transaction). */
export async function repoDonusturTalep(
  talepId: string, body: TalepDonusturBody, userId: string | null,
): Promise<{ teklifId: string; musteriId: string }> {
  const talepRows = await db.select().from(teklifTalepleri).where(eq(teklifTalepleri.id, talepId)).limit(1);
  const talep = talepRows[0];
  if (!talep) throw new Error('talep_bulunamadi');
  if (talep.durum === 'teklife_donustu' && talep.teklif_id) throw new Error('talep_zaten_donustu');

  const teklifNo = await generateTeklifNo();

  // Müşteri: mevcut ya da yeni. Yeni müşteri, kod üretimi vb. için kendi
  // modülünün repoCreate'i ile açılır (transaction öncesi).
  let musteriId = body.musteriId ?? null;
  if (!musteriId && body.yeniMusteri) {
    // Web/telefon talebinden gelen yeni müşteri = aday müşteri
    const created = await musteriRepoCreate({
      tur: 'musteri',
      musteriDurumu: 'aday',
      ad: body.yeniMusteri.ad,
      telefon: body.yeniMusteri.telefon,
      email: body.yeniMusteri.email,
      adres: body.yeniMusteri.adres,
    });
    musteriId = created.id;
  }
  if (!musteriId) throw new Error('musteri_gerekli');

  return db.transaction(async (tx) => {
    const teklifId = randomUUID();
    await tx.insert(teklifler).values({
      id: teklifId,
      teklif_no: teklifNo,
      musteri_id: musteriId,
      talep_id: talepId,
      durum: 'taslak',
      para_birimi: body.paraBirimi,
      aciklama: talep.mesaj ?? null,
      created_by: userId,
    });

    await tx.update(teklifTalepleri).set({
      durum: 'teklife_donustu',
      musteri_id: musteriId,
      teklif_id: teklifId,
    }).where(eq(teklifTalepleri.id, talepId));

    return { teklifId, musteriId };
  });
}
