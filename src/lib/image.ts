// فشرده‌سازی تصویر و تبدیل به Data URL برای بارگذاری رسید پرداخت

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * فشرده‌سازی تصویر انتخاب‌شده و خروجی Data URL با jpeg
 * - بعد بزرگ‌تر تصویر به حداکثر maxDim محدود می‌شود
 * - اعتبارسنجی نوع و حجم فایل با پیام فارسی
 */
export function compressImageToDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('فقط تصویر مجاز است'))
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      reject(new Error('حجم تصویر بیش از حد مجاز است'))
      return
    }

    // رسم تصویر روی canvas با مقیاس مناسب و خروجی گرفتن
    const draw = (source: CanvasImageSource, width: number, height: number) => {
      const scale = Math.min(1, maxDim / Math.max(width, height))
      const w = Math.max(1, Math.round(width * scale))
      const h = Math.max(1, Math.round(height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('خطا در پردازش تصویر'))
        return
      }
      ctx.drawImage(source, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    // مسیر جایگزین: Image + FileReader (مرورگرهای قدیمی)
    const fallback = () => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('خواندن تصویر ناموفق بود'))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error('تصویر قابل خواندن نیست'))
        img.onload = () => draw(img, img.naturalWidth, img.naturalHeight)
        img.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    }

    // مسیر اصلی: createImageBitmap
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file)
        .then((bitmap) => {
          try {
            draw(bitmap, bitmap.width, bitmap.height)
          } finally {
            bitmap.close()
          }
        })
        .catch(() => fallback())
      return
    }
    fallback()
  })
}
