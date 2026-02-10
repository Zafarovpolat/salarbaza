// backend/src/services/orderService.ts

import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'
import { generateOrderNumber } from '../utils/helpers'
import { DeliveryType, PaymentMethod, OrderStatus, Prisma } from '@prisma/client'
import { getWholesaleDiscount } from './categoryService'

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
  // Get cart with items + variants + category wholesale
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isMain: true }, take: 1 },
              colors: true,
              variants: true,
              category: {
                include: {
                  wholesaleTemplate: {
                    include: {
                      tiers: { orderBy: { minQuantity: 'asc' } },
                    },
                  },
                },
              },
            },
          },
          variant: true,
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400)
  }

  // Calculate totals with variants and wholesale
  let subtotal = 0
  let totalDiscount = 0

  const orderItems = cart.items.map((item) => {
    const color = item.colorId
      ? item.product.colors.find((c) => c.id === item.colorId)
      : null
    const priceModifier = color?.priceModifier || 0

    // ✅ Цена из варианта или базовая
    const basePrice = item.variant ? item.variant.price : item.product.price
    const unitPrice = basePrice + priceModifier

    // ✅ Оптовая скидка из категории
    const wholesaleDiscountPercent = getWholesaleDiscount(
      item.product.category?.wholesaleTemplate,
      item.quantity
    )
    const discountPerUnit = Math.round(unitPrice * wholesaleDiscountPercent / 100)
    const finalPrice = unitPrice - discountPerUnit

    const itemTotal = finalPrice * item.quantity
    const itemDiscount = discountPerUnit * item.quantity

    subtotal += unitPrice * item.quantity
    totalDiscount += itemDiscount

    return {
      productId: item.productId,
      variantId: item.variantId || null,
      variantSize: item.variant?.size || null,
      productName: item.product.nameRu,
      productCode: item.product.code,
      productImage: item.product.images[0]?.url || null,
      colorName: color?.nameRu || null,
      // ✅ Сохраняем финальную цену (уже со скидкой)
      price: finalPrice,
      quantity: item.quantity,
      total: itemTotal,
    }
  })

  // Calculate delivery fee
  const totalAfterDiscount = subtotal - totalDiscount
  const deliveryFee =
    data.deliveryType === 'DELIVERY' && totalAfterDiscount < config.freeDeliveryThreshold
      ? config.deliveryFee
      : 0

  const total = totalAfterDiscount + deliveryFee

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: OrderStatus.PENDING,
      subtotal,
      deliveryFee,
      discount: totalDiscount,
      total,
      deliveryType: data.deliveryType,
      deliveryAddress: data.address
        ? { address: data.address }
        : Prisma.JsonNull,
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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updateData: Record<string, unknown> = { status }

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