// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';

async function main() {
  const app: any = await createApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`API listening :${env.PORT}`);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
