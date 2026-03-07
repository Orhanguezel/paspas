// =============================================================
// FILE: src/integrations/endpoints/admin/wallet_admin.endpoints.ts
// Cüzdan yönetimi — Admin RTK Query endpoint'leri
// Base URL: /api/admin/wallets (baseApi üzerinden)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import { cleanParams } from '@/integrations/shared';
import type {
  WalletAdminView,
  WalletListResponse,
  WalletTransactionListResponse,
  WalletAdjustPayload,
  WalletStatusPayload,
  WalletTxStatusPayload,
} from '@/integrations/shared/wallet.types';

const BASE = '/admin/wallets';
const TX_BASE = '/admin/wallet_transactions';

export const walletAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* --------------------------------- */
    /* Wallet LIST                       */
    /* --------------------------------- */
    listWalletsAdmin: build.query<WalletListResponse, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: cleanParams((params ?? {}) as Record<string, unknown>),
      }),
      providesTags: ['Wallets'],
    }),

    /* --------------------------------- */
    /* Wallet GET by id                  */
    /* --------------------------------- */
    getWalletAdmin: build.query<WalletAdminView, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Wallet', id }],
    }),

    /* --------------------------------- */
    /* Wallet status UPDATE              */
    /* --------------------------------- */
    updateWalletStatusAdmin: build.mutation<{ success: boolean }, { id: string; body: WalletStatusPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Wallets', { type: 'Wallet', id }],
    }),

    /* --------------------------------- */
    /* Wallet ADJUST (admin credit/debit)*/
    /* --------------------------------- */
    adjustWalletAdmin: build.mutation<{ success: boolean; transaction_id: string }, WalletAdjustPayload>({
      query: (body) => ({ url: `${BASE}/adjust`, method: 'POST', body }),
      invalidatesTags: ['Wallets', 'WalletTransactions'],
    }),

    /* --------------------------------- */
    /* Transactions LIST for a wallet    */
    /* --------------------------------- */
    listWalletTransactionsAdmin: build.query<
      WalletTransactionListResponse,
      { walletId: string; page?: number; limit?: number }
    >({
      query: ({ walletId, ...params }) => ({
        url: `${BASE}/${walletId}/transactions`,
        method: 'GET',
        params: cleanParams(params as Record<string, unknown>),
      }),
      providesTags: ['WalletTransactions'],
    }),

    /* --------------------------------- */
    /* Transaction payment status UPDATE */
    /* --------------------------------- */
    updateTransactionStatusAdmin: build.mutation<{ success: boolean }, { id: string; body: WalletTxStatusPayload }>({
      query: ({ id, body }) => ({ url: `${TX_BASE}/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['WalletTransactions', 'Wallets'],
    }),
  }),

  overrideExisting: false,
});

export const {
  useListWalletsAdminQuery,
  useGetWalletAdminQuery,
  useUpdateWalletStatusAdminMutation,
  useAdjustWalletAdminMutation,
  useListWalletTransactionsAdminQuery,
  useUpdateTransactionStatusAdminMutation,
} = walletAdminApi;
