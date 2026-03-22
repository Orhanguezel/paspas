import type { FastifyReply, RouteHandler } from 'fastify';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import { eq } from 'drizzle-orm';

import { repoGetLoginSettings, repoUpdateLoginSettings } from './repository';
import { updateSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

/** GET /public/login-config — auth gerektirmez, login sayfasi icin minimal config */
export const getPublicLoginConfig: RouteHandler = async (req, reply) => {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, 'erp_login_settings')).limit(1);
    const stored = rows[0]?.value ? JSON.parse(rows[0].value) : {};
    return reply.send({
      showQuickLogin: stored.showQuickLogin === true,
      enabledRoles: Array.isArray(stored.enabledRoles) ? stored.enabledRoles : ['admin', 'sevkiyatci', 'operator', 'satin_almaci'],
    });
  } catch (error) {
    req.log.error({ error }, 'get_public_login_config_failed');
    return reply.send({ showQuickLogin: false, enabledRoles: [] });
  }
};

export const getLoginSettings: RouteHandler = async (req, reply) => {
  try {
    return reply.send(await repoGetLoginSettings());
  } catch (error) {
    req.log.error({ error }, 'get_login_settings_failed');
    return sendInternalError(reply);
  }
};

export const updateLoginSettings: RouteHandler = async (req, reply) => {
  try {
    const parsed = updateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    return reply.send(await repoUpdateLoginSettings(parsed.data));
  } catch (error) {
    req.log.error({ error }, 'update_login_settings_failed');
    return sendInternalError(reply);
  }
};
