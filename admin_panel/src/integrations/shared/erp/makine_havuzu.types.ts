// =============================================================
// FILE: src/integrations/shared/erp/makine_havuzu.types.ts
// Paspas ERP — Makine Havuzu DTO & normalizers
// =============================================================

export type MakineDurum = 'aktif' | 'pasif' | 'bakimda';

export interface MakineDto {
  id: string;
  kod: string;
  ad: string;
  tonaj: number | null;
  saatlikKapasite: number | null;
  calisir24Saat: boolean;
  kalipIds: string[];
  kaliplar: Array<{ id: string; kod: string; ad: string }>;
  durum: MakineDurum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MakineListResponse {
  items: MakineDto[];
  total: number;
}

export interface MakineCreatePayload {
  kod: string;
  ad: string;
  tonaj?: number;
  saatlikKapasite?: number;
  calisir24Saat?: boolean;
  durum?: MakineDurum;
  isActive?: boolean;
}

export type MakinePatchPayload = Partial<MakineCreatePayload>;

export const MAKINE_DURUM_LABELS: Record<MakineDurum, string> = {
  aktif:    'Aktif',
  pasif:    'Pasif',
  bakimda:  'Bakımda',
};

export const MAKINE_DURUM_BADGE: Record<MakineDurum, 'default' | 'secondary' | 'destructive'> = {
  aktif:   'default',
  pasif:   'secondary',
  bakimda: 'destructive',
};

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toBool(v: unknown, d = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeMakine(raw: unknown): MakineDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:              toStr(r.id),
    kod:             toStr(r.kod),
    ad:              toStr(r.ad),
    tonaj:           r.tonaj != null ? toNum(r.tonaj) : null,
    saatlikKapasite: r.saatlikKapasite != null ? toNum(r.saatlikKapasite) : null,
    calisir24Saat:   toBool(r.calisir24Saat, false),
    kalipIds:        Array.isArray(r.kalipIds) ? r.kalipIds.map((item) => toStr(item)).filter(Boolean) : [],
    kaliplar:        Array.isArray(r.kaliplar)
      ? r.kaliplar
          .map((item) => {
            const record = isRecord(item) ? item : {};
            return { id: toStr(record.id), kod: toStr(record.kod), ad: toStr(record.ad) };
          })
          .filter((item) => item.id)
      : [],
    durum:           (toStr(r.durum, 'aktif')) as MakineDurum,
    isActive:        toBool(r.isActive),
    createdAt:       toStr(r.createdAt),
    updatedAt:       toStr(r.updatedAt),
  };
}

export function normalizeMakineList(res: unknown): MakineListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeMakine),
    total: toNum(r.total, rawItems.length),
  };
}

// =====================================================
// Kuyruk Yonetimi Tipleri
// =====================================================

export interface AtanmamisOperasyonDto {
  id: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  operasyonAdi: string;
  sira: number;
  kalipId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  montaj: boolean;
  terminTarihi: string | null;
}

/** Üretim emri bazında gruplanmış atanmamış operasyonlar (frontend-only) */
export interface AtanmamisEmirDto {
  uretimEmriId: string;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  planlananMiktar: number;
  terminTarihi: string | null;
  operasyonlar: AtanmamisOperasyonDto[];
}

export interface KuyrukItemDto {
  id: string;
  makineId: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  operasyonAdi: string;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  terminTarihi: string | null;
  musteriOzet: string | null;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
}

export interface KuyrukGrubuDto {
  makineId: string;
  makineKod: string;
  makineAd: string;
  kuyruk: KuyrukItemDto[];
}

export interface AtamaPayload {
  emirOperasyonId: string;
  makineId: string;
  montajMakineId?: string;
}

export interface KuyrukSiralaPayload {
  makineId: string;
  siralar: { kuyruguId: string; sira: number }[];
}

export function normalizeAtanmamisOperasyon(raw: unknown): AtanmamisOperasyonDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    uretimEmriId: toStr(r.uretimEmriId),
    emirNo: toStr(r.emirNo),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    operasyonAdi: toStr(r.operasyonAdi),
    sira: toNum(r.sira, 1),
    kalipId: r.kalipId != null ? toStr(r.kalipId) : null,
    hazirlikSuresiDk: toNum(r.hazirlikSuresiDk),
    cevrimSuresiSn: toNum(r.cevrimSuresiSn),
    planlananMiktar: toNum(r.planlananMiktar),
    montaj: toBool(r.montaj, false),
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
  };
}

