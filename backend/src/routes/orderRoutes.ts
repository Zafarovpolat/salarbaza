import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'
import { generateOrderNumber } from '../utils/helpers'
import { OrderStatus } from '@prisma/client'

const router = Router()
router.use(authMiddleware)

const createOrderSchema = z.object({
    deliveryType: z.enum(['PICKUP', 'DELIVERY']),
    customerName: z.string().min(2),
    customerPhone: z.string().min(9),
    address: z.string().optional(),
    customerNote: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'PAYME', 'CLICK', 'UZUM']),
})

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user!.id },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        })
        res.json({ success: true, data: orders })
    } catch (error) {
        next(error)
    }
})

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findFirst({
            where: { id, userId: req.user!.id },
            include: { items: true },
        })
        if (!order) throw new AppError('Order not found', 404)
        res.json({ success: true, data: order })
    } catch (error) {
        next(error)
    }
})

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = createOrderSchema.parse(req.body)

        const cart = await prisma.cart.findUnique({
            where: { userId: req.user!.id },
            include: {
                items: {
                    include: {
                        product: { include: { images: { where: { isMain: true }, take: 1 }, colors: true } },
                    },
                },
            },
        })

        if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400)

        let subtotal = 0
        const orderItems = cart.items.map(item => {
            const color = item.colorId ? item.product.colors.find(c => c.id === item.colorId) : null
            const priceModifier = color?.priceModifier || 0
            const unitPrice = item.product.price + priceModifier
            const itemTotal = unitPrice * item.quantity
            subtotal += itemTotal

            return {
                productId: item.productId,
                productName: item.product.nameUz,
                productCode: item.product.code,
                productImage: item.product.images[0]?.url || null,
                colorName: color?.nameUz || null,
                price: unitPrice,
                quantity: item.quantity,
                total: itemTotal,
            }
        })

        const deliveryFee = data.deliveryType === 'DELIVERY' && subtotal < config.freeDeliveryThreshold
            ? config.deliveryFee : 0

        // Исправление: правильная обработка deliveryAddress для Prisma JSON
        const deliveryAddress = data.address
            ? { address: data.address }
            : Prisma.JsonNull

        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId: req.user!.id,
                status: OrderStatus.PENDING,
                subtotal,
                deliveryFee,
                discount: 0,
                total: subtotal + deliveryFee,
                deliveryType: data.deliveryType,
                deliveryAddress,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerNote: data.customerNote,
                paymentMethod: data.paymentMethod,
                items: { create: orderItems },
            },
            include: { items: true },
        })

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

        res.status(201).json({ success: true, data: order })
    } catch (error) {
        next(error)
    }
})

router.patch('/:id/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findFirst({ where: { id, userId: req.user!.id } })
        if (!order) throw new AppError('Order not found', 404)
        if (order.status !== OrderStatus.PENDING) throw new AppError('Cannot cancel this order', 400)

        const updated = await prisma.order.update({
            where: { id },
            data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
            include: { items: true },
        })
        res.json({ success: true, data: updated })
    } catch (error) {
        next(error)
    }
})

export default router