/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BASE_URL } from './config.js';

clientsClaim();

// === STATIC CACHE CONFIG ===
const CACHE_NAME = 'dicoding-app-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/styles.css',
  '/favicon.png',
  '/manifest.json',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
];

self.__WB_DISABLE_DEV_LOGS = true;

// === ROUTES ===

// Google Fonts
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({ cacheName: 'google-fonts' })
);

// Fontawesome CDN
registerRoute(
  ({ url }) =>
    url.origin === 'https://cdnjs.cloudflare.com' ||
    url.origin.includes('fontawesome'),
  new CacheFirst({ cacheName: 'fontawesome' })
);

// Github Avatar Sample
registerRoute(
  ({ url }) => url.origin.includes('avatars.githubusercontent'),
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// API: JSON (Network First)
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({ cacheName: 'stories-api' })
);

// API: Images (Stale While Revalidate)
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({ cacheName: 'stories-api-images' })
);

// Map Tiles
registerRoute(
  ({ url }) => url.origin.includes('maptiler'),
  new CacheFirst({ cacheName: 'maptiler-api' })
);

// Workbox precache
precacheAndRoute(self.__WB_MANIFEST);

import { OfflineFallback } from 'workbox-recipes';
OfflineFallback({
  pageFallback: './index.html',
});

// === PUSH NOTIFICATION ===
self.addEventListener('push', (event) => {
  console.log('SW: Push Received', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-192x192.png',
    data: {
      url: data.url || '/', // default redirect
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// === CLICK NOTIFICATION ===
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
