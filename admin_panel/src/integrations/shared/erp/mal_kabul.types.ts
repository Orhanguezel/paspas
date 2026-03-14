// =============================================================
// FILE: src/integrations/shared/erp/mal_kabul.types.ts
// Paspas ERP — Mal Kabul DTO & normalizers
// =============================================================

export interface MalKabulDto {
  id: string;
  kaynakTipi: string;
  satinAlmaSiparisId: string | null;
  satinAlmaKalemId: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  urunBirim: string | null;
  tedarikciId: string | null;
  tedarikciAd: string | null;
  gelenMiktar: number;
  partiNo: string | null;
  operatorUserId: string | null;
  operatorName: string | null;
  kabulTarihi: string;
  notlar: string | null;
  kaliteDurumu: string;
  kaliteNotu: string | null;
  createdAt: string;
}

export interface MalKabulOzetDto {
  toplamKayit: number;
  toplamMiktar: number;
  satinAlmaAdet: number;
  satinAlmaMiktar: number;
  fasonAdet: number;
  fasonMiktar: number;
  digerAdet: number;
  digerMiktar: number;
}

export interface MalKabulListResponse {
  items: MalKabulDto[];
  total: number;
  summary: MalKabulOzetDto;
}

export const KAYNAK_TIPI_LABELS: Record<string, string> = {
  satin_alma: 'Satın Alma',
  fason:      'Fason',
  hammadde:   'Hammadde',
  yari_mamul: 'Yarı Mamul',
  iade:       'İade',
  diger:      'Diğer',
};

export const KAYNAK_TIPI_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  satin_alma: 'default',
  fason:      'secondary',
  hammadde:   'outline',
  yari_mamul: 'outline',
  iade:       'destructive',
  diger:      'outline',
};

export const KALITE_DURUMU_LABELS: Record<string, string> = {
  bekliyor: 'Onay Bekliyor',
  kabul:    'Kabul',
  red:      'Red',
  kosullu:  'Koşullu',
};

export const KALITE_DURUMU_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bekliyor: 'outline',
  kabul:    'default',
  red:      'destructive',
  kosullu:  'secondary',
};

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeMalKabul(raw: unknown): MalKabulDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:                 toStr(r.id),
    kaynakTipi:         toStr(r.kaynakTipi, 'satin_alma'),
    satinAlmaSiparisId: r.satinAlmaSiparisId != null ? toStr(r.satinAlmaSiparisId) : null,
    satinAlmaKalemId:   r.satinAlmaKalemId != null ? toStr(r.satinAlmaKalemId) : null,
    urunId:             toStr(r.urunId),
    urunKod:            r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd:             r.urunAd != null ? toStr(r.urunAd) : null,
    urunBirim:          r.urunBirim != null ? toStr(r.urunBirim) : null,
    tedarikciId:        r.tedarikciId != null ? toStr(r.tedarikciId) : null,
    tedarikciAd:        r.tedarikciAd != null ? toStr(r.tedarikciAd) : null,
    gelenMiktar:        toNum(r.gelenMiktar),
    partiNo:            r.partiNo != null ? toStr(r.partiNo) : null,
    operatorUserId:     r.operatorUserId != null ? toStr(r.operatorUserId) : null,
    operatorName:       r.operatorName != null ? toStr(r.operatorName) : null,
    kabulTarihi:        toStr(r.kabulTarihi),
    notlar:             r.notlar != null ? toStr(r.notlar) : null,
    kaliteDurumu:       toStr(r.kaliteDurumu, 'kabul'),
    kaliteNotu:         r.kaliteNotu != null ? toStr(r.kaliteNotu) : null,
    createdAt:          toStr(r.createdAt),
  };
}

export function normalizeMalKabulList(res: unknown): MalKabulListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  const emptySummary: MalKabulOzetDto = {
    toplamKayit: rawItems.length,
    toplamMiktar: 0,
    satinAlmaAdet: 0,
    satinAlmaMiktar: 0,
    fasonAdet: 0,
    fasonMiktar: 0,
    digerAdet: 0,
    digerMiktar: 0,
  };
  return {
    items: (rawItems as unknown[]).map(normalizeMalKabul),
    total: toNum(r.total, rawItems.length),
    summary: isRecord(r.summary)
      ? {
          toplamKayit:      toNum(r.summary.toplamKayit),
          toplamMiktar:     toNum(r.summary.toplamMiktar),
          satinAlmaAdet:    toNum(r.summary.satinAlmaAdet),
          satinAlmaMiktar:  toNum(r.summary.satinAlmaMiktar),
          fasonAdet:        toNum(r.summary.fasonAdet),
          fasonMiktar:      toNum(r.summary.fasonMiktar),
          digerAdet:        toNum(r.summary.digerAdet),
          digerMiktar:      toNum(r.summary.digerMiktar),
        }
      : emptySummary,
  };
}
