import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createSatisSiparisi,
  deleteSatisSiparisi,
  getNextSiparisNo,
  getSatisSiparisi,
  listSatisSiparisleri,
  listSiparisIslemleri,
  updateSatisSiparisi,
  uretimeAktar,
} from './controller';

export async function registerSatisSiparisleri(app: FastifyInstance) {
  const BASE = '/satis-siparisleri';
  const guard = makeAdminPermissionGuard('admin.satis_siparisleri');

  app.get(`${BASE}`, { preHandler: guard }, listSatisSiparisleri);
  app.get(`${BASE}/islemler`, { preHandler: guard }, listSiparisIslemleri);
  app.post(`${BASE}/islemler/uretime-aktar`, { preHandler: guard }, uretimeAktar);
  app.get(`${BASE}/next-no`, { preHandler: guard }, getNextSiparisNo);
  app.get(`${BASE}/:id`, { preHandler: guard }, getSatisSiparisi);
  app.post(`${BASE}`, { preHandler: guard }, createSatisSiparisi);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateSatisSiparisi);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteSatisSiparisi);
}
