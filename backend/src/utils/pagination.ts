export const LIMITS = {
  PUBLIC_PRODUCT_LIST: 100,
  PUBLIC_SEARCH: 50,
  CATEGORIES_PRODUCTS: 100,
  ADMIN_LIST: 200,
  BITO_CUSTOMER_EMPLOYEE: 200,
  DEFAULT_PUBLIC: 20,
  DEFAULT_ADMIN: 20,
  DEFAULT_SEARCH: 20,
  MAX_SEARCH_LENGTH: 200,
  MAX_OFFSET: 100000, // to prevent offset overflow abuse
}

export interface PaginationOptions {
  defaultLimit?: number
  maxLimit?: number
  defaultPage?: number
  maxPage?: number
  maxSearchLength?: number
}

export interface ParsedPagination {
  page: number
  limit: number
  skip: number
}

export function parsePagination(query: any, opts: PaginationOptions = {}): ParsedPagination {
  const defaultLimit = opts.defaultLimit ?? LIMITS.DEFAULT_PUBLIC
  const maxLimit = opts.maxLimit ?? LIMITS.PUBLIC_PRODUCT_LIST
  const defaultPage = opts.defaultPage ?? 1
  const maxPage = opts.maxPage ?? 10000

  let pageRaw = query.page
  let limitRaw = query.limit

  let page = Number(pageRaw)
  if (!Number.isFinite(page) || Number.isNaN(page)) page = defaultPage
  page = Math.floor(page)
  if (page < 1) page = 1
  if (page > maxPage) page = maxPage

  let limit = Number(limitRaw)
  if (!Number.isFinite(limit) || Number.isNaN(limit)) limit = defaultLimit
  limit = Math.floor(limit)
  if (limit < 1) limit = defaultLimit
  if (limit > maxLimit) limit = maxLimit

  let skip = (page - 1) * limit

  // offset overflow protection
  if (skip > LIMITS.MAX_OFFSET) {
    // clamp page to max allowed
    page = Math.floor(LIMITS.MAX_OFFSET / limit) + 1
    if (page < 1) page = 1
    skip = (page - 1) * limit
  }

  return { page, limit, skip }
}

export function parseSearchQuery(query: any, maxLength = LIMITS.MAX_SEARCH_LENGTH): string | undefined {
  const raw = query.q || query.search || query.query
  if (typeof raw !== 'string') return undefined
  let trimmed = raw.trim()
  if (trimmed.length === 0) return undefined
  if (trimmed.length > maxLength) {
    trimmed = trimmed.slice(0, maxLength)
  }
  return trimmed
}

export function clampLimit(value: any, max: number, defaultValue: number): number {
  let num = Number(value)
  if (!Number.isFinite(num) || Number.isNaN(num)) return defaultValue
  num = Math.floor(num)
  if (num < 1) return defaultValue
  if (num > max) return max
  return num
}
