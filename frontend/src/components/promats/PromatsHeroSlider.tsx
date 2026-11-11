'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SpecialPage } from '@/lib/promats/api';
import { decodeHtml } from '@/lib/promats/api';

import PromatsHeroBg from './PromatsHeroBg';
import PromatsHeroContents, { parseHeroContent } from './PromatsHeroContents';

type Props = {
  banners: SpecialPage[];
  locale: string;
};

export default function PromatsHeroSlider({ banners, locale }: Props) {
  const [SwiperInner, setSwiperInner] = useState<typeof import('./PromatsHeroSwiperInner').default | null>(null);
  // Her slide gecisinde artar; PromatsHeroContents'i remount edip reveal animasyonunu
  // bastan oynatir (orijinal owl-hero her slaytta harf-reveal'i tekrar tetikliyordu).
  const [revealKey, setRevealKey] = useState(0);
  // Aktif slide indeksi — her banner'in kendi baslik/alt metni gosterilir.
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Hero above-the-fold + slider'in garanti calismasi icin Swiper'i mount'ta hemen yukle
    // (eski idle/scroll gecikmesi fallback tek slide gosterip slider'i geciktiriyordu).
    let cancelled = false;
    void import('./PromatsHeroSwiperInner').then((mod) => {
      if (!cancelled) setSwiperInner(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSlideChange = useCallback((realIndex: number) => {
    setActiveIndex(realIndex);
    setRevealKey((k) => k + 1);
  }, []);

  // Aktif slide'in banner'indan cozulur; sabit overlay'de gosterilir (arka planda yalniz gorsel gecer).
  const activeBanner = banners[activeIndex] ?? banners[0];
  const parsed = useMemo(
    () => (activeBanner ? parseHeroContent(decodeHtml(activeBanner.detail, locale)) : null),
    [activeBanner, locale],
  );

  if (!banners.length) return null;

  const first = banners[0]!;

  return (
    <section className="owl-carousel owl-hero promats-hero--fixed">
      {/* İlk LCP görseli Swiper yüklenince DOM'dan kaldırılmaz. Böylece client
          hydration/dinamik import ana görseli yeniden adaylaştırıp boyamayı geciktirmez. */}
      <PromatsHeroBg src={first.image} priority className="untree_co--site-hero overlay promats-hero-static" />
      {SwiperInner ? (
        <div className="promats-hero-swiper-layer">
          <SwiperInner banners={banners} onSlideChange={handleSlideChange} />
        </div>
      ) : null}

      {parsed ? (
        <div className={`promats-hero-overlay promats-hero-overlay--${locale}`}>
          <div className="container">
            <div className="row align-items-center">
              <div className={locale === 'en' ? 'col-md-5' : 'col-md-4'}>
                <PromatsHeroContents key={revealKey} headings={parsed.headings} subHtml={parsed.subHtml} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
