import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { sektorMakro } from './sektor-makro';

/**
 * ERP icinde calisan ihracat/gumruk arama motoru.
 *
 * Uygulama kodu bu repodadir. Gümrük kayıtları ayrı bir MySQL şemasında,
 * salt okunur kullanıcıyla erişilir. Kaynak aynı sunucuda ya da özel ağda
 * olabilir; CUSTOMS_DB_* ayarları bağlantıyı belirler.
 */

const ALICI_ULKE = "CASE WHEN source_file LIKE 'TURKEY/%' AND (buyer_country IS NULL OR buyer_country='TURKEY') THEN NULL ELSE buyer_country END";
const TEDARIKCI_ULKE = "COALESCE(origin_country, CASE WHEN source_file LIKE 'TURKEY/%' THEN 'TURKEY' END)";
// Yükleme ülkesi ve ürünün menşei aynı kavram değildir. Kaynak ticaret motorundaki gibi
// rota kanıtı varsa onu gösterir, yoksa kaynak kaydın menşe alanına döneriz.
const TRADE_DEPARTURE = `COALESCE(cr.departure_country, ${TEDARIKCI_ULKE})`;
const TRADE_ROUTE_JOIN = ' LEFT JOIN (SELECT record_id,departure_country,loading_port FROM customs_route_evidence) cr ON cr.record_id=r.id';
const YER_TUTUCULAR = ['N/A', 'NA', 'N.A.', 'UNKNOWN', 'UNKNOWN SHIPPER', '-', '--', '.', 'TO ORDER', 'TO THE ORDER', 'NULL', 'NULL NULL', 'NONE'];
const YER_TUTUCU_SQL = YER_TUTUCULAR.map((ad) => `'${ad.replaceAll("'", "''")}'`).join(',');
const FILTRELER = ['hsCode', 'exporter', 'buyer', 'origin', 'destination', 'dateFrom', 'dateTo', 'quantityMin', 'quantityMax', 'quantityUnit', 'weightMin', 'weightMax'] as const;
type FiltreAdi = typeof FILTRELER[number];
type Filtreler = Record<FiltreAdi, string>;

let havuz: Pool | null = null;
let firmaVeriHavuzu: Pool | null = null;

function ayarlar() {
  return {
    host: process.env.CUSTOMS_DB_HOST?.trim() || '',
    port: Number(process.env.CUSTOMS_DB_PORT || 3307),
    user: process.env.CUSTOMS_DB_USER?.trim() || '',
    password: process.env.CUSTOMS_DB_PASSWORD || '',
    database: process.env.CUSTOMS_DB_NAME?.trim() || 'ihracat_gumruk',
  };
}

function db(): Pool {
  const cfg = ayarlar();
  if (!cfg.host || !cfg.user || !cfg.password) throw new MotorYapilandirilmamis();
  if (!havuz) {
    havuz = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: Number(process.env.CUSTOMS_DB_CONNECTION_LIMIT || 5),
      connectTimeout: Number(process.env.CUSTOMS_DB_CONNECT_TIMEOUT_MS || 10_000),
      queueLimit: 0,
      timezone: 'Z',
      charset: 'utf8mb4',
    });
  }
  return havuz;
}

function firmaVeriDb(): Pool | null {
  const host = process.env.COMPANY_DATA_DB_HOST?.trim() || '';
  const user = process.env.COMPANY_DATA_DB_USER?.trim() || '';
  const password = process.env.COMPANY_DATA_DB_PASSWORD || '';
  if (!host || !user || !password) return null;
  if (!firmaVeriHavuzu) {
    firmaVeriHavuzu = mysql.createPool({
      host,
      port: Number(process.env.COMPANY_DATA_DB_PORT || 3308),
      user,
      password,
      database: process.env.COMPANY_DATA_DB_NAME?.trim() || 'teklifrota_motor',
      waitForConnections: true,
      connectionLimit: Number(process.env.COMPANY_DATA_DB_CONNECTION_LIMIT || 3),
      connectTimeout: Number(process.env.COMPANY_DATA_DB_CONNECT_TIMEOUT_MS || 10_000),
      queueLimit: 0,
      timezone: 'Z',
      charset: 'utf8mb4',
    });
  }
  return firmaVeriHavuzu;
}

export class MotorYapilandirilmamis extends Error {
  statusCode = 503;
  constructor() { super('gumruk_veri_havuzu_tanimsiz'); }
}

export async function motorDurumu() {
  const cfg = ayarlar();
  const kaynak = ['localhost', '127.0.0.1', '::1'].includes(cfg.host) ? 'yerel_gumruk_havuzu' : 'uzak_gumruk_havuzu';
  if (!cfg.host || !cfg.user || !cfg.password) return { yapilandirildi: false, kaynak, iletisimHavuzuHazir: false };
  await db().query('SELECT 1');
  const iletisimDb = firmaVeriDb();
  let iletisimHavuzuHazir = false;
  if (iletisimDb) {
    try { await iletisimDb.query('SELECT 1'); iletisimHavuzuHazir = true; } catch { /* Gümrük araması bağımsız çalışmaya devam eder. */ }
  }
  return { yapilandirildi: true, kaynak, iletisimHavuzuHazir };
}

