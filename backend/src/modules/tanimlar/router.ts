import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  createKalip,
  createTatil,
  deleteKalip,
  deleteTatil,
  getKalip,
  getTatil,
  listKaliplar,
  listMakinelerForTanim,
  listTatiller,
  listUyumluMakineler,
  setUyumluMakineler,
  updateKalip,
  updateTatil,
  listVardiyalar,
  getVardiya,
  createVardiya,
  updateVardiya,
  deleteVardiya,
  listDurusNedenleri,
  getDurusNedeni,
  createDurusNedeni,
  updateDurusNedeni,
  deleteDurusNedeni,
} from './controller';

export async function registerTanimlar(app: FastifyInstance) {
  const BASE = '/tanimlar';
  const guard = makeAdminPermissionGuard('admin.tanimlar');

  app.get(`${BASE}/makineler`, { preHandler: guard }, listMakinelerForTanim);

  app.get(`${BASE}/kaliplar`, { preHandler: guard }, listKaliplar);
  app.get(`${BASE}/kaliplar/:id`, { preHandler: guard }, getKalip);
  app.post(`${BASE}/kaliplar`, { preHandler: guard }, createKalip);
  app.patch(`${BASE}/kaliplar/:id`, { preHandler: guard }, updateKalip);
  app.delete(`${BASE}/kaliplar/:id`, { preHandler: guard }, deleteKalip);
  app.get(`${BASE}/kaliplar/:kalipId/uyumlu-makineler`, { preHandler: guard }, listUyumluMakineler);
  app.put(`${BASE}/kaliplar/:kalipId/uyumlu-makineler`, { preHandler: guard }, setUyumluMakineler);

  app.get(`${BASE}/tatiller`, { preHandler: guard }, listTatiller);
  app.get(`${BASE}/tatiller/:id`, { preHandler: guard }, getTatil);
  app.post(`${BASE}/tatiller`, { preHandler: guard }, createTatil);
  app.patch(`${BASE}/tatiller/:id`, { preHandler: guard }, updateTatil);
  app.delete(`${BASE}/tatiller/:id`, { preHandler: guard }, deleteTatil);

  app.get(`${BASE}/vardiyalar`, { preHandler: guard }, listVardiyalar);
  app.get(`${BASE}/vardiyalar/:id`, { preHandler: guard }, getVardiya);
  app.post(`${BASE}/vardiyalar`, { preHandler: guard }, createVardiya);
  app.patch(`${BASE}/vardiyalar/:id`, { preHandler: guard }, updateVardiya);
  app.delete(`${BASE}/vardiyalar/:id`, { preHandler: guard }, deleteVardiya);

  app.get(`${BASE}/durus-nedenleri`, { preHandler: guard }, listDurusNedenleri);
  app.get(`${BASE}/durus-nedenleri/:id`, { preHandler: guard }, getDurusNedeni);
  app.post(`${BASE}/durus-nedenleri`, { preHandler: guard }, createDurusNedeni);
  app.patch(`${BASE}/durus-nedenleri/:id`, { preHandler: guard }, updateDurusNedeni);
  app.delete(`${BASE}/durus-nedenleri/:id`, { preHandler: guard }, deleteDurusNedeni);
}
