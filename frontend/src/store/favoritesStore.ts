// frontend/src/store/favoritesStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'

interface FavoritesState {
    favorites: Product[]

    addFavorite: (product: Product) => void
    removeFavorite: (productId: string) => void
    toggleFavorite: (product: Product) => void
    isFavorite: (productId: string) => boolean
    clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favorites: [],

            addFavorite: (product) => {
                const { favorites } = get()
                if (!favorites.find(p => p.id === product.id)) {
                    set({ favorites: [...favorites, product] })
                }
            },

            removeFavorite: (productId) => {
                set({ favorites: get().favorites.filter(p => p.id !== productId) })
            },

            toggleFavorite: (product) => {
                const { favorites } = get()
                const exists = favorites.find(p => p.id === product.id)
                if (exists) {
                    set({ favorites: favorites.filter(p => p.id !== product.id) })
                } else {
                    set({ favorites: [...favorites, product] })
                }
            },

            isFavorite: (productId) => {
                return get().favorites.some(p => p.id === productId)
            },

            clearFavorites: () => set({ favorites: [] }),
        }),
        {
            name: 'dekorhouse-favorites',
        }
    )
)