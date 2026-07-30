import type { Product, SpecialPage } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { decodeHtml, t } from '@/lib/promats/api';

import PromatsHeroSlider from './PromatsHeroSlider';
import PromatsImage from './PromatsImage';
import PromatsProductCarousel from './PromatsProductCarousel';
import { localeHref as href } from '@/lib/promats/links';

type Props = {
  locale: string;
  banners: SpecialPage[];
  products: Product[];
  settings: Record<string, string>;
  whyPromats: SpecialPage | null;
  features: SpecialPage | null;
  homeCards: SpecialPage | null;
  exportSection: SpecialPage | null;
};


function featureIcons(product: Product): NonNullable<Product['features']> {
  return (product.features ?? []).filter((item) => item.type === 2 && item.image);
}

function localizedWhyPromatsDetail(locale: string, value: string | null | undefined): string {
  const html = decodeHtml(value);
  if (locale !== 'en') return html;
  return html.replace(/NEDEN\s+PROMATS\?/gi, 'WHY PROMATS?');
}

export default function PromatsHome({
  locale,
  banners,
  products,
  settings,
  whyPromats,
  features,
  homeCards,
  exportSection,
}: Props) {
  const showcase = products[0] ?? null;
  const showcaseIcons = showcase ? featureIcons(showcase) : [];

  return (
    <>
      <div className="position-relative">
        <DevNote section="home-hero" title="Anasayfa Hero" />
        <PromatsHeroSlider locale={locale} banners={banners} />
      </div>

      {showcase ? (
        <section className="untree_co--site-section section2_bg promats-home-products position-relative" id="products">
          <DevNote section="home-urunler" title="Anasayfa Ürünler" />
          <div className="container">
            <div className="row custom-row-02192 align-items-stretch">
              <div className="col-md-6 col-lg-6 mb-5" data-aos="fade-up" data-aos-delay="100">
                <div className="text-center h-100">
                  <PromatsImage
                    src={showcase.sections.detailImage}
                    alt={showcase.name}
                    className="img-fluid"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              <div className="col-md-6 col-lg-6 mb-5" data-aos="fade-up" data-aos-delay="200">
                <div className="text-left h-100">
                  <h1 className="product_showcase_header d-none d-lg-block">{t(settings, 'ÜRÜNLER')}</h1>
                  <fieldset className="col-md-12 col-lg-8 text-center product_showcase_prop mt-1 mt-lg-5 pb-3">
                    <legend>{showcase.hero.title1}<span>{showcase.hero.title2}</span></legend>
                    {t(settings, 'Özel kalıplanmış pvc desenler ile aracınızın içinde görsel olarak öne çıkar.')}
                    {showcaseIcons.length ? (
                      <div className="icons">
                        {showcaseIcons.map((icon) => (
                          <div className="icon mt-2" key={icon.id}>
                            <PromatsImage src={icon.image} alt="" width={64} height={64} sizes="64px" />
                            <span>{icon.feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <a href={href(locale, `/urunler/${showcase.slug}`)} title={showcase.name} className="btn btn-yellow promats-product-cta">
                      {t(settings, 'Ürüne Git')}
                    </a>
                  </fieldset>
                </div>
              </div>
            </div>

            <PromatsProductCarousel locale={locale} products={products} excludeId={showcase.id} settings={settings} />
          </div>
        </section>
      ) : null}

      {whyPromats ? (
        <section className="black_bg black_showreel promats-why-section position-relative">
          <DevNote section="home-neden-promats" title="Neden Promats" />
          <h1 className="d-none d-lg-block promats-why-watermark">{whyPromats.title}</h1>
          <div className="container">
            <div className="row no-gutters align-items-center">
              <div className="col-12 col-lg-6 promats-why-copy" data-aos="fade-up" data-aos-delay="200" dangerouslySetInnerHTML={{ __html: localizedWhyPromatsDetail(locale, whyPromats.detail) }} />
              <div className="col-12 col-lg-6 promats-why-media d-none d-lg-block" data-aos="fade-up" data-aos-delay="200">
                <PromatsImage src={whyPromats.image} alt="" className="img-fluid" sizes="75vw" loading="lazy" />
              </div>
            </div>
          </div>
        </section>
      ) : null}

        <section className="untree_co--site-section section4_bg promats-home-features position-relative" id="features">
        <DevNote section="home-ozellikler" title="Anasayfa Özellikler" />
        <div className="container">
          <div className="row">
            <div className="col-12">
              {features ? (
                <>
                  <h1 className="text-center promats-section-title">{features.title}</h1>
                  <div className="row derin-havuzlu no-gutters" data-aos="fade-up" data-aos-delay="200">
                    <div className="col-12 col-lg-7 left-column d-flex align-items-center justify-content-center order-2 order-lg-1">
                      <div className="row mt-4" dangerouslySetInnerHTML={{ __html: decodeHtml(features.detail) }} />
                    </div>
                    <div className="col-12 col-lg-5 right-column order-1 order-lg-2">
                      <PromatsImage src={features.image} alt="" className="img-fluid" sizes="(max-width: 768px) 100vw, 42vw" loading="lazy" />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="row properties" data-aos="fade-up" data-aos-delay="200" dangerouslySetInnerHTML={{ __html: decodeHtml(homeCards?.detail) }} />
            </div>
          </div>
        </div>
      </section>

      <section className="untree_co--site-section section5_bg promats-newsletter position-relative" id="iletisimform">
        <DevNote section="home-ebulten" title="E-bülten" />
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-6 offset-0 offset-lg-3 text-center">
              <h4>{t(settings, 'E-BÜLTENE KAYDOLUN!')}</h4>
              <span>{t(settings, 'Yeniliklerden ilk önce sizin haberiniz olsun!')}</span>
              <form action={href(locale, '/iletisim')} method="get" className="form-subscribe mt-4">
                <div className="form-group d-flex">
                  <label className="sr-only" htmlFor="promats-newsletter-email">{t(settings, 'E-Mail')}</label>
                  <input id="promats-newsletter-email" type="email" className="form-control" placeholder={t(settings, 'E-Mail')} name="email" />
                  <button type="submit" className="btn btn-yellow px-4 text-white" aria-label={locale === 'en' ? 'Subscribe' : 'Abone ol'}><i className="icon-arrow-right" /></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section6_bg position-relative">
        <DevNote section="home-ihracat" title="İhracat Bölümü" />
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-8 offset-0 offset-lg-2 text-center" dangerouslySetInnerHTML={{ __html: decodeHtml(exportSection?.detail) }} />
          </div>
        </div>
      </section>
    </>
  );
}
