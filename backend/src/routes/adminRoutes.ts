// backend/src/routes/adminRoutes.ts

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
    const now = new Date()

    const [productsCount, categoriesCount, ordersCount, totalRevenue, activePromotions] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' },
      }),
     Количество активных акций
      prisma.promotion.count({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        productsCount,
        categoriesCount,
        ordersCount,
        totalRevenue: totalRevenue._sum.total || 0,
        activePromotions,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== PRODUCTS ====================
router.get('/products', async (req, res) => {
  try {
    const { categoryId, search } = req.query

    const where: any = {}

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { nameRu: { contains: search, mode: 'insensitive' } },
        { nameUz: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          include: {
            wholesaleTemplate: {
              select: { id: true, name: true },
            },
          },
        },
        images: true,
        colors: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
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
        category: {
          include: {
            wholesaleTemplate: {
              include: {
                tiers: { orderBy: { minQuantity: 'asc' } },
              },
            },
          },
        },
        images: true,
        colors: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
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
    const {
      code, slug, nameRu, nameUz, descriptionRu, descriptionUz,
      categoryId, price, oldPrice, material, dimensions,
      inStock, stockQuantity, isActive, isNew, isFeatured,
      isSpecialOffer,
      images, variants,
    } = req.body

    const product = await prisma.product.create({
      data: {
        code,
        slug: slug || code.toLowerCase().replace(/[\/\\]/g, '-').replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
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
        isSpecialOffer: isSpecialOffer ?? false,
        images: images
          ? {
              create: images.map((img: any, index: number) => ({
                url: img.url,
                alt: img.alt || nameRu,
                sortOrder: index,
                isMain: index === 0,
              })),
            }
          : undefined,
        variants:
          variants && variants.length > 0
            ? {
                create: variants.map((v: any, index: number) => ({
                  size: v.size,
                  labelRu: v.labelRu,
                  labelUz: v.labelUz,
                  price: parseInt(v.price),
                  oldPrice: v.oldPrice ? parseInt(v.oldPrice) : null,
                  sku: v.sku || null,
                  inStock: v.inStock ?? true,
                  stockQuantity: parseInt(v.stockQuantity) || 0,
                  dimensions: v.dimensions || null,
                  sortOrder: index,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        images: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    })

    res.status(201).json({ success: true, data: product })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/products/:id', async (req, res) => {
  try {
    const {
      code, slug, nameRu, nameUz, descriptionRu, descriptionUz,
      categoryId, price, oldPrice, material, dimensions,
      inStock, stockQuantity, isActive, isNew, isFeatured,
      isSpecialOffer,
      variants,
    } = req.body

    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({
        where: { productId: req.params.id },
      })
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        code,
        slug: slug || (code ? code.toLowerCase().replace(/[\/\\]/g, '-').replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : undefined),
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
        isFeatured,
        isSpecialOffer: isSpecialOffer ?? undefined,
        variants:
          variants && Array.isArray(variants) && variants.length > 0
            ? {
                create: variants.map((v: any, index: number) => ({
                  size: v.size,
                  labelRu: v.labelRu,
                  labelUz: v.labelUz,
                  price: parseInt(v.price),
                  oldPrice: v.oldPrice ? parseInt(v.oldPrice) : null,
                  sku: v.sku || null,
                  inStock: v.inStock ?? true,
                  stockQuantity: parseInt(v.stockQuantity) || 0,
                  dimensions: v.dimensions || null,
                  sortOrder: index,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        images: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    })

    res.json({ success: true, data: product })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
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
        data: { isMain: false },
      })
    }

    const image = await prisma.productImage.create({
      data: {
        productId: req.params.id,
        url,
        alt,
        isMain: isMain ?? false,
        sortOrder: 0,
      },
    })

    res.status(201).json({ success: true, data: image })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.delete('/products/:productId/images/:imageId', async (req, res) => {
  try {
    await prisma.productImage.delete({
      where: { id: req.params.imageId },
    })
    res.json({ success: true, message: 'Image deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== PRODUCT VARIANTS ====================

router.get('/products/:id/variants', async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ success: true, data: variants })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/products/:id/variants', async (req, res) => {
  try {
    const { size, labelRu, labelUz, price, oldPrice, sku, inStock, stockQuantity, dimensions } = req.body

    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        size,
        labelRu,
        labelUz,
        price: parseInt(price),
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        sku: sku || null,
        inStock: inStock ?? true,
        stockQuantity: parseInt(stockQuantity) || 0,
        dimensions: dimensions || null,
        sortOrder: 0,
      },
    })

    res.status(201).json({ success: true, data: variant })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const { size, labelRu, labelUz, price, oldPrice, sku, inStock, stockQuantity, dimensions, sortOrder } = req.body

    const variant = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: {
        size,
        labelRu,
        labelUz,
        price: price !== undefined ? parseInt(price) : undefined,
        oldPrice: oldPrice !== undefined ? (oldPrice ? parseInt(oldPrice) : null) : undefined,
        sku,
        inStock,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : undefined,
        dimensions,
        sortOrder,
      },
    })

    res.json({ success: true, data: variant })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/products/:productId/variants/:variantId', async (req, res) => {
  try {
    await prisma.productVariant.delete({
      where: { id: req.params.variantId },
    })
    res.json({ success: true, message: 'Variant deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== CATEGORIES ====================
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        wholesaleTemplate: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const { slug, nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive, wholesaleTemplateId } = req.body

    const category = await prisma.category.create({
      data: {
        slug,
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        image,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
        wholesaleTemplateId: wholesaleTemplateId || null,
      },
    })

    res.status(201).json({ success: true, data: category })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/categories/:id', async (req, res) => {
  try {
    const { nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive, wholesaleTemplateId } = req.body

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        image,
        sortOrder,
        isActive,
        wholesaleTemplateId: wholesaleTemplateId || null,
      },
    })

    res.json({ success: true, data: category })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.product.updateMany({
      where: { categoryId: req.params.id },
      data: { categoryId: null },
    })

    await prisma.category.delete({
      where: { id: req.params.id },
    })

    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== ORDERS ====================
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const serializedOrders = orders.map(order => ({
      ...order,
      user: order.user
        ? {
            ...order.user,
            telegramId: order.user.telegramId.toString(),
          }
        : null,
    }))

    res.json({ success: true, data: serializedOrders })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: String(error) })
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
      include: { items: true },
    })

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== WHOLESALE TEMPLATES ====================

router.get('/wholesale-templates', async (req, res) => {
  try {
    const templates = await prisma.wholesalePriceTemplate.findMany({
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
        _count: {
          select: { categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: templates })
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/wholesale-templates/:id', async (req, res) => {
  try {
    const template = await prisma.wholesalePriceTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
        categories: {
          select: { id: true, nameRu: true, nameUz: true, slug: true },
        },
      },
    })

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/wholesale-templates', async (req, res) => {
  try {
    const { name, description, isDefault, tiers } = req.body

    if (isDefault) {
      await prisma.wholesalePriceTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.wholesalePriceTemplate.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
        tiers: {
          create:
            tiers?.map((tier: any) => ({
              minQuantity: parseInt(tier.minQuantity),
              discountPercent: parseInt(tier.discountPercent),
            })) || [],
        },
      },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    })

    res.status(201).json({ success: true, data: template })
  } catch (error: any) {
    console.error('Create template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/wholesale-templates/:id', async (req, res) => {
  try {
    const { name, description, isDefault, tiers } = req.body

    if (isDefault) {
      await prisma.wholesalePriceTemplate.updateMany({
        where: {
          isDefault: true,
          id: { not: req.params.id },
        },
        data: { isDefault: false },
      })
    }

    await prisma.wholesalePriceTier.deleteMany({
      where: { templateId: req.params.id },
    })

    const template = await prisma.wholesalePriceTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        isDefault: isDefault || false,
        tiers: {
          create:
            tiers?.map((tier: any) => ({
              minQuantity: parseInt(tier.minQuantity),
              discountPercent: parseInt(tier.discountPercent),
            })) || [],
        },
      },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    })

    res.json({ success: true, data: template })
  } catch (error: any) {
    console.error('Update template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/wholesale-templates/:id', async (req, res) => {
  try {
    await prisma.category.updateMany({
      where: { wholesaleTemplateId: req.params.id },
      data: { wholesaleTemplateId: null },
    })

    await prisma.wholesalePriceTemplate.delete({
      where: { id: req.params.id },
    })

    res.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== 🆕 PROMOTIONS (АКЦИИ) ====================

// Список всех акций
router.get('/promotions', async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: promotions })
  } catch (error) {
    console.error('Get promotions error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Получить акцию по ID (с товарами)
router.get('/promotions/:id', async (req, res) => {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                variants: { orderBy: { sortOrder: 'asc' } },
                category: { select: { id: true, nameRu: true, nameUz: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' })
    }

    res.json({ success: true, data: promotion })
  } catch (error) {
    console.error('Get promotion error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Создать акцию
router.post('/promotions', async (req, res) => {
  try {
    const {
      slug, nameRu, nameUz, descriptionRu, descriptionUz,
      rulesRu, rulesUz, image, type, status,
      startDate, endDate, sortOrder, productIds,
    } = req.body

    const promotion = await prisma.promotion.create({
      data: {
        slug: slug || nameRu.toLowerCase()
          .replace(/[^a-zа-яё0-9\s-]/gi, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50) + '-' + Date.now().toString(36),
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        rulesRu,
        rulesUz,
        image,
        type: type || 'SALE',
        status: status || 'DRAFT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        sortOrder: sortOrder || 0,
        products:
          productIds && productIds.length > 0
            ? {
                create: productIds.map((pid: string, index: number) => ({
                  productId: pid,
                  sortOrder: index,
                })),
              }
            : undefined,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
        _count: { select: { products: true } },
      },
    })

    res.status(201).json({ success: true, data: promotion })
  } catch (error: any) {
    console.error('Create promotion error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Обновить акцию
router.put('/promotions/:id', async (req, res) => {
  try {
    const {
      slug, nameRu, nameUz, descriptionRu, descriptionUz,
      rulesRu, rulesUz, image, type, status,
      startDate, endDate, sortOrder, productIds,
    } = req.body

    // Если переданы productIds — пересоздаём связи
    if (productIds && Array.isArray(productIds)) {
      await prisma.promotionProduct.deleteMany({
        where: { promotionId: req.params.id },
      })
    }

    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: {
        slug,
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        rulesRu,
        rulesUz,
        image,
        type,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sortOrder,
        products:
          productIds && Array.isArray(productIds)
            ? {
                create: productIds.map((pid: string, index: number) => ({
                  productId: pid,
                  sortOrder: index,
                })),
              }
            : undefined,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
        _count: { select: { products: true } },
      },
    })

    res.json({ success: true, data: promotion })
  } catch (error: any) {
    console.error('Update promotion error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Изменить статус акции
router.patch('/promotions/:id/status', async (req, res) => {
  try {
    const { status } = req.body

    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: { status },
    })

    res.json({ success: true, data: promotion })
  } catch (error) {
    console.error('Update promotion status error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Удалить акцию
router.delete('/promotions/:id', async (req, res) => {
  try {
    await prisma.promotion.delete({
      where: { id: req.params.id },
    })
    res.json({ success: true, message: 'Promotion deleted' })
  } catch (error) {
    console.error('Delete promotion error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Добавить товар в акцию
router.post('/promotions/:id/products', async (req, res) => {
  try {
    const { productId } = req.body

    const existing = await prisma.promotionProduct.findUnique({
      where: {
        promotionId_productId: {
          promotionId: req.params.id,
          productId,
        },
      },
    })

    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already in promotion' })
    }

    const count = await prisma.promotionProduct.count({
      where: { promotionId: req.params.id },
    })

    const pp = await prisma.promotionProduct.create({
      data: {
        promotionId: req.params.id,
        productId,
        sortOrder: count,
      },
      include: {
        product: {
          include: {
            images: { take: 1 },
          },
        },
      },
    })

    res.status(201).json({ success: true, data: pp })
  } catch (error: any) {
    console.error('Add product to promotion error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Удалить товар из акции
router.delete('/promotions/:promotionId/products/:productId', async (req, res) => {
  try {
    await prisma.promotionProduct.delete({
      where: {
        promotionId_productId: {
          promotionId: req.params.promotionId,
          productId: req.params.productId,
        },
      },
    })
    res.json({ success: true, message: 'Product removed from promotion' })
  } catch (error) {
    console.error('Remove product from promotion error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== CUSTOMERS ====================

router.get('/customers', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      hasOrders = 'all',
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search && typeof search === 'string') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (hasOrders === 'yes') {
      where.orders = { some: {} }
    } else if (hasOrders === 'no') {
      where.orders = { none: {} }
    }

    const customers = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            favorites: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
    })

    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const completedOrders = customer.orders.filter(o => o.status === 'DELIVERED').length
      const lastOrder = customer.orders[0] || null

      return {
        id: customer.id,
        telegramId: customer.telegramId.toString(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        username: customer.username,
        phone: customer.phone,
        language: customer.language,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        defaultAddress: customer.addresses[0] || null,
        stats: {
          totalOrders: customer._count.orders,
          completedOrders,
          cancelledOrders: customer.orders.filter(o => o.status === 'CANCELLED').length,
          totalSpent,
          averageOrderValue: customer._count.orders > 0 ? Math.round(totalSpent / customer._count.orders) : 0,
          favoritesCount: customer._count.favorites,
          lastOrderAt: lastOrder?.createdAt || null,
          lastOrderStatus: lastOrder?.status || null,
        },
      }
    })

    if (sortBy === 'totalOrders') {
      customersWithStats.sort((a, b) =>
        sortOrder === 'desc' ? b.stats.totalOrders - a.stats.totalOrders : a.stats.totalOrders - b.stats.totalOrders
      )
    } else if (sortBy === 'totalSpent') {
      customersWithStats.sort((a, b) =>
        sortOrder === 'desc' ? b.stats.totalSpent - a.stats.totalSpent : a.stats.totalSpent - b.stats.totalSpent
      )
    }

    const total = await prisma.user.count({ where })

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers/stats', async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalCustomers, customersWithOrders, newCustomers30d, newCustomers7d, activeCustomers, orderStats] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { orders: { some: {} } } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({
          where: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        }),
        prisma.order.aggregate({
          _sum: { total: true },
          _avg: { total: true },
          _count: true,
        }),
      ])

    const topCustomersRaw = await prisma.user.findMany({
      take: 10,
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    })

    const topCustomers = topCustomersRaw
      .map(customer => ({
        id: customer.id,
        name:
          [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username || 'Без имени',
        username: customer.username,
        ordersCount: customer._count.orders,
        totalSpent: customer.orders.reduce((sum, o) => sum + o.total, 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          customersWithOrders,
          customersWithoutOrders: totalCustomers - customersWithOrders,
          newCustomers30d,
          newCustomers7d,
          activeCustomers,
          conversionRate: totalCustomers > 0 ? ((customersWithOrders / totalCustomers) * 100).toFixed(1) : '0',
        },
        financial: {
          totalRevenue: orderStats._sum.total || 0,
          averageOrderValue: Math.round(orderStats._avg.total || 0),
          totalOrders: orderStats._count,
        },
        topCustomers,
      },
    })
  } catch (error) {
    console.error('Get customer stats error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        favorites: {
          include: {
            product: {
              select: {
                id: true,
                nameRu: true,
                nameUz: true,
                slug: true,
                price: true,
                images: { take: 1 },
              },
            },
          },
        },
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    nameRu: true,
                    nameUz: true,
                    price: true,
                    images: { take: 1 },
                  },
                },
                variant: true,
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
    const completedOrders = customer.orders.filter(o => o.status === 'DELIVERED')
    const cancelledOrders = customer.orders.filter(o => o.status === 'CANCELLED')

    const ordersByMonth: Record<string, { count: number; amount: number }> = {}
    customer.orders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7)
      if (!ordersByMonth[month]) {
        ordersByMonth[month] = { count: 0, amount: 0 }
      }
      ordersByMonth[month].count++
      ordersByMonth[month].amount += order.total
    })

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          telegramId: customer.telegramId.toString(),
          firstName: customer.firstName,
          lastName: customer.lastName,
          username: customer.username,
          phone: customer.phone,
          language: customer.language,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        addresses: customer.addresses,
        orders: customer.orders.map(order => ({
          ...order,
          customerPhone: order.customerPhone,
          items: order.items.map(item => ({
            productName: item.productName,
            productCode: item.productCode,
            productImage: item.productImage,
            variantSize: item.variantSize,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
        favorites: customer.favorites.map(f => ({
          id: f.product.id,
          nameRu: f.product.nameRu,
          nameUz: f.product.nameUz,
          slug: f.product.slug,
          price: f.product.price,
          image: f.product.images[0]?.url || null,
        })),
        cart: customer.cart
          ? {
              id: customer.cart.id,
              items: customer.cart.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                product: {
                  id: item.product.id,
                  nameRu: item.product.nameRu,
                  nameUz: item.product.nameUz,
                  price: item.product.price,
                  image: item.product.images[0]?.url || null,
                },
                variant: item.variant
                  ? {
                      id: item.variant.id,
                      size: item.variant.size,
                      labelRu: item.variant.labelRu,
                      price: item.variant.price,
                    }
                  : null,
              })),
            }
          : null,
        stats: {
          totalOrders: customer.orders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: customer.orders.filter(o =>
            ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
          ).length,
          totalSpent,
          averageOrderValue: customer.orders.length > 0 ? Math.round(totalSpent / customer.orders.length) : 0,
          favoritesCount: customer.favorites.length,
          cartItemsCount: customer.cart?.items.length || 0,
          firstOrderAt:
            customer.orders.length > 0 ? customer.orders[customer.orders.length - 1].createdAt : null,
          lastOrderAt: customer.orders[0]?.createdAt || null,
          ordersByMonth,
        },
      },
    })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers-export', async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      include: {
        orders: { select: { total: true } },
        addresses: { where: { isDefault: true }, take: 1 },
      },
    })

    const csvRows = [
      ['ID', 'Telegram ID', 'Имя', 'Фамилия', 'Username', 'Телефон', 'Заказов', 'Сумма покупок', 'Город', 'Дата регистрации'].join(','),
    ]

    customers.forEach(customer => {
      const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0)
      const address = customer.addresses[0]

      csvRows.push(
        [
          customer.id,
          customer.telegramId.toString(),
          customer.firstName || '',
          customer.lastName || '',
          customer.username || '',
          customer.phone || '',
          customer.orders.length.toString(),
          totalSpent.toString(),
          address?.city || '',
          customer.createdAt.toISOString().split('T')[0],
        ].join(',')
      )
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=customers_${new Date().toISOString().split('T')[0]}.csv`
    )
    res.send('\uFEFF' + csv)
  } catch (error) {
    console.error('Export customers error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router