// ساخت آیکون‌های اپ «مدیرمن» از لوگوی آپلودشده
// اجرا: bun scripts/make-icons.ts
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = '/home/z/my-project/upload/logo.jpg'
const OUT_DIR = '/home/z/my-project/public/images'

const NEAR_WHITE = 246 // آستانه‌ی «تقریبا سفید»

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const img = sharp(SRC)
  const meta = await img.metadata()
  const W = meta.width!
  const H = meta.height!
  console.log('source:', W, 'x', H)

  // پیکسل‌های خام grayscale
  const { data, info } = await img
    .clone()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const gw = info.width
  const gh = info.height

  // برای هر ردیف: آیا پیکسل غیرسفید دارد؟
  const rowHasInk = new Array<boolean>(gh).fill(false)
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (data[y * gw + x] < NEAR_WHITE) {
        rowHasInk[y] = true
        break
      }
    }
  }

  // پیدا کردن بلوک‌های محتوایی متوالی (با تحمل گپ‌های کوچک تا 1% ارتفاع)
  const tol = Math.max(3, Math.round(gh * 0.01))
  type Block = { start: number; end: number }
  const blocks: Block[] = []
  let inBlock = false
  let blockStart = 0
  let gap = 0
  for (let y = 0; y < gh; y++) {
    if (rowHasInk[y]) {
      if (!inBlock) {
        inBlock = true
        blockStart = y
      }
      gap = 0
    } else if (inBlock) {
      gap++
      if (gap > tol) {
        blocks.push({ start: blockStart, end: y - gap })
        inBlock = false
        gap = 0
      }
    }
  }
  if (inBlock) blocks.push({ start: blockStart, end: gh - 1 })

  console.log('blocks found:', blocks.map((b) => `${b.start}-${b.end} (h=${b.end - b.start})`))
  if (blocks.length === 0) throw new Error('no content found')

  // بلوک اول = آیکون (بالای تصویر)
  const icon = blocks[0]

  // محدوده‌ی ستون‌ها داخل بلوک آیکون
  let minX = gw
  let maxX = -1
  for (let y = icon.start; y <= icon.end; y++) {
    for (let x = 0; x < gw; x++) {
      if (data[y * gw + x] < NEAR_WHITE) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  console.log('icon block:', { top: icon.start, bottom: icon.end, left: minX, right: maxX })

  const cropW = maxX - minX + 1
  const cropH = icon.end - icon.start + 1
  // مربع‌سازی حول مرکز آیکون با حاشیه 2%
  const pad = Math.round(Math.max(cropW, cropH) * 0.02)
  const side = Math.max(cropW, cropH) + pad * 2
  const cx = minX + cropW / 2
  const cy = icon.start + cropH / 2
  const left = Math.max(0, Math.round(cx - side / 2))
  const top = Math.max(0, Math.round(cy - side / 2))
  const finalSide = Math.min(side, W - left, H - top)
  console.log('square crop:', { left, top, size: finalSide })

  const base = sharp(SRC).extract({ left, top, width: finalSide, height: finalSide })

  // خروجی‌ها — پس‌زمینه سفید
  const sizes: { file: string; size: number }[] = [
    { file: 'app-icon.png', size: 512 },
    { file: 'icon-512.png', size: 512 },
    { file: 'icon-192.png', size: 192 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'favicon-32.png', size: 32 },
  ]
  for (const s of sizes) {
    await base
      .clone()
      .resize(s.size, s.size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(`${OUT_DIR}/${s.file}`)
    console.log('wrote', s.file, s.size)
  }

  // نسخه‌ی maskable (محتوای کوچک‌تر در مرکز با پدینگ امن)
  const inner = Math.round(512 * 0.78)
  const innerBuf = await base.clone().resize(inner, inner, { fit: 'cover' }).png().toBuffer()
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#ffffff' },
  })
    .composite([{ input: innerBuf, gravity: 'centre' }])
    .png()
    .toFile(`${OUT_DIR}/icon-512-maskable.png`)
  console.log('wrote icon-512-maskable.png')

  // پیش‌نمایش برای بازبینی
  await base.clone().resize(400, 400, { fit: 'cover' }).png().toFile('/home/z/my-project/icon-preview.png')
  console.log('preview written')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
