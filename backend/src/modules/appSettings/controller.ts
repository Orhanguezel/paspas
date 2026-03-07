import type { FastifyReply, FastifyRequest, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import {
  repoBulkUpsert,
  repoDeleteByKey,
  repoDeleteMany,
  repoGetAppLocales,
  repoGetByKey,
  repoGetDefaultLocale,
  repoList,
  repoUpdateByKey,
  repoUpsert,
} from './repository';
import {
  bulkUpsertSchema,
  deleteManyQuerySchema,
  listQuerySchema,
  updateSchema,
  upsertSchema,
} from './validation';

function badRequest(reply: FastifyReply, message: string, issues?: unknown) {
  return reply.code(400).send({ error: { message, issues } });
}

export const listAppSettings: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return badRequest(reply, 'gecersiz_sorgu_parametreleri', parsed.error.flatten());
    return reply.send((await repoList(parsed.data)).map(rowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_app_settings_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const getAppSettingByKey: RouteHandler = async (req, reply) => {
  try {
    const { key } = req.params as { key: string };
    const row = await repoGetByKey(key);
    if (!row) return reply.code(404).send({ error: { message: 'ayar_bulunamadi' } });
    return reply.send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_app_setting_by_key_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const createAppSetting: RouteHandler = async (req, reply) => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'gecersiz_istek_govdesi', parsed.error.flatten());
    return reply.code(201).send(rowToDto(await repoUpsert(parsed.data)));
  } catch (error) {
    req.log.error({ error }, 'create_app_setting_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const updateAppSetting: RouteHandler = async (req, reply) => {
  try {
    const { key } = req.params as { key: string };
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'gecersiz_istek_govdesi', parsed.error.flatten());
    return reply.send(rowToDto(await repoUpdateByKey(key, parsed.data)));
  } catch (error) {
    req.log.error({ error }, 'update_app_setting_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const bulkUpsertAppSettings: RouteHandler = async (req, reply) => {
  try {
    const parsed = bulkUpsertSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'gecersiz_istek_govdesi', parsed.error.flatten());
    return reply.send((await repoBulkUpsert(parsed.data)).map(rowToDto));
  } catch (error) {
    req.log.error({ error }, 'bulk_upsert_app_settings_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const deleteManyAppSettings: RouteHandler = async (req, reply) => {
  try {
    const raw = req.query as Record<string, unknown>;
    const parsed = deleteManyQuerySchema.safeParse({
      key: raw.key,
      keyNe: raw.keyNe ?? raw['key_ne'] ?? raw['key!'],
      prefix: raw.prefix,
    });
    if (!parsed.success) return badRequest(reply, 'gecersiz_sorgu_parametreleri', parsed.error.flatten());
    await repoDeleteMany(parsed.data);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_many_app_settings_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const deleteAppSetting: RouteHandler = async (req, reply) => {
  try {
    const { key } = req.params as { key: string };
    await repoDeleteByKey(key);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_app_setting_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const getAppLocales: RouteHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    return reply.send(await repoGetAppLocales());
  } catch (error) {
    req.log.error({ error }, 'get_app_locales_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};

export const getDefaultLocale: RouteHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    return reply.send(await repoGetDefaultLocale());
  } catch (error) {
    req.log.error({ error }, 'get_default_locale_failed');
    return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
  }
};
