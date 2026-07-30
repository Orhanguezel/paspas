import {
  PROMATS_GALLERY_CAROUSEL,
  PROMATS_HERO_CAROUSEL,
  PROMATS_PRODUCT_CAROUSEL,
} from '@/lib/promats/animation-config';

type SwiperPreset = {
  loop?: boolean;
  autoplay?: boolean | { delay: number; pauseOnMouseEnter?: boolean; disableOnInteraction?: boolean };
  spaceBetween?: number;
  slidesPerView?: number;
  breakpoints?: Record<number, { slidesPerView: number }>;
  navigation?: boolean;
  pagination?: { clickable: boolean };
  speed?: number;
  initialSlide?: number;
  watchOverflow?: boolean;
};

/** Orijinal owl-hero → Swiper fade carousel */
export function getHeroSwiperOptions(): SwiperPreset {
  return {
    loop: PROMATS_HERO_CAROUSEL.loop,
    autoplay: PROMATS_HERO_CAROUSEL.autoplay
      ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: false }
      : false,
    speed: 800,
    pagination: { clickable: PROMATS_HERO_CAROUSEL.dots },
    navigation: PROMATS_HERO_CAROUSEL.nav,
    slidesPerView: 1,
    spaceBetween: 0,
  };
}

/** Orijinal .small_product owl carousel */
export function getProductSwiperOptions(): SwiperPreset {
  const { responsive, margin, ...rest } = PROMATS_PRODUCT_CAROUSEL;
  return {
    loop: rest.loop,
    autoplay: rest.autoplay
      ? {
          delay: rest.autoplayTimeout,
          disableOnInteraction: false,
          pauseOnMouseEnter: rest.autoplayHoverPause,
        }
      : false,
    initialSlide: rest.startPosition,
    spaceBetween: margin,
    speed: rest.smartSpeed,
    watchOverflow: true,
    breakpoints: {
      0: { slidesPerView: responsive[0].items },
      600: { slidesPerView: responsive[600].items },
      1000: { slidesPerView: responsive[1000].items },
    },
  };
}

/** Orijinal .owl-gallery-big */
export function getGallerySwiperOptions(): SwiperPreset {
  return {
    loop: PROMATS_GALLERY_CAROUSEL.loop,
    slidesPerView: PROMATS_GALLERY_CAROUSEL.items,
    spaceBetween: PROMATS_GALLERY_CAROUSEL.margin,
    navigation: PROMATS_GALLERY_CAROUSEL.nav,
    pagination: { clickable: PROMATS_GALLERY_CAROUSEL.dots },
    speed: PROMATS_GALLERY_CAROUSEL.smartSpeed,
  };
}
