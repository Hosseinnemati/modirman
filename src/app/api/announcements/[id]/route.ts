import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// حذف اعلان (فقط مدیر)
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

    const announcement = await db.announcement.findUnique({ where: { id } })
    if (!announcement) {
      return NextResponse.json({ error: 'اعلان یافت نشد' }, { status: 404 })
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('announcement DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف اعلان' }, { status: 500 })
  }
}
