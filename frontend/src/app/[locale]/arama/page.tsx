import type { Metadata } from 'next';

import { DevNote } from '@/components/devnote';
import PromatsProductCarousel from '@/components/promats/PromatsProductCarousel';
import { getSettings, searchProducts, t } from '@/lib/promats/api';
import { localeHref } from '@/lib/promats/links';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? 'Search' : 'Arama',
    robots: { index: false, follow: true },
    alternates: {
      canonical: localeHref(locale, '/arama'),
    },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  const [settings, products] = await Promise.all([
    getSettings(locale),
    searchProducts(locale, q),
  ]);
  const query = q.trim();
  const heading = query
    ? `${locale === 'en' ? 'SEARCHED:' : 'ARANAN:'} ${query}`
    : t(settings, 'Aranacak kelimeyi yazınız');

  return (
    <section className="untree_co--site-section section2_bg promats-search-page position-relative">
      <DevNote section="arama" title="Arama Sayfası" />
      <div className="container">
        <h1 className="text-center">{heading}</h1>
        <form className="form-subscribe mt-4 mb-5" action={localeHref(locale, '/arama')} method="get">
          <div className="form-group d-flex">
            <label className="sr-only" htmlFor="promats-search-page-q">{t(settings, 'Aranacak kelimeyi yazınız')}</label>
            <input id="promats-search-page-q" className="form-control" type="search" name="q" defaultValue={q} />
            <button type="submit" className="btn btn-yellow px-4 text-white" aria-label={locale === 'en' ? 'Search' : 'Ara'}><i className="icon-search2" /></button>
          </div>
        </form>
        {products.length ? (
          <PromatsProductCarousel locale={locale} products={products} settings={settings} />
        ) : (
          <p className="text-center">{query ? t(settings, 'Aradığınız kelime bulunamadı') : ''}</p>
        )}
      </div>
    </section>
  );
}
