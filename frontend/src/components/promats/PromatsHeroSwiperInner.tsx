'use client';

import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import type { SpecialPage } from '@/lib/promats/api';
import { getHeroSwiperOptions } from '@/lib/promats/swiper-presets';

import PromatsHeroBg from './PromatsHeroBg';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Props = {
  banners: SpecialPage[];
  /** Her slide gecisi baslangicinda cagrilir — overlay metnini yeniden reveal etmek icin. */
  onSlideChange?: () => void;
};

/**
 * Yalnizca arka plan gorselleri (fade). Metin artik slide'larin icinde degil; PromatsHeroSlider
 * icindeki tek sabit overlay'de (PromatsHeroContents) — boylece slide gecerken metin oynamaz.
 * Metnin harf-reveal animasyonu her slaytta tekrarlanir: slide gecisi baslayinca onSlideChange
 * ile overlay remount edilir (orijinal owl-hero `translate` davranisi).
 */
export default function PromatsHeroSwiperInner({ banners, onSlideChange }: Props) {
  const options = getHeroSwiperOptions();

  return (
    <Swiper
      modules={[Autoplay, EffectFade, Navigation, Pagination]}
      {...options}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      onSlideChangeTransitionStart={onSlideChange}
      className="swiper-container owl-hero"
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={banner.id}>
          <PromatsHeroBg src={banner.image} priority={index === 0} loading={index === 0 ? 'eager' : 'lazy'} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
