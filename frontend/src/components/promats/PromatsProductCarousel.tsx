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


function StaticProductRow({ locale, items }: { locale: string; items: Product[] }) {
  return (
    <div className="row small_product">
      {items.slice(0, 5).map((product) => (
        <div className="col-12 col-sm-4 col-lg text-center product_showcase_small" key={product.id}>
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
      ))}
    </div>
  );
}

export default function PromatsProductCarousel({ locale, products, excludeId, settings }: Props) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [swiperReady, setSwiperReady] = useState(false);
  const items = products.filter((p) => p.id !== excludeId);
  const arrowLeft = settings.product_carousel_arrow_left;
  const arrowRight = settings.product_carousel_arrow_right;

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setSwiperReady(true), 0);
    return () => globalThis.clearTimeout(timer);
  }, []);

  if (!items.length || !arrowLeft || !arrowRight) return null;

  if (!swiperReady) {
    return (
      <div className="row" data-aos="fade-up" data-aos-delay="100">
        <StaticProductRow locale={locale} items={items} />
      </div>
    );
  }

  const options = getProductSwiperOptions();

  return (
    <div className="row" data-aos="fade-up" data-aos-delay="100">
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
