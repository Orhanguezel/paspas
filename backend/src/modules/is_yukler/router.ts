import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { createIsYuku, deleteIsYuku, getIsYuku, listIsYukleri, updateIsYuku } from './controller';

export async function registerIsYukleri(app: FastifyInstance) {
  const BASE = '/is-yukler';
  const guard = makeAdminPermissionGuard('admin.is_yukler');
  app.get(`${BASE}`, { preHandler: guard }, listIsYukleri);
  app.get(`${BASE}/:id`, { preHandler: guard }, getIsYuku);
  app.post(`${BASE}`, { preHandler: guard }, createIsYuku);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateIsYuku);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteIsYuku);
}
