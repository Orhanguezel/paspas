// =============================================================
// FILE: src/integrations/endpoints/admin/erp/tedarikci_admin.endpoints.ts
// Paspas ERP — Tedarikçiler RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  TedarikciDto,
  TedarikciListResponse,
  TedarikciCreatePayload,
  TedarikciUpdatePayload,
} from '@/integrations/shared/erp/tedarikci.types';
import { normalizeTedarikci, normalizeTedarikciList } from '@/integrations/shared/erp/tedarikci.types';

const BASE = '/admin/tedarikci';

export const tedarikciAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTedarikciAdmin: b.query<TedarikciListResponse, { q?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeTedarikciList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((t) => ({ type: 'Tedarikci' as const, id: t.id })),
              { type: 'TedarikciList' as const, id: 'LIST' },
            ]
          : [{ type: 'TedarikciList' as const, id: 'LIST' }],
    }),

    getTedarikciAdmin: b.query<TedarikciDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeTedarikci(res),
      providesTags: (_r, _e, id) => [{ type: 'Tedarikci' as const, id }],
    }),

    createTedarikciAdmin: b.mutation<TedarikciDto, TedarikciCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeTedarikci(res),
      invalidatesTags: [{ type: 'TedarikciList', id: 'LIST' }],
    }),

    updateTedarikciAdmin: b.mutation<TedarikciDto, { id: string; body: TedarikciUpdatePayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeTedarikci(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tedarikci', id },
        { type: 'TedarikciList', id: 'LIST' },
      ],
    }),

    deleteTedarikciAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Tedarikci', id },
        { type: 'TedarikciList', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTedarikciAdminQuery,
  useGetTedarikciAdminQuery,
  useCreateTedarikciAdminMutation,
  useUpdateTedarikciAdminMutation,
  useDeleteTedarikciAdminMutation,
} = tedarikciAdminApi;
