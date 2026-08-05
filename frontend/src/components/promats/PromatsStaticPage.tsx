import type { SpecialPage } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { assetPath, decodeHtml } from '@/lib/promats/api';

import PromatsImage from './PromatsImage';

type Props = {
  page: SpecialPage;
};

function plainText(html: string): string {
  return html
    .replace(/&(uuml|Uuml|ouml|Ouml|ccedil|Ccedil|scedil|Scedil|gbreve|Gbreve|inodot);/g, (entity) => ({
      '&uuml;': 'ü', '&Uuml;': 'Ü', '&ouml;': 'ö', '&Ouml;': 'Ö',
      '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&scedil;': 'ş', '&Scedil;': 'Ş',
      '&gbreve;': 'ğ', '&Gbreve;': 'Ğ', '&inodot;': 'ı',
    }[entity] ?? entity))
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAboutContent(detail: string | null) {
  const html = decodeHtml(detail);
  const span = html.match(/<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? html;
  const sections = span.split(/<b[^>]*>([\s\S]*?)<\/b>/gi);
  const intro = plainText(sections[0] ?? span);
  const highlights = [];
  for (let index = 1; index < sections.length; index += 2) {
    highlights.push({
      title: plainText(sections[index] ?? ''),
      text: plainText(sections[index + 1] ?? ''),
    });
  }
  const competencies = Array.from(
    html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi),
    (match) => ({ title: plainText(match[1]), text: plainText(match[2]) }),
  );
  return { intro, highlights, competencies };
}

const aboutHighlights = {
  en: [
    { title: 'Our Vision', text: 'To manufacture in compliance with industry standards, focus on unconditional customer satisfaction, and produce and develop premium-quality products.' },
    { title: 'Our Values', text: 'We stand behind every product we manufacture and never compromise on quality for the sake of price competition.' },
    { title: 'Our Goals', text: 'Through knowledge, experience, innovation and technology, we strive to produce the highest-quality products in the shortest possible time.' },
  ],
  tr: [
    { title: 'Vizyonumuz', text: 'Sektör standartlarına uygun üretim yapmak, koşulsuz müşteri memnuniyetine odaklanmak ve üst kalitede ürünler geliştirmek.' },
    { title: 'Değerlerimiz', text: 'Ürettiğimiz her ürünün arkasında durur, fiyat rekabeti uğruna kaliteden hiçbir zaman taviz vermeyiz.' },
    { title: 'Hedeflerimiz', text: 'Bilgi, tecrübe, yenilik ve teknolojiyle en kaliteli ürünleri mümkün olan en kısa sürede üretmek.' },
  ],
};

export default function PromatsStaticPage({ page }: Props) {
  const isAbout = page.slug === 'hakkimizda' || page.slug === 'about-us';
  const about = isAbout ? getAboutContent(page.detail) : null;
  if (about) about.highlights = aboutHighlights[page.slug === 'about-us' ? 'en' : 'tr'];
  const gallery = (page.gallery ?? []).filter((item, index, items) => (
    items.findIndex((candidate) => candidate.image === item.image) === index
  ));

  if (isAbout && about) {
    return (
      <section className="untree_co--site-section promats-about-page position-relative">
        <DevNote section="static-content" title="Statik Sayfa İçerik" />
        <div className="container">
          <div className="promats-about-intro">
            <div className="promats-about-intro-copy">
              <span className="promats-about-kicker">PROMATS</span>
              <h1>{page.title}</h1>
              <p>{about.intro}</p>
            </div>
            <div className="promats-about-intro-media">
              <PromatsImage
                src="/userfiles/images/page-bg/about-us.jpg"
                alt={page.title ?? ''}
                className="img-fluid"
                sizes="(max-width: 992px) 100vw, 52vw"
                priority
              />
              <span>{page.slug === 'about-us' ? 'Production powered by experience' : 'Tecrübeyle güçlenen üretim'}</span>
            </div>
          </div>

          {about.highlights.length ? (
            <div className="promats-about-highlights">
              {about.highlights.map((item) => (
                <article key={item.title}>
                  <span aria-hidden="true" />
                  <h2>{item.title.replace(/,$/, '')}</h2>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          ) : null}

          {about.competencies.length ? (
            <div className="promats-about-competencies">
              {about.competencies.map((item) => (
                <article key={item.title}>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className={`untree_co--site-section section4_bg promats-static-content position-relative ${isAbout ? 'promats-about-page' : 'promats-static-content--overlay'}`}
        style={!isAbout && page.image ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0.7), rgba(0,0,0,0.25)), url('${assetPath(page.image)}')` } : undefined}
      >
        <DevNote section="static-content" title="Statik Sayfa İçerik" />
        <div className="container">
          <div>
            <div
              className="promats-static-copy"
              data-aos="fade-up"
              data-aos-delay="100"
              dangerouslySetInnerHTML={{ __html: decodeHtml(page.detail) }}
            />
          </div>
          {gallery.length ? (
            <div className={`row mt-5 ${isAbout ? 'promats-about-gallery' : ''}`} data-aos="fade-up" data-aos-delay="200">
              {gallery.map((item) => (
                <div className={isAbout ? 'col-6 col-lg-3' : 'col-12 col-lg-6'} key={item.id}>
                  <PromatsImage src={item.image} alt={page.title ?? ''} className="img-fluid" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
