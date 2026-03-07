import type { FastifyReply, RouteHandler } from 'fastify';

import { repoGetLoginSettings, repoUpdateLoginSettings } from './repository';
import { updateSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

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
