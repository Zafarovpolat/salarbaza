import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { config } from '../config'

const router = Router()

// Простая проверка пароля админа
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const adminPassword = req.headers['x-admin-password'] as string

    if (adminPassword !== config.adminPassword) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    next()
}

// Применяем ко всем роутам
router.use(adminAuth)

// ==================== DASHBOARD ====================
router.get('/stats', async (req, res) => {
    try {
        const [productsCount, categoriesCount, ordersCount, totalRevenue] = await Promise.all([
            prisma.product.count(),
            prisma.category.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: 'DELIVERED' }
            })
        ])

        res.json({
            success: true,
            data: {
                productsCount,
                categoriesCount,
                ordersCount,
                totalRevenue: totalRevenue._sum.total || 0
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// ==================== PRODUCTS ====================
router.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                images: true,
                colors: true
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ success: true, data: products })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.get('/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                images: true,
                colors: true
            }
        })

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        res.json({ success: true, data: product })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.post('/products', async (req, res) => {
    try {
        const { code, slug, nameRu, nameUz, descriptionRu, descriptionUz, categoryId, price, oldPrice, material, dimensions, inStock, stockQuantity, isActive, isNew, isFeatured, images } = req.body

        const product = await prisma.product.create({
            data: {
                code,
                slug: slug || code.toLowerCase().replace(/\s+/g, '-'),
                nameRu,
                nameUz,
                descriptionRu,
                descriptionUz,
                categoryId,
                price: parseInt(price),
                oldPrice: oldPrice ? parseInt(oldPrice) : null,
                material,
                dimensions,
                inStock: inStock ?? true,
                stockQuantity: parseInt(stockQuantity) || 0,
                isActive: isActive ?? true,
                isNew: isNew ?? false,
                isFeatured: isFeatured ?? false,
                images: images ? {
                    create: images.map((img: any, index: number) => ({
                        url: img.url,
                        alt: img.alt || nameRu,
                        sortOrder: index,
                        isMain: index === 0
                    }))
                } : undefined
            },
            include: {
                category: true,
                images: true
            }
        })

        res.status(201).json({ success: true, data: product })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put('/products/:id', async (req, res) => {
    try {
        const { code, slug, nameRu, nameUz, descriptionRu, descriptionUz, categoryId, price, oldPrice, material, dimensions, inStock, stockQuantity, isActive, isNew, isFeatured } = req.body

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                code,
                slug: slug || (code ? code.toLowerCase().replace(/\\s+/g, '-') : undefined),
                nameRu,
                nameUz,
                descriptionRu,
                descriptionUz,
                categoryId,
                price: parseInt(price),
                oldPrice: oldPrice ? parseInt(oldPrice) : null,
                material,
                dimensions,
                inStock,
                stockQuantity: parseInt(stockQuantity) || 0,
                isActive,
                isNew,
                isFeatured
            },
            include: {
                category: true,
                images: true
            }
        })

        res.json({ success: true, data: product })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.delete('/products/:id', async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id }
        })
        res.json({ success: true, message: 'Product deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Добавить фото к товару
router.post('/products/:id/images', async (req, res) => {
    try {
        const { url, alt, isMain } = req.body

        if (isMain) {
            await prisma.productImage.updateMany({
                where: { productId: req.params.id },
                data: { isMain: false }
            })
        }

        const image = await prisma.productImage.create({
            data: {
                productId: req.params.id,
                url,
                alt,
                isMain: isMain ?? false,
                sortOrder: 0
            }
        })

        res.status(201).json({ success: true, data: image })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.delete('/products/:productId/images/:imageId', async (req, res) => {
    try {
        await prisma.productImage.delete({
            where: { id: req.params.imageId }
        })
        res.json({ success: true, message: 'Image deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// ==================== CATEGORIES ====================
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { products: true } }
            },
            orderBy: { sortOrder: 'asc' }
        })
        res.json({ success: true, data: categories })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.post('/categories', async (req, res) => {
    try {
        const { slug, nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive } = req.body

        const category = await prisma.category.create({
            data: {
                slug,
                nameRu,
                nameUz,
                descriptionRu,
                descriptionUz,
                image,
                sortOrder: sortOrder || 0,
                isActive: isActive ?? true
            }
        })

        res.status(201).json({ success: true, data: category })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.put('/categories/:id', async (req, res) => {
    try {
        const { nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive } = req.body

        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                nameRu,
                nameUz,
                descriptionRu,
                descriptionUz,
                image,
                sortOrder,
                isActive
            }
        })

        res.json({ success: true, data: category })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.delete('/categories/:id', async (req, res) => {
    try {
        const productsCount = await prisma.product.count({
            where: { categoryId: req.params.id }
        })

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${productsCount} products`
            })
        }

        await prisma.category.delete({
            where: { id: req.params.id }
        })
        res.json({ success: true, message: 'Category deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// ==================== ORDERS ====================
router.get('/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
                user: true
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ success: true, data: orders })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body

        const updateData: any = { status }

        if (status === 'CONFIRMED') updateData.confirmedAt = new Date()
        if (status === 'SHIPPED') updateData.shippedAt = new Date()
        if (status === 'DELIVERED') updateData.deliveredAt = new Date()
        if (status === 'CANCELLED') updateData.cancelledAt = new Date()

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: updateData,
            include: { items: true }
        })

        res.json({ success: true, data: order })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

router.delete('/categories/:id', async (req, res) => {
    try {
        // Сначала убираем categoryId у всех товаров этой категории
        await prisma.product.updateMany({
            where: { categoryId: req.params.id },
            data: { categoryId: null }
        })

        // Теперь удаляем категорию
        await prisma.category.delete({
            where: { id: req.params.id }
        })

        res.json({ success: true, message: 'Category deleted' })
    } catch (error) {
        console.error('Delete category error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

export default router