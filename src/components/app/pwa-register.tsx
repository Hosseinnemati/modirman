'use client'

import { useEffect } from 'react'

/** ثبت سرویس‌ورکر «مدیرمن» (پشتیبانی آفلاین + نوتیفیکیشن) */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // بی‌صدا — سرویس‌ورکر اختیاری است
      })
    }
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
