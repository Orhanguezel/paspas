import { createHash, randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '@/db/client';
import { makeAdminPermissionGuard } from '@/common/middleware/permissions';
import * as motor from './ihracat-motoru';
import { uygunlukHesapla } from './uygunluk';

type Row = RowDataPacket & Record<string, unknown>;
const hs = z.string().trim().regex(/^\d{6,12}$/);
const profileSchema = z.object({ sektor: z.string().trim().max(255).nullable().default(null), hsKodlari: z.array(hs).max(20), hedefUlkeler: z.array(z.string().trim().min(2).max(100)).max(40), aynaAdlari: z.array(z.string().trim().min(2).max(200)).max(10) });
const scanSchema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(100) });
const json = <T>(value: unknown, fallback: T): T => { try { return typeof value === 'string' ? JSON.parse(value) as T : value as T ?? fallback; } catch { return fallback; } };
const actor = (req: FastifyRequest) => String((req as FastifyRequest & { user?: { sub?: string } }).user?.sub ?? '') || null;
const identity = (name: string, country: string | null) => createHash('sha256').update(`${name.trim().toLocaleLowerCase('tr')}|${(country ?? '').trim().toLocaleLowerCase('tr')}`).digest('hex');
const asDate = (value: unknown) => { const parsed = new Date(String(value ?? '')); return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10); };

async function profile() {
  const [rows] = await pool.execute<Row[]>('SELECT * FROM firma_bulma_profili WHERE id=1');
  const row = rows[0];
  return { sektor: row?.sektor ? String(row.sektor) : null, hsKodlari: json<string[]>(row?.hs_kodlari_json, []), hedefUlkeler: json<string[]>(row?.hedef_ulkeler_json, []), aynaAdlari: json<string[]>(row?.ayna_adlari_json, []) };
}

function candidate(row: Row) {
  return { id: String(row.id), firmaAdi: String(row.firma_adi), ulke: row.ulke ? String(row.ulke) : null, hsKodlari: json<string[]>(row.hs_kodlari_json, []), sevkiyatSayisi: Number(row.sevkiyat_sayisi), tedarikciSayisi: Number(row.tedarikci_sayisi), sonSevkiyat: asDate(row.son_sevkiyat), uygunlukPuani: Number(row.uygunluk_puani), uygunlukNedenleri: json<string[]>(row.uygunluk_nedenleri_json, []), kaynak: json<string[]>(row.kaynak_json, []), durum: String(row.durum), crmMusteriId: row.crm_musteri_id ? String(row.crm_musteri_id) : null, createdAt: row.created_at };
}

