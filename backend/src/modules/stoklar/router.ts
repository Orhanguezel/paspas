import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { adjustStok, checkYeterlilik, getStok, listStoklar } from './controller';

export async function registerStoklar(app: FastifyInstance) {
  const BASE = '/stoklar';
  const guard = makeAdminPermissionGuard('admin.stoklar');

  app.get(`${BASE}`, { preHandler: guard }, listStoklar);
  app.get(`${BASE}/yeterlilik`, { preHandler: guard }, checkYeterlilik);
  app.get(`${BASE}/:id`, { preHandler: guard }, getStok);
  app.post(`${BASE}/:id/duzelt`, { preHandler: guard }, adjustStok);
}
