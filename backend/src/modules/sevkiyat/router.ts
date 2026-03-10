import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { listBekleyenler, listSiparissizUrunler, listSevkEmirleri, getSevkEmri, createSevkEmri, patchSevkEmri } from './controller';

export async function registerSevkiyat(app: FastifyInstance) {
  const BASE = '/sevkiyat';
  const guard = makeAdminPermissionGuard('admin.sevkiyat');

  app.get(`${BASE}/bekleyenler`, { preHandler: guard }, listBekleyenler);
  app.get(`${BASE}/siparissiz`, { preHandler: guard }, listSiparissizUrunler);
  app.get(`${BASE}/emirler`, { preHandler: guard }, listSevkEmirleri);
  app.get(`${BASE}/emirler/:id`, { preHandler: guard }, getSevkEmri);
  app.post(`${BASE}/emri`, { preHandler: guard }, createSevkEmri);
  app.patch(`${BASE}/emirler/:id`, { preHandler: guard }, patchSevkEmri);
}
