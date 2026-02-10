// frontend/src/store/cartStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductColor, ProductVariant } from '@/types'

interface CartState {
    items: CartItem[]

    // Computed
    itemCount: number
    subtotal: number

    // Actions
    addItem: (
        product: Product,
        quantity?: number,
        color?: ProductColor,
        variant?: ProductVariant  // ✅ НОВОЕ
    ) => void
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void

    // Helpers
    getItemByProduct: (
        productId: string,
        colorId?: string,
        variantId?: string  // ✅ НОВОЕ
    ) => CartItem | undefined
    isInCart: (
        productId: string,
        colorId?: string,
        variantId?: string  // ✅ НОВОЕ
    ) => boolean
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            get itemCount() {
                return get().items.reduce((sum, item) => sum + item.quantity, 0)
            },

            get subtotal() {
                return get().items.reduce((sum, item) => {
                    const colorModifier = item.color?.priceModifier || 0
                    // ✅ Цена из варианта или базовая
                    const basePrice = item.variant?.price || item.product.price
                    const price = basePrice + colorModifier
                    return sum + price * item.quantity
                }, 0)
            },

            addItem: (product, quantity = 1, color, variant) => {
                const { items, getItemByProduct } = get()

                // ✅ Если у товара есть варианты, но вариант не выбран — не добавляем
                if (product.variants && product.variants.length > 0 && !variant) {
                    console.warn('Product has variants but none selected')
                    return
                }

                const existingItem = getItemByProduct(product.id, color?.id, variant?.id)

                if (existingItem) {
                    set({
                        items: items.map(item =>
                            item.id === existingItem.id
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    })
                } else {
                    // ✅ ID теперь включает variantId
                    const newItem: CartItem = {
                        id: `${product.id}-${color?.id || 'default'}-${variant?.id || 'default'}-${Date.now()}`,
                        productId: product.id,
                        product,
                        colorId: color?.id,
                        color,
                        variantId: variant?.id,     // ✅ НОВОЕ
                        variant,                     // ✅ НОВОЕ
                        quantity,
                    }
                    set({ items: [...items, newItem] })
                }
            },

            removeItem: (itemId) => {
                set({ items: get().items.filter(item => item.id !== itemId) })
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId)
                    return
                }

                set({
                    items: get().items.map(item =>
                        item.id === itemId ? { ...item, quantity } : item
                    ),
                })
            },

            clearCart: () => {
                set({ items: [] })
            },

            // ✅ Теперь учитывает variantId
            getItemByProduct: (productId, colorId, variantId) => {
                return get().items.find(
                    item =>
                        item.productId === productId &&
                        item.colorId === (colorId || undefined) &&
                        item.variantId === (variantId || undefined)
                )
            },

            // ✅ Теперь учитывает variantId
            isInCart: (productId, colorId, variantId) => {
                return !!get().getItemByProduct(productId, colorId, variantId)
            },
        }),
        {
            name: 'dekorhouse-cart',
            partialize: (state) => ({ items: state.items }),
        }
    )
)