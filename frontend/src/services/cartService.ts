// frontend/src/services/cartService.ts

import { Cart, CartItem } from '@/types'
import { get, post, patch, del } from './api'

export const cartService = {
    async getCart(): Promise<Cart> {
        const response = await get<{ success: boolean; data: Cart }>('/cart')
        return response.data
    },

    // ✅ ОБНОВЛЕНО: добавлен variantId
    async addItem(
        productId: string,
        quantity: number = 1,
        colorId?: string,
        variantId?: string
    ): Promise<CartItem> {
        const response = await post<{ success: boolean; data: CartItem }>('/cart/items', {
            productId,
            quantity,
            colorId,
            variantId,  // ✅ НОВОЕ
        })
        return response.data
    },

    async updateItem(itemId: string, quantity: number): Promise<CartItem> {
        const response = await patch<{ success: boolean; data: CartItem }>(`/cart/items/${itemId}`, {
            quantity,
        })
        return response.data
    },

    async removeItem(itemId: string): Promise<void> {
        await del(`/cart/items/${itemId}`)
    },

    async clearCart(): Promise<void> {
        await del('/cart')
    },
}