import { Order } from '@/types'
import { get, post, patch } from './api'

interface OrderItem {
    productId: string
    quantity: number
    colorId?: string
    variantId?: string
}

interface CreateOrderData {
    deliveryType?: 'PICKUP' | 'DELIVERY'
    customerFirstName?: string
    customerLastName?: string
    customerName?: string
    customerPhone: string
    address?: string
    latitude?: number
    longitude?: number
    customerNote?: string
    paymentMethod: 'CASH' | 'CARD' | 'PAYME' | 'CLICK' | 'UZUM'
    items: OrderItem[]
}

export const orderService = {
    async getOrders(): Promise<Order[]> {
        const response = await get<{ success: boolean; data: Order[] }>('/orders')
        return response.data
    },

    async getOrderById(id: string): Promise<Order> {
        const response = await get<{ success: boolean; data: Order }>(`/orders/${id}`)
        return response.data
    },

    async createOrder(data: CreateOrderData): Promise<Order> {
        const customerName = data.customerFirstName
            ? `${data.customerFirstName}${data.customerLastName ? ' ' + data.customerLastName : ''}`
            : data.customerName || ''

        // ✅ FIX: items включены в payload
        const payload = {
            customerName,
            customerPhone: data.customerPhone,
            address: data.address,
            customerNote: data.customerNote,
            paymentMethod: data.paymentMethod,
            latitude: data.latitude,
            longitude: data.longitude,
            items: data.items,    // ← ЭТО БЫЛО ПРОПУЩЕНО
        }

        const response = await post<{ success: boolean; data: Order }>('/orders', payload)
        return response.data
    },

    async cancelOrder(id: string): Promise<Order> {
        const response = await patch<{ success: boolean; data: Order }>(`/orders/${id}/cancel`, {})
        return response.data
    },
}