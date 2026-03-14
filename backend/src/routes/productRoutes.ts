import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'
import { getCached, setCache } from '../utils/cache'

const router = Router()

// ✅ FIX: используем include вместо select — никаких TS ошибок
const productListInclude = {
  images: { where: { isMain: true }, take: 1 },
  colors: true,
  variants: { orderBy: { sortOrder: 'asc' as const } },
  category: {
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameUz: true,
    },
  },
}

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

// ===== FEATURED ===== (кэш 60 сек)
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const cacheKey = `featured_${limit}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limit,
    })

    const response = { success: true, data: products }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== NEW ===== (кэш 60 сек)
router.get('/new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const cacheKey = `new_${limit}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: productListInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const response = { success: true, data: products }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== SALE ===== (кэш 60 сек)
router.get('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const cacheKey = `sale_${limit}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const products = await prisma.product.findMany({
      where: { isActive: true, oldPrice: { not: null } },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limit,
    })

    const response = { success: true, data: products }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== SEARCH ===== (кэш 30 сек)
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '20' } = req.query
    if (!q) return res.json({ success: true, data: [] })

    const cacheKey = `search_${q}_${limit}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

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
      take: parseInt(limit as string),
    })

    const response = { success: true, data: products }
    setCache(cacheKey, response, 30)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== СПИСОК ===== (кэш 30 сек)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1', limit = '20', category,
      minPrice, maxPrice, sortBy = 'newest', inStock,
    } = req.query

    const cacheKey = `products_${page}_${limit}_${category || ''}_${minPrice || ''}_${maxPrice || ''}_${sortBy}_${inStock || ''}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.ProductWhereInput = { isActive: true }

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category as string } })
      if (cat) where.categoryId = cat.id
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

// ===== RECOMMENDATIONS ===== (кэш 60 сек)
router.get('/:id/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 8

    const cacheKey = `recs_${id}_${limit}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true, price: true },
    })

    if (!currentProduct) return res.json({ success: true, data: [] })

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
        images: { where: { isMain: true }, take: 1 },
        colors: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    })

    const response = { success: true, data: recommendations }
    setCache(cacheKey, response, 60)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== ПО ID =====
router.get('/by-id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const cacheKey = `product_id_${id}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const product = await prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    })

    if (!product || !product.isActive) throw new AppError('Product not found', 404)

    // Async — не блокируем ответ
    prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    const response = { success: true, data: product }
    setCache(cacheKey, response, 30)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

// ===== /:slug =====
router.get('/:slug(*)', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { slug } = req.params
    const cacheKey = `product_${slug}`
    const cached = getCached(cacheKey)
    if (cached) return res.json(cached)

    const originalSlug = slug
    const normalizedSlug = slug.replace(/\//g, '-')

    let product = await prisma.product.findUnique({
      where: { slug: originalSlug },
      include: productDetailInclude,
    })

    if (!product && normalizedSlug !== originalSlug) {
      product = await prisma.product.findUnique({
        where: { slug: normalizedSlug },
        include: productDetailInclude,
      })
    }

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

    if (!product || !product.isActive) throw new AppError('Product not found', 404)

    prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    const response = { success: true, data: product }
    setCache(cacheKey, response, 30)
    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router