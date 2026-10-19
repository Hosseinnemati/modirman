/**
 * تبدیل تقویم میلادی ↔ جلالی (الگوریتم استاندارد jalaali)
 * برای ساخت گرید تقویم شمسی در اپ «مدیرمن»
 */

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
]

function div(a: number, b: number): number {
  return Math.trunc(a / b)
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b
}

/** محاسبه سال کبیسه و روز شروع سال (۱ فروردین میلادی) */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0]
  let jump = 0

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new Error('سال جلالی نامعتبر: ' + jy)
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }

  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4

  return { leap, gy, march }
}

/** تاریخ میلادی به شماره روز مطلق */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/** شماره روز مطلق به تاریخ میلادی */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

/** شماره روز مطلق به تاریخ جلالی */
function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)

  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

/** تاریخ جلالی به شماره روز مطلق */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

export function isLeapJalaaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0
}

/** تعداد روزهای یک ماه جلالی */
export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaaliYear(jy) ? 30 : 29
}

/** Date میلادی به تاریخ جلالی */
export function toJalaali(date: Date): { jy: number; jm: number; jd: number } {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()))
}

/** تاریخ جلالی به Date میلادی (ساعت ۰۰:۰۰ محلی) */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  const g = d2g(j2d(jy, jm, jd))
  return new Date(g.gy, g.gm - 1, g.gd)
}

/** تاریخ جلالی امروز */
export function todayJalaali(): { jy: number; jm: number; jd: number } {
  return toJalaali(new Date())
}

/** نام ماه‌های شمسی */
export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

/** نام روزهای هفته از شنبه */
export const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/**
 * ایندکس روز هفته اول ماه جلالی (۰ = شنبه)
 * getDay(): یکشنبه=۰ ... شنبه=۶ → (getDay()+1)%7
 */
export function firstWeekdayOfMonth(jy: number, jm: number): number {
  const g = toGregorian(jy, jm, 1)
  return (g.getDay() + 1) % 7
}

/** رشته استاندارد ذخیره تاریخ جلالی: YYYY-MM-DD */
export function formatJalali(jy: number, jm: number, jd: number): string {
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`
}

/** پارس رشته YYYY-MM-DD جلالی */
export function parseJalali(s: string): { jy: number; jm: number; jd: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return { jy: Number(m[1]), jm: Number(m[2]), jd: Number(m[3]) }
}

/**
 * آیا یک یادآوری (تاریخ جلالی + ساعت اختیاری) زمانش رسیده؟
 * تاریخ‌های گذشته هم رسیده محسوب می‌شوند.
 */
export function isReminderDue(date: string, time: string | null): boolean {
  const p = parseJalali(date)
  if (!p) return false
  const due = toGregorian(p.jy, p.jm, p.jd)
  if (time) {
    const [h, min] = time.split(':').map(Number)
    if (!Number.isNaN(h)) due.setHours(h, Number.isNaN(min) ? 0 : min, 0, 0)
  } else {
    due.setHours(9, 0, 0, 0)
  }
  return due.getTime() <= Date.now()
}

/** برچسب فارسی تاریخ جلالی؛ مثلا «۵ آبان» */
export function jalaliDayLabel(date: string): string {
  const p = parseJalali(date)
  if (!p) return date
  return `${p.jd} ${JALALI_MONTHS[p.jm - 1]}`
}
