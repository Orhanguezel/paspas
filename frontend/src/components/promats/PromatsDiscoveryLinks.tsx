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
    evidenceTitle: 'Promats veri ve yayın notu',
    evidenceText: (productCount: number) =>
      `Kendi katalog verilerimiz bu sitede ${productCount} adet aktif PVC oto paspas serisini kapsar. Kurumsal kaydımız 2017 kuruluş yılını, güncel ürün çerçevemiz 3 adet standart renk seçeneğini ve marka profilimiz 35 adetten fazla ihracat ülkesini gösterir. İçerik yöntemimiz; seri kayıtlarını, yayımlanmış teknik özellikleri ve üretim süreci açıklamalarını birlikte kontrol etmektir. Kesin ölçü, bulunabilirlik ve ticari koşullar sipariş veya üretim kararı öncesinde Promats ekibiyle yeniden teyit edilir.`,
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
    evidenceTitle: 'Promats data and publishing note',
    evidenceText: (productCount: number) =>
      `Our catalogue data covers ${productCount} active PVC car mat series on this website. The company record starts in 2017, the current product framework lists 3 standard colour options, and the brand profile records exports to more than 35 countries. Our publishing method checks series records, published technical specifications and manufacturing-process explanations together. Exact dimensions, availability and commercial terms are reconfirmed with the Promats team before an order or manufacturing decision.`,
  },
} as const;

export default function PromatsDiscoveryLinks({ locale, productCount }: { locale: string; productCount: number }) {
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
        <aside className="pm-discovery__evidence" aria-labelledby="promats-evidence-title">
          <h3 id="promats-evidence-title">{copy.evidenceTitle}</h3>
          <p>{copy.evidenceText(productCount)}</p>
        </aside>
      </div>
    </nav>
  );
}
