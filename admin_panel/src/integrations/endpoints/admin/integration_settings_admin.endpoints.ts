import { baseApi } from '@/integrations/baseApi';

type IntegrationSettingsItem = {
  provider: string;
  enabled: boolean;
  settings: Record<string, unknown>;
};

type ListIntegrationSettingsArg = {
  provider?: string;
  include_secrets?: boolean;
};

type UpsertIntegrationSettingsArg = {
  provider: string;
  enabled?: boolean;
  settings?: Record<string, unknown>;
};

const BASE = '/admin/integration-settings';

export const integrationSettingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listIntegrationSettingsAdmin: b.query<IntegrationSettingsItem[], ListIntegrationSettingsArg | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown): IntegrationSettingsItem[] =>
        Array.isArray(res) ? (res as IntegrationSettingsItem[]) : [],
      providesTags: [{ type: 'Settings' as const, id: 'INTEGRATIONS_LIST' }],
      keepUnusedDataFor: 30,
    }),

    getIntegrationSettingsAdminByProvider: b.query<IntegrationSettingsItem | null, string>({
      query: (provider) => ({
        url: `${BASE}/${encodeURIComponent(provider)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): IntegrationSettingsItem | null =>
        (res as IntegrationSettingsItem) ?? null,
      providesTags: (_result, _error, provider) => [
        { type: 'Settings' as const, id: `INTEGRATION_${provider}` },
      ],
      keepUnusedDataFor: 30,
    }),

    upsertIntegrationSettingsAdmin: b.mutation<IntegrationSettingsItem, UpsertIntegrationSettingsArg>({
      query: ({ provider, ...body }) => ({
        url: `${BASE}/${encodeURIComponent(provider)}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: unknown): IntegrationSettingsItem => res as IntegrationSettingsItem,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Settings' as const, id: 'INTEGRATIONS_LIST' },
        { type: 'Settings' as const, id: `INTEGRATION_${arg.provider}` },
      ],
    }),

    deleteIntegrationSettingsAdmin: b.mutation<{ ok: true }, string>({
      query: (provider) => ({
        url: `${BASE}/${encodeURIComponent(provider)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_result, _error, provider) => [
        { type: 'Settings' as const, id: 'INTEGRATIONS_LIST' },
        { type: 'Settings' as const, id: `INTEGRATION_${provider}` },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListIntegrationSettingsAdminQuery,
  useGetIntegrationSettingsAdminByProviderQuery,
  useUpsertIntegrationSettingsAdminMutation,
  useDeleteIntegrationSettingsAdminMutation,
} = integrationSettingsAdminApi;

