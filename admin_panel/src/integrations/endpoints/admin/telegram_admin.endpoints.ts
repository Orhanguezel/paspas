// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram_admin.endpoints.ts
// Telegram admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  SimpleSuccessResp,
  TelegramAdminSendBody,
  TelegramAdminEventBody,
  TelegramAdminTestBody,
  TelegramAdminTestResp,
  TelegramNotificationBody,
} from '@/integrations/shared/telegram';

const TG_ADMIN_BASE = '/admin/telegram';

function toTrimmedString(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

export const telegramAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /admin/telegram/test */
    telegramTest: b.mutation<TelegramAdminTestResp, TelegramAdminTestBody | void>({
      query: (body): FetchArgs => ({
        url: `${TG_ADMIN_BASE}/test`,
        method: 'POST',
        body: body ?? {}, // chat_id opsiyonel
      }),
    }),

    /** POST /admin/telegram/send (generic) */
    telegramSend: b.mutation<SimpleSuccessResp, TelegramAdminSendBody>({
      query: (body): FetchArgs => ({
        url: `${TG_ADMIN_BASE}/send`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /admin/telegram/event (templated) */
    telegramEvent: b.mutation<SimpleSuccessResp, TelegramAdminEventBody>({
      query: (body): FetchArgs => ({
        url: `${TG_ADMIN_BASE}/event`,
        method: 'POST',
        body,
      }),
    }),

    /**
     * Backward compat:
     * Eski FE kodu "sendTelegramNotification" çağırıyordu (functions altında).
     * Yeni backend yapısında bu çağrıyı /admin/telegram/event'e map ediyoruz.
     *
     * Beklenen eski body shape: TelegramNotificationBody = Record<string, unknown>
     * İçinden type/event alanlarını tolerant şekilde okuruz.
     */
    sendTelegramNotification: b.mutation<SimpleSuccessResp, TelegramNotificationBody>({
      query: (body): FetchArgs => {
        const bdy = (body ?? {}) as Record<string, unknown>;

        const eventRaw = bdy.event ?? bdy.type ?? 'new_booking';
        const event = toTrimmedString(eventRaw) || 'new_booking';

        const chatRaw = bdy.chat_id ?? bdy.chatId ?? bdy.chatID ?? null;
        const chat_id = toTrimmedString(chatRaw);

        // exactOptionalPropertyTypes: chat_id boşsa alanı ekleme
        const payload: TelegramAdminEventBody = chat_id
          ? { event, chat_id, data: bdy }
          : { event, data: bdy };

        return {
          url: `${TG_ADMIN_BASE}/event`,
          method: 'POST',
          body: payload,
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useTelegramTestMutation,
  useTelegramSendMutation,
  useTelegramEventMutation,

  // Compat endpoint (internal name)
  useSendTelegramNotificationMutation: _useSendTelegramNotificationMutation,
} = telegramAdminApi;

// ---------------- Backward-compat exports ----------------

// Eski hook adı: useTelegramSendTestMutation
export const useTelegramSendTestMutation = useTelegramTestMutation;

// Eski hook adı: useSendTelegramNotificationMutation
export const useSendTelegramNotificationMutation = _useSendTelegramNotificationMutation;
