// نوتیفیکیشن دستگاه برای یادآوری‌های «مدیرمن»

import { isReminderDue } from '@/lib/jalali'
import type { Reminder } from '@/types/app'

const NOTIFIED_PREFIX = 'notified_'
const MAX_NOTIFIED_KEYS = 200

/** آیا مرورگر از Notification API پشتیبانی می‌کند؟ */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** وضعیت فعلی اجازه نوتیفیکیشن */
export function getPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

/** درخواست اجازه نوتیفیکیشن — true در صورت موافقت کاربر */
export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

/** نمایش نوتیفیکیشن در صورت داشتن اجازه (با try/catch امن) */
export function showNotification(title: string, body: string) {
  try {
    if (!notificationsSupported() || Notification.permission !== 'granted') return
    new Notification(title, {
      body,
      icon: '/images/app-icon.png',
      tag: 'modirman-' + Date.now(),
    })
  } catch {
    // بی‌خیال
  }
}

/** حذف کلیدهای قدیمی notified_ وقتی از حد مجاز بیشتر شدند */
function pruneNotifiedKeys() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(NOTIFIED_PREFIX)) keys.push(k)
    }
    if (keys.length > MAX_NOTIFIED_KEYS) {
      for (const k of keys.slice(0, keys.length - MAX_NOTIFIED_KEYS)) {
        localStorage.removeItem(k)
      }
    }
  } catch {
    // بی‌خیال
  }
}

/**
 * مانیتور یادآوری‌ها: بلافاصله و سپس هر ۶۰ ثانیه بررسی می‌کند؛
 * برای هر یادآوری سررسیدشده یک بار نوتیفیکیشن می‌فرستد
 * (با کلید notified_{id} در localStorage از تکرار جلوگیری می‌شود).
 * تابع پاکسازی (cleanup) را برمی‌گرداند.
 */
export function startReminderWatcher(getReminders: () => Reminder[]): () => void {
  const check = () => {
    try {
      pruneNotifiedKeys()
      const reminders = getReminders()
      if (!Array.isArray(reminders)) return
      for (const r of reminders) {
        const key = NOTIFIED_PREFIX + r.id
        if (localStorage.getItem(key)) continue
        if (isReminderDue(r.date, r.time)) {
          showNotification(
            '🔔 یادآوری مدیرمن',
            r.title + (r.time ? ' — ساعت ' + r.time : ''),
          )
          localStorage.setItem(key, '1')
        }
      }
    } catch {
      // بی‌خیال
    }
  }

  check()
  const interval = setInterval(check, 60_000)
  return () => clearInterval(interval)
}
