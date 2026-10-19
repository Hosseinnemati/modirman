import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// حذف یادآور — مالک یادآور یا مدیر
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

    const reminder = await db.reminder.findUnique({ where: { id } })
    if (!reminder) {
      return NextResponse.json({ error: 'یادآور یافت نشد' }, { status: 404 })
    }

    if (reminder.userId !== authUser.id && authUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'شما اجازه این عملیات را ندارید' },
        { status: 403 }
      )
    }

    await db.reminder.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('reminder DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف یادآور' }, { status: 500 })
  }
}
