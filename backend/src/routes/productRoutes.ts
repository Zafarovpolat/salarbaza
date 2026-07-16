import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'
import { trySendCached, cacheAndSend } from '../utils/cache'
import { parsePagination, parseSearchQuery, LIMITS } from '../utils/pagination'

const router = Router()

const productListInclude = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, url: true, isMain: true, sortOrder: true, alt: true },
  },
  colors: {
    select: {
      id: true, nameRu: true, nameUz: true, hexCode: true,
      inStock: true, stockQuantity: true, priceModifier: true,
      bitoSku: true, image: true,
    },
  },
  variants: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, price: true, sortOrder: true },
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

function extractColorFromSku(bitoSku: string, productCode: string): string | null {
  if (!bitoSku) return null
  const withoutPrefix = bitoSku.replace(/^\d+-/, '')
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match1 = withoutPrefix.match(new RegExp(`^${escape(productCode)}-(.+)$`, 'i'))
  if (match1) return match1[1]
  const codeBase = productCode.replace(/-\d+$/, '')
  if (codeBase !== productCode) {
    const match2 = withoutPrefix.match(new RegExp(`^${escape(codeBase)}-(.+)$`, 'i'))
    if (match2) return match2[1]
  }
  const fallback = withoutPrefix.match(/^[A-Za-z]+-\d+(?:-\d+)?-(.+)$/)
  if (fallback) return fallback[1]
  return null
}

function explodeByColor<T extends {
  id: string
  code: string
  nameRu: string
  nameUz: string
  price: number
  oldPrice: number | null
  inStock: boolean
  stockQuantity: number
  images: Array<{ id: string; url: string; isMain: boolean; sortOrder: number; alt: string | null }>
  colors: Array<{
    id: string
    nameRu: string
    nameUz: string
    image: string | null
    hexCode: string | null
    inStock: boolean
    stockQuantity: number
    priceModifier: number
    bitoSku?: string | null
  }>
}>(products: T[]): Array<T & { cardId: string; selectedColorId?: string }> {
  const out: Array<T & { cardId: string; selectedColorId?: string }> = []
  for (const p of products) {
    const colors = p.colors || []
    if (colors.length === 0) {
      out.push({ ...p, cardId: p.id })
      continue
    }
    if (colors.length === 1) {
      const c = colors[0]
      if (!c.inStock) continue
      out.push({ ...p, cardId: `${p.id}:${c.id}`, selectedColorId: c.id })
      continue
    }
    const inStockColors = colors.filter(c => c.inStock)
    if (inStockColors.length === 0) continue
    const fallbackImage = p.images.find(img => img.isMain) || p.images[0] || null
    for (const c of inStockColors) {
      let colorImages: T['images'] = []
      if (c.bitoSku) {
        const skuLower = c.bitoSku.toLowerCase()
        colorImages = p.images.filter(img => img.url.toLowerCase().includes(skuLower))
      }
      if (colorImages.length === 0 && fallbackImage) colorImages = [fallbackImage]
      if (colorImages.length > 0) colorImages = colorImages.map((img, idx) => ({ ...img, isMain: idx === 0 }))

      let cardName: string
      if (c.bitoSku && /[a-zA-Z]/.test(c.bitoSku)) {
        const skuName = c.bitoSku.replace(/^\d+-/, '')
        const colorSuffix = extractColorFromSku(c.bitoSku, p.code)
        if (colorSuffix) {
          const rootPart = skuName.slice(0, skuName.length - colorSuffix.length - 1)
          cardName = `${rootPart} ${colorSuffix}`
        } else {
          cardName = skuName.replace(/-/g, ' ')
        }
      } else {
        cardName = `${p.code} ${c.nameRu}`
      }
      out.push({
        ...p,
        cardId: `${p.id}:${c.id}`,
        selectedColorId: c.id,
        nameRu: cardName,
        nameUz: cardName,
        images: colorImages as T['images'],
        price: p.price + (c.priceModifier || 0),
        oldPrice: p.oldPrice !== null ? p.oldPrice + (c.priceModifier || 0) : null,
        inStock: c.inStock,
        stockQuantity: c.stockQuantity,
        colors: [c] as T['colors'],
      })
    }
  }
  return out
}

