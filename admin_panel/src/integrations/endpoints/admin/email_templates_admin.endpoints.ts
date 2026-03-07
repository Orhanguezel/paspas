// =============================================================
// FILE: src/integrations/endpoints/admin/email_templates_admin.endpoints.ts
// FINAL — Admin EmailTemplates RTK (single-language)
// Backend:
// - GET    /admin/email_templates
// - GET    /admin/email_templates/:id
// - POST   /admin/email_templates
// - PATCH  /admin/email_templates/:id
// - DELETE /admin/email_templates/:id  (204)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  EmailTemplateAdminListQueryParams,
  EmailTemplateAdminListItemDto,
  EmailTemplateAdminDetailDto,
  EmailTemplateAdminCreatePayload,
  EmailTemplateAdminUpdatePayload,
} from '@/integrations/shared';
import {
  normalizeEmailTemplateAdminDetail,
  normalizeEmailTemplateAdminList,
  toEmailTemplatesQuery,
  toEmailTemplateWriteBody,
} from '@/integrations/shared';

const BASE = '/admin/email_templates';

export const emailTemplatesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listEmailTemplatesAdmin: b.query<
      EmailTemplateAdminListItemDto[],
      EmailTemplateAdminListQueryParams | void
    >({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ? toEmailTemplatesQuery(params) : undefined,
      }),
      transformResponse: (res: unknown): EmailTemplateAdminListItemDto[] =>
        normalizeEmailTemplateAdminList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((t) => ({ type: 'EmailTemplate' as const, id: t.id })),
              { type: 'EmailTemplates' as const, id: 'LIST_ADMIN' },
            ]
          : [{ type: 'EmailTemplates' as const, id: 'LIST_ADMIN' }],
    }),

    getEmailTemplateAdmin: b.query<EmailTemplateAdminDetailDto, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): EmailTemplateAdminDetailDto =>
        normalizeEmailTemplateAdminDetail(res),
      providesTags: (_r, _e, arg) => [{ type: 'EmailTemplate' as const, id: arg.id }],
    }),

    createEmailTemplateAdmin: b.mutation<EmailTemplateAdminListItemDto, EmailTemplateAdminCreatePayload>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toEmailTemplateWriteBody(body),
      }),
      // backend returns mapTemplateRowPublic(created) (public-like)
      transformResponse: (res: unknown): EmailTemplateAdminListItemDto =>
        // created endpoint does NOT include detected_variables/variables_raw
        // normalize will provide safe defaults
        normalizeEmailTemplateAdminList([res])[0] as EmailTemplateAdminListItemDto,
      invalidatesTags: [{ type: 'EmailTemplates' as const, id: 'LIST_ADMIN' }],
    }),

    updateEmailTemplateAdmin: b.mutation<
      EmailTemplateAdminListItemDto,
      { id: string; body: EmailTemplateAdminUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toEmailTemplateWriteBody(body),
      }),
      transformResponse: (res: unknown): EmailTemplateAdminListItemDto =>
        normalizeEmailTemplateAdminList([res])[0] as EmailTemplateAdminListItemDto,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'EmailTemplate' as const, id: arg.id },
        { type: 'EmailTemplates' as const, id: 'LIST_ADMIN' },
        // also public list might reflect new subject/name if you show on public side
        { type: 'EmailTemplates' as const, id: 'LIST_PUBLIC' },
      ],
    }),

    deleteEmailTemplateAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      // backend 204
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'EmailTemplate' as const, id: arg.id },
        { type: 'EmailTemplates' as const, id: 'LIST_ADMIN' },
        { type: 'EmailTemplates' as const, id: 'LIST_PUBLIC' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListEmailTemplatesAdminQuery,
  useGetEmailTemplateAdminQuery,
  useCreateEmailTemplateAdminMutation,
  useUpdateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
} = emailTemplatesAdminApi;
