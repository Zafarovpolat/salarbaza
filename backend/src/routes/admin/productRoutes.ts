import{Router}from'express';import{prisma}from'../../config/database';import{invalidateCache}from'../../utils/cache';async function generateUniqueSlug(base:string,excludeId?:string){const b=base.toLowerCase().replace(/[/\\]/g,'-').replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');let slug=b,n=2;while(true){const e=await prisma.product.findUnique({where:{slug}});if(!e||e.id===excludeId)break;slug=`${b}-${n++}`}return slug}const router=Router();
// ==================== PRODUCTS ====================
router.get('/products', async (req, res) => {
  try {
    const { categoryId, search, stockStatus } = req.query

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

    if (stockStatus === 'in') {
      where.stockQuantity = { gt: 0 }
    } else if (stockStatus === 'out') {
      where.stockQuantity = { lte: 0 }
    } else if (stockStatus === 'low') {
      where.stockQuantity = { gt: 0, lt: 5 }
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
        warehouseStocks: {
          include: { warehouse: { select: { id: true, name: true, sortOrder: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Aggregate warehouseStocks by warehouseId (Variant A grouping causes duplicates)
    const data = products.map((p) => ({
      ...p,
      warehouseStocks: aggregateWarehouseStocks(p.warehouseStocks),
    }))

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Aggregate raw ProductWarehouseStock rows by warehouseId so the same warehouse
// is shown once even when a Supabase product groups multiple Bito products
// (Variant A: one product + N color rows, each linked to its own bitoProductId).
function aggregateWarehouseStocks(
  rows: Array<{
    warehouseId: string
    amount: number
    booked: number
    inTransit: number
    inTrash: number
    warehouse: { id: string; name: string; sortOrder: number }
  }>
) {
  const byWh = new Map<
    string,
    {
      warehouseId: string
      warehouseName: string
      sortOrder: number
      amount: number
      booked: number
      inTransit: number
      inTrash: number
    }
  >()

  for (const row of rows) {
    const existing = byWh.get(row.warehouseId)
    if (existing) {
      existing.amount += row.amount
      existing.booked += row.booked
      existing.inTransit += row.inTransit
      existing.inTrash += row.inTrash
    } else {
      byWh.set(row.warehouseId, {
        warehouseId: row.warehouseId,
        warehouseName: row.warehouse.name,
        sortOrder: row.warehouse.sortOrder,
        amount: row.amount,
        booked: row.booked,
        inTransit: row.inTransit,
        inTrash: row.inTrash,
      })
    }
  }

  return Array.from(byWh.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.warehouseName.localeCompare(b.warehouseName)
  })
}

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
        warehouseStocks: {
          include: { warehouse: { select: { id: true, name: true, sortOrder: true } } },
        },
      },
    })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const data = {
      ...product,
      warehouseStocks: aggregateWarehouseStocks(product.warehouseStocks),
    }

    res.json({ success: true, data })
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

    // ✅ Проверить уникальность code
    if (code) {
      const existingByCode = await prisma.product.findUnique({ where: { code } })
      if (existingByCode) {
        return res.status(400).json({
          success: false,
          message: `Товар с кодом "${code}" уже существует. Используйте другой код.`,
        })
      }
    }

    // ✅ Генерируем уникальный slug (добавляет -2, -3 и т.д. если slug занят)
    const uniqueSlug = await generateUniqueSlug(slug || code)

    const product = await prisma.product.create({
      data: {
        code,
        slug: uniqueSlug,
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

    invalidateCache()

    res.status(201).json({ success: true, data: product })
  } catch (error: any) {
    // ✅ Понятные сообщения для ошибок уникальности
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      if (field === 'slug') {
        return res.status(400).json({ success: false, message: 'Ошибка генерации slug. Попробуйте ещё раз.' })
      }
      if (field === 'code') {
        return res.status(400).json({ success: false, message: `Товар с таким кодом уже существует.` })
      }
      return res.status(400).json({ success: false, message: `Значение поля "${field}" уже занято.` })
    }
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

    // ✅ Проверить уникальность code (только если code меняется)
    if (code) {
      const existingByCode = await prisma.product.findUnique({ where: { code } })
      if (existingByCode && existingByCode.id !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: `Товар с кодом "${code}" уже существует. Используйте другой код.`,
        })
      }
    }

    // ✅ Генерируем уникальный slug (исключая текущий товар)
    const baseForSlug = slug || code
    const uniqueSlug = baseForSlug
      ? await generateUniqueSlug(baseForSlug, req.params.id)
      : undefined

    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({
        where: { productId: req.params.id },
      })
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        code,
        slug: uniqueSlug,
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

    invalidateCache()

    res.json({ success: true, data: product })
  } catch (error: any) {
    // ✅ Понятные сообщения для ошибок уникальности
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      if (field === 'code') {
        return res.status(400).json({ success: false, message: `Товар с таким кодом уже существует.` })
      }
      return res.status(400).json({ success: false, message: `Значение поля "${field}" уже занято.` })
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// ✅ Quick toggle isActive for a product
router.patch('/products/:id/toggle-active', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: !product.isActive },
    })

    invalidateCache()

    res.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Toggle product active error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    })

    invalidateCache()
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

    invalidateCache('product')

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

    invalidateCache('product')

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


export default router
