import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

const receiptInclude = {
  uploadedBy: { select: { id: true, name: true, unitNumber: true } },
  bill: { select: { id: true, title: true, unitNumber: true, amount: true } },
} as const

// فهرست رسیدها — مدیر: همه، ساکن: فقط رسیدهای خودش
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const where =
      authUser.role === 'manager'
        ? {}
        : { uploadedByUserId: authUser.id }

    const receipts = await db.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: receiptInclude,
    })

    return NextResponse.json(receipts)
  } catch (e) {
    console.error('receipts GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت رسیدها' }, { status: 500 })
  }
}

// ثبت رسید پرداخت جدید برای یک قبض
export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { billId, amount, image, note } = body

    if (!billId || typeof billId !== 'string') {
      return NextResponse.json({ error: 'قبض یافت نشد' }, { status: 404 })
    }

    const bill = await db.bill.findUnique({ where: { id: billId } })
    if (!bill) {
      return NextResponse.json({ error: 'قبض یافت نشد' }, { status: 404 })
    }

    const amountNum = Number(amount)
    if (!Number.isInteger(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'مبلغ باید عددی صحیح و بزرگ‌تر از صفر باشد' },
        { status: 400 }
      )
    }

    if (
      typeof image !== 'string' ||
      !image.startsWith('data:image/') ||
      image.length >= 4000000
    ) {
      return NextResponse.json(
        { error: 'تصویر رسید نامعتبر است (حداکثر ۴ مگابایت)' },
        { status: 400 }
      )
    }

    if (note !== undefined && note !== null && String(note).length > 500) {
      return NextResponse.json(
        { error: 'یادداشت حداکثر ۵۰۰ کاراکتر است' },
        { status: 400 }
      )
    }

    const receipt = await db.receipt.create({
      data: {
        billId,
        amount: amountNum,
        image,
        note: note ? String(note) : null,
        status: 'pending',
        uploadedByUserId: authUser.id,
      },
      include: receiptInclude,
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (e) {
    console.error('receipts POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت رسید' }, { status: 500 })
  }
}
