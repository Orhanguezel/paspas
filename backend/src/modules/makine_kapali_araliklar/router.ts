import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createMakineKapaliAralik,
  deleteMakineKapaliAralik,
  getMakineKapaliAralik,
  listMakineKapaliAraliklar,
  updateMakineKapaliAralik,
} from './controller';

export async function registerMakineKapaliAraliklar(app: FastifyInstance) {
  const BASE = '/makine-kapali-araliklar';
  const guard = makeAdminPermissionGuard('admin.tanimlar');

  app.get(BASE, { preHandler: guard }, listMakineKapaliAraliklar);
  app.get(`${BASE}/:id`, { preHandler: guard }, getMakineKapaliAralik);
  app.post(BASE, { preHandler: guard }, createMakineKapaliAralik);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateMakineKapaliAralik);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteMakineKapaliAralik);
}
