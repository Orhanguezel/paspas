// =============================================================
// FILE: src/integrations/endpoints/admin/erp/hareketler_admin.endpoints.ts
// Paspas ERP — Hareketler RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { HareketDto, HareketListResponse } from '@/integrations/shared/erp/hareketler.types';
import { normalizeHareketList } from '@/integrations/shared/erp/hareketler.types';

const BASE = '/admin/hareketler';

export const hareketlerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listHareketlerAdmin: b.query<HareketListResponse, {
      urunId?: string;
      q?: string;
      hareketTipi?: string;
      kaynakTipi?: string;
      kategori?: string;
      urunGrubu?: string;
      period?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeHareketList(res),
      providesTags: [{ type: 'Hareketler' as const, id: 'LIST' }],
    }),
    createHareketAdmin: b.mutation<HareketDto, {
      urunId: string;
      hareketTipi: 'giris' | 'cikis' | 'duzeltme';
      referansTipi?: 'manuel' | 'stok_duzeltme' | 'uretim' | 'fire';
      referansId?: string;
      miktar: number;
      aciklama?: string;
    }>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      invalidatesTags: [
        { type: 'Hareketler', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useListHareketlerAdminQuery, useCreateHareketAdminMutation } = hareketlerAdminApi;
