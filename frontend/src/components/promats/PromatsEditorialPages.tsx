import type { ArticleListItem } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { sanitizeHtml } from '@/lib/promats/api';

import PromatsImage from './PromatsImage';
import { PmHero, PmSectionHeading } from './PromatsModernShell';
import { localeHref as href } from '@/lib/promats/links';

type PartnerCard = { title: string; body: string };
export type PartnerPageContent = {
  meta?: { title?: string; description?: string };
  hero: { eyebrow?: string; headline: string; subheadline: string; badges?: string[]; primaryCta?: string; secondaryCta?: string };
  advantages: { eyebrow?: string; heading: string; intro?: string; cards: PartnerCard[] };
  process: { eyebrow?: string; heading: string; intro?: string; cards: PartnerCard[] };
  finalCta: { heading: string; text: string; contactCta?: string; oemCta?: string };
};

function formatDate(value: string | null, locale: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function PromatsPartnerPage({ content: c }: { content: PartnerPageContent }) {
  return (
    <div className="promats-modern-page promats-partner-page">
      <PmHero
        image="/assets/images/uretim/tesis.jpg"
        assetBase="/assets"
        eyebrow={c.hero.eyebrow ?? ''}
        headline={[c.hero.headline]}
        text={c.hero.subheadline}
        devNoteSection="partner-hero"
        devNoteTitle="Partner Hero"
      >
        {c.hero.badges?.length ? (
          <ul className="pm-hero__badges">
            {c.hero.badges.map((badge) => <li key={badge}>{badge}</li>)}
          </ul>
        ) : null}
        <div className="pm-hero__cta">
          <a href={href('en', '/iletisim')} className="pm-btn pm-btn--solid">{c.hero.primaryCta}</a>
          <a href={href('en', '/oem-manufacturing')} className="pm-btn pm-btn--ghost">{c.hero.secondaryCta}</a>
        </div>
      </PmHero>

      {/* AVANTAJLAR */}
      <section className="pm-section pm-section--panel position-relative">
        <DevNote section="partner-advantages" title="Partner Avantajları" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.advantages.eyebrow ?? ''} line2={c.advantages.heading} intro={c.advantages.intro ?? ''} />
          </div>
          <ul className="pm-cards pm-cards--3">
            {c.advantages.cards.map((card, index) => (
              <li className="pm-card" key={card.title} data-aos="fade-up" data-aos-delay={(index % 3) * 60}>
                <h3 className="pm-card__title">{card.title}</h3>
                <p className="pm-card__body">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SÜREÇ */}
      <section className="pm-section position-relative">
        <DevNote section="partner-process" title="Partner Süreç" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.process.eyebrow ?? ''} line2={c.process.heading} intro={c.process.intro ?? ''} />
          </div>
          <ol className="pm-steps">
            {c.process.cards.map((card, index) => (
              <li className="pm-step" key={card.title} data-aos="fade-up" data-aos-delay={(index % 4) * 60}>
                <span className="pm-step__num">{index + 1}</span>
                <h3 className="pm-step__title">{card.title}</h3>
                <p className="pm-step__body">{card.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* KOYU CTA */}
      <section className="pm-darkband pm-darkband--cta position-relative">
        <DevNote section="partner-form" title="Partner Form" />
        <div className="container">
          <div className="pm-darkband__center" data-aos="fade-up">
            <h2 className="pm-darkband__heading">{c.finalCta.heading}</h2>
            <p className="pm-darkband__text">{c.finalCta.text}</p>
            <div className="pm-cta-row">
              <a href={href('en', '/iletisim')} className="pm-btn pm-btn--solid">{c.finalCta.contactCta}</a>
              <a href={href('en', '/oem-manufacturing')} className="pm-btn pm-btn--ghost">{c.finalCta.oemCta}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export type ResourcesPageContent = {
  meta: { title: string; description: string };
  eyebrow: string;
  headline: [string, string];
  text: string;
  h1: string;
  h2: string;
  intro: string;
  read: string;
  empty: string;
  backLabel: string;
};

export function PromatsArticlesPage({ locale, articles, content: c }: { locale: string; articles: ArticleListItem[]; content: ResourcesPageContent }) {

  return (
    <div className="promats-modern-page promats-resources-page">
      <PmHero
        image="/assets/images/uretim/hero.jpg"
        assetBase="/assets"
        eyebrow={c.eyebrow}
        headline={[...c.headline]}
        text={c.text}
        devNoteSection="kaynaklar-hero"
        devNoteTitle="Kaynaklar Hero"
      />

      <section className="pm-section pm-section--panel position-relative">
        <DevNote section="kaynaklar-liste" title="Kaynaklar Liste" />
        <div className="container">
          <div className="pm-section__head">
            <PmSectionHeading line1={c.h1} line2={c.h2} intro={c.intro} />
          </div>
          {articles.length ? (
            <ul className="pm-articles">
              {articles.map((article, index) => (
                <li className="pm-article" key={article.id} data-aos="fade-up" data-aos-delay={(index % 3) * 80}>
                  <a className="pm-article__link" href={href(locale, `/kaynaklar/${article.slug}`)}>
                    {article.image ? (
                      <span className="pm-article__media">
                        <PromatsImage src={article.image} alt={article.title} width={720} height={440} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px" />
                      </span>
                    ) : null}
                    <span className="pm-article__body">
                      {formatDate(article.publishedAt, locale) ? (
                        <span className="pm-article__date">{formatDate(article.publishedAt, locale)}</span>
                      ) : null}
                      <span className="pm-article__title">{article.title}</span>
                      <span className="pm-article__excerpt">{article.excerpt}</span>
                      <span className="pm-article__cta">{c.read}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pm-articles__empty">{c.empty}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function PromatsArticleDetailPage({ locale, article, backLabel }: { locale: string; article: ArticleListItem & { content: string | null }; backLabel: string }) {
  return (
    <div className="promats-modern-page promats-resource-detail-page">
      <PmHero
        image={article.image || '/assets/images/uretim/hero.jpg'}
        assetBase="/assets"
        eyebrow={formatDate(article.publishedAt, locale)}
        headline={[article.title]}
        text={article.excerpt || ''}
        devNoteSection="kaynak-detay-hero"
        devNoteTitle="Kaynak Detay Hero"
      />

      <section className="pm-section position-relative">
        <DevNote section="kaynak-detay-icerik" title="Kaynak Detay İçerik" />
        <div className="container">
          <article
            className="pm-prose"
            data-aos="fade-up"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
          <div className="pm-prose__back">
            <a href={href(locale, '/kaynaklar')} className="pm-btn pm-btn--outline">{backLabel}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
