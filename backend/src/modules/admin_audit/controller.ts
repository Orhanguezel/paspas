import type { RouteHandler } from 'fastify';

import { repoListAuditLogs } from './repository';
import { listAuditQuerySchema } from './validation';

export const listAdminAuditLogs: RouteHandler = async (req, reply) => {
  try {
    const parsed = listAuditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_sorgu_parametreleri',
          issues: parsed.error.flatten(),
        },
      });
    }

    const { items, total, summary } = await repoListAuditLogs(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send({ items, total, summary });
  } catch (error) {
    req.log.error({ error }, 'list_admin_audit_logs_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};
