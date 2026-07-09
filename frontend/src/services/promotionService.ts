// frontend/src/services/promotionService.ts

import { Product, Promotion } from '@/types'
import { get } from './api'

const SPECIAL_OFFER_TYPES = new Set<Promotion['type']>(['SALE', 'LIMITED'])

function sortBySoonestEndDate(a: Promotion, b: Promotion) {
  return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
}

function collectUniqueProducts(promotions: Promotion[]) {
  const productMap = new Map<string, Product>()

  for (const promotion of promotions) {
    for (const product of promotion.products || []) {
      if (product.isActive === false || product.inStock === false) continue
      if (!productMap.has(product.id)) productMap.set(product.id, product)
    }
  }

  return Array.from(productMap.values())
}

export const promotionService = {
  // Получить активные акции (для главной)
  async getActivePromotions(): Promise<Promotion[]> {
    const response = await get<{ success: boolean; data: Promotion[] }>('/promotions')
    return response.data
  },

  // Получить акцию по slug (для отдельной страницы)
  async getPromotionBySlug(slug: string): Promise<Promotion> {
    const encodedSlug = encodeURIComponent(slug)
    const response = await get<{ success: boolean; data: Promotion }>(`/promotions/${encodedSlug}`)
    return response.data
  },

  async getSpecialOfferProducts(limit = 10): Promise<{ products: Product[]; endsAt: string | null }> {
    const promotions = await promotionService.getActivePromotions()
    const specialOfferPromotions = promotions
      .filter((promotion) => SPECIAL_OFFER_TYPES.has(promotion.type))
      .sort(sortBySoonestEndDate)

    if (specialOfferPromotions.length === 0) {
      return { products: [], endsAt: null }
    }

    const fullPromotions = (await Promise.all(
      specialOfferPromotions.map((promotion) =>
        promotionService.getPromotionBySlug(promotion.slug).catch(() => null)
      )
    )).filter((promotion): promotion is Promotion => promotion !== null)

    const products = collectUniqueProducts(fullPromotions).slice(0, limit)
    const endsAt = fullPromotions.sort(sortBySoonestEndDate)[0]?.endDate || null

    return { products, endsAt }
  },
}