import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// پرداخت حضوری قبض توسط مدیر
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
    const { action } = body

    const bill = await db.bill.findUnique({ where: { id } })
    if (!bill) {
      return NextResponse.json({ error: 'قبض یافت نشد' }, { status: 404 })
    }

    if (action === 'pay') {
      const updated = await db.bill.update({
        where: { id },
        data: { status: 'paid', paidAt: new Date() },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
  } catch (e) {
    console.error('bill PATCH error', e)
    return NextResponse.json({ error: 'خطا در پردازش قبض' }, { status: 500 })
  }
}

// حذف قبض (فقط مدیر)
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

    await db.bill.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('bill DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف قبض' }, { status: 500 })
  }
}
