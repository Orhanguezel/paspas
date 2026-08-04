import { DevNote } from '@/components/devnote';
import type { Product } from '@/lib/promats/api';
import { localeHref as href } from '@/lib/promats/links';

import PromatsImage from './PromatsImage';
import PromatsOemContactForm from './PromatsOemContactForm';
import { PmHero, PmSectionHeading, PmStats, type PmStat } from './PromatsModernShell';

type Card = { title: string; body: string };
type Step = { num: string; title: string; body: string };
type Series = { name: string; ref: string; body: string; aliases?: string[] };

export type OemPageContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subheadline: string; badges: string[]; primaryCta: string; secondaryCta: string; highlight: string };
  numbers: { items: PmStat[] };
  whyChoose: { eyebrow: string; heading: string; intro: string; cards: Card[]; cta: string };
  manufacturerDirect: { eyebrow: string; heading: string; intro: string; tradingTitle: string; trading: string[]; directTitle: string; direct: string[]; cta: string };
  exportReach: { eyebrow: string; stat: string; statLabel: string; points: string[] };
  process: { eyebrow: string; heading: string; intro: string; steps: Step[] };
  oemPrivate: { eyebrow: string; heading: string; oemTitle: string; oem: string[]; plTitle: string; pl: string[]; cta: string };
  capabilities: { eyebrow: string; heading: string; intro: string; items: string[] };
  exportInfo: { eyebrow: string; heading: string; intro: string; items: Card[] };
  series: { eyebrow: string; heading: string; intro: string; cta: string; items: Series[] };
  faq: { eyebrow: string; heading: string; items: { q: string; a: string }[] };
  finalCta: { eyebrow: string; heading: string; text: string; quote: string; sample: string; catalogue: string; distributor: string };
  contact: {
    eyebrow: string; heading: string; lead: string; trust: string[]; factoryTag: string;
    form: Record<string, unknown>;
    success: string; error: string;
  };
};

const CATALOGUE_HREF = '/userfiles/files/e-catalogue.pdf';
const HERO_IMAGE = '/assets/images/uretim/tesis.jpg';

