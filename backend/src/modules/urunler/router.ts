import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createUrun,
  deleteUrun,
  getUrun,
  listUrunler,
  updateUrun,
  listOperasyonlar,
  patchOperasyon,
  getUrunRecete,
  saveUrunRecete,
  deleteUrunRecete,
} from './controller';

export async function registerUrunler(app: FastifyInstance) {
  const BASE = '/urunler';
  const guard = makeAdminPermissionGuard('admin.urunler');

  app.get(`${BASE}`, { preHandler: guard }, listUrunler);
  app.get(`${BASE}/:id`, { preHandler: guard }, getUrun);
  app.post(`${BASE}`, { preHandler: guard }, createUrun);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateUrun);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteUrun);

  // Operasyonlar
  app.get(`${BASE}/:id/operasyonlar`, { preHandler: guard }, listOperasyonlar);
  app.patch(`${BASE}/operasyonlar/:opId`, { preHandler: guard }, patchOperasyon);

  // Recete (urun bazli)
  app.get(`${BASE}/:id/recete`, { preHandler: guard }, getUrunRecete);
  app.put(`${BASE}/:id/recete`, { preHandler: guard }, saveUrunRecete);
  app.delete(`${BASE}/:id/recete`, { preHandler: guard }, deleteUrunRecete);
}
