import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// دریافت تنظیمات ساختمان (هر کاربر واردشده)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری خود شوید' },
        { status: 401 }
      )
    }

    let building = await db.building.findFirst()
    if (!building) {
      building = await db.building.create({
        data: { name: 'ساختمان من', address: '', units: 20 },
      })
    }
    return NextResponse.json(building)
  } catch (e) {
    console.error('settings GET error', e)
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات ساختمان' },
      { status: 500 }
    )
  }
}

// ویرایش تنظیمات ساختمان (فقط مدیر)
export async function PUT(req: NextRequest) {
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

    const body = await req.json()
    const { name, address, units, cardNumber, cardHolder, sheba } = body

    const data: {
      name?: string
      address?: string
      units?: number
      cardNumber?: string
      cardHolder?: string
      sheba?: string
    } = {}

    // نام ساختمان
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'نام ساختمان الزامی است' },
          { status: 400 }
        )
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'نام ساختمان حداکثر ۱۰۰ کاراکتر است' },
          { status: 400 }
        )
      }
      data.name = name.trim()
    }

    // آدرس
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return NextResponse.json(
          { error: 'آدرس نامعتبر است' },
          { status: 400 }
        )
      }
      data.address = address.trim()
    }

    // تعداد واحدها
    if (units !== undefined) {
      const unitsNum = Number(units)
      if (!Number.isInteger(unitsNum) || unitsNum <= 0) {
        return NextResponse.json(
          { error: 'تعداد واحدها باید عددی صحیح و بزرگ‌تر از صفر باشد' },
          { status: 400 }
        )
      }
      data.units = unitsNum
    }

    // شماره کارت بانکی
    if (cardNumber !== undefined) {
      if (typeof cardNumber !== 'string') {
        return NextResponse.json(
          { error: 'شماره کارت نامعتبر است' },
          { status: 400 }
        )
      }
      const digits = cardNumber.replace(/\D/g, '')
      if (digits.length > 0 && (digits.length < 12 || digits.length > 19)) {
        return NextResponse.json(
          { error: 'شماره کارت باید بین ۱۲ تا ۱۹ رقم باشد' },
          { status: 400 }
        )
      }
      data.cardNumber = digits
    }

    // نام صاحب کارت
    if (cardHolder !== undefined) {
      if (typeof cardHolder !== 'string') {
        return NextResponse.json(
          { error: 'نام صاحب کارت نامعتبر است' },
          { status: 400 }
        )
      }
      if (cardHolder.trim().length > 100) {
        return NextResponse.json(
          { error: 'نام صاحب کارت حداکثر ۱۰۰ کاراکتر است' },
          { status: 400 }
        )
      }
      data.cardHolder = cardHolder.trim()
    }

    // شماره شبا
    if (sheba !== undefined) {
      if (typeof sheba !== 'string') {
        return NextResponse.json(
          { error: 'شماره شبا نامعتبر است' },
          { status: 400 }
        )
      }
      const normalizedSheba = sheba.replace(/\s+/g, '').toUpperCase()
      if (normalizedSheba) {
        if (
          !normalizedSheba.startsWith('IR') ||
          normalizedSheba.length < 24 ||
          normalizedSheba.length > 26
        ) {
          return NextResponse.json(
            { error: 'شماره شبا باید با IR شروع شود و ۲۴ تا ۲۶ کاراکتر باشد' },
            { status: 400 }
          )
        }
      }
      data.sheba = normalizedSheba
    }

    const current = await db.building.findFirst()
    let building
    if (!current) {
      building = await db.building.create({
        data: {
          name: 'ساختمان من',
          address: '',
          units: 20,
          ...data,
        },
      })
    } else {
      building = await db.building.update({
        where: { id: current.id },
        data,
      })
    }

    return NextResponse.json(building)
  } catch (e) {
    console.error('settings PUT error', e)
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات ساختمان' },
      { status: 500 }
    )
  }
}
