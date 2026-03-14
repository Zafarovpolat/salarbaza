import { logger } from './logger'

interface CacheEntry {
  data: any
  expiry: number
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
  })
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