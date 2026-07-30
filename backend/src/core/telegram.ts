import { env } from '@/core/env';

export async function sendTelegram(text: string): Promise<{ ok: boolean; reason?: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, reason: 'telegram_yapilandirilmamis' };
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean };
    return response.ok && payload.ok
      ? { ok: true }
      : { ok: false, reason: `http_${response.status}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'bilinmeyen_hata' };
  }
}
