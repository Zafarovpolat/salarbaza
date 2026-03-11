import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'

const router = Router()

// ✅ SPEED: только 1 главное фото для списков (было: ВСЕ фото)
const productListInclude = {
  images: {
    orderBy: [
      { isMain: 'desc' as const },
      { sortOrder: 'asc' as const },
    ],
    take: 1,                                          // ✅ Только 1 фото
  },
  colors: true,
  variants: { orderBy: { sortOrder: 'asc' as const } },
  category: {
    select: { id: true, slug: true, nameRu: true, nameUz: true },  // ✅ Только нужные поля
  },
}

// Полный include для детальной страницы товара
const productDetailInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  colors: true,
  variants: { orderBy: { sortOrder: 'asc' as const } },
  category: {
    include: {
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' as const } },
        },
      },
    },
  },
}

// ===== СПИСОК ТОВАРОВ =====
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
    const limitNum = Math.min(parseInt(limit as string) || 20, 50)  // ✅ Макс 50
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.ProductWhereInput = { isActive: true }

    // ✅ SPEED: relation filter вместо отдельного запроса на категорию
    if (category) {
      where.category = { slug: category as string }
    }

    if (minPrice) where.price = { ...(where.price as object), gte: parseInt(minPrice as string) }
    if (maxPrice) where.price = { ...(where.price as object), lte: parseInt(maxPrice as string) }
    if (inStock === 'true') where.inStock = true

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'popular') orderBy = { viewCount: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productListInclude,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    // ✅ SPEED: HTTP кэш — повторные запросы мгновенные
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')

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

// ===== FEATURED =====
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query
    const limitNum = Math.min(parseInt(limit as string) || 10, 20)

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limitNum,
    })

    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    res.json({ success: true, data: products })
  } catch (error) {
    next(error)
  }
})

// ===== NEW =====
router.get('/new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query
    const limitNum = Math.min(parseInt(limit as string) || 10, 20)

    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: productListInclude,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    })

    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    res.json({ success: true, data: products })
  } catch (error) {
    next(error)
  }
})

// ===== SEARCH =====
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '20' } = req.query
    if (!q) return res.json({ success: true, data: [] })

    const limitNum = Math.min(parseInt(limit as string) || 20, 30)

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameRu: { contains: q as string, mode: 'insensitive' } },
          { nameUz: { contains: q as string, mode: 'insensitive' } },
          { code: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: productListInclude,
      take: limitNum,
    })
    res.json({ success: true, data: products })
  } catch (error) {
    next(error)
  }
})

// ===== SALE =====
router.get('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query
    const limitNum = Math.min(parseInt(limit as string) || 10, 20)

    const products = await prisma.product.findMany({
      where: { isActive: true, oldPrice: { not: null } },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limitNum,
    })

    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    res.json({ success: true, data: products })
  } catch (error) {
    next(error)
  }
})

// ===== RECOMMENDATIONS =====
router.get('/:id/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { limit = '8' } = req.query
    const limitNum = Math.min(parseInt(limit as string) || 8, 12)

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true, price: true },
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
              lte: Math.round(currentProduct.price * 1.3),
            },
          },
        ],
      },
      include: {
        images: {
          orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
          take: 1,                                    // ✅ Только 1 фото
        },
        colors: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: limitNum,
    })

    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    res.json({ success: true, data: recommendations })
  } catch (error) {
    next(error)
  }
})

// ===== ПОЛУЧИТЬ ПО ID =====
router.get('/by-id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    })

    if (!product || !product.isActive) {
      throw new AppError('Product not found', 404)
    }

    // ✅ SPEED: fire-and-forget — не ждём обновления счётчика
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
})

// ===== /:slug — ВСЕГДА В КОНЦЕ! =====
router.get('/:slug(*)', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { slug } = req.params

    const originalSlug = slug
    const normalizedSlug = slug.replace(/\//g, '-')

    // Пробуем найти по оригинальному slug
    let product = await prisma.product.findUnique({
      where: { slug: originalSlug },
      include: productDetailInclude,
    })

    // Если не нашли — пробуем нормализованный
    if (!product && normalizedSlug !== originalSlug) {
      product = await prisma.product.findUnique({
        where: { slug: normalizedSlug },
        include: productDetailInclude,
      })
    }

    // Если всё ещё не нашли — пробуем поиск по коду
    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { code: { equals: originalSlug, mode: 'insensitive' } },
            { code: { equals: normalizedSlug, mode: 'insensitive' } },
            { slug: { contains: normalizedSlug, mode: 'insensitive' } },
          ],
        },
        include: productDetailInclude,
      })
    }

    if (!product || !product.isActive) {
      throw new AppError('Product not found', 404)
    }

    // ✅ SPEED: fire-and-forget — не ждём обновления счётчика
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
})

export default router