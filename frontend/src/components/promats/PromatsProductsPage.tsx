import { DevNote } from '@/components/devnote';
import type { Product, ProductFeature } from '@/lib/promats/api';
import { localeHref as href } from '@/lib/promats/links';

import PromatsImage from './PromatsImage';
import {
  PmContactBlock,
  PmHero,
  PmSectionHeading,
  PmStats,
  StackedTitle,
  type PmContactLabels,
  type PmStat,
  type TitleLines,
} from './PromatsModernShell';

export type UrunlerPageContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; headline: TitleLines; text: string };
  stats: PmStat[];
  list: { titleLine1: string; titleLine2: string; intro: string; cta: string; colorsLabel: string };
  features: { titleLine1: string; titleLine2: string; intro: string };
  contact: PmContactLabels;
};

// Ürün özellik tipleri (API `features[].type`): 1 = renk, 2 = ikonlu özellik.
const FEATURE_TYPE = { color: 1, icon: 2 } as const;

const SUMMARY_MAX = 132;

/**
 * `hero.description` alanı yönetim panelinden HTML olarak geliyor (<br />, &ouml; vb.).
 * Kart özetinde düz metin gerektiği için etiketler atılır, temel varlıklar çözülür ve
 * kelime sınırından kırpılır — böylece özet uzunluğu karttan karta tutarlı kalır.
 */
function toSummary(html: string | null): string {
  if (!html) return '';
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&sect;/g, 'ş')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= SUMMARY_MAX) return text;
  const cut = text.slice(0, SUMMARY_MAX);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * Rozet metni. Havuzlu serilerde konsept başlığı + alt başlık ("4D" + "KONSEPT") kullanılır.
 * Star/Başak serilerinde başlık boş gelir; orada alt başlık + etiket birleşir ("OEM" +
 * "KALİTE"), çünkü isim bu iki alana bölünmüş durumda.
 */
function conceptBadge(product: Product): string {
  const { conceptTitle, conceptSubtitle, conceptLabel } = product.sections;
  const parts = conceptTitle ? [conceptTitle, conceptSubtitle] : [conceptSubtitle, conceptLabel];
  return parts.filter(Boolean).join(' ');
}

/** Renk adı `"Siyah / Black|1112 101"` formatında; koda ve İngilizce karşılığa gerek yok. */
function colorNames(features: ProductFeature[] | undefined, locale: string): string[] {
  const names = (features ?? [])
    .filter((f) => f.type === FEATURE_TYPE.color && f.feature)
    .map((f) => {
      const [label] = (f.feature as string).split('|');
      const parts = (label ?? '').split('/').map((s) => s.trim());
      return (locale === 'en' ? parts[1] : parts[0]) ?? parts[0] ?? '';
    })
    .filter(Boolean);
  return [...new Set(names)];
}

/** Tüm serilerde geçen ikonlu özellikleri, ilk görülme sırasını koruyarak tekilleştirir. */
function sharedFeatures(products: Product[]): ProductFeature[] {
  const seen = new Map<string, ProductFeature>();
  for (const product of products) {
    for (const feature of product.features ?? []) {
      if (feature.type !== FEATURE_TYPE.icon || !feature.feature || !feature.image) continue;
      if (!seen.has(feature.feature)) seen.set(feature.feature, feature);
    }
  }
  return [...seen.values()];
}

export function PromatsProductsPage({ locale, products, content: c }: { locale: string; products: Product[]; content: UrunlerPageContent }) {
  const features = sharedFeatures(products);
  const heroImage = products[0]?.hero.image ?? null;

  return (
    <div className="promats-modern-page promats-products-page">
      <PmHero
        image={heroImage}
        eyebrow={c.hero.eyebrow}
        headline={c.hero.headline}
        text={c.hero.text}
        devNoteSection="urunler-hero"
        devNoteTitle="Ürünler Hero"
      />
      <PmStats stats={c.stats} />

      {/* SERİ KARTLARI */}
      <section className="pm-products position-relative">
        <DevNote section="urunler-liste" title="Ürünler Liste" />
        <div className="container">
          <PmSectionHeading line1={c.list.titleLine1} line2={c.list.titleLine2} intro={c.list.intro} />
          <ul className="pm-products__grid">
            {products.map((product, index) => {
              const badge = conceptBadge(product);
              const colors = colorNames(product.features, locale);
              return (
                <li className="pm-product" key={product.id} data-aos="fade-up" data-aos-delay={(index % 3) * 80}>
                  <a className="pm-product__link" href={href(locale, `/urunler/${product.slug}`)}>
                    <span className="pm-product__media">
                      {badge ? <span className="pm-product__badge">{badge}</span> : null}
                      <PromatsImage
                        src={product.sections.detailImage || product.hero.image}
                        alt={product.name}
                        width={720}
                        height={540}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px"
                      />
                    </span>
                    <span className="pm-product__body">
                      <span className="pm-product__name">{product.name}</span>
                      <span className="pm-product__summary">{toSummary(product.hero.description)}</span>
                      {colors.length ? (
                        <span className="pm-product__colors">
                          <span className="pm-product__colors-label">{c.list.colorsLabel}</span>
                          {colors.map((color) => (
                            <span className="pm-product__color" key={color}>
                              {color}
                            </span>
                          ))}
                        </span>
                      ) : null}
                      <span className="pm-product__cta">{c.list.cta}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ORTAK ÖZELLİKLER */}
      {features.length ? (
        <section className="pm-caps pm-caps--images position-relative">
          <DevNote section="urunler-ozellikler" title="Ürünler: Ortak Özellikler" />
          <div className="container">
            <PmSectionHeading line1={c.features.titleLine1} line2={c.features.titleLine2} intro={c.features.intro} />
            <ul className="pm-caps__grid">
              {features.map((feature, index) => (
                <li className="pm-cap" key={feature.feature} data-aos="fade-up" data-aos-delay={(index % 3) * 80}>
                  <span className="pm-cap__frame">
                    <PromatsImage src={feature.image} alt="" width={72} height={72} sizes="72px" />
                  </span>
                  <span className="pm-cap__label">
                    <StackedTitle lines={[feature.feature as string]} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <PmContactBlock labels={c.contact} devNoteSection="urunler-iletisim" devNoteTitle="Ürünler: Bize Ulaşın" />
    </div>
  );
}