/** Sunplex ürün kodları sadece kaynak kanıtı olarak okunur; Paspas ürünlerine yazılmaz. */
export async function kaynakUrunGtipleri() {
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT ad,gtip_kodu FROM sunplex_erp.urunler
      WHERE tenant_key='sunplex' AND aktif=1 AND tip IN ('mamul','ticari_mal')
        AND gtip_kodu IS NOT NULL AND TRIM(gtip_kodu)<>''`,
  );
  return rows.map((row) => ({ ad: String(row.ad), code: String(row.gtip_kodu).replace(/\D/g, '') }))
    .filter((row) => row.code.length >= 6 && row.code.length <= 12);
}

function temizSorgu(ham: unknown) {
  const metin = String(ham ?? '').trim();
  const rakam = /^[\d.\s]+$/.test(metin) ? metin.replace(/\D/g, '').slice(0, 12) : '';
  if (rakam) return { tur: rakam.length >= 6 ? 'gtip' as const : 'gtip_kisa' as const, deger: rakam };
  const firma = metin.replace(/[%_\\]/g, ' ').replace(/[^\p{L}\p{N}\s.&'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  return firma.length >= 3 ? { tur: 'firma' as const, deger: firma } : null;
}

function ay(deger: unknown) {
  if (!deger) return null;
  const tarih = deger instanceof Date ? deger : new Date(String(deger));
  return Number.isNaN(tarih.getTime()) ? null : `${tarih.getUTCFullYear()}-${String(tarih.getUTCMonth() + 1).padStart(2, '0')}`;
}

function like(deger: string) { return `%${deger.replace(/[!%_]/g, (c) => `!${c}`)}%`; }

/** CRM kartı için kaynak havuzunda salt okunur, adın ilk dört harfiyle aday arama. */
export async function crmFirmaAdaylari(name: string) {
  const cleaned = name.trim().replace(/\s+/g, ' ').slice(0, 160);
  const fourth = [...cleaned].reduce((state, char, index) => /[\p{L}\p{N}]/u.test(char) && state.count < 4 ? { count: state.count + 1, end: index + 1 } : state, { count: 0, end: 0 });
  if (fourth.count < 4) return { prefix: cleaned, matches: [], hasMore: false };
  const prefix = [...cleaned].slice(0, fourth.end).join('');
  const escaped = (value: string) => value.replace(/[!%_]/g, (char) => `!${char}`);
  const [rows] = await db().query<RowDataPacket[]>(`SELECT company_name,role,record_count,country,last_shipment
    FROM customs_company_dictionary WHERE company_name LIKE ? ESCAPE '!'
    ORDER BY CASE WHEN company_name=? THEN 0 WHEN company_name LIKE ? ESCAPE '!' THEN 1
      WHEN company_name LIKE ? ESCAPE '!' THEN 2 ELSE 3 END,record_count DESC,company_name
    LIMIT 41`, [`${escaped(prefix)}%`, cleaned, `${escaped(cleaned)}%`, `${escaped(cleaned.split(' ')[0])}%`]);
  const normalized = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
  const target = normalized(cleaned);
  return { prefix, hasMore: rows.length > 40, matches: rows.slice(0, 40).map(row => {
    const candidateName = String(row.company_name);
    const candidate = normalized(candidateName);
    return { name: candidateName, role: row.role === 'tedarikci' ? 'tedarikci' : 'alici', country: row.country ? String(row.country) : null,
      recordCount: Number(row.record_count), lastShipment: row.last_shipment ?? null,
      matchType: candidate === target ? 'exact' : candidate.startsWith(target) ? 'name_prefix' : 'first_four' };
  }) };
}

export async function oneriler(q: string) {
  // TENANT_SCOPE_REVIEWED: Bu sorgular ERP firmalar tablosuna değil, ayrı salt-okunur
  // ortak customs_* sözlüklerine gider; dönüşteki `firmalar` bir yanıt alanıdır.
  const metin = q.trim();
  if (metin.length < 3) return { gtip: [], firmalar: [] };
  const rakam = metin.replace(/\D/g, '');
  const saltRakam = /^[\d.\s]+$/.test(metin);
  const [gtip, firmalar] = await Promise.all([
    rakam.length >= 3
      ? db().query<RowDataPacket[]>('SELECT hs_code,description,record_count FROM customs_hs_dictionary WHERE hs_code LIKE ? ORDER BY record_count DESC,hs_code LIMIT 16', [`${rakam.slice(0, 12)}%`]).then(([rows]) => rows.filter((r) => /[1-9]/.test(String(r.hs_code))).slice(0, 8).map((r) => ({ kod: String(r.hs_code), aciklama: /^(null|n\/a|nan|undefined|-)$/i.test(String(r.description ?? '').trim()) ? null : String(r.description), sektor: null, kayit: Number(r.record_count) })))
      : Promise.resolve([]),
    !saltRakam
      ? db().query<RowDataPacket[]>('SELECT company_name,role,record_count,country FROM customs_company_dictionary WHERE company_name LIKE ? ORDER BY record_count DESC LIMIT 8', [`${metin.replace(/[%_]/g, '')}%`]).then(([rows]) => rows.map((r) => ({ ad: String(r.company_name), rol: r.role === 'tedarikci' ? 'tedarikci' as const : 'alici' as const, kayit: Number(r.record_count), ulke: r.country ? String(r.country) : null }))).catch((error) => String((error as { code?: string }).code) === 'ER_NO_SUCH_TABLE' ? [] : Promise.reject(error))
      : Promise.resolve([]),
  ]);
  return { gtip, firmalar };
}

export async function hsAra(q: string) {
  const rakam = q.replace(/\D/g, '');
  const kosul = rakam ? 'hs_code LIKE ? OR description LIKE ?' : 'description LIKE ?';
  const parametreler = rakam ? [`${rakam}%`, `%${q}%`] : [`%${q}%`];
  const [rows] = await db().query<RowDataPacket[]>(`SELECT hs_code,description,record_count FROM customs_hs_dictionary WHERE ${kosul} ORDER BY record_count DESC LIMIT 20`, parametreler);
  return { items: rows.map((r) => ({ hsCode: String(r.hs_code), description: r.description ? String(r.description) : null, recordCount: Number(r.record_count) })) };
}

function filtreleriCoz(query: Record<string, unknown>): Filtreler {
  const sonuc = Object.fromEntries(FILTRELER.map((ad) => [ad, String(query[ad] ?? '').trim()])) as Filtreler;
  if (Object.values(sonuc).some((v) => v.length > 120 || /[\x00-\x1f]/.test(v))) throw new Error('gecersiz_arama_filtresi');
  if (sonuc.hsCode && !/^\d{6,12}$/.test(sonuc.hsCode)) throw new Error('gecersiz_hs_filtresi');
  for (const ad of ['quantityMin', 'quantityMax', 'weightMin', 'weightMax'] as const) if (sonuc[ad] && !/^\d+(?:\.\d+)?$/.test(sonuc[ad])) throw new Error('gecersiz_sayi_filtresi');
  return sonuc;
}

function filtreKosulu(f: Filtreler) {
  const kosullar: string[] = [];
  const params: Array<string | number> = [];
  if (f.hsCode) { kosullar.push('r.hs_code=?'); params.push(f.hsCode); }
  if (f.exporter) { kosullar.push("r.exporter_name LIKE ? ESCAPE '!'"); params.push(like(f.exporter)); }
  if (f.buyer) { kosullar.push("r.buyer_name LIKE ? ESCAPE '!'"); params.push(like(f.buyer)); }
  if (f.origin) { kosullar.push(f.origin === '__unknown__' ? `NULLIF(${TRADE_DEPARTURE},'') IS NULL` : `${TRADE_DEPARTURE}=?`); if (f.origin !== '__unknown__') params.push(f.origin); }
  if (f.destination) { kosullar.push(f.destination === '__unknown__' ? `NULLIF(${ALICI_ULKE},'') IS NULL` : `${ALICI_ULKE}=?`); if (f.destination !== '__unknown__') params.push(f.destination); }
  if (f.dateFrom) { kosullar.push('r.shipment_date>=?'); params.push(f.dateFrom); }
  if (f.dateTo) { kosullar.push('r.shipment_date<=?'); params.push(f.dateTo); }
  if (f.quantityMin) { kosullar.push('NULLIF(r.total_quantity,0)>=?'); params.push(Number(f.quantityMin)); }
  if (f.quantityMax) { kosullar.push('NULLIF(r.total_quantity,0)<=?'); params.push(Number(f.quantityMax)); }
  if (f.weightMin) { kosullar.push('NULLIF(r.net_weight,0)>=?'); params.push(Number(f.weightMin)); }
  if (f.weightMax) { kosullar.push('NULLIF(r.net_weight,0)<=?'); params.push(Number(f.weightMax)); }
  // Eski havuzda birim kaniti yoktur; dolu birim filtresi sonuc dondurmez.
  return { sql: kosullar.length ? ` AND ${kosullar.join(' AND ')}` : '', params };
}

export async function ticaretAra(query: Record<string, unknown>) {
  const arama = temizSorgu(query.q);
  if (!arama || arama.tur === 'gtip_kisa') throw new Error(arama?.tur === 'gtip_kisa' ? 'gtip_en_az_alti_hane' : 'gecersiz_arama');
  const hsCodes = String(query.hsCodes ?? '').split(',').filter(Boolean);
  if (hsCodes.length > 20 || hsCodes.some((code) => !/^\d{6,12}$/.test(code))) throw new Error('gecersiz_hs_kodlari');
  const offset = Math.max(0, Number(query.offset) || 0);
  const role = query.role === 'alici' || query.role === 'tedarikci' ? query.role : 'all';
  const filters = filtreleriCoz(query);
  const ek = filtreKosulu(filters);
  const kapsam = hsCodes.length ? `(${hsCodes.map(() => 'r.hs_code LIKE ?').join(' OR ')})` : arama.tur === 'gtip' ? 'r.hs_code LIKE ?' : '(r.buyer_name LIKE ? OR r.exporter_name LIKE ?)';
  const kapsamParams = hsCodes.length ? hsCodes.map((code) => `${code}%`) : arama.tur === 'gtip' ? [`${arama.deger}%`] : [`${arama.deger}%`, `${arama.deger}%`];
  const filtered = `SELECT r.id,r.buyer_name,r.exporter_name,${ALICI_ULKE} destination,${TEDARIKCI_ULKE} origin,r.shipment_date,r.month_year,r.hs_code,r.total_quantity,r.net_weight,r.source_provider FROM customs_records r${TRADE_ROUTE_JOIN} WHERE ${kapsam}${ek.sql}`;
  const cte = `WITH filtered AS (${filtered}), ranked AS (
    SELECT 'alici' rol,buyer_name ad,destination ulke,id,shipment_date,COUNT(*) OVER(PARTITION BY buyer_name,destination) sevkiyat,ROW_NUMBER() OVER(PARTITION BY buyer_name,destination ORDER BY shipment_date DESC,id DESC) pos FROM filtered WHERE buyer_name NOT IN (${YER_TUTUCU_SQL})
    UNION ALL
    SELECT 'tedarikci' rol,exporter_name ad,origin ulke,id,shipment_date,COUNT(*) OVER(PARTITION BY exporter_name,origin) sevkiyat,ROW_NUMBER() OVER(PARTITION BY exporter_name,origin ORDER BY shipment_date DESC,id DESC) pos FROM filtered WHERE exporter_name IS NOT NULL AND exporter_name NOT IN (${YER_TUTUCU_SQL})
  ), firms AS (SELECT * FROM ranked WHERE pos=1)`;
  const params = [...kapsamParams, ...ek.params];
  const roleSql = role === 'all' ? '' : ' WHERE rol=?';
  const roleParams = role === 'all' ? [] : [role];
  const [[firms], [summaries], [countryRows], [hsRows]] = await Promise.all([
    db().query<RowDataPacket[]>(`${cte} SELECT * FROM firms${roleSql} ORDER BY sevkiyat DESC,rol,ad,ulke LIMIT 51 OFFSET ?`, [...params, ...roleParams, offset]),
    db().query<RowDataPacket[]>(`${cte} SELECT COUNT(*) total,COALESCE(SUM(rol='alici'),0) buyers,COALESCE(SUM(rol='tedarikci'),0) suppliers,COUNT(DISTINCT NULLIF(ulke,'')) countries,MAX(shipment_date) lastShipment,(SELECT COUNT(*) FROM filtered) matchingRecords,(SELECT COUNT(*) FROM filtered WHERE NULLIF(TRIM(destination),'') IS NULL) unknownDestinations FROM firms`, params),
    db().query<RowDataPacket[]>(`SELECT ${TRADE_DEPARTURE} origin,${ALICI_ULKE} destination FROM customs_records r${TRADE_ROUTE_JOIN} WHERE ${kapsam} GROUP BY origin,destination`, kapsamParams),
    db().query<RowDataPacket[]>(`SELECT hs_code code,MAX(NULLIF(TRIM(hs_description),'')) description,COUNT(*) records FROM customs_records r WHERE ${kapsam} GROUP BY hs_code ORDER BY hs_code`, kapsamParams),
  ]);
  const secilen = firms.slice(0, 50);
  const ids = secilen.map((r) => String(r.id));
  const [shipments] = ids.length ? await db().query<RowDataPacket[]>(`SELECT r.id,r.shipment_date,r.month_year,r.buyer_name,${ALICI_ULKE} buyer_country,r.exporter_name,${TEDARIKCI_ULKE} origin_country,cr.departure_country,cr.loading_port,r.hs_code,r.total_quantity,r.net_weight,r.source_provider FROM customs_records r${TRADE_ROUTE_JOIN} WHERE r.id IN (${ids.map(() => '?').join(',')})`, ids) : [[] as RowDataPacket[]];
  const shipmentById = new Map(shipments.map((r) => [String(r.id), { id: String(r.id), date: r.shipment_date ?? null, period: r.month_year ?? null, buyer: String(r.buyer_name), buyerCountry: r.buyer_country ? String(r.buyer_country) : null, departureCountry: r.departure_country ? String(r.departure_country) : null, loadingPort: r.loading_port ? String(r.loading_port) : null, exporter: r.exporter_name ? String(r.exporter_name) : null, originCountry: r.origin_country ? String(r.origin_country) : null, hsCode: String(r.hs_code), quantity: Number(r.total_quantity) || null, quantityUnit: null, netWeight: Number(r.net_weight) || null }]));
  const summaryRow = summaries[0] ?? {};
  const summary = { total: Number(summaryRow.total ?? 0), buyers: Number(summaryRow.buyers ?? 0), suppliers: Number(summaryRow.suppliers ?? 0), countries: Number(summaryRow.countries ?? 0), lastShipmentMonth: ay(summaryRow.lastShipment) };
  const total = role === 'alici' ? summary.buyers : role === 'tedarikci' ? summary.suppliers : summary.total;
  return {
    sorgu: hsCodes.length ? hsCodes.join(', ') : arama.deger, tur: arama.tur, role, total, summary, filters,
    destinationCoverage: { totalRecords: Number(summaryRow.matchingRecords ?? 0), knownRecords: Number(summaryRow.matchingRecords ?? 0) - Number(summaryRow.unknownDestinations ?? 0), unknownRecords: Number(summaryRow.unknownDestinations ?? 0) },
    facets: { origins: [...new Set(countryRows.map((r) => r.origin).filter(Boolean).map(String))].sort(), destinations: [...new Set(countryRows.map((r) => r.destination).filter(Boolean).map(String))].sort(), hsCodes: hsRows.map((r) => ({ code: String(r.code), description: r.description ? String(r.description) : null, sector: null, count: Number(r.records) })) },
    sinir: 50, offset, dahaFazlaVar: firms.length > 50, nextOffset: firms.length > 50 ? offset + 50 : null,
    sonuclar: secilen.map((r) => ({ rol: r.rol, ad: String(r.ad), ulke: r.ulke ? String(r.ulke) : null, ulkeKodu: null, sevkiyat: Number(r.sevkiyat), sonSevkiyatAyi: ay(r.shipment_date), lastShipment: shipmentById.get(String(r.id)) ?? null })),
  };
}

export async function ithalatcilar(query: { hsCode: string; countries?: string; limit?: number; offset?: number }) {
  const hs = query.hsCode.replace(/\D/g, '');
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
  const offset = Math.max(0, Number(query.offset) || 0);
  const countries = String(query.countries ?? '').split(',').map((v) => v.trim()).filter(Boolean).slice(0, 40);
  const where = ['hs_code LIKE ?', `buyer_name NOT IN (${YER_TUTUCU_SQL})`];
  const params: unknown[] = [`${hs}%`];
  if (countries.length) { where.push(`${ALICI_ULKE} IN (${countries.map(() => '?').join(',')})`); params.push(...countries); }
  const [rows] = await db().query<RowDataPacket[]>(`SELECT buyer_name,${ALICI_ULKE} buyer_country,COUNT(*) shipments,SUM(total_value) total_value,SUM(net_weight) net_weight,MAX(shipment_date) last_shipment,COUNT(DISTINCT exporter_name) supplier_count,SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT exporter_name ORDER BY exporter_name SEPARATOR '||'),'||',3) top_suppliers FROM customs_records WHERE ${where.join(' AND ')} GROUP BY buyer_name,${ALICI_ULKE} ORDER BY shipments DESC,total_value DESC LIMIT ? OFFSET ?`, [...params, limit + 1, offset]);
  const [summaryRows] = await db().query<RowDataPacket[]>(`SELECT COUNT(*) records,COUNT(DISTINCT buyer_name) buyers,COUNT(DISTINCT ${ALICI_ULKE}) countries,MIN(shipment_date) first_date,MAX(shipment_date) last_date FROM customs_records WHERE ${where.join(' AND ')}`, params);
  const summary = summaryRows[0] ?? {};
  return { query: { hsCode: hs, variants: [hs], countries }, bosSonuc: null, marketFilterRelaxed: false, page: { limit, offset, hasMore: rows.length > limit }, summary: { records: Number(summary.records ?? 0), buyers: Number(summary.buyers ?? 0), countries: Number(summary.countries ?? 0), firstDate: summary.first_date ?? null, lastDate: summary.last_date ?? null }, items: rows.slice(0, limit).map((r) => ({ buyerName: String(r.buyer_name), country: r.buyer_country ? String(r.buyer_country) : null, shipments: Number(r.shipments), totalValue: Number(r.total_value), netWeight: Number(r.net_weight), lastShipment: r.last_shipment ?? null, supplierCount: Number(r.supplier_count), topSuppliers: r.top_suppliers ? String(r.top_suppliers).split('||') : [], source: 'Gümrük veri havuzu' })) };
}

export async function firmaDetayi(query: Record<string, unknown>) {
  const name = String(query.buyer ?? '').trim();
  const country = String(query.country ?? '').trim();
  const role = query.role === 'tedarikci' ? 'tedarikci' : 'alici';
  const nameColumn = role === 'tedarikci' ? 'exporter_name' : 'buyer_name';
  const countryColumn = role === 'tedarikci' ? TEDARIKCI_ULKE : ALICI_ULKE;
  const counterpart = role === 'tedarikci' ? 'buyer_name' : 'exporter_name';
  const counterpartCountry = role === 'tedarikci' ? ALICI_ULKE : TEDARIKCI_ULKE;
  const where = [`${nameColumn}=?`]; const params: unknown[] = [name];
  if (country) { where.push(`${countryColumn}=?`); params.push(country); }
  const clause = where.join(' AND ');
  const shipmentOffset = Math.max(0, Number(query.shipmentsOffset) || 0), counterpartOffset = Math.max(0, Number(query.counterpartOffset) || 0), productOffset = Math.max(0, Number(query.productOffset) || 0);
  const counterpartSearch = String(query.counterpartSearch ?? '').trim().slice(0, 100), productSearch = String(query.productSearch ?? '').trim().slice(0, 100);
  const counterpartClause = `${clause}${counterpartSearch ? ` AND ${counterpart} LIKE ? ESCAPE '!'` : ''}`, counterpartParams = counterpartSearch ? [...params, like(counterpartSearch)] : params;
  const productClause = `${clause}${productSearch ? " AND (hs_code LIKE ? ESCAPE '!' OR hs_description LIKE ? ESCAPE '!')" : ''}`, productParams = productSearch ? [...params, like(productSearch), like(productSearch)] : params;
  const [[totals], [timeline], [counterparts], [counterpartTotal], [products], [productTotal], [shipments]] = await Promise.all([
    db().query<RowDataPacket[]>(`SELECT COUNT(*) shipments,SUM(net_weight) net_weight,MIN(shipment_date) first_date,MAX(shipment_date) last_date,COUNT(DISTINCT ${counterpart}) suppliers,COUNT(DISTINCT hs_code) products FROM customs_records WHERE ${clause}`, params),
    db().query<RowDataPacket[]>(`SELECT DATE_FORMAT(shipment_date,'%Y-%m') period,COUNT(*) shipments,SUM(net_weight) net_weight FROM customs_records WHERE ${clause} AND shipment_date IS NOT NULL GROUP BY period ORDER BY period`, params),
    db().query<RowDataPacket[]>(`SELECT ${counterpart} name,${counterpartCountry} country,COUNT(*) shipments,MAX(shipment_date) last_shipment FROM customs_records WHERE ${counterpartClause} GROUP BY ${counterpart},country ORDER BY shipments DESC,name LIMIT 20 OFFSET ?`, [...counterpartParams, counterpartOffset]),
    db().query<RowDataPacket[]>(`SELECT COUNT(*) total FROM (SELECT ${counterpart},${counterpartCountry} FROM customs_records WHERE ${counterpartClause} GROUP BY ${counterpart},${counterpartCountry}) x`, counterpartParams),
    db().query<RowDataPacket[]>(`SELECT hs_code,MIN(NULLIF(TRIM(hs_description),'')) description,COUNT(*) shipments FROM customs_records WHERE ${productClause} GROUP BY hs_code ORDER BY shipments DESC,hs_code LIMIT 20 OFFSET ?`, [...productParams, productOffset]),
    db().query<RowDataPacket[]>(`SELECT COUNT(DISTINCT hs_code) total FROM customs_records WHERE ${productClause}`, productParams),
    db().query<RowDataPacket[]>(`SELECT id,shipment_date,month_year,buyer_name,buyer_country,exporter_name,${TEDARIKCI_ULKE} origin_country,hs_code,hs_description,total_quantity,net_weight,source_provider FROM customs_records WHERE ${clause} ORDER BY shipment_date DESC,id DESC LIMIT 20 OFFSET ?`, [...params, shipmentOffset]),
  ]);
  const total = Number(totals[0]?.shipments ?? 0);
  const matches = [{ role, name, country: country || null, shipments: total, hsCodes: products.map((r) => String(r.hs_code)) }];
  return {
    companyMatch: { status: total ? 'matched' : 'not_found', checkedAt: new Date().toISOString(), matches, candidates: [] },
    identity: null, profileEvidence: [], tradeAnalysis: { basis: 'source_records', totalRecords: total }, coverage: { countUnit: 'source_record', shipmentIdentityVerified: false, notice: 'Sayılar kaynak gümrük kayıtlarını gösterir.' },
    counterpartPage: { offset: counterpartOffset, limit: 20, total: Number(counterpartTotal[0]?.total ?? 0), hasMore: counterpartOffset + counterparts.length < Number(counterpartTotal[0]?.total ?? 0), search: counterpartSearch },
    productPage: { offset: productOffset, limit: 20, total: Number(productTotal[0]?.total ?? 0), hasMore: productOffset + products.length < Number(productTotal[0]?.total ?? 0), search: productSearch },
    buyer: { name, country: country || null }, totals: { shipments: total, totalValue: null, netWeight: totals[0]?.net_weight == null ? null : Number(totals[0].net_weight), firstDate: totals[0]?.first_date ?? null, lastDate: totals[0]?.last_date ?? null, suppliers: Number(totals[0]?.suppliers ?? 0), products: Number(totals[0]?.products ?? 0) },
    sourceLinks: { status: 'unavailable', items: [], reason: 'Kaynak dosya bağlantıları bu ERP görünümünde yayımlanmıyor.' },
    shipments: { items: shipments.map((r) => ({ id: String(r.id), date: r.shipment_date ?? null, period: r.month_year ?? null, buyer: String(r.buyer_name), buyerCountry: r.buyer_country ? String(r.buyer_country) : null, exporter: r.exporter_name ? String(r.exporter_name) : null, originCountry: r.origin_country ? String(r.origin_country) : null, hsCode: String(r.hs_code), description: r.hs_description ? String(r.hs_description) : null, quantity: Number(r.total_quantity) || null, quantityUnit: null, netWeight: Number(r.net_weight) || null, source: r.source_provider ? String(r.source_provider) : null })), offset: shipmentOffset, limit: 20, total, hasMore: shipmentOffset + shipments.length < total },
    timeline: timeline.map((r) => ({ period: String(r.period), shipments: Number(r.shipments), netWeight: Number(r.net_weight) })),
    suppliers: counterparts.map((r) => ({ name: String(r.name), country: r.country ? String(r.country) : null, shipments: Number(r.shipments), lastShipment: r.last_shipment ?? null })),
    products: products.map((r) => ({ hsCode: String(r.hs_code), description: r.description ? String(r.description) : null, shipments: Number(r.shipments) })), directory: null,
  };
}

type FirmaBilgisiGirdisi = { name: string; country?: string | null };
type BilinenIletisim = {
  companyName: string; country: string | null; domain: string | null; website: string | null;
  emails: string[]; phones: string[]; people: Array<{ fullName: string | null; title: string | null; email: string | null }>;
  address: string | null; logoUrl: string | null;
  socialLinks: Array<{ platform: string | null; url: string }>;
  sourceUrls: string[]; sources: string[]; enrichedAt: string | null; errorMessage: string | null;
  status: 'ready' | 'pending' | 'failed';
};

function jsonListe(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function eposta(value: unknown) {
  const clean = String(value ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : null;
}
function alan(value: unknown) {
  const clean = String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return clean || null;
}
function ayniKimlik(input: FirmaBilgisiGirdisi, row: Record<string, unknown>) {
  if (String(row.company_name ?? row.name ?? '').trim().toLocaleLowerCase('tr') !== input.name.trim().toLocaleLowerCase('tr')) return false;
  const wanted = String(input.country ?? '').trim().toLocaleUpperCase('tr');
  const actual = String(row.country ?? '').trim().toLocaleUpperCase('tr');
  return !wanted || !actual || wanted === actual;
}
async function guvenliSorgu(sql: string, params: unknown[]) {
  const veriDb = firmaVeriDb();
  if (!veriDb) return [];
  try { const [rows] = await veriDb.query<RowDataPacket[]>(sql, params); return rows; }
  catch (error) {
    const code = String((error as { code?: string }).code ?? '');
    if (['ER_NO_SUCH_TABLE', 'ER_TABLEACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_BAD_FIELD_ERROR'].includes(code)) return [];
    throw error;
  }
}

/**
 * Radar'ın ortak iletişim havuzunu salt okunur kullanır. Birleştirme yalnız tam
 * unvan + uyumlu ülke ile yapılır; benzer adlı iki firma asla sessizce birleşmez.
 * Bastırılmış/teslim edilemez e-postalar sonuçlara alınmaz.
 */
export async function firmaBilgileriToplu(companies: FirmaBilgisiGirdisi[]) {
  const inputs = companies.map((item) => ({ name: item.name.trim(), country: item.country?.trim() || null })).filter((item) => item.name.length >= 2).slice(0, 200);
  const names = [...new Set(inputs.map((item) => item.name))];
  if (!names.length) return new Map<number, BilinenIletisim>();
  const marks = names.map(() => '?').join(',');
  const [enrichment, directory] = await Promise.all([
    guvenliSorgu(`SELECT company_name,country,domain,website,emails,phones,contact_people,social_links,logo_url,address,status,error_message,source_urls,enriched_at FROM company_enrichment WHERE company_name IN (${marks})`, names),
    guvenliSorgu(`SELECT name company_name,country,domain,website,emails,phones,NULL contact_people,NULL social_links,NULL logo_url,NULL address,'ready' status,NULL error_message,NULL source_urls,NULL enriched_at FROM discovery_companies WHERE name IN (${marks})`, names),
  ]);
  const domains = [...new Set([...enrichment, ...directory].map((row) => alan(row.domain)).filter((item): item is string => Boolean(item)))];
  const poolRows = await guvenliSorgu(
    `SELECT p.company_name,p.country,p.domain,p.email,p.contact_name,p.source,p.confidence
       FROM email_pool p LEFT JOIN email_suppression s ON s.email=p.email
      WHERE s.email IS NULL AND p.deliverability<>'undeliverable'
        AND (p.company_name IN (${marks})${domains.length ? ` OR p.domain IN (${domains.map(() => '?').join(',')})` : ''})
      ORDER BY p.confidence DESC`,
    [...names, ...domains],
  );
  const result = new Map<number, BilinenIletisim>();
  inputs.forEach((input, index) => {
    const rows = [...enrichment, ...directory].filter((row) => ayniKimlik(input, row));
    const rowDomains = new Set(rows.map((row) => alan(row.domain)).filter(Boolean));
    const mails = poolRows.filter((row) => ayniKimlik(input, row) || (alan(row.domain) && rowDomains.has(alan(row.domain))));
    const emails = [...new Set([...rows.flatMap((row) => jsonListe(row.emails).map(eposta)), ...mails.map((row) => eposta(row.email))].filter((item): item is string => Boolean(item)))];
    const phones = [...new Set(rows.flatMap((row) => jsonListe(row.phones).map(String)).map((item) => item.trim()).filter(Boolean))];
    const people = rows.flatMap((row) => jsonListe(row.contact_people)).map((person) => {
      if (typeof person === 'string') return { fullName: person, title: null, email: null };
      const value = person && typeof person === 'object' ? person as Record<string, unknown> : {};
      return { fullName: String(value.fullName ?? value.name ?? '').trim() || null, title: String(value.title ?? value.role ?? '').trim() || null, email: eposta(value.email) };
    });
    const socialLinks = rows.flatMap((row) => jsonListe(row.social_links)).map((entry) => {
      if (typeof entry === 'string') return { platform: null, url: entry.trim() };
      const value = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
      return { platform: String(value.platform ?? value.type ?? '').trim() || null, url: String(value.url ?? value.href ?? '').trim() };
    }).filter((entry) => /^https?:\/\//i.test(entry.url));
    const sourceUrls = [...new Set(rows.flatMap((row) => jsonListe(row.source_urls).map(String)).map((item) => item.trim()).filter((item) => /^https?:\/\//i.test(item)))];
    for (const mail of mails) if (mail.contact_name) people.push({ fullName: String(mail.contact_name), title: null, email: eposta(mail.email) });
    const primary = rows.find((row) => row.website || row.domain || row.address || row.logo_url) ?? rows[0];
    if (!primary && !emails.length && !phones.length) return;
    result.set(index, {
      companyName: input.name, country: input.country, domain: alan(primary?.domain),
      website: primary?.website ? String(primary.website) : (alan(primary?.domain) ? `https://${alan(primary?.domain)}` : null),
      emails, phones, people, address: primary?.address ? String(primary.address) : null,
      logoUrl: primary?.logo_url ? String(primary.logo_url) : null,
      socialLinks: [...new Map(socialLinks.map((item) => [item.url, item])).values()], sourceUrls,
      sources: [...new Set([rows.some((row) => enrichment.includes(row)) ? 'tarama' : null, rows.some((row) => directory.includes(row)) ? 'dizin' : null, mails.length ? 'eposta_havuzu' : null].filter((item): item is string => Boolean(item)))],
      enrichedAt: primary?.enriched_at ? new Date(String(primary.enriched_at)).toISOString() : null,
      errorMessage: primary?.error_message ? String(primary.error_message) : null,
      status: emails.length || phones.length || primary?.website ? 'ready' : primary?.status === 'failed' ? 'failed' : 'pending',
    });
  });
  return result;
}

