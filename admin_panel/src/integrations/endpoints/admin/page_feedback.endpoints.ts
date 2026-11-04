import { baseApi } from "@/integrations/baseApi";
import type {
  CreatePageFeedbackBody,
  CreatePageFeedbackCommentBody,
  PageFeedbackListResponse,
  PageFeedbackThread,
  UpdatePageFeedbackBody,
} from "@/integrations/shared";

const ADMIN_BASE = "/admin/page-feedback";

export const pageFeedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPageFeedback: builder.query<PageFeedbackThread, string>({
      query: (id) => `${ADMIN_BASE}/${encodeURIComponent(id)}`,
      providesTags: (_res, _err, id) => [{ type: 'PageFeedback', id }],
    }),
    listPageFeedbackActions: builder.query<{ items: Array<{ id: string; party: string; workPhase: string | null; expectedAction: string | null; changedByName: string | null; changedAt: string }> }, string>({
      query: (id) => `${ADMIN_BASE}/${encodeURIComponent(id)}/actions`,
      providesTags: (_res, _err, id) => [{ type: 'PageFeedback', id }],
    }),
    setPageFeedbackAction: builder.mutation<{ ok: boolean }, { id: string; party: string; workPhase: string | null; expectedAction: string | null }>({
      query: ({ id, ...body }) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}/actions`, method: 'POST', body }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PageFeedback', id: 'LIST' }, { type: 'PageFeedback', id: arg.id }],
    }),
    listPageFeedbackReleases: builder.query<{ items: Array<{ id: string; state: string; evidence: string; changedByName: string | null; changedAt: string }> }, string>({
      query: (id) => `${ADMIN_BASE}/${encodeURIComponent(id)}/releases`,
      providesTags: (_res, _err, id) => [{ type: 'PageFeedback', id }],
    }),
    setPageFeedbackRelease: builder.mutation<{ ok: boolean }, { id: string; releaseState: string; evidence: string }>({
      query: ({ id, ...body }) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}/releases`, method: 'POST', body }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PageFeedback', id: 'LIST' }, { type: 'PageFeedback', id: arg.id }],
    }),
    listPageFeedbackWatchers: builder.query<{ items: Array<{ userId: string; name: string }> }, string>({
      query: (id) => `${ADMIN_BASE}/${encodeURIComponent(id)}/watchers`,
      providesTags: (_res, _err, id) => [{ type: 'PageFeedback', id }],
    }),
    listPageFeedbackWatcherCandidates: builder.query<{ items: Array<{ userId: string; name: string }> }, void>({
      query: () => `${ADMIN_BASE}/watcher-candidates`,
    }),
    addPageFeedbackWatcher: builder.mutation<{ ok: boolean }, { id: string; userId: string }>({
      query: ({ id, userId }) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}/watchers`, method: 'POST', body: { userId } }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PageFeedback', id: 'LIST' }, { type: 'PageFeedback', id: arg.id }],
    }),
    removePageFeedbackWatcher: builder.mutation<{ ok: boolean }, { id: string; userId: string }>({
      query: ({ id, userId }) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}/watchers/${encodeURIComponent(userId)}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PageFeedback', id: 'LIST' }, { type: 'PageFeedback', id: arg.id }],
    }),
    listPageFeedback: builder.query<
      PageFeedbackListResponse,
      { pagePath?: string; status?: string; sourceApp?: string; activeOnly?: boolean; limit?: number; offset?: number } | undefined
    >({
      query: (params) => ({
        url: ADMIN_BASE,
        method: "GET",
        params: params ?? { limit: 25 },
      }),
      providesTags: (res) =>
        res?.items?.length
          ? [
              { type: "PageFeedback" as const, id: "LIST" },
              ...res.items.map((item) => ({ type: "PageFeedback" as const, id: item.id })),
            ]
          : [{ type: "PageFeedback" as const, id: "LIST" }],
    }),
    createPageFeedback: builder.mutation<PageFeedbackThread, CreatePageFeedbackBody>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PageFeedback", id: "LIST" }],
    }),
    addPageFeedbackComment: builder.mutation<PageFeedbackThread, { id: string; body: CreatePageFeedbackCommentBody }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "PageFeedback", id: "LIST" },
        { type: "PageFeedback", id: arg.id },
      ],
    }),
    updatePageFeedback: builder.mutation<PageFeedbackThread, { id: string; body: UpdatePageFeedbackBody }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "PageFeedback", id: "LIST" },
        { type: "PageFeedback", id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPageFeedbackQuery,
  useListPageFeedbackActionsQuery,
  useSetPageFeedbackActionMutation,
  useListPageFeedbackReleasesQuery,
  useSetPageFeedbackReleaseMutation,
  useListPageFeedbackWatchersQuery,
  useListPageFeedbackWatcherCandidatesQuery,
  useAddPageFeedbackWatcherMutation,
  useRemovePageFeedbackWatcherMutation,
  useListPageFeedbackQuery,
  useCreatePageFeedbackMutation,
  useAddPageFeedbackCommentMutation,
  useUpdatePageFeedbackMutation,
} = pageFeedbackApi;
