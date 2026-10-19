'use client'

import { useEffect, useState } from 'react'
import { Settings, Loader2, Building2, CreditCard, MapPin, DoorOpen, UserRound, Landmark } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { faToEnDigits } from '@/lib/persian'
import type { BuildingInfo } from '@/types/app'

/** گروه‌بندی رقم‌های کارت به صورت 4-4-4-4 */
function groupCardDigits(value: string): string {
  const digits = faToEnDigits(value).replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function SettingsDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (patch: Partial<BuildingInfo>) => Promise<boolean>
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [units, setUnits] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [sheba, setSheba] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // پیش‌بارگذاری تنظیمات هنگام باز شدن دیالوگ
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BuildingInfo | null) => {
        if (cancelled || !data) return
        setName(data.name || '')
        setAddress(data.address || '')
        setUnits(data.units ? String(data.units) : '')
        setCardNumber(groupCardDigits(data.cardNumber || ''))
        setCardHolder(data.cardHolder || '')
        setSheba(data.sheba || '')
      })
      .catch(() => {
        // بی‌خیال
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleCardChange = (v: string) => {
    setCardNumber(groupCardDigits(v))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'خطا', description: 'نام ساختمان الزامی است', variant: 'destructive' })
      return
    }
    setSaving(true)
    const ok = await onSave({
      name: name.trim(),
      address: address.trim(),
      units: units ? Number(faToEnDigits(units).replace(/\D/g, '')) : undefined,
      cardNumber: faToEnDigits(cardNumber).replace(/\D/g, ''),
      cardHolder: cardHolder.trim(),
      sheba: faToEnDigits(sheba).replace(/\s/g, '').toUpperCase(),
    })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <Settings className="w-5 h-5 text-blue-600" />
            تنظیمات ساختمان و پرداخت
          </DialogTitle>
          <DialogDescription className="text-xs">
            اطلاعات ساختمان و شماره کارت دریافت شارژ ساکنین
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3.5 mt-2">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">نام ساختمان</label>
              <div className="relative">
                <Building2 className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                <Input
                  className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                  placeholder="مثلاً: ساختمان آسمان نیلوفر"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">آدرس</label>
              <div className="relative">
                <MapPin className="absolute start-3.5 top-4 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                <Input
                  className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                  placeholder="مثلاً: تهران، خیابان نیلوفر، پلاک ۱۲"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">تعداد واحدها</label>
              <div className="relative">
                <DoorOpen className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                <Input
                  inputMode="numeric"
                  className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                  placeholder="۸"
                  value={units}
                  onChange={(e) => setUnits(faToEnDigits(e.target.value).replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 rounded-xl px-3 py-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-500" />
                اطلاعات حساب دریافت شارژ (نمایش به ساکنین)
              </p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره کارت</label>
                  <div className="relative">
                    <CreditCard className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                    <Input
                      dir="ltr"
                      inputMode="numeric"
                      className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11 text-left tracking-widest"
                      placeholder="6037 9912 3456 7890"
                      value={cardNumber}
                      onChange={(e) => handleCardChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">نام صاحب کارت</label>
                  <div className="relative">
                    <UserRound className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                    <Input
                      className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11"
                      placeholder="مثلاً: علی محمدی"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره شبا</label>
                  <div className="relative">
                    <Landmark className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-blue-400 pointer-events-none" />
                    <Input
                      dir="ltr"
                      className="rounded-xl border-blue-100 bg-blue-50/50 h-11 ps-11 text-left"
                      placeholder="IR120570028180012345678901"
                      value={sheba}
                      onChange={(e) => setSheba(e.target.value.replace(/\s/g, '').toUpperCase())}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600 shadow-lg shadow-blue-200"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
