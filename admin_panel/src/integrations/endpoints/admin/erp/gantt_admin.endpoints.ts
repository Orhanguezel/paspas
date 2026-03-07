// =============================================================
// FILE: src/integrations/endpoints/admin/erp/gantt_admin.endpoints.ts
// Paspas ERP — Gantt RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { GanttListResponse } from '@/integrations/shared/erp/gantt.types';
import { normalizeGanttList } from '@/integrations/shared/erp/gantt.types';

export interface GanttListParams {
  baslangic?: string;
  bitis?: string;
  durum?: string;
  q?: string;
  makineId?: string;
}

const BASE = '/admin/gantt';

export const ganttAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listGanttAdmin: b.query<GanttListResponse, GanttListParams | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeGanttList(res),
      providesTags: [{ type: 'Gantt' as const, id: 'LIST' }],
    }),

    patchGanttTarih: b.mutation<void, { id: string; baslangicTarihi?: string; bitisTarihi?: string }>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Gantt', id: 'LIST' }, { type: 'UretimEmirleri', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListGanttAdminQuery,
  usePatchGanttTarihMutation,
} = ganttAdminApi;
