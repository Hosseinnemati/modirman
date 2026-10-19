import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, toPublicUser } from '@/lib/auth'

// اطلاعات کاربر جاری بر اساس توکن
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json(
      { error: 'نشست منقضی شده است' },
      { status: 401 }
    )
  }
  return NextResponse.json({ user: toPublicUser(user) })
}
