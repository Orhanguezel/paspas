import { baseApi } from '@/integrations/baseApi';
import type {
  BannerAdminView,
  BannerCreatePayload,
  BannerListParams,
  BannerPatchPayload,
} from '@/integrations/shared/banner_admin.types';

const BASE = '/admin/banners';

export const bannersAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBannersAdmin: build.query<BannerAdminView[], BannerListParams | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: BannerAdminView[]) => (Array.isArray(response) ? response : []),
      providesTags: (result) =>
        result?.length
          ? [...result.map((x) => ({ type: 'Banner' as const, id: x.id })), { type: 'Banner' as const, id: 'LIST' }]
          : [{ type: 'Banner' as const, id: 'LIST' }],
    }),

    getBannerAdmin: build.query<BannerAdminView, { id: number | string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (_r, _e, arg) => [{ type: 'Banner' as const, id: Number(arg.id) || String(arg.id) }],
    }),

    createBannerAdmin: build.mutation<BannerAdminView, BannerCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body, credentials: 'include' }),
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),

    updateBannerAdmin: build.mutation<BannerAdminView, { id: number | string; patch: BannerPatchPayload }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Banner', id: Number(id) || String(id) },
        { type: 'Banner', id: 'LIST' },
      ],
    }),

    deleteBannerAdmin: build.mutation<{ ok: true }, { id: number | string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Banner', id: Number(id) || String(id) },
        { type: 'Banner', id: 'LIST' },
      ],
    }),

    setBannerStatusAdmin: build.mutation<BannerAdminView, { id: number | string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}/status`,
        method: 'POST',
        body: { is_active },
        credentials: 'include',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Banner', id: Number(id) || String(id) },
        { type: 'Banner', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBannersAdminQuery,
  useGetBannerAdminQuery,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
  useSetBannerStatusAdminMutation,
} = bannersAdminApi;

