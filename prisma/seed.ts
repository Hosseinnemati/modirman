import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import { toJalaali, formatJalali } from '../src/lib/jalali'
import { todayJalaliLong, nowTime } from '../src/lib/persian'

const db = new PrismaClient()

/** تاریخ جلالی امروز به شکل YYYY-MM-DD */
function todayJalaliISO(): string {
  const { jy, jm, jd } = toJalaali(new Date())
  return formatJalali(jy, jm, jd)
}

/** تاریخ جلالی n روز بعد به شکل YYYY-MM-DD */
function jalaliDaysAhead(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const { jy, jm, jd } = toJalaali(d)
  return formatJalali(jy, jm, jd)
}

async function main() {
  // پاکسازی داده‌های قبلی به ترتیب وابستگی کلید خارجی
  await db.receipt.deleteMany()
  await db.bill.deleteMany()
  await db.reminder.deleteMany()
  await db.announcement.deleteMany()
  await db.serviceRequest.deleteMany()
  await db.user.deleteMany()
  await db.building.deleteMany()

  // رمز آزمایشی مشترک — همیشه هش‌شده ذخیره می‌شود
  const demoHash = hashPassword('1234')

  // ساختمان
  await db.building.create({
    data: {
      name: 'ساختمان آسمان نیلوفر',
      address: 'تهران، خیابان نیلوفر، پلاک ۱۲',
      units: 20,
      cardNumber: '6037991234567890',
      cardHolder: 'مدیر ساختمان',
      sheba: 'IR820540102680020817909002',
    },
  })

  // مدیر
  const manager = await db.user.create({
    data: {
      name: 'مدیر ساختمان',
      username: 'manager',
      phone: '09121111111',
      password: demoHash,
      role: 'manager',
      status: 'active',
    },
  })

  // ساکنین
  const sara = await db.user.create({
    data: {
      name: 'سارا احمدی',
      username: 'sara',
      phone: '09122222222',
      password: demoHash,
      role: 'resident',
      unitNumber: '8',
      floor: 2,
      status: 'active',
    },
  })

  const residents = [
    { name: 'مهدی کریمی', phone: '09124440001', unitNumber: '12', floor: 4, status: 'active' },
    { name: 'علی محمدی', phone: '09124440002', unitNumber: '15', floor: 5, status: 'active' },
    { name: 'حسین رضایی', phone: '09124440003', unitNumber: '5', floor: 2, status: 'active' },
    { name: 'رضا قاسمی', phone: '09124440004', unitNumber: '10', floor: 4, status: 'inactive' },
    { name: 'نگین صالحی', phone: '09124440005', unitNumber: '1', floor: 1, status: 'active' },
  ]
  for (const r of residents) {
    await db.user.create({
      data: {
        ...r,
        username: r.phone,
        password: demoHash,
        role: 'resident',
      },
    })
  }

  // کاربر تازه‌ثبت‌نام‌شده که منتظر تخصیص واحد توسط مدیر است
  const newUser = await db.user.create({
    data: {
      name: 'کاربر جدید',
      username: '09123333333',
      phone: '09123333333',
      password: demoHash,
      role: 'resident',
      status: 'unassigned',
      unitNumber: null,
    },
  })

  // اعلان‌ها
  await db.announcement.createMany({
    data: [
      {
        title: 'جلسه ماهانه اولیای ساختمان',
        content:
          'جلسه ماهانه اولیای ساختمان روز جاری ساعت ۱۸:۰۰ در سالن اجتماعات برگزار می‌شود. حضور تمامی همسایگان گرامی مؤثر در تصمیمات ساختمان است.',
        type: 'meeting',
        date: todayJalaliLong(),
        time: nowTime(),
      },
      {
        title: 'سرویس دوره‌ای آسانسور',
        content:
          'سرویس دوره‌ای آسانسور این هفته انجام خواهد شد. در ساعات ۹:۰۰ تا ۱۲:۰۰ از استفاده از آسانسور خودداری فرمایید.',
        type: 'elevator',
        date: todayJalaliLong(),
        time: nowTime(),
      },
      {
        title: 'رعایت نظافت محیط مشاع',
        content:
          'لطفاً در رعایت نظافت محیط مشاع و جداسازی زباله‌ها همکاری فرمایید. این امر موجب بهداشت بیشتر ساختمان و رفاه همه ساکنین خواهد شد.',
        type: 'cleaning',
        date: todayJalaliLong(),
        time: nowTime(),
      },
    ],
  })

  // قبض‌ها — ۶ معوق (۲ مورد واحد ۸) + ۲ پرداخت‌شده
  await db.bill.createMany({
    data: [
      { title: 'شارژ ماه آبان - واحد ۸', amount: 1250000, unitNumber: '8', dueDate: jalaliDaysAhead(7), status: 'pending' },
      { title: 'شارژ ماه مهر - واحد ۸', amount: 980000, unitNumber: '8', dueDate: jalaliDaysAhead(12), status: 'pending' },
      { title: 'شارژ ماه آبان - واحد ۱۲', amount: 1350000, unitNumber: '12', dueDate: jalaliDaysAhead(7), status: 'pending' },
      { title: 'شارژ ماه آبان - واحد ۱۵', amount: 1450000, unitNumber: '15', dueDate: jalaliDaysAhead(9), status: 'pending' },
      { title: 'شارژ ماه آبان - واحد ۵', amount: 850000, unitNumber: '5', dueDate: jalaliDaysAhead(10), status: 'pending' },
      { title: 'شارژ ماه آبان - واحد ۱', amount: 650000, unitNumber: '1', dueDate: jalaliDaysAhead(14), status: 'pending' },
      { title: 'شارژ ماه مهر - واحد ۸', amount: 1100000, unitNumber: '8', dueDate: jalaliDaysAhead(-10), status: 'paid' },
      { title: 'شارژ ماه مهر - واحد ۱۲', amount: 1300000, unitNumber: '12', dueDate: jalaliDaysAhead(-8), status: 'paid' },
    ],
  })

  // درخواست‌های تعمیرات و خدمات
  await db.serviceRequest.createMany({
    data: [
      {
        title: 'نشتی لوله آشپزخانه - واحد ۵',
        description: 'زیر سینک آشپزخانه نشتی آب مشاهده شده است و نیاز به بررسی فوری دارد.',
        unitNumber: '5',
        category: 'plumbing',
        priority: 'high',
        status: 'in_progress',
      },
      {
        title: 'نورپردازی راه‌پله - واحد ۱۵',
        description: 'چند عدد از لامپ‌های راه‌پله سوخته‌اند.',
        unitNumber: '15',
        category: 'electrical',
        priority: 'medium',
        status: 'in_progress',
      },
      {
        title: 'رفع نقص کابینت دیواری - واحد ۸',
        description: 'لولای کابینت دیواری آشپزخانه شل شده است.',
        unitNumber: '8',
        category: 'repair',
        priority: 'low',
        status: 'done',
      },
    ],
  })

  // یادآورها
  await db.reminder.create({
    data: {
      userId: manager.id,
      title: 'جلسه ماهانه اولیای ساختمان',
      description: 'برگزاری جلسه ماهانه با حضور اولیای ساختمان در سالن اجتماعات',
      date: todayJalaliISO(),
      time: '18:00',
      type: 'building',
    },
  })

  await db.reminder.create({
    data: {
      userId: sara.id,
      title: 'پرداخت شارژ آبان',
      description: 'پرداخت شارژ ماه آبان واحد ۸ قبل از سررسید',
      date: jalaliDaysAhead(3),
      time: null,
      type: 'personal',
    },
  })

  const [users, bills, announcements, requests, reminders, buildings] = await Promise.all([
    db.user.count(),
    db.bill.count(),
    db.announcement.count(),
    db.serviceRequest.count(),
    db.reminder.count(),
    db.building.count(),
  ])

  console.log('✅ Seed completed successfully')
  console.log(
    `users=${users} bills=${bills} announcements=${announcements} requests=${requests} reminders=${reminders} buildings=${buildings}`
  )
  console.log(`newUser unassigned: ${newUser.phone} / status=${newUser.status}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
