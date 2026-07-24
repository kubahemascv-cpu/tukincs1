// SW CS TUKIN — Kumasindo (versi statis, bukan blob URL)
// File ini permanen di repo, bukan dibuat ulang tiap app dibuka.
// Ini penting supaya Android bisa mengenali app sebagai PWA yang
// bisa diinstall permanen (WebAPK), bukan sekadar shortcut/bookmark.

const CACHE = 'cs-tukin-v5';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png']).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Data dari Google Sheets/Apps Script selalu diambil langsung dari
  // internet (jangan di-cache), biar datanya selalu yang terbaru.
  if (/docs\.google\.com|googleapis\.com/.test(e.request.url)) {
    e.respondWith(
      fetch(e.request).catch(function () {
        return caches.match(e.request);
      })
    );
    return;
  }

  // File app (HTML/JS/icon/manifest): coba cache dulu, kalau tidak
  // ada baru ambil dari internet dan simpan untuk dipakai offline.
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) {
          if (res && res.status === 200) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return r; });
      });
    })
  );
});
