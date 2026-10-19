import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { cleanText } from '@/lib/validation'

// فهرست قبض‌ها (هر کاربر واردشده)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const unit = searchParams.get('unit')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (unit) where.unitNumber = unit
    if (status) where.status = status

    const bills = await db.bill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(bills)
  } catch (e) {
    console.error('bills GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت قبض‌ها' }, { status: 500 })
  }
}

// ثبت قبض جدید (فقط مدیر)
export async function POST(req: NextRequest) {
  try {
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
    const { amount, unitNumber, dueDate } = body
    const title = cleanText(body.title, 100)

    if (!title || !amount || !unitNumber || !dueDate) {
      return NextResponse.json(
        { error: 'همه فیلدها الزامی است' },
        { status: 400 }
      )
    }

    const parsedAmount = Number(String(amount).replace(/[,\s]/g, ''))
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'مبلغ نامعتبر است' }, { status: 400 })
    }

    const bill = await db.bill.create({
      data: {
        title,
        amount: parsedAmount,
        unitNumber: String(unitNumber),
        dueDate: String(dueDate),
        status: 'pending',
      },
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (e) {
    console.error('bills POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت قبض' }, { status: 500 })
  }
}
