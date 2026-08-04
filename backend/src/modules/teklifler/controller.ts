// =============================================================
// FILE: src/modules/teklifler/controller.ts
// Teklif Modülü — HTTP route handler'ları
// =============================================================

import { createHash } from 'node:crypto';

import type { RouteHandler } from 'fastify';

import { getErpBrandingLogoUrl, getErpCompanyProfile } from '@/modules/siteSettings/service';
import { sendMailWithAttachments } from '@/modules/mail/service';
import { scheduleOfferFollowup } from '@/modules/crm/reminders.repository';
import { recordOfferCommunication } from '@/modules/crm/communications.repository';
import { emitAutomationEvent } from '@/modules/crm/automation.repository';
import { writeCrmAudit } from '@/modules/crm/audit';
import { crmScope } from '@/modules/crm/scope';

import { PdfUnavailableError, renderPdf, resolveLogoDataUri } from './pdf.service';
import { renderTeklifHtml, type TeklifPdfInput } from './pdfTemplate';
import { buildTeklifPdf } from './teklif-pdf';
import {
  assertTeklifGonderilebilir, repoAddKalem, repoCreateRevizyon, repoCreateTalepPublic,
  repoCreateTeklif, repoDeleteKalem, repoDeleteTeklif, repoDonusturTalep, repoGetTalep,
  repoGetTeklif, repoGetRevizyon, repoListRevizyonlar, repoListTalepler, repoListTeklifler, repoLogGonderim,
  repoMarkGonderildi, repoOnaylaIskonto, repoOnayaGonder, repoPatchKalem, repoPatchTalep,
  repoPatchTeklif, repoReddetIskonto, repoRefreshPublicToken, repoRevokePublicToken, repoSetTeklifDurum, repoTeklifByToken,
  repoTeklifiSipariseDonustur,
} from './repository';
import {
  gonderSchema, kalemCreateSchema, kalemPatchSchema, onayReddetSchema, publicLinkSchema, revizyonSchema,
  talepDonusturSchema, talepListQuerySchema, talepPatchSchema, talepPublicSchema,
  sipariseDonusturSchema, teklifCreateSchema, teklifDurumSchema, teklifListQuerySchema, teklifPatchSchema,
} from './validation';

function userIdOf(req: { user?: unknown }): string | null {
  const user=req.user as { id?: string; sub?: string } | undefined;
  return user?.id ?? user?.sub ?? null;
}
function roleOf(req: { user?: unknown }): string {
  return (req.user as { role?: string } | undefined)?.role ?? 'operator';
}
async function crmAudit(req:Parameters<RouteHandler>[0],action:string,resource:string,id:string,before:unknown,after:unknown){await writeCrmAudit({actorUserId:userIdOf(req),action,resource,resourceId:id,before,after}).catch(error=>req.log.warn({error},'crm_domain_audit_failed'));}

// İş kuralı hatasını uygun HTTP koduna eşle
function mapError(reply: Parameters<RouteHandler>[1], err: unknown): void {
  const msg = err instanceof Error ? err.message : 'sunucu_hatasi';
  const map: Record<string, number> = {
    gecersiz_teklif_gecisi: 409,
    talep_zaten_donustu: 409,
    teklif_zaten_donustu: 409,
    teklif_kabul_edilmemis: 422,
    urun_esmesi_gerekli: 422,
    sadece_taslak_duzenlenir: 409,
    sadece_taslak_silinir: 409,
    onay_gerekmiyor: 409,
    iskonto_onayi_gerekli: 422,
    teklif_bulunamadi: 404,
    kalem_bulunamadi: 404,
    talep_bulunamadi: 404,
    musteri_bulunamadi: 404,
    urun_bulunamadi: 404,
    musteri_gerekli: 400,
  };
  const code = map[msg] ?? 500;
  reply.code(code).send({ error: { message: msg } });
}

// ── Firma profili (teklif başlığı — logo + firma bilgisi ayarlardan) ──

export const getFirmaProfili: RouteHandler = async () => {
  const [company, logoUrl] = await Promise.all([getErpCompanyProfile(), getErpBrandingLogoUrl()]);
  return { ...company, logoUrl };
};

