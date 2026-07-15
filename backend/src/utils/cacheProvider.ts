import * as Sentry from '@sentry/node'
import { logger } from './logger'

export interface CacheProvider {
  get<T = any>(key: string): Promise<T | null>
  set(key: string, value: any, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
  deleteByPrefix(prefix: string): Promise<number>
  clear(): Promise<void>
  getStats(): { size?: number; hits: number; misses: number; hitRate: number; provider: string; connected?: boolean }
  health(): Promise<{ ok: boolean; provider: string; error?: string }>
}

// ---------------- In-Memory Provider ----------------
interface MemoryEntry {
  data: any
  expiry: number
  ttl: number
}

class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, MemoryEntry>()
  private hits = 0
  private misses = 0

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    if (Date.now() > entry.expiry) {
      this.store.delete(key)
      this.misses++
      return null
    }
    this.hits++
    return entry.data as T
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.store.set(key, { data: value, expiry: Date.now() + ttlSeconds * 1000, ttl: ttlSeconds })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    let count = 0
    for (const key of this.store.keys()) {
      if (key.includes(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
      provider: 'memory',
      connected: true,
    }
  }

  async health() {
    return { ok: true, provider: 'memory' }
  }
}

// ---------------- Redis / Valkey Provider ----------------
class RedisCacheProvider implements CacheProvider {
  private client: any
  private hits = 0
  private misses = 0
  private connected = false

  constructor(redisUrl: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis')
      this.client = new IORedis(redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
        lazyConnect: true,
      })
      this.client.on('connect', () => {
        this.connected = true
        logger.info('🔌 Redis cache connected')
      })
      this.client.on('error', (err: any) => {
        this.connected = false
        logger.error('Redis cache error', err)
        try { Sentry.captureException(err) } catch {}
      })
      this.client.on('close', () => {
        this.connected = false
      })
      // Try to connect, but don't block
      this.client.connect().catch((err: any) => {
        logger.error('Redis connect failed, fallback to memory', err)
        this.connected = false
      })
    } catch (e) {
      logger.error('Failed to init Redis client', e)
      try { Sentry.captureException(e) } catch {}
      this.connected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      this.misses++
      return null
    }
    try {
      const raw = await this.client.get(key)
      if (raw === null) {
        this.misses++
        return null
      }
      this.hits++
      return JSON.parse(raw) as T
    } catch (e) {
      this.misses++
      logger.error(`Redis get failed for ${key}`, e)
      try { Sentry.captureException(e) } catch {}
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.connected) return
    try {
      const serialized = JSON.stringify(value)
      await this.client.set(key, serialized, 'EX', ttlSeconds)
    } catch (e) {
      logger.error(`Redis set failed for ${key}`, e)
      try { Sentry.captureException(e) } catch {}
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) return
    try {
      await this.client.del(key)
    } catch (e) {
      logger.error(`Redis delete failed for ${key}`, e)
      try { Sentry.captureException(e) } catch {}
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    if (!this.client || !this.connected) return 0
    try {
      // SCAN to avoid blocking
      let cursor = '0'
      let count = 0
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', `*${prefix}*`, 'COUNT', 100)
        cursor = nextCursor
        if (keys.length > 0) {
          await this.client.del(...keys)
          count += keys.length
        }
      } while (cursor !== '0')
      return count
    } catch (e) {
      logger.error(`Redis deleteByPrefix failed for ${prefix}`, e)
      try { Sentry.captureException(e) } catch {}
      return 0
    }
  }

  async clear(): Promise<void> {
    if (!this.client || !this.connected) return
    try {
      await this.client.flushdb()
    } catch (e) {
      logger.error('Redis clear failed', e)
      try { Sentry.captureException(e) } catch {}
    }
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
      provider: 'redis',
      connected: this.connected,
    }
  }

  async health() {
    if (!this.client) return { ok: false, provider: 'redis', error: 'client not initialized' }
    try {
      await this.client.ping()
      return { ok: true, provider: 'redis' }
    } catch (e: any) {
      return { ok: false, provider: 'redis', error: e.message?.slice(0, 200) }
    }
  }
}

// ---------------- Factory ----------------

let providerInstance: CacheProvider | null = null
let memoryFallback = new MemoryCacheProvider()

function createProvider(): CacheProvider {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    logger.info('🗄️ Cache provider: Redis (REDIS_URL set)')
    return new RedisCacheProvider(redisUrl)
  }
  logger.info('🗄️ Cache provider: memory (REDIS_URL not set)')
  return new MemoryCacheProvider()
}

export function getCacheProvider(): CacheProvider {
  if (!providerInstance) {
    providerInstance = createProvider()
  }
  return providerInstance
}

export function getMemoryFallback(): CacheProvider {
  return memoryFallback
}

// For testing: reset provider
export function _resetCacheProvider() {
  providerInstance = null
  memoryFallback = new MemoryCacheProvider()
}
