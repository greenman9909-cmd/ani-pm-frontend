const PREFIX = 'app-'
const VERSION = 'v8'
const PRECACHE = `${PREFIX}precache-${VERSION}`
const RUNTIME = `${PREFIX}runtime`
const RUNTIME_MAX = 80
const SHELL = ['/', '/manifest.webmanifest']

const cacheableAsset = (url) =>
  /^\/assets\/[^/]+\.(js|css|woff2?|png|jpe?g|svg|webp|avif)$/.test(url.pathname) ||
  /^\/(manifest\.webmanifest|icon-\d+\.png|favicon\.[a-z0-9]+)$/.test(url.pathname)

const storable = (res) => !!res && res.ok && res.status === 200 && res.type === 'basic' && !res.redirected

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PRECACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function trimRuntime() {
  const c = await caches.open(RUNTIME)
  const keys = await c.keys()
  for (let i = 0; i < keys.length - RUNTIME_MAX; i++) await c.delete(keys[i])
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (storable(res) && (res.headers.get('content-type') || '').includes('text/html')) {
            const copy = res.clone()
            e.waitUntil(caches.open(PRECACHE).then((c) => c.put('/', copy)).catch(() => {}))
          }
          return res
        })
        .catch(() => caches.open(PRECACHE).then((c) => c.match('/'))),
    )
    return
  }

  if (!cacheableAsset(url)) return
  e.respondWith(
    caches.open(RUNTIME).then((cache) =>
      cache.match(request).then(
        (hit) =>
          hit ||
          fetch(request)
            .then((res) => {
              if (storable(res)) {
                const copy = res.clone()
                e.waitUntil(cache.put(request, copy).then(trimRuntime).catch(() => {}))
              }
              return res
            })
            .catch(() => hit),
      ),
    ),
  )
})

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data && e.data.text ? e.data.text() : '' } }
  const title = d.title || 'ani.pm'
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: d.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url || '/' },
    tag: d.tag || undefined,
  }))
})

function safeTarget(raw) {
  const s = String(raw || '/')
  if (!s.startsWith('/') || s.startsWith('//')) return '/'
  try {
    const u = new URL(s, self.location.origin)
    return u.origin === self.location.origin ? u.pathname + u.search + u.hash : '/'
  } catch { return '/' }
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = safeTarget(e.notification.data && e.notification.data.url)
  e.waitUntil(
    (async () => {
      const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of cs) {
        if (typeof c.navigate !== 'function' || typeof c.focus !== 'function') continue
        try {
          const navigated = await c.navigate(target)
          if (!navigated) continue
          await (typeof navigated.focus === 'function' ? navigated : c).focus()
          return
        } catch {}
      }
      if (self.clients.openWindow) await self.clients.openWindow(target)
    })(),
  )
})
