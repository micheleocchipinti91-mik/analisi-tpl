// Service Worker — Analisi Linee ATM TPL
// Cache "app-shell": HTML, librerie, icone -> funzionamento offline su iPad.
const CACHE_NAME = 'atm-tpl-cache-v1';
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

// Strategia: cache-first per gli asset dell'app shell, network-first per il resto.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Aggiorna la cache con copie delle risposte valide dello stesso origin
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
