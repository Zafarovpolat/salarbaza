import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'
import { generateOrderNumber } from '../utils/helpers'
import { DeliveryType, PaymentMethod, OrderStatus } from '@prisma/client'

interface CreateOrderData {
    deliveryType: DeliveryType
    customerName: string
    customerPhone: string
    address?: string
    customerNote?: string
    paymentMethod: PaymentMethod
}

export async function getUserOrders(userId: string) {
    return prisma.order.findMany({
        where: { userId },
        include: {
            items: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
        include: {
            items: true,
            address: true,
        },
    })

    if (!order) {
        throw new AppError('Order not found', 404)
    }

    return order
}

export async function createOrder(userId: string, data: CreateOrderData) {
    // Get cart with items
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: { where: { isMain: true }, take: 1 },
                            colors: true,
                        },
                    },
                },
            },
        },
    })

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400)
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = cart.items.map(item => {
        const color = item.colorId
            ? item.product.colors.find(c => c.id === item.colorId)
            : null
        const priceModifier = color?.priceModifier || 0
        const unitPrice = item.product.price + priceModifier
        const itemTotal = unitPrice * item.quantity
        subtotal += itemTotal

        return {
            productId: item.productId,
            productName: item.product.nameRu, // или nameUz в зависимости от языка
            productCode: item.product.code,
            productImage: item.product.images[0]?.url || null,
            colorName: color?.nameRu || null,
            price: unitPrice,
            quantity: item.quantity,
            total: itemTotal,
        }
    })

    // Calculate delivery fee
    const deliveryFee = data.deliveryType === 'DELIVERY' && subtotal < config.freeDeliveryThreshold
        ? config.deliveryFee
        : 0

    const total = subtotal + deliveryFee

    // Create order
    const order = await prisma.order.create({
        data: {
            orderNumber: generateOrderNumber(),
            userId,
            status: OrderStatus.PENDING,
            subtotal,
            deliveryFee,
            discount: 0,
            total,
            deliveryType: data.deliveryType,
            deliveryAddress: data.address ? { address: data.address } : null,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerNote: data.customerNote,
            paymentMethod: data.paymentMethod,
            items: {
                create: orderItems,
            },
        },
        include: {
            items: true,
            user: true,
        },
    })

    // Clear cart
    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
    })

    return order
}

export async function cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId,
        },
    })

    if (!order) {
        throw new AppError('Order not found', 404)
    }

    // Can only cancel pending orders
    if (order.status !== OrderStatus.PENDING) {
        throw new AppError('Cannot cancel this order', 400)
    }

    return prisma.order.update({
        where: { id: orderId },
        data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
        },
        include: {
            items: true,
        },
    })
}

// Admin functions
export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
) {
    const updateData: any = { status }

    switch (status) {
        case OrderStatus.CONFIRMED:
            updateData.confirmedAt = new Date()
            break
        case OrderStatus.SHIPPED:
            updateData.shippedAt = new Date()
            break
        case OrderStatus.DELIVERED:
            updateData.deliveredAt = new Date()
            break
        case OrderStatus.CANCELLED:
            updateData.cancelledAt = new Date()
            break
    }

    return prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
            items: true,
            user: true,
        },
    })
}