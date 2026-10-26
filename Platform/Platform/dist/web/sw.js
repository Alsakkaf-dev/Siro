/* مصنع الصدفة (App shell) للمنصة: يسرّع التحميل ويتيح التثبيت كتطبيق. لا يُخزِّن أي بيانات API. إن كان الخادم المحلي متوقفًا تظهر صفحة offline.html مع طريقة التشغيل. */
const SHELL = 'platform-shell-v1';
const ASSETS = 'platform-assets-v1';
const MAX_ASSETS = 90;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/offline.html', '/favicon.svg', '/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ASSETS; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || req.headers.has('range')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }
  // ملفات /assets/ لها بصمة في اسمها فهي ثابتة: من الذاكرة أولًا
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(ASSETS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) {
          c.put(req, res.clone());
          trim(c);
        }
        return res;
      }),
    );
  }
});