export async function registerFirmaBulma(app: FastifyInstance) {
  const read = makeAdminPermissionGuard('admin.firma_bulma');
  const write = makeAdminPermissionGuard('admin.firma_bulma');

  app.get('/firma-bulma/durum', { preHandler: read }, async () => motor.motorDurumu());
  app.get('/firma-bulma/profil', { preHandler: read }, profile);
  app.put('/firma-bulma/profil', { preHandler: write }, async (req, reply) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_profil', issues: parsed.error.flatten() } });
    const input = parsed.data;
    await pool.execute(`INSERT INTO firma_bulma_profili (id,sektor,hs_kodlari_json,hedef_ulkeler_json,ayna_adlari_json,updated_by)
      VALUES (1,?,?,?,?,?) ON DUPLICATE KEY UPDATE sektor=VALUES(sektor),hs_kodlari_json=VALUES(hs_kodlari_json),hedef_ulkeler_json=VALUES(hedef_ulkeler_json),ayna_adlari_json=VALUES(ayna_adlari_json),updated_by=VALUES(updated_by)`,
      [input.sektor, JSON.stringify([...new Set(input.hsKodlari)]), JSON.stringify([...new Set(input.hedefUlkeler)]), JSON.stringify([...new Set(input.aynaAdlari)]), actor(req)]);
    return profile();
  });
  app.get('/firma-bulma/gtip-kaynaklari', { preHandler: read }, async () => {
    const sourceProducts = await motor.kaynakUrunGtipleri();
    const grouped = new Map<string, { code: string; productCount: number; productNames: string[]; ownShipments: number; observedCodes: string[]; descriptions: string[]; source: string }>();
    for (const product of sourceProducts) {
      const code = product.code.slice(0, 6);
      const item = grouped.get(code) ?? { code, productCount: 0, productNames: [], ownShipments: 0, observedCodes: [], descriptions: [], source: 'Sunplex doğrulanmış ürün kartı' };
      item.productCount += 1;
      if (item.productNames.length < 5) item.productNames.push(product.ad);
      grouped.set(code, item);
    }
    return { codes: [...grouped.values()].sort((a, b) => a.code.localeCompare(b.code)), sourceProductCount: sourceProducts.length, source: 'sunplex_erp.urunler', note: 'Bu kodlar Sunplex ürünlerine aittir; Paspas ürünlerine otomatik eşlenmez.' };
  });
  app.get('/firma-bulma/hs-ara', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ q: z.string().trim().min(2).max(60) }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    return motor.hsAra(parsed.data.q);
  });
  app.get('/firma-bulma/oneriler', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ q: z.string().trim().min(3).max(60) }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    return motor.oneriler(parsed.data.q);
  });
  app.get('/firma-bulma/ticaret-ara', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ q: z.string().trim().min(3).max(60), offset: z.coerce.number().int().min(0).default(0), role: z.enum(['all', 'alici', 'tedarikci']).default('all'), hsCodes: z.string().regex(/^\d{6,12}(,\d{6,12}){0,19}$/).optional(), hsCode: z.string().max(12).optional(), exporter: z.string().max(120).optional(), buyer: z.string().max(120).optional(), origin: z.string().max(120).optional(), destination: z.string().max(120).optional(), dateFrom: z.string().date().optional(), dateTo: z.string().date().optional() }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    return motor.ticaretAra(parsed.data);
  });
  app.get('/firma-bulma/ithalatcilar', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ hsCode: hs, countries: z.string().max(400).optional(), limit: z.coerce.number().int().min(1).max(200).default(50), offset: z.coerce.number().int().min(0).default(0) }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    return motor.ithalatcilar(parsed.data);
  });
  app.get('/firma-bulma/firma-detay', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ buyer: z.string().trim().min(2).max(255), country: z.string().max(120).optional(), role: z.enum(['alici', 'tedarikci']).default('alici'), shipmentsOffset: z.coerce.number().int().min(0).optional(), counterpartOffset: z.coerce.number().int().min(0).optional(), productOffset: z.coerce.number().int().min(0).optional() }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    return motor.firmaDetayi(parsed.data);
  });
  app.get('/firma-bulma/firma-bilgileri', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ name: z.string().trim().min(2).max(255), country: z.string().trim().max(120).optional() }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_firma_sorgusu' } });
    return motor.firmaBilgileri(parsed.data.name, parsed.data.country);
  });
  app.get('/firma-bulma/ayna/iz', { preHandler: read }, async () => {
    const saved = await profile();
    if (!saved.aynaAdlari.length) return { names: [], totals: null, spellings: [], buyers: [], timeline: [], products: [], shipments: [] };
    return motor.firmaAynasi(saved.aynaAdlari);
  });
  app.get('/firma-bulma/sektor-analizi', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ hsCode: hs, origin: z.string().trim().max(64).default('TURKEY') }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    const saved = await profile();
    return motor.sektorAnalizi(parsed.data.hsCode, parsed.data.origin, saved.aynaAdlari, { sektor: saved.sektor, hedefUlkeler: saved.hedefUlkeler });
  });
  app.post('/firma-bulma/profil-tara', { preHandler: write }, async (req, reply) => {
    const parsed = scanSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_tarama' } });
    const saved = await profile();
    if (!saved.hsKodlari.length) return reply.code(409).send({ error: { message: 'Önce doğrulanmış HS kodunu seçin.' } });
    const found = new Map<string, { name: string; country: string | null; hsCodes: Set<string>; shipments: number; suppliers: number; lastShipment: string | null; sources: Set<string> }>();
    const perCode = Math.min(100, Math.max(20, Math.ceil(parsed.data.limit / saved.hsKodlari.length) * 2));
    for (const code of saved.hsKodlari) {
      const result = await motor.ithalatcilar({ hsCode: code, countries: saved.hedefUlkeler.join(','), limit: perCode });
      for (const item of result.items) {
        const key = identity(item.buyerName, item.country);
        const current = found.get(key) ?? { name: item.buyerName, country: item.country, hsCodes: new Set<string>(), shipments: 0, suppliers: 0, lastShipment: null, sources: new Set<string>() };
        current.hsCodes.add(code); current.shipments += item.shipments; current.suppliers = Math.max(current.suppliers, item.supplierCount);
        const last = asDate(item.lastShipment); if (last && (!current.lastShipment || last > current.lastShipment)) current.lastShipment = last;
        current.sources.add(item.source); found.set(key, current);
      }
    }
    const results = [...found.entries()].sort((a, b) => b[1].shipments - a[1].shipments).slice(0, parsed.data.limit);
    for (const [key, item] of results) {
      const fit = uygunlukHesapla({ hsKodlari: [...item.hsCodes], profilHsKodlari: saved.hsKodlari, ulke: item.country, hedefUlkeler: saved.hedefUlkeler, sevkiyat: item.shipments, tedarikci: item.suppliers, sonSevkiyat: item.lastShipment });
      await pool.execute(`INSERT INTO firma_bulma_adaylari (id,kimlik_anahtari,firma_adi,ulke,hs_kodlari_json,sevkiyat_sayisi,tedarikci_sayisi,son_sevkiyat,uygunluk_puani,uygunluk_nedenleri_json,kaynak_json,created_by,updated_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE hs_kodlari_json=VALUES(hs_kodlari_json),sevkiyat_sayisi=VALUES(sevkiyat_sayisi),tedarikci_sayisi=VALUES(tedarikci_sayisi),son_sevkiyat=VALUES(son_sevkiyat),uygunluk_puani=VALUES(uygunluk_puani),uygunluk_nedenleri_json=VALUES(uygunluk_nedenleri_json),kaynak_json=VALUES(kaynak_json),updated_by=VALUES(updated_by)`,
        [randomUUID(), key, item.name, item.country, JSON.stringify([...item.hsCodes]), item.shipments, item.suppliers, item.lastShipment, fit.puan, JSON.stringify(fit.nedenler), JSON.stringify([...item.sources]), actor(req), actor(req)]);
    }
    return { bulunan: results.length, profil: saved };
  });
  app.get('/firma-bulma/potansiyeller', { preHandler: read }, async (req, reply) => {
    const parsed = z.object({ durum: z.enum(['tumu', 'aday', 'nitelikli', 'crm_aktarildi', 'elenmis']).default('tumu') }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu' } });
    const [rows] = await pool.execute<Row[]>(`SELECT * FROM firma_bulma_adaylari ${parsed.data.durum === 'tumu' ? '' : 'WHERE durum=?'} ORDER BY uygunluk_puani DESC,sevkiyat_sayisi DESC LIMIT 500`, parsed.data.durum === 'tumu' ? [] : [parsed.data.durum]);
    return { items: rows.map(candidate) };
  });
  app.patch('/firma-bulma/potansiyeller/:id/durum', { preHandler: write }, async (req, reply) => {
    const parsed = z.object({ durum: z.enum(['aday', 'nitelikli', 'elenmis']) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_durum' } });
    const id = String((req.params as { id: string }).id);
    await pool.execute('UPDATE firma_bulma_adaylari SET durum=?,updated_by=? WHERE id=? AND crm_musteri_id IS NULL', [parsed.data.durum, actor(req), id]);
    return { ok: true };
  });
  app.post('/firma-bulma/potansiyeller/:id/crm', { preHandler: write }, async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<Row[]>('SELECT * FROM firma_bulma_adaylari WHERE id=? FOR UPDATE', [id]);
      const row = rows[0];
      if (!row) { await connection.rollback(); return reply.code(404).send({ error: { message: 'aday_bulunamadi' } }); }
      if (row.crm_musteri_id) { await connection.rollback(); return { ok: true, musteriId: row.crm_musteri_id, zatenVardi: true }; }
      const [existing] = await connection.execute<Row[]>('SELECT id FROM musteriler WHERE LOWER(TRIM(ad))=LOWER(TRIM(?)) LIMIT 1', [row.firma_adi]);
      if (existing.length) { await connection.rollback(); return reply.code(409).send({ error: { message: 'Aynı ünvanlı CRM kaydı var; eşleştirmeyi müşteri kartından doğrulayın.' } }); }
      const customerId = randomUUID();
      const code = `POT-${customerId.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
      await connection.execute(`INSERT INTO musteriler (id,tur,musteri_durumu,kod,ad,sevkiyat_notu) VALUES (?,'musteri','aday',?,?,?)`,
        [customerId, code, row.firma_adi, `Firma Bulma · HS ${json<string[]>(row.hs_kodlari_json, []).join(', ')} · ${row.sevkiyat_sayisi} gümrük sevkiyatı. Ürün kullanımı doğrulanmadı.`]);
      await connection.execute(`UPDATE firma_bulma_adaylari SET crm_musteri_id=?,durum='crm_aktarildi',updated_by=? WHERE id=?`, [customerId, actor(req), id]);
      await connection.commit();
      return { ok: true, musteriId: customerId, zatenVardi: false };
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
  });
  app.get('/firma-bulma/adaylar', { preHandler: read }, async () => {
    const [rows] = await pool.execute<Row[]>('SELECT * FROM firma_bulma_adaylari WHERE crm_musteri_id IS NOT NULL ORDER BY updated_at DESC LIMIT 500');
    return { items: rows.map(candidate) };
  });
}
