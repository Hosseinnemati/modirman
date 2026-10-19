'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoginScreen } from '@/components/app/login-screen'
import { AppShell } from '@/components/app/app-shell'
import { DashboardView, type DashboardStats } from '@/components/app/dashboard-view'
import { CalendarView, type ReminderInput } from '@/components/app/calendar-view'
import { AnnouncementsView, NewAnnouncementDialog } from '@/components/app/announcements-view'
import { BillsView, NewBillDialog } from '@/components/app/bills-view'
import { RequestsView, NewRequestDialog } from '@/components/app/requests-view'
import { ResidentsView, AddMemberDialog } from '@/components/app/residents-view'
import { WaitingScreen } from '@/components/app/waiting-screen'
import { useToast } from '@/hooks/use-toast'
import { authFetch, getToken, setToken, clearToken } from '@/lib/api-client'
import { startReminderWatcher } from '@/lib/notifications'
import type {
  AppUser, AppView, Announcement, Bill, ServiceRequest, Resident,
  Receipt, BuildingInfo, Reminder, ReminderType, UserRole,
} from '@/types/app'

const USER_STORAGE_KEY = 'building_app_user'

/** ساکنی که هنوز مدیر او را به ساختمان اضافه نکرده است */
const isWaitingUser = (u: AppUser | null | undefined): boolean =>
  !!u && u.role === 'resident' && (u.status === 'unassigned' || !u.unitNumber)

