'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Plus, Clock3, Trash2,
  BellRing, BellOff, CircleCheck, Building2, UserRound,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { toFaDigits } from '@/lib/persian'
import {
  JALALI_MONTHS, WEEK_DAYS, todayJalaali, formatJalali, parseJalali,
  jalaaliMonthLength, firstWeekdayOfMonth, jalaliDayLabel,
} from '@/lib/jalali'
import { getPermission, requestPermission } from '@/lib/notifications'
import type { AppUser, Reminder, ReminderType } from '@/types/app'

export type ReminderInput = {
  title: string
  description: string
  date: string
  time: string | null
  type: ReminderType
}

/**
 * تقویم جلالی با یادآوری‌های شخصی و ساختمان،
 * نوتیفیکیشن گوشی و یادآوری‌های پیش‌رو
 */
export function CalendarView({
  reminders,
  isManager,
  currentUser,
  onAddReminder,
  onDeleteReminder,
}: {
  reminders: Reminder[]
  isManager: boolean
  currentUser: AppUser
  onAddReminder: (data: ReminderInput) => Promise<boolean>
  onDeleteReminder: (id: string) => void
}) {
  const { toast } = useToast()
  const today = todayJalaali()
  const todayStr = formatJalali(today.jy, today.jm, today.jd)

  const [viewJy, setViewJy] = useState(today.jy)
  const [viewJm, setViewJm] = useState(today.jm)
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // دیالوگ یادآوری جدید
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<ReminderType>('personal')
  const [saving, setSaving] = useState(false)

  // حذف یادآوری
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null)

  // وضعیت اجازه نوتیفیکیشن (فقط سمت کلاینت)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | null>(null)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setPermission(getPermission())
    })
    return () => {
      cancelled = true
    }
  }, [])

  const monthLength = jalaaliMonthLength(viewJy, viewJm)
  const leadingBlanks = firstWeekdayOfMonth(viewJy, viewJm)

  // گروه‌بندی یادآوری‌ها بر اساس تاریخ
  const remindersByDate = useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const list = map.get(r.date) || []
      list.push(r)
      map.set(r.date, list)
    }
    return map
  }, [reminders])

  const dayReminders = remindersByDate.get(selectedDate) || []

  // یادآوری‌های پیش‌رو (۵ مورد بعدی از امروز)
  const upcoming = useMemo(() => {
    return [...reminders]
      .filter((r) => r.date >= todayStr)
      .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
      .slice(0, 5)
  }, [reminders, todayStr])

  const changeMonth = (delta: number) => {
    let m = viewJm + delta
    let y = viewJy
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setViewJy(y)
    setViewJm(m)
  }

  const goToday = () => {
    setViewJy(today.jy)
    setViewJm(today.jm)
    setSelectedDate(todayStr)
  }

  const openDialog = () => {
    setTitle('')
    setDescription('')
    setTime('')
    setType('personal')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'خطا', description: 'عنوان یادآوری الزامی است', variant: 'destructive' })
      return
    }
    setSaving(true)
    const ok = await onAddReminder({
      title: title.trim(),
      description: description.trim(),
      date: selectedDate,
      time: time || null,
      type,
    })
    setSaving(false)
    if (ok) setDialogOpen(false)
  }

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    setPermission(getPermission())
    if (granted) {
      toast({ title: 'نوتیفیکیشن فعال شد 🔔', description: 'یادآوری‌ها روی گوشی شما اطلاع داده می‌شوند' })
    } else {
      toast({ title: 'اجازه نوتیفیکیشن رد شد', description: 'برای فعال‌سازی از تنظیمات مرورگر اجازه دهید', variant: 'destructive' })
    }
  }

  const selectReminderDate = (date: string) => {
    const p = parseJalali(date)
    if (p) {
      setViewJy(p.jy)
      setViewJm(p.jm)
    }
    setSelectedDate(date)
  }

  return (
    <div className="px-4 pt-2 pb-4">
      {/* کارت تقویم */}
      <div className="bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/70 p-4 card-enter">
        {/* هدر ماه */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="ماه قبل"
            className="w-11 h-11 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </button>

          <div className="text-center">
            <p className="font-extrabold text-blue-950 text-base">
              {JALALI_MONTHS[viewJm - 1]} {toFaDigits(viewJy)}
            </p>
          </div>

          <button
            onClick={() => changeMonth(1)}
            aria-label="ماه بعد"
            className="w-11 h-11 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* دکمه امروز */}
        <div className="flex justify-center mb-3">
          <button
            onClick={goToday}
            className="rounded-full px-5 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 hover:border-blue-300 transition-colors"
          >
            امروز
          </button>
        </div>

        {/* روزهای هفته */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK_DAYS.map((d, i) => (
            <div
              key={i}
              className={`text-center text-[11px] font-bold py-1.5 ${i === 6 ? 'text-red-400' : 'text-slate-400'}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* گرید روزها */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: monthLength }).map((_, i) => {
            const day = i + 1
            const dateStr = formatJalali(viewJy, viewJm, day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const isFriday = (leadingBlanks + i) % 7 === 6
            const dayList = remindersByDate.get(dateStr) || []
            const hasBuilding = dayList.some((r) => r.type === 'building')
            const hasPersonal = dayList.some((r) => r.type === 'personal')

            const cellClass = isSelected
              ? `bg-blue-600 text-white font-bold shadow-md shadow-blue-200 ${isToday ? 'ring-2 ring-blue-300' : ''}`
              : isToday
                ? 'ring-2 ring-blue-500 text-blue-700 font-bold bg-blue-50/60'
                : isFriday
                  ? 'text-red-400 hover:bg-blue-50'
                  : 'text-slate-600 hover:bg-blue-50'

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(dateStr)}
                aria-label={`روز ${toFaDigits(day)} ${JALALI_MONTHS[viewJm - 1]}`}
                aria-pressed={isSelected}
                className={`relative aspect-square rounded-xl flex items-center justify-center text-sm transition-colors ${cellClass}`}
              >
                {toFaDigits(day)}
                {(hasBuilding || hasPersonal) && (
                  <span className="absolute bottom-1 flex gap-0.5" dir="ltr">
                    {hasBuilding && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />
                    )}
                    {hasPersonal && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-blue-400'}`} />
                    )}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* راهنمای نقطه‌ها */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            یادآوری ساختمان
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            یادآوری شخصی
          </span>
        </div>
      </div>

      {/* دکمه یادآوری جدید */}
      <button
        onClick={openDialog}
        className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-500 transition-all active:scale-[0.99]"
      >
        <Plus className="w-5 h-5" />
        یادآوری جدید
      </button>

      {/* رویدادهای روز انتخاب‌شده */}
      <div className="mt-5">
        <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5 mb-2.5">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          رویدادهای {toFaDigits(jalaliDayLabel(selectedDate))}
        </h3>

        {dayReminders.length === 0 ? (
          <div className="bg-white/70 rounded-2xl border border-dashed border-blue-200 py-8 text-center text-sm text-slate-400">
            برای این روز رویدادی ثبت نشده است
          </div>
        ) : (
          <div className="space-y-3">
            {dayReminders.map((r) => {
              const isBuilding = r.type === 'building'
              const canDelete = isManager || r.user?.name === currentUser.name
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm shadow-blue-100/70 ${
                    isBuilding ? 'border-amber-100' : 'border-blue-100/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-blue-950 text-sm">{r.title}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                            isBuilding ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isBuilding ? <Building2 className="w-3 h-3" /> : <UserRound className="w-3 h-3" />}
                          {isBuilding ? 'ساختمان' : 'شخصی'}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-6">{r.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {r.time && (
                          <span
                            dir="ltr"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 rounded-lg px-2 py-1"
                          >
                            <Clock3 className="w-3 h-3" />
                            {toFaDigits(r.time)}
                          </span>
                        )}
                        {r.user?.name && (
                          <span className="text-[10px] text-slate-400">توسط {r.user.name}</span>
                        )}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(r)}
                        aria-label={`حذف ${r.title}`}
                        className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="w-[18px] h-[18px] text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* یادآوری‌های پیش‌رو */}
      <div className="mt-5">
        <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5 mb-2.5">
          <Clock3 className="w-4 h-4 text-blue-500" />
          یادآوری‌های پیش‌رو
        </h3>

        {upcoming.length === 0 ? (
          <div className="bg-white/70 rounded-2xl border border-dashed border-blue-200 py-6 text-center text-xs text-slate-400">
            یادآوری پیش‌رویی ندارید
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((r) => {
              const isBuilding = r.type === 'building'
              return (
                <button
                  key={r.id}
                  onClick={() => selectReminderDate(r.date)}
                  className="w-full bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/70 p-3.5 flex items-center gap-3 text-start hover:border-blue-200 transition-colors"
                >
                  <div
                    className={`w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center ${
                      isBuilding ? 'bg-amber-50' : 'bg-blue-50'
                    }`}
                  >
                    {isBuilding ? (
                      <Building2 className="w-5 h-5 text-amber-500" strokeWidth={1.8} />
                    ) : (
                      <BellRing className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-blue-950 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {toFaDigits(jalaliDayLabel(r.date))}
                      {r.time ? ` - ساعت ${toFaDigits(r.time)}` : ''}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                      isBuilding ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isBuilding ? 'ساختمان' : 'شخصی'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* کارت نوتیفیکیشن */}
      {permission === 'unsupported' ? (
        <div className="mt-5 bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-400">مرورگر شما نوتیفیکیشن ندارد</p>
        </div>
      ) : permission === 'granted' ? (
        <div className="mt-5 bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex items-center gap-3">
          <CircleCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-xs font-bold text-emerald-700">یادآوری‌ها با نوتیفیکیشن اطلاع داده می‌شوند</p>
        </div>
      ) : permission === null ? null : (
        <div className="mt-5 bg-white rounded-2xl border border-blue-100/60 shadow-sm shadow-blue-100/70 p-4 flex items-center gap-3">
          <div className="w-11 h-11 min-w-[44px] rounded-xl bg-blue-50 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-950">نوتیفیکیشن خاموش است</p>
            <p className="text-[11px] text-slate-400 mt-0.5">یادآوری‌ها را روی گوشی خود دریافت کنید</p>
          </div>
          <Button
            onClick={handleEnableNotifications}
            className="h-11 rounded-xl bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs font-bold px-4 shrink-0"
          >
            فعال‌سازی نوتیفیکیشن گوشی
          </Button>
        </div>
      )}

      {/* دیالوگ یادآوری جدید */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-950">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              یادآوری جدید
            </DialogTitle>
            <DialogDescription className="text-xs">
              ثبت یادآوری برای {toFaDigits(jalaliDayLabel(selectedDate))}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 mt-2">
            <div>
              <label htmlFor="reminder-title" className="block text-sm font-bold text-slate-700 mb-1.5">عنوان</label>
              <Input
                id="reminder-title"
                className="rounded-xl border-blue-100 bg-blue-50/50 h-11"
                placeholder="مثلاً: جلسه ماهانه ساختمان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="reminder-desc" className="block text-sm font-bold text-slate-700 mb-1.5">توضیحات</label>
              <Textarea
                id="reminder-desc"
                className="rounded-xl border-blue-100 bg-blue-50/50 min-h-20"
                placeholder="اختیاری..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">تاریخ</label>
                <div className="h-11 rounded-xl border border-blue-100 bg-blue-50/80 flex items-center justify-center gap-1.5 text-sm font-bold text-blue-900 px-2">
                  <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{toFaDigits(jalaliDayLabel(selectedDate))}</span>
                </div>
              </div>
              <div>
                <label htmlFor="reminder-time" className="block text-sm font-bold text-slate-700 mb-1.5">ساعت (اختیاری)</label>
                <Input
                  id="reminder-time"
                  type="time"
                  dir="ltr"
                  className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-left"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">نوع یادآوری</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType('personal')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                    type === 'personal'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <UserRound className="w-3.5 h-3.5" />
                  شخصی
                </button>
                {isManager && (
                  <button
                    onClick={() => setType('building')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                      type === 'building'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    کل ساختمان
                  </button>
                )}
              </div>
              {isManager && type === 'building' && (
                <p className="text-[10px] text-amber-600 mt-1.5">این یادآوری برای همه ساکنین نمایش داده می‌شود</p>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
            >
              {saving ? 'در حال ثبت...' : 'ثبت یادآوری'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأیید حذف یادآوری */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-950">حذف یادآوری</AlertDialogTitle>
            <AlertDialogDescription>
              یادآوری «{deleteTarget?.title}» حذف شود؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDeleteReminder(deleteTarget.id)
                setDeleteTarget(null)
              }}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
