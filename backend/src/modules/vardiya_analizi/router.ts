import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { getVardiyaDetay, getVardiyaTrend, listVardiyaAnalizi } from './controller';

export async function registerVardiyaAnalizi(app: FastifyInstance) {
  const BASE = '/vardiya-analizi';
  // dashboard izniyle birlikte kullanılabilir
  const guard = makeAdminPermissionGuard('admin.dashboard');

  app.get(`${BASE}`, { preHandler: guard }, listVardiyaAnalizi);
  app.get(`${BASE}/detay`, { preHandler: guard }, getVardiyaDetay);
  app.get(`${BASE}/trend`, { preHandler: guard }, getVardiyaTrend);
}
