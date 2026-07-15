import { Response } from 'express'
import { logger } from './logger'
import { getCacheProvider, getMemoryFallback } from './cacheProvider'
import * as Sentry from '@sentry/node'

// Legacy sync store for backward compat (used when REDIS_URL is empty, which is current Render)
interface CacheEntry {
  data: any
  expiry: number
  ttl: number
}
const legacyStore = new Map<string, CacheEntry>()
let legacyHits = 0
let legacyMisses = 0

// Synchronous helpers (memory only) - kept for backward compat, but new code should use async versions
export function getCached<T = any>(key: string): T | null {
  const entry = legacyStore.get(key)
  if (!entry) {
    legacyMisses++
    return null
  }
  if (Date.now() > entry.expiry) {
    legacyStore.delete(key)
    legacyMisses++
    return null
  }
  legacyHits++
  return entry.data as T
}

export function setCache(key: string, data: any, ttlSeconds: number): void {
  legacyStore.set(key, { data, expiry: Date.now() + ttlSeconds * 1000, ttl: ttlSeconds })
  // Also set via async provider (fire and forget)
  getCacheProvider().set(key, data, ttlSeconds).catch((e) => {
    logger.warn(`Cache set failed for ${key}`, e)
    try { Sentry.captureException(e) } catch {}
  })
}

export function trySendCached(key: string, res: Response): boolean {
  // Sync version checks legacy store only (fast path for current Render memory mode)
  const entry = legacyStore.get(key)
  if (!entry || Date.now() > entry.expiry) {
    if (entry) legacyStore.delete(key)
    legacyMisses++
    return false
  }
  legacyHits++
  const maxAge = Math.max(1, Math.round((entry.expiry - Date.now()) / 1000))
  res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${entry.ttl}`)
  res.json(entry.data)
  return true
}

export function cacheAndSend(key: string, data: any, ttlSeconds: number, res: Response): void {
  setCache(key, data, ttlSeconds)
  res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`)
  res.json(data)
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    legacyStore.clear()
    logger.info('🗑️ Cache cleared (all)')
  } else {
    let count = 0
    for (const key of legacyStore.keys()) {
      if (key.includes(pattern)) {
        legacyStore.delete(key)
        count++
      }
    }
    if (count > 0) logger.info(`🗑️ Cache invalidated: ${count} entries matching "${pattern}"`)
  }
  // Also async provider
  const provider = getCacheProvider()
  if (pattern) {
    provider.deleteByPrefix(pattern).catch((e) => {
      logger.warn(`Cache provider deleteByPrefix failed ${pattern}`, e)
      try { Sentry.captureException(e) } catch {}
    })
  } else {
    provider.clear().catch((e) => {
      logger.warn('Cache provider clear failed', e)
      try { Sentry.captureException(e) } catch {}
    })
  }
}

// ---------------- Async provider-based API (preferred for new code) ----------------

export async function getCachedAsync<T = any>(key: string): Promise<T | null> {
  try {
    const provider = getCacheProvider()
    const result = await provider.get<T>(key)
    if (result !== null) return result
    // Fallback to legacy memory for cases where provider is redis but not connected
    return getCached<T>(key)
  } catch (e) {
    logger.warn(`getCachedAsync failed for ${key}`, e)
    try { Sentry.captureException(e) } catch {}
    // Graceful fallback to legacy
    return getCached<T>(key)
  }
}

export async function setCacheAsync(key: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    setCache(key, data, ttlSeconds) // legacy sync
    await getCacheProvider().set(key, data, ttlSeconds)
  } catch (e) {
    logger.warn(`setCacheAsync failed for ${key}`, e)
    try { Sentry.captureException(e) } catch {}
  }
}

export async function trySendCachedAsync(key: string, res: Response): Promise<boolean> {
  try {
    const provider = getCacheProvider()
    const data = await provider.get(key)
    if (data !== null) {
      // Try to get TTL from provider? For simplicity, use 60s default or from legacy if present
      const legacy = legacyStore.get(key)
      const ttl = legacy?.ttl ?? 60
      const maxAge = legacy ? Math.max(1, Math.round((legacy.expiry - Date.now()) / 1000)) : ttl
      res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${ttl}`)
      res.json(data)
      return true
    }
    // Fallback to legacy sync
    return trySendCached(key, res)
  } catch (e) {
    logger.warn(`trySendCachedAsync failed for ${key}`, e)
    try { Sentry.captureException(e) } catch {}
    return trySendCached(key, res)
  }
}

export async function cacheAndSendAsync(key: string, data: any, ttlSeconds: number, res: Response): Promise<void> {
  try {
    await setCacheAsync(key, data, ttlSeconds)
  } catch {}
  res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`)
  res.json(data)
}

export async function invalidateCacheAsync(pattern?: string): Promise<void> {
  invalidateCache(pattern)
  try {
    const provider = getCacheProvider()
    if (pattern) await provider.deleteByPrefix(pattern)
    else await provider.clear()
  } catch (e) {
    logger.warn(`invalidateCacheAsync failed`, e)
    try { Sentry.captureException(e) } catch {}
  }
}

export function getCacheStats() {
  // Merge stats from provider and legacy
  try {
    const providerStats = getCacheProvider().getStats()
    const legacyTotal = legacyHits + legacyMisses
    const providerTotal = providerStats.hits + providerStats.misses
    const totalHits = legacyHits + providerStats.hits
    const totalMisses = legacyMisses + providerStats.misses
    const total = totalHits + totalMisses
    return {
      size: (providerStats as any).size ?? legacyStore.size,
      hits: totalHits,
      misses: totalMisses,
      hitRate: total > 0 ? Math.round((totalHits / total) * 100) : 0,
      provider: providerStats.provider,
      connected: (providerStats as any).connected ?? true,
      legacy: { size: legacyStore.size, hits: legacyHits, misses: legacyMisses, hitRate: legacyTotal > 0 ? Math.round((legacyHits / legacyTotal) * 100) : 0 },
      providerStats,
    }
  } catch {
    return {
      size: legacyStore.size,
      hits: legacyHits,
      misses: legacyMisses,
      hitRate: legacyHits + legacyMisses > 0 ? Math.round((legacyHits / (legacyHits + legacyMisses)) * 100) : 0,
      provider: 'memory',
      connected: true,
    }
  }
}

export async function getCacheHealth() {
  try {
    const provider = getCacheProvider()
    return await provider.health()
  } catch (e: any) {
    return { ok: false, provider: 'unknown', error: e.message?.slice(0, 200) }
  }
}
