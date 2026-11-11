import { localeHref as href } from '@/lib/promats/links';

const COPY = {
  tr: {
    eyebrow: 'PROMATS REHBERİ',
    title: 'Ürün, üretim ve teknik kaynakları birlikte inceleyin',
    links: [
      ['Hakkımızda', '/hakkimizda', 'Promats’ın üretim yaklaşımı, kurumsal yapısı ve kalite sistemi'],
      ['Üretim', '/uretim', 'PVC oto paspas geliştirme, kalıp, kontrol ve sevkiyat süreci'],
      ['Ürün serileri', '/urunler', 'Universal PVC oto paspas serileri ve teknik özellikleri'],
      ['Teknik kaynaklar', '/kaynaklar', 'Malzeme, dayanıklılık ve kalıp hassasiyeti hakkında içerikler'],
      ['İletişim', '/iletisim', 'Ürün, teklif, distribütörlük ve OEM üretim talepleri'],
    ],
  },
  en: {
    eyebrow: 'PROMATS GUIDE',
    title: 'Explore products, manufacturing and technical resources together',
    links: [
      ['About Promats', '/hakkimizda', 'Promats manufacturing approach, company profile and quality system'],
      ['Manufacturing', '/uretim', 'PVC car mat development, tooling, inspection and dispatch process'],
      ['Product series', '/urunler', 'Universal PVC car mat series and technical characteristics'],
      ['Technical resources', '/kaynaklar', 'Guides to materials, durability and tooling accuracy'],
      ['Contact', '/iletisim', 'Product, quotation, distribution and OEM manufacturing enquiries'],
    ],
  },
} as const;

export default function PromatsDiscoveryLinks({ locale }: { locale: string }) {
  const copy = locale === 'en' ? COPY.en : COPY.tr;
  return (
    <nav className="pm-discovery" aria-label={copy.title}>
      <div className="container">
        <p className="pm-discovery__eyebrow">{copy.eyebrow}</p>
        <h2 className="pm-discovery__title">{copy.title}</h2>
        <ul className="pm-discovery__grid">
          {copy.links.map(([label, path, description]) => (
            <li key={path}>
              <a href={href(locale, path)}>
                <strong>{label}</strong>
                <span>{description}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
