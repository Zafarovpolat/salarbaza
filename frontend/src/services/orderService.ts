import { Order } from '@/types'
import { get, post, patch } from './api'

interface OrderItem {
    productId: string
    quantity: number
    colorId?: string
}

interface CreateOrderData {
    deliveryType: 'PICKUP' | 'DELIVERY'
    customerFirstName: string
    customerLastName?: string
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
        const response = await post<{ success: boolean; data: Order }>('/orders', data)
        return response.data
    },

    async cancelOrder(id: string): Promise<Order> {
        const response = await patch<{ success: boolean; data: Order }>(`/orders/${id}/cancel`, {})
        return response.data
    },
}