import { baseApi } from '@/integrations/baseApi';
import type { LoginSettingsDto, LoginRole } from '@/integrations/shared/erp/giris_ayarlari.types';
import { normalizeLoginSettings } from '@/integrations/shared/erp/giris_ayarlari.types';

const BASE = '/admin/giris-ayarlari';

export const girisAyarlariAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getGirisAyarlariAdmin: b.query<LoginSettingsDto, void>({
      query: () => ({ url: BASE }),
      transformResponse: (res: unknown) => normalizeLoginSettings(res),
      providesTags: [{ type: 'Settings' as const, id: 'LOGIN_SETTINGS' }],
    }),
    updateGirisAyarlariAdmin: b.mutation<LoginSettingsDto, {
      showQuickLogin: boolean;
      allowPasswordLogin: boolean;
      roleCardsEnabled: boolean;
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireNumber: boolean;
        requireSpecialChar: boolean;
      };
      redirects: Record<LoginRole, string>;
      enabledRoles: LoginRole[];
    }>({
      query: (body) => ({ url: BASE, method: 'PUT', body }),
      transformResponse: (res: unknown) => normalizeLoginSettings(res),
      invalidatesTags: [{ type: 'Settings' as const, id: 'LOGIN_SETTINGS' }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetGirisAyarlariAdminQuery, useUpdateGirisAyarlariAdminMutation } = girisAyarlariAdminApi;
