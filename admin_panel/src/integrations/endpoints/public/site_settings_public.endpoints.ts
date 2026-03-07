// =============================================================
// FILE: src/integrations/endpoints/public/site_settings_public.endpoints.ts
// Public site settings endpoints (read-only)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SiteSettingRow } from '@/integrations/shared';
import { normalizeAdminSiteSettingRow } from '@/integrations/shared';

export type PublicSiteSetting = SiteSettingRow;

const PUBLIC_BASE = '/site_settings';

export const siteSettingsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettings: b.query<PublicSiteSetting[], void>({
      query: () => ({ url: PUBLIC_BASE }),
      transformResponse: (res: unknown): PublicSiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(normalizeAdminSiteSettingRow) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'PUBLIC_LIST' }],
      keepUnusedDataFor: 300, // 5 minutes cache for public
    }),

    getSiteSettingByKey: b.query<PublicSiteSetting | null, string>({
      query: (key) => ({ url: `${PUBLIC_BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): PublicSiteSetting | null =>
        res ? normalizeAdminSiteSettingRow(res as SiteSettingRow) : null,
      providesTags: (_r, _e, key) => [{ type: 'SiteSettings', id: key }],
      keepUnusedDataFor: 300, // 5 minutes cache
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSiteSettingsQuery,
  useLazyListSiteSettingsQuery,
  useGetSiteSettingByKeyQuery,
  useLazyGetSiteSettingByKeyQuery,
} = siteSettingsPublicApi;
