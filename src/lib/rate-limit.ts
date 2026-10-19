/**
 * محدودکننده نرخ درخواست در حافظه (In-memory Rate Limiter)
 * برای هر کلید یک پنجره زمانی با سقف تعداد مجاز نگه داشته می‌شود.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// پاکسازی دوره‌ای ورودی‌های منقضی‌شده (lazy)
let lastCleanupAt = Date.now()
const CLEANUP_INTERVAL_MS = 60 * 1000
const MAX_STORE_SIZE = 10000

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS && store.size <= MAX_STORE_SIZE) {
    return
  }
  lastCleanupAt = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

/**
 * بررسی و شمارش یک درخواست برای کلید داده‌شده.
 * در هر فراخوانی یک واحد به شمارنده اضافه می‌شود؛
 * اگر تعداد از سقف مجاز در پنجره زمانی بیشتر شود، مسدود می‌گردد.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  cleanupExpired(now)

  const entry = store.get(key)

  // پنجره جدید (نبود ورودی یا منقضی‌شدن پنجره قبلی)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  entry.count += 1

  if (entry.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }

  return { allowed: true, retryAfterSec: 0 }
}

/** بازنشانی شمارنده یک کلید (مثلاً بعد از ورود موفق) */
export function resetRateLimit(key: string) {
  store.delete(key)
}
