'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Promats subpath demo: PWA/Service Worker DEVRE DIŞI.
    // Sebep: (1) eski SW eski sürümü cache'leyip değişiklikleri gizliyordu (deploy göründüğü
    // halde stale içerik), (2) `/sw.js` scope `/` ile kaydoluyordu → aynı domaindeki PASPAS
    // admin'i de etkileme riski. Bu yüzden hiç kaydetme; mevcut SW + cache'leri temizle
    // (ziyaretçinin tarayıcısındaki stale SW bir sonraki açılışta otomatik silinir).
    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        }
      } catch {
        // Sessiz geç: SW temizliği engellense bile site çalışmaya devam etsin.
      }
    };

    void cleanup();
  }, []);

  return null;
}
