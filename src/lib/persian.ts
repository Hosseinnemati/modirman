// ابزارهای فارسی: تبدیل اعداد، فرمت مبلغ و تاریخ

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** تبدیل ارقام انگلیسی به فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** فرمت مبلغ به تومان با جداکننده هزارگان و ارقام فارسی */
export function formatMoney(amount: number): string {
  return toFaDigits(amount.toLocaleString('en-US'))
}

/** تاریخ شمسی فعلی به فرمت ۱۴۰۳/۰۸/۱۵ */
export function todayJalali(): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = fmt.format(new Date()) // e.g. "08/15/1403 AP"
    const [m, d, y] = parts.replace(' AP', '').split('/')
    return `${y}/${m}/${d}`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
  }
}

/** تاریخ و ساعت شمسی خوانا مثل: ۱۴۰۳ مهر ۱۵ */
export function todayJalaliLong(): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ]
  try {
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const parts = fmt.format(new Date()).replace(' AP', '')
    const [m, d, y] = parts.split('/')
    return `${toFaDigits(y)} ${months[Number(m) - 1]} ${toFaDigits(d)}`
  } catch {
    return todayJalali()
  }
}

/** ساعت فعلی به فرمت ۱۸:۳۰ */
export function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/** تبدیل ارقام فارسی/عربی به انگلیسی */
export function faToEnDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** تبدیل عدد واحد به عدد فارسی برای نمایش (واحد ۸) */
export function unitFa(unit: string | number): string {
  return toFaDigits(unit)
}
