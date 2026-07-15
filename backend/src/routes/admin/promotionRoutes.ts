import{Router}from'express';import{prisma}from'../../config/database';const router=Router();
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


export default router
