import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, gt, gte, inArray, like, lte, notInArray, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { repoCloseWorkflowTasks, repoUpsertWorkflowTask } from '@/modules/gorevler/repository';
import { hareketler } from '@/modules/hareketler/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { refreshSiparisDurum } from '@/modules/satis_siparisleri/repository';
import { uretimEmriSiparisKalemleri } from '@/modules/uretim_emirleri/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { urunler } from '@/modules/urunler/schema';
import { sevkiyatlar, sevkiyatKalemleri } from '@/modules/operator/schema';

import { sevkEmirleri } from './schema';
import type { BekleyenSatirDto, SevkEmriDto, SevkEmriRow, SiparissizUrunDto } from './schema';
import type { BekleyenlerQuery, SevkEmriCreate, SevkEmriListQuery, SevkEmriPatch, SiparissizQuery } from './validation';

// -- Sevk emri no üretici (SVK-001, SVK-002, ...) --
async function generateSevkEmriNo(): Promise<string> {
  const [row] = await db
    .select({ maxNo: sql<string>`MAX(sevk_emri_no)` })
    .from(sevkEmirleri);
  const last = row?.maxNo;
  if (!last) return 'SVK-001';
  const num = parseInt(last.replace('SVK-', ''), 10);
  return `SVK-${String((Number.isNaN(num) ? 0 : num) + 1).padStart(3, '0')}`;
}

function toDueDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T17:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function syncSevkEmriWorkflowTasks(sevkEmri: SevkEmriDto, actorUserId: string | null) {
  const terminTarihi = toDueDate(sevkEmri.tarih);
  const urunLabel = [sevkEmri.urunKod, sevkEmri.urunAd].filter(Boolean).join(' - ') || 'Sevk Emri';
  const musteriLabel = sevkEmri.musteriAd || 'Bilinmeyen Musteri';

  if (sevkEmri.durum === 'bekliyor') {
    await repoCloseWorkflowTasks({
      ilgiliKayitId: sevkEmri.id,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      baslik: 'Fiziksel sevki tamamla',
      atananRol: 'admin',
    }, 'iptal');
    await repoCloseWorkflowTasks({
      ilgiliKayitId: sevkEmri.id,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      baslik: 'Fiziksel sevki tamamla',
      atananRol: 'sevkiyatci',
    }, 'iptal');
    await repoUpsertWorkflowTask({
      baslik: 'Sevk onayini ver',
      aciklama: `${musteriLabel} icin ${urunLabel} sevk emri onay bekliyor.`,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      ilgiliKayitId: sevkEmri.id,
      atananRol: 'admin',
      durum: 'acik',
      oncelik: 'yuksek',
      terminTarihi,
      olusturanKullaniciId: actorUserId,
    });
    return;
  }

  if (sevkEmri.durum === 'onaylandi') {
    await repoCloseWorkflowTasks({
      ilgiliKayitId: sevkEmri.id,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      baslik: 'Sevk onayini ver',
      atananRol: 'admin',
    }, 'tamamlandi');
    await repoUpsertWorkflowTask({
      baslik: 'Fiziksel sevki tamamla',
      aciklama: `${musteriLabel} icin ${urunLabel} sevki fiziki cikis bekliyor.`,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      ilgiliKayitId: sevkEmri.id,
      atananRol: 'admin',
      durum: 'acik',
      oncelik: 'kritik',
      terminTarihi,
      olusturanKullaniciId: actorUserId,
    });
    await repoUpsertWorkflowTask({
      baslik: 'Fiziksel sevki tamamla',
      aciklama: `${musteriLabel} icin ${urunLabel} sevki fiziki cikis bekliyor.`,
      tip: 'sevkiyat',
      modul: 'sevkiyat',
      ilgiliKayitId: sevkEmri.id,
      atananRol: 'sevkiyatci',
      durum: 'acik',
      oncelik: 'kritik',
      terminTarihi,
      olusturanKullaniciId: actorUserId,
    });
    return;
  }

  if (sevkEmri.durum === 'sevk_edildi' || sevkEmri.durum === 'iptal') {
    await repoCloseWorkflowTasks(
      { ilgiliKayitId: sevkEmri.id, tip: 'sevkiyat', modul: 'sevkiyat' },
      sevkEmri.durum === 'iptal' ? 'iptal' : 'tamamlandi',
    );
  }
}

