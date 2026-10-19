'use client'

import { useState } from 'react'
import {
  Search, Phone, Building2, UserRound, CircleCheck, CircleX, Clock3,
  ShieldCheck, Trash2, ChevronDown, Check, BadgeCheck, Loader2, UserSearch,
  KeyRound, Copy, Crown,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { authFetch } from '@/lib/api-client'
import { toFaDigits, faToEnDigits } from '@/lib/persian'
import type { Resident, AppUser, UserRole } from '@/types/app'
import { EmptyState } from './announcements-view'

const STATUS_META: Record<string, { label: string; chip: string; icon: React.ElementType }> = {
  active: { label: 'فعال', chip: 'bg-green-50 text-green-700', icon: CircleCheck },
  inactive: { label: 'غیرفعال', chip: 'bg-red-50 text-red-600', icon: CircleX },
  unassigned: { label: 'در انتظار تأیید', chip: 'bg-amber-50 text-amber-700', icon: Clock3 },
  pending: { label: 'در انتظار تأیید', chip: 'bg-amber-50 text-amber-700', icon: Clock3 },
}

const ROLE_META: Record<UserRole, { label: string; chip: string; icon: React.ElementType }> = {
  manager: { label: 'مدیر', chip: 'bg-emerald-50 text-emerald-700', icon: ShieldCheck },
  resident: { label: 'ساکن', chip: 'bg-slate-100 text-slate-600', icon: UserRound },
}

export function ResidentsView({
  residents,
  isManager,
  currentUser,
  onAdd,
  onChangeRole,
  onDelete,
  onResetPassword,
}: {
  residents: Resident[]
  isManager: boolean
  currentUser: AppUser
  onAdd: () => void
  onChangeRole: (id: string, role: UserRole) => void
  onDelete: (id: string) => void
  onResetPassword: (id: string) => Promise<string | null>
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null)
  const [transferTarget, setTransferTarget] = useState<Resident | null>(null)
  const [resetTarget, setResetTarget] = useState<Resident | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  const filtered = residents.filter((r) => {
    const q = faToEnDigits(query.trim())
    const matchQuery =
      !q ||
      r.name.includes(query.trim()) ||
      r.name.includes(q) ||
      (r.unitNumber && r.unitNumber.includes(q)) ||
      (r.floor && String(r.floor).includes(q))
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending'
        ? r.status === 'unassigned' || r.status === 'pending'
        : r.status === statusFilter)
    return matchQuery && matchStatus
  })

  return (
    <div className="px-4 pt-2 pb-4 relative">
      {/* جستجو */}
      <div className="relative mb-4">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none" />
        <Input
          className="h-12 rounded-full border-blue-100 bg-white shadow-sm ps-12 text-sm placeholder:text-slate-400 focus-visible:ring-blue-300"
          placeholder="جستجو بر اساس نام، واحد یا شماره تماس..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* فیلتر وضعیت */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 mb-4">
        {([
          ['all', 'همه'],
          ['active', 'فعال'],
          ['pending', 'در انتظار تأیید'],
          ['inactive', 'غیرفعال'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold border transition-all ${
              statusFilter === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-blue-50/60 text-blue-900 border-blue-100 hover:border-blue-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* لیست ساکنین */}
      <div className="space-y-4">
        {filtered.length === 0 && <EmptyState text="ساکنی یافت نشد" />}
        {filtered.map((r, i) => {
          const status = STATUS_META[r.status] || STATUS_META.pending
          const StatusIcon = status.icon
          const role: UserRole = r.role || (r.id === currentUser.id ? currentUser.role : 'resident')
          const roleMeta = ROLE_META[role] || ROLE_META.resident
          const RoleIcon = roleMeta.icon
          const isSelf = r.id === currentUser.id
          return (
            <div
              key={r.id}
              className={`bg-white rounded-2xl shadow-sm shadow-blue-100/70 border border-blue-100/60 p-4 transition-all card-enter card-enter-${(i % 4) + 1}`}
            >
              <div className="flex items-center gap-3">
                {/* آواتار و اطلاعات */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 min-w-[44px] rounded-full flex items-center justify-center ${
                        r.status === 'inactive'
                          ? 'bg-red-50'
                          : r.status === 'unassigned' || r.status === 'pending'
                            ? 'bg-amber-50'
                            : 'bg-blue-50'
                      }`}
                    >
                      <UserRound
                        className={`w-[22px] h-[22px] ${
                          r.status === 'inactive'
                            ? 'text-red-400'
                            : r.status === 'unassigned' || r.status === 'pending'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                        }`}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-extrabold text-blue-950 truncate">{r.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${roleMeta.chip}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleMeta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.unitNumber
                          ? `واحد ${toFaDigits(r.unitNumber)}${r.floor ? `، طبقه ${toFaDigits(r.floor)}` : ''}`
                          : 'بدون واحد'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1 mt-2.5 ${status.chip}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                {/* واحد و تماس */}
                <div className="flex flex-col items-center gap-2.5">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 rounded-lg px-2 py-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {r.floor ? `طبقه ${toFaDigits(r.floor)}` : '-'}
                  </span>
                  {r.phone && (
                    <a
                      href={`tel:${faToEnDigits(r.phone)}`}
                      aria-label={`تماس با ${r.name}`}
                      className="w-10 h-10 rounded-2xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                    >
                      <Phone className="w-4.5 h-4.5 w-[18px] h-[18px] text-blue-600" />
                    </a>
                  )}
                </div>
              </div>

              {/* ابزارهای مدیر: تغییر سطح دسترسی و حذف */}
              {isManager && (
                <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between gap-2">
                  {isSelf ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <BadgeCheck className="w-4 h-4 text-blue-300" />
                      حساب شما
                    </span>
                  ) : (
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger
                        aria-label="تغییر سطح دسترسی"
                        className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl bg-blue-50/70 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        تغییر سطح دسترسی
                        <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52">
                        <DropdownMenuItem
                          onClick={() => role !== 'manager' && setTransferTarget(r)}
                          className="cursor-pointer"
                        >
                          <Crown className="w-4 h-4 text-amber-500 me-1.5" />
                          ارتقا به مدیر
                          {role === 'manager' && <Check className="w-3.5 h-3.5 ms-auto text-blue-600" />}
                        </DropdownMenuItem>
                        {role === 'manager' && (
                          <DropdownMenuItem
                            onClick={() => onChangeRole(r.id, 'resident')}
                            className="cursor-pointer"
                          >
                            <UserRound className="w-4 h-4 text-blue-500 me-1.5" />
                            تغییر به ساکن
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setResetTarget(r)
                            setTempPassword(null)
                            setCopied(false)
                          }}
                          className="cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-blue-500 me-1.5" />
                          بازنشانی رمز عبور
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {!isSelf && (
                    <button
                      onClick={() => setDeleteTarget(r)}
                      aria-label={`حذف ${r.name}`}
                      className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-[18px] h-[18px] text-red-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* تایید حذف ساکن */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-950">حذف ساکن</AlertDialogTitle>
            <AlertDialogDescription>
              با حذف این ساکن، تمام رسیدهای ارسالی او حذف می‌شود و دسترسی‌اش قطع می‌شود. آیا مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id)
                setDeleteTarget(null)
              }}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تایید انتقال مدیریت ساختمان */}
      <AlertDialog open={!!transferTarget} onOpenChange={(v) => !v && setTransferTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-950">
              <Crown className="w-5 h-5 text-amber-500" />
              انتقال مدیریت ساختمان
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-7">
              با تأیید، <span className="font-bold text-blue-900">{transferTarget?.name}</span> مدیر
              ساختمان می‌شود و دسترسی مدیریتی شما پایان می‌یابد (شما ساکن خواهید بود).
              <br />
              انتقال مدیریت فقط توسط مدیر جدید قابل بازگشت است. ادامه می‌دهید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transferTarget) onChangeRole(transferTarget.id, 'manager')
                setTransferTarget(null)
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-600"
            >
              انتقال مدیریت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* بازنشانی رمز عبور عضو */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(v) => {
          if (!v) {
            setResetTarget(null)
            setTempPassword(null)
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-950">
              <KeyRound className="w-5 h-5 text-blue-600" />
              بازنشانی رمز عبور
            </DialogTitle>
            <DialogDescription className="text-xs leading-6">
              رمز موقت برای <span className="font-bold">{resetTarget?.name}</span> ساخته می‌شود؛
              آن را به او اطلاع دهید تا با ورود، از بخش پروفایل رمز جدید بگذارد.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-3.5 mt-2">
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 text-center">
                <p className="text-[11px] text-slate-500 mb-2">رمز عبور موقت</p>
                <p dir="ltr" className="text-3xl font-extrabold tracking-[0.3em] text-blue-700 text-center">
                  {toFaDigits(tempPassword)}
                </p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(tempPassword)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    // بی‌خیال
                  }
                }}
                variant="outline"
                className="w-full h-11 rounded-xl font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 me-1.5" />
                    کپی شد
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 me-1.5" />
                    کپی رمز موقت
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="mt-2">
              <Button
                onClick={async () => {
                  if (!resetTarget) return
                  setResetting(true)
                  const pw = await onResetPassword(resetTarget.id)
                  setTempPassword(pw)
                  setResetting(false)
                }}
                disabled={resetting}
                className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'ساخت رمز موقت'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* دکمه افزودن عضو با شماره تماس (مدیر) */}
      {isManager && (
        <button
          onClick={onAdd}
          aria-label="افزودن عضو با شماره تماس"
          className="fixed bottom-24 left-4 sm:left-[calc(50%-13rem)] w-14 h-14 rounded-full bg-gradient-to-t from-blue-500 to-blue-400 text-white shadow-xl shadow-blue-300/60 flex items-center justify-center hover:from-blue-600 hover:to-blue-500 transition-all active:scale-95 z-40"
        >
          <UserSearch className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

/** دیالوگ افزودن عضو با شماره تماس (مدیر): جستجوی کاربر ثبت‌نام‌شده و افزودن به ساختمان */
export function AddMemberDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [foundUser, setFoundUser] = useState<AppUser | null>(null)
  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [adding, setAdding] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setPhone('')
      setSearching(false)
      setSearched(false)
      setFoundUser(null)
      setUnitNumber('')
      setFloor('')
    }
    onOpenChange(v)
  }

  /** جستجوی کاربر با شماره موبایل */
  const handleSearch = async () => {
    const p = faToEnDigits(phone.trim()).replace(/\D/g, '')
    if (!/^09\d{9}$/.test(p)) {
      toast({ title: 'خطا', description: 'شماره موبایل معتبر نیست (مثلاً 09121234567)', variant: 'destructive' })
      return
    }
    setSearching(true)
    setSearched(false)
    setFoundUser(null)
    try {
      const res = await authFetch(`/api/members/search?phone=${encodeURIComponent(p)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'جستجو انجام نشد')
      }
      const data = await res.json()
      setSearched(true)
      if (data?.found && data?.user) setFoundUser(data.user as AppUser)
    } catch (e) {
      toast({
        title: 'خطا',
        description: e instanceof Error && e.message ? e.message : 'جستجو انجام نشد',
        variant: 'destructive',
      })
    } finally {
      setSearching(false)
    }
  }

  /** افزودن کاربر یافت‌شده به ساختمان */
  const handleAdd = async () => {
    if (!foundUser) return
    if (!unitNumber.trim()) {
      toast({ title: 'خطا', description: 'شماره واحد الزامی است', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      const res = await authFetch(`/api/residents/${foundUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitNumber: faToEnDigits(unitNumber.trim()),
          floor: floor ? Number(faToEnDigits(floor)) : null,
          status: 'active',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'افزودن به ساختمان انجام نشد')
      }
      toast({ title: 'موفق 🎉', description: 'ساکن جدید به ساختمان اضافه شد' })
      handleOpenChange(false)
      onCreated()
    } catch (e) {
      toast({
        title: 'خطا',
        description: e instanceof Error && e.message ? e.message : 'افزودن به ساختمان انجام نشد',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <UserSearch className="w-5 h-5 text-blue-600" />
            افزودن عضو با شماره تماس
          </DialogTitle>
          <DialogDescription className="text-xs">
            شماره موبایل کسی را وارد کنید که در اپ ثبت‌نام کرده است
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 mt-2">
          {/* جستجو */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره موبایل</label>
            <div className="flex gap-2">
              <Input
                dir="ltr"
                inputMode="tel"
                className="flex-1 rounded-xl border-blue-100 bg-blue-50/50 h-11 text-left placeholder:text-slate-400"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600 px-5"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'جستجو'}
              </Button>
            </div>
          </div>

          {/* نتیجه: کاربر یافت‌شده بدون واحد */}
          {foundUser && !foundUser.unitNumber && (
            <div className="space-y-3.5">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 min-w-[44px] rounded-full bg-white flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-blue-500" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-blue-950 text-sm truncate">{foundUser.name}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-50 text-amber-700">
                      <Clock3 className="w-3 h-3" />
                      در انتظار تأیید
                    </span>
                  </div>
                  <p dir="ltr" className="text-[11px] text-slate-400 mt-0.5 text-left">
                    {toFaDigits(foundUser.phone || '')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره واحد</label>
                  <Input
                    inputMode="numeric"
                    className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-center"
                    placeholder="۸"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">طبقه (اختیاری)</label>
                  <Input
                    inputMode="numeric"
                    className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-center"
                    placeholder="۳"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleAdd}
                disabled={adding}
                className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
              >
                {adding ? 'در حال افزودن...' : 'افزودن به ساختمان'}
              </Button>
            </div>
          )}

          {/* نتیجه: کاربر قبلاً عضو ساختمان است */}
          {foundUser && foundUser.unitNumber && (
            <div className="bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <Building2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-6">
                این کاربر قبلاً عضو ساختمان است (واحد {toFaDigits(foundUser.unitNumber)}).
              </p>
            </div>
          )}

          {/* نتیجه: کاربر یافت نشد */}
          {searched && !foundUser && (
            <div className="bg-blue-50/80 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
              <UserRound className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-6">
                کاربری با این شماره ثبت‌نام نکرده است. از او بخواهید ابتدا در اپ ثبت‌نام کند.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
