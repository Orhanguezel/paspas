import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import { atamaGeriAl, checkHammadde, createUretimEmri, createUretimEmirleriFromSiparis, deleteUretimEmri, getHammaddeYeterlilik, getNextEmirNo, getUretimEmri, getUretimKarsilastirma, listEmirOperasyonlari, listUretimEmirleri, listUretimEmriAdaylari, updateUretimEmri } from './controller';

export async function registerUretimEmirleri(app: FastifyInstance) {
  const BASE = '/uretim-emirleri';
  const guard = makeAdminPermissionGuard('admin.uretim_emirleri');

  app.get(`${BASE}`, { preHandler: guard }, listUretimEmirleri);
  app.get(`${BASE}/adaylar`, { preHandler: guard }, listUretimEmriAdaylari);
  app.get(`${BASE}/next-no`, { preHandler: guard }, getNextEmirNo);
  app.get(`${BASE}/:id`, { preHandler: guard }, getUretimEmri);
  app.get(`${BASE}/:id/operasyonlar`, { preHandler: guard }, listEmirOperasyonlari);
  app.get(`${BASE}/:id/hammadde-kontrol`, { preHandler: guard }, checkHammadde);
  app.get(`${BASE}/:id/hammadde-yeterlilik`, { preHandler: guard }, getHammaddeYeterlilik);
  app.get(`${BASE}/:id/uretim-karsilastirma`, { preHandler: guard }, getUretimKarsilastirma);
  app.post(`${BASE}`, { preHandler: guard }, createUretimEmri);
  app.post(`${BASE}/siparis-kaleminden`, { preHandler: guard }, createUretimEmirleriFromSiparis);
  app.post(`${BASE}/:id/atama-geri-al`, { preHandler: guard }, atamaGeriAl);
  app.patch(`${BASE}/:id`, { preHandler: guard }, updateUretimEmri);
  app.delete(`${BASE}/:id`, { preHandler: guard }, deleteUretimEmri);
}
