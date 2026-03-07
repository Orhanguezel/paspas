// src/modules/site_settings/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import {
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminGetAppLocales,
  adminGetDefaultLocale,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
} from './admin.controller';

const BASE = '/site_settings';

export async function registerSiteSettingsAdmin(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.app_settings');

  app.get(`${BASE}`,                 { preHandler: guard }, adminListSiteSettings);
  app.get(`${BASE}/list`,            { preHandler: guard }, adminListSiteSettings);
  app.get(`${BASE}/app-locales`,     { preHandler: guard }, adminGetAppLocales);
  app.get(`${BASE}/default-locale`,  { preHandler: guard }, adminGetDefaultLocale);
  app.get(`${BASE}/:key`,            { preHandler: guard }, adminGetSiteSettingByKey);

  app.post(`${BASE}`,          { preHandler: guard }, adminCreateSiteSetting);
  app.put(`${BASE}/:key`,      { preHandler: guard }, adminUpdateSiteSetting);

  // 🔥 BULK UPSERT tam burada:
  app.post(`${BASE}/bulk-upsert`, { preHandler: guard }, adminBulkUpsertSiteSettings);

  app.delete(`${BASE}`,        { preHandler: guard }, adminDeleteManySiteSettings);
  app.delete(`${BASE}/:key`,   { preHandler: guard }, adminDeleteSiteSetting);
}
