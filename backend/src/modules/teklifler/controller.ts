// =============================================================
// FILE: src/modules/teklifler/controller.ts
// Teklif Modülü — HTTP route handler'ları
// =============================================================

import { createHash } from 'node:crypto';

import type { RouteHandler } from 'fastify';

import { repoGetById as repoGetMusteriById } from '@/modules/musteriler/repository';
import { getErpBrandingLogoUrl, getErpCompanyProfile } from '@/modules/siteSettings/service';

import { PdfUnavailableError, renderPdf, resolveLogoDataUri } from './pdf.service';
import { renderTeklifHtml } from './pdfTemplate';
import {
  repoAddKalem, repoCreateTalepPublic, repoCreateTeklif, repoDeleteKalem, repoDeleteTeklif,
  repoDonusturTalep, repoGetTalep, repoGetTeklif, repoListTalepler, repoListTeklifler,
  repoPatchKalem, repoPatchTalep, repoPatchTeklif, repoSetTeklifDurum, repoTeklifiSipariseDonustur,
} from './repository';
import {
  kalemCreateSchema, kalemPatchSchema, talepDonusturSchema, talepListQuerySchema,
  talepPatchSchema, talepPublicSchema, teklifCreateSchema, teklifDurumSchema,
  teklifListQuerySchema, teklifPatchSchema,
} from './validation';

function userIdOf(req: { user?: unknown }): string | null {
  return (req.user as { id?: string } | undefined)?.id ?? null;
}

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
    teklif_bulunamadi: 404,
    kalem_bulunamadi: 404,
    talep_bulunamadi: 404,
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
  const teklif = await repoGetTeklif(id);
  if (!teklif) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });

  const [company, logoUrl, musteriRow] = await Promise.all([
    getErpCompanyProfile(), getErpBrandingLogoUrl(), repoGetMusteriById(teklif.musteriId),
  ]);
  const logoDataUri = await resolveLogoDataUri(logoUrl);
  const html = renderTeklifHtml({
    teklif,
    musteri: musteriRow
      ? { ad: musteriRow.ad, adres: musteriRow.adres ?? null, telefon: musteriRow.telefon ?? null, email: null }
      : null,
    firma: company,
    logoDataUri,
  });

  try {
    const pdf = await renderPdf(html);
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${teklif.teklifNo}.pdf"`);
    return reply.send(pdf);
  } catch (err) {
    if (err instanceof PdfUnavailableError) {
      req.log.error({ err: err.message }, 'teklif_pdf_unavailable');
      return reply.code(503).send({ error: { message: 'pdf_servisi_kullanilamiyor' } });
    }
    throw err;
  }
};

// ── Teklif ───────────────────────────────────────────────────

export const listTeklifler: RouteHandler = async (req, reply) => {
  const parsed = teklifListQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
  const { items, total } = await repoListTeklifler(parsed.data);
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
  try {
    const result = await repoTeklifiSipariseDonustur(id);
    return reply.code(201).send(result);
  } catch (err) { return mapError(reply, err); }
};

export const setTeklifDurum: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = teklifDurumSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
  try {
    const dto = await repoSetTeklifDurum(id, parsed.data.durum, parsed.data.redNedeni);
    if (!dto) return reply.code(404).send({ error: { message: 'teklif_bulunamadi' } });
    return dto;
  } catch (err) { return mapError(reply, err); }
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
  const { items, total } = await repoListTalepler(parsed.data);
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
  const dto = await repoPatchTalep(id, parsed.data);
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

  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 64);
  const { id } = await repoCreateTalepPublic(parsed.data, ipHash);
  return reply.code(201).send({ ok: true, id });
};
