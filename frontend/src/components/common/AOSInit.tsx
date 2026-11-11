'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { PROMATS_AOS } from '@/lib/promats/animation-config';

export default function AOSInit() {
  const pathname = usePathname();
  const aosRef = useRef<typeof import('aos')['default'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initAos = () => {
      if (cancelled || aosRef.current) return;
      void import('aos').then((mod) => {
        if (cancelled) return;
        aosRef.current = mod.default;
        mod.default.init({
          duration: PROMATS_AOS.duration,
          easing: PROMATS_AOS.easing,
          once: PROMATS_AOS.once,
        });
        mod.default.refresh();
      });
    };

    // AOS is only useful once the visitor starts moving through the page.
    // Keeping it out of the critical path avoids downloading and executing the
    // animation runtime while the above-the-fold content is becoming visible.
    const timer = globalThis.setTimeout(initAos, 15_000);
    globalThis.addEventListener('scroll', initAos, { once: true, passive: true });
    globalThis.addEventListener('pointerdown', initAos, { once: true, passive: true });
    globalThis.addEventListener('keydown', initAos, { once: true });

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
      globalThis.removeEventListener('scroll', initAos);
      globalThis.removeEventListener('pointerdown', initAos);
      globalThis.removeEventListener('keydown', initAos);
    };
  }, []);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      aosRef.current?.refresh();
    }, 100);
    return () => globalThis.clearTimeout(timer);
  }, [pathname]);

  return null;
}
