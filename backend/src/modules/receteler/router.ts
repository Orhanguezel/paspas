import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createRecete,
  deleteRecete,
  getRecete,
  listReceteler,
  updateRecete,
} from './controller';

export async function registerReceteler(app: FastifyInstance) {
  const BASE = '/receteler';
  const guard = makeAdminPermissionGuard('admin.receteler');

  app.get(`${BASE}`, { preHandler: guard }, listReceteler);
  app.get(`${BASE}/:id`, { preHandler: guard }, getRecete);
  app.post(`${BASE}`, { preHandler: guard }, createRecete);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateRecete);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteRecete);
}
