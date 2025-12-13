// frontend/src/services/orderService.ts
import { Order } from '@/types'
import { get, post, patch } from './api'

interface CreateOrderData {
    name: string
    phone: string
    address: string
    comment?: string
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
        const response = await post<{ success: boolean; data: Order }>('/orders', {
            deliveryType: 'DELIVERY',
            paymentMethod: 'CASH',
            customerName: data.name,
            customerPhone: data.phone,
            address: data.address,
            customerNote: data.comment,
        })
        return response.data
    },

    async cancelOrder(id: string): Promise<Order> {
        const response = await patch<{ success: boolean; data: Order }>(`/orders/${id}/cancel`, {})
        return response.data
    },
}