/** Türkçe-duyarlı normalize: seri adını ürün adıyla eşleştirmek için. */
function norm(value: string): string {
  return value
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Seri adına karşılık gelen ürün slug'ini bulur; yoksa null (liste sayfasına yönlenir).
 * Slug locale'e göre + rastgele son ekli olduğu için ad/alias üzerinden eşleşir.
 */
function matchSlug(series: Series, products: Product[]): string | null {
  const keys = [series.name, ...(series.aliases ?? [])].map(norm).filter(Boolean);
  if (!keys.length) return null;
  const found = products.find((p) => {
    const pn = norm(p.name);
    return keys.some((key) => pn === key || pn.includes(key) || key.includes(pn));
  });
  return found?.slug ?? null;
}

export function PromatsOemPage({ locale, products, content: c }: { locale: string; products: Product[]; content: OemPageContent }) {
  const distributorHref = href(locale, '/become-a-partner');
  const contactHref = href(locale, '/iletisim');

  return (
    <div className="promats-modern-page promats-oem-page">
      {/* HERO */}
      <PmHero
        image={HERO_IMAGE}
        assetBase="/assets"
        eyebrow={c.hero.eyebrow}
        headline={[c.hero.headline]}
        text={c.hero.subheadline}
        devNoteSection="oem-hero"
        devNoteTitle="OEM Hero"
      >
        <div className="pm-hero__cta">
          <a href={contactHref} className="pm-btn pm-btn--solid">{c.hero.primaryCta}</a>
          <a href={contactHref} className="pm-btn pm-btn--ghost">{c.hero.secondaryCta}</a>
        </div>
      </PmHero>

      <PmStats stats={c.numbers.items} />

      {/* NEDEN PROMATS */}
      <section className="pm-section pm-section--panel position-relative" id="oem-why">
        <DevNote section="oem-neden" title="OEM Neden Promats" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.whyChoose.eyebrow} line2={c.whyChoose.heading} intro={c.whyChoose.intro} />
          </div>
          <ul className="pm-cards pm-cards--4">
            {c.whyChoose.cards.map((card, index) => (
              <li className="pm-card" key={card.title} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
                <h3 className="pm-card__title">{card.title}</h3>
                <p className="pm-card__body">{card.body}</p>
              </li>
            ))}
          </ul>
          <div className="pm-section__cta">
            <a href={contactHref} className="pm-btn pm-btn--solid">{c.whyChoose.cta}</a>
          </div>
        </div>
      </section>

      {/* ÜRETİCİ vs TİCARET ŞİRKETİ */}
      <section className="pm-section position-relative">
        <DevNote section="oem-direkt" title="OEM Fabrikadan Direkt" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.manufacturerDirect.eyebrow} line2={c.manufacturerDirect.heading} intro={c.manufacturerDirect.intro} />
          </div>
          <div className="pm-compare">
            <div className="pm-compare__col pm-compare__col--con" data-aos="fade-up">
              <h3 className="pm-compare__title">{c.manufacturerDirect.tradingTitle}</h3>
              <ul className="pm-list pm-list--con">
                {c.manufacturerDirect.trading.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="pm-compare__col pm-compare__col--pro" data-aos="fade-up" data-aos-delay="100">
              <h3 className="pm-compare__title">{c.manufacturerDirect.directTitle}</h3>
              <ul className="pm-list pm-list--pro">
                {c.manufacturerDirect.direct.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className="pm-section__cta">
            <a href={contactHref} className="pm-btn pm-btn--solid">{c.manufacturerDirect.cta}</a>
          </div>
        </div>
      </section>

      {/* İHRACAT / GLOBAL ERİŞİM — koyu bant */}
      <section className="pm-darkband position-relative">
        <DevNote section="oem-ihracat" title="OEM İhracat" />
        <div className="container">
          <div className="pm-darkband__grid">
            <div className="pm-darkband__stat" data-aos="fade-up">
              <span className="pm-darkband__eyebrow">{c.exportReach.eyebrow}</span>
              <strong className="pm-darkband__value">{c.exportReach.stat}</strong>
              <span className="pm-darkband__label">{c.exportReach.statLabel}</span>
            </div>
            <ul className="pm-list pm-list--pro pm-list--light" data-aos="fade-up" data-aos-delay="100">
              {c.exportReach.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* SÜREÇ */}
      <section className="pm-section pm-section--panel position-relative" id="oem-process">
        <DevNote section="oem-surec" title="OEM Süreç" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.process.eyebrow} line2={c.process.heading} intro={c.process.intro} />
          </div>
          <ol className="pm-steps">
            {c.process.steps.map((step, index) => (
              <li className="pm-step" key={step.num} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
                <span className="pm-step__num">{step.num}</span>
                <h3 className="pm-step__title">{step.title}</h3>
                <p className="pm-step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* OEM & PRIVATE LABEL */}
      <section className="pm-section position-relative">
        <DevNote section="oem-privatelabel" title="OEM & Private Label" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.oemPrivate.eyebrow} line2={c.oemPrivate.heading} intro="" />
          </div>
          <div className="pm-oem-combined" data-aos="fade-up">
            <div>
              <h3 className="pm-compare__title">{c.oemPrivate.oemTitle}</h3>
              <ul className="pm-list pm-list--pro">
                {c.oemPrivate.oem.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="pm-compare__title">{c.oemPrivate.plTitle}</h3>
              <ul className="pm-list pm-list--pro">
                {c.oemPrivate.pl.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className="pm-section__cta">
            <a href={contactHref} className="pm-btn pm-btn--solid">{c.oemPrivate.cta}</a>
          </div>
        </div>
      </section>

      {/* ÜRETİM KABİLİYETLERİ */}
      <section className="pm-section pm-section--panel position-relative">
        <DevNote section="oem-kabiliyet" title="OEM Üretim Kabiliyetleri" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.capabilities.eyebrow} line2={c.capabilities.heading} intro={c.capabilities.intro} />
          </div>
          <ul className="pm-checklist">
            {c.capabilities.items.map((item, index) => (
              <li className="pm-checklist__item" key={item} data-aos="fade-up" data-aos-delay={(index % 3) * 60}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* İHRACAT BİLGİLERİ */}
      <section className="pm-section position-relative">
        <DevNote section="oem-ihracat-bilgi" title="OEM İhracat Bilgileri" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.exportInfo.eyebrow} line2={c.exportInfo.heading} intro={c.exportInfo.intro} />
          </div>
          <ul className="pm-cards pm-cards--3">
            {c.exportInfo.items.map((item, index) => (
              <li className="pm-card" key={item.title} data-aos="fade-up" data-aos-delay={(index % 3) * 60}>
                <h3 className="pm-card__title">{item.title}</h3>
                <p className="pm-card__body">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ÜRÜN SERİLERİ */}
      <section className="pm-section pm-section--panel position-relative" id="oem-products">
        <DevNote section="oem-seriler" title="OEM Ürün Serileri" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.series.eyebrow} line2={c.series.heading} intro={c.series.intro} />
          </div>
          <ul className="pm-cards pm-cards--4">
            {c.series.items.map((item, index) => {
              const slug = matchSlug(item, products);
              const product = slug ? products.find((candidate) => candidate.slug === slug) : null;
              const link = slug ? href(locale, `/urunler/${slug}`) : href(locale, '/urunler');
              return (
                <li className="pm-card pm-card--series" key={item.ref} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
                  {product?.sections.detailImage ? (
                    <PromatsImage src={product.sections.detailImage} alt={item.name} className="pm-card__product-image" sizes="(max-width: 768px) 50vw, 25vw" loading="lazy" />
                  ) : null}
                  <span className="pm-card__ref">{item.ref}</span>
                  <h3 className="pm-card__title">{item.name}</h3>
                  <p className="pm-card__body">{item.body}</p>
                  <a href={link} className="pm-card__link">{c.series.cta}</a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* SSS */}
      <section className="pm-section position-relative" id="oem-faq">
        <DevNote section="oem-sss" title="OEM SSS" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.faq.eyebrow} line2={c.faq.heading} intro="" />
          </div>
          <div className="pm-faq">
            {c.faq.items.map((item, index) => (
              <details className="pm-faq__item" key={item.q} data-aos="fade-up" open={index === 0}>
                <summary className="pm-faq__q">{item.q}</summary>
                <p className="pm-faq__a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="pm-section pm-section--panel position-relative" id="oem-inquiry">
        <DevNote section="oem-inquiry" title="OEM Inquiry Form" />
        <div className="container">
          <PmSectionHeading line1="OEM INQUIRY" line2="Tell Us About Your Project" intro="Share your requirements and our export team will contact you with the right production solution." />
          <PromatsOemContactForm
            labels={{
              company: 'Company', companyPh: 'Company', country: 'Country', countryPh: 'Country', phone: 'Phone', phonePh: 'Phone',
              website: 'Website', websitePh: 'Website', productInterest: 'Product interest', productInterestPh: 'Select product interest',
              quantity: 'Estimated quantity', quantityPh: 'Estimated quantity', email: 'E-mail', emailPh: 'E-mail', message: 'Project details',
              messagePh: 'Project details', submit: 'Send inquiry', sending: 'Sending…', note: 'Fields are used only to prepare and follow up your quotation.',
              interestOptions: c.series.items.map((item) => item.name),
            }}
            success="Your OEM quotation request has been received."
            error="Your request could not be sent. Please try again."
          />
        </div>
      </section>

      {/* SON CTA — koyu bant */}
      <section className="pm-darkband pm-darkband--cta position-relative">
        <DevNote section="oem-final-cta" title="OEM Son CTA" />
        <div className="container">
          <div className="pm-darkband__center" data-aos="fade-up">
            <span className="pm-darkband__eyebrow">{c.finalCta.eyebrow}</span>
            <h2 className="pm-darkband__heading">{c.finalCta.heading}</h2>
            <p className="pm-darkband__text">{c.finalCta.text}</p>
            <div className="pm-cta-row">
              <a href={contactHref} className="pm-btn pm-btn--solid">{c.finalCta.quote}</a>
              <a href={contactHref} className="pm-btn pm-btn--ghost">{c.finalCta.sample}</a>
              <a href={CATALOGUE_HREF} className="pm-btn pm-btn--ghost">{c.finalCta.catalogue}</a>
              <a href={distributorHref} className="pm-btn pm-btn--ghost">{c.finalCta.distributor}</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
