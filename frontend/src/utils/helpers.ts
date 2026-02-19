import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getProductName(product: { nameRu: string; nameUz: string }, lang: 'uz' | 'ru') {
  return lang === 'uz' ? product.nameUz : product.nameRu
}

export function getProductDescription(product: { descriptionRu?: string; descriptionUz?: string }, lang: 'uz' | 'ru') {
  return lang === 'uz' ? product.descriptionUz : product.descriptionRu
}

export function getCategoryName(category: { nameRu: string; nameUz: string }, lang: 'uz' | 'ru') {
  return lang === 'uz' ? category.nameUz : category.nameRu
}

export function getColorName(color: { nameRu: string; nameUz: string }, lang: 'uz' | 'ru') {
  return lang === 'uz' ? color.nameUz : color.nameRu
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Кодирует slug для безопасного использования в URL.
 * Слеши и спецсимволы не ломают роутинг.
 */
export function safeProductUrl(slug: string): string {
  return `/product/${encodeURIComponent(slug)}`
}

/**
 * Декодирует slug из URL параметра
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}