// ==============================================================
// Bekleyenler — sipariş kalemlerinden sevk edilmeyi bekleyenler
// ==============================================================
export async function repoListBekleyenler(q: BekleyenlerQuery): Promise<{ items: BekleyenSatirDto[]; total: number }> {
  // Sevk edilen miktar alt sorgusu
  const sevkToplamSubquery = sql<string>`COALESCE((
    SELECT SUM(sk.miktar)
    FROM sevkiyat_kalemleri sk
    WHERE sk.siparis_kalem_id = ${siparisKalemleri.id}
  ), 0)`;
  const acikSevkEmriSubquery = sql<string>`COALESCE((
    SELECT SUM(se.miktar)
    FROM sevk_emirleri se
    WHERE se.siparis_kalem_id = ${siparisKalemleri.id}
      AND se.durum IN ('bekliyor', 'onaylandi')
  ), 0)`;
  const onayliSevkEmriSubquery = sql<string>`COALESCE((
    SELECT SUM(se.miktar)
    FROM sevk_emirleri se
    WHERE se.siparis_kalem_id = ${siparisKalemleri.id}
      AND se.durum = 'onaylandi'
  ), 0)`;

  const conditions: SQL[] = [
    // Sevk bekleyen siparişler (iptal/kapali hariç, tamamlandi dahil — üretim bittiyse sevk bekliyor)
    sql`${satisSiparisleri.durum} NOT IN ('iptal', 'kapali')`,
    // Sadece son ürünler (hammadde/yarimamul hariç)
    eq(urunler.kategori, 'urun'),
  ];

  if (q.musteriId) {
    conditions.push(eq(satisSiparisleri.musteri_id, q.musteriId));
  }

  if (q.q) {
    const pattern = `%${q.q}%`;
    conditions.push(
      or(
        like(satisSiparisleri.siparis_no, pattern),
        like(urunler.kod, pattern),
        like(urunler.ad, pattern),
        like(musteriler.ad, pattern),
      ) as SQL,
    );
  }

  const where = and(...conditions);

  // Kalan miktar > 0 kontrolu — kalanMiktar = siparisMiktar - sevkEdilen - acikSevkEmirleri
  const kalanFilter = sql`(${siparisKalemleri.miktar} - ${sevkToplamSubquery} - ${acikSevkEmriSubquery}) > 0`;

  // Stok filtresi — "stoklu": stokta olan VEYA ürünü için aktif (hattaki) üretim emri
  // bulunan kalemler. Üretim hattındaki açık siparişler stok 0/yetersiz olsa da görünür (YN-V9-B).
  // NOT: Kalem durumu (uretim_durumu) yerine ürün bazlı aktif üretim emri EXISTS'e bakılır;
  // çünkü stok/parti üretim emirleri sipariş kalemine bağlı olmayabilir ve
  // 'uretim_tamamlandi' kalemler yanlışlıkla "üretimde" sayılıyordu.
  const uretimdeCondition = sql`EXISTS (
    SELECT 1 FROM uretim_emirleri ue
    WHERE ue.urun_id = ${siparisKalemleri.urun_id}
      AND ue.is_active = 1
      AND ue.durum IN ('atanmamis','planlandi','uretimde','montaj_bekliyor')
  )`;
  const stokCondition =
    q.stokFiltre === 'stoklu'
      ? and(kalanFilter, or(gt(urunler.stok, '0'), uretimdeCondition))
      : kalanFilter;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        siparisId: satisSiparisleri.id,
        siparisNo: satisSiparisleri.siparis_no,
        siparisKalemId: siparisKalemleri.id,
        musteriId: satisSiparisleri.musteri_id,
        musteriAd: musteriler.ad,
        urunId: siparisKalemleri.urun_id,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        siparisMiktar: siparisKalemleri.miktar,
        sevkEdilenMiktar: sevkToplamSubquery,
        acikSevkEmriMiktar: acikSevkEmriSubquery,
        onayliSevkEmriMiktar: onayliSevkEmriSubquery,
        stokMiktar: urunler.stok,
        terminTarihi: satisSiparisleri.termin_tarihi,
      })
      .from(siparisKalemleri)
      .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .innerJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .innerJoin(urunler, eq(siparisKalemleri.urun_id, urunler.id))
      .where(and(where, stokCondition))
      .orderBy(asc(satisSiparisleri.termin_tarihi))
      .limit(q.limit)
      .offset(q.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(siparisKalemleri)
      .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .innerJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .innerJoin(urunler, eq(siparisKalemleri.urun_id, urunler.id))
      .where(and(where, stokCondition)),
  ]);

  const items: BekleyenSatirDto[] = rows.map((r) => {
    const siparisMiktar = Number(r.siparisMiktar ?? 0);
    const sevkEdilen = Number(r.sevkEdilenMiktar ?? 0);
    const acikSevkEmri = Number(r.acikSevkEmriMiktar ?? 0);
    const onayliSevkEmri = Number(r.onayliSevkEmriMiktar ?? 0);
    return {
      siparisId: r.siparisId,
      siparisNo: r.siparisNo,
      siparisKalemId: r.siparisKalemId,
      musteriId: r.musteriId,
      musteriAd: r.musteriAd ?? '',
      urunId: r.urunId,
      urunKod: r.urunKod ?? '',
      urunAd: r.urunAd ?? '',
      siparisMiktar,
      sevkEdilenMiktar: sevkEdilen,
      acikSevkEmriMiktar: acikSevkEmri,
      onayliSevkEmriMiktar: onayliSevkEmri,
      kalanMiktar: siparisMiktar - sevkEdilen - acikSevkEmri,
      stokMiktar: Number(r.stokMiktar ?? 0),
      terminTarihi: r.terminTarihi ? String(r.terminTarihi) : null,
    };
  });

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

