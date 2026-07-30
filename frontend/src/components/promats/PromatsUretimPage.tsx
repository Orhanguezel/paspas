import { DevNote } from '@/components/devnote';
import { localeHref as href } from '@/lib/promats/links';

import PromatsImage from './PromatsImage';
import { PromatsCheckCircle, PromatsUretimIcon } from './PromatsUretimIcons';
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

type UretimSection = {
  title: TitleLines;
  image: string;
  alt: string;
  paragraphs: string[];
  items: string[];
};

export type UretimPageContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; headline: TitleLines; text: string };
  stats: PmStat[];
  gallery: { image: string; alt: string }[];
  capabilities: {
    titleLine1: string;
    titleLine2: string;
    intro: string;
    items: { icon: string; label: TitleLines }[];
  };
  sections: UretimSection[];
  quality: { title: string; image: string; alt: string; items: string[]; text: string };
  shipping: { title: TitleLines; image: string; alt: string; paragraphs: string[]; cta: string };
  contact: PmContactLabels;
};

export function PromatsUretimPage({ locale, content: c }: { locale: string; content: UretimPageContent }) {

  return (
    <div className="promats-modern-page">
      <PmHero
        image="/assets/images/uretim/hero.jpg"
        assetBase="/assets"
        eyebrow={c.hero.eyebrow}
        headline={c.hero.headline}
        text={c.hero.text}
        devNoteSection="uretim-hero"
        devNoteTitle="Üretim Hero"
      />
      <PmStats stats={c.stats} />

      {/* GALERİ — bir geniş, altında iki eşit görsel */}
      <section className="pm-gallery position-relative">
        <DevNote section="uretim-galeri" title="Üretim Galeri" />
        <div className="container">
          <div className="pm-gallery__lead" data-aos="fade-up">
            <PromatsImage src={c.gallery[0]!.image} alt={c.gallery[0]!.alt} width={1400} height={749} assetBase="/assets" sizes="(max-width: 992px) 100vw, 1140px" />
          </div>
          <div className="pm-gallery__pair">
            {c.gallery.slice(1).map((item, index) => (
              <div className="pm-gallery__cell" key={item.image} data-aos="fade-up" data-aos-delay={index * 100}>
                <PromatsImage src={item.image} alt={item.alt} width={1040} height={592} assetBase="/assets" sizes="(max-width: 992px) 100vw, 560px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YETKİNLİKLER — dört çizgi ikon */}
      <section className="pm-caps position-relative">
        <DevNote section="uretim-yetkinlikler" title="Üretim Yetkinlikleri" />
        <div className="container">
          <PmSectionHeading
            line1={c.capabilities.titleLine1}
            line2={c.capabilities.titleLine2}
            intro={c.capabilities.intro}
          />
          <ul className="pm-caps__grid">
            {c.capabilities.items.map((item, index) => (
              <li className="pm-cap" key={item.icon} data-aos="fade-up" data-aos-delay={index * 80}>
                <PromatsUretimIcon name={item.icon} />
                <span className="pm-cap__label">
                  <StackedTitle lines={item.label} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SÜREÇ KARTLARI — metin kartı + taşan görsel, sırayla yön değiştirir */}
      <div className="pm-features">
        {c.sections.map((section, index) => (
          <section
            className={`pm-feature ${index % 2 === 1 ? 'pm-feature--reverse' : ''} position-relative`}
            key={section.title.join(' ')}
          >
            <DevNote section={`uretim-${index + 1}`} title={`Üretim: ${section.title.join(' ')}`} />
            <div className="container">
              <div className="pm-feature__grid">
                <div className="pm-feature__panel" data-aos="fade-up">
                  <h2 className="pm-feature__title">
                    <StackedTitle lines={section.title} />
                  </h2>
                  {section.paragraphs.map((text) => (
                    <p key={text.slice(0, 24)}>{text}</p>
                  ))}
                  {section.items.length ? (
                    <ul className="pm-feature__list">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="pm-feature__media" data-aos="fade-up" data-aos-delay="100">
                  <PromatsImage src={section.image} alt={section.alt} width={1200} height={894} assetBase="/assets" sizes="(max-width: 992px) 100vw, 520px" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* KALİTE KONTROL — turuncu tam genişlik bant */}
      <section className="pm-quality position-relative">
        <DevNote section="uretim-kalite" title="Üretim: Kalite Kontrol" />
        <div className="pm-quality__media" aria-hidden="true">
          <PromatsImage src={c.quality.image} alt="" fill sizes="(max-width: 992px) 100vw, 50vw" assetBase="/assets" />
        </div>
        <div className="container pm-quality__inner">
          <div className="pm-quality__copy" data-aos="fade-up">
            <h2 className="pm-quality__title">{c.quality.title}</h2>
            <ul className="pm-quality__list">
              {c.quality.items.map((item) => (
                <li key={item}>
                  <PromatsCheckCircle />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="pm-quality__text">{c.quality.text}</p>
          </div>
        </div>
      </section>

      {/* GÜVENLİ SEVKİYAT — siyah bant */}
      <section className="pm-shipping position-relative">
        <DevNote section="uretim-sevkiyat" title="Üretim: Sevkiyat" />
        <div className="container">
          <div className="pm-shipping__grid">
            <div className="pm-shipping__copy" data-aos="fade-up">
              <h2 className="pm-shipping__title">
                <StackedTitle lines={c.shipping.title} />
              </h2>
              {c.shipping.paragraphs.map((text) => (
                <p key={text.slice(0, 24)}>{text}</p>
              ))}
              <a className="pm-shipping__cta" href={href(locale, '/iletisim')}>
                {c.shipping.cta}
              </a>
            </div>
            <div className="pm-shipping__media" data-aos="fade-up" data-aos-delay="100">
              <PromatsImage src={c.shipping.image} alt={c.shipping.alt} width={1560} height={897} assetBase="/assets" sizes="(max-width: 992px) 100vw, 620px" />
            </div>
          </div>
        </div>
      </section>

      <PmContactBlock labels={c.contact} devNoteSection="uretim-iletisim" devNoteTitle="Üretim: Bize Ulaşın" />
    </div>
  );
}
