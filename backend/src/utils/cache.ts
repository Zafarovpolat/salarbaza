import { Response } from 'express'
import { logger } from './logger'

interface CacheEntry {
  data: any
  expiry: number
  ttl: number   // original TTL in seconds — used for Cache-Control
}

const store = new Map<string, CacheEntry>()

// Статистика
let hits = 0
let misses = 0

export function getCached<T = any>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) {
    misses++
    return null
  }
  if (Date.now() > entry.expiry) {
    store.delete(key)
    misses++
    return null
  }
  hits++
  return entry.data as T
}

export function setCache(key: string, data: any, ttlSeconds: number): void {
  store.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
    ttl: ttlSeconds,
  })
}

/**
 * Helper: try cache first; if hit, send with Cache-Control and return true.
 */
export function trySendCached(key: string, res: Response): boolean {
  const entry = store.get(key)
  if (!entry || Date.now() > entry.expiry) {
    if (entry) store.delete(key)
    misses++
    return false
  }
  hits++
  const maxAge = Math.max(1, Math.round((entry.expiry - Date.now()) / 1000))
  res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${entry.ttl}`)
  res.json(entry.data)
  return true
}

/**
 * Store + send response with Cache-Control header.
 */
export function cacheAndSend(key: string, data: any, ttlSeconds: number, res: Response): void {
  setCache(key, data, ttlSeconds)
  res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`)
  res.json(data)
}

// ✅ Очистить кэш по паттерну (для admin операций)
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    store.clear()
    logger.info('🗑️ Cache cleared (all)')
    return
  }
  let count = 0
  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key)
      count++
    }
  }
  if (count > 0) {
    logger.info(`🗑️ Cache invalidated: ${count} entries matching "${pattern}"`)
  }
}

export function getCacheStats() {
  return {
    size: store.size,
    hits,
    misses,
    hitRate: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0,
  }
}