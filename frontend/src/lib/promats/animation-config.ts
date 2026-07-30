/**
 * Orijinal promats.com.tr main.js davranış sabitleri.
 * Kaynak: public/assets/js/main.js
 */

/** AOS — setTimeout 800ms sonra init */
export const PROMATS_AOS = {
  initDelayMs: 800,
  duration: 800,
  easing: 'ease' as const,
  once: false,
} as const;

/** Loader / overlayer — $(".loader").delay(700).fadeOut("slow") */
export const PROMATS_LOADER = {
  fadeOutDelayMs: 700,
  fadeOutDurationMs: 600,
} as const;

/** Sticky nav — $(".js-sticky-nav").sticky({ topSpacing: 0 }) */
export const PROMATS_STICKY_NAV = {
  scrollThresholdPx: 0,
} as const;

/** Hero owl carousel → Swiper karşılığı ayarları */
export const PROMATS_HERO_CAROUSEL = {
  loop: true,
  autoplay: true,
  autoplayHoverPause: false,
  animateOut: 'fadeOut',
  animateIn: 'fadeIn',
  dots: true,
  nav: true,
} as const;

/** Ürün vitrin carousel (.small_product) */
export const PROMATS_PRODUCT_CAROUSEL = {
  autoplay: true,
  autoplayHoverPause: true,
  autoplayTimeout: 5000,
  loop: false,
  margin: 10,
  smartSpeed: 1000,
  startPosition: 0,
  responsive: {
    0: { items: 1 },
    600: { items: 3 },
    1000: { items: 5 },
  },
} as const;

/** Galeri büyük carousel (.owl-gallery-big) */
export const PROMATS_GALLERY_CAROUSEL = {
  loop: true,
  margin: 0,
  items: 1,
  nav: true,
  dots: true,
  smartSpeed: 1000,
} as const;
