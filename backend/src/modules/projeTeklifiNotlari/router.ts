import type { FastifyInstance } from 'fastify';

import { requireAdmin, requireAuth } from '@/common/middleware/auth';

import {
  createProjeTeklifiNotu,
  deleteProjeTeklifiNotu,
  getProjeTeklifiNotu,
  listProjeTeklifiNotlari,
  statsProjeTeklifiNotlari,
  updateProjeTeklifiNotu,
} from './controller';

export async function registerProjeTeklifiNotlariAdmin(app: FastifyInstance) {
  const BASE = '/proje-teklifi-notlari';
  const pre = [requireAuth, requireAdmin];

  app.get(BASE, { preHandler: pre }, listProjeTeklifiNotlari);
  app.get(`${BASE}/stats`, { preHandler: pre }, statsProjeTeklifiNotlari);
  app.get(`${BASE}/:id`, { preHandler: pre }, getProjeTeklifiNotu);
  app.post(BASE, { preHandler: pre }, createProjeTeklifiNotu);
  app.patch(`${BASE}/:id`, { preHandler: pre }, updateProjeTeklifiNotu);
  app.delete(`${BASE}/:id`, { preHandler: pre }, deleteProjeTeklifiNotu);
}
