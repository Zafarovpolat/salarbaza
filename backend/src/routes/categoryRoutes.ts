import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { getCached, setCache } from '../utils/cache'
import { logger } from '../utils/logger'

const router = Router()

// ===== ВСЕ КАТЕГОРИИ ===== (кэш 120 сек)
// ?root=true — только корневые (parentId IS NULL), по умолчанию все
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rootOnly = req.query.root === 'true'
    const cacheKey = rootOnly ? 'categories_root' : 'categories_all'
    const cached = getCached(cacheKey)
    if (cached) {
      logger.info(`📂 GET /categories — из кэша (root=${rootOnly})`)
      return res.json(cached)
    }

    logger.info(`📂 GET /categories — запрос к БД (root=${rootOnly})`)

    const where: any = { isActive: true }
    if (rootOnly) {
      where.parentId = null
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        wholesaleTemplate: {
          include: {
            tiers: { orderBy: { minQuantity: 'asc' } },
          },
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            children: { where: { isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const data = categories.map(cat => ({
      ...cat,
      productCount: cat._count.products,
      subcategoryCount: cat._count.children,
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
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                products: { where: { isActive: true } },
                children: { where: { isActive: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
            children: { where: { isActive: true } },
          },
        },
      },
    })

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404)
    }

    const data = {
      ...category,
      productCount: category._count.products,
      subcategoryCount: category._count.children,
      children: category.children.map(child => ({
        ...child,
        productCount: child._count.products,
        subcategoryCount: child._count.children,
        _count: undefined,
      })),
      _count: undefined,
    }

    const response = { success: true, data }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== ПОДКАТЕГОРИИ ===== (кэш 60 сек)
router.get('/:slug/subcategories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const cacheKey = `category_${slug}_subcategories`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const parent = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    })

    if (!parent || !parent.isActive) {
      throw new AppError('Category not found', 404)
    }

    const subcategories = await prisma.category.findMany({
      where: { parentId: parent.id, isActive: true },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true } },
            children: { where: { isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const data = subcategories.map(cat => ({
      ...cat,
      productCount: cat._count.products,
      subcategoryCount: cat._count.children,
      _count: undefined,
    }))

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
