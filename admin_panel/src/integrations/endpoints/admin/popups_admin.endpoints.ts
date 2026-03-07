// ===================================================================
// FILE: src/integrations/endpoints/popups.admin.endpoints.ts
// FINAL — Popups (ADMIN) RTK
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  PopupAdminView,
  PopupAdminCreateBody,
  PopupAdminUpdateBody,
  ApiOk,
} from '@/integrations/shared';
import {
  normalizePopupAdmin,
  normalizePopupAdminList,
  toPopupAdminCreateBody,
  toPopupAdminUpdateBody,
} from '@/integrations/shared';

const BASE = '/admin/popups';

function toPopupListParams(orderRaw?: string): Record<string, string> | undefined {
  if (!orderRaw) return undefined;
  const raw = String(orderRaw).trim();
  if (!raw) return undefined;

  // Supports legacy format: "created_at.desc"
  const [sortMaybe, dirMaybe] = raw.split('.');
  const sort = (sortMaybe || '').trim();
  const dir = (dirMaybe || '').trim().toLowerCase();
  if (sort && (dir === 'asc' || dir === 'desc')) {
    return { sort, order: dir };
  }

  // Fallback for old callers that might only send "asc|desc"
  if (raw === 'asc' || raw === 'desc') {
    return { order: raw };
  }

  return undefined;
}

export const popupsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/popups */
    listPopupsAdmin: b.query<PopupAdminView[], { order?: string } | void>({
      query: (q) => ({
        url: BASE,
        method: 'GET',
        params: toPopupListParams(q?.order),
      }),
      transformResponse: (res: unknown) => normalizePopupAdminList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'Popup' as const, id: x.id })),
              { type: 'Popups' as const, id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Popups' as const, id: 'ADMIN_LIST' }],
      keepUnusedDataFor: 20,
    }),

    /** GET /admin/popups/:id */
    getPopupAdmin: b.query<PopupAdminView, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      providesTags: (_r, _e, arg) => [{ type: 'Popup' as const, id: arg.id }],
      keepUnusedDataFor: 30,
    }),

    /** POST /admin/popups */
    createPopupAdmin: b.mutation<PopupAdminView, PopupAdminCreateBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toPopupAdminCreateBody(body),
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      invalidatesTags: [{ type: 'Popups' as const, id: 'ADMIN_LIST' }],
    }),

    /** PATCH /admin/popups/:id */
    updatePopupAdmin: b.mutation<PopupAdminView, { id: string; body: PopupAdminUpdateBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toPopupAdminUpdateBody(body),
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popup' as const, id: arg.id },
        { type: 'Popups' as const, id: 'ADMIN_LIST' },
      ],
    }),

    /** DELETE /admin/popups/:id */
    deletePopupAdmin: b.mutation<ApiOk, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popup' as const, id: arg.id },
        { type: 'Popups' as const, id: 'ADMIN_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPopupsAdminQuery,
  useLazyListPopupsAdminQuery,
  useGetPopupAdminQuery,
  useLazyGetPopupAdminQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} = popupsAdminApi;
