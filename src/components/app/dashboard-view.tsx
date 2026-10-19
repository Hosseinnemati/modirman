'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, ReceiptText, Wrench, Megaphone, ChevronLeft, Home, MapPin, Wallet,
  FileCheck, CreditCard, Copy, Check, CalendarDays,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { toFaDigits, formatMoney } from '@/lib/persian'
import { todayJalaali, formatJalali } from '@/lib/jalali'
import type { AppUser, Announcement, Receipt, BuildingInfo, Reminder } from '@/types/app'

export type DashboardStats = {
  residentsCount: number
  pendingBills: number
  pendingAmount: number
  openRequests: number
  announcementsCount: number
  recentAnnouncements: Announcement[]
}

export function DashboardView({
  user,
  stats,
  receipts,
  settings,
  reminders,
  onNavigate,
}: {
  user: AppUser
  stats: DashboardStats | null
  receipts: Receipt[]
  settings: BuildingInfo | null
  reminders: Reminder[]
  onNavigate: (view: 'announcements' | 'calendar' | 'bills' | 'requests' | 'residents') => void
}) {
  const { toast } = useToast()
  const [copiedCard, setCopiedCard] = useState(false)
  const isManager = user.role === 'manager'
  const pendingReceiptsCount = receipts.filter((r) => r.status === 'pending').length
  const cardDigits = (settings?.cardNumber || '').replace(/\D/g, '')
  const cardMasked = cardDigits ? `•••• ${cardDigits.slice(-4)}` : ''

  // یادآوری‌های امروز (تقویم جلالی)
  const todayJ = todayJalaali()
  const todayStr = formatJalali(todayJ.jy, todayJ.jm, todayJ.jd)
  const todaysReminders = reminders.filter((r) => r.date === todayStr)

  const handleCopyCard = async () => {
    try {
      await navigator.clipboard.writeText(cardDigits)
      setCopiedCard(true)
      toast({ title: 'شماره کارت کپی شد', description: 'شماره کارت در کلیپ‌بورد ذخیره شد' })
      setTimeout(() => setCopiedCard(false), 2000)
    } catch {
      toast({ title: 'خطا', description: 'کپی شماره کارت انجام نشد', variant: 'destructive' })
    }
  }

  const cards = [
    {
      key: 'residents' as const,
      title: 'ساکنین',
      subtitle: isManager ? 'تعداد ساکنین ساختمان' : 'همسایه‌های ساختمان',
      value: stats?.residentsCount ?? 0,
      unit: 'نفر',
      icon: Users,
      show: true,
      onClick: () => onNavigate('residents'),
    },
    {
      key: 'bills' as const,
      title: isManager ? 'قبض‌های معوق' : 'قبض‌های من',
      subtitle: isManager ? 'قبض‌های پرداخت نشده' : 'قبض‌های پرداخت نشده شما',
      value: stats?.pendingBills ?? 0,
      unit: 'قبض',
      icon: ReceiptText,
      show: true,
      onClick: () => onNavigate('bills'),
    },
    {
      key: 'requests' as const,
      title: 'درخواست‌های باز',
      subtitle: 'درخواست‌های در حال بررسی',
      value: stats?.openRequests ?? 0,
      unit: 'درخواست',
      icon: Wrench,
      show: true,
      onClick: () => onNavigate('requests'),
    },
    {
      key: 'announcements' as const,
      title: 'اعلان‌ها',
      subtitle: 'آخرین اعلان‌های مدیریت',
      value: stats?.announcementsCount ?? 0,
      unit: 'اعلان',
      icon: Megaphone,
      show: true,
      onClick: () => onNavigate('announcements'),
    },
    ...(isManager
      ? [
          {
            key: 'receipts' as const,
            title: 'رسیدهای در انتظار تأیید',
            subtitle: 'رسیدهای پرداخت ارسالی ساکنین',
            value: pendingReceiptsCount,
            unit: 'رسید',
            icon: FileCheck,
            show: true,
            onClick: () => onNavigate('bills'),
          },
        ]
      : []),
  ]

  return (
    <div className="px-4 pt-2 pb-4">
      {/* خوش‌آمدگویی */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-extrabold text-blue-950">
            سلام، {user.name} {isManager ? '' : 'عزیز'}
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-2 text-slate-500">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-sm">ساختمان آسمان نیلوفر</span>
        </div>
        <div className="w-24 h-1 bg-blue-400 rounded-full mt-3 me-auto ms-1" />
      </div>

      {/* کارت یادآوری‌های امروز (هر دو نقش) */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onNavigate('calendar')}
        aria-label="مشاهده تقویم و یادآوری‌ها"
        className="w-full bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/70 p-4 mb-4 flex items-center gap-3 text-start hover:shadow-md hover:border-blue-200 transition-all card-enter"
      >
        <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-blue-50 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-blue-950 text-sm">یادآوری‌های امروز</p>
          {todaysReminders.length > 0 ? (
            <p className="text-xs text-slate-400 mt-1 truncate">
              {todaysReminders.slice(0, 2).map((r) => r.title).join('، ')}
              {todaysReminders.length > 2 ? ` و ${toFaDigits(todaysReminders.length - 2)} مورد دیگر` : ''}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">یادآوری برای امروز ندارید</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <div className="text-end">
            <p className="text-2xl font-extrabold leading-none">{toFaDigits(todaysReminders.length)}</p>
            <p className="text-[11px] text-slate-400 mt-1">یادآوری</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </div>
      </motion.button>

      {/* کارت بدهی (ساکن) */}
      {!isManager && stats && stats.pendingAmount > 0 && (
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-blue-200 card-enter">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100">مجموع بدهی شما</p>
              <p className="text-2xl font-extrabold mt-1">
                {formatMoney(stats.pendingAmount)}
                <span className="text-xs font-normal text-blue-100 ms-1">تومان</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('bills')}
            className="mt-3 w-full bg-white text-blue-600 rounded-xl py-2 text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            مشاهده و پرداخت قبض‌ها
          </button>
        </div>
      )}

      {/* کارت شماره کارت پرداخت (ساکن) */}
      {!isManager && cardDigits && (
        <div className="bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/70 p-4 mb-4 flex items-center gap-3 card-enter">
          <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-blue-50 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">شماره کارت پرداخت شارژ</p>
            <p dir="ltr" className="text-left font-extrabold text-blue-950 tracking-widest mt-0.5">
              {cardMasked}
            </p>
          </div>
          <button
            onClick={handleCopyCard}
            aria-label="کپی شماره کارت"
            className="w-11 h-11 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
          >
            {copiedCard ? (
              <Check className="w-[18px] h-[18px] text-emerald-500" />
            ) : (
              <Copy className="w-[18px] h-[18px] text-blue-600" />
            )}
          </button>
        </div>
      )}

      {/* کارت‌های آماری */}
      <div className="space-y-3.5">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.key}
              whileTap={{ scale: 0.97 }}
              onClick={card.onClick}
              className={`w-full bg-white rounded-2xl shadow-sm shadow-blue-100/80 border border-blue-100/60 p-4 flex items-center gap-3 text-start hover:shadow-md hover:border-blue-200 transition-all card-enter card-enter-${i + 1}`}
            >
              <div className="w-13 h-13 min-w-[52px] h-[52px] rounded-2xl bg-blue-50 flex items-center justify-center">
                <Icon className="w-6 h-6 text-blue-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-blue-950">{card.title}</p>
                <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <div className="text-end">
                  <p className="text-2xl font-extrabold leading-none">{toFaDigits(card.value)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{card.unit}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
