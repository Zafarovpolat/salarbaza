import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'
import { generateOrderNumber, serializeBigInt } from '../utils/helpers'
import { OrderStatus } from '@prisma/client'
import { sendOrderNotification } from '../services/telegramService'
import { logger } from '../utils/logger'

const router = Router()
router.use(authMiddleware)

// ✅ ИСПРАВЛЕНО: добавлен variantId в items
const createOrderSchema = z.object({
    deliveryType: z.enum(['PICKUP', 'DELIVERY']),
    customerFirstName: z.string().min(2),
    customerLastName: z.string().optional(),
    customerPhone: z.string().min(9),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    customerNote: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'PAYME', 'CLICK', 'UZUM']),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        colorId: z.string().optional(),
        variantId: z.string().optional(),   // ✅ ДОБАВЛЕНО
    })).min(1, 'Cart is empty'),
}).refine(
    (data) => data.address || data.latitude,
    { message: 'Address or location required', path: ['address'] }
)

// ==================== GET ALL ORDERS ====================
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user!.id },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        })
        res.json({ success: true, data: serializeBigInt(orders) })
    } catch (error) {
        next(error)
    }
})

// ==================== GET ORDER BY ID ====================
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findFirst({
            where: { id, userId: req.user!.id },
            include: { items: true },
        })
        if (!order) throw new AppError('Order not found', 404)
        res.json({ success: true, data: serializeBigInt(order) })
    } catch (error) {
        next(error)
    }
})

