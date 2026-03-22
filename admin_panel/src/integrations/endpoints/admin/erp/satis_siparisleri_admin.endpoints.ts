// =============================================================
// FILE: src/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints.ts
// Paspas ERP — Satış Siparişleri RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SatisSiparisDto,
  SatisSiparisListResponse,
  SatisSiparisCreatePayload,
  SatisSiparisPatchPayload,
  SiparisDurum,
} from '@/integrations/shared/erp/satis_siparisleri.types';
import {
  normalizeSatisSiparis,
  normalizeSatisSiparisList,
} from '@/integrations/shared/erp/satis_siparisleri.types';

const BASE = '/admin/satis-siparisleri';

export interface SatisSiparisListParams {
  q?: string;
  musteriId?: string;
  durum?: SiparisDurum;
  tamamlananlariGoster?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const satisSiparisleriAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSatisSiparisleriAdmin: b.query<SatisSiparisListResponse, SatisSiparisListParams | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeSatisSiparisList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((s) => ({ type: 'SatisSiparis' as const, id: s.id })),
              { type: 'SatisSiparisleri' as const, id: 'LIST' },
            ]
          : [{ type: 'SatisSiparisleri' as const, id: 'LIST' }],
    }),

    getSatisSiparisiAdmin: b.query<SatisSiparisDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeSatisSiparis(res),
      providesTags: (_r, _e, id) => [{ type: 'SatisSiparis' as const, id }],
    }),

    createSatisSiparisiAdmin: b.mutation<SatisSiparisDto, SatisSiparisCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeSatisSiparis(res),
      invalidatesTags: [
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
      ],
    }),

    updateSatisSiparisiAdmin: b.mutation<SatisSiparisDto, { id: string; body: SatisSiparisPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeSatisSiparis(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SatisSiparis', id },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
      ],
    }),

    deleteSatisSiparisiAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SatisSiparis', id },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'UretimEmirleri', id: 'ADAYLAR' },
      ],
    }),

    getNextSiparisNoAdmin: b.query<{ siparisNo: string }, void>({
      query: () => ({ url: `${BASE}/next-no` }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSatisSiparisleriAdminQuery,
  useGetSatisSiparisiAdminQuery,
  useCreateSatisSiparisiAdminMutation,
  useUpdateSatisSiparisiAdminMutation,
  useDeleteSatisSiparisiAdminMutation,
  useGetNextSiparisNoAdminQuery,
} = satisSiparisleriAdminApi;
