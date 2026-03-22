import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { getLoginSettings, getPublicLoginConfig, updateLoginSettings } from './controller';

/** Admin route'lari — /api/admin prefix'i altinda */
export async function registerGirisAyarlari(app: FastifyInstance) {
  const BASE = '/giris-ayarlari';
  const guard = makeAdminPermissionGuard('admin.giris_ayarlari');

  app.get(BASE, { preHandler: guard }, getLoginSettings);
  app.put(BASE, { preHandler: guard }, updateLoginSettings);
}

/** Public route — /api prefix'i altinda, auth gerektirmez */
export async function registerPublicLoginConfig(app: FastifyInstance) {
  app.get('/public/login-config', getPublicLoginConfig);
}
