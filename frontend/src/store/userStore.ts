import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Address } from '@/types'

interface UserState {
    user: User | null
    isAuthenticated: boolean

    setUser: (user: User) => void
    updateUser: (data: Partial<User>) => void
    addAddress: (address: Address) => void
    updateAddress: (id: string, data: Partial<Address>) => void
    removeAddress: (id: string) => void
    setDefaultAddress: (id: string) => void
    logout: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),

            updateUser: (data) => {
                const { user } = get()
                if (user) {
                    set({ user: { ...user, ...data } })
                }
            },

            addAddress: (address) => {
                const { user } = get()
                if (user) {
                    const addresses = [...user.addresses, address]
                    set({ user: { ...user, addresses } })
                }
            },

            updateAddress: (id, data) => {
                const { user } = get()
                if (user) {
                    const addresses = user.addresses.map(addr =>
                        addr.id === id ? { ...addr, ...data } : addr
                    )
                    set({ user: { ...user, addresses } })
                }
            },

            removeAddress: (id) => {
                const { user } = get()
                if (user) {
                    const addresses = user.addresses.filter(addr => addr.id !== id)
                    set({ user: { ...user, addresses } })
                }
            },

            setDefaultAddress: (id) => {
                const { user } = get()
                if (user) {
                    const addresses = user.addresses.map(addr => ({
                        ...addr,
                        isDefault: addr.id === id,
                    }))
                    set({ user: { ...user, addresses } })
                }
            },

            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'dekorhouse-user',
        }
    )
)