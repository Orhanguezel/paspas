// =============================================================
// FILE: src/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints.ts
// Paspas ERP — Vardiya Analizi Dashboard endpoints
// =============================================================

import { baseApi } from "@/integrations/baseApi";

const BASE = "/admin/vardiya-analizi";

export type UrunKirilim = {
  urunId: string;
  urunAd: string;
  urunKod: string | null;
  miktar: number;
};

export type VardiyaAnalizItem = {
  id: string;
  makineId: string;
  makineAd: string;
  operatorUserId: string | null;
  operatorAd: string | null;
  vardiyaTipi: string;
  baslangic: string;
  bitis: string | null;
  aktif: boolean;
  planlananSureDk: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  uretim: {
    toplamMiktar: number;
    netToplam: number;
    fireToplam: number;
    urunKirilimi: UrunKirilim[];
  };
  duruslar: {
    toplamDk: number;
    arizaSayisi: number;
    arizaDk: number;
    kalipDegisimSayisi: number;
    kalipDegisimDk: number;
    bakimSayisi: number;
    bakimDk: number;
    digerSayisi: number;
    digerDk: number;
  };
  oee: number;
};

export type VardiyaAnalizOzet = {
  toplamUretim: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  durusOrani: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  aktifVardiyaSayisi: number;
  oee: number;
};

export type MakineRollup = {
  makineId: string;
  makineAd: string;
  vardiyaSayisi: number;
  aktifVardiya: boolean;
  toplamUretim: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  arizaSayisi: number;
  arizaDk: number;
  kalipDegisimSayisi: number;
  kalipDegisimDk: number;
  bakimDk: number;
  ortCevrimSaniye: number | null;
  teorikHedef: number | null;
  hedefGerceklesmeYuzde: number | null;
  oee: number;
};

export type KalipRollup = {
  kalipId: string;
  kalipKod: string;
  kalipAd: string;
  toplamUretim: number;
  calismaDk: number;
  makineSayisi: number;
  makineler: string[];
  urunSayisi: number;
  urunler: string[];
  kalipDegisimSayisi: number;
};

export type VardiyaAnalizResponse = {
  tarih: string;
  vardiyalar: VardiyaAnalizItem[];
  makineler: MakineRollup[];
  kaliplar: KalipRollup[];
  ozet: VardiyaAnalizOzet;
};

export type DurusDetay = {
  id: string;
  baslangic: string;
  bitis: string | null;
  sureDk: number;
  durusTipi: string;
  neden: string;
  nedenKod: string | null;
  operatorUserId: string | null;
  operatorAd: string | null;
};

export type UretimKaydi = {
  id: string;
  kayitTarihi: string;
  urunId: string;
  urunAd: string;
  urunKod: string | null;
  netMiktar: number;
  fireMiktar: number;
  operatorAd: string | null;
  notlar: string | null;
};

export type SaatlikUretim = { saat: string; miktar: number };

export type BagliEmir = {
  emirId: string;
  emirNo: string;
  urunAd: string;
  planlanan: number;
  uretilen: number;
};

export type VardiyaDetayResponse = {
  makineId: string;
  makineAd: string;
  baslangic: string;
  bitis: string;
  duruslar: DurusDetay[];
  uretimKayitlari: UretimKaydi[];
  saatlikUretim: SaatlikUretim[];
  bagliEmirler: BagliEmir[];
};

export const vardiyaAnaliziAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVardiyaAnaliziAdmin: b.query<
      VardiyaAnalizResponse,
      { tarih?: string; baslangicTarih?: string; bitisTarih?: string; makineId?: string } | undefined
    >({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
    }),
    getVardiyaDetayAdmin: b.query<
      VardiyaDetayResponse,
      { vardiyaKayitId?: string; makineId?: string; tarih?: string }
    >({
      query: (params) => ({ url: `${BASE}/detay`, params }),
    }),
    getVardiyaTrendAdmin: b.query<
      TrendResponse,
      { gunSayisi?: number; makineId?: string } | undefined
    >({
      query: (params) => ({ url: `${BASE}/trend`, params: params ?? undefined }),
    }),
  }),
  overrideExisting: true,
});

export type TrendGun = {
  tarih: string;
  toplamUretim: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  oee: number;
};

export type TrendResponse = {
  gunSayisi: number;
  gunler: TrendGun[];
};

export const {
  useGetVardiyaAnaliziAdminQuery,
  useGetVardiyaDetayAdminQuery,
  useGetVardiyaTrendAdminQuery,
} = vardiyaAnaliziAdminApi;
