/* Método Wanwan — service worker (A-16)
   Offline real: precache do app shell + cache-first.
   Cache VERSIONADO: bump CACHE_VERSION a cada release de assets
   (app-data.js/engine.js/app.js/index.html mudam de conteúdo).
   Sem rede a terceiros — coerente com a minimização LGPD do projeto. */
'use strict';

const CACHE_VERSION = 'wanwan-v0.6.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './app-data.js',
  './engine.js',
  './app.js',
  './icon.svg',
  './assets/fonts/baloo2-500.woff2',
  './assets/fonts/baloo2-600.woff2',
  './assets/fonts/baloo2-700.woff2',
  './assets/fonts/jakarta-400.woff2',
  './assets/fonts/jakarta-600.woff2',
  './assets/fonts/jakarta-700.woff2',
  './assets/fonts/jakarta-800.woff2',
  './assets/fonts/lexend-400.woff2',
  './assets/fonts/lexend-600.woff2',
  './assets/fonts/lexend-700.woff2',
  './assets/fonts/fredoka-400.woff2',
  './assets/fonts/fredoka-500.woff2',
  './assets/fonts/fredoka-600.woff2',
  './assets/fonts/fredoka-700.woff2',
  './assets/fonts/nunito-400.woff2',
  './assets/fonts/nunito-600.woff2',
  './assets/fonts/nunito-700.woff2',
  './assets/fonts/nunito-800.woff2',
  './assets/img/fundo-mapa.jpg',
  './assets/img/cena-cap1.jpg',
  './assets/img/joao.png',
  './assets/img/gema.png',
  './assets/img/bau.png',
  './assets/img/trofeu.png'
];

// Instala: precache do shell. addAll é atômico (se 1 falhar, install falha).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativa: remove caches de versões antigas e assume o controle das abas abertas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first para GET same-origin. O app controla 100% dos próprios assets,
// então servir do cache é correto e instantâneo; a rede é só fallback/aquecimento.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nunca toca terceiros

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Guarda cópia de respostas básicas OK (assets novos servidos runtime).
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline e não cacheado: para navegações, cai no index (SPA shell).
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
