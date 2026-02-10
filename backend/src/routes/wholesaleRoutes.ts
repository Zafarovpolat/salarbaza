// backend/src/routes/wholesaleRoutes.ts

import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

// ✅ Получить оптовые цены для товара (через категорию)
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                // ✅ Оптовая цена теперь через категорию
                category: {
                    include: {
                        wholesaleTemplate: {
                            include: {
                                tiers: {
                                    orderBy: { minQuantity: 'asc' }
                                }
                            }
                        }
                    }
                },
                // ✅ Включаем варианты для расчёта цен
                variants: {
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        // ✅ Берём тиры из категории
        let tiers = product.category?.wholesaleTemplate?.tiers || []

        // Если у категории нет шаблона — ищем дефолтный
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

        // ✅ Если есть варианты — рассчитываем для каждого варианта
        if (product.variants.length > 0) {
            const variantPrices = product.variants.map(variant => ({
                variantId: variant.id,
                size: variant.size,
                basePrice: variant.price,
                wholesalePrices: tiers.map(tier => ({
                    minQuantity: tier.minQuantity,
                    discountPercent: tier.discountPercent,
                    pricePerUnit: Math.round(variant.price * (1 - tier.discountPercent / 100))
                }))
            }))

            return res.json({
                success: true,
                data: {
                    productId: product.id,
                    hasVariants: true,
                    basePrice: product.price,
                    variantPrices,
                    // Также общие тиры для справки
                    tiers: tiers.map(tier => ({
                        minQuantity: tier.minQuantity,
                        discountPercent: tier.discountPercent,
                    }))
                }
            })
        }

        // Без вариантов — обычный расчёт
        const wholesalePrices = tiers.map(tier => ({
            minQuantity: tier.minQuantity,
            discountPercent: tier.discountPercent,
            pricePerUnit: Math.round(product.price * (1 - tier.discountPercent / 100))
        }))

        res.json({
            success: true,
            data: {
                productId: product.id,
                hasVariants: false,
                basePrice: product.price,
                wholesalePrices
            }
        })
    } catch (error) {
        console.error('Wholesale prices error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
})

// ✅ Рассчитать цену для конкретного количества
router.get('/calculate', async (req, res) => {
    try {
        const { productId, quantity, variantId } = req.query

        if (!productId || !quantity) {
            return res.status(400).json({ success: false, message: 'productId and quantity required' })
        }

        const qty = parseInt(quantity as string)

        const product = await prisma.product.findUnique({
            where: { id: productId as string },
            include: {
                // ✅ Оптовая через категорию
                category: {
                    include: {
                        wholesaleTemplate: {
                            include: {
                                tiers: {
                                    orderBy: { minQuantity: 'desc' }
                                }
                            }
                        }
                    }
                },
                variants: true,
            }
        })

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }

        // ✅ Определяем базовую цену (из варианта или из товара)
        let basePrice = product.price
        let selectedVariant = null

        if (variantId && typeof variantId === 'string') {
            selectedVariant = product.variants.find(v => v.id === variantId)
            if (selectedVariant) {
                basePrice = selectedVariant.price
            }
        }

        // ✅ Берём тиры из категории
        let tiers = product.category?.wholesaleTemplate?.tiers || []

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
        const pricePerUnit = Math.round(basePrice * (1 - discountPercent / 100))
        const totalPrice = pricePerUnit * qty
        const savings = (basePrice * qty) - totalPrice

        res.json({
            success: true,
            data: {
                productId: product.id,
                variantId: selectedVariant?.id || null,
                variantSize: selectedVariant?.size || null,
                quantity: qty,
                basePrice,
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
                description: 'Базовые оптовые скидки для всех категорий',
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