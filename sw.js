// Service Worker — Analisi Linee ATM TPL
// Cache "app-shell": HTML, librerie, icone -> funzionamento offline su iPad.
// NOTA: a ogni modifica sostanziale dei file pubblicati, alzare il numero di
// versione qui sotto (es. v2 -> v3): forza l'aggiornamento della cache sui
// dispositivi che hanno già installato la PWA.
const CACHE_NAME = 'atm-tpl-cache-v2';
const ASSETS = [
  './Analisi BUS Linee.html',
  './manifest.json',
  './LOGO ATM TPL.png',
  './assets/chart.umd.min.js',
  './assets/xlsx.full.min.js',
  './assets/jspdf.umd.min.js',
  './assets/jspdf.plugin.autotable.min.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategia:
// - pagina HTML (navigazione): network-first, così si vede sempre l'ultima
//   versione pubblicata quando c'è connessione; in assenza di rete usa la cache.
// - asset statici (librerie/icone): cache-first, più rapido e funziona offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate' || req.destination === 'document';

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
