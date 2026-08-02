import { Fragment } from 'react';

import { DevNote } from '@/components/devnote';
import hakkimizdaContent from '@/config/pages/hakkimizda-page.json';
import { localeHref as href } from '@/lib/promats/links';

import PromatsImage from './PromatsImage';
import { PmHero, PmSectionHeading, StackedTitle } from './PromatsModernShell';
import { PromatsUretimIcon } from './PromatsUretimIcons';

type Cap = { no: string; icon: string; title: string; body: string };
type Step = { no: string; title: string; body: string };
type Value = { mark: string; title: string; body: string };
type Cert = { code: string; title: string; body: string };
type Milestone = { year: string; body: string };
type Link = { label: string; href: string };

type HakkimizdaContent = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; headline: string[]; text: string; cta: string };
  kimlik: { eyebrow: string; heading: string; paragraphs: string[]; image: string; imageAlt: string };
  yetkinlik: { eyebrowLine: string; headingLine: string; items: Cap[] };
  surec: { eyebrowLine: string; headingLine: string; intro: string; steps: Step[] };
  degerler: { eyebrowLine: string; headingLine: string; items: Value[] };
  sertifikalar: { eyebrowLine: string; headingLine: string; intro: string; items: Cert[] };
  yolculuk: { eyebrowLine: string; headingLine: string; items: Milestone[] };
  cta: { eyebrow: string; heading: string; text: string; links: Link[] };
};

const KIMLIK_ANCHOR = '#kurumsal-kimligimiz';

