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
      ['Blog', '/blog', 'Ürün seçimi, kullanım ve üretim gündemine ilişkin güncel yazılar'],
      ['Sıkça sorulan sorular', '/faqs', 'Ürün, bakım, teklif ve üretim taleplerine verilen yanıtlar'],
      ['İletişim', '/iletisim', 'Ürün, teklif, distribütörlük ve OEM üretim talepleri'],
    ],
    evidenceTitle: 'Promats veri ve yayın notu',
    evidenceText: (productCount: number) =>
      `Bu sayfadaki birinci-el katalog kanıtını kendi veri setimizden hazırlıyoruz. Veri seti; sitede yayımlanan ${productCount} adet aktif PVC oto paspas serisini, 2017 yılından bu yana kullanılan kurumsal kaydı, 3 adet standart renk seçeneğini ve en az 35 adet ihracat ülkesini kapsar. Yöntemimiz; seri kayıtlarını, yayımlanmış teknik özellikleri ve üretim süreci açıklamalarını karşılaştırmalı incelemektir. Kesin ölçü, bulunabilirlik ve ticari koşullar sipariş veya üretim kararı öncesinde Promats ekibiyle yeniden teyit edilir.`,
    sourceLead: 'Kalite yönetim sistemi bağlamı için',
    sourceLabel: 'ISO’nun güncel ISO 9001 standardı kaydı',
    reviewedLabel: 'İçerik yöntemi son gözden geçirme',
    reviewedText: '12 Kasım 2026',
  },
  en: {
    eyebrow: 'PROMATS GUIDE',
    title: 'Explore products, manufacturing and technical resources together',
    links: [
      ['About Promats', '/hakkimizda', 'Promats manufacturing approach, company profile and quality system'],
      ['Manufacturing', '/uretim', 'PVC car mat development, tooling, inspection and dispatch process'],
      ['Product series', '/urunler', 'Universal PVC car mat series and technical characteristics'],
      ['Technical resources', '/kaynaklar', 'Guides to materials, durability and tooling accuracy'],
      ['Blog', '/blog', 'Current articles about product selection, use and manufacturing topics'],
      ['Frequently asked questions', '/faqs', 'Answers about products, care, quotations and manufacturing requests'],
      ['Contact', '/iletisim', 'Product, quotation, distribution and OEM manufacturing enquiries'],
    ],
    evidenceTitle: 'Promats data and publishing note',
    evidenceText: (productCount: number) =>
      `We prepare the first-party catalogue evidence on this page from our data set. The data set covers ${productCount} active PVC car mat series published on the website, the company record maintained since 2017, 3 standard colour options and exports to more than 35 countries. Our methodology compares series records, published technical specifications and manufacturing-process explanations. Exact dimensions, availability and commercial terms are reconfirmed with the Promats team before an order or manufacturing decision.`,
    sourceLead: 'For quality-management context, review',
    sourceLabel: 'ISO’s current ISO 9001 standard record',
    reviewedLabel: 'Content method last reviewed',
    reviewedText: '12 November 2026',
  },
} as const;

const ISO_9001_SOURCE = 'https://www.iso.org/standard/9001';

export default function PromatsDiscoveryLinks({ locale, productCount }: { locale: string; productCount: number }) {
  const copy = locale === 'en' ? COPY.en : COPY.tr;
  return (
    <section className="pm-discovery" aria-labelledby="promats-discovery-title">
      <div className="container">
        <p className="pm-discovery__eyebrow">{copy.eyebrow}</p>
        <h2 className="pm-discovery__title" id="promats-discovery-title">{copy.title}</h2>
        <nav aria-label={copy.title}>
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
        </nav>
        <aside className="pm-discovery__evidence" aria-labelledby="promats-evidence-title">
          <h3 id="promats-evidence-title">{copy.evidenceTitle}</h3>
          <div>
            <p>{copy.evidenceText(productCount)}</p>
            <p className="pm-discovery__source">
              {copy.sourceLead}{' '}
              <a href={ISO_9001_SOURCE}>{copy.sourceLabel}</a>.
              {' '}<span>{copy.reviewedLabel}:{' '}
                <time dateTime="2026-11-12">{copy.reviewedText}</time>
              </span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
