// frontend/src/services/categoryService.ts
import { Category } from '@/types'
import { get } from './api'

export const categoryService = {
    async getCategories(): Promise<Category[]> {
        const response = await get<{ success: boolean; data: Category[] }>('/categories')
        return response.data
    },

    async getCategoryBySlug(slug: string): Promise<Category> {
        const response = await get<{ success: boolean; data: Category }>(`/categories/${slug}`)
        return response.data
    },
}