// ==================== CREATE ORDER ====================
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        logger.info('📦 === NEW ORDER REQUEST ===')
        logger.info(`📦 Body: ${JSON.stringify(req.body)}`)
        logger.info(`👤 User ID: ${req.user?.id}`)

        const parseResult = createOrderSchema.safeParse(req.body)

        if (!parseResult.success) {
            logger.error(`❌ Validation failed: ${JSON.stringify(parseResult.error.errors)}`)
            throw new AppError(
                `Validation error: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
                400
            )
        }

        const data = parseResult.data
        logger.info('✅ Validation passed')

        const productIds = data.items.map(item => item.productId)
        logger.info(`🛒 Product IDs: ${productIds.join(', ')}`)

        // ✅ ИСПРАВЛЕНО: загружаем products с variants и category wholesale
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
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
        })
        logger.info(`📦 Found ${products.length} products`)

        if (products.length === 0) {
            throw new AppError('No valid products found', 400)
        }

        const productMap = new Map(products.map(p => [p.id, p]))

        let subtotal = 0
        let totalDiscount = 0

        const orderItems = data.items.map(item => {
            const product = productMap.get(item.productId)
            if (!product) {
                throw new AppError(`Product ${item.productId} not found`, 400)
            }

            // ✅ Вариант (размер)
            const variant = item.variantId
                ? product.variants.find(v => v.id === item.variantId)
                : null

            if (item.variantId && !variant) {
                logger.warn(`⚠️ Variant ${item.variantId} not found for product ${item.productId}`)
            }

            // ✅ Цвет
            const color = item.colorId
                ? product.colors.find(c => c.id === item.colorId)
                : null

            const priceModifier = color?.priceModifier || 0

            // ✅ Цена: из варианта или базовая + модификатор цвета
            const basePrice = variant ? variant.price : product.price
            const unitPrice = basePrice + priceModifier

            // ✅ Оптовая скидка из категории
            let wholesaleDiscountPercent = 0
            const tiers = (product.category as any)?.wholesaleTemplate?.tiers || []
            if (tiers.length > 0) {
                const sortedTiers = [...tiers].sort(
                    (a: any, b: any) => b.minQuantity - a.minQuantity
                )
                for (const tier of sortedTiers) {
                    if (item.quantity >= tier.minQuantity) {
                        wholesaleDiscountPercent = tier.discountPercent
                        break
                    }
                }
            }

            const discountPerUnit = Math.round(
                unitPrice * wholesaleDiscountPercent / 100
            )
            const finalPrice = unitPrice - discountPerUnit
            const itemTotal = finalPrice * item.quantity
            const itemDiscount = discountPerUnit * item.quantity

            subtotal += unitPrice * item.quantity
            totalDiscount += itemDiscount

            logger.info(
                `  📦 ${product.code}: base=${basePrice} + color=${priceModifier} = ${unitPrice}` +
                `${variant ? ` (variant: ${variant.size})` : ''}` +
                `${wholesaleDiscountPercent > 0 ? ` -${wholesaleDiscountPercent}%` : ''}` +
                ` × ${item.quantity} = ${itemTotal}`
            )

            return {
                productId: item.productId,
                variantId: variant?.id || null,          // ✅ ДОБАВЛЕНО
                variantSize: variant?.size || null,      // ✅ ДОБАВЛЕНО
                productName: product.nameRu,
                productCode: product.code,
                productImage: product.images[0]?.url || null,
                colorName: color?.nameRu || null,
                price: finalPrice,
                quantity: item.quantity,
                total: itemTotal,
            }
        })

        logger.info(`💰 Subtotal: ${subtotal}, Discount: ${totalDiscount}`)

        // ✅ Расчёт доставки (после скидки)
        const totalAfterDiscount = subtotal - totalDiscount
        const deliveryFee =
            data.deliveryType === 'DELIVERY' && totalAfterDiscount < config.freeDeliveryThreshold
                ? config.deliveryFee
                : 0

        const total = totalAfterDiscount + deliveryFee

        // Адрес
        const deliveryAddress = data.address || data.latitude
            ? { address: data.address || 'Геолокация', lat: data.latitude, lng: data.longitude }
            : Prisma.JsonNull

        // Полное имя
        const customerName = data.customerLastName
            ? `${data.customerFirstName} ${data.customerLastName}`
            : data.customerFirstName

        logger.info('📝 Creating order in database...')

        // ✅ Создаём заказ
        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId: req.user!.id,
                status: OrderStatus.PENDING,
                subtotal,
                deliveryFee,
                discount: totalDiscount,           // ✅ ИСПРАВЛЕНО (было 0)
                total,                              // ✅ ИСПРАВЛЕНО (учитывает скидку)
                deliveryType: data.deliveryType,
                deliveryAddress,
                customerFirstName: data.customerFirstName,
                customerLastName: data.customerLastName || null,
                customerName,
                customerPhone: data.customerPhone,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                customerNote: data.customerNote,
                paymentMethod: data.paymentMethod,
                items: { create: orderItems },
            },
            include: { items: true, user: true },
        })

        logger.info(`✅ Order created: ${order.orderNumber} | Total: ${total} | Discount: ${totalDiscount}`)

        // Отправляем уведомление
        try {
            await sendOrderNotification(order)
            logger.info('📨 Notification sent')
        } catch (notifError: any) {
            logger.error(`⚠️ Notification failed: ${notifError.message}`)
            // Не прерываем — заказ уже создан
        }

        res.status(201).json({ success: true, data: serializeBigInt(order) })
    } catch (error: any) {
        logger.error(`❌ === ORDER ERROR ===`)
        logger.error(`❌ Message: ${error.message}`)
        logger.error(`❌ Stack: ${error.stack}`)
        next(error)
    }
})

// ==================== CANCEL ORDER ====================
router.patch('/:id/cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const order = await prisma.order.findFirst({
            where: { id, userId: req.user!.id },
        })
        if (!order) throw new AppError('Order not found', 404)
        if (order.status !== OrderStatus.PENDING) {
            throw new AppError('Cannot cancel this order', 400)
        }

        const updated = await prisma.order.update({
            where: { id },
            data: {
                status: OrderStatus.CANCELLED,
                cancelledAt: new Date(),
            },
            include: { items: true },
        })
        res.json({ success: true, data: serializeBigInt(updated) })
    } catch (error) {
        next(error)
    }
})

export default router