// =============================================================
// FILE: src/integrations/shared/erp/teklifler.types.ts
// Paspas ERP — Teklif Modülü (Teklifler + Teklif Talepleri) DTO & normalizers
// =============================================================

export type TeklifDurum =
  | 'taslak'
  | 'onay_bekliyor'
  | 'gonderildi'
  | 'goruntulendi'
  | 'revizyon'
  | 'kabul'
  | 'red'
  | 'suresi_doldu';

export type TalepDurum =
  | 'yeni'
  | 'inceleniyor'
  | 'musteriye_donustu'
  | 'teklife_donustu'
  | 'istenmeyen'
  | 'kapandi';

export interface TeklifKalemDto {
  id: string;
  teklifId: string;
  urunId: string | null;
  urunKod: string | null;
  urunAd: string | null;
  aciklama: string;
  birim: string | null;
  miktar: number;
  birimFiyat: number;
  iskontoOrani: number;
  satirToplam: number;
  sira: number;
}

export interface TeklifDto {
  id: string;
  teklifNo: string;
  musteriId: string;
  musteriAd: string | null;
  talepId: string | null;
  durum: TeklifDurum;
  dil: string;
  paraBirimi: string;
  araToplam: number;
  iskontoOrani: number;
  iskontoTutari: number;
  kdvOrani: number;
  kdvDahil: boolean;
  kdvTutari: number;
  nakliye: number;
  genelToplam: number;
  gecerlilikTarihi: string | null;
  odemeKosullari: string | null;
  teslimKosullari: string | null;
  aciklama: string | null;
  redNedeni: string | null;
  donusenSiparisId: string | null;
  createdAt: string;
  updatedAt: string;
  kalemler?: TeklifKalemDto[];
}

export interface TeklifListResponse {
  items: TeklifDto[];
  total: number;
}

export interface TeklifKalemPayload {
  urunId?: string;
  aciklama: string;
  birim?: string;
  miktar: number;
  birimFiyat?: number;
  iskontoOrani?: number;
}

export interface TeklifCreatePayload {
  musteriId: string;
  paraBirimi?: string;
  dil?: string;
  kdvOrani?: number;
  kdvDahil?: boolean;
  gecerlilikTarihi?: string;
  talepId?: string;
}

export interface TeklifPatchPayload {
  paraBirimi?: string;
  dil?: string;
  kdvOrani?: number;
  kdvDahil?: boolean;
  iskontoOrani?: number;
  nakliye?: number;
  gecerlilikTarihi?: string;
  odemeKosullari?: string;
  teslimKosullari?: string;
  aciklama?: string;
}

export interface TeklifDurumPayload {
  durum: TeklifDurum;
  redNedeni?: string;
}

// ── Teklif Talepleri (web lead'leri) ────────────────────────

export interface TalepSeciliUrunDto {
  urunId?: string;
  ad?: string;
  miktar?: number;
}

export interface TalepDto {
  id: string;
  kaynakSayfa: string | null;
  dil: string;
  ad: string;
  firma: string | null;
  email: string | null;
  telefon: string | null;
  konu: string | null;
  mesaj: string | null;
  seciliUrunler: TalepSeciliUrunDto[];
  utm: Record<string, unknown> | null;
  kvkkOnay: boolean;
  durum: TalepDurum;
  atananUserId: string | null;
  musteriId: string | null;
  teklifId: string | null;
  createdAt: string;
}

export interface TalepListResponse {
  items: TalepDto[];
  total: number;
}

export interface TalepPatchPayload {
  durum?: TalepDurum;
  atananUserId?: string;
}

export interface TalepDonusturPayload {
  musteriId?: string;
  yeniMusteri?: {
    ad: string;
    telefon?: string;
    email?: string;
    adres?: string;
  };
  paraBirimi?: string;
}

export interface TalepDonusturResponse {
  teklifId: string;
  musteriId: string;
}

// ── Labels & Badge variantları ──────────────────────────────

export const TEKLIF_DURUM_LABELS: Record<TeklifDurum, string> = {
  taslak:         'Taslak',
  onay_bekliyor:  'Onay Bekliyor',
  gonderildi:     'Gönderildi',
  goruntulendi:   'Görüntülendi',
  revizyon:       'Revizyon',
  kabul:          'Kabul Edildi',
  red:            'Reddedildi',
  suresi_doldu:   'Süresi Doldu',
};

export const TEKLIF_DURUM_BADGE: Record<TeklifDurum, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  taslak:         'secondary',
  onay_bekliyor:  'outline',
  gonderildi:     'default',
  goruntulendi:   'default',
  revizyon:       'outline',
  kabul:          'default',
  red:            'destructive',
  suresi_doldu:   'destructive',
};

export const TALEP_DURUM_LABELS: Record<TalepDurum, string> = {
  yeni:              'Yeni',
  inceleniyor:       'İnceleniyor',
  musteriye_donustu: 'Müşteriye Dönüştü',
  teklife_donustu:   'Teklife Dönüştü',
  istenmeyen:        'İstenmeyen',
  kapandi:           'Kapandı',
};

export const TALEP_DURUM_BADGE: Record<TalepDurum, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  yeni:              'outline',
  inceleniyor:       'secondary',
  musteriye_donustu: 'default',
  teklife_donustu:   'default',
  istenmeyen:        'destructive',
  kapandi:           'secondary',
};

