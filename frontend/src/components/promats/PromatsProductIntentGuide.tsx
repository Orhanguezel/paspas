import { DevNote } from '@/components/devnote';
import type { Product } from '@/lib/promats/api';
import { localeHref as href } from '@/lib/promats/links';

import { PmSectionHeading } from './PromatsModernShell';

type GuideCard = {
  title: string;
  body: string;
  cta: string;
  href: string;
};

function productSearchText(product: Product): string {
  return [
    product.name,
    product.hero.title1,
    product.hero.title2,
    product.hero.description,
    product.sections.conceptTitle,
    product.sections.conceptSubtitle,
    product.sections.conceptLabel,
    product.sections.conceptDescription,
  ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
}

function productLink(locale: string, products: Product[], marker: '3d' | '5d'): string {
  const match = products.find((product) => productSearchText(product).includes(marker));
  return href(locale, match ? `/urunler/${match.slug}` : '/urunler');
}

function copy(locale: string, products: Product[]) {
  const threeDimensional = productLink(locale, products, '3d');
  const fiveDimensional = productLink(locale, products, '5d');

  if (locale === 'en') {
    return {
      eyebrow: 'PRODUCT AND SUPPLY GUIDE',
      title: 'Universal, 3D, 5D and deep tray car mats',
      intro: 'Use the published series records to compare construction and intended use. Confirm current dimensions, availability, quantity and commercial terms with Promats before ordering.',
      cards: [
        {
          title: 'Universal car mats and trim to fit car mats',
          body: 'Promats universal PVC car mats use recorded trim guides and series-specific designs. Universal does not mean automatic compatibility with every vehicle; check the relevant series before use.',
          cta: 'Compare all series',
          href: href(locale, '/urunler'),
        },
        {
          title: '3D car mats and deep tray car mats',
          body: 'The catalogue includes 3D and raised-edge product concepts where the individual series record states those features. Follow the linked product page for the published construction details.',
          cta: 'View a 3D series',
          href: threeDimensional,
        },
        {
          title: '5D car mats',
          body: 'The 5D designation is used only for a series whose current Promats catalogue record identifies that concept. Review the product page instead of applying the label to the full range.',
          cta: 'View the 5D series',
          href: fiveDimensional,
        },
        {
          title: 'Wholesale car mats: manufacturer and car mat exporter',
          body: 'Importers, distributors and private-label buyers can submit the target market, relevant series and approximate quantity for evaluation. Promats confirms current wholesale and export terms separately.',
          cta: 'Explore OEM and wholesale supply',
          href: href(locale, '/oem-manufacturing'),
        },
      ] satisfies GuideCard[],
    };
  }

  return {
    eyebrow: 'ÜRÜN VE TEDARİK REHBERİ',
    title: 'Universal, 3D, 5D ve havuzlu oto paspas seçenekleri',
    intro: 'Ürünleri yayımlanmış seri kayıtlarına göre karşılaştırın. Güncel ölçü, bulunabilirlik, miktar ve ticari koşulları sipariş öncesinde Promats ile teyit edin.',
    cards: [
      {
        title: 'Universal oto paspas ve kesilebilir yapı',
        body: 'Promats universal PVC oto paspas serilerinde kayıtlı kesim bölgeleri ve seriye özel tasarımlar bulunur. Universal ifadesi her araca kontrolsüz uyumluluk anlamına gelmez.',
        cta: 'Tüm serileri karşılaştırın',
        href: href(locale, '/urunler'),
      },
      {
        title: '3D oto paspas ve havuzlu oto paspas',
        body: 'Katalogda yalnız kendi seri kaydında belirtilen ürünler için 3D ve yükseltilmiş kenarlı havuzlu tasarım ifadeleri kullanılır. Yapı ayrıntılarını ilgili ürün sayfasından inceleyin.',
        cta: 'Bir 3D seriyi inceleyin',
        href: threeDimensional,
      },
      {
        title: '5D oto paspas',
        body: '5D tanımı yalnız güncel Promats katalog kaydında bu konseptle belirtilen seri için kullanılır. Bu ifadeyi tüm ürün gamına uygulamak yerine ilgili seri sayfasını kontrol edin.',
        cta: '5D seriyi inceleyin',
        href: fiveDimensional,
      },
      {
        title: 'Oto paspas üreticisi: toptan ve OEM talepleri',
        body: 'Oto paspas toptan tedarik talebinizde hedef pazarı, ilgili seriyi ve yaklaşık miktarı iletin. Promats güncel üretim, distribütörlük, private label ve ticari koşulları ayrıca teyit eder.',
        cta: 'Toptan talep oluşturun',
        href: href(locale, '/iletisim'),
      },
    ] satisfies GuideCard[],
  };
}

export default function PromatsProductIntentGuide({ locale, products }: { locale: string; products: Product[] }) {
  const content = copy(locale, products);

  return (
    <section className="pm-section pm-section--panel position-relative" aria-labelledby="product-intent-guide-title">
      <DevNote section="urunler-niyet-rehberi" title="Ürünler: Arama Niyeti Rehberi" />
      <div className="container">
        <div className="pm-section__head" id="product-intent-guide-title">
          <PmSectionHeading line1={content.eyebrow} line2={content.title} intro={content.intro} />
        </div>
        <ul className="pm-cards pm-cards--4">
          {content.cards.map((card, index) => (
            <li className="pm-card pm-card--series" key={card.title} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
              <h3 className="pm-card__title">{card.title}</h3>
              <p className="pm-card__body">{card.body}</p>
              <a className="pm-card__link" href={card.href}>{card.cta}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
