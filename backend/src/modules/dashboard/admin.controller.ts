import type { FastifyReply, FastifyRequest } from 'fastify';

import { trendQuerySchema } from './validation';
import { getDashboardActionCenter, getDashboardKpi, getDashboardSummary, getDashboardTrend } from './service';

export async function adminDashboardSummary(req: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getDashboardSummary());
  } catch (error) {
    req.log.error({ error }, 'admin_dashboard_summary_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
}

export async function adminDashboardKpi(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (req as any).user;
    const userId: string | null = user?.id ?? null;
    const role: string = user?.role ?? 'admin';
    return reply.send(await getDashboardKpi(userId, role));
  } catch (error) {
    req.log.error({ error }, 'admin_dashboard_kpi_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
}

export async function adminDashboardTrend(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const parsed = trendQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_sorgu_parametreleri',
          issues: parsed.error.flatten(),
        },
      });
    }

    return reply.send(await getDashboardTrend(parsed.data.days));
  } catch (error) {
    req.log.error({ error }, 'admin_dashboard_trend_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
}

export async function adminDashboardActionCenter(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (req as any).user;
    const userId: string | null = user?.id ?? null;
    const role: string = user?.role ?? 'admin';
    return reply.send(await getDashboardActionCenter(userId, role));
  } catch (error) {
    req.log.error({ error }, 'admin_dashboard_action_center_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
}
