import { urunler, type UrunRow } from '@/modules/urunler/schema';

export type StokRow = UrunRow;
export { urunler as stokUrunler };

export type BirimDonusumItem = {
  hedefBirim: string;
  carpan: number;
};

export type StokDto = {
  urunId: string;
  urunKod: string;
  urunAd: string;
  kategori: string;
  tedarikTipi: string;
  birim: string;
  birimDonusumleri: BirimDonusumItem[];
  stok: number;
  kritikStok: number;
  rezerveStok: number;
  acikUretimIhtiyaci: number;
  serbestStok: number;
  durum: 'yeterli' | 'kritik' | 'yetersiz';
  kritikAcik: number;
  isActive: boolean;
};

function getStokDurumu(stok: number, kritikStok: number): 'yeterli' | 'kritik' | 'yetersiz' {
  if (kritikStok > 0 && stok <= 0) return 'yetersiz';
  if (kritikStok > 0 && stok <= kritikStok) return 'kritik';
  return 'yeterli';
}

export function rowToDto(
  row: StokRow,
  birimDonusumleri: BirimDonusumItem[] = [],
  acikUretimIhtiyaci = 0,
): StokDto {
  const stok = Number(row.stok ?? 0);
  const kritikStok = Number(row.kritik_stok ?? 0);
  const rezerveStok = Number(row.rezerve_stok ?? 0);
  const serbestStok = stok - acikUretimIhtiyaci;
  return {
    urunId: row.id,
    urunKod: row.kod,
    urunAd: row.ad,
    kategori: row.kategori,
    tedarikTipi: row.tedarik_tipi,
    birim: row.birim,
    birimDonusumleri,
    stok,
    kritikStok,
    rezerveStok,
    acikUretimIhtiyaci,
    serbestStok,
    durum: getStokDurumu(stok, kritikStok),
    kritikAcik: Math.max(kritikStok - stok, 0),
    isActive: row.is_active === 1,
  };
}
