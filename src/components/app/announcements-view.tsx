'use client'

import { useState } from 'react'
import {
  Calendar, Clock, ChevronLeft, Filter, Users, Droplet, Sparkles,
  ArrowUpDown, ShieldCheck, Bell, Plus, Megaphone,
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
import type { Announcement, AppUser } from '@/types/app'

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  meeting: { label: 'جلسه', icon: Users },
  water: { label: 'آب و تأسیسات', icon: Droplet },
  cleaning: { label: 'نظافت', icon: Sparkles },
  elevator: { label: 'آسانسور', icon: ArrowUpDown },
  security: { label: 'امنیتی', icon: ShieldCheck },
  general: { label: 'عمومی', icon: Bell },
}

export function AnnouncementsView({
  user,
  announcements,
  onCreate,
}: {
  user: AppUser
  announcements: Announcement[]
  onCreate: () => void
}) {
  const isManager = user.role === 'manager'
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Announcement | null>(null)

  const filtered =
    filter === 'all' ? announcements : announcements.filter((a) => a.type === filter)

  return (
    <div className="px-4 pt-2 pb-4">
      {/* ردیف فیلتر و دکمه اعلان جدید */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onCreate}
          disabled={!isManager}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${
            isManager ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 cursor-not-allowed'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          اعلان جدید
          {isManager && <Plus className="w-4 h-4" />}
        </button>

        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-200 transition-colors">
            <Filter className="w-4 h-4 text-blue-500" />
            {filter === 'all' ? 'همه اعلان‌ها' : TYPE_META[filter]?.label}
            <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => setFilter('all')} className="cursor-pointer">
              همه اعلان‌ها
            </DropdownMenuItem>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setFilter(key)}
                className="cursor-pointer"
              >
                <meta.icon className="w-4 h-4 text-blue-500 me-1" />
                {meta.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* لیست اعلان‌ها */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <EmptyState text="اعلانی در این دسته یافت نشد" />
        )}
        {filtered.map((a, i) => {
          const meta = TYPE_META[a.type] || TYPE_META.general
          const Icon = meta.icon
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`w-full text-start bg-white rounded-2xl shadow-sm shadow-blue-100/70 border border-blue-100/60 border-s-4 border-s-blue-600 p-4 hover:shadow-md transition-all card-enter card-enter-${(i % 4) + 1}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-blue-950 leading-6">{a.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-6 mt-1.5 line-clamp-2">
                    {a.content}
                  </p>
                </div>
                <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {a.date}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {a.time}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-3 py-1.5">
                  مشاهده جزئیات
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* دیالوگ جزئیات اعلان */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  {(() => {
                    const Icon = (TYPE_META[selected.type] || TYPE_META.general).icon
                    return <Icon className="w-7 h-7 text-blue-600" strokeWidth={1.8} />
                  })()}
                </div>
                <DialogTitle className="text-center text-blue-950 leading-7">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-center text-xs">
                  <span className="inline-flex items-center gap-1.5 me-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {selected.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {selected.time}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-slate-600 leading-7 text-center bg-blue-50/60 rounded-2xl p-4 border border-blue-100/60">
                {selected.content}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** دیالوگ ثبت اعلان جدید (مدیر) */
export function NewAnnouncementDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('general')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'خطا', description: 'عنوان و متن اعلان الزامی است', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'موفق', description: 'اعلان جدید با موفقیت ثبت شد' })
      setTitle('')
      setContent('')
      setType('general')
      onOpenChange(false)
      onCreated()
    } catch {
      toast({ title: 'خطا', description: 'ثبت اعلان انجام نشد', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-950">
            <Megaphone className="w-5 h-5 text-blue-600" />
            ثبت اعلان جدید
          </DialogTitle>
          <DialogDescription className="text-xs">
            اعلان شما برای همه ساکنین ساختمان ارسال می‌شود
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان اعلان</label>
            <Input
              className="rounded-xl border-blue-100 bg-blue-50/50 h-11"
              placeholder="مثلاً: قطعی آب - واحد ۱۸ مهر"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">متن اعلان</label>
            <Textarea
              className="rounded-xl border-blue-100 bg-blue-50/50 min-h-24"
              placeholder="متن کامل اعلان را بنویسید..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">دسته‌بندی</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    type === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <meta.icon className="w-3.5 h-3.5" />
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold bg-gradient-to-l from-blue-500 to-blue-600"
          >
            {saving ? 'در حال ثبت...' : 'ثبت اعلان'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
        <Bell className="w-7 h-7 text-blue-300" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
