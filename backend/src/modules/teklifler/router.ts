// =============================================================
// FILE: src/modules/teklifler/router.ts
// Teklif Modülü — route kaydı (admin + public)
// =============================================================

import type { FastifyInstance } from 'fastify';

import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import { requireOwnLead, requireOwnOffer } from '@/modules/crm/scope';

import {
  addKalem, clearMusteriMesaji, createRevizyon, createTalepPublic, createTeklif, deleteKalem, deleteTeklif, getRevizyon, getRevizyonPdf,
  donusturTalep, getFirmaProfili, getTalep, getTeklif, getTeklifPdf, gonderTeklif,
  listRevizyonlar, listTalepler, listTeklifler, onayaGonder, onaylaIskonto, patchKalem,
  publicTeklifByToken, reddetIskonto, setTeklifDurum, sipariseDonustur, updatePublicTeklifLink, updateTalep, updateTeklif,
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
  app.get(`${T}/:id`, { preHandler: [guard,requireOwnOffer] }, getTeklif);
  app.get(`${T}/:id/pdf`, { preHandler: [guard,requireOwnOffer] }, getTeklifPdf);
  app.patch(`${T}/:id`, { preHandler: [guard,requireOwnOffer] }, updateTeklif);
  app.delete(`${T}/:id/musteri-mesaji`, { preHandler: [guard,requireOwnOffer] }, clearMusteriMesaji);
  app.delete(`${T}/:id`, { preHandler: [guard,requireOwnOffer] }, deleteTeklif);
  app.post(`${T}/:id/durum`, { preHandler: [guard,requireOwnOffer] }, setTeklifDurum);
  app.post(`${T}/:id/siparise-donustur`, { preHandler: [guard,requireOwnOffer] }, sipariseDonustur);
  app.post(`${T}/:id/gonder`, { preHandler: [guard,requireOwnOffer] }, gonderTeklif);
  app.post(`${T}/:id/public-link`, { preHandler: [guard,requireOwnOffer] }, updatePublicTeklifLink);
  app.post(`${T}/:id/onaya-gonder`, { preHandler: [guard,requireOwnOffer] }, onayaGonder);
  app.post(`${T}/:id/onayla`, { preHandler: onayGuard }, onaylaIskonto);
  app.post(`${T}/:id/onay-reddet`, { preHandler: onayGuard }, reddetIskonto);
  app.post(`${T}/:id/revizyon`, { preHandler: [guard,requireOwnOffer] }, createRevizyon);
  app.get(`${T}/:id/revizyonlar`, { preHandler: [guard,requireOwnOffer] }, listRevizyonlar);
  app.get(`${T}/:id/revizyonlar/:revizyonNo`, { preHandler: [guard,requireOwnOffer] }, getRevizyon);
  app.get(`${T}/:id/revizyonlar/:revizyonNo/pdf`, { preHandler: [guard,requireOwnOffer] }, getRevizyonPdf);
  app.post(`${T}/:id/kalemler`, { preHandler: [guard,requireOwnOffer] }, addKalem);
  app.patch(`${T}/:id/kalemler/:kalemId`, { preHandler: [guard,requireOwnOffer] }, patchKalem);
  app.delete(`${T}/:id/kalemler/:kalemId`, { preHandler: [guard,requireOwnOffer] }, deleteKalem);

  // Teklif talepleri (gelen kutusu)
  const R = '/teklif-talepleri';
  app.get(`${R}`, { preHandler: talepGuard }, listTalepler);
  app.get(`${R}/:id`, { preHandler: [talepGuard,requireOwnLead] }, getTalep);
  app.patch(`${R}/:id`, { preHandler: [talepGuard,requireOwnLead] }, updateTalep);
  app.post(`${R}/:id/donustur`, { preHandler: [talepGuard,requireOwnLead] }, donusturTalep);
}

/** Public web teklif talebi (siteden gelen istekler) — /api prefix altında. */
export async function registerTeklifPublic(app: FastifyInstance): Promise<void> {
  app.post('/web/promats/teklif-talebi', { bodyLimit: 32 * 1024 }, createTalepPublic);
  // Public teklif görüntüleme (token linki — WhatsApp/e-posta paylaşımı)
  app.get('/web/promats/teklif/:token', publicTeklifByToken);
}
