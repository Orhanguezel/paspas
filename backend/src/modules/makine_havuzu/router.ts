import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { ataOperasyon, createMakine, deleteMakine, getMakine, kuyrukCikar, kuyrukSirala, listAtanmamis, listKuyruklar, listMakineler, updateMakine } from './controller';

export async function registerMakineHavuzu(app: FastifyInstance) {
  const BASE = '/makine-havuzu';
  const guard = makeAdminPermissionGuard('admin.makine_havuzu');

  // Kuyruk Yonetimi (static paths first)
  app.get(`${BASE}/atanmamis`, { preHandler: guard }, listAtanmamis);
  app.get(`${BASE}/kuyruklar`, { preHandler: guard }, listKuyruklar);
  app.post(`${BASE}/ata`, { preHandler: guard }, ataOperasyon);
  app.patch(`${BASE}/kuyruk-sirala`, { preHandler: guard }, kuyrukSirala);
  app.delete(`${BASE}/kuyruk/:id`, { preHandler: guard }, kuyrukCikar);

  // Makine CRUD
  app.get(`${BASE}`, { preHandler: guard }, listMakineler);
  app.get(`${BASE}/:id`, { preHandler: guard }, getMakine);
  app.post(`${BASE}`, { preHandler: guard }, createMakine);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateMakine);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteMakine);
}
