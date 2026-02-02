import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

// Получить оптовые цены для товара
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                wholesaleTemplate: {
                    include: {
                        tiers: {
                            orderBy: { minQuantity: 'asc' }
                        }
                    }
                }
            }
        })

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        // Если у товара нет шаблона, берём дефолтный
        let tiers = product.wholesaleTemplate?.tiers || []

        if (tiers.length === 0) {
            const defaultTemplate = await prisma.wholesalePriceTemplate.findFirst({
                where: { isDefault: true },
                include: {
                    tiers: {
                        orderBy: { minQuantity: 'asc' }
                    }
                }
            })
            tiers = defaultTemplate?.tiers || []
        }

        // Рассчитываем цены для каждого порога
        const wholesalePrices = tiers.map(tier => ({
            minQuantity: tier.minQuantity,
            discountPercent: tier.discountPercent,
            pricePerUnit: Math.round(product.price * (1 - tier.discountPercent / 100))
        }))

        res.json({
            success: true,
            data: {
                productId: product.id,
                basePrice: product.price,
                wholesalePrices
            }
        })
    } catch (error) {
        console.error('Wholesale prices error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Рассчитать цену для конкретного количества
router.get('/calculate', async (req, res) => {
    try {
        const { productId, quantity } = req.query

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: 'productId and quantity required' })
        }

        const qty = parseInt(quantity as string)

        const product = await prisma.product.findUnique({
            where: { id: productId as string },
            include: {
                wholesaleTemplate: {
                    include: {
                        tiers: {
                            orderBy: { minQuantity: 'desc' }
                        }
                    }
                }
            }
        })

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        let tiers = product.wholesaleTemplate?.tiers || []

        if (tiers.length === 0) {
            const defaultTemplate = await prisma.wholesalePriceTemplate.findFirst({
                where: { isDefault: true },
                include: {
                    tiers: {
                        orderBy: { minQuantity: 'desc' }
                    }
                }
            })
            tiers = defaultTemplate?.tiers || []
        }

        const applicableTier = tiers.find(tier => qty >= tier.minQuantity)

        const discountPercent = applicableTier?.discountPercent || 0
        const pricePerUnit = Math.round(product.price * (1 - discountPercent / 100))
        const totalPrice = pricePerUnit * qty
        const savings = (product.price * qty) - totalPrice

        res.json({
            success: true,
            data: {
                productId: product.id,
                quantity: qty,
                basePrice: product.price,
                discountPercent,
                pricePerUnit,
                totalPrice,
                savings
            }
        })
    } catch (error) {
        console.error('Calculate price error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Создать дефолтный шаблон (вызвать один раз)
router.post('/seed-default', async (req, res) => {
    try {
        const existing = await prisma.wholesalePriceTemplate.findFirst({
            where: { isDefault: true }
        })

        if (existing) {
            return res.json({ success: true, message: 'Default template already exists', data: existing })
        }

        const template = await prisma.wholesalePriceTemplate.create({
            data: {
                name: 'Стандартный',
                description: 'Базовые оптовые скидки для всех товаров',
                isDefault: true,
                tiers: {
                    create: [
                        { minQuantity: 5, discountPercent: 5 },
                        { minQuantity: 10, discountPercent: 10 },
                        { minQuantity: 20, discountPercent: 15 },
                        { minQuantity: 50, discountPercent: 20 },
                    ]
                }
            },
            include: { tiers: true }
        })

        res.json({ success: true, data: template })
    } catch (error) {
        console.error('Seed error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

export default router