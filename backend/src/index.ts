// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';
import { startShiftAutoCloseScheduler, stopShiftAutoCloseScheduler } from '@/modules/operator/shift_scheduler';

async function main() {
  const app: any = await createApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`API listening :${env.PORT}`);

  // Vardiya otomatik kapanma scheduler'ı (NODE_ENV=test'te no-op)
  startShiftAutoCloseScheduler({
    log: (info) => {
      if (info.error) {
        app.log.error({ error: info.error }, 'shift_scheduler_error');
      } else if (info.closed > 0) {
        app.log.info({ closed: info.closed }, 'shift_scheduler_closed_expired_shifts');
      }
    },
  });

  const shutdown = async () => {
    stopShiftAutoCloseScheduler();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
