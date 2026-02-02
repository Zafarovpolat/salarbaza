import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page = '1',
            limit = '20',
            category,
            minPrice,
            maxPrice,
            sortBy = 'newest',
            inStock,
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const skip = (pageNum - 1) * limitNum

        const where: Prisma.ProductWhereInput = { isActive: true }

        if (category) {
            const cat = await prisma.category.findUnique({ where: { slug: category as string } })
            if (cat) where.categoryId = cat.id
        }

        if (minPrice) where.price = { ...where.price as object, gte: parseInt(minPrice as string) }
        if (maxPrice) where.price = { ...where.price as object, lte: parseInt(maxPrice as string) }
        if (inStock === 'true') where.inStock = true

        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
        if (sortBy === 'price_asc') orderBy = { price: 'asc' }
        if (sortBy === 'price_desc') orderBy = { price: 'desc' }
        if (sortBy === 'popular') orderBy = { viewCount: 'desc' }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    images: { orderBy: { sortOrder: 'asc' } },
                    colors: true,
                    category: true,
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma.product.count({ where }),
        ])

        res.json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        })
    } catch (error) {
        next(error)
    }
})

router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = '10' } = req.query
        const products = await prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            include: { images: { orderBy: { sortOrder: 'asc' } }, colors: true },
            orderBy: { viewCount: 'desc' },
            take: parseInt(limit as string),
        })
        res.json({ success: true, data: products })
    } catch (error) {
        next(error)
    }
})

router.get('/new', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = '10' } = req.query
        const products = await prisma.product.findMany({
            where: { isActive: true, isNew: true },
            include: { images: { orderBy: { sortOrder: 'asc' } }, colors: true },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
        })
        res.json({ success: true, data: products })
    } catch (error) {
        next(error)
    }
})

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q, limit = '20' } = req.query
        if (!q) return res.json({ success: true, data: [] })

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { nameRu: { contains: q as string, mode: 'insensitive' } },
                    { nameUz: { contains: q as string, mode: 'insensitive' } },
                    { code: { contains: q as string, mode: 'insensitive' } },
                ],
            },
            include: { images: { orderBy: { sortOrder: 'asc' } }, colors: true },
            take: parseInt(limit as string),
        })
        res.json({ success: true, data: products })
    } catch (error) {
        next(error)
    }
})

// ✅ SALE — ПЕРЕД /:slug и /:id/recommendations
router.get('/sale', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = '10' } = req.query
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                oldPrice: { not: null }
            },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                colors: true
            },
            orderBy: { viewCount: 'desc' },
            take: parseInt(limit as string),
        })
        res.json({ success: true, data: products })
    } catch (error) {
        next(error)
    }
})

// РЕКОМЕНДАЦИИ
router.get('/:id/recommendations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { limit = '8' } = req.query

        const currentProduct = await prisma.product.findUnique({
            where: { id },
            select: { id: true, categoryId: true, price: true }
        })

        if (!currentProduct) {
            return res.json({ success: true, data: [] })
        }

        const recommendations = await prisma.product.findMany({
            where: {
                isActive: true,
                id: { not: id },
                OR: [
                    { categoryId: currentProduct.categoryId },
                    {
                        price: {
                            gte: Math.round(currentProduct.price * 0.7),
                            lte: Math.round(currentProduct.price * 1.3)
                        }
                    }
                ]
            },
            include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                colors: true
            },
            orderBy: [
                { isFeatured: 'desc' },
                { viewCount: 'desc' }
            ],
            take: parseInt(limit as string)
        })

        res.json({ success: true, data: recommendations })
    } catch (error) {
        next(error)
    }
})

// /:slug — ВСЕГДА В КОНЦЕ!
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                colors: true,
                category: true,
            },
        })

        if (!product || !product.isActive) {
            throw new AppError('Product not found', 404)
        }

        await prisma.product.update({
            where: { id: product.id },
            data: { viewCount: { increment: 1 } },
        })

        res.json({ success: true, data: product })
    } catch (error) {
        next(error)
    }
})

export default router