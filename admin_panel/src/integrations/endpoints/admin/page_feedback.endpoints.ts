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
    listPageFeedback: builder.query<
      PageFeedbackListResponse,
      { pagePath?: string; status?: string; limit?: number; offset?: number } | undefined
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
  useListPageFeedbackQuery,
  useCreatePageFeedbackMutation,
  useAddPageFeedbackCommentMutation,
  useUpdatePageFeedbackMutation,
} = pageFeedbackApi;
