// =============================================================
// FILE: src/modules/teklifler/router.ts
// Teklif Modülü — route kaydı (admin + public)
// =============================================================

import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';

import {
  addKalem, createRevizyon, createTalepPublic, createTeklif, deleteKalem, deleteTeklif,
  donusturTalep, getFirmaProfili, getTalep, getTeklif, getTeklifPdf, gonderTeklif,
  listRevizyonlar, listTalepler, listTeklifler, onayaGonder, onaylaIskonto, patchKalem,
  publicTeklifByToken, reddetIskonto, setTeklifDurum, sipariseDonustur, updateTalep, updateTeklif,
} from './controller';

export async function registerTeklifler(app: FastifyInstance): Promise<void> {
  const guard = makeAdminPermissionGuard('admin.teklifler');
  const talepGuard = makeAdminPermissionGuard('admin.teklif_talepleri');
  const onayGuard = makeAdminPermissionGuard('admin.teklif_onay');

  // Teklifler
  const T = '/teklifler';
  app.get(`${T}/firma-profili`, { preHandler: guard }, getFirmaProfili);
  app.get(`${T}`, { preHandler: guard }, listTeklifler);
  app.post(`${T}`, { preHandler: guard }, createTeklif);
  app.get(`${T}/:id`, { preHandler: guard }, getTeklif);
  app.get(`${T}/:id/pdf`, { preHandler: guard }, getTeklifPdf);
  app.patch(`${T}/:id`, { preHandler: guard }, updateTeklif);
  app.delete(`${T}/:id`, { preHandler: guard }, deleteTeklif);
  app.post(`${T}/:id/durum`, { preHandler: guard }, setTeklifDurum);
  app.post(`${T}/:id/siparise-donustur`, { preHandler: guard }, sipariseDonustur);
  app.post(`${T}/:id/gonder`, { preHandler: guard }, gonderTeklif);
  app.post(`${T}/:id/onaya-gonder`, { preHandler: guard }, onayaGonder);
  app.post(`${T}/:id/onayla`, { preHandler: onayGuard }, onaylaIskonto);
  app.post(`${T}/:id/onay-reddet`, { preHandler: onayGuard }, reddetIskonto);
  app.post(`${T}/:id/revizyon`, { preHandler: guard }, createRevizyon);
  app.get(`${T}/:id/revizyonlar`, { preHandler: guard }, listRevizyonlar);
  app.post(`${T}/:id/kalemler`, { preHandler: guard }, addKalem);
  app.patch(`${T}/:id/kalemler/:kalemId`, { preHandler: guard }, patchKalem);
  app.delete(`${T}/:id/kalemler/:kalemId`, { preHandler: guard }, deleteKalem);

  // Teklif talepleri (gelen kutusu)
  const R = '/teklif-talepleri';
  app.get(`${R}`, { preHandler: talepGuard }, listTalepler);
  app.get(`${R}/:id`, { preHandler: talepGuard }, getTalep);
  app.patch(`${R}/:id`, { preHandler: talepGuard }, updateTalep);
  app.post(`${R}/:id/donustur`, { preHandler: talepGuard }, donusturTalep);
}

/** Public web teklif talebi (siteden gelen istekler) — /api prefix altında. */
export async function registerTeklifPublic(app: FastifyInstance): Promise<void> {
  app.post('/web/promats/teklif-talebi', createTalepPublic);
  // Public teklif görüntüleme (token linki — WhatsApp/e-posta paylaşımı)
  app.get('/web/promats/teklif/:token', publicTeklifByToken);
}