// Teklif PDF (Promats markalı, ayarlardan logo/firma)
export const getTeklifPdf: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const built = await buildTeklifPdf(id);
    if (!built) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${built.teklifNo}.pdf"`);
    return reply.send(built.pdf);
  } catch (err) {
    if (err instanceof PdfUnavailableError) {
      req.log.error({ err: err.message }, 'teklif_pdf_unavailable');
      return reply.code(503).send({ error: { message: 'pdf_servisi_kullanilamiyor' } });
    }
    throw err;
  }
};

// Teklif gönder (e-posta ekli PDF / WhatsApp linki / manuel) + gönderim kaydı
export const gonderTeklif: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = gonderSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  const { kanal, aliciEmail } = parsed.data;
  const userId = userIdOf(req);

  const teklif = await repoGetTeklif(id);
  if (!teklif) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
  try {
    assertTeklifGonderilebilir(teklif, roleOf(req));
  } catch (err) { return mapError(reply, err); }

  if (kanal === 'email') {
    try {
      const built = await buildTeklifPdf(id);
      if (!built) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
      const info = await sendMailWithAttachments(
        {
          to: aliciEmail as string,
          subject: `Teklif ${teklif.teklifNo}${teklif.musteriAd ? ` — ${teklif.musteriAd}` : ''}`,
          html: `<p>Sayın ${teklif.musteriAd ?? 'yetkili'},</p><p><strong>${teklif.teklifNo}</strong> numaralı teklifimiz ektedir. İyi çalışmalar dileriz.</p>`,
          text: `${teklif.teklifNo} numaralı teklifimiz ektedir.`,
        },
        [{ filename: `${built.teklifNo}.pdf`, content: built.pdf, contentType: 'application/pdf' }],
      );
      await repoLogGonderim(id, 'email', aliciEmail ?? null, 'basarili', null, userId);
      await recordOfferCommunication(id,'email','sent',aliciEmail??null,userId,String(info.messageId??'')||null,null).catch((logErr)=>req.log.error({err:logErr},'crm_iletisim_hatasi_kaydedilemedi'));
      await repoMarkGonderildi(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'gonderim_hatasi';
      await repoLogGonderim(id, 'email', aliciEmail ?? null, 'hata', msg.slice(0, 900), userId);
      await recordOfferCommunication(id,'email','failed',aliciEmail??null,userId,null,msg.slice(0,900)).catch((logErr)=>req.log.error({err:logErr},'crm_iletisim_hatasi_kaydedilemedi'));
      if (err instanceof PdfUnavailableError) return reply.code(503).send({ error: { message: 'pdf_servisi_kullanilamiyor' } });
      req.log.error({ err: msg }, 'teklif_email_gonderim_hatasi');
      return reply.code(502).send({ error: { message: 'eposta_gonderilemedi', detail: msg } });
    }
  } else {
    // whatsapp_link / manuel — sadece kaydı tut + gönderildi işaretle
    await repoLogGonderim(id, kanal, null, 'basarili', null, userId);
    await recordOfferCommunication(id,kanal==='whatsapp_link'?'whatsapp':'manual','sent',null,userId,null,null).catch((logErr)=>req.log.error({err:logErr},'crm_iletisim_hatasi_kaydedilemedi'));
    await repoMarkGonderildi(id);
  }

  if (userId) await scheduleOfferFollowup(id,userId).catch((err)=>req.log.error({err},'teklif_takip_hatirlatmasi_olusturulamadi'));
  await emitAutomationEvent('offer_sent','offer',id,userId,{},`offer_sent:${id}`);

  const sent=await repoGetTeklif(id);await crmAudit(req,'CRM_OFFER_SENT','offers',id,teklif,sent);return sent;
};

// Public: token ile teklif PDF (siteden/WhatsApp linkiyle)
export const publicTeklifByToken: RouteHandler = async (req, reply) => {
  const { token } = req.params as { token: string };
  const found = await repoTeklifByToken(token);
  if (!found) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
  try {
    const built = await buildTeklifPdf(found.id);
    if (!built) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${built.teklifNo}.pdf"`);
    return reply.send(built.pdf);
  } catch (err) {
    if (err instanceof PdfUnavailableError) return reply.code(503).send({ error: { message: 'pdf_servisi_kullanilamiyor' } });
    throw err;
  }
};

