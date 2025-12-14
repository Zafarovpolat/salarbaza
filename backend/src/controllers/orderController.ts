import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as orderService from '../services/orderService'
import { sendOrderNotification } from '../services/telegramService'
import { z } from 'zod'
import { DeliveryType, PaymentMethod } from '@prisma/client'

const createOrderSchema = z.object({
    deliveryType: z.enum(['PICKUP', 'DELIVERY']),
    customerName: z.string().min(2),
    customerPhone: z.string().min(9),
    address: z.string().optional(),
    customerNote: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'PAYME', 'CLICK', 'UZUM']),
})

export async function getOrders(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const orders = await orderService.getUserOrders(req.user!.id)
        res.json({ success: true, data: orders })
    } catch (error) {
        next(error)
    }
}

export async function getOrderById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params
        const order = await orderService.getOrderById(req.user!.id, id)
        res.json({ success: true, data: order })
    } catch (error) {
        next(error)
    }
}

export async function createOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const validationResult = createOrderSchema.safeParse(req.body)

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationResult.error.errors,
            })
        }

        const data = validationResult.data

        // Явно приводим к типам Prisma
        const orderData = {
            deliveryType: data.deliveryType as DeliveryType,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            paymentMethod: data.paymentMethod as PaymentMethod,
            address: data.address,
            customerNote: data.customerNote,
        }

        const order = await orderService.createOrder(req.user!.id, orderData)

        try {
            await sendOrderNotification(order)
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError)
        }

        res.status(201).json({ success: true, data: order })
    } catch (error) {
        next(error)
    }
}

export async function cancelOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params
        const order = await orderService.cancelOrder(req.user!.id, id)
        res.json({ success: true, data: order })
    } catch (error) {
        next(error)
    }
}