/** Flat operasyon listesini üretim emri bazında grupla */
export function groupByEmirId(ops: AtanmamisOperasyonDto[]): AtanmamisEmirDto[] {
  const map = new Map<string, AtanmamisEmirDto>();
  for (const op of ops) {
    let emir = map.get(op.uretimEmriId);
    if (!emir) {
      emir = {
        uretimEmriId: op.uretimEmriId,
        emirNo: op.emirNo,
        urunKod: op.urunKod,
        urunAd: op.urunAd,
        planlananMiktar: op.planlananMiktar,
        terminTarihi: op.terminTarihi,
        operasyonlar: [],
      };
      map.set(op.uretimEmriId, emir);
    }
    emir.operasyonlar.push(op);
  }
  return Array.from(map.values());
}

function normalizeKuyrukItem(raw: unknown): KuyrukItemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    makineId: toStr(r.makineId),
    uretimEmriId: toStr(r.uretimEmriId),
    emirOperasyonId: r.emirOperasyonId != null ? toStr(r.emirOperasyonId) : null,
    emirNo: toStr(r.emirNo),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    operasyonAdi: toStr(r.operasyonAdi),
    sira: toNum(r.sira),
    planlananSureDk: toNum(r.planlananSureDk),
    hazirlikSuresiDk: toNum(r.hazirlikSuresiDk),
    cevrimSuresiSn: toNum(r.cevrimSuresiSn),
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar: toNum(r.uretilenMiktar),
    fireMiktar: toNum(r.fireMiktar),
    montaj: toBool(r.montaj, false),
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    musteriOzet: r.musteriOzet != null ? toStr(r.musteriOzet) : null,
    planlananBaslangic: r.planlananBaslangic != null ? toStr(r.planlananBaslangic) : null,
    planlananBitis: r.planlananBitis != null ? toStr(r.planlananBitis) : null,
    gercekBaslangic: r.gercekBaslangic != null ? toStr(r.gercekBaslangic) : null,
    gercekBitis: r.gercekBitis != null ? toStr(r.gercekBitis) : null,
    durum: toStr(r.durum, 'bekliyor'),
  };
}

export function normalizeKuyrukGrubu(raw: unknown): KuyrukGrubuDto {
  const r = isRecord(raw) ? raw : {};
  return {
    makineId: toStr(r.makineId),
    makineKod: toStr(r.makineKod),
    makineAd: toStr(r.makineAd),
    kuyruk: Array.isArray(r.kuyruk)
      ? (r.kuyruk as unknown[]).map(normalizeKuyrukItem)
      : [],
  };
}

// =====================================================
// Kapasite Hesaplama Tipleri
// =====================================================

export interface KapasiteGunDto {
  tarih: string;
  gunAdi: string;
  calisiyor: boolean;
  tatilMi: boolean;
  haftaSonuMu: boolean;
  durusSaati: number;
}

export interface KapasiteHesabiDto {
  makineId: string;
  makineKod: string;
  makineAd: string;
  calisir24Saat: boolean;
  saatlikKapasite: number | null;
  gunlukCalismaSaati: number;
  toplamCalismaGunu: number;
  toplamCalismaSaati: number;
  toplamDurusSaati: number;
  netCalismaSaati: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  gunler: KapasiteGunDto[];
}

export interface KapasiteQueryParams {
  startDate?: string;
  endDate?: string;
  days?: number;
}

export function normalizeKapasiteHesabi(raw: unknown): KapasiteHesabiDto {
  const r = isRecord(raw) ? raw : {};
  return {
    makineId: toStr(r.makineId),
    makineKod: toStr(r.makineKod),
    makineAd: toStr(r.makineAd),
    calisir24Saat: toBool(r.calisir24Saat, false),
    saatlikKapasite: r.saatlikKapasite != null ? toNum(r.saatlikKapasite) : null,
    gunlukCalismaSaati: toNum(r.gunlukCalismaSaati, 8),
    toplamCalismaGunu: toNum(r.toplamCalismaGunu),
    toplamCalismaSaati: toNum(r.toplamCalismaSaati),
    toplamDurusSaati: toNum(r.toplamDurusSaati),
    netCalismaSaati: toNum(r.netCalismaSaati),
    baslangicTarihi: toStr(r.baslangicTarihi),
    bitisTarihi: toStr(r.bitisTarihi),
    gunler: Array.isArray(r.gunler)
      ? (r.gunler as unknown[]).map((g) => {
          const gr = isRecord(g) ? g : {};
          return {
            tarih: toStr(gr.tarih),
            gunAdi: toStr(gr.gunAdi),
            calisiyor: toBool(gr.calisiyor, false),
            tatilMi: toBool(gr.tatilMi, false),
            haftaSonuMu: toBool(gr.haftaSonuMu, false),
            durusSaati: toNum(gr.durusSaati),
          };
        })
      : [],
  };
}