// İzin verilen teklif durum geçişleri (frontend tarafında sadece UI'da hangi
// aksiyon butonlarının gösterileceğine karar vermek için — backend zaten
// state machine'i kesin doğruluyor).
export const TEKLIF_DURUM_GECISLERI: Record<TeklifDurum, TeklifDurum[]> = {
  taslak:         ['onay_bekliyor', 'gonderildi'],
  onay_bekliyor:  ['taslak', 'gonderildi'],
  gonderildi:     ['goruntulendi', 'revizyon', 'kabul', 'red', 'suresi_doldu'],
  goruntulendi:   ['revizyon', 'kabul', 'red', 'suresi_doldu'],
  revizyon:       ['taslak', 'gonderildi'],
  kabul:          [],
  red:            [],
  suresi_doldu:   ['taslak'],
};

// ── Normalizer helpers ──────────────────────────────────────

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

export function normalizeTeklifKalem(raw: unknown): TeklifKalemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:         toStr(r.id),
    teklifId:   toStr(r.teklifId),
    urunId:     r.urunId != null ? toStr(r.urunId) : null,
    urunKod:    r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd:     r.urunAd != null ? toStr(r.urunAd) : null,
    aciklama:   toStr(r.aciklama),
    birim:      r.birim != null ? toStr(r.birim) : null,
    miktar:     toNum(r.miktar),
    birimFiyat: toNum(r.birimFiyat),
    iskontoOrani: toNum(r.iskontoOrani),
    satirToplam: toNum(r.satirToplam),
    sira:       toNum(r.sira),
  };
}

export function normalizeTeklif(raw: unknown): TeklifDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:            toStr(r.id),
    teklifNo:      toStr(r.teklifNo),
    musteriId:     toStr(r.musteriId),
    musteriAd:     r.musteriAd != null ? toStr(r.musteriAd) : null,
    talepId:       r.talepId != null ? toStr(r.talepId) : null,
    durum:         (toStr(r.durum, 'taslak')) as TeklifDurum,
    dil:           toStr(r.dil, 'tr'),
    paraBirimi:    toStr(r.paraBirimi, 'TRY'),
    araToplam:     toNum(r.araToplam),
    iskontoOrani:  toNum(r.iskontoOrani),
    iskontoTutari: toNum(r.iskontoTutari),
    kdvOrani:      toNum(r.kdvOrani, 20),
    kdvDahil:      toBool(r.kdvDahil, true),
    kdvTutari:     toNum(r.kdvTutari),
    nakliye:       toNum(r.nakliye),
    genelToplam:   toNum(r.genelToplam),
    gecerlilikTarihi: r.gecerlilikTarihi != null ? toStr(r.gecerlilikTarihi) : null,
    odemeKosullari: r.odemeKosullari != null ? toStr(r.odemeKosullari) : null,
    teslimKosullari: r.teslimKosullari != null ? toStr(r.teslimKosullari) : null,
    aciklama:      r.aciklama != null ? toStr(r.aciklama) : null,
    redNedeni:     r.redNedeni != null ? toStr(r.redNedeni) : null,
    donusenSiparisId: r.donusenSiparisId != null ? toStr(r.donusenSiparisId) : null,
    createdAt:     toStr(r.createdAt),
    updatedAt:     toStr(r.updatedAt),
    kalemler:      Array.isArray(r.kalemler) ? (r.kalemler as unknown[]).map(normalizeTeklifKalem) : undefined,
  };
}

export function normalizeTeklifList(res: unknown): TeklifListResponse {
  const rawItems = Array.isArray(res) ? res : [];
  return {
    items: rawItems.map(normalizeTeklif),
    total: rawItems.length,
  };
}

export function normalizeTalep(raw: unknown): TalepDto {
  const r = isRecord(raw) ? raw : {};
  let seciliUrunler: TalepSeciliUrunDto[] = [];
  if (Array.isArray(r.seciliUrunler)) {
    seciliUrunler = r.seciliUrunler.map((item) => {
      const it = isRecord(item) ? item : {};
      return {
        urunId: it.urunId != null ? toStr(it.urunId) : undefined,
        ad: it.ad != null ? toStr(it.ad) : undefined,
        miktar: it.miktar != null ? toNum(it.miktar) : undefined,
      };
    });
  }
  return {
    id:            toStr(r.id),
    kaynakSayfa:   r.kaynakSayfa != null ? toStr(r.kaynakSayfa) : null,
    dil:           toStr(r.dil, 'tr'),
    ad:            toStr(r.ad),
    firma:         r.firma != null ? toStr(r.firma) : null,
    email:         r.email != null ? toStr(r.email) : null,
    telefon:       r.telefon != null ? toStr(r.telefon) : null,
    konu:          r.konu != null ? toStr(r.konu) : null,
    mesaj:         r.mesaj != null ? toStr(r.mesaj) : null,
    seciliUrunler,
    utm:           isRecord(r.utm) ? r.utm : null,
    kvkkOnay:      toBool(r.kvkkOnay),
    durum:         (toStr(r.durum, 'yeni')) as TalepDurum,
    atananUserId:  r.atananUserId != null ? toStr(r.atananUserId) : null,
    musteriId:     r.musteriId != null ? toStr(r.musteriId) : null,
    teklifId:      r.teklifId != null ? toStr(r.teklifId) : null,
    createdAt:     toStr(r.createdAt),
  };
}

export function normalizeTalepList(res: unknown): TalepListResponse {
  const rawItems = Array.isArray(res) ? res : [];
  return {
    items: rawItems.map(normalizeTalep),
    total: rawItems.length,
  };
}
