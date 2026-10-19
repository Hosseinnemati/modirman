import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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

    const billWhere = unit ? { unitNumber: unit } : {}

    const [residentsCount, pendingBills, pendingAmount, openRequests, recentAnnouncements] =
      await Promise.all([
        db.user.count({ where: { role: 'resident', status: 'active' } }),
        db.bill.count({ where: { status: 'pending', ...billWhere } }),
        db.bill.aggregate({
          where: { status: 'pending', ...billWhere },
          _sum: { amount: true },
        }),
        db.serviceRequest.count({ where: { status: 'in_progress' } }),
        db.announcement.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ])

    return NextResponse.json({
      residentsCount,
      pendingBills,
      pendingAmount: pendingAmount._sum.amount || 0,
      openRequests,
      announcementsCount: recentAnnouncements.length,
      recentAnnouncements,
    })
  } catch (e) {
    console.error('stats GET error', e)
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 })
  }
}
