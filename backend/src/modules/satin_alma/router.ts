import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  checkCriticalStock,
  createSatinAlmaSiparisi,
  deleteSatinAlmaSiparisi,
  getNextSiparisNo,
  getSatinAlmaSiparisi,
  listSatinAlmaSiparisleri,
  updateSatinAlmaSiparisi,
} from './controller';

export async function registerSatinAlma(app: FastifyInstance) {
  const BASE = '/satin-alma';
  const guard = makeAdminPermissionGuard('admin.satin_alma');

  app.get(`${BASE}`, { preHandler: guard }, listSatinAlmaSiparisleri);
  app.post(`${BASE}/kritik-stok-kontrol`, { preHandler: guard }, checkCriticalStock);
  app.get(`${BASE}/next-no`, { preHandler: guard }, getNextSiparisNo);
  app.get(`${BASE}/:id`, { preHandler: guard }, getSatinAlmaSiparisi);
  app.post(`${BASE}`, { preHandler: guard }, createSatinAlmaSiparisi);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateSatinAlmaSiparisi);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteSatinAlmaSiparisi);
}
