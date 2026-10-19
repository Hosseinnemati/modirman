/**
 * توابع اعتبارسنجی و نرمال‌سازی مشترک بک‌اند
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** تبدیل ارقام فارسی/عربی به انگلیسی */
function toEnDigits(input: string): string {
  let out = ''
  for (const ch of input) {
    const p = PERSIAN_DIGITS.indexOf(ch)
    if (p >= 0) {
      out += String(p)
      continue
    }
    const a = ARABIC_DIGITS.indexOf(ch)
    if (a >= 0) {
      out += String(a)
      continue
    }
    out += ch
  }
  return out
}

/**
 * نرمال‌سازی شماره موبایل ایرانی:
 * تبدیل ارقام فارسی/عربی، حذف فاصله و خط تیره،
 * تبدیل پیش‌شماره +98 / 0098 به 0 —
 * خروجی معتبر: 09XXXXXXXXX (۱۱ رقم) و در غیر این صورت null
 */
export function normalizePhone(input: string): string | null {
  if (typeof input !== 'string') return null

  let s = toEnDigits(input.trim())
  s = s.replace(/[\s\-()]/g, '')

  if (s.startsWith('+98')) {
    s = '0' + s.slice(3)
  } else if (s.startsWith('0098')) {
    s = '0' + s.slice(4)
  }

  if (!/^09\d{9}$/.test(s)) return null
  return s
}

/** رمز عبور معتبر: حداقل ۶ کاراکتر */
export function isValidPassword(pw: unknown): boolean {
  return typeof pw === 'string' && pw.length >= 6
}

/** حذف فاصله‌های ابتدا/انتها و محدود کردن به حداکثر طول */
export function cleanText(s: unknown, maxLen: number): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, maxLen)
}
