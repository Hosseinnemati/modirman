import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, verifyPassword, hashPassword } from '@/lib/auth'
import { isValidPassword } from '@/lib/validation'

// تغییر رمز عبور کاربر جاری
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

    const { currentPassword, newPassword } = body

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      )
    }

    if (
      typeof currentPassword !== 'string' ||
      !currentPassword ||
      !verifyPassword(currentPassword, authUser.password)
    ) {
      return NextResponse.json(
        { error: 'رمز فعلی اشتباه است' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: authUser.id },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('profile password error', e)
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور' },
      { status: 500 }
    )
  }
}
