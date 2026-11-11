'use client';

import { useEffect, useRef, useState } from 'react';
import { Autoplay, Navigation } from 'swiper';
import type { Swiper as SwiperType } from 'swiper/types';
import { Swiper, SwiperSlide } from 'swiper/react';

import type { Product } from '@/lib/promats/api';
import { getProductSwiperOptions } from '@/lib/promats/swiper-presets';

import PromatsImage from './PromatsImage';

import 'swiper/css';
import 'swiper/css/navigation';
import { localeHref as href } from '@/lib/promats/links';

type Props = {
  locale: string;
  products: Product[];
  excludeId?: number;
  settings: Record<string, string>;
};


export default function PromatsProductCarousel({ locale, products, excludeId, settings }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const items = products.filter((p) => p.id !== excludeId);
  const arrowLeft = settings.product_carousel_arrow_left;
  const arrowRight = settings.product_carousel_arrow_right;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!items.length || !arrowLeft || !arrowRight) return null;

  if (!isNearViewport) {
    return (
      <div ref={containerRef} className="row promats-product-carousel-placeholder" aria-hidden="true">
        <div style={{ minHeight: 220 }} />
      </div>
    );
  }

  const options = getProductSwiperOptions();

  return (
    <div ref={containerRef} className="row" data-aos="fade-up" data-aos-delay="100">
      <button
        type="button"
        className="small-left border-0 bg-transparent p-0"
        aria-label={locale === 'en' ? 'Previous product' : 'Önceki ürün'}
        onClick={() => swiperRef.current?.slidePrev()}
      >
        <PromatsImage src={arrowLeft} alt="" width={48} height={48} />
      </button>
      <button
        type="button"
        className="small-right border-0 bg-transparent p-0"
        aria-label={locale === 'en' ? 'Next product' : 'Sonraki ürün'}
        onClick={() => swiperRef.current?.slideNext()}
      >
        <PromatsImage src={arrowRight} alt="" width={48} height={48} />
      </button>
      <Swiper
        modules={[Autoplay, Navigation]}
        {...options}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="row small_product owl-carousel"
      >
        {items.map((product) => (
          <SwiperSlide key={product.id}>
            <div className="text-center product_showcase_small">
              <a href={href(locale, `/urunler/${product.slug}`)}>
                <PromatsImage
                  src={product.sections.detailImage}
                  alt=""
                  className="img-fluid"
                  sizes="(max-width: 599px) 100vw, (max-width: 999px) 33vw, 20vw"
                  loading="lazy"
                />
                <span>{product.name}</span>
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
