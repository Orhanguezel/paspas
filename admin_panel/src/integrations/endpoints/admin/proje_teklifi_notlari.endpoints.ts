import { baseApi } from "@/integrations/baseApi";
import type {
  CreateProjeTeklifiNotBody,
  ProjeTeklifiNot,
  ProjeTeklifiNotListQuery,
  ProjeTeklifiNotListResponse,
  ProjeTeklifiNotStats,
  UpdateProjeTeklifiNotBody,
} from "@/integrations/shared";

const ADMIN_BASE = "/admin/proje-teklifi-notlari";

export const projeTeklifiNotlariApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjeTeklifiNotlari: builder.query<
      ProjeTeklifiNotListResponse,
      ProjeTeklifiNotListQuery | undefined
    >({
      query: (params) => ({
        url: ADMIN_BASE,
        method: "GET",
        params: params ?? { limit: 100 },
      }),
      providesTags: (res) =>
        res?.items?.length
          ? [
              { type: "ProjeTeklifiNot" as const, id: "LIST" },
              ...res.items.map((item) => ({ type: "ProjeTeklifiNot" as const, id: item.id })),
            ]
          : [{ type: "ProjeTeklifiNot" as const, id: "LIST" }],
    }),

    getProjeTeklifiNotStats: builder.query<ProjeTeklifiNotStats, void>({
      query: () => ({
        url: `${ADMIN_BASE}/stats`,
        method: "GET",
      }),
      providesTags: [{ type: "ProjeTeklifiNot" as const, id: "STATS" }],
    }),

    getProjeTeklifiNot: builder.query<ProjeTeklifiNot, string>({
      query: (id) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "ProjeTeklifiNot" as const, id }],
    }),

    createProjeTeklifiNot: builder.mutation<ProjeTeklifiNot, CreateProjeTeklifiNotBody>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "ProjeTeklifiNot", id: "LIST" },
        { type: "ProjeTeklifiNot", id: "STATS" },
      ],
    }),

    updateProjeTeklifiNot: builder.mutation<
      ProjeTeklifiNot,
      { id: string; body: UpdateProjeTeklifiNotBody }
    >({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "ProjeTeklifiNot", id: "LIST" },
        { type: "ProjeTeklifiNot", id: "STATS" },
        { type: "ProjeTeklifiNot", id: arg.id },
      ],
    }),

    deleteProjeTeklifiNot: builder.mutation<void, string>({
      query: (id) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "ProjeTeklifiNot", id: "LIST" },
        { type: "ProjeTeklifiNot", id: "STATS" },
        { type: "ProjeTeklifiNot", id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProjeTeklifiNotlariQuery,
  useGetProjeTeklifiNotStatsQuery,
  useGetProjeTeklifiNotQuery,
  useCreateProjeTeklifiNotMutation,
  useUpdateProjeTeklifiNotMutation,
  useDeleteProjeTeklifiNotMutation,
} = projeTeklifiNotlariApi;
