import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, toPublicUser } from '@/lib/auth'
import { normalizePhone, cleanText } from '@/lib/validation'

// ویرایش پروفایل کاربر جاری (نام، شماره موبایل، طبقه)
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    const data: {
      name?: string
      phone?: string
      username?: string
      floor?: number | null
    } = {}

    if (body.name !== undefined) {
      const name = cleanText(body.name, 60)
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'نام باید حداقل ۲ کاراکتر باشد' },
          { status: 400 }
        )
      }
      data.name = name
    }

    if (body.phone !== undefined) {
      const phone = normalizePhone(String(body.phone ?? ''))
      if (!phone) {
        return NextResponse.json(
          { error: 'شماره موبایل معتبر نیست' },
          { status: 400 }
        )
      }
      if (phone !== authUser.phone) {
        const exists = await db.user.findUnique({ where: { phone } })
        if (exists) {
          return NextResponse.json(
            { error: 'این شماره قبلاً ثبت‌نام کرده است' },
            { status: 409 }
          )
        }
        // همگام نگه‌داشتن username با شماره موبایل (username دیگر برای ورود استفاده نمی‌شود)
        data.username = phone
      }
      data.phone = phone
    }

    if (body.floor !== undefined) {
      if (body.floor === null) {
        data.floor = null
      } else {
        const f = Number(body.floor)
        if (!Number.isInteger(f) || f < 0 || f > 200) {
          return NextResponse.json(
            { error: 'طبقه نامعتبر است' },
            { status: 400 }
          )
        }
        data.floor = f
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'داده‌ای برای بروزرسانی ارسال نشده است' },
        { status: 400 }
      )
    }

    const updated = await db.user.update({
      where: { id: authUser.id },
      data,
    })

    return NextResponse.json(toPublicUser(updated))
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      )
    }
    console.error('profile PATCH error', e)
    return NextResponse.json({ error: 'خطا در بروزرسانی پروفایل' }, { status: 500 })
  }
}
