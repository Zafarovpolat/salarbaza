// frontend/src/services/promotionService.ts

import { Promotion } from '@/types'
import { get } from './api'

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
}