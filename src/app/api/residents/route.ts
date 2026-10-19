import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword, toPublicUser } from '@/lib/auth'
import { normalizePhone, cleanText } from '@/lib/validation'

// فهرست همه کاربران (هر کاربر واردشده) — بدون password
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
    const q = searchParams.get('q')

    // همه کاربران (مدیران + ساکنین) برگردانده شوند تا مدیر بتواند سطح دسترسی را تغییر دهد
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { unitNumber: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}

    const residents = await db.user.findMany({
      where,
      orderBy: [{ unitNumber: 'asc' }],
      select: {
        id: true,
        name: true,
        username: true,
        unitNumber: true,
        floor: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })
    return NextResponse.json(residents)
  } catch (e) {
    console.error('residents GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت ساکنین' }, { status: 500 })
  }
}

// افزودن عضو با شماره موبایل (فقط مدیر)
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

    const name = cleanText(body.name, 60)
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'نام باید حداقل ۲ کاراکتر باشد' },
        { status: 400 }
      )
    }

    const phone = normalizePhone(String(body.phone ?? ''))
    if (!phone) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }

    const exists = await db.user.findUnique({ where: { phone } })
    if (exists) {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      )
    }

    // واحد اختیاری است — در صورت ثبت، کاربر فعال می‌شود
    let unitNumber: string | null = null
    if (body.unitNumber !== undefined && body.unitNumber !== null) {
      const un = cleanText(body.unitNumber, 10)
      if (!un) {
        return NextResponse.json(
          { error: 'شماره واحد نامعتبر است' },
          { status: 400 }
        )
      }
      unitNumber = un
    }

    let floor: number | null = null
    if (body.floor !== undefined && body.floor !== null) {
      const f = Number(body.floor)
      if (!Number.isInteger(f) || f < 0 || f > 200) {
        return NextResponse.json(
          { error: 'طبقه نامعتبر است' },
          { status: 400 }
        )
      }
      floor = f
    }

    const rawPassword =
      typeof body.password === 'string' && body.password ? body.password : '1234'

    const user = await db.user.create({
      data: {
        name,
        username: phone,
        phone,
        password: hashPassword(rawPassword),
        role: 'resident',
        unitNumber,
        floor,
        status: unitNumber ? 'active' : 'unassigned',
      },
    })

    return NextResponse.json(toPublicUser(user), { status: 201 })
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت‌نام کرده است' },
        { status: 409 }
      )
    }
    console.error('residents POST error', e)
    return NextResponse.json({ error: 'خطا در ثبت ساکن' }, { status: 500 })
  }
}
