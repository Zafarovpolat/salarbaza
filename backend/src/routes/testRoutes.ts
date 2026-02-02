import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { generateOrderNumber, serializeBigInt } from '../utils/helpers'

const router = Router()

// TEST endpoint - БЕЗ авторизации для тестирования
router.post('/test-order', async (req, res, next) => {
    try {
        logger.warn('🧪 TEST ORDER ENDPOINT CALLED')
        logger.warn('🧪 Body:', JSON.stringify(req.body))
        logger.warn('🧪 Headers:', JSON.stringify({
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
            'origin': req.headers['origin']
        }))

        // Найдём первого пользователя или создадим тестового
        let testUser = await prisma.user.findFirst()

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    telegramId: BigInt(999999999),
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser'
                }
            })
        }

        logger.warn(`🧪 Using test user: ${testUser.id}`)

        // Создадим простой заказ
        const orderNumber = generateOrderNumber()

        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: testUser.id,
                customerName: req.body.customerFirstName || 'Test',
                customerPhone: req.body.customerPhone || '+998901234567',
                deliveryType: req.body.deliveryType || 'PICKUP',
                paymentMethod: req.body.paymentMethod || 'CASH',
                status: 'PENDING',
                subtotal: 100000,
                deliveryFee: 0,
                total: 100000,
                items: {
                    create: []
                }
            },
            include: {
                items: true,
                user: true
            }
        })

        logger.warn('🧪 ✅ Test order created:', order.orderNumber)

        res.json({
            success: true,
            message: 'Test order created successfully',
            data: serializeBigInt(order)
        })
    } catch (error: any) {
        logger.error('🧪 ❌ Test order error:', {
            message: error?.message,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n')
        })
        res.status(500).json({
            success: false,
            message: error?.message || 'Test failed'
        })
    }
})

export default router
