import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken, hashPassword, toPublicUser } from '@/lib/auth'
import { normalizePhone, isValidPassword, cleanText } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

// ثبت‌نام با شماره موبایل — عمومی
export async function POST(req: NextRequest) {
  try {
    // محدودیت نرخ: ۱۰ ثبت‌نام در ساعت به ازای هر IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const rl = checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌های ثبت‌نام زیاد است؛ بعداً دوباره تلاش کنید' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    const name = cleanText(body.name, 60)
    const normalizedPhone = normalizePhone(String(body.phone ?? ''))

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'نام باید حداقل ۲ کاراکتر باشد' },
        { status: 400 }
      )
    }
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }
    if (!isValidPassword(body.password)) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const exists = await db.user.findUnique({
      where: { phone: normalizedPhone },
    })
    if (exists) {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        name,
        username: normalizedPhone,
        phone: normalizedPhone,
        password: hashPassword(String(body.password)),
        role: 'resident',
        status: 'unassigned', // منتظر تخصیص واحد توسط مدیر
        unitNumber: null,
      },
    })

    return NextResponse.json({
      user: toPublicUser(user),
      token: createToken(user.id),
    })
  } catch (e) {
    // نقض یکتایی (شماره یا نام کاربری تکراری)
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      )
    }
    console.error('register error', e)
    return NextResponse.json({ error: 'خطا در ثبت‌نام' }, { status: 500 })
  }
}
