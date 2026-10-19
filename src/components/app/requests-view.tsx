'use client'

import { useState } from 'react'
import {
  Wrench, Clock, CheckCircle2, Flag, CalendarDays, ChevronLeft, Plus,
  SlidersHorizontal, ListFilter, Plug, Droplet, Zap, Sparkles, Hammer,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { toFaDigits } from '@/lib/persian'
import type { AppUser, ServiceRequest } from '@/types/app'
import { EmptyState } from './announcements-view'

const PRIORITY_META: Record<string, { label: string; dot: string; chip: string; flag: string }> = {
  high: {
    label: 'اولویت بالا',
    dot: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700',
    flag: 'text-blue-600',
  },
  medium: {
    label: 'اولویت متوسط',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700',
    flag: 'text-amber-600',
  },
  low: {
    label: 'اولویت پایین',
    dot: 'bg-green-500',
    chip: 'bg-green-50 text-green-700',
    flag: 'text-green-600',
  },
}

const STATUS_META: Record<string, { label: string; chip: string }> = {
  in_progress: { label: 'در حال بررسی', chip: 'bg-blue-50 text-blue-700' },
  done: { label: 'انجام شده', chip: 'bg-green-50 text-green-700' },
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  repair: { label: 'تعمیرات', icon: Hammer },
  plumbing: { label: 'لوله‌کشی', icon: Droplet },
  electrical: { label: 'برق', icon: Zap },
  cleaning: { label: 'نظافت', icon: Sparkles },
  other: { label: 'سایر', icon: Plug },
}

export function RequestsView({
  user,
  requests,
  onCreate,
  onToggleStatus,
}: {
  user: AppUser
  requests: ServiceRequest[]
  onCreate: () => void
  onToggleStatus: (r: ServiceRequest) => void
}) {
  const isManager = user.role === 'manager'
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'done'>('all')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [selected, setSelected] = useState<ServiceRequest | null>(null)

  let filtered = [...requests]
  if (statusFilter !== 'all') filtered = filtered.filter((r) => r.status === statusFilter)
  if (priorityOnly) filtered = filtered.filter((r) => r.priority === 'high')

  return (
    <div className="px-4 pt-2 pb-4">
      {/* فیلتر وضعیت */}
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-bold text-blue-950 mb-3">
          {statusFilter === 'all'
            ? 'همه درخواست‌ها'
            : statusFilter === 'in_progress'
              ? 'درخواست‌های در حال بررسی'
              : 'درخواست‌های انجام شده'}
          <ChevronLeft className="w-4 h-4 text-blue-500 -rotate-90" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setStatusFilter('all')} className="cursor-pointer">
            همه درخواست‌ها
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('in_progress')} className="cursor-pointer">
            <Clock className="w-4 h-4 text-blue-500 me-1" />
            در حال بررسی
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('done')} className="cursor-pointer">
            <CheckCircle2 className="w-4 h-4 text-green-500 me-1" />
            انجام شده
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* چیپ‌های فیلتر سریع */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 mb-4">
        <FilterChip
          active={statusFilter === 'all' && !priorityOnly}
          onClick={() => { setStatusFilter('all'); setPriorityOnly(false) }}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          label="همه"
        />
        <FilterChip
          active={statusFilter === 'in_progress' && !priorityOnly}
          onClick={() => { setStatusFilter('in_progress'); setPriorityOnly(false) }}
          icon={<Clock className="w-3.5 h-3.5" />}
          label="در حال بررسی"
        />
        <FilterChip
          active={statusFilter === 'done' && !priorityOnly}
          onClick={() => { setStatusFilter('done'); setPriorityOnly(false) }}
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="انجام شده"
        />
        <FilterChip
          active={priorityOnly}
          onClick={() => setPriorityOnly(!priorityOnly)}
          icon={<Flag className="w-3.5 h-3.5" />}
          label="اولویت بالا"
        />
      </div>

      {/* لیست درخواست‌ها */}
      <div className="space-y-4">
        {filtered.length === 0 && <EmptyState text="درخواستی یافت نشد" />}
        {filtered.map((r, i) => {
          const priority = PRIORITY_META[r.priority] || PRIORITY_META.medium
          const status = STATUS_META[r.status] || STATUS_META.in_progress
          const category = CATEGORY_META[r.category] || CATEGORY_META.repair
          const date = toFaDigits(
            new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            }).format(new Date(r.createdAt)).replace(' AP', '')
          )
          return (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-start bg-white rounded-2xl shadow-sm shadow-blue-100/70 border border-blue-100/60 p-4 hover:shadow-md transition-all card-enter card-enter-${(i % 4) + 1}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-blue-950 leading-6">
                    {r.title}
                    {!r.title.includes('واحد') && (
                      <span className="text-slate-400 font-medium text-xs"> - واحد {toFaDigits(r.unitNumber)}</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${status.chip}`}>
                      {r.status === 'done'
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />}
                      {status.label}
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 ${priority.chip}`}>
                      <Flag className="w-3 h-3" />
                      {priority.label.replace('اولویت ', '')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-blue-50 flex items-center justify-center">
                  <category.icon className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  <span dir="ltr">{date}</span>
                </span>
                {isManager && r.status === 'in_progress' ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStatus(r)
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-full px-3 py-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    انجام شد
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                    مشاهده جزئیات
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* دکمه ثبت درخواست جدید */}
      <button
        onClick={onCreate}
        className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-500 transition-all active:scale-[0.99]"
      >
        <Plus className="w-5 h-5" />
        ثبت درخواست جدید
      </button>

      {/* دیالوگ جزئیات درخواست */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Wrench className="w-7 h-7 text-blue-600" strokeWidth={1.8} />
                </div>
                <DialogTitle className="text-center text-blue-950 leading-7">
                  {selected.title}
                  <span className="block text-sm font-medium text-slate-400 mt-1">
                    واحد {toFaDigits(selected.unitNumber)}
                  </span>
                </DialogTitle>
                <DialogDescription className="sr-only">جزئیات درخواست</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {selected.description && (
                  <p className="text-sm text-slate-600 leading-7 bg-blue-50/60 rounded-2xl p-4 border border-blue-100/60">
                    {selected.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 ${STATUS_META[selected.status].chip}`}>
                    {STATUS_META[selected.status].label}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 ${PRIORITY_META[selected.priority].chip}`}>
                    <Flag className="w-3.5 h-3.5" />
                    {PRIORITY_META[selected.priority].label}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterChip({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold border transition-all ${
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
          : 'bg-blue-50/60 text-blue-900 border-blue-100 hover:border-blue-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/** دیالوگ ثبت درخواست جدید */
export function NewRequestDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: AppUser
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('repair')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [unitNumber, setUnitNumber] = useState(user.unitNumber || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !unitNumber.trim()) {
      toast({ title: 'خطا', description: 'عنوان درخواست و شماره واحد الزامی است', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          unitNumber: unitNumber.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'موفق', description: 'درخواست شما با موفقیت ثبت شد' })
      setTitle('')
      setDescription('')
      setPriority('medium')
      onOpenChange(false)
      onCreated()
    } catch {
      toast({ title: 'خطا', description: 'ثبت درخواست انجام نشد', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <Wrench className="w-5 h-5 text-blue-600" />
            ثبت درخواست جدید
          </DialogTitle>
          <DialogDescription className="text-xs">
            درخواست شما برای مدیر ساختمان ارسال می‌شود
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان درخواست</label>
            <Input
              className="rounded-xl border-blue-100 bg-blue-50/50 h-11"
              placeholder="مثلاً: نشتی لوله آشپزخانه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">توضیحات</label>
            <Textarea
              className="rounded-xl border-blue-100 bg-blue-50/50 min-h-20"
              placeholder="شرح مشکل را بنویسید..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره واحد</label>
              <Input
                inputMode="numeric"
                disabled={!!user.unitNumber}
                className="rounded-xl border-blue-100 bg-blue-50/50 h-11 text-center disabled:opacity-70"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">دسته‌بندی</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium border transition-colors ${
                      category === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <meta.icon className="w-3 h-3" />
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">اولویت</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold border transition-colors ${
                    priority === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {PRIORITY_META[p].label.replace('اولویت ', '')}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
          >
            {saving ? 'در حال ثبت...' : 'ثبت درخواست'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
