import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * بازنشانی رمز عبور عضو توسط مدیر ساختمان
 * (جایگزین «فراموشی رمز» با پیامک در نسخه‌ای که سرویس پیامک متصل شود)
 * خروجی: رمز موقت ۶ رقمی که فقط همین یک بار نمایش داده می‌شود
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // جلوگیری از سوءاستفاده: حداکثر ۱۰ بار در ۱۰ دقیقه برای هر مدیر
    const rl = checkRateLimit(`resetpw:${authUser.id}`, 10, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `تعداد درخواست‌ها زیاد است؛ ${rl.retryAfterSec} ثانیه بعد دوباره امتحان کنید` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      )
    }

    if (id === authUser.id) {
      return NextResponse.json(
        { error: 'برای تغییر رمز خودتان از بخش پروفایل استفاده کنید' },
        { status: 400 }
      )
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }
    if (target.role === 'manager') {
      return NextResponse.json(
        { error: 'رمز مدیر ساختمان قابل بازنشانی نیست' },
        { status: 400 }
      )
    }

    // رمز موقت ۶ رقمی
    const tempPassword = String(Math.floor(100000 + Math.random() * 900000))
    const hashed = await hashPassword(tempPassword)

    await db.user.update({ where: { id }, data: { password: hashed } })

    return NextResponse.json({ tempPassword })
  } catch (e) {
    console.error('reset-password error', e)
    return NextResponse.json(
      { error: 'خطا در بازنشانی رمز عبور' },
      { status: 500 }
    )
  }
}
