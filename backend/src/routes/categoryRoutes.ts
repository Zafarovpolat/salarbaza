import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { getCached, setCache } from '../utils/cache'
import { logger } from '../utils/logger'

const router = Router()

// ===== ВСЕ КАТЕГОРИИ ===== (кэш 120 сек)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'categories_all'
    const cached = getCached(cacheKey)
    if (cached) {
      logger.info('📂 GET /categories — из кэша')
      return res.json(cached)
    }

    logger.info('📂 GET /categories — запрос к БД')

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        wholesaleTemplate: {
          include: {
            tiers: { orderBy: { minQuantity: 'asc' } },
          },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const data = categories.map(cat => ({
      ...cat,
      productCount: cat._count.products,
      _count: undefined,
    }))

    const response = { success: true, data }
    setCache(cacheKey, response, 120)
    logger.info(`📂 GET /categories — найдено ${data.length} категорий`)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== КАТЕГОРИЯ ПО SLUG ===== (кэш 60 сек)
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const cacheKey = `category_${slug}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        wholesaleTemplate: {
          include: {
            tiers: { orderBy: { minQuantity: 'asc' } },
          },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404)
    }

    const data = {
      ...category,
      productCount: category._count.products,
      _count: undefined,
    }

    const response = { success: true, data }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== ТОВАРЫ КАТЕГОРИИ ===== (кэш 30 сек)
router.get('/:slug/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const { page = '1', limit = '20', sortBy = 'newest' } = req.query

    const cacheKey = `cat_products_${slug}_${page}_${limit}_${sortBy}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!category) {
      throw new AppError('Category not found', 404)
    }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'popular') orderBy = { viewCount: 'desc' }

    const where = { categoryId: category.id, isActive: true }

    // ✅ FIX: используем include вместо select — избегаем TS ошибок
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isMain: true }, take: 1 },
          colors: true,
          variants: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    const response = {
      success: true,
      data: products,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }

    setCache(cacheKey, response, 30)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router