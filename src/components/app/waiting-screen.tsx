'use client'

import { UserRoundCheck, LogOut, Loader2, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toFaDigits } from '@/lib/persian'
import type { AppUser } from '@/types/app'

/**
 * صفحه انتظار: کاربر تازه ثبت‌نام‌شده (resident بدون واحد) تا زمانی که
 * مدیر ساختمان او را به ساختمان اضافه کند این صفحه را می‌بیند.
 */
export function WaitingScreen({
  user,
  checking,
  onRefresh,
  onLogout,
}: {
  user: AppUser
  checking: boolean
  onRefresh: () => void
  onLogout: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white flex items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* موج تزئینی پایین */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-60">
        <svg viewBox="0 0 400 160" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,80 C100,140 250,30 400,90 L400,160 L0,160 Z" fill="#dbeafe" opacity="0.7" />
          <path d="M0,120 C130,60 280,130 400,70 L400,160 L0,160 Z" fill="#bfdbfe" opacity="0.5" />
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* لوگو */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/images/app-icon.png"
            alt="لوگو مدیرمن"
            className="w-16 h-16 rounded-3xl shadow-lg shadow-blue-200 mb-3"
          />
          <p className="text-sm font-extrabold text-blue-950">مدیرمن</p>
        </div>

        {/* کارت انتظار */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 p-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-t from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <UserRoundCheck className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>

          <h1 className="text-lg font-extrabold text-blue-950">ثبت‌نام شما انجام شد 🎉</h1>

          <p className="text-sm text-slate-500 leading-7 mt-3">
            حساب شما با شماره{' '}
            <span dir="ltr" className="font-bold text-blue-700">
              {user.phone ? toFaDigits(user.phone) : '-'}
            </span>{' '}
            ساخته شد. مدیر ساختمان باید شما را به ساختمان اضافه کند؛ پس از تأیید، دکمه «بررسی مجدد» را بزنید.
          </p>

          <div className="bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2 mt-4 text-start">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-6">
              نام شما: <span className="font-bold">{user.name}</span> — به‌محض افزودن شما به ساختمان،
              داشبورد، قبض‌ها و تقویم برای شما فعال می‌شود.
            </p>
          </div>

          <div className="space-y-2.5 mt-6">
            <Button
              onClick={onRefresh}
              disabled={checking}
              className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200"
            >
              {checking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال بررسی...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  بررسی مجدد
                </>
              )}
            </Button>

            <Button
              onClick={onLogout}
              disabled={checking}
              variant="ghost"
              className="w-full h-12 rounded-xl text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              خروج از حساب
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
