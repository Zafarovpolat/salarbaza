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

// ✅ FIX: Обновлённая валидация — без обязательных deliveryType, items
const createOrderSchema = z.object({
    // ✅ Принимаем ОБА формата имени
    customerName: z.string().min(2).optional(),
    customerFirstName: z.string().min(2).optional(),
    customerLastName: z.string().optional(),
    customerPhone: z.string().min(9),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    customerNote: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'PAYME', 'CLICK', 'UZUM']),
    // ✅ items теперь optional — если нет, берём из корзины
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        colorId: z.string().optional(),
        variantId: z.string().optional(),
    })).optional(),
}).refine(
    // ✅ Хотя бы одно имя должно быть
    (data) => data.customerName || data.customerFirstName,
    { message: 'Customer name is required', path: ['customerName'] }
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

        // ✅ FIX: Определяем имя клиента (поддержка обоих форматов)
        const customerFirstName = data.customerFirstName || data.customerName?.split(' ')[0] || ''
        const customerLastName = data.customerLastName || data.customerName?.split(' ').slice(1).join(' ') || null
        const customerName = data.customerName || 
            (customerLastName ? `${customerFirstName} ${customerLastName}` : customerFirstName)

        // ✅ FIX: Получаем items — из тела запроса ИЛИ из корзины
        let itemsToProcess = data.items

        if (!itemsToProcess || itemsToProcess.length === 0) {
            logger.info('🛒 No items in request, loading from cart...')

            const cart = await prisma.cart.findUnique({
                where: { userId: req.user!.id },
                include: {
                    items: {
                        include: {
                            product: true,
                            variant: true,
                        },
                    },
                },
            })

            if (!cart || cart.items.length === 0) {
                throw new AppError('Cart is empty', 400)
            }

            itemsToProcess = cart.items.map(ci => ({
                productId: ci.productId,
                quantity: ci.quantity,
                colorId: ci.colorId || undefined,
                variantId: ci.variantId || undefined,
            }))

            logger.info(`🛒 Loaded ${itemsToProcess.length} items from cart`)
        }

        const productIds = itemsToProcess.map(item => item.productId)
        logger.info(`🛒 Product IDs: ${productIds.join(', ')}`)

        // Загружаем products с variants и category wholesale
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

        const orderItems = itemsToProcess.map(item => {
            const product = productMap.get(item.productId)
            if (!product) {
                throw new AppError(`Product ${item.productId} not found`, 400)
            }

            // Вариант (размер)
            const variant = item.variantId
                ? product.variants.find(v => v.id === item.variantId)
                : null

            if (item.variantId && !variant) {
                logger.warn(`⚠️ Variant ${item.variantId} not found for product ${item.productId}`)
            }

            // Цвет
            const color = item.colorId
                ? product.colors.find(c => c.id === item.colorId)
                : null

            const priceModifier = color?.priceModifier || 0

            // Цена: из варианта или базовая + модификатор цвета
            const basePrice = variant ? variant.price : product.price
            const unitPrice = basePrice + priceModifier

            // Оптовая скидка из категории
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
                variantId: variant?.id || null,
                variantSize: variant?.size || null,
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

        // ✅ FIX: Доставка убрана — всегда 0
        const total = subtotal - totalDiscount

        // Адрес
        const deliveryAddress = data.address || data.latitude
            ? { address: data.address || 'Геолокация', lat: data.latitude, lng: data.longitude }
            : Prisma.JsonNull

        logger.info('📝 Creating order in database...')

        // Создаём заказ
        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId: req.user!.id,
                status: OrderStatus.PENDING,
                subtotal,
                deliveryFee: 0,                          // ✅ FIX: всегда 0
                discount: totalDiscount,
                total,
                deliveryType: 'PICKUP',                  // ✅ FIX: всегда PICKUP
                deliveryAddress,
                customerFirstName,
                customerLastName: customerLastName || null,
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

        // ✅ FIX: Очищаем корзину после создания заказа
        try {
            const cart = await prisma.cart.findUnique({
                where: { userId: req.user!.id },
            })
            if (cart) {
                await prisma.cartItem.deleteMany({
                    where: { cartId: cart.id },
                })
                logger.info('🛒 Cart cleared')
            }
        } catch (cartError: any) {
            logger.warn(`⚠️ Failed to clear cart: ${cartError.message}`)
        }

        // Отправляем уведомление
        try {
            await sendOrderNotification(order)
            logger.info('📨 Notification sent')
        } catch (notifError: any) {
            logger.error(`⚠️ Notification failed: ${notifError.message}`)
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