import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { listMalKabul, getMalKabul, createMalKabul, updateMalKabul, deleteMalKabul } from './controller';

export async function registerMalKabul(app: FastifyInstance) {
  const BASE = '/mal-kabul';
  const guard = makeAdminPermissionGuard('admin.mal_kabul');

  app.get(`${BASE}`, { preHandler: guard }, listMalKabul);
  app.get(`${BASE}/:id`, { preHandler: guard }, getMalKabul);
  app.post(`${BASE}`, { preHandler: guard }, createMalKabul);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateMalKabul);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteMalKabul);
}
