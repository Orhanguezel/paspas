import { baseApi } from '@/integrations/baseApi';
import type { ThemeConfigView, ThemeUpdateInput } from '@/integrations/shared';
import { normalizeThemeConfig } from '@/integrations/shared';

const BASE = '/admin/theme';

export const themeAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getThemeAdmin: b.query<ThemeConfigView, void>({
      query: () => ({ url: BASE, method: 'GET' }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      providesTags: [{ type: 'Settings' as const, id: 'THEME' }],
      keepUnusedDataFor: 30,
    }),

    updateThemeAdmin: b.mutation<ThemeConfigView, ThemeUpdateInput>({
      query: (body) => ({ url: BASE, method: 'PUT', body }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      invalidatesTags: [{ type: 'Settings' as const, id: 'THEME' }],
    }),

    resetThemeAdmin: b.mutation<ThemeConfigView, void>({
      query: () => ({ url: `${BASE}/reset`, method: 'POST' }),
      transformResponse: (res: unknown): ThemeConfigView => normalizeThemeConfig(res),
      invalidatesTags: [{ type: 'Settings' as const, id: 'THEME' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetThemeAdminQuery, useUpdateThemeAdminMutation, useResetThemeAdminMutation } = themeAdminApi;
