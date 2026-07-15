import sharp from 'sharp'
import { fileTypeFromBuffer } from 'file-type'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export interface OptimizedVariant {
  buffer: Buffer
  width: number
  height: number
  bytes: number
  format: string
}

export interface OptimizedResult {
  original: { buffer: Buffer; mime: string; ext: string; width: number; height: number; bytes: number }
  thumbnail: OptimizedVariant
  medium: OptimizedVariant
  detail: OptimizedVariant
}

export async function validateAndOptimizeImage(inputBuffer: Buffer): Promise<OptimizedResult> {
  if (inputBuffer.length > MAX_SIZE_BYTES) {
    throw new Error(`Image too large: ${inputBuffer.length} bytes > ${MAX_SIZE_BYTES}`)
  }

  // Magic bytes check
  const type = await fileTypeFromBuffer(inputBuffer)
  if (!type || !ALLOWED_MIMES.includes(type.mime)) {
    throw new Error(`Invalid image type: ${type?.mime || 'unknown'}. Allowed: ${ALLOWED_MIMES.join(', ')}`)
  }

  const ext = type.ext

  // Use sharp to auto-orient, remove malformed ICC, keep sRGB, preserve transparency
  // sharp auto-orients by default when we call rotate()
  const base = sharp(inputBuffer, { failOn: 'none' }).rotate()

  // Ensure sRGB and remove ICC issues: convert to sRGB, keep alpha, strip metadata except orientation handled
  // We will process to get metadata
  const metadata = await base.metadata()

  // Prepare pipelines for variants
  // We want to preserve transparency, white background not broken (WebP supports alpha)
  // For each size, resize with fit inside, without enlargement

  async function makeVariant(width: number): Promise<OptimizedVariant> {
    const pipeline = sharp(inputBuffer, { failOn: 'none' })
      .rotate() // auto-orient
      .resize({ width, withoutEnlargement: true, fit: 'inside' })
      .toColourspace('srgb')
      .webp({ quality: 80, effort: 4, alphaQuality: 90 })

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      bytes: info.size,
      format: 'webp',
    }
  }

  const [thumb, medium, detail] = await Promise.all([
    makeVariant(320),
    makeVariant(640),
    makeVariant(1200),
  ])

  // Original info
  const origInfo = await base.metadata()

  return {
    original: {
      buffer: inputBuffer,
      mime: type.mime,
      ext,
      width: origInfo.width || 0,
      height: origInfo.height || 0,
      bytes: inputBuffer.length,
    },
    thumbnail: thumb,
    medium,
    detail,
  }
}

export function getExtensionFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}
