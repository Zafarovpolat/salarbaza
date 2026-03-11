// backend/src/services/productService.ts

import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'

// ✅ Стандартный include для товаров — теперь с variants и wholesale
const productInclude = {
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

// Минимальный include (для списков)
const productListInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  colors: true,
  variants: { orderBy: { sortOrder: 'asc' as const } },
  category: true,
}

interface GetProductsParams {
  page?: number
  limit?: number
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  inStock?: boolean
}

export async function getProducts(params: GetProductsParams) {
  const {
    page = 1,
    limit = 20,
    categorySlug,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    inStock,
  } = params

  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  }

  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    })
    if (category) {
      where.categoryId = category.id
    }
  }

  if (minPrice !== undefined) {
    where.price = { ...(where.price as object), gte: minPrice }
  }

  if (maxPrice !== undefined) {
    where.price = { ...(where.price as object), lte: maxPrice }
  }

  if (inStock) {
    where.inStock = true
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }

  switch (sortBy) {
    case 'price_asc':
      orderBy = { price: 'asc' }
      break
    case 'price_desc':
      orderBy = { price: 'desc' }
      break
    case 'popular':
      orderBy = { viewCount: 'desc' }
      break
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productListInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  // ✅ Обогащаем данные: добавляем ценовой диапазон если есть варианты
  const enrichedProducts = products.map(enrichProductData)

  return {
    data: enrichedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  })

  if (!product || !product.isActive) {
    throw new AppError('Product not found', 404)
  }

  return enrichProductData(product)
}

export async function getFeaturedProducts(limit: number = 10) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: productListInclude,
    orderBy: { viewCount: 'desc' },
    take: limit,
  })

  return products.map(enrichProductData)
}

export async function getNewProducts(limit: number = 10) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isNew: true,
    },
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return products.map(enrichProductData)
}

export async function searchProducts(query: string, limit: number = 20) {
  const searchQuery = query.toLowerCase()

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { nameRu: { contains: searchQuery, mode: 'insensitive' } },
        { nameUz: { contains: searchQuery, mode: 'insensitive' } },
        { code: { contains: searchQuery, mode: 'insensitive' } },
        { descriptionRu: { contains: searchQuery, mode: 'insensitive' } },
        { descriptionUz: { contains: searchQuery, mode: 'insensitive' } },
      ],
    },
    include: productListInclude,
    take: limit,
  })

  return products.map(enrichProductData)
}

export async function incrementViewCount(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
  })
}

// ✅ НОВАЯ ФУНКЦИЯ: обогащение данных товара
// Добавляет priceRange, minPrice, maxPrice если есть варианты
function enrichProductData(product: any) {
  const hasVariants = product.variants && product.variants.length > 0

  if (hasVariants) {
    const prices = product.variants
      .filter((v: any) => v.inStock)
      .map((v: any) => v.price)

    const allPrices = product.variants.map((v: any) => v.price)

    return {
      ...product,
      hasVariants: true,
      minPrice: Math.min(...(prices.length > 0 ? prices : allPrices)),
      maxPrice: Math.max(...(prices.length > 0 ? prices : allPrices)),
      priceRange: prices.length > 1 && Math.min(...prices) !== Math.max(...prices),
    }
  }

  return {
    ...product,
    hasVariants: false,
    minPrice: product.price,
    maxPrice: product.price,
    priceRange: false,
  }
}