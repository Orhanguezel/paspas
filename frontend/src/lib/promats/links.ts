// Promats internal link helper — basePath-aware.
// Subpath deploy'da (panel.avrasyaotomotiv.net/promats) ham <a href> linkleri
// otomatik basePath almaz (sadece next/link alır). Bu yüzden tüm promats <a> linkleri
// bu helper'dan geçer. Subpath build'de NEXT_PUBLIC_BASE_PATH=/promats; kökte boş.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

/** `/promats/tr/iletisim` (subpath) veya `/tr/iletisim` (kök). path '/' ise sadece locale. */
export function localeHref(locale: string, path: string): string {
  const p = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${BASE}/${locale}${p}`;
}

/** Locale'siz kök-içi link (gerekirse). assets/userfiles için KULLANMA (onlar nginx kökünden servis edilir). */
export function baseHref(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
