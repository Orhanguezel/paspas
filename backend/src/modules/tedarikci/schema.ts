import { musteriler, type MusteriRow } from '@/modules/musteriler/schema';

// Tedarikçi modülü musteriler tablosunu tur='tedarikci' filtresiyle kullanır
export { musteriler };
export type TedarikciRow = MusteriRow;

export type TedarikciDto = {
  id: string;
  kod: string;
  ad: string;
  ilgiliKisi: string | null;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  iskonto: number;
  toplamSiparis: number;
  acikSiparis: number;
  sonSiparisTarihi: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type TedarikciLikeRow = TedarikciRow & {
  toplam_siparis?: number | string | null;
  acik_siparis?: number | string | null;
  son_siparis_tarihi?: Date | string | null;
};

function toStringDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function rowToDto(row: TedarikciLikeRow): TedarikciDto {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    ilgiliKisi: row.ilgili_kisi ?? null,
    telefon: row.telefon ?? null,
    email: row.email ?? null,
    adres: row.adres ?? null,
    iskonto: row.iskonto ? Number(row.iskonto) : 0,
    toplamSiparis: Number(row.toplam_siparis ?? 0),
    acikSiparis: Number(row.acik_siparis ?? 0),
    sonSiparisTarihi: toStringDate(row.son_siparis_tarihi),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
