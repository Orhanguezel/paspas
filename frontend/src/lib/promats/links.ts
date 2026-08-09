// Promats internal link helper — basePath-aware.
// Subpath deploy'da (panel.avrasyaotomotiv.net/promats) ham <a href> linkleri
// otomatik basePath almaz (sadece next/link alır). Bu yüzden tüm promats <a> linkleri
// bu helper'dan geçer. Subpath build'de NEXT_PUBLIC_BASE_PATH=/promats; kökte boş.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

const EN_SEGMENTS: Record<string, string> = {
  urunler: 'products',
  iletisim: 'contact',
  kaynaklar: 'resources',
  uretim: 'production',
  arama: 'search',
};

export function localizedPromatsPath(locale: string, path: string): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale !== 'en' || !normalized) return normalized;
  const parts = normalized.split('/');
  if (parts[1] && EN_SEGMENTS[parts[1]]) parts[1] = EN_SEGMENTS[parts[1]];
  return parts.join('/');
}

/** `/promats/tr/iletisim` (subpath) veya `/tr/iletisim` (kök). path '/' ise sadece locale. */
export function localeHref(locale: string, path: string): string {
  const p = localizedPromatsPath(locale, path);
  return `${BASE}/${locale}${p}`;
}

/** Locale'siz kök-içi link (gerekirse). assets/userfiles için KULLANMA (onlar nginx kökünden servis edilir). */
export function baseHref(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