// ==============================================================
// Sevk Emirleri CRUD
// ==============================================================

type EnrichedSevkEmriRow = SevkEmriRow & {
  musteriAd?: string | null;
  urunKod?: string | null;
  urunAd?: string | null;
  urunBirim?: string | null;
  koliCarpan?: string | null;
  stokMiktar?: string | null;
};

function rowToDto(row: EnrichedSevkEmriRow): SevkEmriDto {
  return {
    id: row.id,
    sevkEmriNo: row.sevk_emri_no,
    siparisId: row.siparis_id ?? null,
    siparisKalemId: row.siparis_kalem_id ?? null,
    musteriId: row.musteri_id,
    musteriAd: row.musteriAd ?? null,
    urunId: row.urun_id,
    urunKod: row.urunKod ?? null,
    urunAd: row.urunAd ?? null,
    urunBirim: row.urunBirim ?? null,
    koliCarpan: row.koliCarpan != null ? Number(row.koliCarpan) : null,
    miktar: Number(row.miktar ?? 0),
    stokMiktar: Number(row.stokMiktar ?? 0),
    tarih: row.tarih ? String(row.tarih) : new Date().toISOString().slice(0, 10),
    durum: row.durum,
    operatorOnay: row.operator_onay === 1,
    otomatikOlusturuldu: row.otomatik_olusturuldu === 1,
    kaynakUretimEmriId: row.kaynak_uretim_emri_id ?? null,
    notlar: row.notlar ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

function buildListWhere(q: SevkEmriListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (q.durum) conditions.push(eq(sevkEmirleri.durum, q.durum));
  if (q.musteriId) conditions.push(eq(sevkEmirleri.musteri_id, q.musteriId));
  if (q.dateFrom) conditions.push(gte(sevkEmirleri.tarih, new Date(`${q.dateFrom}T00:00:00`)));
  if (q.dateTo) conditions.push(lte(sevkEmirleri.tarih, new Date(`${q.dateTo}T23:59:59`)));
  if (q.q) {
    const pattern = `%${q.q}%`;
    conditions.push(
      or(
        like(sevkEmirleri.sevk_emri_no, pattern),
        like(urunler.kod, pattern),
        like(urunler.ad, pattern),
        like(musteriler.ad, pattern),
      ) as SQL,
    );
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function repoListSevkEmirleri(q: SevkEmriListQuery): Promise<{ items: SevkEmriDto[]; total: number }> {
  const where = buildListWhere(q);
  const orderCol = q.sort === 'tarih' ? sevkEmirleri.tarih : sevkEmirleri.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: sevkEmirleri.id,
        sevk_emri_no: sevkEmirleri.sevk_emri_no,
        siparis_id: sevkEmirleri.siparis_id,
        siparis_kalem_id: sevkEmirleri.siparis_kalem_id,
        musteri_id: sevkEmirleri.musteri_id,
        urun_id: sevkEmirleri.urun_id,
        miktar: sevkEmirleri.miktar,
        tarih: sevkEmirleri.tarih,
        durum: sevkEmirleri.durum,
        operator_onay: sevkEmirleri.operator_onay,
        otomatik_olusturuldu: sevkEmirleri.otomatik_olusturuldu,
        kaynak_uretim_emri_id: sevkEmirleri.kaynak_uretim_emri_id,
        notlar: sevkEmirleri.notlar,
        created_by: sevkEmirleri.created_by,
        created_at: sevkEmirleri.created_at,
        updated_at: sevkEmirleri.updated_at,
        musteriAd: musteriler.ad,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        urunBirim: urunler.birim,
        koliCarpan: sql<string | null>`(SELECT d.carpan FROM urun_birim_donusumleri d WHERE d.urun_id = ${sevkEmirleri.urun_id} AND LOWER(d.hedef_birim) = 'koli' LIMIT 1)`,
        stokMiktar: urunler.stok,
      })
      .from(sevkEmirleri)
      .leftJoin(musteriler, eq(sevkEmirleri.musteri_id, musteriler.id))
      .leftJoin(urunler, eq(sevkEmirleri.urun_id, urunler.id))
      .where(where)
      .orderBy(orderDir)
      .limit(q.limit)
      .offset(q.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sevkEmirleri)
      .leftJoin(musteriler, eq(sevkEmirleri.musteri_id, musteriler.id))
      .leftJoin(urunler, eq(sevkEmirleri.urun_id, urunler.id))
      .where(where),
  ]);

  return {
    items: rows.map((r) => rowToDto(r as unknown as EnrichedSevkEmriRow)),
    total: Number(countResult[0]?.count ?? 0),
  };
}

