import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

const receiptInclude = {
  uploadedBy: { select: { id: true, name: true, unitNumber: true } },
  bill: { select: { id: true, title: true, unitNumber: true, amount: true } },
} as const

// تأیید یا رد رسید (فقط مدیر)
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

    const receipt = await db.receipt.findUnique({ where: { id } })
    if (!receipt) {
      return NextResponse.json({ error: 'رسید یافت نشد' }, { status: 404 })
    }

    const body = await req.json()
    const { status } = body

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'وضعیت رسید نامعتبر است' },
        { status: 400 }
      )
    }

    const updated = await db.$transaction(async (tx) => {
      if (status === 'approved') {
        await tx.bill.update({
          where: { id: receipt.billId },
          data: { status: 'paid', paidAt: new Date() },
        })
      }
      return tx.receipt.update({
        where: { id },
        data: { status },
        include: receiptInclude,
      })
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('receipt PATCH error', e)
    return NextResponse.json({ error: 'خطا در پردازش رسید' }, { status: 500 })
  }
}

// حذف رسید (مدیر یا آپلودکننده رسید)
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

    const receipt = await db.receipt.findUnique({ where: { id } })
    if (!receipt) {
      return NextResponse.json({ error: 'رسید یافت نشد' }, { status: 404 })
    }

    if (authUser.role !== 'manager' && receipt.uploadedByUserId !== authUser.id) {
      return NextResponse.json(
        { error: 'شما اجازه این عملیات را ندارید' },
        { status: 403 }
      )
    }

    await db.receipt.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('receipt DELETE error', e)
    return NextResponse.json({ error: 'خطا در حذف رسید' }, { status: 500 })
  }
}
