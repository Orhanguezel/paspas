import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  listMakineKuyrugu,
  uretimBaslat,
  uretimBitir,
  duraklat,
  devamEt,
  vardiyaBasi,
  vardiyaSonu,
  getAcikVardiyalar,
  sevkiyatOlustur,
  malKabul,
  listGunlukGirisler,
  listDuruslar,
} from './controller';

export async function registerOperator(app: FastifyInstance) {
  const BASE = '/operator';
  const guard = makeAdminPermissionGuard('admin.operator');

  // Tab 1: Makine Kuyrugu
  app.get(`${BASE}/kuyruk`, { preHandler: guard }, listMakineKuyrugu);
  app.post(`${BASE}/baslat`, { preHandler: guard }, uretimBaslat);
  app.post(`${BASE}/bitir`, { preHandler: guard }, uretimBitir);
  app.post(`${BASE}/duraklat`, { preHandler: guard }, duraklat);
  app.post(`${BASE}/devam-et`, { preHandler: guard }, devamEt);

  // Vardiya
  app.get(`${BASE}/acik-vardiyalar`, { preHandler: guard }, getAcikVardiyalar);
  app.post(`${BASE}/vardiya-basi`, { preHandler: guard }, vardiyaBasi);
  app.post(`${BASE}/vardiya-sonu`, { preHandler: guard }, vardiyaSonu);

  // Tab 2: Sevkiyat
  app.post(`${BASE}/sevkiyat`, { preHandler: guard }, sevkiyatOlustur);

  // Tab 3: Mal Kabul
  app.post(`${BASE}/mal-kabul`, { preHandler: guard }, malKabul);

  // Loglar
  app.get(`${BASE}/gunluk-girisler`, { preHandler: guard }, listGunlukGirisler);
  app.get(`${BASE}/duruslar`, { preHandler: guard }, listDuruslar);
}