export async function firmaBilgileri(name: string, country?: string | null) {
  const items = await firmaBilgileriToplu([{ name, country }]);
  return { items: { [name]: items.get(0) ?? null } };
}

const hukukiEkler = new Set(['san','tic','ltd','sti','ve','as','a.s','sanayi','ticaret','limited','sirketi','anonim','ith','ihr','dis','co','inc','llc','gmbh']);
function firmaOnEkleri(names:string[]) {
  const out=new Set<string>();
  for(const raw of names){const name=raw.trim();if(!name)continue;out.add(name);const words=name.split(/\s+/);if(words.length>=3&&!hukukiEkler.has(words[1].toLocaleLowerCase('tr')))out.add(words.slice(0,2).join(' '));}
  return [...out].slice(0,20);
}

/** Firma Aynası: kiracının kendi ihracat izini aynı gümrük havuzunda bulur. */
export async function firmaAynasiUrunleri(names: string[]) {
  const variants = firmaOnEkleri(names);
  if (!variants.length) return [];
  const clause = variants.map(() => 'exporter_name LIKE ?').join(' OR ');
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT hs_code hsCode,MIN(NULLIF(TRIM(hs_description),'')) description,COUNT(*) shipments
       FROM customs_records WHERE ${clause}
      GROUP BY hs_code ORDER BY shipments DESC LIMIT 200`,
    variants.map((name) => `${name}%`),
  );
  return rows.map((row) => ({
    hsCode: String(row.hsCode),
    description: row.description ? String(row.description) : null,
    shipments: Number(row.shipments),
  }));
}

export async function firmaAynasi(names:string[]) {
  const variants=firmaOnEkleri(names);
  if(!variants.length) throw new Error('firma_adi_gerekli');
  const clause=variants.map(()=>"exporter_name LIKE ?").join(' OR '),params=variants.map((n)=>`${n}%`);
  const [[spellings],[buyers],[timeline],[products],[totals],[shipments]]=await Promise.all([
    db().query<RowDataPacket[]>(`SELECT exporter_name name,COUNT(*) shipments FROM customs_records WHERE ${clause} GROUP BY exporter_name ORDER BY shipments DESC LIMIT 15`,params),
    db().query<RowDataPacket[]>(`SELECT buyer_name name,${ALICI_ULKE} country,COUNT(*) shipments,SUM(total_value) totalValue,MIN(shipment_date) firstDate,MAX(shipment_date) lastDate FROM customs_records WHERE ${clause} GROUP BY buyer_name,${ALICI_ULKE} ORDER BY shipments DESC LIMIT 100`,params),
    db().query<RowDataPacket[]>(`SELECT YEAR(shipment_date) year,COUNT(*) shipments,SUM(total_value) totalValue FROM customs_records WHERE (${clause}) AND shipment_date IS NOT NULL GROUP BY YEAR(shipment_date) ORDER BY year`,params),
    db().query<RowDataPacket[]>(`SELECT hs_code hsCode,MIN(NULLIF(TRIM(hs_description),'')) description,COUNT(*) shipments FROM customs_records WHERE ${clause} GROUP BY hs_code ORDER BY shipments DESC LIMIT 20`,params),
    db().query<RowDataPacket[]>(`SELECT COUNT(*) shipments,COUNT(DISTINCT buyer_name) buyers,COUNT(DISTINCT ${ALICI_ULKE}) markets,SUM(total_value) totalValue,MIN(shipment_date) firstDate,MAX(shipment_date) lastDate FROM customs_records WHERE ${clause}`,params),
    db().query<RowDataPacket[]>(`SELECT shipment_date date,buyer_name buyer,${ALICI_ULKE} country,hs_code hsCode,hs_description description,total_value totalValue,total_quantity quantity,net_weight netWeight,origin_country origin FROM customs_records WHERE ${clause} ORDER BY shipment_date DESC LIMIT 50`,params),
  ]);
  const t=totals[0]??{};
  const contacts=await firmaBilgileriToplu(buyers.map(r=>({name:String(r.name),country:r.country?String(r.country):null})));
  return {names,spellings:spellings.map(r=>({name:String(r.name),shipments:Number(r.shipments)})),totals:{shipments:Number(t.shipments??0),buyers:Number(t.buyers??0),markets:Number(t.markets??0),totalValue:Number(t.totalValue??0),firstDate:t.firstDate??null,lastDate:t.lastDate??null},buyers:buyers.map((r,index)=>({name:String(r.name),country:r.country?String(r.country):null,shipments:Number(r.shipments),totalValue:Number(r.totalValue??0),firstDate:r.firstDate??null,lastDate:r.lastDate??null,contact:contacts.get(index)??null})),timeline:timeline.map(r=>({year:Number(r.year),shipments:Number(r.shipments),totalValue:Number(r.totalValue??0)})),products:products.map(r=>({hsCode:String(r.hsCode),description:r.description?String(r.description):null,shipments:Number(r.shipments)})),shipments:shipments.map(r=>({date:r.date??null,buyer:String(r.buyer),country:r.country?String(r.country):null,hsCode:String(r.hsCode),description:r.description?String(r.description):null,totalValue:Number(r.totalValue??0),quantity:Number(r.quantity)||null,netWeight:Number(r.netWeight)||null,origin:r.origin?String(r.origin):null}))};
}

const regionNames=new Intl.DisplayNames(['en'],{type:'region'});
const countryAliases:Record<string,string>={USA:'US','UNITED STATES OF AMERICA':'US',UK:'GB','GREAT BRITAIN':'GB',TURKEY:'TR',TURKIYE:'TR','TÜRKİYE':'TR',RUSSIA:'RU','RUSSIAN FEDERATION':'RU',UAE:'AE','UNITED ARAB EMIRATES':'AE','SOUTH KOREA':'KR','KOREA':'KR','VIET NAM':'VN',VIETNAM:'VN',IRAN:'IR',TAIWAN:'TW'};
function sektorUlkeKodu(value:unknown){
  const raw=String(value??'').trim();if(!raw)return null;const upper=raw.toUpperCase();if(/^[A-Z]{2}$/.test(upper))return upper;if(countryAliases[upper])return countryAliases[upper];
  for(let a=65;a<=90;a+=1)for(let b=65;b<=90;b+=1){const code=String.fromCharCode(a,b);if(regionNames.of(code)?.toUpperCase()===upper)return code;}
  return null;
}
const sayi=(value:unknown)=>Math.max(0,Number(value)||0);
const kaynaklar=(value:unknown)=>String(value??'').split(',').map((item)=>item.trim()).filter(Boolean).sort();

/** Radar'daki tam Sektör Analizi: iki dönem, rekabet, akış ve yatırım ön incelemesi. */
export async function sektorAnalizi(hsCode:string,origin:string,names:string[],profile?:{sektor:string|null;hedefUlkeler:string[]}) {
  const hs=hsCode.replace(/\D/g,'').slice(0,6);if(hs.length<6)throw new Error('hs_en_az_alti_hane');
  const [[bound]]=await db().query<RowDataPacket[]>('SELECT MAX(shipment_date) latest FROM customs_records WHERE hs_code LIKE ? AND shipment_date<CURRENT_DATE+INTERVAL 1 DAY',[`${hs}%`]);
  const originCode=sektorUlkeKodu(origin);
  const base={status:'empty' as const,profile:{name:names[0]||'Şirket',country:originCode,city:null,sector:profile?.sektor??null,hsCode:hs,targets:(profile?.hedefUlkeler??[]).map(sektorUlkeKodu).filter((item):item is string=>Boolean(item)),declaredMarkets:[] as string[]},origin,originCode,scenario:false,hsCode:hs,period:null,computedAt:new Date().toISOString(),ownHistory:null,cache:{hit:false},markets:[],monthly:[],flows:[],coverage:{records:0,located:0,unknownDestination:0,unknownOrigin:0,domesticRecords:0,excludedLatestMonth:true},investments:[],macroStatus:'not-requested' as const,notes:[] as string[]};
  if(!bound?.latest)return {...base,notes:['Bu HS Code için tarihli gümrük kaydı bulunamadı.']};
  const latest=new Date(bound.latest),end=new Date(Date.UTC(latest.getUTCFullYear(),latest.getUTCMonth(),1));
  const shift=(months:number)=>{const date=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-months,1));return date.toISOString().slice(0,10)};
  const start=shift(12),previousStart=shift(24),endDate=end.toISOString().slice(0,10);
  const variants=firmaOnEkleri(names),ownClause=variants.length?variants.map(()=>"exporter_name LIKE ?").join(' OR '):'FALSE',ownParams=variants.map((name)=>`${name}%`);
  const validBuyer=`buyer_name IS NOT NULL AND TRIM(buyer_name)<>'' AND UPPER(TRIM(buyer_name)) NOT IN (${YER_TUTUCU_SQL})`;
  const validExporter=`exporter_name IS NOT NULL AND TRIM(exporter_name)<>'' AND UPPER(TRIM(exporter_name)) NOT IN (${YER_TUTUCU_SQL})`;
  const marketSql=`SELECT ${ALICI_ULKE} country,
    SUM(shipment_date>=?) current,SUM(shipment_date<?) previous,
    COUNT(DISTINCT CASE WHEN shipment_date>=? AND ${validBuyer} THEN TRIM(buyer_name) END) buyers,
    COUNT(DISTINCT CASE WHEN shipment_date>=? AND ${validExporter} THEN TRIM(exporter_name) END) exporters,
    SUM(shipment_date>=? AND ${validExporter}) exporterRecords,
    SUM(shipment_date>=? AND ${TEDARIKCI_ULKE}=?) originCurrent,SUM(shipment_date<? AND ${TEDARIKCI_ULKE}=?) originPrevious,
    SUM(shipment_date>=? AND (${ownClause})) ownCurrent,SUM(shipment_date<? AND (${ownClause})) ownPrevious,
    COUNT(DISTINCT CASE WHEN shipment_date>=? THEN DATE_FORMAT(shipment_date,'%Y-%m') END) activeMonths,
    COUNT(DISTINCT CASE WHEN shipment_date<? THEN DATE_FORMAT(shipment_date,'%Y-%m') END) previousMonths,
    GROUP_CONCAT(DISTINCT CASE WHEN shipment_date>=? THEN COALESCE(source_provider,'OTHER') END ORDER BY source_provider) sourcesCurrent,
    GROUP_CONCAT(DISTINCT CASE WHEN shipment_date<? THEN COALESCE(source_provider,'OTHER') END ORDER BY source_provider) sourcesPrevious
    FROM customs_records WHERE hs_code LIKE ? AND shipment_date>=? AND shipment_date<? GROUP BY ${ALICI_ULKE}`;
  const marketParams=[start,start,start,start,start,start,origin,start,origin,start,...ownParams,start,...ownParams,start,start,start,start,`${hs}%`,previousStart,endDate];
  const monthlySql=`SELECT DATE_FORMAT(shipment_date,'%Y-%m') month,COUNT(*) shipments,SUM(${TEDARIKCI_ULKE}=?) originShipments,SUM(${ownClause}) ownShipments FROM customs_records WHERE hs_code LIKE ? AND shipment_date>=? AND shipment_date<? GROUP BY month ORDER BY month`;
  const concentrationSql=`SELECT country,MAX(shipments)/SUM(shipments) topShare FROM (SELECT ${ALICI_ULKE} country,UPPER(TRIM(exporter_name)) exporter,COUNT(*) shipments FROM customs_records WHERE hs_code LIKE ? AND shipment_date>=? AND shipment_date<? AND ${validExporter} GROUP BY ${ALICI_ULKE},UPPER(TRIM(exporter_name))) totals WHERE country IS NOT NULL GROUP BY country`;
  const flowsSql=`SELECT ${TEDARIKCI_ULKE} origin,${ALICI_ULKE} destination,COUNT(*) shipments FROM customs_records WHERE hs_code LIKE ? AND shipment_date>=? AND shipment_date<? AND ${TEDARIKCI_ULKE} IS NOT NULL AND ${ALICI_ULKE} IS NOT NULL GROUP BY ${TEDARIKCI_ULKE},${ALICI_ULKE} ORDER BY shipments DESC LIMIT 80`;
  const coverageSql=`SELECT COUNT(*) records,SUM(${ALICI_ULKE} IS NULL) unknownDestination,SUM(${TEDARIKCI_ULKE} IS NULL) unknownOrigin,SUM(${ALICI_ULKE}=${TEDARIKCI_ULKE}) domesticRecords FROM customs_records WHERE hs_code LIKE ? AND shipment_date>=? AND shipment_date<?`;
  const [[marketRows],[monthlyRows],[concentrationRows],[flowRows],[[coverage]]]=await Promise.all([
    db().query<RowDataPacket[]>(marketSql,marketParams),
    db().query<RowDataPacket[]>(monthlySql,[origin,...ownParams,`${hs}%`,previousStart,endDate]),
    db().query<RowDataPacket[]>(concentrationSql,[`${hs}%`,start,endDate]),
    db().query<RowDataPacket[]>(flowsSql,[`${hs}%`,start,endDate]),
    db().query<RowDataPacket[]>(coverageSql,[`${hs}%`,previousStart,endDate]),
  ]);
  const shares=new Map(concentrationRows.map((row)=>[String(row.country),sayi(row.topShare)]));
  const targetCodes=new Set(base.profile.targets);
  const markets=marketRows.filter((row)=>row.country).map((row)=>{
    const country=String(row.country),countryCode=sektorUlkeKodu(country),current=sayi(row.current),previous=sayi(row.previous),buyers=sayi(row.buyers),exporters=sayi(row.exporters),activeMonths=sayi(row.activeMonths),previousMonths=sayi(row.previousMonths),currentSources=kaynaklar(row.sourcesCurrent),previousSources=kaynaklar(row.sourcesPrevious);
    const comparable=previous>=20&&current>=20&&activeMonths>=6&&previousMonths>=6&&currentSources.length>0&&currentSources.join()===previousSources.join();
    const domestic=Boolean(countryCode&&originCode&&countryCode===originCode),eligible=current>=20&&buyers>=3&&exporters>=1&&sayi(row.exporterRecords)>=current*.5&&activeMonths>=3&&!domestic;
    return {country,countryCode,current,previous,buyers,exporters,originCurrent:sayi(row.originCurrent),originPrevious:sayi(row.originPrevious),ownCurrent:sayi(row.ownCurrent),ownPrevious:sayi(row.ownPrevious),activeMonths,previousMonths,comparable,change:comparable?Math.round((current-previous)/previous*1000)/10:null,density:buyers?exporters/buyers:0,concentration:Math.min(1,shares.get(country)??0),competition:'medium' as 'high'|'medium'|'low',score:null as number|null,eligible,domestic,targeted:countryCode?targetCodes.has(countryCode):false,declared:false,strategy:(sayi(row.ownCurrent)>0?'expand':eligible?'enter':'watch') as 'expand'|'enter'|'watch',sources:currentSources};
  });
  const eligible=markets.filter((market)=>market.eligible),maxRecords=Math.max(1,...eligible.map((market)=>market.current)),maxBuyers=Math.max(1,...eligible.map((market)=>market.buyers)),densities=eligible.map((market)=>market.density).sort((a,b)=>a-b);
  const percentile=(value:number)=>densities.length<=1?.5:(densities.filter((item)=>item<value).length+Math.max(0,densities.filter((item)=>item===value).length-1)/2)/(densities.length-1);
  for(const market of markets){const pressure=Math.max(percentile(market.density),market.concentration>=.7?.9:0);market.competition=pressure>=.67?'high':pressure<=.33?'low':'medium';if(!market.eligible)continue;const demand=Math.log1p(market.current)/Math.log1p(maxRecords),breadth=Math.log1p(market.buyers)/Math.log1p(maxBuyers),momentum=market.change===null?.5:Math.max(0,Math.min(1,.5+market.change/200)),access=Math.min(1,market.originCurrent/Math.max(1,market.current)*5);market.score=Math.round(35*demand+20*breadth+20*(1-pressure)+15*momentum+10*access);}
  markets.sort((a,b)=>(b.score??-1)-(a.score??-1)||b.current-a.current||a.country.localeCompare(b.country));
  const shortlist=markets.filter((market)=>market.eligible&&market.activeMonths>=6&&market.buyers>=5&&market.concentration<.7&&market.countryCode).slice(0,3),macro=await sektorMakro(shortlist.map((market)=>market.countryCode!));
  const ownShipments=markets.reduce((sum,market)=>sum+market.ownCurrent+market.ownPrevious,0),ownMarkets=markets.filter((market)=>market.ownCurrent+market.ownPrevious>0).length;
  return {...base,status:markets.some((market)=>market.current>0)?'ready' as const:'empty' as const,period:{previousStart,start,end:endDate,latestRecord:latest.toISOString().slice(0,10),months:12},ownHistory:ownShipments?{shipments:ownShipments,markets:ownMarkets,scannedAt:new Date().toISOString()}:null,markets,
    monthly:monthlyRows.map((row)=>({month:String(row.month),shipments:sayi(row.shipments),originShipments:sayi(row.originShipments),ownShipments:sayi(row.ownShipments)})),
    flows:flowRows.map((row)=>({origin:String(row.origin),originCode:sektorUlkeKodu(row.origin),destination:String(row.destination),destinationCode:sektorUlkeKodu(row.destination),shipments:sayi(row.shipments)})),
    coverage:{records:sayi(coverage?.records),located:Math.max(0,sayi(coverage?.records)-sayi(coverage?.unknownDestination)-sayi(coverage?.domesticRecords)),unknownDestination:sayi(coverage?.unknownDestination),unknownOrigin:sayi(coverage?.unknownOrigin),domesticRecords:sayi(coverage?.domesticRecords),excludedLatestMonth:true},macroStatus:macro.status,
    investments:shortlist.map((market)=>({country:market.country,countryCode:market.countryCode!,mode:market.ownCurrent>0?'sales-office' as const:'distributor' as const,reason:market.ownCurrent>0?'Mevcut firma adı eşleşmeli satış izi ve tekrar eden pazar kayıtları var. Satış ofisi fizibilitesini inceleyin.':'Tekrar eden alıcı kayıtları var; doğrudan tesis yatırımı öncesi distribütörle pazar doğrulaması yapın.',indicators:macro.data[market.countryCode!]??[],missing:['Ürüne ve menşee özel tarife / menşe kuralları','Şirket kuruluşu, vergi ve izinler','Yerel maliyetler, teslim süresi ve yatırım bütçesi','Güncel yaptırımlar, ödeme ve tahsilat koşulları']})),
    notes:['Kayıt sayısı satış cirosu veya dünyadaki toplam pazar büyüklüğü değildir.','Son kayıt ayı tamamlanmış kabul edilmez; önceki iki eşit 12 aylık dönem karşılaştırılır.','Değişim yalnız iki dönemde kaynak grupları aynı ve en az altışar ay veri varsa gösterilir. Kaynak içindeki kapsam değişimleri yine etkileyebilir.','Kendi satışınız firma adı / Firma Aynası yazım eşleşmesine dayanır; farklı yazımlar eksik kalabilir.','Yatırım listesi ticari ön incelemedir. Ülke göstergeleri sektöre özel değildir; kârlılık veya yatırım getirisi hesaplanmaz.']};
}
