import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, toPublicUser } from '@/lib/auth'
import { normalizePhone } from '@/lib/validation'

// جستجوی کاربر با شماره موبایل (فقط مدیر) — برای افزودن عضو به ساختمان
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'فقط مدیر دسترسی دارد' },
        { status: 401 }
      )
    }
    if (authUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'فقط مدیر دسترسی دارد' },
        { status: 403 }
      )
    }

    const raw = new URL(req.url).searchParams.get('phone') ?? ''
    const phone = normalizePhone(raw)
    if (!phone) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({ found: true, user: toPublicUser(user) })
  } catch (e) {
    console.error('members search error', e)
    return NextResponse.json(
      { error: 'خطا در جستجوی کاربر' },
      { status: 500 }
    )
  }
}
