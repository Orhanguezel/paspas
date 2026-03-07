// =============================================================
// FILE: src/integrations/shared/erp/operator.types.ts
// Paspas ERP — Operatör Ekranı DTO & normalizers (makine-merkezli V2)
// =============================================================

// -- Makine Kuyrugu Detay DTO (backend MakineKuyruguDetayDto) --

export interface MakineKuyruguDetayDto {
  id: string;
  makineId: string;
  makineKod: string;
  makineAd: string;
  uretimEmriId: string;
  emirNo: string;
  emirOperasyonId: string | null;
  operasyonAdi: string | null;
  operasyonSira: number | null;
  urunId: string;
  urunKod: string;
  urunAd: string;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
}

export type KuyrukDurum = 'bekliyor' | 'calisiyor' | 'duraklatildi' | 'tamamlandi' | 'iptal';

// -- Payloads --

export interface UretimBaslatPayload {
  makineKuyrukId: string;
}

export interface UretimBitirPayload {
  makineKuyrukId: string;
  uretilenMiktar: number;
  fireMiktar?: number;
  birimTipi?: 'adet' | 'takim';
  notlar?: string;
}

export interface DuraklatPayload {
  makineKuyrukId: string;
  neden: string;
  makineArizasi?: boolean;
}

export interface DevamEtPayload {
  makineKuyrukId: string;
}

export interface VardiyaBasiPayload {
  makineId: string;
  vardiyaTipi?: 'gunduz' | 'gece';
  notlar?: string;
}

export interface VardiyaSonuPayload {
  makineId: string;
  uretilenMiktar?: number;
  fireMiktar?: number;
  birimTipi?: 'adet' | 'takim';
  notlar?: string;
}

export interface SevkiyatKalemPayload {
  musteriId: string;
  siparisId?: string;
  siparisKalemId?: string;
  urunId: string;
  miktar: number;
  birim?: string;
}

export interface SevkiyatPayload {
  kalemler: SevkiyatKalemPayload[];
  notlar?: string;
}

export interface MalKabulPayload {
  satinAlmaSiparisId: string;
  satinAlmaKalemId: string;
  urunId: string;
  gelenMiktar: number;
  notlar?: string;
}

// -- Response DTOs --

export interface VardiyaKayitDto {
  id: string;
  makineId: string;
  operatorUserId: string | null;
  vardiyaTipi: string;
  baslangic: string;
  bitis: string | null;
  notlar: string | null;
}

export interface SevkiyatDto {
  id: string;
  sevkNo: string;
  operatorUserId: string | null;
  sevkTarihi: string;
  notlar: string | null;
}

export interface SevkiyatKalemDto {
  id: string;
  sevkiyatId: string;
  musteriId: string;
  siparisId: string | null;
  siparisKalemId: string | null;
  urunId: string;
  miktar: number;
  birim: string;
}

export interface MalKabulDto {
  id: string;
  satinAlmaSiparisId: string;
  satinAlmaKalemId: string;
  urunId: string;
  gelenMiktar: number;
  operatorUserId: string | null;
  kabulTarihi: string;
  notlar: string | null;
}

export type OperatorGunlukDurum =
  | 'devam_ediyor'
  | 'yarim_kaldi'
  | 'durdu'
  | 'iptal_edildi'
  | 'makine_arizasi'
  | 'tamamlandi';

export interface OperatorGunlukGirisDto {
  id: string;
  uretimEmriId: string;
  makineId: string | null;
  emirOperasyonId: string | null;
  operatorUserId: string | null;
  gunlukDurum: OperatorGunlukDurum;
  ekUretimMiktari: number;
  fireMiktari: number;
  netMiktar: number;
  birimTipi: string;
  makineArizasi: boolean;
  durusNedeni: string | null;
  notlar: string | null;
  kayitTarihi: string;
  createdAt: string;
}

// -- Normalizers --

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toBool(v: unknown, d = false): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeMakineKuyrugu(raw: unknown): MakineKuyruguDetayDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    makineId: toStr(r.makineId),
    makineKod: toStr(r.makineKod),
    makineAd: toStr(r.makineAd),
    uretimEmriId: toStr(r.uretimEmriId),
    emirNo: toStr(r.emirNo),
    emirOperasyonId: r.emirOperasyonId != null ? toStr(r.emirOperasyonId) : null,
    operasyonAdi: r.operasyonAdi != null ? toStr(r.operasyonAdi) : null,
    operasyonSira: r.operasyonSira != null ? toNum(r.operasyonSira) : null,
    urunId: toStr(r.urunId),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar: toNum(r.uretilenMiktar),
    fireMiktar: toNum(r.fireMiktar),
    montaj: toBool(r.montaj),
    sira: toNum(r.sira),
    planlananSureDk: toNum(r.planlananSureDk),
    hazirlikSuresiDk: toNum(r.hazirlikSuresiDk),
    cevrimSuresiSn: toNum(r.cevrimSuresiSn),
    planlananBaslangic: r.planlananBaslangic != null ? toStr(r.planlananBaslangic) : null,
    planlananBitis: r.planlananBitis != null ? toStr(r.planlananBitis) : null,
    gercekBaslangic: r.gercekBaslangic != null ? toStr(r.gercekBaslangic) : null,
    gercekBitis: r.gercekBitis != null ? toStr(r.gercekBitis) : null,
    durum: toStr(r.durum, 'bekliyor'),
  };
}

export function normalizeMakineKuyruguList(res: unknown): { items: MakineKuyruguDetayDto[]; total: number } {
  if (Array.isArray(res)) return { items: res.map(normalizeMakineKuyrugu), total: res.length };
  if (isRecord(res) && Array.isArray(res.items)) {
    return { items: (res.items as unknown[]).map(normalizeMakineKuyrugu), total: toNum(res.total) };
  }
  return { items: [], total: 0 };
}

export function normalizeGunlukGiris(raw: unknown): OperatorGunlukGirisDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    uretimEmriId: toStr(r.uretimEmriId),
    makineId: r.makineId != null ? toStr(r.makineId) : null,
    emirOperasyonId: r.emirOperasyonId != null ? toStr(r.emirOperasyonId) : null,
    operatorUserId: r.operatorUserId != null ? toStr(r.operatorUserId) : null,
    gunlukDurum: toStr(r.gunlukDurum, 'devam_ediyor') as OperatorGunlukDurum,
    ekUretimMiktari: toNum(r.ekUretimMiktari),
    fireMiktari: toNum(r.fireMiktari),
    netMiktar: toNum(r.netMiktar),
    birimTipi: toStr(r.birimTipi, 'adet'),
    makineArizasi: toBool(r.makineArizasi),
    durusNedeni: r.durusNedeni != null ? toStr(r.durusNedeni) : null,
    notlar: r.notlar != null ? toStr(r.notlar) : null,
    kayitTarihi: toStr(r.kayitTarihi),
    createdAt: toStr(r.createdAt),
  };
}
