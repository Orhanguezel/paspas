export type GanttBarDto = {
  kuyrukId: string;
  makineId: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  emirNo: string;
  siparisNo: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriOzet: string | null;
  operasyonAdi: string | null;
  montaj: boolean;
  sira: number;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  planlananBaslangicTarihi: string | null;
  planlananBitisTarihi: string | null;
  terminTarihi: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
};

export type GanttBlockDto = {
  id: string;
  tip: 'tatil' | 'hafta_sonu' | 'durus';
  baslangicTarihi: string;
  bitisTarihi: string;
  etiket: string;
};

export type GanttMachineDto = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  calisir24Saat: boolean;
  saatlikKapasite: number | null;
  gunlukCalismaSaati: number;
  blocks: GanttBlockDto[];
  items: GanttBarDto[];
};
