import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as cartService from '../services/cartService'

export async function getCart(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const cart = await cartService.getCart(req.user!.id)
        res.json({ success: true, data: cart })
    } catch (error) {
        next(error)
    }
}

export async function addItem(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { productId, quantity, colorId } = req.body

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'productId is required',
            })
        }

        const cart = await cartService.addToCart(req.user!.id, {
            productId,
            quantity: quantity || 1,
            colorId,
        })

        res.json({ success: true, data: cart })
    } catch (error) {
        next(error)
    }
}

export async function updateItem(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { itemId } = req.params
        const { quantity } = req.body

        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required',
            })
        }

        const cart = await cartService.updateCartItem(req.user!.id, itemId, quantity)
        res.json({ success: true, data: cart })
    } catch (error) {
        next(error)
    }
}

export async function removeItem(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const { itemId } = req.params
        const cart = await cartService.removeFromCart(req.user!.id, itemId)
        res.json({ success: true, data: cart })
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
        res.json({ success: true, message: 'Cart cleared' })
    } catch (error) {
        next(error)
    }
}