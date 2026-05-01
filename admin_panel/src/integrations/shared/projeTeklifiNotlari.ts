// Tipler — proje teklifi yazılımcı notları

export type ProjeTeklifiNotTipi = 'note' | 'todo' | 'bug' | 'idea' | 'question';
export type ProjeTeklifiOncelik = 'low' | 'normal' | 'high' | 'urgent';
export type ProjeTeklifiDurum = 'open' | 'in_progress' | 'done' | 'wontfix';

export type ProjeTeklifiNot = {
  id: string;
  dokumanKey: string;
  dokumanBaslik: string | null;
  notTipi: ProjeTeklifiNotTipi;
  baslik: string | null;
  icerik: string;
  etiketler: string[];
  oncelik: ProjeTeklifiOncelik;
  durum: ProjeTeklifiDurum;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjeTeklifiNotListResponse = {
  items: ProjeTeklifiNot[];
  total: number;
};

export type ProjeTeklifiNotListQuery = {
  dokumanKey?: string;
  notTipi?: ProjeTeklifiNotTipi;
  oncelik?: ProjeTeklifiOncelik;
  durum?: ProjeTeklifiDurum;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at' | 'oncelik';
  order?: 'asc' | 'desc';
};

export type CreateProjeTeklifiNotBody = {
  dokumanKey: string;
  dokumanBaslik?: string | null;
  notTipi?: ProjeTeklifiNotTipi;
  baslik?: string | null;
  icerik: string;
  etiketler?: string[] | null;
  oncelik?: ProjeTeklifiOncelik;
  durum?: ProjeTeklifiDurum;
};

export type UpdateProjeTeklifiNotBody = Partial<CreateProjeTeklifiNotBody>;

export type ProjeTeklifiNotStats = {
  total: number;
  byDurum: Record<string, number>;
  byOncelik: Record<string, number>;
  byDokuman: Array<{ dokumanKey: string; count: number }>;
};

export const PROJE_TEKLIFI_NOT_TIPI_OPTIONS: Array<{
  value: ProjeTeklifiNotTipi;
  label: string;
}> = [
  { value: 'note', label: 'Not' },
  { value: 'todo', label: 'Yapılacak' },
  { value: 'bug', label: 'Hata / Düzeltme' },
  { value: 'idea', label: 'Fikir' },
  { value: 'question', label: 'Soru' },
];

export const PROJE_TEKLIFI_ONCELIK_OPTIONS: Array<{
  value: ProjeTeklifiOncelik;
  label: string;
}> = [
  { value: 'low', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' },
];

export const PROJE_TEKLIFI_DURUM_OPTIONS: Array<{
  value: ProjeTeklifiDurum;
  label: string;
}> = [
  { value: 'open', label: 'Açık' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'done', label: 'Tamamlandı' },
  { value: 'wontfix', label: 'Yapılmayacak' },
];
