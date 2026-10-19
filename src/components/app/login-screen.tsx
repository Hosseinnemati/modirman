'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Phone, Lock, UserRound, ShieldCheck, Info } from 'lucide-react'
import { faToEnDigits } from '@/lib/persian'
import type { AppUser } from '@/types/app'

type Mode = 'login' | 'register'

/** اعتبارسنجی شماره موبایل ایران */
function isValidPhone(p: string): boolean {
  return /^09\d{9}$/.test(p)
}

function normalizePhone(p: string): string {
  return faToEnDigits(p).replace(/[\s-]/g, '')
}

export function LoginScreen({
  onLogin,
}: {
  onLogin: (user: AppUser, token: string) => void
}) {
  const [mode, setMode] = useState<Mode>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** ورود با شماره موبایل و رمز عبور */
  const doLogin = async (p: string, pass: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p, password: pass }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || (res.status === 401 ? 'شماره موبایل یا رمز عبور اشتباه است' : 'خطا در ورود'))
        return
      }
      if (!data?.user) {
        setError('پاسخ نامعتبر از سرور')
        return
      }
      onLogin(data.user as AppUser, typeof data.token === 'string' ? data.token : '')
    } catch {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    const p = normalizePhone(phone.trim())
    if (!isValidPhone(p)) {
      setError('شماره موبایل معتبر نیست (مثلاً 09121234567)')
      return
    }
    if (!password.trim()) {
      setError('لطفاً رمز عبور را وارد کنید')
      return
    }
    await doLogin(p, password)
  }

  /** ثبت‌نام با شماره موبایل — پس از ثبت، مدیر باید کاربر را به ساختمان اضافه کند */
  const handleRegister = async () => {
    const p = normalizePhone(phone.trim())
    if (!name.trim()) {
      setError('لطفاً نام و نام خانوادگی را وارد کنید')
      return
    }
    if (!isValidPhone(p)) {
      setError('شماره موبایل معتبر نیست (مثلاً 09121234567)')
      return
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: p, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'ثبت‌نام انجام نشد')
        return
      }
      if (!data?.user) {
        setError('پاسخ نامعتبر از سرور')
        return
      }
      onLogin(data.user as AppUser, typeof data.token === 'string' ? data.token : '')
    } catch {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  /** ورود سریع با حساب‌های آزمایشی */
  const handleDemo = (p: string) => {
    setPhone(p)
    setPassword('1234')
    doLogin(p, '1234')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') handleLogin()
      else handleRegister()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* موج تزئینی پایین */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-60">
        <svg viewBox="0 0 400 160" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,80 C100,140 250,30 400,90 L400,160 L0,160 Z" fill="#dbeafe" opacity="0.7" />
          <path d="M0,120 C130,60 280,130 400,70 L400,160 L0,160 Z" fill="#bfdbfe" opacity="0.5" />
        </svg>
      </div>

      {/* لوگو و عنوان */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <img
          src="/images/app-icon.png"
          alt="لوگو مدیرمن"
          className="w-20 h-20 rounded-3xl shadow-lg shadow-blue-200 mb-4"
        />
        <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">مدیرمن</h1>
        <p className="text-slate-500 mt-2 text-sm">مدیریت هوشمند ساختمان</p>
      </div>

      {/* کارت ورود */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-blue-100 p-6 relative z-10">
        {/* تب‌ها */}
        <div className="grid grid-cols-2 gap-1 bg-blue-50 rounded-2xl p-1 mb-5">
          {([['login', 'ورود'], ['register', 'ثبت‌نام']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setMode(key)
                setError(null)
              }}
              className={`h-10 rounded-xl text-sm font-bold transition-all ${
                mode === key
                  ? 'bg-white text-blue-700 shadow-md shadow-blue-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {mode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                    <Input
                      id="phone"
                      dir="ltr"
                      inputMode="tel"
                      className="ps-12 h-12 rounded-xl border-blue-100 bg-blue-50/50 text-left placeholder:text-slate-400 focus-visible:ring-blue-300"
                      placeholder="09121234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      dir="ltr"
                      className="ps-12 h-12 rounded-xl border-blue-100 bg-blue-50/50 text-left placeholder:text-slate-400 focus-visible:ring-blue-300"
                      placeholder="رمز عبور خود را وارد کنید"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ورود'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-bold text-slate-700 mb-2">
                    نام و نام خانوادگی
                  </label>
                  <div className="relative">
                    <UserRound className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                    <Input
                      id="reg-name"
                      className="ps-12 h-12 rounded-xl border-blue-100 bg-blue-50/50 placeholder:text-slate-400 focus-visible:ring-blue-300"
                      placeholder="مثلاً: علی محمدی"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-bold text-slate-700 mb-2">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                    <Input
                      id="reg-phone"
                      dir="ltr"
                      inputMode="tel"
                      className="ps-12 h-12 rounded-xl border-blue-100 bg-blue-50/50 text-left placeholder:text-slate-400 focus-visible:ring-blue-300"
                      placeholder="09121234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-bold text-slate-700 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none" />
                    <Input
                      id="reg-password"
                      type="password"
                      dir="ltr"
                      className="ps-12 h-12 rounded-xl border-blue-100 bg-blue-50/50 text-left placeholder:text-slate-400 focus-visible:ring-blue-300"
                      placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">حداقل ۶ کاراکتر</p>
                </div>

                <div className="bg-blue-50/80 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-6">
                    پس از ثبت‌نام، مدیر ساختمان شما را با همین شماره موبایل به ساختمان اضافه می‌کند.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-3 font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ثبت‌نام'}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* حساب‌های آزمایشی */}
      <div className="w-full max-w-sm mt-5 relative z-10">
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-800">حساب‌های آزمایشی برای تست اپلیکیشن</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemo('09121111111')}
              disabled={loading}
              className="bg-white rounded-xl px-3 py-2.5 text-start border border-blue-100 hover:border-blue-300 transition-colors disabled:opacity-60"
            >
              <span className="block text-[11px] font-bold text-blue-900">ورود مدیر (دمو)</span>
              <span dir="ltr" className="block text-[10px] text-slate-400 mt-0.5">09121111111</span>
            </button>
            <button
              onClick={() => handleDemo('09122222222')}
              disabled={loading}
              className="bg-white rounded-xl px-3 py-2.5 text-start border border-blue-100 hover:border-blue-300 transition-colors disabled:opacity-60"
            >
              <span className="block text-[11px] font-bold text-blue-900">ورود ساکن (دمو)</span>
              <span dir="ltr" className="block text-[10px] text-slate-400 mt-0.5">09122222222</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
