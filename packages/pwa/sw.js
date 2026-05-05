/**
 * sw.js — Service Worker DevPeek
 *
 * Stratégie : Cache-First pour les assets statiques de la PWA.
 * Si le CLI n'est pas lancé, une page offline propre est affichée.
 */

const CACHE_NAME = 'devpeek-v0.1.0';

// Assets à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/i18n/fr.json',
  '/i18n/en.json'
];

// --- Installation : mise en cache des assets statiques ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Activer immédiatement sans attendre que l'ancien SW se désenregistre
  self.skipWaiting();
});

// --- Activation : nettoyage des anciens caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// --- Fetch : Cache-First pour les assets, Network-First pour /config ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les connexions Socket.IO et les routes /config
  if (url.pathname.startsWith('/socket.io') || url.pathname === '/config') {
    return; // Laisser passer directement au réseau
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Si pas en cache, essayer le réseau
      return fetch(event.request).catch(() => {
        // Réseau indisponible → page offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});