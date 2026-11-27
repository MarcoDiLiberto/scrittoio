/* Scrittoio — funzionamento offline.
   Le pagine arrivano prima dalla rete (così vedi sempre l'ultima versione) e, senza connessione, dalla copia salvata.
   I caratteri tipografici vengono salvati la prima volta e poi letti sempre dalla copia locale. */
const V = 'scrittoio-v1';
const FONTS = 'scrittoio-fonts';
const CORE = ['./', './index.html', './atlante.html', './scena.html', './foglie.html', './crossroads.html', './atlante-icon.svg', './atlante.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
