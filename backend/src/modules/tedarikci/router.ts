import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createTedarikci,
  deleteTedarikci,
  getTedarikci,
  listTedarikci,
  updateTedarikci,
} from './controller';

export async function registerTedarikci(app: FastifyInstance) {
  const BASE = '/tedarikci';
  const guard = makeAdminPermissionGuard('admin.tedarikci');

  app.get(`${BASE}`, { preHandler: guard }, listTedarikci);
  app.get(`${BASE}/:id`, { preHandler: guard }, getTedarikci);
  app.post(`${BASE}`, { preHandler: guard }, createTedarikci);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateTedarikci);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteTedarikci);
}
