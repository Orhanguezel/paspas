// =============================================================
// FILE: src/integrations/endpoints/admin/erp/is_yukler_admin.endpoints.ts
// Paspas ERP — İş Yükleri RTK Query endpoints
// =============================================================

import { baseApi } from "@/integrations/baseApi";
import type { IsYukuDto, IsYukuListResponse, IsYukuPatchPayload } from "@/integrations/shared/erp/is_yukler.types";
import { normalizeIsYuku, normalizeIsYukuList } from "@/integrations/shared/erp/is_yukler.types";

const BASE = "/admin/is-yukler";

export const isYukleriAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listIsYukleriAdmin: b.query<IsYukuListResponse, { makineId?: string; durum?: string } | undefined>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeIsYukuList(res),
      providesTags: [{ type: "IsYukleri" as const, id: "LIST" }],
    }),

    getIsYukuAdmin: b.query<IsYukuDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeIsYuku(res),
      providesTags: (_result, _error, id) => [{ type: "IsYukleri" as const, id }],
    }),

    updateIsYukuAdmin: b.mutation<IsYukuDto, { id: string; body: IsYukuPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeIsYuku(res),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "IsYukleri", id: "LIST" },
        { type: "IsYukleri", id },
      ],
    }),

    deleteIsYukuAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "IsYukleri", id: "LIST" },
        { type: "IsYukleri", id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListIsYukleriAdminQuery,
  useGetIsYukuAdminQuery,
  useUpdateIsYukuAdminMutation,
  useDeleteIsYukuAdminMutation,
} = isYukleriAdminApi;
