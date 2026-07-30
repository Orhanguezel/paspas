/** Template (sablon) rotaları — Promats shell kullanmaz */
const TEMPLATE_ROUTE_SEGMENTS = new Set([
  'blog',
  'contact',
  'faqs',
  'login',
  'logout',
  'register',
  'forgot-password',
  'password-reset',
  'verify-email',
  'profile',
  'me',
  'terms',
  'privacy-policy',
  'privacy-notice',
  'cookie-policy',
  'cerez-politikasi',
  'gizlilik',
  'kvkk',
  'kullanim-sartlari',
  'legal-notice',
  'editorial-policy',
]);

/**
 * Promats public shell (PromatsHeader/Footer) kullanılacak path mi?
 * /tr, /tr/urunler/x, /tr/arama, /tr/iletisim, /tr/hakkimizda vb.
 */
export function isPromatsShellPath(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  const match = normalized.match(/^\/(tr|en)(\/.*)?$/);
  if (!match) return false;

  const rest = match[2] ?? '';
  if (!rest || rest === '/') return true;
  if (rest.startsWith('/urunler/')) return true;
  if (rest === '/arama' || rest.startsWith('/arama/')) return true;
  if (rest === '/iletisim' || rest.startsWith('/iletisim/')) return true;

  const segments = rest.split('/').filter(Boolean);
  if (segments.length !== 1) return false;

  return !TEMPLATE_ROUTE_SEGMENTS.has(segments[0]!.toLowerCase());
}
