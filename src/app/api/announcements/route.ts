import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { cleanText } from '@/lib/validation'
import { todayJalaliLong, nowTime } from '@/lib/persian'

// فهرست اعلان‌ها (هر کاربر واردشده)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  } catch (e) {
    console.error('announcements GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت اعلان‌ها' }, { status: 500 })
  }
}

// ثبت اعلان جدید (فقط مدیر)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }
    if (authUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'شما اجازه این عملیات را ندارید' },
        { status: 403 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const title = cleanText(body.title, 100)
    const content = cleanText(body.content, 2000)

    if (!title || !content) {
      return NextResponse.json(
        { error: 'عنوان و متن اعلان الزامی است' },
        { status: 400 }
      )
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: typeof body.type === 'string' && body.type ? body.type : 'general',
        date: todayJalaliLong(),
        time: nowTime(),
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (e) {
    console.error('announcements POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت اعلان' }, { status: 500 })
  }
}