export async function repoGetSevkEmriById(id: string): Promise<SevkEmriDto | null> {
  const rows = await db
    .select({
      id: sevkEmirleri.id,
      sevk_emri_no: sevkEmirleri.sevk_emri_no,
      siparis_id: sevkEmirleri.siparis_id,
      siparis_kalem_id: sevkEmirleri.siparis_kalem_id,
      musteri_id: sevkEmirleri.musteri_id,
      urun_id: sevkEmirleri.urun_id,
      miktar: sevkEmirleri.miktar,
      tarih: sevkEmirleri.tarih,
      durum: sevkEmirleri.durum,
      operator_onay: sevkEmirleri.operator_onay,
      otomatik_olusturuldu: sevkEmirleri.otomatik_olusturuldu,
      kaynak_uretim_emri_id: sevkEmirleri.kaynak_uretim_emri_id,
      notlar: sevkEmirleri.notlar,
      created_by: sevkEmirleri.created_by,
      created_at: sevkEmirleri.created_at,
      updated_at: sevkEmirleri.updated_at,
      musteriAd: musteriler.ad,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      stokMiktar: urunler.stok,
    })
    .from(sevkEmirleri)
    .leftJoin(musteriler, eq(sevkEmirleri.musteri_id, musteriler.id))
    .leftJoin(urunler, eq(sevkEmirleri.urun_id, urunler.id))
    .where(eq(sevkEmirleri.id, id))
    .limit(1);
  return rows[0] ? rowToDto(rows[0] as unknown as EnrichedSevkEmriRow) : null;
}

function getOtomatikSevkTarihi(tamamlanmaTarihi: Date): Date {
  const sevkTarihi = new Date(tamamlanmaTarihi);
  if (sevkTarihi.getHours() >= 8) sevkTarihi.setDate(sevkTarihi.getDate() + 1);
  sevkTarihi.setHours(0, 0, 0, 0);
  return sevkTarihi;
}

