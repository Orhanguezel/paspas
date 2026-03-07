import type { FastifyInstance } from 'fastify';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { adminDashboardActionCenter, adminDashboardKpi, adminDashboardSummary, adminDashboardTrend } from './admin.controller';

export async function registerDashboardAdmin(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.dashboard');
  app.get('/dashboard/summary', { preHandler: guard }, adminDashboardSummary);
  app.get('/dashboard/kpi', { preHandler: guard }, adminDashboardKpi);
  app.get('/dashboard/trend', { preHandler: guard }, adminDashboardTrend);
  app.get('/dashboard/action-center', { preHandler: guard }, adminDashboardActionCenter);
}
