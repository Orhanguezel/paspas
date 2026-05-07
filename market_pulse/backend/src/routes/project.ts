import type { FastifyInstance } from 'fastify';
import { registerExternalDbAdmin } from '@/modules/externalDb/router';
import { registerLeadMachineAdmin } from '@/modules/lead-machine/router';
import { registerMarketAdmin } from '@/modules/market/router';

export async function registerProjectPublic(_api: FastifyInstance) {
  // MarketPulse currently exposes project-specific routes only under /admin.
}

export async function registerProjectAdmin(adminApi: FastifyInstance) {
  await registerExternalDbAdmin(adminApi);
  await registerMarketAdmin(adminApi);
  await registerLeadMachineAdmin(adminApi);
}
