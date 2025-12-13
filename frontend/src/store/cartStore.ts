import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductColor } from '@/types'

interface CartState {
    items: CartItem[]

    // Computed
    itemCount: number
    subtotal: number

    // Actions
    addItem: (product: Product, quantity?: number, color?: ProductColor) => void
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void

    // Helpers
    getItemByProduct: (productId: string, colorId?: string) => CartItem | undefined
    isInCart: (productId: string, colorId?: string) => boolean
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
                    const price = item.product.price + colorModifier
                    return sum + price * item.quantity
                }, 0)
            },

            addItem: (product, quantity = 1, color) => {
                const { items, getItemByProduct } = get()
                const existingItem = getItemByProduct(product.id, color?.id)

                if (existingItem) {
                    set({
                        items: items.map(item =>
                            item.id === existingItem.id
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    })
                } else {
                    const newItem: CartItem = {
                        id: `${product.id}-${color?.id || 'default'}-${Date.now()}`,
                        productId: product.id,
                        product,
                        colorId: color?.id,
                        color,
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

            getItemByProduct: (productId, colorId) => {
                return get().items.find(
                    item => item.productId === productId && item.colorId === (colorId || undefined)
                )
            },

            isInCart: (productId, colorId) => {
                return !!get().getItemByProduct(productId, colorId)
            },
        }),
        {
            name: 'dekorhouse-cart',
            partialize: (state) => ({ items: state.items }),
        }
    )
)