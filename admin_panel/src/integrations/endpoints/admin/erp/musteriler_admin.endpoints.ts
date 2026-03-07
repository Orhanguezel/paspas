// =============================================================
// FILE: src/integrations/endpoints/admin/erp/musteriler_admin.endpoints.ts
// Paspas ERP — Müşteriler RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  MusteriDto,
  MusteriListResponse,
  MusteriCreatePayload,
  MusteriUpdatePayload,
} from '@/integrations/shared/erp/musteriler.types';
import { normalizeMusteri, normalizeMusteriList } from '@/integrations/shared/erp/musteriler.types';

const BASE = '/admin/musteriler';

export const musterilerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMusterilerAdmin: b.query<MusteriListResponse, { search?: string; tur?: string } | void>({
      query: (params) => ({
        url: BASE,
        params: params
          ? {
              ...(params.search ? { q: params.search } : {}),
              ...(params.tur ? { tur: params.tur } : {}),
            }
          : undefined,
      }),
      transformResponse: (res: unknown) => normalizeMusteriList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((m) => ({ type: 'Musteri' as const, id: m.id })),
              { type: 'Musteriler' as const, id: 'LIST' },
            ]
          : [{ type: 'Musteriler' as const, id: 'LIST' }],
    }),

    getMusteriAdmin: b.query<MusteriDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeMusteri(res),
      providesTags: (_r, _e, id) => [{ type: 'Musteri' as const, id }],
    }),

    createMusteriAdmin: b.mutation<MusteriDto, MusteriCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeMusteri(res),
      invalidatesTags: [{ type: 'Musteriler', id: 'LIST' }],
    }),

    updateMusteriAdmin: b.mutation<MusteriDto, { id: string; body: MusteriUpdatePayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeMusteri(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Musteri', id },
        { type: 'Musteriler', id: 'LIST' },
      ],
    }),

    deleteMusteriAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Musteri', id },
        { type: 'Musteriler', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMusterilerAdminQuery,
  useGetMusteriAdminQuery,
  useCreateMusteriAdminMutation,
  useUpdateMusteriAdminMutation,
  useDeleteMusteriAdminMutation,
} = musterilerAdminApi;
