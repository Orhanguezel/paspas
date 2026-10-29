import { baseApi } from '@/integrations/baseApi';
import type { PersonalMenu } from '@/navigation/sidebar/personal-menu';

export const menuPreferenceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenuPreference: builder.query<{ value: PersonalMenu | null }, string>({
      query: () => ({ url: '/admin/menu-preference', method: 'GET' }),
    }),
    putMenuPreference: builder.mutation<{ value: PersonalMenu }, PersonalMenu>({
      query: (value) => ({ url: '/admin/menu-preference', method: 'PUT', body: { value } }),
    }),
  }),
  overrideExisting: true,
});

export const { useGetMenuPreferenceQuery, usePutMenuPreferenceMutation } = menuPreferenceApi;
