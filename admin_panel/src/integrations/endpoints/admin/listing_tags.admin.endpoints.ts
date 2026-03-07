import { baseApi } from '@/integrations/baseApi';
import type { ListingTagListParams, ListingTagView } from '@/integrations/shared';

export const listingTagsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listListingTagsAdmin: build.query<ListingTagView[], ListingTagListParams | void>({
      query: (params) => ({
        url: '/admin/listing-tags',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: ListingTagView[]) => (Array.isArray(response) ? response : []),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((x) => ({ type: 'ListingTag' as const, id: x.id })),
              { type: 'ListingTag' as const, id: 'LIST' },
            ]
          : [{ type: 'ListingTag' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListListingTagsAdminQuery } = listingTagsAdminApi;

