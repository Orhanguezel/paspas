import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { listAdminAuditLogs } from './controller';

export async function registerAdminAudit(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.audit');

  app.get('/audit-logs', { preHandler: guard }, listAdminAuditLogs);
}