export const updatePublicTeklifLink: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = publicLinkSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  const before = await repoGetTeklif(id);
  if (!before) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
  const updated = parsed.data.islem === 'yenile'
    ? await repoRefreshPublicToken(id, parsed.data.gun)
    : await repoRevokePublicToken(id);
  await crmAudit(req, parsed.data.islem === 'yenile' ? 'CRM_OFFER_PUBLIC_LINK_REFRESHED' : 'CRM_OFFER_PUBLIC_LINK_REVOKED', 'offers', id, before, updated);
  return updated;
};

// ── Teklif ───────────────────────────────────────────────────

export const listTeklifler: RouteHandler = async (req, reply) => {
  const parsed = teklifListQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
  const scope=crmScope(req),query=scope.isTeam?parsed.data:{...parsed.data,ownerUserId:scope.userId??undefined};const { items, total } = await repoListTeklifler(query);
  reply.header('x-total-count', String(total));
  return items;
};

export const getTeklif: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const dto = await repoGetTeklif(id);
  if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
  return dto;
};

export const createTeklif: RouteHandler = async (req, reply) => {
  const parsed = teklifCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  const dto = await repoCreateTeklif(parsed.data, userIdOf(req));
  return reply.code(201).send(dto);
};

export const updateTeklif: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = teklifPatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const dto = await repoPatchTeklif(id, parsed.data);
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    return dto;
  } catch (err) { return mapError(reply, err); }
};

export const deleteTeklif: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const ok = await repoDeleteTeklif(id);
    if (!ok) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    return reply.code(204).send();
  } catch (err) { return mapError(reply, err); }
};

export const sipariseDonustur: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed=sipariseDonusturSchema.safeParse(req.body ?? {});
  if(!parsed.success)return reply.code(400).send({error:{message:'gecersiz_istek_govdesi',issues:parsed.error.flatten()}});
  try {
    const before=await repoGetTeklif(id),result = await repoTeklifiSipariseDonustur(id,parsed.data.kalemIds);
    await emitAutomationEvent('order_created','order',result.siparisId,userIdOf(req),{offerId:id},`order_created:${result.siparisId}`);
    await crmAudit(req,'CRM_ORDER_CREATED','orders',result.siparisId,null,{...result,offerBefore:before});return reply.code(201).send(result);
  } catch (err) { return mapError(reply, err); }
};

export const setTeklifDurum: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = teklifDurumSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const before=await repoGetTeklif(id),dto = await repoSetTeklifDurum(id, parsed.data.durum, parsed.data.redNedeni, roleOf(req),userIdOf(req),parsed.data.kararNedeni);
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    if(parsed.data.durum==='kabul'){await emitAutomationEvent('offer_accepted','offer',id,userIdOf(req),{},`offer_accepted:${id}`);await crmAudit(req,'CRM_OFFER_ACCEPTED','offers',id,before,dto);}return dto;
  } catch (err) { return mapError(reply, err); }
};

// ── İskonto onay akışı ───────────────────────────────────────

export const onayaGonder: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const before=await repoGetTeklif(id);
    const dto = await repoOnayaGonder(id, roleOf(req));
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    await crmAudit(req,'CRM_OFFER_DISCOUNT_APPROVAL_REQUESTED','offers',id,before,dto);
    return dto;
  } catch (err) { return mapError(reply, err); }
};

export const onaylaIskonto: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const before=await repoGetTeklif(id);
    const dto = await repoOnaylaIskonto(id, userIdOf(req));
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    await crmAudit(req,'CRM_OFFER_DISCOUNT_APPROVED','offers',id,before,dto);return dto;
  } catch (err) { return mapError(reply, err); }
};

export const reddetIskonto: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = onayReddetSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const before=await repoGetTeklif(id);
    const dto = await repoReddetIskonto(id, parsed.data.neden);
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    await crmAudit(req,'CRM_OFFER_DISCOUNT_REJECTED','offers',id,before,dto);return dto;
  } catch (err) { return mapError(reply, err); }
};

// ── Revizyon (R0/R1/R2) ──────────────────────────────────────

export const createRevizyon: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = revizyonSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const dto = await repoCreateRevizyon(id, parsed.data.neden, userIdOf(req));
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    return reply.code(201).send(dto);
  } catch (err) { return mapError(reply, err); }
};

export const listRevizyonlar: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  return repoListRevizyonlar(id);
};

