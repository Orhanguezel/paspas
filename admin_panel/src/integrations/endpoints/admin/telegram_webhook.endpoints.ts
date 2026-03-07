// ===================================================================
// FILE: src/integrations/endpoints/admin/telegram_webhook.endpoints.ts
// Telegram webhook admin endpoints (Ensotek)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  TelegramUpdate,
  TelegramWebhookResponse,
} from '@/integrations/shared/telegram_webhook';

export const telegramWebhookAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    telegramWebhookSimulate: build.mutation<TelegramWebhookResponse, { update: TelegramUpdate }>({
      query: (body) => ({
        url: '/admin/telegram/webhook/simulate',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useTelegramWebhookSimulateMutation } = telegramWebhookAdminApi;
