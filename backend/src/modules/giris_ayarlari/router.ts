import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { getLoginSettings, updateLoginSettings } from './controller';

export async function registerGirisAyarlari(app: FastifyInstance) {
  const BASE = '/giris-ayarlari';
  const guard = makeAdminPermissionGuard('admin.giris_ayarlari');

  app.get(BASE, { preHandler: guard }, getLoginSettings);
  app.put(BASE, { preHandler: guard }, updateLoginSettings);
}
