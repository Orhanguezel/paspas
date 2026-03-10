// =============================================================
// FILE: src/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints.ts
// Paspas ERP — Mal Kabul RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { MalKabulDto, MalKabulListResponse } from '@/integrations/shared/erp/mal_kabul.types';
import { normalizeMalKabulList, normalizeMalKabul } from '@/integrations/shared/erp/mal_kabul.types';

const BASE = '/admin/mal-kabul';

export const malKabulAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMalKabulAdmin: b.query<MalKabulListResponse, {
      q?: string;
      kaynakTipi?: string;
      urunId?: string;
      tedarikciId?: string;
      kaliteDurumu?: string;
      dateFrom?: string;
      dateTo?: string;
      sort?: string;
      order?: string;
      limit?: number;
      offset?: number;
    } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeMalKabulList(res),
      providesTags: [{ type: 'MalKabul' as const, id: 'LIST' }],
    }),
    getMalKabulAdmin: b.query<MalKabulDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeMalKabul(res),
      providesTags: (_r, _e, id) => [{ type: 'MalKabul' as const, id }],
    }),
    createMalKabulAdmin: b.mutation<MalKabulDto, {
      kaynakTipi?: string;
      satinAlmaSiparisId?: string;
      satinAlmaKalemId?: string;
      urunId: string;
      tedarikciId?: string;
      gelenMiktar: number;
      partiNo?: string;
      notlar?: string;
      kaliteDurumu?: string;
      kaliteNotu?: string;
    }>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      invalidatesTags: [
        { type: 'MalKabul', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Hareketler', id: 'LIST' },
        { type: 'SatinAlma', id: 'LIST' },
        { type: 'SatinAlmalar', id: 'LIST' },
      ],
    }),
    updateMalKabulAdmin: b.mutation<MalKabulDto, { id: string; body: {
      notlar?: string;
      kaliteDurumu?: string;
      kaliteNotu?: string;
      partiNo?: string;
    } }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'MalKabul', id: 'LIST' },
        { type: 'MalKabul', id },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Hareketler', id: 'LIST' },
      ],
    }),
    deleteMalKabulAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'MalKabul', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Hareketler', id: 'LIST' },
        { type: 'SatinAlma', id: 'LIST' },
        { type: 'SatinAlmalar', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMalKabulAdminQuery,
  useGetMalKabulAdminQuery,
  useCreateMalKabulAdminMutation,
  useUpdateMalKabulAdminMutation,
  useDeleteMalKabulAdminMutation,
} = malKabulAdminApi;
