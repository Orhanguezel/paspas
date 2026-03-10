// =============================================================
// FILE: src/integrations/shared/erp/hareketler.types.ts
// Paspas ERP — Hareketler DTO & normalizers
// =============================================================

export interface HareketDto {
  id: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  hareketTipi: string;
  kaynakTipi: string;
  referansTipi: string | null;
  referansId: string | null;
  miktar: number;
  aciklama: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface HareketListResponse {
  items: HareketDto[];
  total: number;
  summary: {
    toplamKayit: number;
    toplamGiris: number;
    toplamCikis: number;
    sevkiyatAdet: number;
    sevkiyatMiktar: number;
    malKabulAdet: number;
    malKabulMiktar: number;
    duzeltmeAdet: number;
  };
}

export const HAREKET_TIPI_LABELS: Record<string, string> = {
  giris:        'Giriş',
  cikis:        'Çıkış',
  duzeltme:     'Düzeltme',
};

export const HAREKET_TIPI_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  giris:       'default',
  cikis:       'destructive',
  duzeltme:    'outline',
};

export const HAREKET_KAYNAK_LABELS: Record<string, string> = {
  sevkiyat: 'Sevkiyat',
  mal_kabul: 'Mal Kabul',
  stok_duzeltme: 'Stok Düzeltme',
  manuel: 'Manuel',
  uretim: 'Üretim',
  fire: 'Fire',
};

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeHareket(raw: unknown): HareketDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:           toStr(r.id),
    urunId:       toStr(r.urunId),
    urunKod:      r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd:       r.urunAd != null ? toStr(r.urunAd) : null,
    hareketTipi:  toStr(r.hareketTipi),
    kaynakTipi:   toStr(r.kaynakTipi),
    referansTipi: r.referansTipi != null ? toStr(r.referansTipi) : null,
    referansId:   r.referansId != null ? toStr(r.referansId) : null,
    miktar:       toNum(r.miktar),
    aciklama:     r.aciklama != null ? toStr(r.aciklama) : null,
    createdByUserId: r.createdByUserId != null ? toStr(r.createdByUserId) : null,
    createdByName: r.createdByName != null ? toStr(r.createdByName) : null,
    createdAt:    toStr(r.createdAt),
  };
}

export function normalizeHareketList(res: unknown): HareketListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeHareket),
    total: toNum(r.total, rawItems.length),
    summary: isRecord(r.summary)
      ? {
          toplamKayit: toNum(r.summary.toplamKayit),
          toplamGiris: toNum(r.summary.toplamGiris),
          toplamCikis: toNum(r.summary.toplamCikis),
          sevkiyatAdet: toNum(r.summary.sevkiyatAdet),
          sevkiyatMiktar: toNum(r.summary.sevkiyatMiktar),
          malKabulAdet: toNum(r.summary.malKabulAdet),
          malKabulMiktar: toNum(r.summary.malKabulMiktar),
          duzeltmeAdet: toNum(r.summary.duzeltmeAdet),
        }
      : {
          toplamKayit: rawItems.length,
          toplamGiris: 0,
          toplamCikis: 0,
          sevkiyatAdet: 0,
          sevkiyatMiktar: 0,
          malKabulAdet: 0,
          malKabulMiktar: 0,
          duzeltmeAdet: 0,
        },
  };
}
