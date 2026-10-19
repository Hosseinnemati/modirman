// سرویس‌ورکر «مدیرمن» — پشتیبانی آفلاین سبک + نوتیفیکیشن
// استراتژی امن: Network-First (هیچ‌وقت نسخه کهنه به کاربر نشان نمی‌دهد)

const CACHE_NAME = 'modirman-v1'
const PRECACHE = [
  '/manifest.webmanifest',
  '/images/app-icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // فقط GET هم‌مبدا
  if (req.method !== 'GET') return
  try {
    if (new URL(req.url).origin !== self.location.origin) return
  } catch {
    return
  }
  // APIها هرگز کش نشوند
  if (new URL(req.url).pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        // پاسخ موفق را در کش اجرایی ذخیره کن
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  )
})

// نمایش نوتیفیکیشن پوش (برای آینده — نیازمند سرور push با VAPID)
self.addEventListener('push', (event) => {
  let title = '🔔 یادآوری مدیرمن'
  let body = 'یک یادآوری جدید دارید'
  try {
    if (event.data) {
      const data = event.data.json()
      title = data.title || title
      body = data.body || body
    }
  } catch {
    // payload متنی
    if (event.data) body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/images/app-icon.png',
      badge: '/images/icon-192.png',
      tag: 'modirman-' + Date.now(),
      dir: 'rtl',
      lang: 'fa',
    })
  )
})

// کلیک روی نوتیفیکیشن → فوکوس یا بازکردن اپ
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
