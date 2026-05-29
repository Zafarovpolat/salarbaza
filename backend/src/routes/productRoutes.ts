import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'
import { trySendCached, cacheAndSend } from '../utils/cache'

const router = Router()

// ✅ Lightweight include for product list — only fields the card/explodeByColor need
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

// ===== Public catalog post-processing =====
// 1) Hide products that are completely out of stock — handled at DB layer via `inStock: true`
// 2) For products with multiple colors, expose each in-stock color as its own card.
//    Each card carries the same id/slug so the detail page, cart & favourites keep
//    working, plus a unique `cardId` for React keys and a `selectedColorId` so the
//    frontend can route to the right color on the detail page.
//
// For multi-color products each card gets:
//   - its own image(s): matched by checking if the image URL contains the
//     color's bitoSku (e.g. "6502-C-6-blue" inside
//     "https://zafarovpolat.github.io/bito-cat/edited/6502-C-6-blue-1.png")
//   - a distinguishable name derived from bitoSku: "B-35 white", "C-6 dark-pink"
//     (the canonical Bito name, not a Russian translation)
//
// If no bitoSku match is found, falls back to the product's main/first image.

/**
 * Extract the English color suffix from a bitoSku.
 * bitoSku format: "{bitoNumber}-{root}-{color}" e.g. "6502-B-19-blue", "8295-C-5-dark-pink"
 * We strip the leading numeric prefix and the product root (code) to get the color part.
 *
 * productCode may have a dedup suffix (e.g. "C-6-2" when "C-6" was taken), so we try:
 *   1. Match with full productCode
 *   2. Match with productCode minus trailing dedup suffix (-2, -3, etc.)
 *   3. Generic fallback: split after letter(s)-number(s) pattern
 */
