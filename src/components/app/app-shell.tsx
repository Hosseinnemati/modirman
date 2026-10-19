'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Home, Megaphone, ReceiptText, Wrench, Users, Menu, Bell, LogOut,
  Building2, MapPin, ChevronLeft, ShieldCheck, Settings, CalendarDays,
  UserRound, Info,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { SettingsDialog } from './settings-dialog'
import { ProfileDialog } from './profile-dialog'
import { toFaDigits } from '@/lib/persian'
import type { AppUser, AppView, BuildingInfo } from '@/types/app'

const NAV_ITEMS: { key: AppView; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'داشبورد', icon: Home },
  { key: 'calendar', label: 'تقویم', icon: CalendarDays },
  { key: 'bills', label: 'قبض‌ها', icon: ReceiptText },
  { key: 'requests', label: 'درخواست‌ها', icon: Wrench },
  { key: 'residents', label: 'ساکنین', icon: Users },
]

const VIEW_META: Record<AppView, { title: string; subtitle?: string }> = {
  dashboard: { title: 'مدیرمن', subtitle: 'مدیریت هوشمند ساختمان' },
  calendar: { title: 'تقویم و یادآوری', subtitle: 'برنامه‌های ساختمان و یادآوری‌های شما' },
  announcements: {
    title: 'اعلان‌ها و اطلاعیه‌ها',
    subtitle: 'آخرین اطلاعیه‌های ساختمان و مدیریت',
  },
  bills: { title: 'قبض‌ها و پرداخت‌ها', subtitle: 'مدیریت شارژ و هزینه‌های واحد' },
  requests: { title: 'درخواست‌های تعمیرات', subtitle: 'پیگیری درخواست‌های واحد شما' },
  residents: { title: 'لیست ساکنین', subtitle: 'مدیریت ساکنین ساختمان' },
}

