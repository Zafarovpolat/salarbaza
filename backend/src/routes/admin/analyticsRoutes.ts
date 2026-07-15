import { Router } from 'express'
import { prisma } from '../../config/database'

const router = Router()

function getDateRange(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

router.get('/analytics', async (req, res) => {
  try {
    const period = Number(req.query.period) || 30
    const allowed = [7, 30, 90]
    const days = allowed.includes(period) ? period : 30
    const since = getDateRange(days)

    const [orderStats, productViews, addToCart, checkoutStarted, orderCreated, categoryViews, searches, noResultSearches] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        _avg: { total: true },
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      }),
      prisma.analyticsEvent.count({ where: { event: 'product_view', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'add_to_cart', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'checkout_started', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'order_created', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'category_view', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'search', createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { event: 'search_no_results', createdAt: { gte: since } } }),
    ])

    const topProductsRaw: any[] = await (prisma.analyticsEvent.groupBy as any)({
      by: ['productId'],
      where: { event: 'product_view', createdAt: { gte: since }, productId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    }).catch(() => [])

    const topCategoriesRaw: any[] = await (prisma.analyticsEvent.groupBy as any)({
      by: ['categoryId'],
      where: { event: 'category_view', createdAt: { gte: since }, categoryId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    }).catch(() => [])

    const topProductIds = topProductsRaw.map((p: any) => p.productId).filter(Boolean) as string[]
    const topProducts = topProductIds.length
      ? await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, code: true, nameRu: true, slug: true, price: true } })
      : []

    const topProductsWithCounts = topProductsRaw.map((r: any) => {
      const prod = topProducts.find((p) => p.id === r.productId)
      return { productId: r.productId, count: r._count._all, product: prod || null }
    })

    const topCategoryIds = topCategoriesRaw.map((c: any) => c.categoryId).filter(Boolean) as string[]
    const topCategories = topCategoryIds.length
      ? await prisma.category.findMany({ where: { id: { in: topCategoryIds } }, select: { id: true, nameRu: true, slug: true } })
      : []

    const topCategoriesWithCounts = topCategoriesRaw.map((r: any) => {
      const cat = topCategories.find((c) => c.id === r.categoryId)
      return { categoryId: r.categoryId, count: r._count._all, category: cat || null }
    })

    const viewedProductIds = await prisma.analyticsEvent.findMany({
      where: { event: 'product_view', createdAt: { gte: since }, productId: { not: null } },
      distinct: ['productId'],
      select: { productId: true },
      take: 100,
    })
    const orderedProductIds = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      distinct: ['productId'],
      select: { productId: true },
      take: 100,
    })
    const viewedSet = new Set(viewedProductIds.map((v) => v.productId))
    const orderedSet = new Set(orderedProductIds.map((o) => o.productId))
    const viewedNotOrderedIds = Array.from(viewedSet).filter((id) => !orderedSet.has(id)).slice(0, 20)
    const viewedNotOrdered = viewedNotOrderedIds.length
      ? await prisma.product.findMany({ where: { id: { in: viewedNotOrderedIds as string[] } }, select: { id: true, code: true, nameRu: true, slug: true } })
      : []

    const topSearches: any[] = await (prisma.analyticsEvent.groupBy as any)({
      by: ['source'],
      where: { event: 'search', createdAt: { gte: since }, source: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    }).catch(() => [])

    const telegramSources: any[] = await (prisma.analyticsEvent.groupBy as any)({
      by: ['source'],
      where: { createdAt: { gte: since }, source: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 20,
    }).catch(() => [])

    const distinctSessions = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      distinct: ['sessionId'],
      select: { sessionId: true },
    }).catch(() => [])
    const totalSessions = distinctSessions.length

    const conversion = {
      productViews,
      addToCart,
      addToCartRate: productViews ? (addToCart / productViews) * 100 : 0,
      checkoutStarted,
      checkoutRate: addToCart ? (checkoutStarted / addToCart) * 100 : 0,
      orderCreated,
      orderRate: checkoutStarted ? (orderCreated / checkoutStarted) * 100 : 0,
    }

    res.json({
      success: true,
      data: {
        period: days,
        since,
        revenue: orderStats._sum.total || 0,
        orders: orderStats._count._all || 0,
        avgOrderValue: Math.round(orderStats._avg.total || 0),
        sessions: totalSessions,
        productViews,
        categoryViews,
        searches,
        noResultSearches,
        conversion,
        topProducts: topProductsWithCounts,
        topCategories: topCategoriesWithCounts,
        viewedNotOrdered,
        topSearches,
        telegramSources,
      },
    })
  } catch (error: any) {
    console.error('Admin analytics error', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/analytics/status', async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [total, lastEvent, last24hCount] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true, event: true } }),
      prisma.analyticsEvent.count({ where: { createdAt: { gte: last24h } } }),
    ])
    res.json({ success: true, data: { total, lastEvent, last24hCount, status: total > 0 ? 'active' : 'no_data' } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
})

export default router
