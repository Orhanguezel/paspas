// =============================================================
// FILE: src/integrations/endpoints/admin/footer_sections_admin.endpoints.ts
// Ensotek – Admin Footer Sections RTK endpoints (FIXED)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ApiFooterSection,
  FooterSectionDto,
  FooterSectionListQueryParams,
  FooterSectionListResult,
  FooterSectionCreatePayload,
  FooterSectionUpdatePayload,
  GetFooterSectionAdminArg,
} from '@/integrations/shared';

import { normalizeFooterSection, stableKey } from '@/integrations/shared';

export const footerSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFooterSectionsAdmin: build.query<
      FooterSectionListResult,
      FooterSectionListQueryParams | void
    >({
      query: (params?: FooterSectionListQueryParams) => ({
        url: '/admin/footer_sections',
        method: 'GET',
        params,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${stableKey(queryArgs as any)}`,
      forceRefetch: ({ currentArg, previousArg }) =>
        stableKey(currentArg as any) !== stableKey(previousArg as any),
      transformResponse: (response: ApiFooterSection[], meta): FooterSectionListResult => {
        const items = (response || []).map(normalizeFooterSection);
        const header = meta?.response?.headers.get('x-total-count');
        const total = header != null ? Number(header) || items.length : items.length;
        return { items, total };
      },
      providesTags: (result, _err, arg) => {
        const loc = (arg as any)?.locale ?? '';
        return result?.items?.length
          ? [
              ...result.items.map((x) => ({ type: 'FooterSections' as const, id: x.id })),
              { type: 'FooterSections' as const, id: `LIST:${loc}` },
            ]
          : [{ type: 'FooterSections' as const, id: `LIST:${loc}` }];
      },
    }),

    /**
     * ✅ FIXED: GET /admin/footer_sections/:id (locale aware)
     * supports: /admin/footer_sections/:id?locale=tr
     */
    getFooterSectionAdmin: build.query<FooterSectionDto, GetFooterSectionAdminArg>({
      query: ({ id, locale }) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'GET',
        params: locale ? { locale } : undefined,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      providesTags: (_r, _e, arg) => [{ type: 'FooterSections', id: String(arg.id) }],
    }),

    getFooterSectionBySlugAdmin: build.query<FooterSectionDto, string>({
      query: (slug) => ({
        url: `/admin/footer_sections/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      providesTags: (_r, _e, slug) => [{ type: 'FooterSectionsBySlug', id: slug }],
    }),

    createFooterSectionAdmin: build.mutation<FooterSectionDto, FooterSectionCreatePayload>({
      query: (body) => ({
        url: '/admin/footer_sections',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'FooterSections', id: `LIST:${(arg as any)?.locale ?? ''}` },
        { type: 'FooterSections', id: 'LIST:' },
      ],
    }),

    updateFooterSectionAdmin: build.mutation<
      FooterSectionDto,
      { id: string; data: FooterSectionUpdatePayload }
    >({
      query: ({ id, data }) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
      invalidatesTags: (_r, _e, arg) => {
        const loc = (arg as any)?.data?.locale ?? '';
        return [
          { type: 'FooterSections', id: arg.id },
          { type: 'FooterSections', id: `LIST:${loc}` },
          { type: 'FooterSections', id: 'LIST:' },
        ];
      },
    }),

    deleteFooterSectionAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/footer_sections/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'FooterSections', id },
        { type: 'FooterSections', id: 'LIST:' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFooterSectionsAdminQuery,

  // ✅ now object arg
  useGetFooterSectionAdminQuery,
  useLazyGetFooterSectionAdminQuery,

  useGetFooterSectionBySlugAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
} = footerSectionsAdminApi;