export async function repoCreateOtomatikSevkEmriFromUretim(input: {
  uretimEmriId: string;
  miktar: number;
  tamamlanmaTarihi: Date;
  actorUserId?: string | null;
}): Promise<SevkEmriDto | null> {
  if (input.miktar <= 0) return null;

  const [link] = await db
    .select({
      siparisKalemId: uretimEmriSiparisKalemleri.siparis_kalem_id,
      siparisId: siparisKalemleri.siparis_id,
      musteriId: satisSiparisleri.musteri_id,
      urunId: siparisKalemleri.urun_id,
    })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
    .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, input.uretimEmriId))
    .limit(1);

  if (!link?.siparisKalemId || !link.siparisId || !link.musteriId || !link.urunId) return null;

  const [sameSource] = await db
    .select({ id: sevkEmirleri.id })
    .from(sevkEmirleri)
    .where(
      and(
        eq(sevkEmirleri.kaynak_uretim_emri_id, input.uretimEmriId),
        eq(sevkEmirleri.otomatik_olusturuldu, 1),
      ),
    )
    .limit(1);
  if (sameSource) return null;

  const [openForLine] = await db
    .select({ id: sevkEmirleri.id })
    .from(sevkEmirleri)
    .where(
      and(
        eq(sevkEmirleri.siparis_kalem_id, link.siparisKalemId),
        inArray(sevkEmirleri.durum, ['bekliyor', 'onaylandi']),
      ),
    )
    .limit(1);
  if (openForLine) return null;

  const id = randomUUID();
  const sevkEmriNo = await generateSevkEmriNo();
  const tarih = getOtomatikSevkTarihi(input.tamamlanmaTarihi);
  const createdBy = input.actorUserId ?? null;

  await db.transaction(async (tx) => {
    await tx.insert(sevkEmirleri).values({
      id,
      sevk_emri_no: sevkEmriNo,
      siparis_id: link.siparisId,
      siparis_kalem_id: link.siparisKalemId,
      musteri_id: link.musteriId,
      urun_id: link.urunId,
      miktar: String(input.miktar),
      tarih,
      durum: 'bekliyor',
      otomatik_olusturuldu: 1,
      kaynak_uretim_emri_id: input.uretimEmriId,
      notlar: 'Otomatik oluşturuldu',
      created_by: createdBy,
    });

    await tx
      .update(urunler)
      .set({ rezerve_stok: sql`${urunler.rezerve_stok} + ${String(input.miktar)}` })
      .where(eq(urunler.id, link.urunId));
  });

  const row = await repoGetSevkEmriById(id);
  if (!row) throw new Error('insert_failed');
  await syncSevkEmriWorkflowTasks(row, createdBy);
  return row;
}

export async function repoCreateSevkEmri(data: SevkEmriCreate, createdBy: string | null): Promise<SevkEmriDto> {
  const id = randomUUID();
  const sevkEmriNo = await generateSevkEmriNo();
  const tarih = data.tarih || new Date().toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    await tx.insert(sevkEmirleri).values({
      id,
      sevk_emri_no: sevkEmriNo,
      siparis_id: data.siparisId ?? null,
      siparis_kalem_id: data.siparisKalemId ?? null,
      musteri_id: data.musteriId,
      urun_id: data.urunId,
      miktar: String(data.miktar),
      tarih: new Date(tarih),
      notlar: data.notlar ?? null,
      created_by: createdBy,
    });

    // Sevk emri olusturuldu — stok rezerve et (fiziksel sevke kadar bekletilecek)
    await tx
      .update(urunler)
      .set({ rezerve_stok: sql`${urunler.rezerve_stok} + ${String(data.miktar)}` })
      .where(eq(urunler.id, data.urunId));
  });

  const row = await repoGetSevkEmriById(id);
  if (!row) throw new Error('insert_failed');
  await syncSevkEmriWorkflowTasks(row, createdBy);
  return row;
}

// ==============================================================
// Siparişsiz ürünler — stokta olup aktif siparişi olmayan ürünler
// ==============================================================
export async function repoListSiparissizUrunler(q: SiparissizQuery): Promise<{ items: SiparissizUrunDto[]; total: number }> {
  // Aktif sipariş kalemlerinde bulunan ürün ID'leri
  const aktifSiparisDurumlari = ['taslak', 'onaylandi', 'uretimde', 'kismen_sevk'];
  const urunIdlerInSiparis = db
    .selectDistinct({ urunId: siparisKalemleri.urun_id })
    .from(siparisKalemleri)
    .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
    .where(
      or(
        ...aktifSiparisDurumlari.map((d) => eq(satisSiparisleri.durum, d)),
      ) as SQL,
    );

  const conditions: SQL[] = [
    eq(urunler.kategori, 'urun'),
    gt(urunler.stok, '0'),
    eq(urunler.is_active, 1),
    notInArray(urunler.id, urunIdlerInSiparis),
  ];

  if (q.q) {
    const pattern = `%${q.q}%`;
    conditions.push(
      or(like(urunler.kod, pattern), like(urunler.ad, pattern)) as SQL,
    );
  }

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        urunId: urunler.id,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        stokMiktar: urunler.stok,
        birim: urunler.birim,
      })
      .from(urunler)
      .where(where)
      .orderBy(asc(urunler.ad))
      .limit(q.limit)
      .offset(q.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(urunler)
      .where(where),
  ]);

  const items: SiparissizUrunDto[] = rows.map((r) => ({
    urunId: r.urunId,
    urunKod: r.urunKod ?? '',
    urunAd: r.urunAd ?? '',
    stokMiktar: Number(r.stokMiktar ?? 0),
    birim: r.birim ?? 'adet',
  }));

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

