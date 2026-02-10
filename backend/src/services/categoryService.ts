// backend/src/services/categoryService.ts

import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
      // ✅ НОВОЕ: загружаем оптовый шаблон с тирами
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
        },
      },
    },
  })

  return categories.map((cat) => ({
    ...cat,
    productCount: cat._count.products,
    _count: undefined,
  }))
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: { where: { isActive: true } } },
      },
      // ✅ НОВОЕ: загружаем оптовый шаблон
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
        },
      },
    },
  })

  if (!category) {
    throw new AppError('Category not found', 404)
  }

  return {
    ...category,
    productCount: category._count.products,
    _count: undefined,
  }
}

export async function getCategoryProducts(
  slug: string,
  page: number = 1,
  limit: number = 20
) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
        },
      },
    },
  })

  if (!category) {
    throw new AppError('Category not found', 404)
  }

  const skip = (page - 1) * limit

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        colors: true,
        variants: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({
      where: {
        categoryId: category.id,
        isActive: true,
      },
    }),
  ])

  return {
    category,
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ✅ НОВАЯ ФУНКЦИЯ: получить оптовую скидку для категории по количеству
export function getWholesaleDiscount(
  wholesaleTemplate: any,
  quantity: number
): number {
  if (!wholesaleTemplate || !wholesaleTemplate.tiers || wholesaleTemplate.tiers.length === 0) {
    return 0
  }

  // Сортируем по убыванию minQuantity и находим подходящий тир
  const sortedTiers = [...wholesaleTemplate.tiers].sort(
    (a: any, b: any) => b.minQuantity - a.minQuantity
  )

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return tier.discountPercent
    }
  }

  return 0
}