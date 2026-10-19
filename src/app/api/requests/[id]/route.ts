import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// تغییر وضعیت درخواست (فقط مدیر)
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
    const { status } = body

    if (!status || !['in_progress', 'done'].includes(String(status))) {
      return NextResponse.json({ error: 'وضعیت نامعتبر است' }, { status: 400 })
    }

    const existing = await db.serviceRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
    }

    const updated = await db.serviceRequest.update({
      where: { id },
      data: { status: String(status) },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('request PATCH error', e)
    return NextResponse.json({ error: 'خطا در بروزرسانی درخواست' }, { status: 500 })
  }
}

// حذف درخواست (هر کاربر واردشده)
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

    await db.serviceRequest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('request DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف درخواست' }, { status: 500 })
  }
}
