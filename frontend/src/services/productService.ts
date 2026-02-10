// frontend/src/services/productService.ts

import { Product, PaginatedResponse } from '@/types'
import api, { get } from './api'

export const productService = {
    async getProducts(params: {
        page?: number
        limit?: number
        categorySlug?: string
        search?: string
        sortBy?: string
        minPrice?: number
        maxPrice?: number
        inStock?: boolean
    } = {}): Promise<PaginatedResponse<Product>> {
        const searchParams = new URLSearchParams()

        if (params.page) searchParams.set('page', String(params.page))
        if (params.limit) searchParams.set('limit', String(params.limit))
        if (params.categorySlug) searchParams.set('category', params.categorySlug)
        if (params.search) searchParams.set('q', params.search)
        if (params.sortBy) searchParams.set('sortBy', params.sortBy)
        if (params.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice))
        if (params.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice))
        if (params.inStock !== undefined) searchParams.set('inStock', String(params.inStock))

        const query = searchParams.toString()
        return get<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
    },

    // ✅ Теперь возвращает variants и category.wholesaleTemplate
    async getProductBySlug(slug: string): Promise<Product> {
        const response = await get<{ success: boolean; data: Product }>(`/products/${slug}`)
        return response.data
    },

    async getFeaturedProducts(limit = 10): Promise<Product[]> {
        const response = await get<{ success: boolean; data: Product[] }>(`/products/featured?limit=${limit}`)
        return response.data
    },

    async getNewProducts(limit = 10): Promise<Product[]> {
        const response = await get<{ success: boolean; data: Product[] }>(`/products/new?limit=${limit}`)
        return response.data
    },

    async searchProducts(query: string, limit = 20): Promise<Product[]> {
        const response = await get<{ success: boolean; data: Product[] }>(
            `/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
        )
        return response.data
    },

    async getSaleProducts(limit: number = 10): Promise<Product[]> {
        const response = await get<{ success: boolean; data: Product[] }>(`/products/sale?limit=${limit}`)
        return response.data
    },
}