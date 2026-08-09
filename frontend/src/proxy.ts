// =============================================================
// FILE: src/proxy.ts (Next.js 16+ — eski middleware.ts deprecated)
// Locale prefix routing — kök URL `/` Türkçe içeriği gösterir
// (internal rewrite to /tr, URL bar'da `/` kalır).
// /en, /de gibi diğer dilleri olduğu gibi geçirir.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';
const EN_EXTERNAL_TO_INTERNAL: Record<string, string> = {
  products: 'urunler', contact: 'iletisim', resources: 'kaynaklar',
  production: 'uretim', search: 'arama',
};
const EN_INTERNAL_TO_EXTERNAL = Object.fromEntries(
  Object.entries(EN_EXTERNAL_TO_INTERNAL).map(([external, internal]) => [internal, external]),
);

// Non-locale path prefixes (admin, api vs.)
const NON_LOCALE_PREFIXES = ['admin', 'api', 'uploads', 'public', 'static', 'images', 'assets'];

// Static file extensions — middleware'i atla
const STATIC_EXT_RE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf|eot|css|js|map|txt|xml|json|webmanifest)$/i;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

  // Next.js internals + static dosyalar — atla
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/offline.html' ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // İlk path segment'i (boşsa root '/')
  const firstSeg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();

  // Non-locale (admin/api/uploads) — olduğu gibi geç
  if (firstSeg && NON_LOCALE_PREFIXES.includes(firstSeg)) {
    return NextResponse.next();
  }

  // İngilizce public rotaları dışarıda İngilizce segment kullanır; App Router'daki
  // mevcut sayfalara içeride rewrite edilir. Eski Türkçe segmentler kalıcı yönlenir.
  if (firstSeg === 'en') {
    const segments = pathname.split('/').filter(Boolean);
    const second = segments[1]?.toLowerCase();
    const internalRoute = req.headers.get('x-promats-internal-route') === '1';
    if (!internalRoute && second && EN_INTERNAL_TO_EXTERNAL[second]) {
      const target = req.nextUrl.clone();
      segments[1] = EN_INTERNAL_TO_EXTERNAL[second];
      target.pathname = `/${segments.join('/')}`;
      return NextResponse.redirect(target, 301);
    }
    if (second && EN_EXTERNAL_TO_INTERNAL[second]) {
      const target = req.nextUrl.clone();
      segments[1] = EN_EXTERNAL_TO_INTERNAL[second];
      target.pathname = `/${segments.join('/')}`;
      if (target.hostname === 'localhost' || target.hostname === '127.0.0.1') target.protocol = 'http:';
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-promats-internal-route', '1');
      return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
    }
  }

  // Locale prefix var ve destekli — olduğu gibi geç
  if (firstSeg && (SUPPORTED_LOCALES as readonly string[]).includes(firstSeg)) {
    return NextResponse.next();
  }

  // Koku canonical locale URL'sine yonlendir. Absolute internal rewrite,
  // reverse proxy arkasinda https://localhost:<port> ureterek 500'e yol acabilir.
  if (pathname === '/') {
    const host = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
      || req.headers.get('host')
      || req.nextUrl.host;
    const protocol = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
      || req.nextUrl.protocol.replace(':', '')
      || 'https';
    return NextResponse.redirect(
      new URL(`${basePath}/${DEFAULT_LOCALE}`, `${protocol}://${host}`),
      308,
    );
  }

  // Locale prefix YOK → default locale'e internal rewrite (URL bar'da `/` kalır)
  const url = req.nextUrl.clone();
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    url.protocol = 'http:';
  }
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // _next/static, _next/image hariç her şeyde çalış
    '/((?!_next/static|_next/image).*)',
  ],
};
