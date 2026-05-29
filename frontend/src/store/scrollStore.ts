import { create } from 'zustand'
import { Product } from '@/types'

interface CachedList {
  products: Product[]
  page: number
  hasMore: boolean
  total: number
  scrollY: number
  timestamp: number
}

interface ScrollState {
  cache: Record<string, CachedList>

  /** Save products + scroll position for a route key (e.g. "category:vetka-6d87b1") */
  save: (key: string, data: Omit<CachedList, 'timestamp'>) => void

  /** Get cached data if still fresh (< 5 min) */
  get: (key: string) => CachedList | null

  /** Clear a specific key */
  clear: (key: string) => void
}

const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

export const useScrollStore = create<ScrollState>((set, get) => ({
  cache: {},

  save: (key, data) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { ...data, timestamp: Date.now() },
      },
    })),

  get: (key) => {
    const entry = get().cache[key]
    if (!entry) return null
    if (Date.now() - entry.timestamp > MAX_AGE_MS) return null
    return entry
  },

  clear: (key) =>
    set((state) => {
      const next = { ...state.cache }
      delete next[key]
      return { cache: next }
    }),
}))
