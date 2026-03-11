// =============================================================
// FILE: src/integrations/endpoints/admin/erp/satin_alma_admin.endpoints.ts
// Paspas ERP — Satın Alma RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SatinAlmaSiparisDto,
  SatinAlmaListResponse,
  SatinAlmaCreatePayload,
  SatinAlmaPatchPayload,
} from '@/integrations/shared/erp/satin_alma.types';
import { normalizeSatinAlmaSiparis, normalizeSatinAlmaList } from '@/integrations/shared/erp/satin_alma.types';

const BASE = '/admin/satin-alma';

export const satinAlmaAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSatinAlmaAdmin: b.query<SatinAlmaListResponse, { q?: string; durum?: string; tedarikciId?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeSatinAlmaList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((s) => ({ type: 'SatinAlma' as const, id: s.id })),
              { type: 'SatinAlmalar' as const, id: 'LIST' },
            ]
          : [{ type: 'SatinAlmalar' as const, id: 'LIST' }],
    }),

    getNextSiparisNo: b.query<{ siparisNo: string }, void>({
      query: () => ({ url: `${BASE}/next-no` }),
    }),

    getSatinAlmaAdmin: b.query<SatinAlmaSiparisDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeSatinAlmaSiparis(res),
      providesTags: (_r, _e, id) => [{ type: 'SatinAlma' as const, id }],
    }),

    createSatinAlmaAdmin: b.mutation<SatinAlmaSiparisDto, SatinAlmaCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeSatinAlmaSiparis(res),
      invalidatesTags: [{ type: 'SatinAlmalar', id: 'LIST' }],
    }),

    updateSatinAlmaAdmin: b.mutation<SatinAlmaSiparisDto, { id: string; body: SatinAlmaPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeSatinAlmaSiparis(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SatinAlma', id },
        { type: 'SatinAlmalar', id: 'LIST' },
      ],
    }),

    deleteSatinAlmaAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SatinAlma', id },
        { type: 'SatinAlmalar', id: 'LIST' },
      ],
    }),

    checkCriticalStockAdmin: b.mutation<{ ok: boolean }, void>({
      query: () => ({ url: `${BASE}/kritik-stok-kontrol`, method: 'POST' }),
      invalidatesTags: [{ type: 'SatinAlmalar', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetNextSiparisNoQuery,
  useListSatinAlmaAdminQuery,
  useGetSatinAlmaAdminQuery,
  useCreateSatinAlmaAdminMutation,
  useUpdateSatinAlmaAdminMutation,
  useDeleteSatinAlmaAdminMutation,
  useCheckCriticalStockAdminMutation,
} = satinAlmaAdminApi;
