import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import * as cartService from '../services/cartService'

const addToCartSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive().default(1),
    colorId: z.string().optional(),
})

const updateCartItemSchema = z.object({
    quantity: z.number().int().positive(),
})

export async function getCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const cart = await cartService.getCart(req.user!.id)

        res.json({
            success: true,
            data: cart,
        })
    } catch (error) {
        next(error)
    }
}

export async function addToCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const data = addToCartSchema.parse(req.body)
        const cart = await cartService.addToCart(req.user!.id, data)

        res.json({
            success: true,
            data: cart,
        })
    } catch (error) {
        next(error)
    }
}

export async function updateCartItem(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { itemId } = req.params
        const { quantity } = updateCartItemSchema.parse(req.body)

        const cart = await cartService.updateCartItem(req.user!.id, itemId, quantity)

        res.json({
            success: true,
            data: cart,
        })
    } catch (error) {
        next(error)
    }
}

export async function removeFromCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { itemId } = req.params
        const cart = await cartService.removeFromCart(req.user!.id, itemId)

        res.json({
            success: true,
            data: cart,
        })
    } catch (error) {
        next(error)
    }
}

export async function clearCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        await cartService.clearCart(req.user!.id)

        res.json({
            success: true,
            message: 'Cart cleared',
        })
    } catch (error) {
        next(error)
    }
}