// Service Worker - Promats ERP
// Bu dosya PWA desteği için placeholder olarak oluşturulmuştur

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML pages) — let browser handle directly
  if (event.request.mode === 'navigate') return;
  // Other requests — pass through to network
  event.respondWith(fetch(event.request));
});
