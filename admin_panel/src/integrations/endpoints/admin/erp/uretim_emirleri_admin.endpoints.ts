// =============================================================
// FILE: src/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints.ts
// Paspas ERP — Üretim Emirleri RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  UretimEmriAdayDto,
  UretimEmriDto,
  UretimEmriListResponse,
  UretimEmriCreatePayload,
  UretimEmriCreateResponse,
  UretimEmriPatchPayload,
  HammaddeKontrolResponse,
  UretimKarsilastirma,
  HammaddeYeterlilikResponse,
} from '@/integrations/shared/erp/uretim_emirleri.types';
import { normalizeUretimEmri, normalizeUretimEmriAday, normalizeUretimEmriCreateResponse, normalizeUretimEmriList } from '@/integrations/shared/erp/uretim_emirleri.types';

const BASE = '/admin/uretim-emirleri';

export const uretimEmirleriAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUretimEmirleriAdmin: b.query<UretimEmriListResponse, { q?: string; durum?: string; urunId?: string; page?: number; limit?: number; sort?: string; order?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeUretimEmriList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((e) => ({ type: 'UretimEmri' as const, id: e.id })),
              { type: 'UretimEmirleri' as const, id: 'LIST' },
            ]
          : [{ type: 'UretimEmirleri' as const, id: 'LIST' }],
    }),

    getUretimEmriAdmin: b.query<UretimEmriDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeUretimEmri(res),
      providesTags: (_r, _e, id) => [{ type: 'UretimEmri' as const, id }],
    }),

    listUretimEmriAdaylariAdmin: b.query<UretimEmriAdayDto[], void>({
      query: () => ({ url: `${BASE}/adaylar` }),
      transformResponse: (res: unknown) =>
        Array.isArray(res) ? res.map((item) => normalizeUretimEmriAday(item)) : [],
      providesTags: [{ type: 'UretimEmirleri', id: 'ADAYLAR' }],
    }),

    getNextEmirNoAdmin: b.query<{ emirNo: string }, void>({
      query: () => ({ url: `${BASE}/next-no` }),
      providesTags: [{ type: 'UretimEmirleri', id: 'NEXT_NO' }],
    }),

    createUretimEmriAdmin: b.mutation<UretimEmriCreateResponse, UretimEmriCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeUretimEmriCreateResponse(res),
      invalidatesTags: [
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
        { type: 'UretimEmirleri', id: 'NEXT_NO' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'ISLEMLER' },
      ],
    }),

    updateUretimEmriAdmin: b.mutation<UretimEmriDto, { id: string; body: UretimEmriPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeUretimEmri(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'UretimEmri', id },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'ISLEMLER' },
      ],
    }),

    updateMamulUretimEmriAdmin: b.mutation<
      { emirIds: string[]; planlananMiktar: number; manuelEmirNolar: string[] },
      {
        partiNo: string;
        mamulUrunId: string;
        planlananMiktar: number;
        siparisTahsisleri?: Array<{ siparisKalemId: string; miktar: number }>;
        manuelEmirler?: Array<{ urunId: string; miktar: number; musteriOzet?: string }>;
      }
    >({
      query: (body) => ({ url: `${BASE}/mamul`, method: 'PATCH', body }),
      // Üretime aktarma ile aynı küme: düzeltme de tahsisleri, emirleri, kuyruğu ve
      // rezervasyonları değiştiriyor. Eksik olursa "Aktarılan" kolonu eski değerde kalır.
      invalidatesTags: [
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'ISLEMLER' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'Stoklar', id: 'LIST' },
      ],
    }),

    checkHammaddeAdmin: b.query<HammaddeKontrolResponse, string>({
      query: (id) => ({ url: `${BASE}/${id}/hammadde-kontrol` }),
    }),

    getUretimKarsilastirmaAdmin: b.query<UretimKarsilastirma, string>({
      query: (id) => ({ url: `${BASE}/${id}/uretim-karsilastirma` }),
    }),
    getHammaddeYeterlilikAdmin: b.query<HammaddeYeterlilikResponse, string>({
      query: (id) => ({ url: `${BASE}/${id}/hammadde-yeterlilik` }),
    }),

    updateUretimEmriOperasyonPlanlariAdmin: b.mutation<
      { items: unknown[] },
      { id: string; body: { operasyonlar: Array<{ id: string; makineId?: string | null; montaj?: boolean }> } }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/operasyon-planlari`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'UretimEmri', id },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
      ],
    }),

    deleteUretimEmriAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'UretimEmri', id },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
        { type: 'UretimEmirleri', id: 'NEXT_NO' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'ISLEMLER' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListUretimEmirleriAdminQuery,
  useListUretimEmriAdaylariAdminQuery,
  useGetUretimEmriAdminQuery,
  useGetNextEmirNoAdminQuery,
  useCreateUretimEmriAdminMutation,
  useUpdateUretimEmriAdminMutation,
  useUpdateMamulUretimEmriAdminMutation,
  useDeleteUretimEmriAdminMutation,
  useLazyCheckHammaddeAdminQuery,
  useLazyGetUretimKarsilastirmaAdminQuery,
  useGetHammaddeYeterlilikAdminQuery,
  useLazyGetHammaddeYeterlilikAdminQuery,
  useUpdateUretimEmriOperasyonPlanlariAdminMutation,
} = uretimEmirleriAdminApi;
