// =============================================================
// FILE: src/integrations/shared/erp/uretim_emirleri.types.ts
// Paspas ERP — Üretim Emirleri DTO & normalizers
// =============================================================

export type UretimEmriDurum = "atanmamis" | "planlandi" | "uretimde" | "tamamlandi" | "iptal";

export interface UretimEmriDto {
  id: string;
  emirNo: string;
  siparisKalemIds: string[];
  siparisNo: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  receteId: string | null;
  receteAd: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  terminTarihi: string | null;
  planlananBitisTarihi: string | null;
  musteriAd: string | null;
  musteriDetay: string | null;
  musteriOzetTipi: "manuel" | "tekil" | "toplam";
  terminRiski: boolean;
  makineAtamaSayisi: number;
  makineAdlari: string | null;
  silinebilir: boolean;
  silmeNedeni: string | null;
  durum: UretimEmriDurum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  urunGorsel: string | null;
}

export interface UretimEmriListResponse {
  items: UretimEmriDto[];
  total: number;
}

export interface UretimEmriCreatePayload {
  emirNo: string;
  siparisKalemIds?: string[];
  urunId: string;
  receteId?: string;
  musteriOzet?: string;
  musteriDetay?: string;
  planlananMiktar: number;
  uretilenMiktar?: number;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  terminTarihi?: string;
  durum?: UretimEmriDurum;
  isActive?: boolean;
}

export type UretimEmriPatchPayload = Partial<UretimEmriCreatePayload>;

export interface HammaddeUyari {
  urunId: string;
  urunAd: string;
  urunKod: string;
  gerekliMiktar: number;
  mevcutStok: number;
  eksikMiktar: number;
}

export interface UretimEmriCreateResponse extends UretimEmriDto {
  hammaddeUyarilari: HammaddeUyari[];
}

export interface HammaddeKontrolResponse {
  yeterli: boolean;
  uyarilar: HammaddeUyari[];
}

export interface UretimKarsilastirma {
  planlananMiktar: number;
  toplamUretilen: number;
  toplamFire: number;
  netUretilen: number;
  fark: number;
}

export interface HammaddeYeterlilikItemDto {
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  urunGorsel: string | null;
  gerekliMiktar: number;
  toplamStok: number;
  rezerveKuyruk: number;
  kalanSerbest: number;
  eksikMiktar: number;
}

export interface HammaddeYeterlilikResponse {
  yeterli: boolean;
  items: HammaddeYeterlilikItemDto[];
}

export interface UretimEmriAdayDto {
  siparisKalemId: string;
  siparisNo: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriAd: string;
  miktar: number;
  terminTarihi: string | null;
}

export const EMIR_DURUM_LABELS: Record<UretimEmriDurum, string> = {
  atanmamis: "Atanmamış",
  planlandi: "Planlandı",
  uretimde: "Üretimde",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const EMIR_DURUM_BADGE: Record<UretimEmriDurum, "default" | "secondary" | "destructive" | "outline"> = {
  atanmamis: "secondary",
  planlandi: "outline",
  uretimde: "default",
  tamamlandi: "default",
  iptal: "destructive",
};

function toStr(v: unknown, d = ""): string {
  return typeof v === "string" ? v.trim() : d;
}
function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function toBool(v: unknown, d = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((item): item is string => typeof item === "string" && item.length > 0);
  return [];
}

export function normalizeUretimEmri(raw: unknown): UretimEmriDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    emirNo: toStr(r.emirNo),
    siparisKalemIds: toStrArray(r.siparisKalemIds),
    siparisNo: r.siparisNo != null ? toStr(r.siparisNo) : null,
    urunId: toStr(r.urunId),
    urunKod: r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd: r.urunAd != null ? toStr(r.urunAd) : null,
    receteId: r.receteId != null ? toStr(r.receteId) : null,
    receteAd: r.receteAd != null ? toStr(r.receteAd) : null,
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar: toNum(r.uretilenMiktar),
    baslangicTarihi: r.baslangicTarihi != null ? toStr(r.baslangicTarihi) : null,
    bitisTarihi: r.bitisTarihi != null ? toStr(r.bitisTarihi) : null,
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    planlananBitisTarihi: r.planlananBitisTarihi != null ? toStr(r.planlananBitisTarihi) : null,
    musteriAd: r.musteriAd != null ? toStr(r.musteriAd) : null,
    musteriDetay: r.musteriDetay != null ? toStr(r.musteriDetay) : null,
    musteriOzetTipi: toStr(r.musteriOzetTipi, "manuel") as "manuel" | "tekil" | "toplam",
    terminRiski: toBool(r.terminRiski, false),
    makineAtamaSayisi: toNum(r.makineAtamaSayisi, 0),
    makineAdlari: r.makineAdlari != null ? toStr(r.makineAdlari) : null,
    silinebilir: toBool(r.silinebilir, true),
    silmeNedeni: r.silmeNedeni != null ? toStr(r.silmeNedeni) : null,
    durum: toStr(r.durum, "atanmamis") as UretimEmriDurum,
    isActive: toBool(r.isActive),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
    urunGorsel: r.urunGorsel != null ? toStr(r.urunGorsel) : null,
  };
}

export function normalizeUretimEmriCreateResponse(raw: unknown): UretimEmriCreateResponse {
  const r = isRecord(raw) ? raw : {};
  const dto = normalizeUretimEmri(raw);
  const rawUyarilar = Array.isArray(r.hammaddeUyarilari) ? r.hammaddeUyarilari : [];
  return {
    ...dto,
    hammaddeUyarilari: rawUyarilar.map((u: unknown) => {
      const item = isRecord(u) ? u : {};
      return {
        urunId: toStr(item.urunId),
        urunAd: toStr(item.urunAd),
        urunKod: toStr(item.urunKod),
        gerekliMiktar: toNum(item.gerekliMiktar),
        mevcutStok: toNum(item.mevcutStok),
        eksikMiktar: toNum(item.eksikMiktar),
      };
    }),
  };
}

export function normalizeUretimEmriAday(raw: unknown): UretimEmriAdayDto {
  const r = isRecord(raw) ? raw : {};
  return {
    siparisKalemId: toStr(r.siparisKalemId),
    siparisNo: toStr(r.siparisNo),
    urunId: toStr(r.urunId),
    urunKod: r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd: r.urunAd != null ? toStr(r.urunAd) : null,
    musteriAd: toStr(r.musteriAd),
    miktar: toNum(r.miktar),
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
  };
}

export function normalizeUretimEmriList(res: unknown): UretimEmriListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeUretimEmri),
    total: toNum(r.total, rawItems.length),
  };
}
