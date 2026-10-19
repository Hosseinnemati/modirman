import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, toPublicUser } from '@/lib/auth'
import { cleanText } from '@/lib/validation'

const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  unitNumber: true,
  floor: true,
  phone: true,
  status: true,
  createdAt: true,
} as const

// ویرایش کاربر توسط مدیر: تغییر سطح دسترسی و/یا تخصیص واحد/طبقه/وضعیت
export async function PATCH(
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

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    const data: {
      role?: string
      unitNumber?: string | null
      floor?: number | null
      status?: string
    } = {}

    // تغییر سطح دسترسی
    if (body.role !== undefined) {
      if (body.role !== 'manager' && body.role !== 'resident') {
        return NextResponse.json(
          { error: 'سطح دسترسی نامعتبر است' },
          { status: 400 }
        )
      }
      if (id === authUser.id) {
        return NextResponse.json(
          { error: 'نمی‌توانید سطح دسترسی خودتان را تغییر دهید' },
          { status: 400 }
        )
      }
      data.role = body.role
    }

    // تخصیص/خالی‌کردن شماره واحد
    if (body.unitNumber !== undefined) {
      if (body.unitNumber === null) {
        data.unitNumber = null
      } else {
        const un = cleanText(body.unitNumber, 10)
        if (!un) {
          return NextResponse.json(
            { error: 'شماره واحد نامعتبر است' },
            { status: 400 }
          )
        }
        data.unitNumber = un
      }
    }

    // طبقه
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

    // وضعیت عضویت در ساختمان
    if (body.status !== undefined) {
      if (
        body.status !== 'unassigned' &&
        body.status !== 'active' &&
        body.status !== 'inactive'
      ) {
        return NextResponse.json(
          { error: 'وضعیت نامعتبر است' },
          { status: 400 }
        )
      }
      data.status = body.status
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'داده‌ای برای بروزرسانی ارسال نشده است' },
        { status: 400 }
      )
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    // ارتقای عضو به «مدیر» = انتقال مدیریت ساختمان:
    // در یک تراکنش، کاربر جدید مدیر می‌شود و مدیر فعلی (و هر مدیر دیگر) به ساکن تنزل می‌یابد
    if (data.role === 'manager') {
      const [, updated] = await db.$transaction([
        db.user.updateMany({
          where: { role: 'manager', id: { not: id } },
          data: { role: 'resident' },
        }),
        db.user.update({ where: { id }, data, select: publicUserSelect }),
      ])
      return NextResponse.json(updated)
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('resident PATCH error', e)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی کاربر' },
      { status: 500 }
    )
  }
}

// حذف کاربر (فقط مدیر)
export async function DELETE(
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

    if (id === authUser.id) {
      return NextResponse.json(
        { error: 'نمی‌توانید حساب خودتان را حذف کنید' },
        { status: 400 }
      )
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    await db.receipt.deleteMany({ where: { uploadedByUserId: id } })
    await db.user.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('resident DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف کاربر' }, { status: 500 })
  }
}