export function PromatsHakkimizdaPage({ locale }: { locale: string }) {
  const c = (hakkimizdaContent as Record<string, HakkimizdaContent>)[locale === 'en' ? 'en' : 'tr']!;

  return (
    <div className="promats-modern-page promats-hakkimizda-page">
      {/* HERO */}
      <PmHero
        image="/assets/images/uretim/tesis.jpg"
        assetBase="/assets"
        eyebrow={c.hero.eyebrow}
        headline={c.hero.headline}
        text={c.hero.text}
        devNoteSection="hakkimizda-hero"
        devNoteTitle="Kurumsal Hero"
      >
        <div className="pm-hero__cta">
          <a href={KIMLIK_ANCHOR} className="pm-btn pm-btn--solid">{c.hero.cta} →</a>
        </div>
      </PmHero>

      {/* KURUMSAL KİMLİĞİMİZ — metin + görsel */}
      <section className="pm-section position-relative" id="kurumsal-kimligimiz">
        <DevNote section="hakkimizda-kimlik" title="Kurumsal Kimliğimiz" />
        <div className="container">
          <div className="pm-about-split">
            <div className="pm-about-split__text" data-aos="fade-up">
              <span className="pm-eyebrow">{c.kimlik.eyebrow}</span>
              <h2 className="pm-about-split__title">{c.kimlik.heading}</h2>
              {c.kimlik.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="pm-about-split__media" data-aos="fade-up" data-aos-delay="100">
              <PromatsImage src={c.kimlik.image} alt={c.kimlik.imageAlt} width={865} height={576} assetBase="/assets" sizes="(max-width: 992px) 100vw, 560px" />
            </div>
          </div>
        </div>
      </section>

      {/* TEMEL YETKİNLİKLERİMİZ — ikonlu 4 kart */}
      <section className="pm-caps position-relative">
        <DevNote section="hakkimizda-yetkinlik" title="Temel Yetkinliklerimiz" />
        <div className="container">
          <PmSectionHeading line1={c.yetkinlik.eyebrowLine} line2={c.yetkinlik.headingLine} intro="" />
          <ul className="pm-caps__grid">
            {c.yetkinlik.items.map((item, index) => (
              <li className="pm-cap" key={item.no} data-aos="fade-up" data-aos-delay={index * 80}>
                <PromatsUretimIcon name={item.icon} />
                <span className="pm-cap__label">
                  <span className="pm-cap__no">{item.no}</span>
                  <StackedTitle lines={[item.title]} />
                </span>
                <span className="pm-cap__body">{item.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SİSTEMATİK SÜREÇ — 7 adım */}
      <section className="pm-section pm-section--panel position-relative">
        <DevNote section="hakkimizda-surec" title="Sistematik Süreç" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.surec.eyebrowLine} line2={c.surec.headingLine} intro={c.surec.intro} />
          </div>
          {/* Referans tasarım: tek satır — yuvarlak numaralı rozetler + aralarında oklar.
              Masaüstünde 7 adım tek sıra; mobilde tek satır kalıp yatay kaydırılır. */}
          <ol className="pm-flow" data-aos="fade-up">
            {c.surec.steps.map((step, index) => (
              <Fragment key={step.no}>
                <li className="pm-flow__item">
                  <span className="pm-flow__circle">{step.no}</span>
                  <h3 className="pm-flow__title">{step.title}</h3>
                  <p className="pm-flow__body">{step.body}</p>
                </li>
                {index < c.surec.steps.length - 1 ? (
                  <li className="pm-flow__arrow" aria-hidden="true">→</li>
                ) : null}
              </Fragment>
            ))}
          </ol>
        </div>
      </section>

      {/* DEĞERLERİMİZ — 4 değer */}
      <section className="pm-section position-relative">
        <DevNote section="hakkimizda-degerler" title="Değerlerimiz" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.degerler.eyebrowLine} line2={c.degerler.headingLine} intro="" />
          </div>
          <ul className="pm-cards pm-cards--4">
            {c.degerler.items.map((v, index) => (
              <li className="pm-card pm-card--value" key={v.title} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
                <span className="pm-value__mark" aria-hidden="true">{v.mark}</span>
                <h3 className="pm-card__title">{v.title}</h3>
                <p className="pm-card__body">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SERTİFİKALARIMIZ — 6 belge */}
      <section className="pm-section pm-section--panel position-relative">
        <DevNote section="hakkimizda-sertifikalar" title="Sertifikalarımız" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.sertifikalar.eyebrowLine} line2={c.sertifikalar.headingLine} intro={c.sertifikalar.intro} />
          </div>
          <ul className="pm-cards pm-cards--3 pm-certs">
            {c.sertifikalar.items.map((cert, index) => (
              <li className="pm-card pm-cert" key={cert.code} data-aos="fade-up" data-aos-delay={(index % 3) * 60}>
                <span className="pm-cert__badge">{cert.code}</span>
                <div className="pm-cert__text">
                  <h3 className="pm-card__title">{cert.title}</h3>
                  <p className="pm-card__body">{cert.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROMATS'IN YOLCULUĞU — zaman çizelgesi */}
      <section className="pm-section position-relative">
        <DevNote section="hakkimizda-yolculuk" title="Promats'ın Yolculuğu" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.yolculuk.eyebrowLine} line2={c.yolculuk.headingLine} intro="" />
          </div>
          <ol className="pm-timeline">
            {c.yolculuk.items.map((m, index) => (
              <li className="pm-timeline__item" key={m.year} data-aos="fade-up" data-aos-delay={(index % 3) * 60}>
                <span className="pm-timeline__year">{m.year}</span>
                <span className="pm-timeline__dot" aria-hidden="true" />
                <p className="pm-timeline__body">{m.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* KAPANIŞ CTA — koyu bant + sayfa linkleri */}
      <section className="pm-darkband pm-darkband--cta position-relative">
        <DevNote section="hakkimizda-cta" title="Kurumsal CTA" />
        <div className="container">
          <div className="pm-darkband__center" data-aos="fade-up">
            <span className="pm-darkband__eyebrow">{c.cta.eyebrow}</span>
            <h2 className="pm-darkband__heading">{c.cta.heading}</h2>
            <p className="pm-darkband__text">{c.cta.text}</p>
            <div className="pm-cta-row">
              {c.cta.links.map((link) => (
                <a key={link.href} href={href(locale, link.href)} className="pm-btn pm-btn--ghost">{link.label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
