export type GanttItemDto = {
  uretimEmriId: string;
  emirNo: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriOzet: string | null;
  operasyonOzet: string | null;
  montaj: boolean;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  terminTarihi: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
};
