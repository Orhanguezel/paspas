import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { createUretimEmri, deleteUretimEmri, getNextEmirNo, getUretimEmri, listEmirOperasyonlari, listUretimEmirleri, listUretimEmriAdaylari, updateUretimEmri } from './controller';

export async function registerUretimEmirleri(app: FastifyInstance) {
  const BASE = '/uretim-emirleri';
  const guard = makeAdminPermissionGuard('admin.uretim_emirleri');

  app.get(`${BASE}`, { preHandler: guard }, listUretimEmirleri);
  app.get(`${BASE}/adaylar`, { preHandler: guard }, listUretimEmriAdaylari);
  app.get(`${BASE}/next-no`, { preHandler: guard }, getNextEmirNo);
  app.get(`${BASE}/:id`, { preHandler: guard }, getUretimEmri);
  app.get(`${BASE}/:id/operasyonlar`, { preHandler: guard }, listEmirOperasyonlari);
  app.post(`${BASE}`, { preHandler: guard }, createUretimEmri);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateUretimEmri);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteUretimEmri);
}
