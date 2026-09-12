// 京都、四日間 — 一度開けば圏外でも開けるようにする
var CACHE = 'kyoto-' + 'abda7a1ad6';
var FILES = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // フォントなどは素通し
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {   // 3秒つながらなければ端末の中の版
      if (done) return; done = true;
      caches.match(e.request, { ignoreSearch: true }).then(function (hit) { resolve(hit || fetch(e.request)); });
    }, 3000);
    fetch(e.request).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(function () {
      if (done) return; done = true; clearTimeout(timer);
      caches.match(e.request, { ignoreSearch: true }).then(function (hit) { resolve(hit || Response.error()); });
    });
  }));
});