export function AppShell({
  user,
  view,
  onNavigate,
  onLogout,
  onSaveSettings,
  onProfileSaved,
  buildingName,
  buildingAddress,
  notificationCount,
  children,
}: {
  user: AppUser
  view: AppView
  onNavigate: (v: AppView) => void
  onLogout: () => void
  onSaveSettings: (patch: Partial<BuildingInfo>) => Promise<boolean>
  onProfileSaved: () => void
  buildingName?: string
  buildingAddress?: string
  notificationCount: number
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const meta = VIEW_META[view]
  const isManager = user.role === 'manager'

  const goTo = (v: AppView) => {
    onNavigate(v)
    setDrawerOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-200/60 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50/40 shadow-2xl shadow-slate-300/50 flex flex-col relative">
        {/* هدر */}
        <header className="relative bg-gradient-to-b from-blue-200/60 via-blue-100/50 to-transparent rounded-b-[2rem] px-4 pt-5 pb-6">
          {/* تصویر ساختمان در هدر قبض‌ها */}
          {view === 'bills' && (
            <img
              src="/images/building-header.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-16 object-cover object-bottom mix-blend-multiply opacity-60 pointer-events-none select-none"
            />
          )}
          <div className="relative flex items-center justify-between">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="منو"
              className="w-11 h-11 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <Menu className="w-5 h-5 text-blue-950" />
            </button>

            <div className="text-center flex-1 min-w-0 px-2">
              <h1 className="text-lg font-extrabold text-blue-950 leading-6 truncate">
                {meta.title}
              </h1>
              {meta.subtitle && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{meta.subtitle}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate('announcements')}
              aria-label="اعلان‌ها"
              className="relative w-11 h-11 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <Bell className="w-5 h-5 text-blue-950" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {toFaDigits(notificationCount)}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* محتوا */}
        <main className="flex-1 pb-28">{children}</main>

        {/* نویگیشن پایین */}
        <nav
          aria-label="نویگیشن اصلی"
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-md pointer-events-auto bg-white/95 backdrop-blur border-t border-blue-100 shadow-[0_-4px_20px_rgba(37,99,235,0.08)] flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = view === item.key
              return (
                <motion.button
                  key={item.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(item.key)}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                    active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0 w-10 h-[3px] rounded-b-full transition-all ${
                      active ? 'bg-blue-600' : 'bg-transparent'
                    }`}
                  />
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                  <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </nav>

        {/* منوی کشویی */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-72 p-0 bg-white" dir="rtl">
            <SheetTitle className="sr-only">منوی کاربری</SheetTitle>
            <div className="bg-gradient-to-b from-blue-600 to-blue-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  {isManager ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold truncate">{user.name}</p>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {isManager
                      ? 'مدیر ساختمان'
                      : user.unitNumber
                        ? `ساکن واحد ${toFaDigits(user.unitNumber)}${user.floor ? ` - طبقه ${toFaDigits(user.floor)}` : ''}`
                        : 'در انتظار تأیید مدیر'}
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-2xl p-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-100 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{buildingName || 'ساختمان من'}</p>
                  {buildingAddress && (
                    <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{buildingAddress}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = view === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => goTo(item.key)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
                  </button>
                )
              })}

              {/* اعلان‌ها (از نویگیشن پایین حذف شده؛ از اینجا و زنگ هدر در دسترس است) */}
              <button
                onClick={() => goTo('announcements')}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold transition-colors ${
                  view === 'announcements'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-5 h-5" />
                اعلان‌ها
                <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
              </button>

              <div className="border-t border-slate-100 my-3" />

              <button
                onClick={() => {
                  setProfileOpen(true)
                  setDrawerOpen(false)
                }}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <UserRound className="w-5 h-5" />
                پروفایل من
                <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
              </button>

              {isManager && (
                <button
                  onClick={() => {
                    setSettingsOpen(true)
                    setDrawerOpen(false)
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  تنظیمات ساختمان و پرداخت
                  <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
                </button>
              )}

              <button
                onClick={() => {
                  setAboutOpen(true)
                  setDrawerOpen(false)
                }}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Info className="w-5 h-5" />
                درباره مدیرمن
                <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
              </button>

              <button
                onClick={() => {
                  setPrivacyOpen(true)
                  setDrawerOpen(false)
                }}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-1 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                حریم خصوصی
                <ChevronLeft className="w-4 h-4 ms-auto text-slate-300" />
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                خروج از حساب کاربری
              </button>

              <p className="text-center text-[10px] text-slate-300 mt-4">
                نسخه ۱٫۲٫۰ - مدیرمن
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* دیالوگ پروفایل من */}
        <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} onSaved={onProfileSaved} />

        {/* دیالوگ درباره مدیرمن */}
        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="max-w-sm rounded-3xl p-6 bg-white text-center" dir="rtl">
            <DialogHeader>
              <div className="w-16 h-16 mx-auto rounded-3xl overflow-hidden shadow-lg shadow-blue-100 mb-3">
                <img src="/images/app-icon.png" alt="لوگو مدیرمن" className="w-full h-full object-cover" />
              </div>
              <DialogTitle className="text-blue-950">مدیرمن نسخه ۱٫۲٫۰</DialogTitle>
              <DialogDescription className="text-xs leading-6">
                اپلیکیشن مدیریت ساختمان؛ ساخته‌شده برای مدیریت هوشمند ساختمان — تقویم شمسی و یادآوری،
                قبض‌ها، اعلان‌ها و ارتباط با ساکنین در یک‌جا.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* دیالوگ حریم خصوصی */}
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-950">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                حریم خصوصی
              </DialogTitle>
              <DialogDescription className="sr-only">سیاست حفظ حریم خصوصی مدیرمن</DialogDescription>
            </DialogHeader>
            <ul className="text-xs text-slate-600 leading-7 space-y-2.5 mt-1 list-disc ps-5">
              <li>داده‌های ساختمان شما فقط روی سرور شما ذخیره می‌شود.</li>
              <li>رمز عبور به‌صورت رمزنگاری‌شده (hash) نگهداری می‌شود.</li>
              <li>اطلاعات شما با هیچ شخص ثالثی به اشتراک گذاشته نمی‌شود.</li>
              <li>شماره تماس فقط برای شناسایی حساب استفاده می‌شود.</li>
            </ul>
          </DialogContent>
        </Dialog>

        {/* دیالوگ تنظیمات ساختمان (مدیر) */}
        {isManager && (
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onSave={onSaveSettings} />
        )}
      </div>
    </div>
  )
}
