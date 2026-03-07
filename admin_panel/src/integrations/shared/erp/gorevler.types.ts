export interface GorevDto {
  id: string;
  baslik: string;
  aciklama: string | null;
  tip: string;
  modul: string | null;
  ilgiliKayitId: string | null;
  atananKullaniciId: string | null;
  atananKullaniciAd: string | null;
  atananRol: string | null;
  durum: 'acik' | 'devam_ediyor' | 'beklemede' | 'tamamlandi' | 'iptal';
  oncelik: 'dusuk' | 'normal' | 'yuksek' | 'kritik';
  terminTarihi: string | null;
  tamamlandiAt: string | null;
  olusturanKullaniciId: string | null;
  olusturanKullaniciAd: string | null;
  gecikti: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GorevListResponse {
  items: GorevDto[];
  total: number;
  summary: {
    toplam: number;
    acik: number;
    bugunTerminli: number;
    geciken: number;
    tamamlanan: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeGorev(raw: unknown): GorevDto {
  const row = isRecord(raw) ? raw : {};
  return {
    id: toStr(row.id),
    baslik: toStr(row.baslik),
    aciklama: row.aciklama == null ? null : toStr(row.aciklama),
    tip: toStr(row.tip, 'manuel'),
    modul: row.modul == null ? null : toStr(row.modul),
    ilgiliKayitId: row.ilgiliKayitId == null ? null : toStr(row.ilgiliKayitId),
    atananKullaniciId: row.atananKullaniciId == null ? null : toStr(row.atananKullaniciId),
    atananKullaniciAd: row.atananKullaniciAd == null ? null : toStr(row.atananKullaniciAd),
    atananRol: row.atananRol == null ? null : toStr(row.atananRol),
    durum: (toStr(row.durum, 'acik') as GorevDto['durum']),
    oncelik: (toStr(row.oncelik, 'normal') as GorevDto['oncelik']),
    terminTarihi: row.terminTarihi == null ? null : toStr(row.terminTarihi),
    tamamlandiAt: row.tamamlandiAt == null ? null : toStr(row.tamamlandiAt),
    olusturanKullaniciId: row.olusturanKullaniciId == null ? null : toStr(row.olusturanKullaniciId),
    olusturanKullaniciAd: row.olusturanKullaniciAd == null ? null : toStr(row.olusturanKullaniciAd),
    gecikti: row.gecikti === true,
    createdAt: toStr(row.createdAt),
    updatedAt: toStr(row.updatedAt),
  };
}

export function normalizeGorevList(raw: unknown): GorevListResponse {
  const row = isRecord(raw) ? raw : {};
  const items = Array.isArray(row.items) ? row.items.map(normalizeGorev) : [];
  const summary = isRecord(row.summary) ? row.summary : {};
  return {
    items,
    total: toNum(row.total, items.length),
    summary: {
      toplam: toNum(summary.toplam, items.length),
      acik: toNum(summary.acik),
      bugunTerminli: toNum(summary.bugunTerminli),
      geciken: toNum(summary.geciken),
      tamamlanan: toNum(summary.tamamlanan),
    },
  };
}
