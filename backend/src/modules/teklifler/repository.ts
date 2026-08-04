// =============================================================
// FILE: src/modules/teklifler/repository.ts
// Teklif Modülü — DB mantığı (transpalet hesaplama/durum motorundan uyarlanmıştır)
// =============================================================

import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';

import { and, asc, desc, eq, gte, inArray, like, lt, or, sql } from 'drizzle-orm';

import { db, pool } from '@/db/client';
import { users } from '@/modules/auth/schema';
import type { AppRole } from '@/common/middleware/roles';
import { TEKLIF_ISKONTO_LIMITLERI } from '@/common/middleware/permissions';
import { repoCreate as musteriRepoCreate } from '@/modules/musteriler/repository';
import { musteriler } from '@/modules/musteriler/schema';
import { repoGetNextSiparisNo } from '@/modules/satis_siparisleri/repository';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { urunler } from '@/modules/urunler/schema';

import {
  type TeklifKalemRow,
  type TeklifRow,
  type TeklifTalepRow,
  teklifGonderimleri,
  teklifGonderimRowToDto,
  teklifKalemleri,
  teklifKalemRowToDto,
  teklifler,
  teklifRevizyonlari,
  teklifRevizyonRowToDto,
  teklifRowToDto,
  teklifTalepleri,
  teklifTalepRowToDto,
  teklifSablonlari,
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

// ── İskonto onay kapısı (transpalet CRM_ISKONTO_LIMITLERI'nden uyarlanmıştır) ──
// Rolün limitini aşan genel iskonto, admin onayı olmadan gönderilemez.

export function iskontoOnayGerekli(iskontoOrani: number, role: string): boolean {
  const limit = TEKLIF_ISKONTO_LIMITLERI[role as AppRole] ?? 0;
  return iskontoOrani > limit;
}

function assertIskontoOnayiEngelYok(row: TeklifRow, role: string): void {
  if (iskontoOnayGerekli(Number(row.iskonto_orani), role) && row.iskonto_onaylandi !== 1) {
    throw new Error('iskonto_onayi_gerekli');
  }
}

/** Controller'ın /gonder eyleminden çağırdığı public gate — DTO alanları üzerinden. */
export function assertTeklifGonderilebilir(
  teklif: { iskontoOrani: number; iskontoOnaylandi: boolean }, actorRole: string,
): void {
  if (iskontoOnayGerekli(teklif.iskontoOrani, actorRole) && !teklif.iskontoOnaylandi) {
    throw new Error('iskonto_onayi_gerekli');
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
  if (q.ownerUserId) conds.push(eq(teklifler.created_by, q.ownerUserId));
  if (q.paraBirimi) conds.push(eq(teklifler.para_birimi, q.paraBirimi));
  if (q.dil) conds.push(eq(teklifler.dil, q.dil));
  if(q.dateFrom)conds.push(gte(teklifler.created_at,new Date(`${q.dateFrom}T00:00:00`)));
  if(q.dateTo)conds.push(lt(teklifler.created_at,new Date(new Date(`${q.dateTo}T00:00:00`).getTime()+86_400_000)));
  if(q.gecerlilikFrom)conds.push(gte(teklifler.gecerlilik_tarihi,new Date(`${q.gecerlilikFrom}T00:00:00`)));
  if(q.gecerlilikTo)conds.push(lt(teklifler.gecerlilik_tarihi,new Date(new Date(`${q.gecerlilikTo}T00:00:00`).getTime()+86_400_000)));
  if (q.q) conds.push(or(like(teklifler.teklif_no, `%${q.q}%`), like(musteriler.ad, `%${q.q}%`)));
  const where = conds.length ? and(...conds) : undefined;

  const sortColumns={created_at:teklifler.created_at,updated_at:teklifler.updated_at,gecerlilik_tarihi:teklifler.gecerlilik_tarihi,genel_toplam:teklifler.genel_toplam,teklif_no:teklifler.teklif_no};
  const orderBy=q.order==='asc'?asc(sortColumns[q.sort]):desc(sortColumns[q.sort]);
  const [rows, countRes] = await Promise.all([
    db.select({ t: teklifler, musteriAd: musteriler.ad, ownerName: users.full_name, ownerEmail:users.email, revizyonNo:sql<number>`COALESCE((SELECT MAX(r.revizyon_no) FROM teklif_revizyonlari r WHERE r.teklif_id=${teklifler.id}),0)` })
      .from(teklifler)
      .leftJoin(musteriler, eq(musteriler.id, teklifler.musteri_id))
      .leftJoin(users,eq(users.id,teklifler.created_by))
      .where(where)
      .orderBy(orderBy)
      .limit(q.limit).offset(q.offset),
    db.select({ c: sql<number>`count(*)` }).from(teklifler)
      .leftJoin(musteriler, eq(musteriler.id, teklifler.musteri_id))
      .where(where),
  ]);

  return {
    items: rows.map((r) => teklifRowToDto(r.t, { musteriAd: r.musteriAd,ownerName:r.ownerName??r.ownerEmail,revizyonNo:Number(r.revizyonNo) })),
    total: Number(countRes[0]?.c ?? 0),
  };
}

export async function repoGetTeklif(id: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  const [kalemler, musteriAd, gonderimler, revizyonlar] = await Promise.all([
    getKalemRows(id),
    getMusteriAd(row.musteri_id),
    db.select().from(teklifGonderimleri).where(eq(teklifGonderimleri.teklif_id, id)).orderBy(desc(teklifGonderimleri.created_at)),
    db.select().from(teklifRevizyonlari).where(eq(teklifRevizyonlari.teklif_id, id)).orderBy(desc(teklifRevizyonlari.revizyon_no)),
  ]);
  return teklifRowToDto(row, {
    musteriAd,
    revizyonNo: Number(revizyonlar[0]?.revizyon_no ?? 0),
    kalemler: kalemler.map(teklifKalemRowToDto),
    gonderimler: gonderimler.map(teklifGonderimRowToDto),
    revizyonlar: revizyonlar.map((r) => teklifRevizyonRowToDto(r)),
  });
}

/** Gönderim kaydı + gonderim_at + durum→gonderildi (izin veriyorsa). */
export async function repoLogGonderim(
  teklifId: string, kanal: string, aliciEmail: string | null,
  durum: 'basarili' | 'hata', hataMesaji: string | null, userId: string | null,
): Promise<void> {
  await db.insert(teklifGonderimleri).values({
    id: randomUUID(), teklif_id: teklifId, kanal, alici_email: aliciEmail, durum, hata_mesaji: hataMesaji, created_by: userId,
  });
}

/** Başarılı gönderim sonrası teklifi 'gonderildi' yap (taslak/onay_bekliyor'dan). */
export async function repoMarkGonderildi(teklifId: string): Promise<void> {
  const row = await getTeklifRow(teklifId);
  if (!row) return;
  const set: Partial<TeklifRow> = { gonderim_at: new Date() };
  if (row.durum === 'taslak' || row.durum === 'onay_bekliyor') set.durum = 'gonderildi';
  await db.update(teklifler).set(set).where(eq(teklifler.id, teklifId));
}

/** Public token ile teklifi bul; ilk görüntülemeyi işaretle + durum→goruntulendi. */
export async function repoTeklifByToken(token: string): Promise<{ id: string } | null> {
  const rows = await db.select({ id: teklifler.id, durum: teklifler.durum, ilk: teklifler.ilk_goruntuleme_at })
    .from(teklifler).where(eq(teklifler.goruntuleme_token, token)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const set: Partial<TeklifRow> = {};
  if (!row.ilk) set.ilk_goruntuleme_at = new Date();
  if (row.durum === 'gonderildi') set.durum = 'goruntulendi';
  if (Object.keys(set).length > 0) await db.update(teklifler).set(set).where(eq(teklifler.id, row.id));
  return { id: row.id };
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
    goruntuleme_token: randomUUID(),
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
  if (body.musteriId !== undefined) {
    const [musteri] = await db.select({ id: musteriler.id }).from(musteriler).where(and(
      eq(musteriler.id, body.musteriId),
      eq(musteriler.tur, 'musteri'),
      eq(musteriler.is_active, 1),
    )).limit(1);
    if (!musteri) throw new Error('musteri_bulunamadi');
    set.musteri_id = body.musteriId;
  }
  if (body.paraBirimi !== undefined) set.para_birimi = body.paraBirimi;
  if (body.dil !== undefined) set.dil = body.dil;
  if (body.kdvOrani !== undefined) set.kdv_orani = String(body.kdvOrani);
  if (body.kdvDahil !== undefined) set.kdv_dahil = body.kdvDahil ? 1 : 0;
  if (body.iskontoOrani !== undefined && Number(body.iskontoOrani) !== Number(row.iskonto_orani)) {
    // Onay, o anki iskonto oranına bağlıydı — oran değişince yeniden onay gerekir.
    set.iskonto_orani = String(body.iskontoOrani);
    set.iskonto_onaylandi = 0;
    set.iskonto_onaylayan_user_id = null;
    set.iskonto_onay_at = null;
  }
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

export async function repoSetTeklifDurum(
  id: string, durum: string, redNedeni: string | undefined, actorRole: string,
): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  assertGecis(row.durum, durum);
  // 'gonderildi' hedefi — hem generic durum hem /gonder üzerinden ulaşılabilir;
  // iskonto onay kapısı her iki yoldan da geçerli olsun.
  if (durum === 'gonderildi') assertIskontoOnayiEngelYok(row, actorRole);
  await db.update(teklifler).set({
    durum,
    red_nedeni: durum === 'red' ? (redNedeni ?? null) : row.red_nedeni,
  }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

/** Taslak → onay_bekliyor: yalnız gerçekten onay gereken (limit aşan) tekliflerde. */
export async function repoOnayaGonder(id: string, actorRole: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  if (!iskontoOnayGerekli(Number(row.iskonto_orani), actorRole)) throw new Error('onay_gerekmiyor');
  assertGecis(row.durum, 'onay_bekliyor');
  await db.update(teklifler).set({ durum: 'onay_bekliyor' }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

/** Admin onayı: iskonto onaylanır, teklif düzenlemeye (taslak) geri döner. */
export async function repoOnaylaIskonto(id: string, userId: string | null): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  if (row.durum !== 'onay_bekliyor') throw new Error('gecersiz_teklif_gecisi');
  await db.update(teklifler).set({
    durum: 'taslak',
    iskonto_onaylandi: 1,
    iskonto_onaylayan_user_id: userId,
    iskonto_onay_at: new Date(),
  }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

/** Admin reddi: iskonto onaylanmaz, teklif düzenlemeye (taslak) geri döner. */
export async function repoReddetIskonto(id: string, neden: string): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  if (row.durum !== 'onay_bekliyor') throw new Error('gecersiz_teklif_gecisi');
  await db.update(teklifler).set({ durum: 'taslak', red_nedeni: neden }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

/**
 * Revizyon (R0/R1/R2) — gönderilmiş/görüntülenmiş/reddedilmiş/süresi dolmuş
 * teklifin tam anlık görüntüsünü değişmez şekilde saklar, sonra taslağa döner.
 */
export async function repoCreateRevizyon(
  id: string, neden: string, userId: string | null,
): Promise<ReturnType<typeof teklifRowToDto> | null> {
  const row = await getTeklifRow(id);
  if (!row) return null;
  if (!['gonderildi', 'goruntulendi', 'red', 'suresi_doldu'].includes(row.durum)) {
    throw new Error('gecersiz_teklif_gecisi');
  }
  const dto = await repoGetTeklif(id);
  if (!dto) return null;

  const [musteriSnapshot, sablonSnapshot] = await Promise.all([
    db.select({ id:musteriler.id, kod:musteriler.kod, ad:musteriler.ad, ilgiliKisi:musteriler.ilgili_kisi, telefon:musteriler.telefon, email:musteriler.email, adres:musteriler.adres })
      .from(musteriler).where(eq(musteriler.id,row.musteri_id)).limit(1).then((rows)=>rows[0]??null),
    db.select().from(teklifSablonlari).where(eq(teklifSablonlari.varsayilan,1)).limit(1).then((rows)=>rows[0]??null),
  ]);
  const maxNo = await db.select({ m: sql<number>`COALESCE(MAX(${teklifRevizyonlari.revizyon_no}), -1)` })
    .from(teklifRevizyonlari).where(eq(teklifRevizyonlari.teklif_id, id));
  const nextNo = Number(maxNo[0]?.m ?? 0) + 1;

  await db.insert(teklifRevizyonlari).values({
    id: randomUUID(), teklif_id: id, revizyon_no: nextNo,
    snapshot: { teklif:dto, musteri:musteriSnapshot, pdfSablon:sablonSnapshot }, neden, created_by: userId,
  });
  await db.update(teklifler).set({ durum: 'taslak' }).where(eq(teklifler.id, id));
  return repoGetTeklif(id);
}

export async function repoListRevizyonlar(id: string): Promise<ReturnType<typeof teklifRevizyonRowToDto>[]> {
  const rows = await db.select().from(teklifRevizyonlari)
    .where(eq(teklifRevizyonlari.teklif_id, id)).orderBy(desc(teklifRevizyonlari.revizyon_no));
  return rows.map((r) => teklifRevizyonRowToDto(r));
}

export async function repoGetRevizyon(id: string, revizyonNo: number) {
  const rows=await db.select().from(teklifRevizyonlari).where(and(eq(teklifRevizyonlari.teklif_id,id),eq(teklifRevizyonlari.revizyon_no,revizyonNo))).limit(1);
  return rows[0]?teklifRevizyonRowToDto(rows[0],true):null;
}

/**
 * Kabul edilmiş teklifi Paspas satış siparişine dönüştürür (tek transaction):
 * - Yalnız ürünlü kalemler (urun_id dolu) siparişe aktarılır; manuel açıklama satırları atlanır.
 * - Teklif `donusen_siparis_id` ile bağlanır (ikinci kez dönüştürülemez).
 * - Müşteri **aday** ise otomatik **aktif** müşteriye yükseltilir (V1.5 promote).
 */
export async function repoTeklifiSipariseDonustur(
  teklifId: string,
): Promise<{ siparisId: string; siparisNo: string }> {
  const t = await getTeklifRow(teklifId);
  if (!t) throw new Error('teklif_bulunamadi');
  if (t.durum !== 'kabul') throw new Error('teklif_kabul_edilmemis');
  if (t.donusen_siparis_id) throw new Error('teklif_zaten_donustu');

  const kalemler = await getKalemRows(teklifId);
  const urunlu = kalemler.filter((k) => k.urun_id);
  if (urunlu.length === 0) throw new Error('urun_esmesi_gerekli');

  const siparisNo = await repoGetNextSiparisNo();

  return db.transaction(async (tx) => {
    // Yarış koşulu: teklifi kilitleyip tekrar kontrol et
    const [locked] = await tx.select({ durum: teklifler.durum, don: teklifler.donusen_siparis_id })
      .from(teklifler).where(eq(teklifler.id, teklifId)).for('update').limit(1);
    if (!locked) throw new Error('teklif_bulunamadi');
    if (locked.durum !== 'kabul') throw new Error('teklif_kabul_edilmemis');
    if (locked.don) throw new Error('teklif_zaten_donustu');

    const siparisId = randomUUID();
    await tx.insert(satisSiparisleri).values({
      id: siparisId,
      siparis_no: siparisNo,
      musteri_id: t.musteri_id,
      siparis_tarihi: new Date(),
      durum: 'onaylandi',
      ekstra_indirim_orani: t.iskonto_orani,
    });
    await tx.insert(siparisKalemleri).values(
      urunlu.map((k, i) => ({
        id: randomUUID(),
        siparis_id: siparisId,
        urun_id: k.urun_id as string,
        miktar: k.miktar,
        birim_fiyat: k.birim_fiyat,
        sira: i,
      })),
    );

    await tx.update(teklifler).set({ donusen_siparis_id: siparisId }).where(eq(teklifler.id, teklifId));

    // CRM bağlantılı teklif sipariş olduğunda aynı transaction içinde fırsatı kazanıldı yap.
    // Pipeline'ın kendi kazanıldı aşaması kullanılır; bağlantısız teklifler etkilenmez.
    await tx.execute(sql`
      UPDATE crm_deals d
      JOIN crm_deal_teklifleri dt ON dt.firsat_id=d.id AND dt.teklif_id=${teklifId}
      JOIN crm_stages won ON won.pipeline_id=d.pipeline_id AND won.is_won=1
      SET d.stage_id=won.id,d.status='won',d.probability=100,d.lost_reason=NULL,d.lost_reason_id=NULL,d.closed_at=CURRENT_TIMESTAMP
    `);

    // Aday müşteri → aktif (teklif siparişe dönüştü, artık gerçek müşteri)
    await tx.update(musteriler)
      .set({ musteri_durumu: 'aktif' })
      .where(and(eq(musteriler.id, t.musteri_id), eq(musteriler.musteri_durumu, 'aday')));

    return { siparisId, siparisNo };
  });
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
  let birimFiyat = body.birimFiyat ?? Number(kalem.birim_fiyat);
  const iskontoOrani = body.iskontoOrani ?? Number(kalem.iskonto_orani);
  let urunId = kalem.urun_id;
  let urunKod = kalem.urun_kod;
  let urunAd = kalem.urun_ad;
  let birim = body.birim ?? kalem.birim;
  if (body.urunId !== undefined) {
    urunId = body.urunId ?? null;
    urunKod = null;
    urunAd = null;
    if (body.urunId) {
      const [product] = await db.select({ kod:urunler.kod, ad:urunler.ad, birim:urunler.birim, fiyat:urunler.birim_fiyat })
        .from(urunler).where(and(eq(urunler.id, body.urunId), eq(urunler.is_active, 1))).limit(1);
      if (!product) throw new Error('urun_bulunamadi');
      urunKod = product.kod;
      urunAd = product.ad;
      birim = body.birim ?? product.birim ?? 'adet';
      if ((body.birimFiyat ?? 0) === 0 && product.fiyat != null) birimFiyat = Number(product.fiyat);
    }
  }

  await db.update(teklifKalemleri).set({
    urun_id: urunId,
    urun_kod: urunKod,
    urun_ad: urunAd,
    aciklama: body.aciklama ?? kalem.aciklama,
    birim,
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
  if (q.musteriId) conds.push(eq(teklifTalepleri.musteri_id, q.musteriId));
  if (q.durum) conds.push(eq(teklifTalepleri.durum, q.durum));
  if (q.durumGrubu) {
    const groups = { yeni:['yeni'], inceleniyor:['inceleniyor'], donusturuldu:['musteriye_donustu','teklife_donustu','kapandi'], spam:['istenmeyen'] } as const;
    conds.push(inArray(teklifTalepleri.durum, [...groups[q.durumGrubu]]));
  }
  if (q.dil) conds.push(eq(teklifTalepleri.dil, q.dil));
  if (q.konu) conds.push(like(teklifTalepleri.konu, `%${q.konu}%`));
  if (q.dateFrom) conds.push(gte(teklifTalepleri.created_at, new Date(`${q.dateFrom}T00:00:00`)));
  if (q.dateTo) conds.push(lt(teklifTalepleri.created_at, new Date(new Date(`${q.dateTo}T00:00:00`).getTime() + 86_400_000)));
  if (q.ownerUserId) conds.push(eq(teklifTalepleri.atanan_user_id, q.ownerUserId));
  if (q.q) conds.push(or(like(teklifTalepleri.ad, `%${q.q}%`), like(teklifTalepleri.firma, `%${q.q}%`), like(teklifTalepleri.email, `%${q.q}%`), like(teklifTalepleri.telefon, `%${q.q}%`), like(teklifTalepleri.konu, `%${q.q}%`)));
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

export async function repoCreateTalepPublic(body: TalepPublicBody, ipHash: string | null, idempotencyKey: string | null): Promise<{ id: string; created: boolean }> {
  const id = randomUUID();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO teklif_talepleri
       (id,kaynak_sayfa,referrer,dil,ad,firma,email,telefon,konu,mesaj,form_detaylari,secili_urunler,utm,kvkk_onay,durum,ip_hash,idempotency_key)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'yeni\',?,?)`,
      [id,body.kaynakSayfa??null,body.referrer??null,body.dil,body.ad,body.firma??null,body.email??null,body.telefon??null,body.konu??null,body.mesaj??null,
       body.formDetaylari ? JSON.stringify(body.formDetaylari) : null,body.seciliUrunler ? JSON.stringify(body.seciliUrunler) : null,body.utm ? JSON.stringify(body.utm) : null,body.kvkkOnay?1:0,ipHash,idempotencyKey],
    );
    await connection.execute(
      `INSERT INTO crm_talep_detaylari(talep_id,source,channel,product_interest,campaign)
       VALUES(?,'web','form',?,?)`,
      [id,body.seciliUrunler ? JSON.stringify(body.seciliUrunler) : null,body.utm?.utm_campaign??null],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (idempotencyKey && typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      const [rows] = await connection.execute<RowDataPacket[]>('SELECT id FROM teklif_talepleri WHERE idempotency_key=? LIMIT 1', [idempotencyKey]);
      if (rows[0]?.id) return { id: String(rows[0].id), created: false };
    }
    throw error;
  } finally {
    connection.release();
  }
  return { id, created: true };
}

/** Talebi mevcut/yeni müşteriye ve taslak teklife dönüştürür (tek transaction). */
export async function repoDonusturTalep(
  talepId: string, body: TalepDonusturBody, userId: string | null,
): Promise<{ teklifId: string; musteriId: string; aktarilanKalemSayisi: number }> {
  const connection=await pool.getConnection();
  try{
    await connection.beginTransaction();
    const[talepler]=await connection.execute<RowDataPacket[]>('SELECT * FROM teklif_talepleri WHERE id=? FOR UPDATE',[talepId]);
    const talep=talepler[0];if(!talep)throw new Error('talep_bulunamadi');if(talep.durum==='teklife_donustu'&&talep.teklif_id)throw new Error('talep_zaten_donustu');
    let musteriId=body.musteriId??null;
    if(musteriId){const[existing]=await connection.execute<RowDataPacket[]>('SELECT id FROM musteriler WHERE id=? AND tur=\'musteri\' AND is_active=1',[musteriId]);if(!existing[0])throw new Error('musteri_bulunamadi');}
    if(!musteriId&&body.yeniMusteri){musteriId=randomUUID();const kod=`MUS-WEB-${musteriId.replaceAll('-','').slice(0,12).toUpperCase()}`;await connection.execute("INSERT INTO musteriler(id,tur,musteri_durumu,kod,ad,telefon,email,adres,is_active)VALUES(?,'musteri','aday',?,?,?,?,?,1)",[musteriId,kod,body.yeniMusteri.ad,body.yeniMusteri.telefon??null,body.yeniMusteri.email??null,body.yeniMusteri.adres??null]);}
    if(!musteriId)throw new Error('musteri_gerekli');
    const year=new Date().getFullYear();await connection.execute('INSERT INTO teklif_no_sayaclari(yil,son_no)VALUES(?,LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE son_no=LAST_INSERT_ID(son_no+1)',[year]);const[numbers]=await connection.execute<RowDataPacket[]>('SELECT LAST_INSERT_ID() no');const teklifNo=`TK-${year}-${String(numbers[0].no).padStart(4,'0')}`;
    const teklifId=randomUUID();await connection.execute("INSERT INTO teklifler(id,teklif_no,musteri_id,talep_id,durum,dil,para_birimi,aciklama,goruntuleme_token,created_by)VALUES(?,?,?,?,'taslak',?,?,?,?,?)",[teklifId,teklifNo,musteriId,talepId,talep.dil??'tr',body.paraBirimi,talep.mesaj??null,randomUUID(),userId]);
    const selected=Array.isArray(talep.secili_urunler)?talep.secili_urunler:[];let aktarilanKalemSayisi=0;
    for(const raw of selected){const item=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};const ref=typeof item.urunId==='string'?item.urunId:null;let product:RowDataPacket|undefined;if(ref){const[products]=await connection.execute<RowDataPacket[]>('SELECT id,kod,ad,birim FROM urunler WHERE id=? AND is_active=1 LIMIT 1',[ref]);product=products[0];}const ad=String(item.ad??product?.ad??item.slug??'Web ürün önerisi').slice(0,255),miktar=Math.max(1,Number(item.miktar??1)||1);await connection.execute('INSERT INTO teklif_kalemleri(id,teklif_id,urun_id,urun_kod,urun_ad,aciklama,birim,miktar,birim_fiyat,iskonto_orani,satir_toplam,sira)VALUES(?,?,?,?,?,?,?,?,0,0,0,?)',[randomUUID(),teklifId,product?.id??null,product?.kod??null,product?.ad??ad,ad,product?.birim??'adet',miktar,aktarilanKalemSayisi]);aktarilanKalemSayisi++;}
    await connection.execute("UPDATE teklif_talepleri SET durum='teklife_donustu',musteri_id=?,teklif_id=? WHERE id=?",[musteriId,teklifId,talepId]);
    await connection.commit();return{teklifId,musteriId,aktarilanKalemSayisi};
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
