import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { cleanText } from '@/lib/validation'

// فهرست درخواست‌ها (هر کاربر واردشده)
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

    const requests = await db.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (e) {
    console.error('requests GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت درخواست‌ها' }, { status: 500 })
  }
}

// ثبت درخواست جدید (هر کاربر واردشده)
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
    const title = cleanText(body.title, 100)
    const description = cleanText(body.description, 1000)
    const { unitNumber, category, priority } = body

    if (!title || !unitNumber) {
      return NextResponse.json(
        { error: 'عنوان و شماره واحد الزامی است' },
        { status: 400 }
      )
    }

    const request = await db.serviceRequest.create({
      data: {
        title,
        description: description || null,
        unitNumber: String(unitNumber),
        category: typeof category === 'string' && category ? category : 'repair',
        priority:
          typeof priority === 'string' && priority ? priority : 'medium',
        status: 'in_progress',
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch (e) {
    console.error('requests POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 })
  }
}
