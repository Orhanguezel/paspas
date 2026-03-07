// =============================================================
// FILE: src/integrations/endpoints/admin/services_admin.endpoints.ts
// FINAL — Admin Services RTK Endpoints (FE Services page protocol)
// - listServicesAdmin returns { items, total } (x-total-count header)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ApiServiceAdmin,
  ApiServiceImage,
  ServiceDto,
  ServiceImageDto,
  ServiceListAdminQueryParams,
  ServiceListResult,
  ServiceCreatePayload,
  ServiceUpdatePayload,
  ServiceImageCreatePayload,
  ServiceImageUpdatePayload,
} from '@/integrations/shared';

import { normalizeService, normalizeServiceImage } from '@/integrations/shared';

export const servicesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------------------------------------------------------
    // GET /admin/services (x-total-count header)
    // ---------------------------------------------------------
    listServicesAdmin: build.query<ServiceListResult, ServiceListAdminQueryParams | void>({
      query: (params) => ({
        url: '/admin/services',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceAdmin[], meta) => {
        const items = Array.isArray(response) ? response.map(normalizeService) : [];

        const totalHeader = meta?.response?.headers.get('x-total-count');
        const totalFromHeader = totalHeader ? Number(totalHeader) : Number.NaN;
        const total = Number.isFinite(totalFromHeader) ? totalFromHeader : items.length;

        return { items, total };
      },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Service' as const, id })),
              { type: 'Service' as const, id: 'LIST' },
            ]
          : [{ type: 'Service' as const, id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // GET /admin/services/:id
    // ---------------------------------------------------------
    getServiceAdmin: build.query<
      ServiceDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'GET',
        credentials: 'include',
        params: { ...(locale ? { locale } : {}), ...(default_locale ? { default_locale } : {}) },
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
      providesTags: (result, error, { id }) => [{ type: 'Service', id }],
    }),

    // ---------------------------------------------------------
    // GET /admin/services/by-slug/:slug
    // ---------------------------------------------------------
    getServiceBySlugAdmin: build.query<
      ServiceDto,
      { slug: string; locale?: string; default_locale?: string }
    >({
      query: ({ slug, locale, default_locale }) => ({
        url: `/admin/services/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        credentials: 'include',
        params: { ...(locale ? { locale } : {}), ...(default_locale ? { default_locale } : {}) },
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
      providesTags: (result) => (result ? [{ type: 'Service', id: result.id }] : []),
    }),

    // ---------------------------------------------------------
    // POST /admin/services
    // ---------------------------------------------------------
    createServiceAdmin: build.mutation<ServiceDto, ServiceCreatePayload>({
      query: (body) => ({
        url: '/admin/services',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // PATCH /admin/services/:id
    // ---------------------------------------------------------
    updateServiceAdmin: build.mutation<ServiceDto, { id: string; patch: ServiceUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (resp: ApiServiceAdmin) => normalizeService(resp),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Service', id },
        { type: 'Service', id: 'LIST' },
      ],
    }),

    // ---------------------------------------------------------
    // DELETE /admin/services/:id
    // ---------------------------------------------------------
    deleteServiceAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/services/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Service', id },
        { type: 'Service', id: 'LIST' },
      ],
    }),

    // ---------------------------------------------------------
    // REORDER: POST /admin/services/reorder
    // ---------------------------------------------------------
    reorderServicesAdmin: build.mutation<void, { items: { id: string; display_order: number }[] }>({
      query: (body) => ({
        url: '/admin/services/reorder',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // GALLERY – LIST
    // ---------------------------------------------------------
    listServiceImagesAdmin: build.query<ServiceImageDto[], string>({
      query: (serviceId) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images`,
        method: 'GET',
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
      providesTags: (result, error, serviceId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ServiceImage' as const, id })),
              { type: 'ServiceImage' as const, id: `SERVICE_${serviceId}` },
            ]
          : [{ type: 'ServiceImage' as const, id: `SERVICE_${serviceId}` }],
    }),

    // ---------------------------------------------------------
    // GALLERY – CREATE (returns list)
    // ---------------------------------------------------------
    createServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; payload: ServiceImageCreatePayload }
    >({
      query: ({ serviceId, payload }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images`,
        method: 'POST',
        body: payload,
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
      invalidatesTags: (result, error, { serviceId }) => [
        { type: 'ServiceImage', id: `SERVICE_${serviceId}` },
        { type: 'Service', id: serviceId },
      ],
    }),

    // ---------------------------------------------------------
    // GALLERY – UPDATE (returns list)
    // ---------------------------------------------------------
    updateServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; imageId: string; patch: ServiceImageUpdatePayload }
    >({
      query: ({ serviceId, imageId, patch }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images/${encodeURIComponent(imageId)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
      invalidatesTags: (result, error, { serviceId, imageId }) => [
        { type: 'ServiceImage', id: imageId },
        { type: 'ServiceImage', id: `SERVICE_${serviceId}` },
        { type: 'Service', id: serviceId },
      ],
    }),

    // ---------------------------------------------------------
    // GALLERY – DELETE (returns list)
    // ---------------------------------------------------------
    deleteServiceImageAdmin: build.mutation<
      ServiceImageDto[],
      { serviceId: string; imageId: string }
    >({
      query: ({ serviceId, imageId }) => ({
        url: `/admin/services/${encodeURIComponent(serviceId)}/images/${encodeURIComponent(imageId)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
      invalidatesTags: (result, error, { serviceId, imageId }) => [
        { type: 'ServiceImage', id: imageId },
        { type: 'ServiceImage', id: `SERVICE_${serviceId}` },
        { type: 'Service', id: serviceId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServicesAdminQuery,
  useLazyListServicesAdminQuery,
  useGetServiceAdminQuery,
  useGetServiceBySlugAdminQuery,
  useCreateServiceAdminMutation,
  useUpdateServiceAdminMutation,
  useDeleteServiceAdminMutation,
  useReorderServicesAdminMutation,
  useListServiceImagesAdminQuery,
  useCreateServiceImageAdminMutation,
  useUpdateServiceImageAdminMutation,
  useDeleteServiceImageAdminMutation,
} = servicesAdminApi;
