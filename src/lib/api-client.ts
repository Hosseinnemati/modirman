// کلاینت API با مدیریت توکن احراز هویت (Bearer)

const TOKEN_KEY = 'building_app_token'

/** خواندن توکن از localStorage */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** ذخیره توکن در localStorage */
export function setToken(t: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_KEY, t)
  } catch {
    // بی‌خیال
  }
}

/** حذف توکن از localStorage */
export function clearToken() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // بی‌خیال
  }
}

/** fetch با هدر Authorization - در صورت 401 خطای فارسی پرتاب می‌کند */
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    throw new Error('نشست شما منقضی شده است؛ دوباره وارد شوید')
  }
  return res
}
