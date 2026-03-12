// =============================================================
// FILE: src/integrations/endpoints/admin/erp/operator_admin.endpoints.ts
// Paspas ERP — Operatör Ekranı RTK Query endpoints (makine-merkezli V2)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AcikVardiyaDto,
  DevamEtPayload,
  DuraklatPayload,
  MakineKuyruguDetayDto,
  MalKabulDto,
  MalKabulPayload,
  OperatorGunlukGirisDto,
  SevkiyatDto,
  SevkiyatKalemDto,
  SevkiyatPayload,
  UretimBaslatPayload,
  UretimBitirPayload,
  VardiyaBasiPayload,
  VardiyaKayitDto,
  VardiyaSonuPayload,
} from '@/integrations/shared/erp/operator.types';
import {
  normalizeGunlukGiris,
  normalizeMakineKuyrugu,
  normalizeMakineKuyruguList,
} from '@/integrations/shared/erp/operator.types';

const BASE = '/admin/operator';

export const operatorAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // -- Makine Kuyrugu --
    listMakineKuyruguAdmin: b.query<
      { items: MakineKuyruguDetayDto[]; total: number },
      { makineId?: string; durum?: string; limit?: number; offset?: number } | void
    >({
      query: (params) => ({ url: `${BASE}/kuyruk`, params: params ?? {} }),
      transformResponse: (res: unknown) => normalizeMakineKuyruguList(res),
      providesTags: [{ type: 'MakineKuyrugu' as const, id: 'LIST' }],
    }),

    // -- Uretim Baslat --
    uretimBaslatAdmin: b.mutation<MakineKuyruguDetayDto, UretimBaslatPayload>({
      query: (body) => ({ url: `${BASE}/baslat`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeMakineKuyrugu(res),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'IsYukleri', id: 'LIST' },
      ],
    }),

    // -- Uretim Bitir --
    uretimBitirAdmin: b.mutation<MakineKuyruguDetayDto, UretimBitirPayload>({
      query: (body) => ({ url: `${BASE}/bitir`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeMakineKuyrugu(res),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'GunlukGirisler', id: 'LIST' },
        { type: 'IsYukleri', id: 'LIST' },
      ],
    }),

    // -- Duraklat --
    duraklatAdmin: b.mutation<{ success: boolean }, DuraklatPayload>({
      query: (body) => ({ url: `${BASE}/duraklat`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'LIST' },
        { type: 'Makineler', id: 'LIST' },
      ],
    }),

    // -- Devam Et --
    devamEtAdmin: b.mutation<{ success: boolean }, DevamEtPayload>({
      query: (body) => ({ url: `${BASE}/devam-et`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'LIST' },
        { type: 'Makineler', id: 'LIST' },
      ],
    }),

    // -- Vardiya --
    vardiyaBasiAdmin: b.mutation<VardiyaKayitDto, VardiyaBasiPayload>({
      query: (body) => ({ url: `${BASE}/vardiya-basi`, method: 'POST', body }),
      invalidatesTags: [{ type: 'GunlukGirisler', id: 'LIST' }],
    }),

    vardiyaSonuAdmin: b.mutation<VardiyaKayitDto, VardiyaSonuPayload>({
      query: (body) => ({ url: `${BASE}/vardiya-sonu`, method: 'POST', body }),
      invalidatesTags: [{ type: 'GunlukGirisler', id: 'LIST' }],
    }),

    // -- Sevkiyat --
    sevkiyatOlusturAdmin: b.mutation<
      { sevkiyat: SevkiyatDto; kalemler: SevkiyatKalemDto[] },
      SevkiyatPayload
    >({
      query: (body) => ({ url: `${BASE}/sevkiyat`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Hareketler', id: 'LIST' },
      ],
    }),

    // -- Mal Kabul --
    malKabulAdmin: b.mutation<MalKabulDto, MalKabulPayload>({
      query: (body) => ({ url: `${BASE}/mal-kabul`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Hareketler', id: 'LIST' },
        { type: 'SatinAlmalar', id: 'LIST' },
      ],
    }),

    // -- Acik Vardiyalar --
    getAcikVardiyalarAdmin: b.query<AcikVardiyaDto[], void>({
      query: () => ({ url: `${BASE}/acik-vardiyalar` }),
      transformResponse: (res: unknown) => (Array.isArray(res) ? (res as AcikVardiyaDto[]) : []),
      providesTags: [{ type: 'MakineKuyrugu' as const, id: 'LIST' }],
    }),

    // -- Gunluk Girisler --
    listGunlukGirislerAdmin: b.query<
      { items: OperatorGunlukGirisDto[]; total: number },
      { limit?: number; offset?: number; dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => ({ url: `${BASE}/gunluk-girisler`, params: params ?? {} }),
      transformResponse: (res: unknown) => {
        if (Array.isArray(res)) return { items: res.map(normalizeGunlukGiris), total: res.length };
        return { items: [], total: 0 };
      },
      providesTags: [{ type: 'GunlukGirisler' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMakineKuyruguAdminQuery,
  useUretimBaslatAdminMutation,
  useUretimBitirAdminMutation,
  useDuraklatAdminMutation,
  useDevamEtAdminMutation,
  useVardiyaBasiAdminMutation,
  useVardiyaSonuAdminMutation,
  useGetAcikVardiyalarAdminQuery,
  useSevkiyatOlusturAdminMutation,
  useMalKabulAdminMutation,
  useListGunlukGirislerAdminQuery,
} = operatorAdminApi;
