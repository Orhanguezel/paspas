import { DevNote } from '@/components/devnote';
import { PROMATS_ORGANIZATION_ID } from '@/seo/promatsStructuredData';

import { PmSectionHeading } from './PromatsModernShell';

export type PromatsFaqItem = {
  question: string;
  answer: string;
};

type Props = {
  locale: 'tr' | 'en';
  eyebrow: string;
  title: string;
  intro: string;
  items: PromatsFaqItem[];
  sectionKey: string;
};

export default function PromatsFaqSection({ locale, eyebrow, title, intro, items, sectionKey }: Props) {
  if (!items.length) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    author: { '@id': PROMATS_ORGANIZATION_ID },
    publisher: { '@id': PROMATS_ORGANIZATION_ID },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="pm-section pm-section--panel pm-page-faq position-relative" id={sectionKey}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }}
      />
      <DevNote section={sectionKey} title={`${title} SSS`} />
      <div className="container">
        <div className="pm-section__head">
          <PmSectionHeading line1={eyebrow} line2={title} intro={intro} />
        </div>
        <div className="pm-faq">
          {items.map((item, index) => (
            <details className="pm-faq__item" key={item.question} open={index === 0}>
              <summary className="pm-faq__q">{item.question}</summary>
              <p className="pm-faq__a">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="pm-page-faq__owner">
          {locale === 'en' ? 'Author and publisher: Promats' : 'Yazar ve yayıncı: Promats'}
        </p>
      </div>
    </section>
  );
}
