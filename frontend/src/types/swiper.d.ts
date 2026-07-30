declare module 'swiper/modules' {
  export const Autoplay: unknown;
  export const Navigation: unknown;
  export const Pagination: unknown;
  export const EffectFade: unknown;
}

declare module 'swiper' {
  import type { SwiperModule } from 'swiper/types';

  export type { Swiper } from 'swiper/types';
  export const Autoplay: SwiperModule;
  export const EffectFade: SwiperModule;
  export const Navigation: SwiperModule;
  export const Pagination: SwiperModule;
}

declare module 'swiper/types' {
  export interface Swiper {
    slidePrev(): void;
    slideNext(): void;
  }
}
