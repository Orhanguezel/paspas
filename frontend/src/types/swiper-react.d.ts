// src/types/swiper-react.d.ts
import type * as React from "react";
import type { Swiper as SwiperInstance, SwiperModule } from "swiper/types";

declare module "swiper/react" {
  type SwiperAutoplayOptions = boolean | {
    delay?: number;
    disableOnInteraction?: boolean;
    pauseOnMouseEnter?: boolean;
    [key: string]: unknown;
  };

  type SwiperNavigationOptions = boolean | {
    nextEl?: string | HTMLElement;
    prevEl?: string | HTMLElement;
    [key: string]: unknown;
  };

  type SwiperPaginationOptions = boolean | {
    clickable?: boolean;
    [key: string]: unknown;
  };

  type SwiperBreakpointOptions = {
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    [key: string]: unknown;
  };

  export interface SwiperProps {
    children?: React.ReactNode;
    slidesPerView?: number | "auto";
    spaceBetween?: number;
    modules?: SwiperModule[];
    navigation?: SwiperNavigationOptions;
    pagination?: SwiperPaginationOptions;
    autoplay?: SwiperAutoplayOptions;
    breakpoints?: Record<number, SwiperBreakpointOptions>;
    className?: string;
    effect?: string;
    fadeEffect?: {
      crossFade?: boolean;
      [key: string]: unknown;
    };
    loop?: boolean;
    speed?: number;
    onSlideChange?: (swiper: SwiperInstance) => void;
    onSwiper?: (swiper: SwiperInstance) => void;
    [key: string]: unknown;
  }

  export interface SwiperSlideProps {
    children?: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }

  export const Swiper: React.FC<SwiperProps>;
  export const SwiperSlide: React.FC<SwiperSlideProps>;
}
