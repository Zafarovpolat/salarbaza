// backend/src/services/categoryService.ts

import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

export async function getAllCategories(rootOnly: boolean = false) {

  const where: any = { isActive: true }
  if (rootOnly) {
    where.parentId = null
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } },
          children: { where: { isActive: true } },
        },
      },
      // ✅ НОВОЕ: загружаем оптовый шаблон с тирами
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
        },
      },
      // ✅ Последний добавленный активный товар — чтобы использовать его фото
      // как картинку категории, если у категории нет собственного поля image.
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          images: {
            orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  })

  return categories.map((cat) => {
    const latestProductImage = cat.products?.[0]?.images?.[0]?.url || null
    return {
      ...cat,
      productCount: cat._count.products,
      subcategoryCount: cat._count.children,
      latestProductImage,
      _count: undefined,
      products: undefined,
    }
  })
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } },
          children: { where: { isActive: true } },
        },
      },
      // ✅ НОВОЕ: загружаем оптовый шаблон
      wholesaleTemplate: {
        include: {
          tiers: { orderBy: { minQuantity: 'asc' } },
        },
      },
      // ✅ Подкатегории
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: {
              products: { where: { isActive: true } },
              children: { where: { isActive: true } },
            },
          },
          products: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              images: {
                orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
      // ✅ Последний добавленный активный товар для fallback-картинки категории
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          images: {
            orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  })

  if (!category) {
    throw new AppError('Category not found', 404)
  }

  const latestProductImage = category.products?.[0]?.images?.[0]?.url || null

  return {
    ...category,
    productCount: category._count.products,
    subcategoryCount: category._count.children,
    latestProductImage,
    children: category.children.map((child) => {
      const childImage = child.products?.[0]?.images?.[0]?.url || null
      return {
        ...child,
        productCount: child._count.products,
        subcategoryCount: child._count.children,
        latestProductImage: childImage,
        _count: undefined,
        products: undefined,
      }
    }),
    _count: undefined,
    products: undefined,
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
