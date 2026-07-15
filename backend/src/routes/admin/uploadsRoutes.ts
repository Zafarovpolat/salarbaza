import express, { Router } from 'express'
import crypto from 'crypto'
import { config } from '../../config'
import { validateAndOptimizeImage } from '../../utils/imageOptimization'
import { logger } from '../../utils/logger'
import * as Sentry from '@sentry/node'

const router = Router()

const allowedImageTypes: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

async function uploadToSupabase(buffer: Buffer, objectPath: string, contentType: string): Promise<string> {
  if (!config.supabaseUrl || !config.supabaseServiceRole) {
    throw new Error('Upload service not configured')
  }
  const bucket = 'products'
  const uploadUrl = `${config.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${objectPath}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: config.supabaseServiceRole,
      Authorization: `Bearer ${config.supabaseServiceRole}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: buffer as any,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Supabase upload failed ${res.status}: ${detail.slice(0, 300)}`)
  }
  return `${config.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`
}

router.post(
  '/uploads',
  express.raw({ type: Object.keys(allowedImageTypes), limit: '10mb' }),
  async (req, res) => {
    try {
      const mimeHeader = req.headers['content-type']?.split(';')[0].trim() || ''
      const folder = req.query.folder === 'categories' ? 'categories' : req.query.folder === 'products' ? 'products' : null
      if (!folder || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ success: false, message: 'PNG, JPEG or WebP file and valid folder are required' })
      }

      // Validate and optimize via Sharp + magic bytes
      let optimized
      try {
        optimized = await validateAndOptimizeImage(req.body)
      } catch (e: any) {
        return res.status(400).json({ success: false, message: e.message || 'Invalid image' })
      }

      const base = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
      const originalExt = optimized.original.ext
      const originalPath = `${folder}/${base}-original.${originalExt}`
      const thumbPath = `${folder}/${base}-320.webp`
      const mediumPath = `${folder}/${base}-640.webp`
      const detailPath = `${folder}/${base}-1200.webp`

      // Upload all variants
      const [originalUrl, thumbnailUrl, mediumUrl, detailUrl] = await Promise.all([
        uploadToSupabase(optimized.original.buffer, originalPath, optimized.original.mime),
        uploadToSupabase(optimized.thumbnail.buffer, thumbPath, 'image/webp'),
        uploadToSupabase(optimized.medium.buffer, mediumPath, 'image/webp'),
        uploadToSupabase(optimized.detail.buffer, detailPath, 'image/webp'),
      ])

      // For backward compat, url is detail
      res.status(201).json({
        success: true,
        data: {
          url: detailUrl,
          detailUrl,
          thumbnailUrl,
          mediumUrl,
          originalUrl,
          path: detailPath,
          originalPath,
          thumbnailPath: thumbPath,
          mediumPath,
          width: optimized.detail.width,
          height: optimized.detail.height,
          bytes: optimized.detail.bytes,
          format: 'webp',
          originalWidth: optimized.original.width,
          originalHeight: optimized.original.height,
          originalBytes: optimized.original.bytes,
        },
      })
    } catch (error: any) {
      logger.error('Secure image upload error', error)
      try { Sentry.captureException(error) } catch {}
      res.status(500).json({ success: false, message: 'Image upload failed' })
    }
  }
)

export default router
