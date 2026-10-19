import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createToken,
  verifyPassword,
  hashPassword,
  toPublicUser,
} from '@/lib/auth'
import { normalizePhone } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

// ورود با شماره موبایل — عمومی
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    const normalizedPhone = normalizePhone(String(body.phone ?? ''))
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }
    if (typeof body.password !== 'string' || !body.password) {
      return NextResponse.json(
        { error: 'رمز عبور الزامی است' },
        { status: 400 }
      )
    }

    // محدودیت نرخ: ۵ تلاش در ۱۵ دقیقه به ازای هر شماره
    const rlKey = `login:${normalizedPhone}`
    const rl = checkRateLimit(rlKey, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تلاش‌های ناموفق زیاد است؛ ۱۵ دقیقه بعد دوباره امتحان کنید' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    const user = await db.user.findUnique({
      where: { phone: normalizedPhone },
    })

    // پیام یکسان برای شماره ناشناس و رمز اشتباه
    if (!user || !verifyPassword(body.password, user.password)) {
      return NextResponse.json(
        { error: 'شماره موبایل یا رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { error: 'حساب کاربری شما غیرفعال است. با مدیر ساختمان تماس بگیرید.' },
        { status: 403 }
      )
    }

    // ارتقای حساب‌های قدیمی با رمز متنی ساده به هش scrypt
    if (!user.password.startsWith('scrypt:')) {
      await db.user.update({
        where: { id: user.id },
        data: { password: hashPassword(body.password) },
      })
    }

    resetRateLimit(rlKey)

    return NextResponse.json({
      user: toPublicUser(user),
      token: createToken(user.id),
    })
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'خطا در ورود به سیستم' }, { status: 500 })
  }
}
