import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { getGanttItem, listGantt, updateGanttItem } from './controller';

export async function registerGantt(app: FastifyInstance) {
  const BASE = '/gantt';
  const guard = makeAdminPermissionGuard('admin.gantt');

  app.get(`${BASE}`, { preHandler: guard }, listGantt);
  app.get(`${BASE}/:id`, { preHandler: guard }, getGanttItem);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateGanttItem);
}
