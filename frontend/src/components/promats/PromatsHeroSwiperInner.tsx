'use client';

import { EffectFade, Navigation, Pagination } from 'swiper';
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
  /** Her slide gecisi baslangicinda aktif slide indeksiyle cagrilir — overlay metni o slide'a gecer. */
  onSlideChange?: (realIndex: number) => void;
};

/**
 * Yalnizca arka plan gorselleri (fade). Metin artik slide'larin icinde degil; PromatsHeroSlider
 * icindeki tek sabit overlay'de (PromatsHeroContents) — boylece slide gecerken metin oynamaz.
 * Her slide'in KENDI metni vardir: gecis baslayinca aktif indeks yukari bildirilir, overlay o
 * banner'in icerigiyle remount edilir ve harf-reveal animasyonu bastan oynar.
 */
export default function PromatsHeroSwiperInner({ banners, onSlideChange }: Props) {
  const options = getHeroSwiperOptions();

  return (
    <Swiper
      modules={[EffectFade, Navigation, Pagination]}
      {...options}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      onSlideChangeTransitionStart={(swiper) => onSlideChange?.(swiper.realIndex)}
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
