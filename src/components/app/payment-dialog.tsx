'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CreditCard, Copy, Check, ImagePlus, Trash2, Loader2, ShieldCheck, StickyNote, BadgeCheck,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatMoney } from '@/lib/persian'
import { compressImageToDataUrl } from '@/lib/image'
import type { Bill, BuildingInfo } from '@/types/app'

/** گروه‌بندی رقم‌های کارت به صورت 4-4-4-4 */
function groupCardDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function PaymentDialog({
  open,
  onOpenChange,
  bill,
  settings,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  bill: Bill | null
  settings: BuildingInfo | null
  onSubmit: (bill: Bill, amount: number, image: string, note?: string) => Promise<boolean>
}) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // ریست فیلدها هنگام باز شدن دیالوگ
  useEffect(() => {
    if (open) {
      setImage(null)
      setNote('')
      setCopied(false)
    }
  }, [open, bill?.id])

  const cardDigits = (settings?.cardNumber || '').replace(/\D/g, '')
  const cardGrouped = groupCardDigits(settings?.cardNumber || '')
  const sheba = (settings?.sheba || '').trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardDigits)
      setCopied(true)
      toast({ title: 'شماره کارت کپی شد', description: 'شماره کارت در کلیپ‌بورد ذخیره شد' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'خطا', description: 'کپی شماره کارت انجام نشد', variant: 'destructive' })
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProcessing(true)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      setImage(dataUrl)
    } catch (err) {
      toast({
        title: 'خطا',
        description: err instanceof Error && err.message ? err.message : 'بارگذاری تصویر ناموفق بود',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmit = async () => {
    if (!bill || !image || submitting) return
    setSubmitting(true)
    const ok = await onSubmit(bill, bill.amount, image, note.trim() || undefined)
    setSubmitting(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950 leading-6">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
            پرداخت قبض: {bill?.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            مبلغ قبض را واریز کرده و تصویر رسید را برای تأیید مدیر ارسال کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* مبلغ */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl py-3 text-center">
            <p className="text-xs text-slate-400">مبلغ قابل پرداخت</p>
            <p className="text-2xl font-extrabold text-blue-950 mt-1">
              {bill && formatMoney(bill.amount)}
              <span className="text-xs font-normal text-slate-400 ms-1">تومان</span>
            </p>
          </div>

          {/* کارت بانکی مدیر */}
          {cardDigits ? (
            <div className="relative bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-200 overflow-hidden">
              <div className="absolute -top-8 -start-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-10 -end-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-100">
                  <ShieldCheck className="w-4 h-4" />
                  کارت بانکی مدیریت ساختمان
                </span>
                <button
                  onClick={handleCopy}
                  aria-label="کپی شماره کارت"
                  className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  {copied ? <Check className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Copy className="w-4.5 h-4.5 w-[18px] h-[18px]" />}
                </button>
              </div>
              <p dir="ltr" className="relative text-left text-xl font-extrabold tracking-[0.14em] mt-3">
                {cardGrouped}
              </p>
              <div className="relative flex items-center justify-between gap-2 mt-3">
                {settings?.cardHolder ? (
                  <span className="flex items-center gap-1 text-[11px] text-blue-100 min-w-0 truncate">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    به نام: {settings.cardHolder}
                  </span>
                ) : <span />}
                {sheba && (
                  <span dir="ltr" className="text-[10px] text-blue-100/90 text-left truncate max-w-[55%]">
                    {sheba}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-2xl px-4 py-3 flex items-start gap-2">
              <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
              مدیر هنوز شماره کارتی ثبت نکرده است؛ با مدیر هماهنگ کنید
            </div>
          )}

          {/* بارگذاری تصویر رسید */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">تصویر رسید پرداخت</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {!image ? (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={processing}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {processing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ImagePlus className="w-6 h-6" strokeWidth={1.8} />
                )}
                <span className="text-sm font-bold">انتخاب تصویر رسید</span>
                <span className="text-[10px] text-slate-400">حداکثر ۱۰ مگابایت - عکس یا اسکرین‌شات واریز</span>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={image}
                  alt="پیش‌نمایش رسید پرداخت"
                  className="w-full max-h-56 object-contain rounded-2xl border border-blue-100 bg-slate-50"
                />
                <button
                  onClick={() => setImage(null)}
                  aria-label="حذف تصویر رسید"
                  className="absolute top-2 end-2 w-11 h-11 rounded-xl bg-white/95 shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-red-500" />
                </button>
              </div>
            )}
          </div>

          {/* یادداشت */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">یادداشت (اختیاری)</label>
            <Textarea
              className="rounded-xl border-blue-100 bg-blue-50/50 min-h-20"
              placeholder="مثلاً: واریز از بانک ملی، ساعت ۱۸:۳۰..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!image || submitting}
            className="w-full h-12 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <StickyNote className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                ارسال برای تأیید مدیر
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
