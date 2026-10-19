'use client'

import { useState } from 'react'
import {
  CalendarDays, Building2, FileText, CheckCircle2, CircleAlert, ArrowLeft, Plus, ReceiptText, Trash2,
  Clock3, BadgeCheck, StickyNote, UserRound, Check, X,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { toFaDigits, formatMoney, todayJalali } from '@/lib/persian'
import type { AppUser, Bill, Receipt, ReceiptStatus, BuildingInfo } from '@/types/app'
import { EmptyState } from './announcements-view'
import { PaymentDialog } from './payment-dialog'

/** تبدیل ارقام فارسی/عربی به انگلیسی */
function faToEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** تاریخ شمسی رسید */
function receiptDate(iso: string): string {
  try {
    return toFaDigits(
      new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(iso)).replace(' AP', ''),
    )
  } catch {
    return ''
  }
}

/** جدیدترین رسید هر قبض را برمی‌گرداند */
function latestReceiptOf(billId: string, receipts: Receipt[]): Receipt | null {
  const list = receipts
    .filter((r) => r.billId === billId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  return list[0] || null
}

const RECEIPT_CHIP: Record<ReceiptStatus, { label: string; chip: string; icon: React.ElementType }> = {
  pending: {
    label: 'رسید در انتظار تأیید',
    chip: 'bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  approved: {
    label: 'پرداخت تأیید شد',
    chip: 'bg-emerald-50 text-emerald-700',
    icon: BadgeCheck,
  },
  rejected: {
    label: 'رسید رد شد؛ دوباره ارسال کنید',
    chip: 'bg-red-50 text-red-600',
    icon: CircleAlert,
  },
}

const RECEIPT_BADGE: Record<ReceiptStatus, { label: string; chip: string }> = {
  pending: { label: 'در انتظار تأیید', chip: 'bg-amber-50 text-amber-700' },
  approved: { label: 'تأیید شده', chip: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'رد شده', chip: 'bg-red-50 text-red-600' },
}

export function BillsView({
  user,
  bills,
  receipts,
  settings,
  onPay,
  onCreate,
  onDelete,
  onSubmitReceipt,
  onReviewReceipt,
  onDeleteReceipt,
}: {
  user: AppUser
  bills: Bill[]
  receipts: Receipt[]
  settings: BuildingInfo | null
  onPay: (bill: Bill) => void
  onCreate: () => void
  onDelete: (bill: Bill) => void
  onSubmitReceipt: (bill: Bill, amount: number, image: string, note?: string) => Promise<boolean>
  onReviewReceipt: (id: string, status: 'approved' | 'rejected') => void
  onDeleteReceipt: (id: string) => void
}) {
  const isManager = user.role === 'manager'
  const [topTab, setTopTab] = useState<'bills' | 'receipts'>('bills')
  const [tab, setTab] = useState<'pending' | 'paid'>('pending')
  const [payTarget, setPayTarget] = useState<Bill | null>(null)
  const [payDialogBill, setPayDialogBill] = useState<Bill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null)
  const [viewImage, setViewImage] = useState<Receipt | null>(null)
  const [deleteReceiptTarget, setDeleteReceiptTarget] = useState<Receipt | null>(null)

  const filtered = bills.filter((b) => b.status === tab)
  const pendingTotal = bills
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0)

  const sortedReceipts = [...receipts].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  )
  const pendingReceiptsCount = receipts.filter((r) => r.status === 'pending').length

  return (
    <div className="px-4 pt-2 pb-4">
      {/* تب اصلی مدیر: قبض‌ها / رسیدها */}
      {isManager && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1.5 mb-4">
          <button
            onClick={() => setTopTab('bills')}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              topTab === 'bills'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            قبض‌ها
          </button>
          <button
            onClick={() => setTopTab('receipts')}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              topTab === 'receipts'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            رسیدها
            {pendingReceiptsCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {toFaDigits(pendingReceiptsCount)}
              </span>
            )}
          </button>
        </div>
      )}

      {topTab === 'receipts' && isManager ? (
        <>
          {/* تب رسیدها (مدیر) */}
          <div className="space-y-4">
            {sortedReceipts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <ReceiptText className="w-7 h-7 text-blue-300" />
                </div>
                <p className="text-sm text-slate-400">رسیدی ثبت نشده است</p>
              </div>
            )}
            {sortedReceipts.map((r, i) => {
              const badge = RECEIPT_BADGE[r.status] || RECEIPT_BADGE.pending
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl shadow-sm shadow-blue-100/70 border p-4 transition-all card-enter card-enter-${(i % 4) + 1} ${
                    r.status === 'pending' ? 'border-amber-100' : 'border-blue-100/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setViewImage(r)}
                      aria-label="مشاهده تصویر رسید"
                      className="w-14 h-14 min-w-[56px] rounded-xl overflow-hidden border border-blue-100 bg-blue-50 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={r.image}
                        alt={`رسید پرداخت ${r.bill?.title || ''}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-blue-950 text-sm leading-6 truncate">
                          {r.bill?.title || 'قبض حذف‌شده'}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${badge.chip}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {r.uploadedBy && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                            <UserRound className="w-3 h-3" />
                            {r.uploadedBy.name}
                          </span>
                        )}
                        {r.uploadedBy && (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                            واحد {toFaDigits(r.uploadedBy.unitNumber)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-blue-950 mt-1.5">
                        {formatMoney(r.amount)}
                        <span className="text-[10px] font-normal text-slate-400 ms-1">تومان</span>
                      </p>
                    </div>
                  </div>

                  {r.note && (
                    <p className="text-xs text-slate-500 bg-blue-50/60 border border-blue-100/60 rounded-xl px-3 py-2 mt-3 flex items-start gap-1.5 leading-5">
                      <StickyNote className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      {r.note}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                      <span dir="ltr">{receiptDate(r.createdAt)}</span>
                    </span>
                    <button
                      onClick={() => setDeleteReceiptTarget(r)}
                      aria-label="حذف رسید"
                      className="w-11 h-11 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-[18px] h-[18px] text-red-500" />
                    </button>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onReviewReceipt(r.id, 'approved')}
                        className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        تأیید
                      </button>
                      <button
                        onClick={() => onReviewReceipt(r.id, 'rejected')}
                        className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        رد
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* نمایش کامل تصویر رسید */}
          <Dialog open={!!viewImage} onOpenChange={(v) => !v && setViewImage(null)}>
            <DialogContent className="max-w-sm rounded-3xl p-4 bg-white" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-center text-blue-950 text-base leading-6">
                  رسید پرداخت{viewImage?.bill?.title ? ` - ${viewImage.bill.title}` : ''}
                </DialogTitle>
                <DialogDescription className="sr-only">تصویر رسید پرداخت</DialogDescription>
              </DialogHeader>
              {viewImage && (
                <>
                  <img
                    src={viewImage.image}
                    alt="تصویر رسید پرداخت"
                    className="w-full max-h-[70vh] object-contain rounded-2xl bg-slate-50 border border-blue-100"
                  />
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {viewImage.uploadedBy && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 rounded-full px-2.5 py-1">
                        <UserRound className="w-3 h-3" />
                        {viewImage.uploadedBy.name} - واحد {toFaDigits(viewImage.uploadedBy.unitNumber)}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${(RECEIPT_BADGE[viewImage.status] || RECEIPT_BADGE.pending).chip}`}>
                      {(RECEIPT_BADGE[viewImage.status] || RECEIPT_BADGE.pending).label}
                    </span>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* تایید حذف رسید */}
          <AlertDialog open={!!deleteReceiptTarget} onOpenChange={(v) => !v && setDeleteReceiptTarget(null)}>
            <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-blue-950">حذف رسید؟</AlertDialogTitle>
                <AlertDialogDescription>
                  این رسید برای همیشه حذف می‌شود و قابل بازگشت نیست. آیا مطمئن هستید؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (deleteReceiptTarget) onDeleteReceipt(deleteReceiptTarget.id)
                    setDeleteReceiptTarget(null)
                  }}
                  className="rounded-xl bg-red-500 hover:bg-red-600"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          {/* کارت خلاصه */}
          {tab === 'pending' && pendingTotal > 0 && (
            <div className="bg-white rounded-2xl border border-blue-100/70 shadow-sm p-4 mb-4 flex items-center justify-between card-enter">
              <div>
                <p className="text-xs text-slate-400">
                  {isManager ? 'مجموع مطالبات معوق ساختمان' : 'مجموع بدهی واحد شما'}
                </p>
                <p className="text-xl font-extrabold text-blue-950 mt-1">
                  {formatMoney(pendingTotal)}
                  <span className="text-xs font-normal text-slate-400 ms-1">تومان</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center">
                <ReceiptText className="w-5 h-5 text-red-500" />
              </div>
            </div>
          )}

          {/* تب‌ها */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1.5 mb-4">
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                tab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              معوقه
            </button>
            <button
              onClick={() => setTab('paid')}
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                tab === 'paid'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              پرداخت شده
            </button>
          </div>

          {/* لیست قبض‌ها */}
          <div className="space-y-4">
            {filtered.length === 0 && (
              <EmptyState
                text={tab === 'pending' ? 'قبض معوقه‌ای وجود ندارد 🎉' : 'قبض پرداخت‌شده‌ای یافت نشد'}
              />
            )}
            {filtered.map((bill, i) => {
              const isPending = bill.status === 'pending'
              const billReceipt = !isManager && isPending ? latestReceiptOf(bill.id, receipts) : null
              const receiptChip = billReceipt
                ? RECEIPT_CHIP[billReceipt.status] || RECEIPT_CHIP.pending
                : null
              const ReceiptChipIcon = receiptChip?.icon
              return (
                <div
                  key={bill.id}
                  className={`bg-white rounded-2xl shadow-sm shadow-blue-100/70 border p-4 transition-all card-enter card-enter-${(i % 4) + 1} ${
                    isPending ? 'border-red-100' : 'border-blue-100/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-blue-950">
                        {bill.title}
                        {!bill.title.includes('واحد') && (
                          <span className="text-blue-600"> - واحد {toFaDigits(bill.unitNumber)}</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5">مبلغ</p>
                      <p className="font-extrabold text-blue-950 text-lg leading-7">
                        {formatMoney(bill.amount)}
                        <span className="text-xs font-normal text-slate-400 ms-1">تومان</span>
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 min-w-[48px] rounded-2xl flex items-center justify-center ${
                        isPending ? 'bg-red-50' : 'bg-blue-50'
                      }`}
                    >
                      {isPending ? (
                        <CalendarDays className="w-6 h-6 text-red-500" strokeWidth={1.8} />
                      ) : (
                        <Building2 className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
                      )}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 my-3" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {isPending ? (
                      receiptChip && ReceiptChipIcon ? (
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1.5 ${receiptChip.chip}`}>
                          <ReceiptChipIcon className="w-3.5 h-3.5" />
                          {receiptChip.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-full px-3 py-1.5">
                          <CircleAlert className="w-3.5 h-3.5" />
                          معوقه
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 rounded-full px-3 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        پرداخت شده
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="text-slate-400">سررسید</span>
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                      <span dir="ltr" className="font-bold text-blue-700">{toFaDigits(bill.dueDate)}</span>
                    </div>

                    {isPending ? (
                      isManager ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDeleteTarget(bill)}
                            aria-label="حذف قبض"
                            className="w-11 h-11 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                          <button
                            onClick={() => setPayTarget(bill)}
                            className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full px-3.5 py-2.5 transition-colors"
                          >
                            پرداخت حضوری
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayDialogBill(bill)}
                          className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full px-3.5 py-1.5 transition-colors"
                        >
                          پرداخت
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : isManager ? (
                      <button
                        onClick={() => setDeleteTarget(bill)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 rounded-full px-3 py-1.5 transition-colors"
                        aria-label="حذف قبض"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="w-14" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* دکمه ثبت قبض جدید (مدیر) */}
          {isManager && (
            <button
              onClick={onCreate}
              className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-500 transition-all active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" />
              ثبت قبض جدید
            </button>
          )}

          {/* تایید پرداخت حضوری (مدیر) */}
          <AlertDialog open={!!payTarget} onOpenChange={(v) => !v && setPayTarget(null)}>
            <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-blue-950">تأیید پرداخت قبض</AlertDialogTitle>
                <AlertDialogDescription>
                  مبلغ {payTarget && formatMoney(payTarget.amount)} تومان بابت «{payTarget?.title}» پرداخت خواهد شد. آیا مطمئن هستید؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (payTarget) onPay(payTarget)
                    setPayTarget(null)
                  }}
                  className="rounded-xl bg-gradient-to-l from-blue-500 to-blue-600"
                >
                  پرداخت و ثبت
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* تایید حذف قبض */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
            <AlertDialogContent className="max-w-sm rounded-3xl bg-white" dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-blue-950">حذف قبض</AlertDialogTitle>
                <AlertDialogDescription>
                  آیا از حذف «{deleteTarget?.title}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (deleteTarget) onDelete(deleteTarget)
                    setDeleteTarget(null)
                  }}
                  className="rounded-xl bg-red-500 hover:bg-red-600"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* دیالوگ پرداخت ساکن با بارگذاری رسید */}
      {!isManager && (
        <PaymentDialog
          open={!!payDialogBill}
          onOpenChange={(v) => !v && setPayDialogBill(null)}
          bill={payDialogBill}
          settings={settings}
          onSubmit={onSubmitReceipt}
        />
      )}
    </div>
  )
}

/** دیالوگ ثبت قبض جدید (مدیر) */
export function NewBillDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('شارژ ماه - واحد ')
  const [amount, setAmount] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [dueDate, setDueDate] = useState(todayJalali())
  const [saving, setSaving] = useState(false)

  const handleAmountChange = (v: string) => {
    const digits = faToEnDigits(v).replace(/[^\d]/g, '')
    setAmount(digits ? Number(digits).toLocaleString('en-US') : '')
  }

  const handleSubmit = async () => {
    const cleanAmount = Number(faToEnDigits(amount).replace(/[^\d]/g, ''))
    if (!title.trim() || !cleanAmount || !unitNumber.trim()) {
      toast({ title: 'خطا', description: 'عنوان، مبلغ و شماره واحد الزامی است', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: cleanAmount,
          unitNumber: faToEnDigits(unitNumber).trim(),
          dueDate: faToEnDigits(dueDate).trim() || todayJalali(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'موفق', description: 'قبض جدید با موفقیت ثبت شد' })
      setTitle('شارژ ماه - واحد ')
      setAmount('')
      setUnitNumber('')
      onOpenChange(false)
      onCreated()
    } catch {
      toast({ title: 'خطا', description: 'ثبت قبض انجام نشد', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <ReceiptText className="w-5 h-5 text-blue-600" />
            ثبت قبض جدید
          </DialogTitle>
          <DialogDescription className="text-xs">
            قبض برای واحد مورد نظر ثبت و در اپ نمایش داده می‌شود
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان قبض</label>
            <Input
              className="rounded-xl border-blue-100 bg-blue-50/50 h-11"
              placeholder="مثلاً: شارژ ماه آذر - واحد ۸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">مبلغ (تومان)</label>
              <Input
                inputMode="numeric"
                className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-center"
                placeholder="۱,۲۵۰,۰۰۰"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
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
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">تاریخ سررسید</label>
            <Input
              className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-center"
              placeholder="۱۴۰۳/۰۹/۱۵"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
          >
            {saving ? 'در حال ثبت...' : 'ثبت قبض'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
