import type { SpecialPage } from '@/lib/promats/api';
import { DevNote } from '@/components/devnote';
import { assetPath, decodeHtml } from '@/lib/promats/api';

import PromatsImage from './PromatsImage';

type Props = {
  page: SpecialPage;
};

export default function PromatsStaticPage({ page }: Props) {
  const isAbout = page.slug === 'hakkimizda' || page.slug === 'about-us';
  const gallery = (page.gallery ?? []).filter((item, index, items) => (
    items.findIndex((candidate) => candidate.image === item.image) === index
  ));

  return (
    <>
      <section
        className={`untree_co--site-section section4_bg promats-static-content position-relative ${isAbout ? 'promats-about-page' : 'promats-static-content--overlay'}`}
        style={!isAbout && page.image ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0.7), rgba(0,0,0,0.25)), url('${assetPath(page.image)}')` } : undefined}
      >
        <DevNote section="static-content" title="Statik Sayfa İçerik" />
        <div className="container">
          <div className={isAbout ? 'promats-about-hero' : undefined}>
            <div
              className="promats-static-copy"
              data-aos="fade-up"
              data-aos-delay="100"
              dangerouslySetInnerHTML={{ __html: decodeHtml(page.detail) }}
            />
            {isAbout && page.image ? (
              <div className="promats-about-hero-media" data-aos="fade-up" data-aos-delay="150">
                <PromatsImage src={page.image} alt={page.title ?? ''} className="img-fluid" sizes="(max-width: 992px) 100vw, 50vw" priority />
              </div>
            ) : null}
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
