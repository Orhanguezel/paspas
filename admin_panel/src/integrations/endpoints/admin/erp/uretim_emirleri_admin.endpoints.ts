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
  UretimEmriPatchPayload,
} from '@/integrations/shared/erp/uretim_emirleri.types';
import { normalizeUretimEmri, normalizeUretimEmriAday, normalizeUretimEmriList } from '@/integrations/shared/erp/uretim_emirleri.types';

const BASE = '/admin/uretim-emirleri';

export const uretimEmirleriAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listUretimEmirleriAdmin: b.query<UretimEmriListResponse, { q?: string; durum?: string; urunId?: string; page?: number; limit?: number } | void>({
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
    }),

    createUretimEmriAdmin: b.mutation<UretimEmriDto, UretimEmriCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeUretimEmri(res),
      invalidatesTags: [{ type: 'UretimEmirleri', id: 'LIST' }],
    }),

    updateUretimEmriAdmin: b.mutation<UretimEmriDto, { id: string; body: UretimEmriPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeUretimEmri(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'UretimEmri', id },
        { type: 'UretimEmirleri', id: 'LIST' },
      ],
    }),

    deleteUretimEmriAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'UretimEmri', id },
        { type: 'UretimEmirleri', id: 'LIST' },
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
  useDeleteUretimEmriAdminMutation,
} = uretimEmirleriAdminApi;
