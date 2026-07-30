import { afterEach, describe, expect, mock, test } from 'bun:test';
import { env } from '@/core/env';
import { sendTelegram } from '@/core/telegram';

const original = {
  token: env.TELEGRAM_BOT_TOKEN,
  chatId: env.TELEGRAM_CHAT_ID,
  fetch: globalThis.fetch,
};

afterEach(() => {
  env.TELEGRAM_BOT_TOKEN = original.token;
  env.TELEGRAM_CHAT_ID = original.chatId;
  globalThis.fetch = original.fetch;
});

describe('Telegram fail-open', () => {
  test('configuration missing returns a result without network access', async () => {
    env.TELEGRAM_BOT_TOKEN = '';
    env.TELEGRAM_CHAT_ID = '';
    const fetchMock = mock(() => Promise.reject(new Error('fetch çağrılmamalı')));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await sendTelegram('test')).toEqual({
      ok: false,
      reason: 'telegram_yapilandirilmamis',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('network errors return fail-open result', async () => {
    env.TELEGRAM_BOT_TOKEN = 'test-token';
    env.TELEGRAM_CHAT_ID = 'test-chat';
    const fetchMock = mock(() => Promise.reject(new Error('network_down')));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(await sendTelegram('test')).toEqual({
      ok: false,
      reason: 'network_down',
    });
  });
});