// ==============================================================
// PATCH sevk emri durum — durum geçişi + sevkiyat_kalemleri
// ==============================================================
async function generateSevkNo(): Promise<string> {
  const [row] = await db
    .select({ maxNo: sql<string>`MAX(sevk_no)` })
    .from(sevkiyatlar);
  const last = row?.maxNo;
  if (!last) return 'SVK-S-001';
  const num = parseInt(last.replace(/^SVK-S-/, ''), 10);
  return `SVK-S-${String((Number.isNaN(num) ? 0 : num) + 1).padStart(3, '0')}`;
}

export async function repoPatchSevkEmri(id: string, patch: SevkEmriPatch, operatorUserId: string | null): Promise<SevkEmriDto | null> {
  const existing = await repoGetSevkEmriById(id);
  if (!existing) return null;

  const nextMiktar = patch.miktar ?? existing.miktar;
  const isShip = patch.durum === 'sevk_edildi' && existing.durum !== 'sevk_edildi';

  let touchedSiparisId: string | null = null;

  if (isShip) {
    const sevkMiktar = nextMiktar;
    // YN#2b: Stok yetersiz olsa da sevke izin verilir. Üretim verileri henüz
    // girilmemiş olabilir; stok eksiye düşer, üretim girilince normale döner.
    const sevkiyatId = randomUUID();
    const sevkNo = await generateSevkNo();

    // Durum/miktar güncellemesi + stok hareketi tek transaction: yarım kalırsa
    // sevk emri "sevk_edildi" olarak kalmaz (eski sıralamada bu bug vardı).
    await db.transaction(async (tx) => {
      const shipPayload: Partial<typeof sevkEmirleri.$inferInsert> = {
        durum: 'sevk_edildi',
        miktar: String(sevkMiktar),
      };
      if (patch.tarih) shipPayload.tarih = new Date(`${patch.tarih}T00:00:00`);
      await tx.update(sevkEmirleri).set(shipPayload).where(eq(sevkEmirleri.id, id));

      await tx.insert(sevkiyatlar).values({
        id: sevkiyatId,
        sevk_no: sevkNo,
        operator_user_id: operatorUserId,
        notlar: existing.notlar,
      });

      await tx.insert(sevkiyatKalemleri).values({
        id: randomUUID(),
        sevkiyat_id: sevkiyatId,
        musteri_id: existing.musteriId,
        siparis_id: existing.siparisId ?? null,
        siparis_kalem_id: existing.siparisKalemId ?? null,
        urun_id: existing.urunId,
        miktar: String(sevkMiktar),
      });

      await tx
        .update(urunler)
        .set({
          // YN#2b: stok eksiye düşebilir (signed decimal) — üretim girilince normale döner.
          stok: sql`${urunler.stok} - ${String(sevkMiktar)}`,
          rezerve_stok: sql`GREATEST(0, ${urunler.rezerve_stok} - ${String(existing.miktar)})`,
        })
        .where(eq(urunler.id, existing.urunId));

      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: existing.urunId,
        hareket_tipi: 'cikis',
        referans_tipi: 'sevkiyat',
        referans_id: sevkiyatId,
        miktar: String(-Math.abs(Number(sevkMiktar))),
        aciklama: `Sevkiyat: ${sevkNo}`,
        created_by_user_id: operatorUserId,
      });
    });

    touchedSiparisId = existing.siparisId ?? null;
  } else {
    // Sevk dışı güncellemeler (onaylandi, iptal, bekliyor, miktar/tarih düzeltme)
    const updatePayload: Partial<typeof sevkEmirleri.$inferInsert> = {
      durum: patch.durum,
      miktar: String(nextMiktar),
    };
    if (patch.tarih) updatePayload.tarih = new Date(`${patch.tarih}T00:00:00`);
    await db.update(sevkEmirleri).set(updatePayload).where(eq(sevkEmirleri.id, id));

    // Iptal durumunda rezervasyonu geri al
    if (patch.durum === 'iptal' && existing.durum !== 'iptal' && existing.durum !== 'sevk_edildi') {
      await db
        .update(urunler)
        .set({ rezerve_stok: sql`GREATEST(0, ${urunler.rezerve_stok} - ${String(existing.miktar)})` })
        .where(eq(urunler.id, existing.urunId));
    }
  }

  if (touchedSiparisId) {
    await refreshSiparisDurum(touchedSiparisId);
  }

  const row = await repoGetSevkEmriById(id);
  if (row) {
    await syncSevkEmriWorkflowTasks(row, operatorUserId);
  }
  return row;
}
