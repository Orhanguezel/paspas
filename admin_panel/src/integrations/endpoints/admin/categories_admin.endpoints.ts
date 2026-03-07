// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/categories_admin.endpoints.ts
// Ensotek – Admin Kategori RTK Endpoints
// Base URL: /api/admin (baseApi üzerinden)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  CategoryDto,
  CategoryListQueryParams,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  CategoryReorderPayload,
  CategorySetImagePayload,
} from '@/integrations/shared';

/**
 * Query paramlarından undefined / boş stringleri temizlemek için
 */
const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
      continue;
    }

    if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') {
      out[k] = v;
    } else {
      out[k] = String(v);
    }
  }

  return Object.keys(out).length ? out : undefined;
};

export const categoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* --------------------------------------------------------- */
    /* LIST – GET /api/admin/categories/list                     */
    /* --------------------------------------------------------- */
    listCategoriesAdmin: build.query<CategoryDto[], CategoryListQueryParams | void>({
      query: (params) => ({
        url: '/admin/categories/list',
        method: 'GET',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
    }),

    /* --------------------------------------------------------- */
    /* GET by id – /api/admin/categories/:id?locale=xx           */
    /* --------------------------------------------------------- */
    getCategoryAdmin: build.query<CategoryDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams(locale ? { locale } : undefined),
      }),
    }),

    /* --------------------------------------------------------- */
    /* CREATE – POST /api/admin/categories                       */
    /* --------------------------------------------------------- */
    createCategoryAdmin: build.mutation<CategoryDto, CategoryCreatePayload>({
      query: (body) => ({
        url: '/admin/categories',
        method: 'POST',
        body,
      }),
    }),

    /* --------------------------------------------------------- */
    /* PATCH – /api/admin/categories/:id                         */
    /* --------------------------------------------------------- */
    updateCategoryAdmin: build.mutation<CategoryDto, { id: string; patch: CategoryUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
    }),

    /* --------------------------------------------------------- */
    /* DELETE – /api/admin/categories/:id                        */
    /* --------------------------------------------------------- */
    deleteCategoryAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/categories/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),

    /* --------------------------------------------------------- */
    /* REORDER – /api/admin/categories/reorder                   */
    /* --------------------------------------------------------- */
    reorderCategoriesAdmin: build.mutation<{ ok: boolean }, CategoryReorderPayload>({
      query: (payload) => ({
        url: '/admin/categories/reorder',
        method: 'POST',
        body: payload,
      }),
    }),

    /* --------------------------------------------------------- */
    /* TOGGLE ACTIVE – PATCH /api/admin/categories/:id/active    */
    /* --------------------------------------------------------- */
    toggleCategoryActiveAdmin: build.mutation<CategoryDto, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}/active`,
        method: 'PATCH',
        body: { is_active },
      }),
    }),

    /* --------------------------------------------------------- */
    /* TOGGLE FEATURED – PATCH /api/admin/categories/:id/featured*/
    /* --------------------------------------------------------- */
    toggleCategoryFeaturedAdmin: build.mutation<CategoryDto, { id: string; is_featured: boolean }>({
      query: ({ id, is_featured }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}/featured`,
        method: 'PATCH',
        body: { is_featured },
      }),
    }),

    /* --------------------------------------------------------- */
    /* TOGGLE UNLIMITED – PATCH /api/admin/categories/:id        */
    /* (genel PATCH üzerinden — ayrı bir backend endpoint yok)   */
    /* --------------------------------------------------------- */
    toggleCategoryUnlimitedAdmin: build.mutation<CategoryDto, { id: string; is_unlimited: boolean }>({
      query: ({ id, is_unlimited }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: { is_unlimited },
      }),
    }),

    /* --------------------------------------------------------- */
    /* SET IMAGE – PATCH /api/admin/categories/:id/image         */
    /* --------------------------------------------------------- */
    setCategoryImageAdmin: build.mutation<CategoryDto, CategorySetImagePayload>({
      query: ({ id, asset_id, alt }) => ({
        url: `/admin/categories/${encodeURIComponent(id)}/image`,
        method: 'PATCH',
        body: {
          asset_id: asset_id ?? null,
          alt: alt ?? null,
        },
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useListCategoriesAdminQuery,
  useLazyListCategoriesAdminQuery,
  useGetCategoryAdminQuery,
  useLazyGetCategoryAdminQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
  useReorderCategoriesAdminMutation,
  useToggleCategoryActiveAdminMutation,
  useToggleCategoryFeaturedAdminMutation,
  useToggleCategoryUnlimitedAdminMutation,
  useSetCategoryImageAdminMutation,
} = categoriesAdminApi;
