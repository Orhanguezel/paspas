import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createMusteri,
  deleteMusteri,
  getMusteri,
  getNextKod,
  listMusteriler,
  updateMusteri,
} from './controller';

export async function registerMusteriler(app: FastifyInstance) {
  const BASE = '/musteriler';
  const guard = makeAdminPermissionGuard('admin.musteriler');

  app.get(`${BASE}`, { preHandler: guard }, listMusteriler);
  app.get(`${BASE}/next-kod`, { preHandler: guard }, getNextKod);
  app.get(`${BASE}/:id`, { preHandler: guard }, getMusteri);
  app.post(`${BASE}`, { preHandler: guard }, createMusteri);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateMusteri);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteMusteri);
}
