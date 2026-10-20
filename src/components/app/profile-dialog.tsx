'use client'

import { useState } from 'react'
import { Loader2, UserRound, Phone, KeyRound, Lock, DoorOpen } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { authFetch } from '@/lib/api-client'
import { faToEnDigits, toFaDigits } from '@/lib/persian'
import type { AppUser } from '@/types/app'

/**
 * دیالوگ پروفایل من: نمایش شماره موبایل (فقط خواندنی)، ویرایش نام و طبقه،
 * و بخش تغییر رمز عبور (PATCH /api/profile و POST /api/profile/password)
 */
export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: AppUser
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState(user.name || '')
  const [floor, setFloor] = useState(user.floor ? String(user.floor) : '')
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (v) {
      // prefill هنگام باز شدن (در هندلر رویداد، بدون effect)
      setName(user.name || '')
      setFloor(user.floor ? String(user.floor) : '')
      setCurrentPassword('')
      setNewPassword('')
    }
    onOpenChange(v)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'خطا', description: 'نام نمی‌تواند خالی باشد', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          floor: floor ? Number(faToEnDigits(floor)) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'ذخیره پروفایل انجام نشد')
      }
      toast({ title: 'موفق ✅', description: 'پروفایل بروزرسانی شد' })
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast({
        title: 'خطا',
        description: e instanceof Error && e.message ? e.message : 'ذخیره پروفایل انجام نشد',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: 'خطا', description: 'رمز عبور فعلی را وارد کنید', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'خطا', description: 'رمز جدید باید حداقل ۶ کاراکتر باشد', variant: 'destructive' })
      return
    }
    setChangingPassword(true)
    try {
      const res = await authFetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'تغییر رمز عبور انجام نشد')
      }
      toast({ title: 'رمز عبور تغییر کرد 🔒', description: 'از این پس با رمز جدید وارد شوید' })
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      toast({
        title: 'خطا',
        description: e instanceof Error && e.message ? e.message : 'تغییر رمز عبور انجام نشد',
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <UserRound className="w-5 h-5 text-blue-600" />
            پروفایل من
          </DialogTitle>
          <DialogDescription className="text-xs">
            اطلاعات حساب کاربری شما در مدیرمن
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 mt-2">
          {/* شماره موبایل (غیرقابل ویرایش) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره موبایل</label>
            <div className="relative">
              <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
              <Input
                dir="ltr"
                disabled
                className="rounded-xl border-blue-100 bg-slate-50 h-11 ps-11 text-left text-slate-500 disabled:opacity-90"
                value={user.phone ? toFaDigits(user.phone) : '-'}
                readOnly
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">شماره موبایل برای ورود استفاده می‌شود و قابل تغییر نیست</p>
          </div>

          <div>
            <label htmlFor="profile-name" className="block text-sm font-bold text-slate-700 mb-1.5">نام و نام خانوادگی</label>
            <div className="relative">
              <UserRound className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
              <Input
                id="profile-name"
                className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                placeholder="مثلاً: علی محمدی"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-floor" className="block text-sm font-bold text-slate-700 mb-1.5">طبقه</label>
            <div className="relative">
              <DoorOpen className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
              <Input
                id="profile-floor"
                inputMode="numeric"
                className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                placeholder="مثلاً: ۳"
                value={floor}
                onChange={(e) => setFloor(faToEnDigits(e.target.value).replace(/\D/g, '').slice(0, 2))}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600 shadow-lg shadow-blue-200"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره پروفایل'}
          </Button>

          {/* بخش تغییر رمز عبور */}
          <div className="border-t border-slate-100 pt-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 rounded-xl px-3 py-2 mb-3">
              <KeyRound className="w-4 h-4 text-blue-500" />
              تغییر رمز عبور
            </p>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="profile-current-pass" className="block text-sm font-bold text-slate-700 mb-1.5">رمز عبور فعلی</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                  <Input
                    id="profile-current-pass"
                    type="password"
                    dir="ltr"
                    className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11 text-left"
                    placeholder="••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-new-pass" className="block text-sm font-bold text-slate-700 mb-1.5">رمز عبور جدید</label>
                <div className="relative">
                  <KeyRound className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                  <Input
                    id="profile-new-pass"
                    type="password"
                    dir="ltr"
                    className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11 text-left"
                    placeholder="حداقل ۶ کاراکتر"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                variant="outline"
                className="w-full h-11 rounded-xl font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال تغییر...
                  </>
                ) : (
                  'تغییر رمز عبور'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
