// =============================================================
// FILE: src/integrations/endpoints/admin/announcements_admin.endpoints.ts
// Admin duyurular endpoint'leri
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AnnouncementDto,
  AnnouncementListQueryParams,
  AnnouncementCreatePayload,
  AnnouncementUpdatePayload,
  AnnouncementPublishPayload,
} from '@/integrations/shared';
import { cleanParams } from '@/integrations/shared';

export const announcementsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* --------------------------------------------------------- */
    /* LIST – GET /admin/announcements                           */
    /* --------------------------------------------------------- */
    listAnnouncementsAdmin: builder.query<AnnouncementDto[], AnnouncementListQueryParams | void>({
      query: (params) => ({
        url: '/admin/announcements',
        method: 'GET',
        params: cleanParams((params ?? {}) as Record<string, unknown>),
      }),
      providesTags: ['Announcements'],
    }),

    /* --------------------------------------------------------- */
    /* GET BY ID – GET /admin/announcements/:id                  */
    /* --------------------------------------------------------- */
    getAnnouncementAdmin: builder.query<AnnouncementDto, { id: number | string }>({
      query: ({ id }) => ({
        url: `/admin/announcements/${encodeURIComponent(String(id))}`,
        method: 'GET',
      }),
      providesTags: (_result, _err, { id }) => [{ type: 'Announcement', id: String(id) }],
    }),

    /* --------------------------------------------------------- */
    /* CREATE – POST /admin/announcements                         */
    /* --------------------------------------------------------- */
    createAnnouncementAdmin: builder.mutation<AnnouncementDto, AnnouncementCreatePayload>({
      query: (body) => ({
        url: '/admin/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Announcements'],
    }),

    /* --------------------------------------------------------- */
    /* UPDATE – PATCH /admin/announcements/:id                   */
    /* --------------------------------------------------------- */
    updateAnnouncementAdmin: builder.mutation<
      AnnouncementDto,
      { id: number | string; patch: AnnouncementUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/announcements/${encodeURIComponent(String(id))}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        'Announcements',
        { type: 'Announcement', id: String(id) },
      ],
    }),

    /* --------------------------------------------------------- */
    /* DELETE – DELETE /admin/announcements/:id                  */
    /* --------------------------------------------------------- */
    deleteAnnouncementAdmin: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/admin/announcements/${encodeURIComponent(String(id))}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Announcements'],
    }),

    /* --------------------------------------------------------- */
    /* PUBLISH – PATCH /admin/announcements/:id/publish           */
    /* --------------------------------------------------------- */
    setAnnouncementPublished: builder.mutation<
      AnnouncementDto,
      { id: number | string; body: AnnouncementPublishPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/announcements/${encodeURIComponent(String(id))}/publish`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        'Announcements',
        { type: 'Announcement', id: String(id) },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAnnouncementsAdminQuery,
  useGetAnnouncementAdminQuery,
  useLazyGetAnnouncementAdminQuery,
  useCreateAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
  useSetAnnouncementPublishedMutation,
} = announcementsAdminApi;