function extractColorFromSku(bitoSku: string, productCode: string): string | null {
  if (!bitoSku) return null
  // Remove leading numeric Bito number prefix: "6502-B-19-blue" -> "B-19-blue"
  const withoutPrefix = bitoSku.replace(/^\d+-/, '')

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Try 1: match with full productCode (e.g. code="B-19", sku without prefix="B-19-blue")
  const match1 = withoutPrefix.match(new RegExp(`^${escape(productCode)}-(.+)$`, 'i'))
  if (match1) return match1[1]

  // Try 2: productCode might have dedup suffix. E.g. code="C-6-2" but sku="C-6-white"
  // Strip trailing -\d+ from code and try again
  const codeBase = productCode.replace(/-\d+$/, '')
  if (codeBase !== productCode) {
    const match2 = withoutPrefix.match(new RegExp(`^${escape(codeBase)}-(.+)$`, 'i'))
    if (match2) return match2[1]
  }

  // Try 3: generic fallback — letter(s)-number(s)[-number(s)]-color
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
    // No colors -> single card, identical to today.
    if (colors.length === 0) {
      out.push({ ...p, cardId: p.id })
      continue
    }
    // Only one color and it's in stock -> still single card. Name and images
    // come straight from the product row.
    if (colors.length === 1) {
      const c = colors[0]
      if (!c.inStock) continue // hide whole product if its only color is OOS
      out.push({
        ...p,
        cardId: `${p.id}:${c.id}`,
        selectedColorId: c.id,
      })
      continue
    }
    // Multiple colors -> one card per in-stock color.
    const inStockColors = colors.filter(c => c.inStock)
    if (inStockColors.length === 0) continue // hide product if every color is OOS

    // Pre-compute: default/fallback image (main or first)
    const fallbackImage = p.images.find(img => img.isMain) || p.images[0] || null

    for (const c of inStockColors) {
      // --- Image matching: find images whose URL contains this color's bitoSku ---
      let colorImages: T['images'] = []
      if (c.bitoSku) {
        const skuLower = c.bitoSku.toLowerCase()
        colorImages = p.images.filter(img =>
          img.url.toLowerCase().includes(skuLower)
        )
      }
      // Fallback: if no sku-matched images, use the product's main image
      if (colorImages.length === 0 && fallbackImage) {
        colorImages = [fallbackImage]
      }
      // Mark first matched image as isMain for the frontend
      if (colorImages.length > 0) {
        colorImages = colorImages.map((img, idx) => ({
          ...img,
          isMain: idx === 0,
        }))
      }

      // --- Name: use original Bito name from bitoSku (e.g. "B-35 white") ---
      // bitoSku can be either:
      //   a) "{number}-{root}-{color}" e.g. "6694-B-35-white" -> card "B-35 white"
      //   b) just a number e.g. "8250" (no root/color info) -> fallback to code + color name
      let cardName: string
      if (c.bitoSku && /[a-zA-Z]/.test(c.bitoSku)) {
        // bitoSku contains letters — parse it for root + color
        const skuName = c.bitoSku.replace(/^\d+-/, '')
        const colorSuffix = extractColorFromSku(c.bitoSku, p.code)
        if (colorSuffix) {
          const rootPart = skuName.slice(0, skuName.length - colorSuffix.length - 1)
          cardName = `${rootPart} ${colorSuffix}`
        } else {
          // Has letters but couldn't parse — use as-is (e.g. "Olive-mini")
          cardName = skuName.replace(/-/g, ' ')
        }
      } else {
        // bitoSku is purely numeric or null — use product code + color name
        cardName = `${p.code} ${c.nameRu}`
      }
      const nameRu = cardName
      const nameUz = cardName

      out.push({
        ...p,
        cardId: `${p.id}:${c.id}`,
        selectedColorId: c.id,
        nameRu,
        nameUz,
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

// ===== FEATURED ===== (кэш 120 сек)
router.get('/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
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

// ===== NEW ===== (кэш 120 сек)
router.get('/new', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
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

// ===== SALE ===== (кэш 120 сек)
router.get('/sale', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
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

// ===== SEARCH ===== (кэш 60 сек)
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit = '20' } = req.query
    if (!q) return res.json({ success: true, data: [] })

    const cacheKey = `search_${q}_${limit}`
    if (trySendCached(cacheKey, res)) return

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        inStock: true,
        OR: [
          { nameRu: { contains: q as string, mode: 'insensitive' } },
          { nameUz: { contains: q as string, mode: 'insensitive' } },
          { code: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: productListInclude,
      take: parseInt(limit as string),
    })

    const response = { success: true, data: explodeByColor(products as any) }
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

// ===== СПИСОК ===== (кэш 60 сек)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1', limit = '20', category,
      minPrice, maxPrice, sortBy = 'newest', inStock,
    } = req.query

    const cacheKey = `products_${page}_${limit}_${category || ''}_${minPrice || ''}_${maxPrice || ''}_${sortBy}_${inStock || ''}`
    if (trySendCached(cacheKey, res)) return

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.ProductWhereInput = { isActive: true, inStock: true }

    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category as string },
        include: { children: { where: { isActive: true }, select: { id: true } } },
      })
      if (cat) {
        const childIds = cat.children.map(c => c.id)
        if (childIds.length > 0) {
          where.categoryId = { in: [cat.id, ...childIds] }
        } else {
          where.categoryId = cat.id
        }
      }
    }

    if (minPrice) where.price = { ...(where.price as object), gte: parseInt(minPrice as string) }
    if (maxPrice) where.price = { ...(where.price as object), lte: parseInt(maxPrice as string) }
    // `inStock` filter from the client is now redundant — every product in the list is in stock by default.
    // Kept for backwards compatibility but a value of `false` would never match.
    void inStock

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

// ===== RECOMMENDATIONS ===== (кэш 120 сек)
router.get('/:id/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 8

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

    const product = await prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    })

    if (!product || !product.isActive) throw new AppError('Product not found', 404)

    // Async — не блокируем ответ
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
    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

export default router
