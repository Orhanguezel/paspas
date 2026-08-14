import type { Product, SpecialPage } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { assetPath, decodeHtml, t } from '@/lib/promats/api';
import { localeHref as href } from '@/lib/promats/links';

import PromatsHeroBg from './PromatsHeroBg';
import PromatsImage from './PromatsImage';
import PromatsProductCarousel from './PromatsProductCarousel';

type Props = {
  locale: string;
  product: Product;
  related: Product[];
  settings: Record<string, string>;
  cards: SpecialPage | null;
};

type TransportIcons = {
  car?: string;
  boat?: string;
  air?: string;
  train?: string;
};

function settingValue(settings: Record<string, string>, key: string): string | null {
  const value = settings[key];
  return value && value.trim() ? value : null;
}

function parseStringList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}

function parseTransportIcons(value: string | null): TransportIcons | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    return {
      car: typeof record.car === 'string' ? record.car : undefined,
      boat: typeof record.boat === 'string' ? record.boat : undefined,
      air: typeof record.air === 'string' ? record.air : undefined,
      train: typeof record.train === 'string' ? record.train : undefined,
    };
  } catch {
    return null;
  }
}

export default function PromatsProductDetail({ locale, product, related, settings, cards }: Props) {
  const s = product.sections;
  const colors = (product.features ?? []).filter((item) => item.type === 1 && item.image);
  const icons = (product.features ?? []).filter((item) => item.type === 2 && item.image);
  const setItems = (product.features ?? []).filter((item) => item.type === 3 && item.image);
  const dims = s.dimensions;
  const numberIcon = settingValue(settings, 'product_icon_number');
  const derinHavuzluIcon = settingValue(settings, 'product_img_derin_havuzlu');
  const bottomArrowIcon = settingValue(settings, 'product_icon_bottom_arrow');
  const optionImages = parseStringList(settingValue(settings, 'product_imgs_option'));
  const transportIcons = parseTransportIcons(settingValue(settings, 'product_icons_transport'));
  const overviewTitle = settingValue(settings, 'ŞIK BİR GÖRÜNÜM KATAR...');
  const overviewDescription = settingValue(settings, 'Özel kalıplanmış pvc desenler ile aracınızın içinde görsel olarak öne çıkar.');
  const setTitle = settingValue(settings, '5 PARÇA TAM SET');
  const setSubtitle = settingValue(settings, 'Şaft Tüneli Dahil');
  const relatedTitle = settingValue(settings, 'DİĞER ÜRÜNLER');
  const hasDerinHavuzlu = Boolean(
    derinHavuzluIcon
    && bottomArrowIcon
    && (s.conceptImage || s.conceptTitle || s.conceptSubtitle || s.conceptLabel || s.conceptDescription),
  );
  const hasOverview = Boolean(overviewTitle || overviewDescription || icons.length || s.detailImage || s.backgroundImage);
  const hasSet = Boolean(s.setImage || setItems.length);
  const relatedItems = related.filter((item) => item.id !== product.id);
  const hasRelated = Boolean(relatedTitle && relatedItems.length);
  const dimensionRows = [
    { image: optionImages[0], val: dims[0] },
    { image: optionImages[1], val: dims[1] },
    { image: optionImages[2], val: dims[2] },
  ].filter((row): row is { image: string; val: string } => Boolean(row.image && row.val));
  const transportRows = transportIcons
    ? [transportIcons.car, transportIcons.boat, transportIcons.air, transportIcons.train].filter((item): item is string => Boolean(item))
    : [];
  const exportTitle = settingValue(settings, '35’TEN FAZLA ÜLKEYE İHRACAT!');
  const exportDescription = settingValue(settings, 'Hava, Tren, Karayolu ya da su yolu üzerinden güvenli alışveriş.');
  const hasSpecs = Boolean(dimensionRows.length || dims[3] || dims[4] || exportTitle || exportDescription || transportRows.length);
  const detailSections = [
    ['Ürün Açıklaması', product.detailContent?.description],
    ['Teknik Özellikler', product.detailContent?.technical],
    ['Kullanım Alanları', product.detailContent?.usage],
    ['Avantajları', product.detailContent?.advantages],
    ['Malzeme ve Dayanıklılık', product.detailContent?.material],
    ['Universal Tasarım', product.detailContent?.universal],
  ].filter((item): item is [string, string] => Boolean(item[1]?.trim()));

  return (
    <>
      {/* 1 — Hero: başlık + açıklama + First Class rozeti + Renkler */}
      <PromatsHeroBg src={product.hero.image} priority className="untree_co--site-hero inner-page promats-product-hero">
        <DevNote section="product-hero" title="Ürün Detay Hero" />
        <div className="container">
          <div className="row align-items-center">
            <div className="col-12 col-lg-5">
              <div className="site-hero-contents" data-aos="fade-up" data-aos-delay="200">
                {numberIcon ? (
                  <PromatsImage
                    src={numberIcon}
                    alt=""
                    width={130}
                    height={130}
                    className="float-right number1"
                  />
                ) : null}
                <h2>
                  {product.hero.title1}
                  <span>{product.hero.title2}</span>
                </h2>
                <span dangerouslySetInnerHTML={{ __html: decodeHtml(product.hero.description) }} />
                {colors.length ? (
                  <>
                    <b>{t(settings, 'Renkler')}</b>
                    <div className="row colors">
                      {colors.map((color) => {
                        const [name, code] = (color.feature ?? '').split('|');
                        return (
                          <div className="col-4" key={color.id}>
                            <PromatsImage src={color.image} alt="" className="img-fluid" sizes="120px" loading="lazy" />
                            <span>
                              {name}
                              {code ? <em>{code}</em> : null}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </PromatsHeroBg>

      {/* 2 — Derin Havuzlu (3D konsept) */}
      {hasDerinHavuzlu ? (
        <section className="derin-havuzlu product-body position-relative">
          <DevNote section="product-derin" title="Derin Havuzlu" />
          <div className="container">
            <div className="row no-gutters">
              <PromatsImage
                src={bottomArrowIcon}
                alt=""
                width={90}
                height={90}
                className="top-arrow"
              />
              <div className="col-12 col-lg-5 right-column order-2 order-lg-1 product-prop" data-aos="fade-up" data-aos-delay="200">
                {s.conceptImage ? (
                  <PromatsImage src={s.conceptImage} alt={product.name} className="img-fluid" sizes="(max-width: 768px) 100vw, 42vw" loading="lazy" />
                ) : null}
              </div>
              <div
                className="col-12 col-lg-7 left-column d-flex align-items-center justify-content-center order-1 order-lg-2"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <div className="row mt-4">
                  <div className="col-4 col-lg-4 text-right">
                    <PromatsImage src={derinHavuzluIcon} alt="" width={120} height={170} className="mt-5" />
                  </div>
                  <div className="col-8 col-lg-8 pb-4 pb-lg-0">
                    {s.conceptTitle ? <em>{s.conceptTitle}</em> : null}
                    <h2>
                      <span>{s.conceptSubtitle}</span>
                      {s.conceptLabel}
                    </h2>
                    <span className="text-dark">{s.conceptDescription}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 3 — Şık bir görünüm katar (özellik ikonları) */}
      {hasOverview ? (
        <section
          className="untree_co--site-section section2_bg promats-product-overview position-relative"
          style={
            s.backgroundImage
              ? {
                  // Arka plan görseli tüm bölümü kaplasın (renk sola doğru devam etsin,
                  // müşteri notu 07d1d6fb "mevcut sayfadaki gibi"). Önceden sağa yaslıydı
                  // (backgroundPosition:right) → solda beyaz, ortada keskin kenar oluşuyordu.
                  backgroundImage: `url('${assetPath(s.backgroundImage)}'), linear-gradient(white, white)`,
                  backgroundColor: 'white',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                  backgroundRepeat: 'no-repeat',
                }
              : { backgroundColor: 'white' }
          }
        >
        <DevNote section="product-overview" title="Şık Görünüm" />
        <div className="container">
          <div className="row custom-row-02192 align-items-stretch">
            <div className="col-12 col-lg-5 offset-lg-1 mb-5 order-2 order-lg-1" data-aos="fade-up" data-aos-delay="200">
              <div className="text-center text-lg-left h-100">
                {overviewTitle ? <h2 className="yellow-header promats-flow-heading">{overviewTitle}</h2> : null}
                {overviewDescription}
                {icons.length ? (
                  <div className="product-prop-icons">
                    <div className="icons">
                      {icons.map((icon) => (
                        <div className="icon mt-2" key={icon.id}>
                          <PromatsImage src={icon.image} alt="" width={64} height={64} sizes="64px" />
                          <span>{icon.feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="col-12 col-lg-5 offset-lg-1 mb-5 order-1 order-lg-2" data-aos="fade-up" data-aos-delay="100">
              <div className="text-center h-100">
                {s.detailImage ? (
                  <PromatsImage src={s.detailImage} alt={product.name} className="img-fluid" sizes="(max-width: 768px) 100vw, 42vw" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* 4 — 5 Parça Tam Set */}
      {hasSet ? (
        <section className="untree_co--site-section promats-product-set position-relative">
          <DevNote section="product-set" title="5 Parça Tam Set" />
          <div className="container">
            <div className="row">
              <div className="col-12 col-lg-8" data-aos="fade-up" data-aos-delay="200">
                {s.setImage ? (
                  <PromatsImage src={s.setImage} alt={product.name} className="img-fluid" sizes="(max-width: 768px) 100vw, 66vw" loading="lazy" />
                ) : null}
              </div>
              <div className="col-12 col-lg-4 text-center text-lg-left" data-aos="fade-up" data-aos-delay="200">
                {setTitle ? <h2 className="yellow-header promats-flow-heading">{setTitle}</h2> : null}
                {setSubtitle ? <span className="clearfix">{setSubtitle}</span> : null}
                {setItems.map((item) => (
                  <div className="row no-gutters tam_set" key={item.id}>
                    <div className="col-12 col-lg-7 tam_set_media">
                      <PromatsImage src={item.image} alt="" className="img-fluid" sizes="(max-width: 768px) 100vw, 25vw" loading="lazy" />
                    </div>
                    <div className="col-12 col-lg-5 d-flex align-items-center tam_set_caption">
                      <span>{item.feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5 — Ortak özellik kartları (Anasayfa 3lü Özellikler) */}
      {cards?.detail ? (
        <section className="untree_co--site-section section4_bg product_section4 position-relative">
          <DevNote section="product-cards" title="Özellik Kartları" />
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div
                  className="row properties"
                  data-aos="fade-up"
                  data-aos-delay="200"
                  dangerouslySetInnerHTML={{ __html: decodeHtml(cards.detail) }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {detailSections.length ? (
        <section className="untree_co--site-section promats-product-content position-relative">
          <DevNote section="product-content" title="Ürün SEO / GEO İçerikleri" />
          <div className="container">
            <div className="promats-product-accordions">
              {detailSections.map(([label, content], index) => (
                <details key={label} open={index === 0}>
                  <summary>{t(settings, label)}</summary>
                  <div className="promats-product-accordion-body" dangerouslySetInnerHTML={{ __html: decodeHtml(content) }} />
                </details>
              ))}
            </div>
            {product.detailContent?.sourceUrl ? (
              <a className="promats-product-source" href={product.detailContent.sourceUrl} target="_blank" rel="noreferrer">
                {t(settings, 'Devamını Oku')}
              </a>
            ) : null}
            <div className="promats-product-interest">
              <div>
                <strong>{t(settings, 'Bu ürünle ilgileniyor musunuz?')}</strong>
                <span>{product.name}</span>
              </div>
              <a className="btn btn-yellow" href={href(locale, `/iletisim?product=${encodeURIComponent(product.slug)}&requestType=quote#iletisimform`)}>
                {t(settings, 'Bu ürünle ilgileniyorum')}
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* 6 — Diğer Ürünler */}
      {hasRelated ? (
        <section className="untree_co--site-section promats-product-related position-relative">
        <DevNote section="product-related" title="Diğer Ürünler" />
        <div className="container">
          <h1 className="other-header text-center">{relatedTitle}</h1>
          <PromatsProductCarousel locale={locale} products={related} excludeId={product.id} settings={settings} />
        </div>
      </section>
      ) : null}

      {/* 7 — Ebatlar / Koli / İhracat */}
      {hasSpecs ? (
        <section className="section7_bg position-relative">
        <DevNote section="product-specs" title="Ebatlar / İhracat" />
        <div className="row">
          {dimensionRows.length || dims[3] || dims[4] ? (
            <div className="col-12 col-lg-4 text-center product-option-black">
            <div className="row">
              {dimensionRows.length ? (
                <div className="col-6">
                <h3>{t(settings, 'EBATLAR')}</h3>
                {dimensionRows.map((row) => (
                  <div className="row no-gutters mt-4" key={row.image}>
                    <div className="col-5">
                      <PromatsImage src={row.image} alt="" width={80} height={80} className="img-fluid" />
                    </div>
                    <div className="col-7 d-flex align-items-center">{row.val}</div>
                  </div>
                ))}
              </div>
              ) : null}
              {dims[3] || dims[4] ? (
                <div className="col-6">
                <h3>{t(settings, 'KOLİ İÇİ ADET')}</h3>
                {dims[3] ? <div className="row no-gutters mt-4">
                  <div className="col-7">
                    <h4>
                      {locale === 'tr' ? <span>{t(settings, 'TAKIM AĞIRLIĞI')}</span> : null}
                      {t(settings, 'SET WEIGHT')}
                    </h4>
                  </div>
                  <div className="col-5 d-flex align-items-center">{dims[3]}</div>
                </div> : null}
                {dims[4] ? <div className="row no-gutters mt-4">
                  <div className="col-7">
                    <h4>
                      {locale === 'tr' ? <span>{t(settings, 'KOLİ AĞIRLIĞI')}</span> : null}
                      {t(settings, 'PACK WEIGHT')}
                    </h4>
                  </div>
                  <div className="col-5 d-flex align-items-center">{dims[4]}</div>
                </div> : null}
              </div>
              ) : null}
            </div>
          </div>
          ) : null}
          {exportTitle || exportDescription || transportRows.length ? (
            <div className="col-12 col-lg-6 text-center product-option-yellow">
            {exportTitle ? <h4>{exportTitle}</h4> : null}
            {exportDescription ? <span>{exportDescription}</span> : null}
            {transportRows.length ? (
              <div className="d-flex justify-content-center mt-4 product-transport">
              {transportRows.map((icon) => (
                <div key={icon}>
                  <PromatsImage src={icon} alt="" width={60} height={60} />
                </div>
              ))}
            </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </section>
      ) : null}
    </>
  );
}
