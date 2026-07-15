import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { trySendCached, cacheAndSend } from '../utils/cache'
import { parsePagination, LIMITS } from '../utils/pagination'

const router = Router()

// ===== ВСЕ КАТЕГОРИИ ===== (кэш 180 сек)
// ?root=true — только корневые (parentId IS NULL), по умолчанию все
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rootOnly = req.query.root === 'true'
    const cacheKey = rootOnly ? 'categories_root' : 'categories_all'
    if (trySendCached(cacheKey, res)) return

    const where: any = { isActive: true, parentId: null }
    if (!rootOnly) {
      delete where.parentId
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        wholesaleTemplate: {
          include: {
            tiers: { orderBy: { minQuantity: 'asc' } },
          },
        },
        children: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: {
            products: { where: { isActive: true, inStock: true } },
            children: { where: { isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Sum products of all child categories so the count reflects what the
    // catalog actually shows when the user opens this category.
    const childIds = categories.flatMap(c => c.children.map(ch => ch.id))
    const childCounts = childIds.length
      ? await prisma.product.groupBy({
          by: ['categoryId'],
          where: { isActive: true, inStock: true, categoryId: { in: childIds } },
          _count: { _all: true },
        })
      : []
    const childCountByCat = new Map<string, number>(
      childCounts.map(g => [g.categoryId!, g._count._all]),
    )

    const data = categories.map(cat => {
      const fromChildren = cat.children.reduce(
        (sum, ch) => sum + (childCountByCat.get(ch.id) || 0),
        0,
      )
      const { children: _children, _count, ...rest } = cat
      void _children
      return {
        ...rest,
        productCount: _count.products + fromChildren,
        subcategoryCount: _count.children,
      }
    })

    const response = { success: true, data }
    cacheAndSend(cacheKey, response, 180, res)
  } catch (error) {
    next(error)
  }
})

// ===== КАТЕГОРИЯ ПО SLUG ===== (кэш 60 сек)
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const cacheKey = `category_${slug}`
    if (trySendCached(cacheKey, res)) return

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
                products: { where: { isActive: true, inStock: true } },
                children: { where: { isActive: true } },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: { where: { isActive: true, inStock: true } },
            children: { where: { isActive: true } },
          },
        },
      },
    })

    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404)
    }

    const childrenProductsCount = category.children.reduce(
      (sum, ch) => sum + ch._count.products,
      0,
    )

    const data = {
      ...category,
      productCount: category._count.products + childrenProductsCount,
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
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== ПОДКАТЕГОРИИ ===== (кэш 60 сек)
router.get('/:slug/subcategories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const cacheKey = `category_${slug}_subcategories`
    if (trySendCached(cacheKey, res)) return

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
            products: { where: { isActive: true, inStock: true } },
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
    cacheAndSend(cacheKey, response, 120, res)
  } catch (error) {
    next(error)
  }
})

// ===== ТОВАРЫ КАТЕГОРИИ ===== (кэш 60 сек) - max 100
router.get('/:slug/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const { sortBy = 'newest' } = req.query
    const { page: pageNum, limit: limitNum, skip } = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: LIMITS.CATEGORIES_PRODUCTS,
    })

    const cacheKey = `cat_products_${slug}_${pageNum}_${limitNum}_${sortBy}`
    if (trySendCached(cacheKey, res)) return

    const category = await prisma.category.findUnique({
      where: { slug },
      include: { children: { where: { isActive: true }, select: { id: true } } },
    })

    if (!category) {
      throw new AppError('Category not found', 404)
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'popular') orderBy = { viewCount: 'desc' }

    const childIds = category.children.map(c => c.id)
    const where: any = { isActive: true }
    if (childIds.length > 0) {
      where.categoryId = { in: [category.id, ...childIds] }
    } else {
      where.categoryId = category.id
    }

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

    cacheAndSend(cacheKey, response, 60, res)
  } catch (error) {
    next(error)
  }
})

export default router
