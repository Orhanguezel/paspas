import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { createHareket, listHareketler } from './controller';

export async function registerHareketler(app: FastifyInstance) {
  const BASE = '/hareketler';
  const guard = makeAdminPermissionGuard('admin.hareketler');

  app.get(`${BASE}`, { preHandler: guard }, listHareketler);
  app.post(`${BASE}`, { preHandler: guard }, createHareket);
}
