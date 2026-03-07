// ===================================================================
// FILE: src/integrations/endpoints/admin/chat_admin.endpoints.ts
// Chat Admin RTK Query endpoints (Ensotek)
// ===================================================================

import type { FetchArgs } from '@reduxjs/toolkit/query';
import { baseApi } from '@/integrations/baseApi';
import type {
  ChatThreadsResponse,
  ChatMessagesResponse,
  ChatThreadResponse,
  ChatListThreadsParams,
  ChatListMessagesParams,
  ChatPostMessageBody,
  ChatMessageResponse,
  ChatAdminTakeoverBody,
  ChatAdminReleaseToAiBody,
  ChatAdminSetAiProviderBody,
  ChatAiKnowledgeListParams,
  ChatAiKnowledgeListResponse,
  ChatAiKnowledgeItem,
  ChatAiKnowledgeCreateBody,
  ChatAiKnowledgeUpdateBody,
} from '@/integrations/shared/chat';

const THREADS = '/admin/chat/threads';
const KNOWLEDGE = '/admin/chat/knowledge';

export const chatAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ─── Thread endpoints ─────────────────────────────────────

    /** GET /admin/chat/threads */
    listChatThreadsAdmin: build.query<ChatThreadsResponse, ChatListThreadsParams | void>({
      query: (params?: ChatListThreadsParams): FetchArgs => ({
        url: THREADS,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((t) => ({ type: 'ChatThreads' as const, id: t.id })),
              { type: 'ChatThreads' as const, id: 'LIST' },
            ]
          : [{ type: 'ChatThreads' as const, id: 'LIST' }],
    }),

    /** GET /admin/chat/threads/:id/messages */
    listChatMessagesAdmin: build.query<
      ChatMessagesResponse,
      { threadId: string; params?: ChatListMessagesParams }
    >({
      query: ({ threadId, params }): FetchArgs => ({
        url: `${THREADS}/${threadId}/messages`,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'ChatMessages' as const, id: arg.threadId },
      ],
    }),

    /** POST /admin/chat/threads/:id/messages (admin mesaj gönder) */
    postChatMessageAdmin: build.mutation<
      ChatMessageResponse,
      { threadId: string; body: ChatPostMessageBody }
    >({
      query: ({ threadId, body }): FetchArgs => ({
        url: `${THREADS}/${threadId}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatMessages' as const, id: arg.threadId },
        { type: 'ChatThreads' as const, id: 'LIST' },
      ],
    }),

    /** POST /admin/chat/threads/:id/takeover */
    takeOverChatThreadAdmin: build.mutation<
      ChatThreadResponse,
      { threadId: string; body?: ChatAdminTakeoverBody }
    >({
      query: ({ threadId, body }): FetchArgs => ({
        url: `${THREADS}/${threadId}/takeover`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatThreads' as const, id: arg.threadId },
        { type: 'ChatThreads' as const, id: 'LIST' },
      ],
    }),

    /** POST /admin/chat/threads/:id/release-to-ai */
    releaseToAiChatThreadAdmin: build.mutation<
      ChatThreadResponse,
      { threadId: string; body?: ChatAdminReleaseToAiBody }
    >({
      query: ({ threadId, body }): FetchArgs => ({
        url: `${THREADS}/${threadId}/release-to-ai`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatThreads' as const, id: arg.threadId },
        { type: 'ChatThreads' as const, id: 'LIST' },
      ],
    }),

    /** PATCH /admin/chat/threads/:id/ai-provider */
    setAiProviderChatThreadAdmin: build.mutation<
      ChatThreadResponse,
      { threadId: string; body: ChatAdminSetAiProviderBody }
    >({
      query: ({ threadId, body }): FetchArgs => ({
        url: `${THREADS}/${threadId}/ai-provider`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatThreads' as const, id: arg.threadId },
        { type: 'ChatThreads' as const, id: 'LIST' },
      ],
    }),

    // ─── AI Knowledge Base endpoints ──────────────────────────

    /** GET /admin/chat/knowledge */
    listChatKnowledgeAdmin: build.query<ChatAiKnowledgeListResponse, ChatAiKnowledgeListParams | void>({
      query: (params?: ChatAiKnowledgeListParams): FetchArgs => ({
        url: KNOWLEDGE,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((k) => ({ type: 'ChatKnowledge' as const, id: k.id })),
              { type: 'ChatKnowledge' as const, id: 'LIST' },
            ]
          : [{ type: 'ChatKnowledge' as const, id: 'LIST' }],
    }),

    /** GET /admin/chat/knowledge/:id */
    getChatKnowledgeAdmin: build.query<ChatAiKnowledgeItem, string>({
      query: (id): FetchArgs => ({
        url: `${KNOWLEDGE}/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'ChatKnowledge' as const, id }],
    }),

    /** POST /admin/chat/knowledge */
    createChatKnowledgeAdmin: build.mutation<ChatAiKnowledgeItem, ChatAiKnowledgeCreateBody>({
      query: (body): FetchArgs => ({
        url: KNOWLEDGE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ChatKnowledge' as const, id: 'LIST' }],
    }),

    /** PATCH /admin/chat/knowledge/:id */
    updateChatKnowledgeAdmin: build.mutation<
      ChatAiKnowledgeItem,
      { id: string; body: ChatAiKnowledgeUpdateBody }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${KNOWLEDGE}/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ChatKnowledge' as const, id: arg.id },
        { type: 'ChatKnowledge' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /admin/chat/knowledge/:id */
    deleteChatKnowledgeAdmin: build.mutation<void, string>({
      query: (id): FetchArgs => ({
        url: `${KNOWLEDGE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ChatKnowledge' as const, id },
        { type: 'ChatKnowledge' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

// ─── Hook exports ───────────────────────────────────────────

export const {
  // Threads
  useListChatThreadsAdminQuery,
  useListChatMessagesAdminQuery,
  usePostChatMessageAdminMutation,
  useTakeOverChatThreadAdminMutation,
  useReleaseToAiChatThreadAdminMutation,
  useSetAiProviderChatThreadAdminMutation,
  // Knowledge
  useListChatKnowledgeAdminQuery,
  useGetChatKnowledgeAdminQuery,
  useCreateChatKnowledgeAdminMutation,
  useUpdateChatKnowledgeAdminMutation,
  useDeleteChatKnowledgeAdminMutation,
} = chatAdminApi;
