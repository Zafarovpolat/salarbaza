import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authMiddleware)

const addToCartSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive().default(1),
    colorId: z.string().optional(),
})

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let cart = await prisma.cart.findUnique({
            where: { userId: req.user!.id },
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
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: req.user!.id },
                include: { items: { include: { product: { include: { images: true, colors: true } } } } },
            })
        }

        const items = cart.items.map(item => {
            const color = item.colorId ? item.product.colors.find(c => c.id === item.colorId) : null
            const priceModifier = color?.priceModifier || 0
            const unitPrice = item.product.price + priceModifier
            return { ...item, color, unitPrice, totalPrice: unitPrice * item.quantity }
        })

        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

        res.json({ success: true, data: { id: cart.id, items, itemCount, subtotal } })
    } catch (error) {
        next(error)
    }
})

router.post('/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { productId, quantity, colorId } = addToCartSchema.parse(req.body)

        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product || !product.isActive) throw new AppError('Product not found', 404)
        if (!product.inStock) throw new AppError('Product is out of stock', 400)

        let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
        if (!cart) cart = await prisma.cart.create({ data: { userId: req.user!.id } })

        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId, colorId: colorId || null },
        })

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            })
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, colorId, quantity },
            })
        }

        res.json({ success: true, message: 'Added to cart' })
    } catch (error) {
        next(error)
    }
})

router.patch('/items/:itemId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { itemId } = req.params
        const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(req.body)

        const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
        if (!cart) throw new AppError('Cart not found', 404)

        const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } })
        if (!item) throw new AppError('Cart item not found', 404)

        await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
        res.json({ success: true, message: 'Cart updated' })
    } catch (error) {
        next(error)
    }
})

router.delete('/items/:itemId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { itemId } = req.params
        const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
        if (!cart) throw new AppError('Cart not found', 404)

        await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } })
        res.json({ success: true, message: 'Item removed' })
    } catch (error) {
        next(error)
    }
})

router.delete('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } })
        if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
        res.json({ success: true, message: 'Cart cleared' })
    } catch (error) {
        next(error)
    }
})

export default router