// ===== FEATURED ===== (кэш 120 сек) - max 100
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: LIMITS.PUBLIC_PRODUCT_LIST })
    const cacheKey = `featured_${limit}`
    if (trySendCached(cacheKey, res)) return
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true, inStock: true },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limit,
    })
    const response = { success: true, data: explodeByColor(products as any) }
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== NEW ===== (кэш 120 сек) - max 100
router.get('/new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: LIMITS.PUBLIC_PRODUCT_LIST })
    const cacheKey = `new_${limit}`
    if (trySendCached(cacheKey, res)) return
    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true, inStock: true },
      include: productListInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    const response = { success: true, data: explodeByColor(products as any) }
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== SALE ===== (кэш 120 сек) - max 100
router.get('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: LIMITS.PUBLIC_PRODUCT_LIST })
    const cacheKey = `sale_${limit}`
    if (trySendCached(cacheKey, res)) return
    const products = await prisma.product.findMany({
      where: { isActive: true, inStock: true, oldPrice: { not: null } },
      include: productListInclude,
      orderBy: { viewCount: 'desc' },
      take: limit,
    })
    const response = { success: true, data: explodeByColor(products as any) }
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== SEARCH ===== (кэш 60 сек) - max 50, returns pagination for verification
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = parseSearchQuery(req.query, LIMITS.MAX_SEARCH_LENGTH)
    if (!q) return res.json({ success: true, data: [], pagination: { q: '', limit: 0, total: 0 } })

    const { limit, page } = parsePagination(req.query, { defaultLimit: LIMITS.DEFAULT_SEARCH, maxLimit: LIMITS.PUBLIC_SEARCH })
    const cacheKey = `search_${q}_${limit}_${page}`
    if (trySendCached(cacheKey, res)) return

    const where: any = {
      isActive: true,
      inStock: true,
      OR: [
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameUz: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ],
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: productListInclude, take: limit }),
      prisma.product.count({ where }),
    ])

    const response = {
      success: true,
      data: explodeByColor(products as any),
      pagination: { q, limit, page, total, totalPages: Math.ceil(total / limit) },
    }
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

// ===== СПИСОК ===== (кэш 60 сек) - max 100
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, sortBy = 'newest', inStock } = req.query
    const { page: pageNum, limit: limitNum, skip } = parsePagination(req.query, {
      defaultLimit: LIMITS.DEFAULT_PUBLIC,
      maxLimit: LIMITS.PUBLIC_PRODUCT_LIST,
    })

    const cacheKey = `products_${pageNum}_${limitNum}_${category || ''}_${minPrice || ''}_${maxPrice || ''}_${sortBy}_${inStock || ''}`
    if (trySendCached(cacheKey, res)) return

    const where: Prisma.ProductWhereInput = { isActive: true, inStock: true }

    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category as string },
        include: { children: { where: { isActive: true }, select: { id: true } } },
      })
      if (cat) {
        const childIds = cat.children.map(c => c.id)
        if (childIds.length > 0) where.categoryId = { in: [cat.id, ...childIds] }
        else where.categoryId = cat.id
      }
    }

    if (minPrice) where.price = { ...(where.price as object), gte: parseInt(minPrice as string) }
    if (maxPrice) where.price = { ...(where.price as object), lte: parseInt(maxPrice as string) }
    void inStock

    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'popular') orderBy = { viewCount: 'desc' }
    if (sortBy === 'grouped') orderBy = category ? [{ code: 'asc' }, { price: 'asc' }] : [{ categoryId: 'asc' }, { code: 'asc' }]

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: productListInclude, orderBy, skip, take: limitNum }),
      prisma.product.count({ where }),
    ])

    const cards = explodeByColor(products as any)
    const response = {
      success: true,
      data: cards,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

// ===== RECOMMENDATIONS ===== (кэш 120 сек) - max 100
router.get('/:id/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { limit } = parsePagination(req.query, { defaultLimit: 8, maxLimit: LIMITS.PUBLIC_PRODUCT_LIST })
    const cacheKey = `recs_${id}_${limit}`
    if (trySendCached(cacheKey, res)) return

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true, price: true },
    })
    if (!currentProduct) return res.json({ success: true, data: [] })

    const recommendations = await prisma.product.findMany({
      where: {
        isActive: true,
        inStock: true,
        id: { not: id },
        OR: [
          { categoryId: currentProduct.categoryId },
          { price: { gte: Math.round(currentProduct.price * 0.7), lte: Math.round(currentProduct.price * 1.3) } },
        ],
      },
      include: { images: { where: { isMain: true }, take: 1 }, colors: true, variants: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    })
    const response = { success: true, data: explodeByColor(recommendations as any) }
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== ПО ID =====
router.get('/by-id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const cacheKey = `product_id_${id}`
    if (trySendCached(cacheKey, res)) return
    const product = await prisma.product.findUnique({ where: { id }, include: productDetailInclude })
    if (!product || !product.isActive) throw new AppError('Product not found', 404)
    prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
    const response = { success: true, data: product }
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

// ===== /:slug =====
router.get('/:slug(*)', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { slug } = req.params
    const cacheKey = `product_${slug}`
    if (trySendCached(cacheKey, res)) return
    const originalSlug = slug
    const normalizedSlug = slug.replace(/\//g, '-')
    let product = await prisma.product.findUnique({ where: { slug: originalSlug }, include: productDetailInclude })
    if (!product && normalizedSlug !== originalSlug) {
      product = await prisma.product.findUnique({ where: { slug: normalizedSlug }, include: productDetailInclude })
    }
    if (!product) {
      product = await prisma.product.findFirst({
        where: { OR: [{ code: { equals: originalSlug, mode: 'insensitive' } }, { code: { equals: normalizedSlug, mode: 'insensitive' } }, { slug: { contains: normalizedSlug, mode: 'insensitive' } }] } as any,
        include: productDetailInclude,
      })
    }
    if (!product || !product.isActive) throw new AppError('Product not found', 404)
    prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
    const response = { success: true, data: product }
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

export default router
