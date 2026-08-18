import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendTelegram } from '@/core/telegram';
import { createAdminNotification } from '@/modules/notifications/controller';
import { requireAdmin, requireAuth } from '@/common/middleware/auth';
import { env } from '@/core/env';
import { timingSafeEqual } from 'node:crypto';

const localeQuery = z.object({
  lang: z.enum(['tr', 'en']).optional(),
  locale: z.enum(['tr', 'en']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  position: z.coerce.number().int().optional(),
  konum: z.coerce.number().int().optional(),
});

const tables = {
  products: 'web_promats_products',
  pages: 'web_promats_special_pages',
  menu: 'web_promats_menu_items',
  texts: 'web_promats_static_texts',
  articles: 'web_promats_articles',
} as const;

const editableColumns: Record<CmsTable, readonly string[]> = {
  products: [
    'language_id', 'source_language_id', 'sort_order', 'name', 'slug', 's1_1_text',
    's1_2_text', 's1_3_text', 's1_4_image', 's2_1_image', 's2_2_text', 's2_3_text',
    's2_4_text', 's2_5_text', 's3_1_image', 's3_2_image', 's4_1_image', 's5_1_text',
    's5_2_text', 's5_3_text', 's5_4_text', 's5_5_text', 'seo_title', 'seo_description',
    'detail_description', 'detail_technical', 'detail_usage', 'detail_advantages',
    'detail_material', 'detail_universal', 'detail_source_url', 'status',
  ],
  pages: [
    'language_id', 'source_language_id', 'sort_order', 'position', 'original_title',
    'image', 'title', 'detail', 'url', 'slug', 'hit', 'status',
  ],
  menu: [
    'language_id', 'source_language_id', 'sort_order', 'position', 'original_title',
    'title', 'url', 'status', 'target', 'edited_at',
  ],
  texts: [
    'language_id', 'source_language_id', 'original_text', 'title', 'status', 'edited_at',
  ],
  articles: [
    'language_id', 'source_language_id', 'sort_order', 'title', 'slug', 'excerpt',
    'content', 'image', 'meta_title', 'meta_description', 'hit', 'status', 'published_at',
  ],
};

type CmsTable = keyof typeof tables;
type Row = Record<string, any>;

const publicSettingKeys = [
  'product_icon_number', 'product_img_derin_havuzlu', 'product_icon_bottom_arrow',
  'product_icons_transport', 'product_imgs_option', 'product_carousel_arrow_left',
  'product_carousel_arrow_right', 'header_icon_search', 'header_icon_menu',
  'footer_ekatalog_icon', 'contact_map_embed_url', 'partner_page_content',
];

function languageId(query: unknown): number {
  const parsed = localeQuery.parse(query);
  return (parsed.lang ?? parsed.locale ?? 'tr') === 'en' ? 2 : 1;
}

function cmsTarget(value: unknown): { key: CmsTable; table: string } | null {
  const key = String(value ?? '') as CmsTable;
  return tables[key] ? { key, table: tables[key] } : null;
}

function editablePayload(table: CmsTable, body: unknown): Row {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body as Row : {};
  return Object.fromEntries(
    editableColumns[table]
      .filter((column) => Object.prototype.hasOwnProperty.call(input, column))
      .map((column) => [column, input[column] === '' ? null : input[column]]),
  );
}

// Eski CMS gorsel yollarini `/userfiles` altina GORELI sakliyor; canlida iki
// bicim birden var: `images/urun/x.png` ve `/images/urun/x.png`. Panelden
// yuklenen yeni dosyalar ise tam yol tutuyor (`/userfiles/...`, `/uploads/...`).
//
// Onceden bu fonksiyon yalniz basa `/` koyuyordu, yani `/images/urun/x.png`
// donuyordu — bu adres 404. Site calisiyordu cunku frontend (PromatsImage /
// assetPath) ve admin panel eksigi kendi taraflarinda tamamliyordu. API dogru
// adresi vermedigi icin ucuncu bir tuketici (TeklifRota urun entegrasyonu)
// 20 gorselin 9'unda 404 aldi. Duzeltme kaynakta yapildi.
//
// Zaten tam olan yollar oldugu gibi birakilir; aksi halde `/uploads/...`
// dosyalari yanlisilikla `/userfiles` altina tasinmis gorunurdu.
const TAM_YOL_ONEKLERI = ['/userfiles', '/assets', '/uploads'] as const;

function asset(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  if (TAM_YOL_ONEKLERI.some((onek) => path === onek || path.startsWith(`${onek}/`))) return path;
  return `/userfiles${path}`;
}

function authorizedProductConsumer(value: unknown): boolean {
  const expected = env.PROMATS_TEKLIFROTA_API_KEY;
  const provided = typeof value === 'string' ? value : '';
  if (!expected || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function absolutePromatsAsset(value: unknown): string | null {
  const path = asset(value);
  if (!path) return null;
  return path.startsWith('http') ? path : `https://promats.com.tr${path}`;
}

function product(row: Row, features: Row[] = []) {
  return {
    id: row.id, languageId: row.language_id, sortOrder: row.sort_order,
    name: row.name, slug: row.slug,
    hero: {
      title1: row.s1_1_text, title2: row.s1_2_text,
      description: row.s1_3_text, image: asset(row.s1_4_image),
    },
    sections: {
      conceptImage: asset(row.s2_1_image), conceptTitle: row.s2_2_text,
      conceptSubtitle: row.s2_3_text, conceptLabel: row.s2_4_text,
      conceptDescription: row.s2_5_text, detailImage: asset(row.s3_1_image),
      backgroundImage: asset(row.s3_2_image), setImage: asset(row.s4_1_image),
      dimensions: [row.s5_1_text, row.s5_2_text, row.s5_3_text, row.s5_4_text, row.s5_5_text],
    },
    seo: { title: row.seo_title, description: row.seo_description },
    detailContent: {
      description: row.detail_description, technical: row.detail_technical,
      usage: row.detail_usage, advantages: row.detail_advantages,
      material: row.detail_material, universal: row.detail_universal,
      sourceUrl: row.detail_source_url,
    },
    features: features.map((item) => ({
      id: item.id, productId: item.product_id, type: item.type,
      sortOrder: item.sort_order, image: asset(item.image), feature: item.feature,
    })),
  };
}

function page(row: Row, gallery?: Row[]) {
  return {
    id: row.id, languageId: row.language_id, sortOrder: row.sort_order,
    position: row.position, title: row.title, image: asset(row.image),
    detail: row.detail, url: row.url, slug: row.slug,
    ...(gallery ? { gallery: gallery.map((item) => ({
      id: item.id, image: asset(item.image), sortOrder: item.sort_order,
    })) } : {}),
  };
}

export const webPromatsTestUtils = {
  languageId,
  cmsTarget,
  editablePayload,
  asset,
  product,
  page,
};

async function rows(app: FastifyInstance, sql: string, params: unknown[] = []): Promise<Row[]> {
  const [result] = await app.mysql.query(sql, params);
  return result as Row[];
}

async function revalidatePromats(): Promise<{ ok: boolean; reason?: string }> {
  if (!env.PROMATS_REVALIDATE_URL || !env.PROMATS_REVALIDATE_SECRET) {
    return { ok: false, reason: 'revalidate_yapilandirilmamis' };
  }
  try {
    const response = await fetch(env.PROMATS_REVALIDATE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.PROMATS_REVALIDATE_SECRET, all: true }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok ? { ok: true } : { ok: false, reason: `http_${response.status}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'bilinmeyen_hata' };
  }
}

export async function registerWebPromatsPublic(app: FastifyInstance): Promise<void> {
  const getSetting = async (key: string, locale: string) => {
    const candidates = [
      `web.promats.frontend.${key}.locale.${locale}`,
      `web.promats.frontend.${key}.locale.*`,
      `web.promats.frontend.${key}`,
    ];
    const settings = await rows(app,
      `SELECT \`key\`,value FROM site_settings WHERE \`key\` IN (?,?,?)`, candidates);
    return candidates.map((candidate) => settings.find((item) => item.key === candidate)).find(Boolean) ?? null;
  };

  const settingHandler = async (req: any) => {
    const key = String(req.params.key ?? req.query.key ?? '').trim().replaceAll('-', '_');
    const locale = String(req.query.locale ?? req.query.lang ?? '*');
    const found = await getSetting(key, locale);
    if (!found) return { key, locale, value: null };
    return { key, locale, value: found.value };
  };

  app.get('/web/promats/site_settings/by-key', settingHandler);
  app.get('/web/promats/site_settings/app-locales', async () => {
    const languages = await rows(app,
      'SELECT locale code,name label,status FROM web_promats_languages ORDER BY sort_order,id');
    return languages.map((item, index) => ({
      code: item.code,
      label: item.label,
      is_active: Number(item.status) === 0,
      is_default: index === 0,
    }));
  });
  app.get('/web/promats/site_settings/default-locale', async () => 'tr');
  app.get('/web/promats/site_settings/:key', settingHandler);
  app.get('/web/promats/page-content/:page', async (req, reply) => {
    const page = String((req.params as Row).page ?? '').trim().toLowerCase();
    const locale = String((req.query as Row).lang ?? (req.query as Row).locale ?? 'tr') === 'en' ? 'en' : 'tr';
    if (!/^[a-z0-9-]+$/.test(page)) {
      return reply.code(400).send({ error: { message: 'Geçersiz sayfa anahtarı.' } });
    }
    const key = `web.promats.frontend.page_content.${page}.locale.${locale}`;
    const [setting] = await rows(app, 'SELECT value FROM site_settings WHERE `key`=? LIMIT 1', [key]);
    if (!setting) return reply.code(404).send({ error: { message: 'Sayfa içeriği bulunamadı.' } });
    try { return JSON.parse(setting.value); } catch {
      return reply.code(500).send({ error: { message: 'Sayfa içeriği JSON biçimi bozuk.' } });
    }
  });

  app.get('/web/promats/theme', async () => {
    const found = await getSetting('theme_config', '*');
    if (!found) return {};
    try { return JSON.parse(found.value); } catch { return {}; }
  });

  app.get('/web/promats/products', async (req) => {
    const parsed = localeQuery.parse(req.query);
    const items = await rows(app,
      'SELECT * FROM web_promats_products WHERE language_id=? ORDER BY sort_order,id LIMIT ?',
      [languageId(req.query), parsed.limit]);
    if (!items.length) return { ok: true, data: [] };
    const features = await rows(app,
      `SELECT * FROM web_promats_product_features WHERE product_id IN (${items.map(() => '?').join(',')})
       ORDER BY type,sort_order,id`, items.map((item) => item.id));
    return { ok: true, data: items.map((item) => product(item, features.filter((f) => f.product_id === item.id))) };
  });

  // TeklifRota v1 ürün sözleşmesi. Kaynak fiyat içermediğinde null döner;
  // tüketici doğrulanmamış fiyat tahmini yapmaz.
  app.get('/web/promats/integrations/teklifrota/v1/products', async (req, reply) => {
    if (!env.PROMATS_TEKLIFROTA_API_KEY) return reply.code(503).send({ error: 'integration_not_configured' });
    if (!authorizedProductConsumer(req.headers['x-api-key'])) return reply.code(401).send({ error: 'invalid_api_key' });
    const parsed = localeQuery.parse(req.query);
    const locale = (parsed.lang ?? parsed.locale ?? 'tr') === 'en' ? 'en' : 'tr';
    const items = await rows(app,
      'SELECT * FROM web_promats_products WHERE language_id=? ORDER BY sort_order,id LIMIT ?',
      [languageId(req.query), parsed.limit]);
    return {
      contract: 'teklifrota.products.v1',
      source: { provider: 'promats', website: 'https://promats.com.tr/tr', locale },
      generatedAt: new Date().toISOString(),
      items: items.map((item) => ({
        externalId: `promats-${locale}-${item.id}`,
        code: `PROMATS-${String(item.id).padStart(3, '0')}`,
        name: item.name,
        url: `https://promats.com.tr/${locale}/urunler/${item.slug}`,
        imageUrl: absolutePromatsAsset(item.s3_1_image || item.s1_4_image || item.s2_1_image),
        description: item.detail_description || item.s1_3_text || item.seo_description || null,
        price: null,
        currency: null,
      })),
    };
  });

  app.get('/web/promats/products/search', async (req, reply) => {
    const q = String((req.query as Row).q ?? '').trim();
    if (!q) return reply.code(400).send({ error: { message: 'Arama metni zorunlu.' } });
    const items = await rows(app,
      'SELECT * FROM web_promats_products WHERE language_id=? AND (name LIKE ? OR slug LIKE ?) ORDER BY sort_order,id',
      [languageId(req.query), `%${q}%`, `%${q}%`]);
    return { ok: true, data: items.map((item) => product(item)) };
  });

  app.get('/web/promats/products/:slug', async (req, reply) => {
    const [item] = await rows(app,
      'SELECT * FROM web_promats_products WHERE language_id=? AND slug=? LIMIT 1',
      [languageId(req.query), (req.params as Row).slug]);
    if (!item) return reply.code(404).send({ error: { message: 'Ürün bulunamadı.' } });
    const features = await rows(app,
      'SELECT * FROM web_promats_product_features WHERE product_id=? ORDER BY type,sort_order,id', [item.id]);
    return { ok: true, data: product(item, features) };
  });

  const listPages = async (req: any) => {
    const parsed = localeQuery.parse(req.query);
    const position = parsed.konum ?? parsed.position;
    const items = await rows(app,
      `SELECT * FROM web_promats_special_pages WHERE language_id=?${position === undefined ? '' : ' AND position=?'}
       ORDER BY sort_order,id`, position === undefined ? [languageId(req.query)] : [languageId(req.query), position]);
    return { ok: true, data: items.map((item) => page(item)) };
  };
  app.get('/web/promats/banners', listPages);
  app.get('/web/promats/content', listPages);

  app.get('/web/promats/pages/:slug', async (req, reply) => {
    const [item] = await rows(app,
      'SELECT * FROM web_promats_special_pages WHERE language_id=? AND slug=? LIMIT 1',
      [languageId(req.query), (req.params as Row).slug]);
    if (!item) return reply.code(404).send({ error: { message: 'İçerik bulunamadı.' } });
    const gallery = await rows(app,
      'SELECT * FROM web_promats_special_page_gallery WHERE special_page_id=? ORDER BY sort_order,id', [item.id]);
    return { ok: true, data: page(item, gallery) };
  });

  app.get('/web/promats/menu', async (req) => {
    const parsed = localeQuery.parse(req.query);
    const position = parsed.konum ?? parsed.position;
    const items = await rows(app,
      `SELECT * FROM web_promats_menu_items WHERE language_id=?${position === undefined ? '' : ' AND position=?'}
       ORDER BY sort_order,id`, position === undefined ? [languageId(req.query)] : [languageId(req.query), position]);
    return { ok: true, data: items.map((item) => ({
      id: item.id, languageId: item.language_id, sortOrder: item.sort_order,
      position: item.position, title: item.title, url: item.url, targetBlank: item.target === 1,
    })) };
  });

  app.get('/web/promats/settings', async (req) => {
    const lang = languageId(req.query) === 2 ? 'en' : 'tr';
    const texts = await rows(app,
      'SELECT original_text,title FROM web_promats_static_texts WHERE language_id=? ORDER BY id', [languageId(req.query)]);
    const keys = publicSettingKeys.flatMap((key) => [
      `web.promats.frontend.${key}.locale.${lang}`,
      `web.promats.frontend.${key}.locale.*`,
      `web.promats.frontend.${key}`,
    ]);
    const settings = await rows(app,
      `SELECT \`key\`,value FROM site_settings WHERE \`key\` IN (${keys.map(() => '?').join(',')})`, keys);
    const data: Record<string, string> = {};
    for (const item of texts) if (item.original_text) data[item.original_text] = item.title ?? item.original_text;
    for (const key of publicSettingKeys) {
      const prefixes = [
        `web.promats.frontend.${key}.locale.${lang}`,
        `web.promats.frontend.${key}.locale.*`,
        `web.promats.frontend.${key}`,
      ];
      const found = prefixes.map((candidate) => settings.find((item) => item.key === candidate)).find(Boolean);
      if (found) {
        try {
          const parsed = JSON.parse(found.value);
          data[key] = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        } catch { data[key] = found.value; }
      }
    }
    return { ok: true, data };
  });

  app.get('/web/promats/articles', async (req) => {
    const items = await rows(app,
      'SELECT * FROM web_promats_articles WHERE language_id=? AND status=0 ORDER BY published_at DESC,sort_order,id DESC',
      [languageId(req.query)]);
    return { ok: true, data: items.map((item) => ({
      id: item.id, languageId: item.language_id, title: item.title, slug: item.slug,
      excerpt: item.excerpt, image: asset(item.image), publishedAt: item.published_at,
    })) };
  });

  app.get('/web/promats/articles/:slug', async (req, reply) => {
    const [item] = await rows(app,
      'SELECT * FROM web_promats_articles WHERE language_id=? AND slug=? AND status=0 LIMIT 1',
      [languageId(req.query), (req.params as Row).slug]);
    if (!item) return reply.code(404).send({ error: { message: 'Makale bulunamadı.' } });
    return { ok: true, data: {
      id: item.id, languageId: item.language_id, title: item.title, slug: item.slug,
      excerpt: item.excerpt, content: item.content, image: asset(item.image),
      publishedAt: item.published_at, metaTitle: item.meta_title, metaDescription: item.meta_description,
    } };
  });

  app.get('/web/promats/home/layout', async () => {
    const items = await rows(app,
      'SELECT * FROM web_promats_home_sections WHERE is_active=1 ORDER BY order_index');
    return { success: true, data: items.map((item) => ({
      id: item.id, slug: item.slug, label: item.label, component_key: item.component_key,
      order_index: item.order_index, is_active: item.is_active,
      config: typeof item.config === 'string' ? JSON.parse(item.config) : item.config,
    })) };
  });

  // Eski istemciler için geçici uyumluluk; yeni form /api/contact kullanır.
  app.post('/web/promats/contact', async (req, reply) => {
    const body = req.body as Row;
    const name = String(body.ad ?? body.name ?? '').trim();
    const phone = String(body.telefon ?? body.phone ?? '').trim();
    if (!name || !phone) return reply.code(400).send({ error: { message: 'İsim ve telefon zorunludur.' } });
    const email = String(body.eposta ?? body.email ?? '').trim();
    const message = String(body.mesaj ?? body.message ?? '').trim();
    const notificationText = `${name} · ${phone}${email ? ` · ${email}` : ''}${message ? `\n${message}` : ''}`;
    await Promise.allSettled([
      createAdminNotification({
        title: 'Promats web iletişim formu',
        message: notificationText,
        type: 'system',
      }),
      sendTelegram(`🌐 Promats web iletişim formu\n${notificationText}`),
    ]);
    req.log.info({ contact: body, source: 'promats-web' }, 'Web contact form received');
    return reply.code(202).send({ ok: true });
  });
}

export async function registerWebPromatsAdmin(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireAdmin);

  const replaceProductFeatures = async (productId: number, value: unknown) => {
    if (!Array.isArray(value)) return;
    await app.mysql.query('DELETE FROM web_promats_product_features WHERE product_id=?', [productId]);
    const valid = value.filter((item): item is Row => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
    if (!valid.length) return;
    const [max] = await rows(app, 'SELECT COALESCE(MAX(id),0) id FROM web_promats_product_features');
    let id = Number(max.id);
    for (const [index, item] of valid.entries()) {
      await app.mysql.query(
        `INSERT INTO web_promats_product_features
         (id,product_id,type,sort_order,image,feature,status) VALUES (?,?,?,?,?,?,?)`,
        [++id, productId, Number(item.type ?? 1), Number(item.sort_order ?? index),
          item.image || null, item.feature || null, Number(item.status ?? 0)],
      );
    }
  };

  const replacePageGallery = async (pageId: number, languageIdValue: number, value: unknown) => {
    if (!Array.isArray(value)) return;
    await app.mysql.query('DELETE FROM web_promats_special_page_gallery WHERE special_page_id=?', [pageId]);
    const valid = value.filter((item): item is Row =>
      Boolean(item && typeof item === 'object' && !Array.isArray(item) && String((item as Row).image ?? '').trim()));
    if (!valid.length) return;
    const [max] = await rows(app, 'SELECT COALESCE(MAX(id),0) id FROM web_promats_special_page_gallery');
    let id = Number(max.id);
    for (const [index, item] of valid.entries()) {
      await app.mysql.query(
        `INSERT INTO web_promats_special_page_gallery
         (id,language_id,source_language_id,status,sort_order,special_page_id,image)
         VALUES (?,?,?,?,?,?,?)`,
        [++id, Number(item.language_id ?? languageIdValue), Number(item.source_language_id ?? 0),
          Number(item.status ?? 0), Number(item.sort_order ?? index), pageId, String(item.image)],
      );
    }
  };

  app.get('/web/promats/summary', async () => {
    const data: Row = {};
    for (const [key, table] of Object.entries(tables)) {
      const [count] = await rows(app, `SELECT COUNT(*) total FROM ${table}`);
      data[key] = Number(count.total);
    }
    return data;
  });

  app.post('/web/promats/revalidate', async (req, reply) => {
    const result = await revalidatePromats();
    if (!result.ok) req.log.warn({ reason: result.reason }, 'promats_revalidate_failed');
    return reply.send(result);
  });

  app.get('/web/promats/settings', async () => rows(app,
    "SELECT id,`key`,value,created_at,updated_at FROM site_settings WHERE `key` LIKE 'web.promats.%' ORDER BY `key`"));

  app.get('/web/promats/page-content', async () => {
    const contentRows = await rows(app,
      "SELECT id,`key`,value,updated_at FROM site_settings WHERE `key` LIKE 'web.promats.frontend.page_content.%.locale.%' ORDER BY `key`");
    return contentRows.map((item) => {
      const match = String(item.key).match(/^web\.promats\.frontend\.page_content\.([^.]+)\.locale\.([^.]+)$/);
      let content: unknown = {};
      try { content = JSON.parse(item.value); } catch { content = {}; }
      return {
        id: item.id,
        key: item.key,
        page_key: match?.[1] ?? '',
        locale: match?.[2] ?? '',
        content,
        updated_at: item.updated_at,
      };
    });
  });

  app.put('/web/promats/page-content/:page/:locale', async (req, reply) => {
    const page = String((req.params as Row).page ?? '').trim().toLowerCase();
    const locale = String((req.params as Row).locale ?? '').trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(page) || !['tr', 'en'].includes(locale)) {
      return reply.code(400).send({ error: { message: 'Sayfa veya dil anahtarı geçersiz.' } });
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return reply.code(400).send({ error: { message: 'Sayfa içeriği JSON obje olmalıdır.' } });
    }
    const key = `web.promats.frontend.page_content.${page}.locale.${locale}`;
    const value = JSON.stringify(req.body);
    await app.mysql.query(
      `INSERT INTO site_settings (id,\`key\`,value) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=CURRENT_TIMESTAMP(3)`,
      [`wps-${randomUUID().replaceAll('-', '').slice(0, 32)}`, key, value]);
    await revalidatePromats();
    return { ok: true, key, content: req.body };
  });

  app.put('/web/promats/settings/:key', async (req) => {
    const raw = decodeURIComponent(String((req.params as Row).key));
    const key = raw.startsWith('web.promats.') ? raw : `web.promats.frontend.${raw}`;
    const value = typeof (req.body as Row)?.value === 'string'
      ? (req.body as Row).value : JSON.stringify((req.body as Row)?.value ?? '');
    await app.mysql.query(
      `INSERT INTO site_settings (id,\`key\`,value) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=CURRENT_TIMESTAMP(3)`,
      [`wps-${randomUUID().replaceAll('-', '').slice(0, 32)}`, key, value]);
    await revalidatePromats();
    return { ok: true, key, value };
  });

  app.get('/web/promats/theme', async () => {
    const [setting] = await rows(app,
      "SELECT value FROM site_settings WHERE `key`='web.promats.frontend.theme_config' LIMIT 1");
    if (!setting) return {};
    try { return JSON.parse(setting.value); } catch { return {}; }
  });

  app.put('/web/promats/theme', async (req, reply) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return reply.code(400).send({ error: { message: 'Tema ayarı JSON obje olmalıdır.' } });
    }
    const value = JSON.stringify(req.body);
    await app.mysql.query(
      `INSERT INTO site_settings (id,\`key\`,value) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=CURRENT_TIMESTAMP(3)`,
      [`wps-${randomUUID().replaceAll('-', '').slice(0, 32)}`, 'web.promats.frontend.theme_config', value]);
    await revalidatePromats();
    return req.body;
  });

  app.get('/web/promats/home-sections', async () => rows(app,
    'SELECT * FROM web_promats_home_sections ORDER BY order_index,id'));

  app.post('/web/promats/home-sections', async (req, reply) => {
    const body = (req.body ?? {}) as Row;
    const slug = String(body.slug ?? '').trim();
    const label = String(body.label ?? '').trim();
    const componentKey = String(body.component_key ?? '').trim();
    if (!slug || !label || !componentKey) {
      return reply.code(400).send({ error: { message: 'Slug, başlık ve component_key zorunludur.' } });
    }
    const id = String(body.id ?? randomUUID());
    await app.mysql.query(
      `INSERT INTO web_promats_home_sections
       (id,slug,label,component_key,order_index,is_active,config) VALUES (?,?,?,?,?,?,?)`,
      [id, slug, label, componentKey, Number(body.order_index ?? 0),
        Number(body.is_active ?? 1), body.config == null ? null : JSON.stringify(body.config)]);
    const [created] = await rows(app, 'SELECT * FROM web_promats_home_sections WHERE id=?', [id]);
    await revalidatePromats();
    return reply.code(201).send(created);
  });

  app.patch('/web/promats/home-sections/:id', async (req, reply) => {
    const allowed = ['slug', 'label', 'component_key', 'order_index', 'is_active', 'config'];
    const body = (req.body ?? {}) as Row;
    const payload = Object.fromEntries(allowed
      .filter((key) => Object.prototype.hasOwnProperty.call(body, key))
      .map((key) => [key, key === 'config' && body[key] != null ? JSON.stringify(body[key]) : body[key]]));
    const columns = Object.keys(payload);
    if (!columns.length) return reply.code(400).send({ error: { message: 'Güncellenecek alan yok.' } });
    await app.mysql.query(
      `UPDATE web_promats_home_sections SET ${columns.map((key) => `\`${key}\`=?`).join(',')} WHERE id=?`,
      [...columns.map((key) => payload[key]), String((req.params as Row).id)]);
    const [updated] = await rows(app, 'SELECT * FROM web_promats_home_sections WHERE id=?',
      [String((req.params as Row).id)]);
    if (!updated) return reply.code(404).send({ error: { message: 'Bölüm bulunamadı.' } });
    await revalidatePromats();
    return updated;
  });

  app.delete('/web/promats/home-sections/:id', async (req) => {
    await app.mysql.query('DELETE FROM web_promats_home_sections WHERE id=?',
      [String((req.params as Row).id)]);
    await revalidatePromats();
    return { ok: true };
  });

  app.get('/web/promats/:table', async (req, reply) => {
    const target = cmsTarget((req.params as Row).table);
    if (!target) return reply.code(404).send({ error: { message: 'Tablo bulunamadı.' } });
    const { key: tableKey, table } = target;
    const language = Number((req.query as Row).languageId);
    const where = Number.isFinite(language) && language > 0 ? ' WHERE language_id=?' : '';
    const params = where ? [language] : [];
    return rows(app, `SELECT * FROM ${table}${where} ORDER BY language_id,${tableKey === 'texts' ? '' : 'sort_order,'}id LIMIT 500`, params);
  });

  app.get('/web/promats/:table/:id', async (req, reply) => {
    const target = cmsTarget((req.params as Row).table);
    if (!target) return reply.code(404).send({ error: { message: 'Tablo bulunamadı.' } });
    const { key: tableKey, table } = target;
    const [item] = await rows(app, `SELECT * FROM ${table} WHERE id=? LIMIT 1`, [(req.params as Row).id]);
    if (!item) return reply.code(404).send({ error: { message: 'Kayıt bulunamadı.' } });
    if (tableKey === 'products') item.features = await rows(app,
      'SELECT * FROM web_promats_product_features WHERE product_id=? ORDER BY type,sort_order,id', [item.id]);
    if (tableKey === 'pages') item.gallery = await rows(app,
      'SELECT * FROM web_promats_special_page_gallery WHERE special_page_id=? ORDER BY sort_order,id', [item.id]);
    return item;
  });

  app.post('/web/promats/:table', async (req, reply) => {
    const target = cmsTarget((req.params as Row).table);
    if (!target) return reply.code(404).send({ error: { message: 'Tablo bulunamadı.' } });
    const payload = editablePayload(target.key, req.body);
    if (!Object.keys(payload).length) {
      return reply.code(400).send({ error: { message: 'Kaydedilecek alan bulunamadı.' } });
    }
    if (target.key === 'products' && (!payload.name || !payload.slug)) {
      return reply.code(400).send({ error: { message: 'Ürün adı ve slug zorunludur.' } });
    }
    if (target.key === 'articles' && (!payload.title || !payload.slug)) {
      return reply.code(400).send({ error: { message: 'Makale başlığı ve slug zorunludur.' } });
    }
    const [max] = await rows(app, `SELECT COALESCE(MAX(id),0)+1 id FROM ${target.table}`);
    const id = Number(max.id);
    const columns = Object.keys(payload);
    await app.mysql.query(
      `INSERT INTO ${target.table} (id,${columns.map((column) => `\`${column}\``).join(',')})
       VALUES (?,${columns.map(() => '?').join(',')})`,
      [id, ...columns.map((column) => payload[column])],
    );
    const body = req.body as Row;
    if (target.key === 'products') await replaceProductFeatures(id, body.features);
    if (target.key === 'pages') await replacePageGallery(id, Number(payload.language_id ?? 1), body.gallery);
    const [created] = await rows(app, `SELECT * FROM ${target.table} WHERE id=?`, [id]);
    await revalidatePromats();
    return reply.code(201).send(created);
  });

  app.patch('/web/promats/:table/:id', async (req, reply) => {
    const target = cmsTarget((req.params as Row).table);
    if (!target) return reply.code(404).send({ error: { message: 'Tablo bulunamadı.' } });
    const payload = editablePayload(target.key, req.body);
    const columns = Object.keys(payload);
    const body = req.body as Row;
    const hasChildren = (target.key === 'products' && Array.isArray(body.features))
      || (target.key === 'pages' && Array.isArray(body.gallery));
    if (!columns.length && !hasChildren) {
      return reply.code(400).send({ error: { message: 'Güncellenecek alan bulunamadı.' } });
    }
    const id = Number((req.params as Row).id);
    const [existing] = await rows(app, `SELECT id FROM ${target.table} WHERE id=?`, [id]);
    if (!existing) return reply.code(404).send({ error: { message: 'Kayıt bulunamadı.' } });
    if (columns.length) {
      await app.mysql.query(
        `UPDATE ${target.table} SET ${columns.map((column) => `\`${column}\`=?`).join(',')} WHERE id=?`,
        [...columns.map((column) => payload[column]), id],
      );
    }
    if (target.key === 'products') await replaceProductFeatures(id, body.features);
    if (target.key === 'pages') {
      const [pageRow] = await rows(app, 'SELECT language_id FROM web_promats_special_pages WHERE id=?', [id]);
      await replacePageGallery(id, Number(pageRow?.language_id ?? 1), body.gallery);
    }
    const [updated] = await rows(app, `SELECT * FROM ${target.table} WHERE id=?`, [id]);
    await revalidatePromats();
    return updated;
  });

  app.delete('/web/promats/:table/:id', async (req, reply) => {
    const target = cmsTarget((req.params as Row).table);
    if (!target) return reply.code(404).send({ error: { message: 'Tablo bulunamadı.' } });
    const id = Number((req.params as Row).id);
    if (target.key === 'products') {
      await app.mysql.query('DELETE FROM web_promats_product_features WHERE product_id=?', [id]);
    }
    await app.mysql.query(`DELETE FROM ${target.table} WHERE id=?`, [id]);
    await revalidatePromats();
    return { ok: true };
  });
}
