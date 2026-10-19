import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import type { User } from '@prisma/client'
import { db } from '@/lib/db'

const AUTH_SECRET = process.env.AUTH_SECRET || 'sakhteman-yar-secret-1404'

// توکن ۱۸۰ روز اعتبار دارد
const TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60

/* ---------------------------------- Token --------------------------------- */

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string): string {
  return createHmac('sha256', AUTH_SECRET).update(data).digest('base64url')
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** ساخت توکن JWT-مانند: base64url(header).base64url(payload).base64url(signature) */
export function createToken(userId: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = toBase64Url(
    JSON.stringify({ uid: userId, iat: now, exp: now + TOKEN_TTL_SECONDS })
  )
  const signature = sign(`${header}.${payload}`)
  return `${header}.${payload}.${signature}`
}

/** اعتبارسنجی توکن؛ در صورت هر خطی مقدار null برمی‌گردد */
export function verifyToken(token: string): { uid: string } | null {
  try {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, payload, signature] = parts
    if (!header || !payload || !signature) return null

    if (!safeEqualStrings(signature, sign(`${header}.${payload}`))) return null

    const headerJson = JSON.parse(
      Buffer.from(header, 'base64url').toString('utf8')
    ) as { alg?: string }
    if (headerJson?.alg !== 'HS256') return null

    const payloadJson = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { uid?: unknown; exp?: unknown }

    if (typeof payloadJson?.uid !== 'string' || !payloadJson.uid) return null
    if (
      typeof payloadJson.exp === 'number' &&
      Date.now() / 1000 > payloadJson.exp
    ) {
      return null
    }

    return { uid: payloadJson.uid }
  } catch {
    return null
  }
}

/** استخراج کاربر از هدر Authorization: Bearer <token> */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    const user = await db.user.findUnique({ where: { id: payload.uid } })
    return user ?? null
  } catch {
    return null
  }
}

/**
 * خروجی استاندارد عمومی کاربر (userJson) —
 * شامل id, name, username, phone, role, unitNumber, floor, status, createdAt
 * و هرگز شامل password نیست.
 */
export function toPublicUser(user: User) {
  const { password: _password, ...rest } = user
  return rest
}

/* --------------------------------- Password -------------------------------- */

/** هش رمز عبور با scrypt — خروجی: scrypt:<saltHex>:<hashHex> */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 64)
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

/**
 * بررسی رمز عبور؛ اگر رمز ذخیره‌شده با scrypt هش شده باشد با scrypt تأیید می‌شود،
 * در غیر این صورت (حساب‌های قدیمی seed با رمز متنی) مقایسه ساده انجام می‌شود.
 */
export function verifyPassword(pw: string, stored: string): boolean {
  if (typeof stored !== 'string') return false

  if (stored.startsWith('scrypt:')) {
    const [, saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false
    try {
      const salt = Buffer.from(saltHex, 'hex')
      const expected = Buffer.from(hashHex, 'hex')
      const actual = scryptSync(pw, salt, expected.length)
      if (actual.length !== expected.length) return false
      return timingSafeEqual(actual, expected)
    } catch {
      return false
    }
  }

  // حساب‌های قدیمی با رمز عبور متنی ساده
  return stored === pw
}
