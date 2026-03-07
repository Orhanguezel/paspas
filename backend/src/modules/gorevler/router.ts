import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { createGorev, deleteGorev, getGorev, listGorevler, updateGorev } from './controller';

export async function registerGorevler(app: FastifyInstance) {
  const BASE = '/gorevler';
  const guard = makeAdminPermissionGuard('admin.gorevler');

  app.get(`${BASE}`, { preHandler: guard }, listGorevler);
  app.get(`${BASE}/:id`, { preHandler: guard }, getGorev);
  app.post(`${BASE}`, { preHandler: guard }, createGorev);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateGorev);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteGorev);
}