export const getRevizyon: RouteHandler = async (req, reply) => {
  const {id,revizyonNo}=req.params as {id:string;revizyonNo:string};
  const dto=await repoGetRevizyon(id,Number(revizyonNo));
  if(!dto)return reply.code(404).send({error:{message:'revizyon_bulunamadi'}});
  return dto;
};

export const getRevizyonPdf: RouteHandler = async (req, reply) => {
  const {id,revizyonNo}=req.params as {id:string;revizyonNo:string};
  const dto=await repoGetRevizyon(id,Number(revizyonNo));
  if(!dto)return reply.code(404).send({error:{message:'revizyon_bulunamadi'}});
  const snapshot=dto.snapshot as {teklif:TeklifPdfInput['teklif'];musteri:TeklifPdfInput['musteri']};
  const [firma,logoUrl]=await Promise.all([getErpCompanyProfile(),getErpBrandingLogoUrl()]);
  const pdf=await renderPdf(renderTeklifHtml({teklif:snapshot.teklif,musteri:snapshot.musteri,firma,logoDataUri:await resolveLogoDataUri(logoUrl)}));
  reply.header('Content-Type','application/pdf');
  reply.header('Content-Disposition',`inline; filename="${snapshot.teklif.teklifNo}-R${revizyonNo}.pdf"`);
  return reply.send(pdf);
};

// ── Kalemler ─────────────────────────────────────────────────

export const addKalem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = kalemCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const dto = await repoAddKalem(id, parsed.data);
    return reply.code(201).send(dto);
  } catch (err) { return mapError(reply, err); }
};

export const patchKalem: RouteHandler = async (req, reply) => {
  const { id, kalemId } = req.params as { id: string; kalemId: string };
  const parsed = kalemPatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    return await repoPatchKalem(id, kalemId, parsed.data);
  } catch (err) { return mapError(reply, err); }
};

export const deleteKalem: RouteHandler = async (req, reply) => {
  const { id, kalemId } = req.params as { id: string; kalemId: string };
  try {
    return await repoDeleteKalem(id, kalemId);
  } catch (err) { return mapError(reply, err); }
};

// ── Teklif talepleri ─────────────────────────────────────────

export const listTalepler: RouteHandler = async (req, reply) => {
  const parsed = talepListQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
  const scope=crmScope(req),query=scope.isTeam?parsed.data:{...parsed.data,ownerUserId:scope.userId??undefined};const { items, total } = await repoListTalepler(query);
  reply.header('x-total-count', String(total));
  return items;
};

export const getTalep: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const dto = await repoGetTalep(id);
  if (!dto) return reply.code(404).send({ error: { message: 'talep_bulunamadi' } });
  return dto;
};

export const updateTalep: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = talepPatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  const scope=crmScope(req),body=scope.isTeam?parsed.data:{...parsed.data,atananUserId:scope.userId};const dto = await repoPatchTalep(id, body);
  if (!dto) return reply.code(404).send({ error: { message: 'talep_bulunamadi' } });
  return dto;
};

export const donusturTalep: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = talepDonusturSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const result = await repoDonusturTalep(id, parsed.data, userIdOf(req));
    return reply.code(201).send(result);
  } catch (err) { return mapError(reply, err); }
};

// ── Public web intake ────────────────────────────────────────

const PENCERE_MS = 60_000;
const LIMIT = 5;
const ipHits = new Map<string, number[]>();

export const createTalepPublic: RouteHandler = async (req, reply) => {
  // Basit IP rate-limit (60sn'de 5)
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < PENCERE_MS);
  if (hits.length >= LIMIT) return reply.code(429).send({ error: { message: 'cok_fazla_istek' } });
  hits.push(now);
  ipHits.set(ip, hits);

  const parsed = talepPublicSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  // Honeypot doluysa botu sessizce başarılı say (kayıt açma)
  if (parsed.data.website) return reply.code(202).send({ ok: true });

  const rawKey = req.headers['x-idempotency-key'];
  const idempotencyKey = typeof rawKey === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawKey)
    ? rawKey : null;

  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 64);
  const { id, created } = await repoCreateTalepPublic(parsed.data, ipHash, idempotencyKey);
  if (created) await emitAutomationEvent('lead_created','lead',id,null,{source:'web'},`lead_created:${id}`);
  return reply.code(created ? 201 : 200).send({ ok: true, id, duplicate: !created });
};
