import { Router, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()
router.use(authMiddleware)

router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: { addresses: { orderBy: { isDefault: 'desc' } } },
        })
        res.json({ success: true, data: user })
    } catch (error) {
        next(error)
    }
})

router.patch('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            phone: z.string().optional(),
            language: z.enum(['uz', 'ru']).optional(),
        }).parse(req.body)

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data,
        })
        res.json({ success: true, data: user })
    } catch (error) {
        next(error)
    }
})

router.get('/favorites', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user!.id },
            include: { product: { include: { images: true, colors: true } } },
            orderBy: { createdAt: 'desc' },
        })
        res.json({ success: true, data: favorites.map(f => f.product) })
    } catch (error) {
        next(error)
    }
})

router.post('/favorites/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product) throw new AppError('Product not found', 404)

        await prisma.favorite.upsert({
            where: { userId_productId: { userId: req.user!.id, productId } },
            create: { userId: req.user!.id, productId },
            update: {},
        })
        res.json({ success: true, message: 'Added to favorites' })
    } catch (error) {
        next(error)
    }
})

router.delete('/favorites/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params
        await prisma.favorite.deleteMany({ where: { userId: req.user!.id, productId } })
        res.json({ success: true, message: 'Removed from favorites' })
    } catch (error) {
        next(error)
    }
})

export default router