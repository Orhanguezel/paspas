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

export type OperasyonKirilim = {
  operasyonId: string | null;
  operasyonAdi: string;
  operasyonTipi: string | null;
  kalipId: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
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
    operasyonKirilimi: OperasyonKirilim[];
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
  oee: number | null;
  verimlilik: number | null;
};

export type VardiyaAnalizOzet = {
  toplamUretim: number;
  toplamFire: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  durusSayisi: number;
  durusOrani: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  aktifVardiyaSayisi: number;
  oee: number | null;
};

export type MakineRollup = {
  makineId: string;
  makineAd: string;
  vardiyaSayisi: number;
  aktifVardiya: boolean;
  toplamUretim: number;
  fireToplam: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  durusSayisi: number;
  arizaSayisi: number;
  arizaDk: number;
  kalipDegisimSayisi: number;
  kalipDegisimDk: number;
  bakimDk: number;
  ortCevrimSaniye: number | null;
  teorikHedef: number | null;
  hedefGerceklesmeYuzde: number | null;
  operasyonKirilimi: OperasyonKirilim[];
  oee: number | null;
};

export type UretimKaydiOzet = {
  id: string;
  vardiyaTipi: string;
  vardiyaBaslangic: string | null;
  vardiyaBitis: string | null;
  makineId: string | null;
  makineAd: string | null;
  baslangic: string;
  bitis: string | null;
  urunAd: string;
  urunKod: string | null;
  operasyonAdi: string | null;
  ekUretimMiktari: number;
  netMiktar: number;
  fireMiktar: number;
  verimlilik: number | null;
  verimlilikNet: number | null;
  verimlilikVardiya: number | null;
  operatorAd: string | null;
  notlar: string | null;
};

export type DurusDetayOzet = {
  id: string;
  makineId: string;
  makineAd: string | null;
  baslangic: string;
  bitis: string | null;
  sureDk: number;
  neden: string;
  operatorAd: string | null;
};

export type DurusNedeniOzet = {
  neden: string;
  adet: number;
  toplamDk: number;
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
  uretimKayitlari: UretimKaydiOzet[];
  durusDetaylari: DurusDetayOzet[];
  durusOzeti: DurusNedeniOzet[];
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
  operasyonAdi: string | null;
  operasyonTipi: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
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

export type GunlukUretimKaydiPatchPayload = {
  ekUretimMiktari?: number;
  fireMiktari?: number;
  netMiktar?: number;
  notlar?: string | null;
};

export const vardiyaAnaliziAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVardiyaAnaliziAdmin: b.query<
      VardiyaAnalizResponse,
      { tarih?: string; baslangicTarih?: string; bitisTarih?: string; vardiyaCifti?: "gunduz-gece" | "gece-gunduz"; makineId?: string[]; vardiyaTipi?: string[] } | undefined
    >({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      providesTags: [{ type: "Vardiyalar", id: "ANALIZ" }],
    }),
    getVardiyaDetayAdmin: b.query<
      VardiyaDetayResponse,
      {
        vardiyaKayitId?: string;
        makineId?: string;
        tarih?: string;
        baslangicTarih?: string;
        bitisTarih?: string;
      }
    >({
      query: (params) => ({ url: `${BASE}/detay`, params }),
    }),
    getVardiyaTrendAdmin: b.query<
      TrendResponse,
      { gunSayisi?: number; makineId?: string } | undefined
    >({
      query: (params) => ({ url: `${BASE}/trend`, params: params ?? undefined }),
    }),
    updateGunlukUretimKaydiAdmin: b.mutation<
      unknown,
      { id: string; body: GunlukUretimKaydiPatchPayload }
    >({
      query: ({ id, body }) => ({ url: `/admin/operator/gunluk-giris/${id}`, method: "PATCH", body }),
      invalidatesTags: [
        { type: "Vardiyalar", id: "ANALIZ" },
        { type: "Vardiyalar", id: "LIST" },
        { type: "Stoklar", id: "LIST" },
        { type: "Hareketler", id: "LIST" },
        { type: "UretimEmirleri", id: "LIST" },
      ],
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
  useUpdateGunlukUretimKaydiAdminMutation,
} = vardiyaAnaliziAdminApi;
