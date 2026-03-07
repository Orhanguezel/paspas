import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  bulkUpsertAppSettings,
  createAppSetting,
  deleteAppSetting,
  deleteManyAppSettings,
  getAppLocales,
  getAppSettingByKey,
  getDefaultLocale,
  listAppSettings,
  updateAppSetting,
} from './controller';

export async function registerAppSettingsAdmin(app: FastifyInstance) {
  const BASE = '/app-settings';
  const guard = makeAdminPermissionGuard('admin.app_settings');

  app.get(`${BASE}`, { preHandler: guard }, listAppSettings);
  app.get(`${BASE}/list`, { preHandler: guard }, listAppSettings);
  app.get(`${BASE}/app-locales`, { preHandler: guard }, getAppLocales);
  app.get(`${BASE}/default-locale`, { preHandler: guard }, getDefaultLocale);
  app.get(`${BASE}/:key`, { preHandler: guard }, getAppSettingByKey);

  app.post(`${BASE}`, { preHandler: guard }, createAppSetting);
  app.put(`${BASE}/:key`, { preHandler: guard }, updateAppSetting);
  app.post(`${BASE}/bulk-upsert`, { preHandler: guard }, bulkUpsertAppSettings);

  app.delete(`${BASE}`, { preHandler: guard }, deleteManyAppSettings);
  app.delete(`${BASE}/:key`, { preHandler: guard }, deleteAppSetting);
}
