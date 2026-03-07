// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/contacts_admin.endpoints.ts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ContactDto,
  ContactListQueryParams,
  ContactUpdatePayload,
} from '@/integrations/shared';

const BASE = '/admin/contacts';

export const contactsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * LIST (admin) – GET /contacts
     */
    listContactsAdmin: build.query<ContactDto[], ContactListQueryParams | void>({
      query: (params?: ContactListQueryParams) => ({
        url: `${BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({
                type: 'Contacts' as const,
                id: c.id,
              })),
              { type: 'Contacts' as const, id: 'LIST' },
            ]
          : [{ type: 'Contacts' as const, id: 'LIST' }],
    }),

    /**
     * GET BY ID (admin) – GET /contacts/:id
     */
    getContactAdmin: build.query<ContactDto, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [{ type: 'Contacts' as const, id: result.id }]
          : [{ type: 'Contacts' as const, id: 'LIST' }],
    }),

    /**
     * UPDATE (admin) – PATCH /contacts/:id
     * status / is_resolved / admin_note güncellemek için
     */
    updateContactAdmin: build.mutation<ContactDto, { id: string; patch: ContactUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Contacts' as const, id: arg.id },
        { type: 'Contacts' as const, id: 'LIST' },
      ],
    }),

    /**
     * DELETE (admin) – DELETE /contacts/:id
     */
    deleteContactAdmin: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contacts' as const, id },
        { type: 'Contacts' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListContactsAdminQuery,
  useGetContactAdminQuery,
  useUpdateContactAdminMutation,
  useDeleteContactAdminMutation,
} = contactsAdminApi;
