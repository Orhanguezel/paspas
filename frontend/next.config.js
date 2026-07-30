/** @type {import('next').NextConfig} */

// ✅ Bundle Analyzer (ANALYZE=true için)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

function imageHostsFromSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (!raw) return [];
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const proto = u.protocol === 'http:' ? 'http' : 'https';
    const out = [{ protocol: proto, hostname: host, pathname: '/**' }];
    if (host.startsWith('www.')) {
      out.push({ protocol: proto, hostname: host.slice(4), pathname: '/**' });
    } else if (host && host !== 'localhost' && !host.startsWith('127.')) {
      out.push({ protocol: 'https', hostname: `www.${host}`, pathname: '/**' });
    }
    return out;
  } catch {
    return [];
  }
}

// Subpath deploy (panel.avrasyaotomotiv.net/promats): PROMATS_BASE_PATH=/promats ile
// build alinir. Lokal dev'de bos -> kok '/'. Subpath'te next/image optimizer + basePath
// karmasasindan kacinmak icin gorseller unoptimized (asset'ler nginx kok-alias ile servis edilir).
const PROMATS_BASE_PATH = process.env.PROMATS_BASE_PATH || '';

const nextConfig = {
  turbopack: {},
  ...(PROMATS_BASE_PATH ? { basePath: PROMATS_BASE_PATH, output: 'standalone' } : {}),
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,

  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ✅ Experimental optimizations
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'lucide-react',
      'date-fns',
    ],
  },

  // ✅ Webpack config
  webpack: (config, { isServer }) => {
    return config;
  },

  images: {
    // Subpath build'de optimizer + basePath kombinasyonu kendi public gorselini bulamiyor;
    // unoptimized -> <img src="/userfiles/..."> dogrudan (nginx kok-alias servis eder).
    ...(PROMATS_BASE_PATH ? { unoptimized: true } : {}),
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },

      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
      ...imageHostsFromSiteUrl(),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  // Backend uploads klasörünü frontend domain'i üzerinden serve et.
  // Dev: localhost:3000/uploads/x.png → backend origin/uploads (varsayilan 8086)
  // Prod'da Nginx aynı yönlendirmeyi /uploads location bloğuyla yapar.
  async rewrites() {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8086/api/v1').replace(/\/+$/, '');
    const backendUrl = apiBase.replace(/\/api(\/v\d+)?\/?$/, '');
    const devApiV1 =
      process.env.NODE_ENV === 'development'
        ? [{ source: '/api/v1/:path*', destination: `${apiBase}/:path*` }]
        : [];
    return [
      ...devApiV1,
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];
  },

  async headers() {
    const staticContentCache = [
      {
        key: 'Cache-Control',
        value: 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    ];

    return [
      {
        source: '/:locale(tr|en|de)',
        headers: staticContentCache,
      },
      {
        source:
          '/:locale(tr|en|de)/:page(about|blog|explore|consultants|tarot|numeroloji|yildizname|kahve-fali|ruya-tabiri|faqs|editorial-policy|contact|pricing|become-consultant|booking|login|register|dashboard)',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/blog/:path*',
        headers: staticContentCache,
      },
      {
        source: '/:locale(tr|en|de)/consultants/:path*',
        headers: staticContentCache,
      },
    ];
  },

  async redirects() {
    return [
      // Eski IIS/ASP Promats sitesi — FTP yedeği + Access DB envanteri.
      // Domain geçişinden sonra mevcut Google sinyallerini yeni locale rotalarına taşır.
      { source: '/index.html', destination: '/tr', permanent: true },
      { source: '/index.asp', destination: '/tr', permanent: true },
      { source: '/hakkimizda.html', destination: '/tr/hakkimizda', permanent: true },
      { source: '/hakkimizda.asp', destination: '/tr/hakkimizda', permanent: true },
      { source: '/about-us.html', destination: '/en/about-us', permanent: true },
      { source: '/iletisim.html', destination: '/tr/iletisim', permanent: true },
      { source: '/iletisim.asp', destination: '/tr/iletisim', permanent: true },
      { source: '/contact.html', destination: '/en/iletisim', permanent: true },
      { source: '/urun-arama.html', destination: '/tr/urunler', permanent: true },
      { source: '/urun-arama.asp', destination: '/tr/urunler', permanent: true },
      { source: '/urunler.asp', destination: '/tr/urunler', permanent: true },

      { source: '/maximum-serisi.html', destination: '/tr/urunler/maximum-serisi', permanent: true },
      { source: '/star-plus-serisi.html', destination: '/tr/urunler/star-plus-serisi', permanent: true },
      { source: '/icon-serisi.html', destination: '/tr/urunler/icon-serisi', permanent: true },
      { source: '/pars-serisi.html', destination: '/tr/urunler/pars-serisi', permanent: true },
      { source: '/orbital-serisi.html', destination: '/tr/urunler/orbital-serisi', permanent: true },
      { source: '/basak-plus-serisi.html', destination: '/tr/urunler/basak-plus-serisi', permanent: true },
      { source: '/profesyonel-serisi.html', destination: '/tr/urunler/profesyonel-serisi', permanent: true },
      { source: '/tuna-serisi.html', destination: '/tr/urunler/tuna-serisi', permanent: true },

      { source: '/maximum-series.html', destination: '/en/urunler/maximum-series', permanent: true },
      { source: '/star-plus-series.html', destination: '/en/urunler/star-plus-series', permanent: true },
      { source: '/icon-series.html', destination: '/en/urunler/icon-series', permanent: true },
      { source: '/pars-series.html', destination: '/en/urunler/pars-series-4156973', permanent: true },
      { source: '/orbital-series.html', destination: '/en/urunler/orbital-series-4521350', permanent: true },
      { source: '/basak-plus-series.html', destination: '/en/urunler/basak-plus-series-1199545', permanent: true },
      { source: '/professional-series.html', destination: '/en/urunler/professional-series', permanent: true },
      { source: '/tuna-series.html', destination: '/en/urunler/tuna-series', permanent: true },

      { source: '/404.html', destination: '/tr', permanent: true },
      { source: '/:locale/gutschein', destination: '/:locale', permanent: true },
      { source: '/:locale/services', destination: '/:locale/consultants', permanent: true },
      { source: '/:locale/appointment', destination: '/:locale/consultants', permanent: true },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
