// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram_inbound.endpoints.ts
// Telegram inbound + auto-reply admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  TelegramInboundListParams,
  TelegramInboundListResult,
  TelegramAutoReplyConfig,
  TelegramAutoReplyUpdateBody,
} from '@/integrations/shared/telegram_inbound';

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return false;
};

export const telegramInboundAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTelegramInbound: build.query<TelegramInboundListResult, TelegramInboundListParams | void>({
      query: (arg) => {
        const params = arg && typeof arg === 'object' ? arg : undefined;

        if (params && Object.keys(params).length) {
          return {
            url: '/admin/telegram/inbound',
            method: 'GET',
            params: params as Record<string, unknown>,
          };
        }
        return { url: '/admin/telegram/inbound', method: 'GET' };
      },
      providesTags: ['TelegramInbound'],
    }),

    getTelegramAutoReply: build.query<TelegramAutoReplyConfig, void>({
      query: () => ({ url: '/admin/telegram/autoreply', method: 'GET' }),

      // ✅ normalize backend response (string -> boolean)
      transformResponse: (raw: unknown): TelegramAutoReplyConfig => {
        const r = (
          raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
        ) as Record<string, unknown>;

        const enabled = toBoolish(r.enabled);
        const mode = toStr(r.mode).trim() === 'ai' ? 'ai' : 'simple';
        const template = toStr(r.template).trim() || DEFAULT_TEMPLATE;

        return { enabled, mode, template };
      },

      providesTags: ['TelegramAutoReply'],
    }),

    updateTelegramAutoReply: build.mutation<{ ok: true }, TelegramAutoReplyUpdateBody>({
      query: (body) => ({ url: '/admin/telegram/autoreply', method: 'POST', body }),
      invalidatesTags: ['TelegramAutoReply'],
    }),
  }),
  overrideExisting: false,
});

const DEFAULT_TEMPLATE = 'Vielen Dank für Ihre Nachricht. Wir melden uns so schnell wie möglich bei Ihnen.';

export const {
  useListTelegramInboundQuery,
  useGetTelegramAutoReplyQuery,
  useUpdateTelegramAutoReplyMutation,
} = telegramInboundAdminApi;
