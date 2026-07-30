import { getPublicApiBaseUrl } from '@/lib/site-config';

export type Locale = 'tr' | 'en';

// Site geneli ayarlar (site_settings tablosu). Değerleri dolduran server-only
// fonksiyon: lib/promats/site-config.server.ts (getSiteConfig). Burada sadece TİP
// tutulur (runtime'da silinir → client bundle'a server kodu sızmaz).
export type SiteConfig = {
  contact: { address: string; phone: string; email: string; whatsapp: string };
  socials: Record<string, string>;
  logo: string;
  logoDark: string;
  copyright: string;
  ekatalogUrl: string;
};

export type ProductFeature = {
  id: number;
  productId: number;
  type: number;
  sortOrder: number;
  image: string | null;
  feature: string | null;
};

export type Product = {
  id: number;
  languageId: number;
  sortOrder: number;
  name: string;
  slug: string;
  hero: {
    title1: string | null;
    title2: string | null;
    description: string | null;
    image: string | null;
  };
  sections: {
    conceptImage: string | null;
    conceptTitle: string | null;
    conceptSubtitle: string | null;
    conceptLabel: string | null;
    conceptDescription: string | null;
    detailImage: string | null;
    backgroundImage: string | null;
    setImage: string | null;
    dimensions: (string | null)[];
  };
  seo?: { title: string | null; description: string | null };
  detailContent?: {
    description: string | null;
    technical: string | null;
    usage: string | null;
    advantages: string | null;
    material: string | null;
    universal: string | null;
    sourceUrl: string | null;
  };
  features?: ProductFeature[];
};

export type SpecialPage = {
  id: number;
  languageId: number;
  sortOrder: number;
  position: number;
  title: string | null;
  image: string | null;
  detail: string | null;
  url: string | null;
  slug: string | null;
  gallery?: { id: number; image: string; sortOrder: number }[];
};

export type MenuItem = {
  id: number;
  languageId: number;
  sortOrder: number;
  position: number;
  title: string | null;
  url: string | null;
  targetBlank: boolean;
};

// Header/Footer'a geçirilen sadeleştirilmiş menü öğesi (menu_items'ten türetilir).
export type MenuLink = { title: string; url: string; targetBlank: boolean };

export type ArticleListItem = {
  id: number;
  languageId: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  publishedAt: string | null;
};

export type Article = ArticleListItem & {
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

const API_BASE = getPublicApiBaseUrl().replace(/\/+$/, '');
const BUILD_RETRY_STATUSES = new Set([429, 502, 503, 504]);

function asLocale(locale: string): Locale {
  return locale === 'en' ? 'en' : 'tr';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPromats<T>(path: string, locale: string, init?: RequestInit): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${API_BASE}${path}${separator}lang=${asLocale(locale)}`;
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    res = await fetch(url, {
      ...init,
      next: { revalidate: 60, ...(init?.next ?? {}) },
    });
    if (!BUILD_RETRY_STATUSES.has(res.status)) break;
    await sleep(250 * (attempt + 1));
  }
  if (!res) throw new Error('Promats API error: no response');
  if (!res.ok) throw new Error(`Promats API error: ${res.status}`);
  const json = (await res.json()) as ApiEnvelope<T> | T;
  if (json && typeof json === 'object' && 'ok' in json) {
    const envelope = json as ApiEnvelope<T>;
    if (!envelope.ok) throw new Error(envelope.error || 'Promats API error');
    return envelope.data;
  }
  return json as T;
}

export function assetPath(path: string | null | undefined, base: '/assets' | '/userfiles' = '/userfiles'): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/assets') || path.startsWith('/userfiles') || path.startsWith('/uploads')) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export function decodeHtml(value: string | null | undefined, locale?: string): string {
  if (!value) return '';
  let out = value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\b(src|href)=["']assets\//g, '$1="/assets/')
    .replace(/\b(src|href)=["']images\//g, '$1="/userfiles/images/')
    .replace(/\b(src|href)=["']files\//g, '$1="/userfiles/files/')
    .replace(/\b(src|href)=["']userfiles\//g, '$1="/userfiles/')
    .replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"');

  // Legacy ".html" linkleri (ör. incele -> /maximum-series.html) modern route + basePath'e çevrilir.
  // Ürün slug'i locale'e göre değiştiği için ürün .html'leri Ürünler listesine yönlenir (404 yok);
  // iletisim/hakkimizda doğrudan eşlenir. locale yoksa dokunulmaz.
  if (locale) {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
    out = out
      .replace(/\bhref=["']\/(?:tr\/|en\/)?iletisim\.html["']/gi, `href="${base}/${locale}/iletisim"`)
      .replace(
        /\bhref=["']\/(?:tr\/|en\/)?hakkimizda\.html["']/gi,
        `href="${base}/${locale}/${locale === 'en' ? 'about-us' : 'hakkimizda'}"`,
      )
      .replace(/\bhref=["']\/[a-z0-9-]+\.html["']/gi, `href="${base}/${locale}/urunler"`);
  }
  return out;
}

export async function getProducts(locale: string, limit = 100): Promise<Product[]> {
  return fetchPromats<Product[]>(`/products?limit=${limit}`, locale);
}

export async function getProduct(locale: string, slug: string): Promise<Product | null> {
  try {
    return await fetchPromats<Product>(`/products/${encodeURIComponent(slug)}`, locale);
  } catch {
    return null;
  }
}

export async function searchProducts(locale: string, query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  return fetchPromats<Product[]>(`/products/search?q=${encodeURIComponent(query)}`, locale);
}

export async function getBanners(locale: string): Promise<SpecialPage[]> {
  return fetchPromats<SpecialPage[]>('/banners?konum=1', locale);
}

export async function getSpecialPages(locale: string): Promise<SpecialPage[]> {
  return fetchPromats<SpecialPage[]>('/content', locale);
}

export async function getSpecialPage(locale: string, slug: string): Promise<SpecialPage | null> {
  try {
    return await fetchPromats<SpecialPage>(`/pages/${encodeURIComponent(slug)}`, locale);
  } catch {
    return null;
  }
}

export async function getMenu(locale: string): Promise<MenuItem[]> {
  return fetchPromats<MenuItem[]>('/menu', locale);
}

export async function getSettings(locale: string): Promise<Record<string, string>> {
  return fetchPromats<Record<string, string>>('/settings', locale);
}

export async function getPageContent<T>(locale: string, page: string): Promise<T> {
  return fetchPromats<T>(`/page-content/${encodeURIComponent(page)}`, locale);
}

export async function getArticles(locale: string): Promise<ArticleListItem[]> {
  return fetchPromats<ArticleListItem[]>('/articles', locale);
}

export async function getArticle(locale: string, slug: string): Promise<Article | null> {
  try {
    return await fetchPromats<Article>(`/articles/${encodeURIComponent(slug)}`, locale);
  } catch {
    return null;
  }
}

export function t(settings: Record<string, string>, key: string): string {
  return settings[key] ?? key;
}

export function stripHtml(value: string | null | undefined): string {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeHtml(value: string | null | undefined): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+=["'][^"']*["']/gi, '')
    .replace(/\sjavascript:/gi, '');
}
