import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { cleanText } from '@/lib/validation'

const reminderInclude = {
  user: { select: { name: true } },
} as const

// فهرست یادآورها: یادآورهای ساختمانی + یادآورهای شخصی خود کاربر
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const reminders = await db.reminder.findMany({
      where: {
        OR: [{ type: 'building' }, { userId: authUser.id }],
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: reminderInclude,
    })

    return NextResponse.json(reminders)
  } catch (e) {
    console.error('reminders GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت یادآورها' }, { status: 500 })
  }
}

// ثبت یادآور جدید — نوع «ساختمانی» فقط توسط مدیر
export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    const title = cleanText(body.title, 100)
    if (!title) {
      return NextResponse.json(
        { error: 'عنوان یادآور الزامی است' },
        { status: 400 }
      )
    }

    const description = cleanText(body.description, 300) || null

    const date = typeof body.date === 'string' ? body.date.trim() : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'تاریخ نامعتبر است' },
        { status: 400 }
      )
    }
    const month = Number(date.slice(5, 7))
    const day = Number(date.slice(8, 10))
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return NextResponse.json(
        { error: 'تاریخ نامعتبر است' },
        { status: 400 }
      )
    }

    let time: string | null = null
    if (body.time !== undefined && body.time !== null && body.time !== '') {
      const t = String(body.time).trim()
      if (!/^\d{2}:\d{2}$/.test(t)) {
        return NextResponse.json(
          { error: 'ساعت نامعتبر است' },
          { status: 400 }
        )
      }
      const h = Number(t.slice(0, 2))
      const m = Number(t.slice(3, 5))
      if (h > 23 || m > 59) {
        return NextResponse.json(
          { error: 'ساعت نامعتبر است' },
          { status: 400 }
        )
      }
      time = t
    }

    const type = body.type === undefined || body.type === null ? 'personal' : body.type
    if (type !== 'personal' && type !== 'building') {
      return NextResponse.json(
        { error: 'نوع یادآور نامعتبر است' },
        { status: 400 }
      )
    }
    if (type === 'building' && authUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'شما اجازه این عملیات را ندارید' },
        { status: 403 }
      )
    }

    const reminder = await db.reminder.create({
      data: {
        userId: authUser.id,
        title,
        description,
        date,
        time,
        type,
      },
      include: reminderInclude,
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (e) {
    console.error('reminders POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت یادآور' }, { status: 500 })
  }
}
