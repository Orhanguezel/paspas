// ===================================================================
// FILE: src/integrations/rtk/endpoints/public/email_templates_public.endpoints.ts
// Email Templates – PUBLIC RTK endpoints (/email_templates…)
// ===================================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  EmailTemplatePublicDto,
  EmailTemplatePublicListQueryParams,
  RenderedEmailTemplateDto,
  RenderEmailTemplateByKeyPayload,
  WithLocale,
} from '@/integrations/shared';
import { cleanParams, makeLocaleHeaders } from '@/integrations/shared';

export const emailTemplatesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /email_templates
     * Query: { q?, locale?, is_active? }
     * Backend: listEmailTemplatesPublic
     */
    listEmailTemplatesPublic: build.query<
      EmailTemplatePublicDto[],
      WithLocale<EmailTemplatePublicListQueryParams> | void
    >({
      query: (params) => {
        const p = (params || {}) as WithLocale<EmailTemplatePublicListQueryParams>;
        const { locale, ...rest } = p;

        return {
          url: '/email_templates',
          method: 'GET',
          params: cleanParams({ ...rest, locale }),
          headers: makeLocaleHeaders(locale),
        };
      },
    }),

    /**
     * GET /email_templates/by-key/:key
     * Query: { locale? }
     * Backend: getEmailTemplateByKeyPublic
     */
    getEmailTemplateByKeyPublic: build.query<
      EmailTemplatePublicDto,
      { key: string; locale?: string | null }
    >({
      query: ({ key, locale }) => ({
        url: `/email_templates/by-key/${encodeURIComponent(key)}`,
        method: 'GET',
        params: cleanParams({ locale }),
        headers: makeLocaleHeaders(locale),
      }),
    }),

    /**
     * POST /email_templates/by-key/:key/render
     * Body: { params?: Record<string, unknown> }
     * Query: { locale? }
     * Backend: renderTemplateByKeyPublic
     */
    renderEmailTemplateByKeyPublic: build.mutation<
      RenderedEmailTemplateDto,
      RenderEmailTemplateByKeyPayload
    >({
      query: ({ key, locale, params }) => ({
        url: `/email_templates/by-key/${encodeURIComponent(key)}/render`,
        method: 'POST',
        params: cleanParams({ locale }),
        headers: makeLocaleHeaders(locale),
        body: {
          params: params ?? {},
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEmailTemplatesPublicQuery,
  useLazyListEmailTemplatesPublicQuery,
  useGetEmailTemplateByKeyPublicQuery,
  useLazyGetEmailTemplateByKeyPublicQuery,
  useRenderEmailTemplateByKeyPublicMutation,
} = emailTemplatesPublicApi;
