import { describe, it, expect } from 'vitest'
import { parsePagination, parseSearchQuery, LIMITS } from './pagination'

describe('parsePagination', () => {
  it('defaults', () => {
    const p = parsePagination({})
    expect(p.page).toBe(1)
    expect(p.limit).toBe(LIMITS.DEFAULT_PUBLIC)
    expect(p.skip).toBe(0)
  })

  it('clamps page <1 to 1', () => {
    const p = parsePagination({ page: '0', limit: '10' })
    expect(p.page).toBe(1)
    expect(p.skip).toBe(0)
  })

  it('handles NaN page', () => {
    const p = parsePagination({ page: 'abc', limit: '10' })
    expect(p.page).toBe(1)
  })

  it('handles NaN limit', () => {
    const p = parsePagination({ page: '1', limit: 'xyz' })
    expect(p.limit).toBe(LIMITS.DEFAULT_PUBLIC)
  })

  it('clamps limit <1', () => {
    const p = parsePagination({ page: '1', limit: '0' })
    expect(p.limit).toBe(LIMITS.DEFAULT_PUBLIC)
  })

  it('clamps limit too big', () => {
    const p = parsePagination({ page: '1', limit: '1000' }, { maxLimit: 100 })
    expect(p.limit).toBe(100)
  })

  it('public product list max 100', () => {
    const p = parsePagination({ page: '1', limit: '200' }, { maxLimit: LIMITS.PUBLIC_PRODUCT_LIST })
    expect(p.limit).toBe(100)
  })

  it('public search max 50', () => {
    const p = parsePagination({ page: '1', limit: '100' }, { maxLimit: LIMITS.PUBLIC_SEARCH })
    expect(p.limit).toBe(50)
  })

  it('admin list max 200', () => {
    const p = parsePagination({ page: '1', limit: '500' }, { maxLimit: LIMITS.ADMIN_LIST })
    expect(p.limit).toBe(200)
  })

  it('offset overflow protection', () => {
    const p = parsePagination({ page: '10000', limit: '100' })
    expect(p.skip).toBeLessThanOrEqual(LIMITS.MAX_OFFSET)
  })

  it('calculates skip', () => {
    const p = parsePagination({ page: '3', limit: '20' })
    expect(p.skip).toBe(40)
  })
})

describe('parseSearchQuery', () => {
  it('returns undefined for missing', () => {
    expect(parseSearchQuery({})).toBeUndefined()
  })

  it('trims', () => {
    expect(parseSearchQuery({ q: '  hello  ' })).toBe('hello')
  })

  it('clamps very long query', () => {
    const long = 'a'.repeat(500)
    const q = parseSearchQuery({ q: long })
    expect(q!.length).toBe(LIMITS.MAX_SEARCH_LENGTH)
  })

  it('empty after trim -> undefined', () => {
    expect(parseSearchQuery({ q: '   ' })).toBeUndefined()
  })
})
