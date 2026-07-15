import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import rateLimit from 'express-rate-limit'
import { logger } from '../utils/logger'
import * as Sentry from '@sentry/node'

const router = Router()

const EVENT_ALLOWLIST = [
  'product_view',
  'category_view',
  'search',
  'search_no_results',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'order_created',
  'order_cancelled',
] as const

const PII_KEYS = ['phone', 'address', 'customerName', 'customer_name', 'customerPhone', 'initData', 'initdata', 'username', 'telegram', 'cookie', 'ip', 'x-telegram', 'authorization']

function containsPII(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false
  const keys = Object.keys(obj).map((k) => k.toLowerCase())
  for (const k of keys) {
    for (const pii of PII_KEYS) {
      if (k.includes(pii)) return true
    }
  }
  return false
}

function sanitizeMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') return metadata
  const out: any = {}
  for (const [k, v] of Object.entries(metadata)) {
    const lk = k.toLowerCase()
    let isPII = false
    for (const pii of PII_KEYS) {
      if (lk.includes(pii)) {
        isPII = true
        break
      }
    }
    if (isPII) continue
    if (typeof v === 'string' && v.length > 500) {
      out[k] = v.slice(0, 500)
    } else if (typeof v === 'object' && v !== null) {
      out[k] = sanitizeMetadata(v)
    } else {
      out[k] = v
    }
  }
  try {
    const str = JSON.stringify(out)
    if (str.length > 2048) {
      return { truncated: true, originalSize: str.length }
    }
  } catch {}
  return out
}

const singleEventSchema = z.object({
  event: z.enum(EVENT_ALLOWLIST),
  sessionId: z.string().min(1).max(100),
  userId: z.string().max(100).optional().nullable(),
  productId: z.string().max(100).optional().nullable(),
  categoryId: z.string().max(100).optional().nullable(),
  orderId: z.string().max(100).optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
})

const batchSchema = z.object({
  events: z.array(singleEventSchema).min(1).max(20),
})

const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: 'Too many analytics requests' })
  },
})

router.post('/events', analyticsRateLimiter, async (req, res) => {
  try {
    let eventsToValidate: any[] = []

    if (req.body && Array.isArray(req.body.events)) {
      const batchParsed = batchSchema.safeParse(req.body)
      if (!batchParsed.success) {
        return res.status(400).json({ success: false, message: 'Invalid analytics batch', errors: batchParsed.error.errors.slice(0, 5) })
      }
      eventsToValidate = batchParsed.data.events
    } else {
      const singleParsed = singleEventSchema.safeParse(req.body)
      if (!singleParsed.success) {
        return res.status(400).json({ success: false, message: 'Invalid analytics payload', errors: singleParsed.error.errors.slice(0, 5) })
      }
      eventsToValidate = [singleParsed.data]
    }

    const toInsert: any[] = []
    for (const ev of eventsToValidate) {
      if (ev.metadata && containsPII(ev.metadata)) continue
      const safeMeta = ev.metadata ? sanitizeMetadata(ev.metadata) : null
      if (safeMeta) {
        const size = JSON.stringify(safeMeta).length
        if (size > 2048) continue
      }
      toInsert.push({
        event: ev.event,
        sessionId: ev.sessionId,
        userId: ev.userId || null,
        productId: ev.productId || null,
        categoryId: ev.categoryId || null,
        orderId: ev.orderId || null,
        source: ev.source || null,
        metadata: safeMeta || undefined,
      })
    }

    if (toInsert.length === 0) {
      return res.json({ success: true, data: { inserted: 0 } })
    }

    try {
      await prisma.analyticsEvent.createMany({ data: toInsert })
    } catch (e) {
      logger.warn('Analytics insert failed', e)
      try { Sentry.captureException(e) } catch {}
      return res.json({ success: true, data: { inserted: 0, warning: 'ingestion failed' } })
    }

    res.json({ success: true, data: { inserted: toInsert.length } })
  } catch (error) {
    logger.error('Analytics endpoint error', error)
    res.json({ success: true, data: { inserted: 0 } })
  }
})

export default router