export default function HomePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<AppUser | null>(null)
  const [booted, setBooted] = useState(false)
  const [view, setView] = useState<AppView>('dashboard')

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [settings, setSettings] = useState<BuildingInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [checkingActivation, setCheckingActivation] = useState(false)

  // ref یادآوری‌ها برای watcher نوتیفیکیشن (بدون ری‌استارت شدن interval)
  const remindersRef = useRef<Reminder[]>([])
  useEffect(() => {
    remindersRef.current = reminders
  }, [reminders])

  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false)
  const [newBillOpen, setNewBillOpen] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [newResidentOpen, setNewResidentOpen] = useState(false)

  // نمایش خطا (شامل خطای 401 با پیام ورود مجدد)
  const handleAuthError = useCallback((e: unknown) => {
    const message =
      e instanceof Error && e.message ? e.message : 'خطا در انجام عملیات؛ دوباره تلاش کنید'
    toast({ title: 'خطا', description: message, variant: 'destructive' })
  }, [toast])

  // بازیابی نشست: اعتبارسنجی توکن با /api/auth/me هنگام بوت
  useEffect(() => {
    const boot = async () => {
      const token = getToken()
      if (!token) {
        setBooted(true)
        return
      }
      try {
        const res = await authFetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            const fresh = data.user as AppUser
            setUser(fresh)
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh))
          } else {
            throw new Error('invalid session')
          }
        } else {
          throw new Error('unauthorized')
        }
      } catch {
        clearToken()
        localStorage.removeItem(USER_STORAGE_KEY)
      } finally {
        setBooted(true)
      }
    }
    boot()
  }, [])

  const loadAll = useCallback(async (u: AppUser) => {
    setLoadingData(true)
    try {
      const isManager = u.role === 'manager'
      const unitQS = !isManager && u.unitNumber ? `?unit=${encodeURIComponent(u.unitNumber)}` : ''

      // همه endpointها احراز هویت می‌خواهند — از authFetch استفاده می‌کنیم
      // خطای 401 فقط یک بار toast می‌شود
      let authErrorToasted = false
      const safeAuthJson = async (url: string, apply: (data: unknown) => void) => {
        try {
          const r = await authFetch(url)
          if (r.ok) {
            const data = await r.json()
            apply(data)
          }
        } catch (e) {
          if (!authErrorToasted) {
            authErrorToasted = true
            handleAuthError(e)
          }
        }
      }

      await Promise.all([
        safeAuthJson('/api/announcements', (d) => setAnnouncements((d as Announcement[]) || [])),
        safeAuthJson(`/api/bills${unitQS}`, (d) => setBills((d as Bill[]) || [])),
        safeAuthJson(`/api/requests${unitQS}`, (d) => setRequests((d as ServiceRequest[]) || [])),
        safeAuthJson(
          `/api/stats${unitQS ? `?unit=${encodeURIComponent(u.unitNumber!)}` : ''}`,
          (d) => setStats(d as DashboardStats),
        ),
        safeAuthJson('/api/settings', (d) => {
          if (d) setSettings(d as BuildingInfo)
        }),
        safeAuthJson('/api/receipts', (d) => setReceipts((d as Receipt[]) || [])),
        safeAuthJson('/api/residents', (d) => setResidents((d as Resident[]) || [])),
        safeAuthJson('/api/reminders', (d) => {
          const list = (d as Reminder[]) || []
          setReminders(list)
          remindersRef.current = list
        }),
      ])
    } catch {
      // خطای شبکه
    } finally {
      setLoadingData(false)
    }
  }, [handleAuthError])

  const waiting = isWaitingUser(user)

  useEffect(() => {
    if (user && !waiting) loadAll(user)
  }, [user, waiting, loadAll])

  const handleLogin = (u: AppUser, token: string) => {
    if (token) setToken(token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    setView('dashboard')
    toast({ title: `خوش آمدید ${u.name} 👋`, description: 'با موفقیت وارد شدید' })
  }

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY)
    clearToken()
    setUser(null)
    setView('dashboard')
    setStats(null)
    setReceipts([])
    setReminders([])
    setSettings(null)
  }

  // بروزرسانی کاربر از سرور (me) — پس از ذخیره پروفایل
  const reloadUserFromMe = useCallback(async () => {
    try {
      const res = await authFetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          const fresh = data.user as AppUser
          setUser(fresh)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh))
        }
      }
    } catch {
      // بی‌خیال
    }
  }, [])

  // دکمه «بررسی مجدد» در صفحه انتظار
  const handleCheckActivation = async () => {
    setCheckingActivation(true)
    try {
      const res = await authFetch('/api/auth/me')
      if (!res.ok) throw new Error('بروزرسانی اطلاعات انجام نشد')
      const data = await res.json()
      if (!data?.user) throw new Error('بروزرسانی اطلاعات انجام نشد')
      const fresh = data.user as AppUser
      setUser(fresh)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh))
      if (fresh.status === 'active' && fresh.unitNumber) {
        toast({ title: 'خوش آمدید! 🎉', description: 'شما به ساختمان اضافه شدید' })
      } else {
        toast({
          title: 'هنوز تأیید نشده',
          description: 'مدیر ساختمان هنوز شما را اضافه نکرده است؛ کمی بعد دوباره بررسی کنید',
        })
      }
    } catch (e) {
      handleAuthError(e)
    } finally {
      setCheckingActivation(false)
    }
  }

  // پرداخت قبض (حضوری توسط مدیر)
  const handlePay = async (bill: Bill) => {
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay' }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'پرداخت موفق ✅', description: 'قبض شما با موفقیت پرداخت شد' })
      if (user) loadAll(user)
    } catch {
      toast({ title: 'خطا', description: 'پرداخت انجام نشد', variant: 'destructive' })
    }
  }

  // حذف قبض (مدیر)
  const handleDeleteBill = async (bill: Bill) => {
    try {
      const res = await fetch(`/api/bills/${bill.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'حذف شد', description: 'قبض با موفقیت حذف شد' })
      if (user) loadAll(user)
    } catch {
      toast({ title: 'خطا', description: 'حذف قبض انجام نشد', variant: 'destructive' })
    }
  }

  // ارسال رسید پرداخت توسط ساکن
  const handleSubmitReceipt = async (
    bill: Bill,
    amount: number,
    image: string,
    note?: string,
  ): Promise<boolean> => {
    try {
      const res = await authFetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: bill.id, amount, image, note: note || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'ارسال رسید انجام نشد')
      }
      toast({ title: 'رسید ارسال شد', description: 'رسید ارسال شد و در انتظار تأیید مدیر است' })
      if (user) loadAll(user)
      return true
    } catch (e) {
      handleAuthError(e)
      return false
    }
  }

  // تأیید یا رد رسید توسط مدیر
  const handleReviewReceipt = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await authFetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'بروزرسانی رسید انجام نشد')
      }
      toast({
        title: status === 'approved' ? 'رسید تأیید شد و قبض پرداخت‌شده علامت خورد' : 'رسید رد شد',
        description:
          status === 'approved'
            ? 'قبض مربوطه پرداخت‌شده علامت خورد'
            : 'ساکن می‌تواند رسید جدیدی ارسال کند',
      })
      if (user) loadAll(user)
    } catch (e) {
      handleAuthError(e)
    }
  }

  // حذف رسید
  const handleDeleteReceipt = async (id: string) => {
    try {
      const res = await authFetch(`/api/receipts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'حذف شد', description: 'رسید با موفقیت حذف شد' })
      if (user) loadAll(user)
    } catch (e) {
      handleAuthError(e)
    }
  }

  // تغییر سطح دسترسی ساکن (مدیر)
  // ارتقای عضو به «مدیر» = انتقال مدیریت ساختمان؛ مدیر قبلی ساکن می‌شود
  const handleChangeResidentRole = async (id: string, role: UserRole) => {
    try {
      const res = await authFetch(`/api/residents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'تغییر سطح دسترسی انجام نشد')
      }
      if (role === 'manager') {
        toast({
          title: 'مدیریت ساختمان منتقل شد ✅',
          description: 'مدیریت به عضو جدید واگذار شد و شما اکنون ساکن ساختمان هستید',
        })
        // نقش کاربر عوض شده — از سرور بگیر تا ویو و داده‌ها با نقش جدید لود شوند
        await reloadUserFromMe()
      } else {
        toast({ title: 'موفق', description: 'سطح دسترسی ساکن بروزرسانی شد' })
        if (user) loadAll(user)
      }
    } catch (e) {
      handleAuthError(e)
    }
  }

  // بازنشانی رمز عبور عضو توسط مدیر — رمز موقت فقط یک بار نمایش داده می‌شود
  const handleResetPassword = async (id: string): Promise<string | null> => {
    try {
      const res = await authFetch(`/api/residents/${id}/reset-password`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'بازنشانی رمز عبور انجام نشد')
      }
      const data = await res.json()
      toast({
        title: 'رمز موقت ساخته شد',
        description: 'این رمز را در اختیار عضو قرار دهید',
      })
      return typeof data?.tempPassword === 'string' ? data.tempPassword : null
    } catch (e) {
      handleAuthError(e)
      return null
    }
  }

  // حذف ساکن (مدیر)
  const handleDeleteResident = async (id: string) => {
    try {
      const res = await authFetch(`/api/residents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'حذف ساکن انجام نشد')
      }
      toast({ title: 'حذف شد', description: 'ساکن و رسیدهای او با موفقیت حذف شدند' })
      if (user) loadAll(user)
    } catch (e) {
      handleAuthError(e)
    }
  }

  // ذخیره تنظیمات ساختمان و پرداخت (مدیر)
  const handleSaveSettings = async (patch: Partial<BuildingInfo>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'ذخیره تنظیمات انجام نشد')
      }
      const data = await res.json()
      if (data) setSettings(data)
      toast({ title: 'موفق', description: 'تنظیمات ذخیره شد' })
      return true
    } catch (e) {
      handleAuthError(e)
      return false
    }
  }

  // تغییر وضعیت درخواست (مدیر)
  const handleToggleRequest = async (r: ServiceRequest) => {
    const next = r.status === 'in_progress' ? 'done' : 'in_progress'
    try {
      const res = await fetch(`/api/requests/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: next === 'done' ? 'انجام شد ✅' : 'بازگشایی شد',
        description: 'وضعیت درخواست بروزرسانی شد',
      })
      if (user) loadAll(user)
    } catch {
      toast({ title: 'خطا', description: 'بروزرسانی انجام نشد', variant: 'destructive' })
    }
  }

  // ثبت یادآوری جدید (شخصی / کل ساختمان)
  const handleAddReminder = useCallback(async (data: ReminderInput): Promise<boolean> => {
    try {
      const res = await authFetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          date: data.date,
          time: data.time || undefined,
          type: data.type satisfies ReminderType,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'ثبت یادآوری انجام نشد')
      }
      toast({ title: 'یادآوری ثبت شد ✅', description: 'در زمان مقرر نوتیفیکیشن دریافت می‌کنید' })
      if (user) loadAll(user)
      return true
    } catch (e) {
      handleAuthError(e)
      return false
    }
  }, [user, loadAll, handleAuthError, toast])

  // حذف یادآوری
  const handleDeleteReminder = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'حذف یادآوری انجام نشد')
      }
      toast({ title: 'حذف شد', description: 'یادآوری با موفقیت حذف شد' })
      if (user) loadAll(user)
    } catch (e) {
      handleAuthError(e)
    }
  }, [user, loadAll, handleAuthError])

  // مانیتور نوتیفیکیشن یادآوری‌ها (وقتی کاربر وارد شده و در حال استفاده از اپ است)
  useEffect(() => {
    if (!user || waiting) return
    return startReminderWatcher(() => remindersRef.current)
  }, [user, waiting])

  if (!booted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">مدیرمن</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  // صفحه انتظار: ساکن ثبت‌نام‌شده که هنوز به ساختمان اضافه نشده
  if (waiting) {
    return (
      <WaitingScreen
        user={user}
        checking={checkingActivation}
        onRefresh={handleCheckActivation}
        onLogout={handleLogout}
      />
    )
  }

  const isManager = user.role === 'manager'

  return (
    <>
      <AppShell
        user={user}
        view={view}
        onNavigate={setView}
        onLogout={handleLogout}
        onSaveSettings={handleSaveSettings}
        onProfileSaved={reloadUserFromMe}
        buildingName={settings?.name}
        buildingAddress={settings?.address}
        notificationCount={announcements.length}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {loadingData && !stats ? (
              <div className="px-4 pt-4 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-blue-100 rounded-full w-1/2" />
                      <div className="h-2.5 bg-blue-50 rounded-full w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {view === 'dashboard' && (
                  <DashboardView
                    user={user}
                    stats={stats}
                    receipts={receipts}
                    settings={settings}
                    reminders={reminders}
                    onNavigate={setView}
                  />
                )}
                {view === 'calendar' && (
                  <CalendarView
                    reminders={reminders}
                    isManager={isManager}
                    currentUser={user}
                    onAddReminder={handleAddReminder}
                    onDeleteReminder={handleDeleteReminder}
                  />
                )}
                {view === 'announcements' && (
                  <AnnouncementsView
                    user={user}
                    announcements={announcements}
                    onCreate={() => setNewAnnouncementOpen(true)}
                  />
                )}
                {view === 'bills' && (
                  <BillsView
                    user={user}
                    bills={bills}
                    receipts={receipts}
                    settings={settings}
                    onPay={handlePay}
                    onCreate={() => setNewBillOpen(true)}
                    onDelete={handleDeleteBill}
                    onSubmitReceipt={handleSubmitReceipt}
                    onReviewReceipt={handleReviewReceipt}
                    onDeleteReceipt={handleDeleteReceipt}
                  />
                )}
                {view === 'requests' && (
                  <RequestsView
                    user={user}
                    requests={requests}
                    onCreate={() => setNewRequestOpen(true)}
                    onToggleStatus={handleToggleRequest}
                  />
                )}
                {view === 'residents' && (
                  <ResidentsView
                    residents={residents}
                    isManager={isManager}
                    currentUser={user}
                    onAdd={() => setNewResidentOpen(true)}
                    onChangeRole={handleChangeResidentRole}
                    onDelete={handleDeleteResident}
                    onResetPassword={handleResetPassword}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </AppShell>

      {/* دیالوگ‌ها */}
      {isManager && (
        <>
          <NewAnnouncementDialog
            open={newAnnouncementOpen}
            onOpenChange={setNewAnnouncementOpen}
            onCreated={() => user && loadAll(user)}
          />
          <NewBillDialog
            open={newBillOpen}
            onOpenChange={setNewBillOpen}
            onCreated={() => user && loadAll(user)}
          />
          <AddMemberDialog
            open={newResidentOpen}
            onOpenChange={setNewResidentOpen}
            onCreated={() => user && loadAll(user)}
          />
        </>
      )}
      <NewRequestDialog
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        user={user}
        onCreated={() => user && loadAll(user)}
      />
    </>
  )
}
