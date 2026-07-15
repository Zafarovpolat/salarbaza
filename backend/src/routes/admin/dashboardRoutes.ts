import{Router}from'express';import{prisma}from'../../config/database';import{invalidateCache}from'../../utils/cache';const router=Router();
// ==================== RESET PRODUCT STATUSES ====================
// ✅ НОВОЕ: Сброс всех статусов товаров
router.post('/products/reset-statuses', async (req, res) => {
  try {
    const result = await prisma.product.updateMany({
      data: {
        isFeatured: false,
        isNew: false,
        isSpecialOffer: false,
      },
    })

    invalidateCache()

    res.json({
      success: true,
      message: `Статусы сброшены для ${result.count} товаров`,
      data: { updatedCount: result.count },
    })
  } catch (error) {
    console.error('Reset statuses error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ==================== BULK TAG UPDATE ====================
// ✅ Массовое обновление тегов товаров
router.post('/products/bulk-tags', async (req, res) => {
  try {
    const { productIds, tags } = req.body
    // tags: { isFeatured?: boolean, isNew?: boolean, isSpecialOffer?: boolean, isActive?: boolean }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'productIds required' })
    }

    const updateData: any = {}
    if (tags.isFeatured !== undefined) updateData.isFeatured = tags.isFeatured
    if (tags.isNew !== undefined) updateData.isNew = tags.isNew
    if (tags.isSpecialOffer !== undefined) updateData.isSpecialOffer = tags.isSpecialOffer
    if (tags.isActive !== undefined) updateData.isActive = tags.isActive

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    })

    invalidateCache()

    res.json({
      success: true,
      message: `Обновлено ${result.count} товаров`,
      data: { updatedCount: result.count },
    })
  } catch (error: any) {
    console.error('Bulk tags error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== DASHBOARD ====================
router.get('/stats', async (req, res) => {
  try {
    const now = new Date()

    const [productsCount, categoriesCount, ordersCount, totalRevenue, activePromotions] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' },
      }),
      prisma.promotion.count({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        productsCount,
        categoriesCount,
        ordersCount,
        totalRevenue: totalRevenue._sum.total || 0,
        activePromotions,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── Dashboard extended data ─────────────────────────────────────────────
router.get('/dashboard-data', async (req, res) => {
  try {
    const now = new Date()
    const sevenDaysAgo  = new Date(now.getTime() - 7  * 86400000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const [
      recentOrders,
      lowStockProducts,
      outOfStockCount,
      newCustomers7d,
      ordersByStatus,
      topCategories,
      revenueThisMonth,
      ordersThisMonth,
    ] = await Promise.all([
      // 1. Last 5 orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true, items: true },
      }),
      // 2. Low stock products (1–5 in stock, active)
      prisma.product.findMany({
        where: { isActive: true, stockQuantity: { gt: 0, lte: 5 } },
        select: { id: true, code: true, nameRu: true, stockQuantity: true, price: true },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
      }),
      // 3. Out of stock
      prisma.product.count({ where: { isActive: true, stockQuantity: 0 } }),
      // 4. New customers (7 days)
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      // 5. Orders by status
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      // 6. Top categories by product count
      prisma.category.findMany({
        where: { products: { some: {} } },
        select: {
          id: true, nameRu: true,
          _count: { select: { products: true } },
        },
        orderBy: { products: { _count: 'desc' } },
        take: 8,
      }),
      // 7. Revenue this month
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: 'DELIVERED',
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
      // 8. Orders this month
      prisma.order.count({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
    ])

    res.json({
      success: true,
      data: {
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          status: o.status,
          total: o.total,
          itemsCount: o.items.length,
          createdAt: o.createdAt,
        })),
        lowStockProducts,
        outOfStockCount,
        newCustomers7d,
        ordersByStatus: Object.fromEntries(
          ordersByStatus.map(s => [s.status, s._count.id])
        ),
        topCategories: topCategories.map(c => ({
          id: c.id,
          nameRu: c.nameRu,
          productCount: c._count.products,
        })),
        revenueThisMonth: revenueThisMonth._sum.total || 0,
        ordersThisMonth,
      },
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})


export default router
