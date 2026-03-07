import {
  char,
  datetime,
  index,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const gorevler = mysqlTable(
  'gorevler',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    baslik: varchar('baslik', { length: 255 }).notNull(),
    aciklama: text('aciklama'),
    tip: varchar('tip', { length: 50 }).notNull(),
    modul: varchar('modul', { length: 64 }),
    ilgili_kayit_id: char('ilgili_kayit_id', { length: 36 }),
    atanan_kullanici_id: char('atanan_kullanici_id', { length: 36 }),
    atanan_rol: varchar('atanan_rol', { length: 32 }),
    durum: varchar('durum', { length: 32 }).notNull().default('acik'),
    oncelik: varchar('oncelik', { length: 32 }).notNull().default('normal'),
    termin_tarihi: datetime('termin_tarihi', { mode: 'date' }),
    tamamlandi_at: datetime('tamamlandi_at', { mode: 'date' }),
    olusturan_kullanici_id: char('olusturan_kullanici_id', { length: 36 }),
    created_at: datetime('created_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    durumIdx: index('idx_gorevler_durum').on(table.durum),
    oncelikIdx: index('idx_gorevler_oncelik').on(table.oncelik),
    terminIdx: index('idx_gorevler_termin').on(table.termin_tarihi),
    atananKullaniciIdx: index('idx_gorevler_atanan_kullanici').on(table.atanan_kullanici_id),
    atananRolIdx: index('idx_gorevler_atanan_rol').on(table.atanan_rol),
  }),
);

export type GorevRow = typeof gorevler.$inferSelect;
export type NewGorevRow = typeof gorevler.$inferInsert;

export type GorevDurum = 'acik' | 'devam_ediyor' | 'beklemede' | 'tamamlandi' | 'iptal';
export type GorevOncelik = 'dusuk' | 'normal' | 'yuksek' | 'kritik';
export type GorevTip = 'manuel' | 'kritik_stok' | 'satin_alma' | 'uretim' | 'sevkiyat' | 'audit' | 'genel';

export type GorevDto = {
  id: string;
  baslik: string;
  aciklama: string | null;
  tip: string;
  modul: string | null;
  ilgiliKayitId: string | null;
  atananKullaniciId: string | null;
  atananKullaniciAd: string | null;
  atananRol: string | null;
  durum: GorevDurum;
  oncelik: GorevOncelik;
  terminTarihi: string | null;
  tamamlandiAt: string | null;
  olusturanKullaniciId: string | null;
  olusturanKullaniciAd: string | null;
  gecikti: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GorevSummaryDto = {
  toplam: number;
  acik: number;
  bugunTerminli: number;
  geciken: number;
  tamamlanan: number;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function rowToDto(
  row: GorevRow,
  names?: {
    atananKullaniciAd?: string | null;
    olusturanKullaniciAd?: string | null;
  },
): GorevDto {
  const terminTarihi = toIso(row.termin_tarihi);
  const tamamlandiAt = toIso(row.tamamlandi_at);
  const isDone = row.durum === 'tamamlandi' || row.durum === 'iptal';
  const gecikti = Boolean(terminTarihi && !isDone && new Date(terminTarihi).getTime() < Date.now());

  return {
    id: row.id,
    baslik: row.baslik,
    aciklama: row.aciklama ?? null,
    tip: row.tip,
    modul: row.modul ?? null,
    ilgiliKayitId: row.ilgili_kayit_id ?? null,
    atananKullaniciId: row.atanan_kullanici_id ?? null,
    atananKullaniciAd: names?.atananKullaniciAd ?? null,
    atananRol: row.atanan_rol ?? null,
    durum: row.durum as GorevDurum,
    oncelik: row.oncelik as GorevOncelik,
    terminTarihi,
    tamamlandiAt,
    olusturanKullaniciId: row.olusturan_kullanici_id ?? null,
    olusturanKullaniciAd: names?.olusturanKullaniciAd ?? null,
    gecikti,
    createdAt: toIso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date(0).toISOString(),
  };
}
