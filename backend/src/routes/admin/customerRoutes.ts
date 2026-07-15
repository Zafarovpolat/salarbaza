import { Router } from 'express'
import { prisma } from '../../config/database'
import { parsePagination, LIMITS, parseSearchQuery } from '../../utils/pagination'
const router = Router()
// ==================== CUSTOMERS ====================

router.get('/customers', async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      hasOrders = 'all',
    } = req.query
    const { page: pageNum, limit: limitNum, skip } = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: LIMITS.ADMIN_LIST,
    })
    const search = parseSearchQuery(req.query)

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (hasOrders === 'yes') {
      where.orders = { some: {} }
    } else if (hasOrders === 'no') {
      where.orders = { none: {} }
    }

    const customers = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            favorites: true,
          },
        },
      },
      orderBy: { [sortBy as string]: sortOrder },
    })

    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const completedOrders = customer.orders.filter(o => o.status === 'DELIVERED').length
      const lastOrder = customer.orders[0] || null

      return {
        id: customer.id,
        telegramId: customer.telegramId.toString(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        username: customer.username,
        phone: customer.phone,
        language: customer.language,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        defaultAddress: customer.addresses[0] || null,
        stats: {
          totalOrders: customer._count.orders,
          completedOrders,
          cancelledOrders: customer.orders.filter(o => o.status === 'CANCELLED').length,
          totalSpent,
          averageOrderValue: customer._count.orders > 0 ? Math.round(totalSpent / customer._count.orders) : 0,
          favoritesCount: customer._count.favorites,
          lastOrderAt: lastOrder?.createdAt || null,
          lastOrderStatus: lastOrder?.status || null,
        },
      }
    })

    if (sortBy === 'totalOrders') {
      customersWithStats.sort((a, b) =>
        sortOrder === 'desc' ? b.stats.totalOrders - a.stats.totalOrders : a.stats.totalOrders - b.stats.totalOrders
      )
    } else if (sortBy === 'totalSpent') {
      customersWithStats.sort((a, b) =>
        sortOrder === 'desc' ? b.stats.totalSpent - a.stats.totalSpent : a.stats.totalSpent - b.stats.totalSpent
      )
    }

    const total = await prisma.user.count({ where })

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers/stats', async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalCustomers, customersWithOrders, newCustomers30d, newCustomers7d, activeCustomers, orderStats] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { orders: { some: {} } } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({
          where: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        }),
        prisma.order.aggregate({
          _sum: { total: true },
          _avg: { total: true },
          _count: true,
        }),
      ])

    const topCustomersRaw = await prisma.user.findMany({
      take: 10,
      include: {
        orders: { select: { total: true } },
        _count: { select: { orders: true } },
      },
    })

    const topCustomers = topCustomersRaw
      .map(customer => ({
        id: customer.id,
        name:
          [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username || 'Без имени',
        username: customer.username,
        ordersCount: customer._count.orders,
        totalSpent: customer.orders.reduce((sum, o) => sum + o.total, 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          customersWithOrders,
          customersWithoutOrders: totalCustomers - customersWithOrders,
          newCustomers30d,
          newCustomers7d,
          activeCustomers,
          conversionRate: totalCustomers > 0 ? ((customersWithOrders / totalCustomers) * 100).toFixed(1) : '0',
        },
        financial: {
          totalRevenue: orderStats._sum.total || 0,
          averageOrderValue: Math.round(orderStats._avg.total || 0),
          totalOrders: orderStats._count,
        },
        topCustomers,
      },
    })
  } catch (error) {
    console.error('Get customer stats error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        favorites: {
          include: {
            product: {
              select: {
                id: true,
                nameRu: true,
                nameUz: true,
                slug: true,
                price: true,
                images: { take: 1 },
              },
            },
          },
        },
        cart: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    nameRu: true,
                    nameUz: true,
                    price: true,
                    images: { take: 1 },
                  },
                },
                variant: true,
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
    const completedOrders = customer.orders.filter(o => o.status === 'DELIVERED')
    const cancelledOrders = customer.orders.filter(o => o.status === 'CANCELLED')

    const ordersByMonth: Record<string, { count: number; amount: number }> = {}
    customer.orders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7)
      if (!ordersByMonth[month]) {
        ordersByMonth[month] = { count: 0, amount: 0 }
      }
      ordersByMonth[month].count++
      ordersByMonth[month].amount += order.total
    })

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          telegramId: customer.telegramId.toString(),
          firstName: customer.firstName,
          lastName: customer.lastName,
          username: customer.username,
          phone: customer.phone,
          language: customer.language,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        addresses: customer.addresses,
        orders: customer.orders.map(order => ({
          ...order,
          customerPhone: order.customerPhone,
          items: order.items.map(item => ({
            productName: item.productName,
            productCode: item.productCode,
            productImage: item.productImage,
            variantSize: item.variantSize,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
        favorites: customer.favorites.map(f => ({
          id: f.product.id,
          nameRu: f.product.nameRu,
          nameUz: f.product.nameUz,
          slug: f.product.slug,
          price: f.product.price,
          image: f.product.images[0]?.url || null,
        })),
        cart: customer.cart
          ? {
              id: customer.cart.id,
              items: customer.cart.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                product: {
                  id: item.product.id,
                  nameRu: item.product.nameRu,
                  nameUz: item.product.nameUz,
                  price: item.product.price,
                  image: item.product.images[0]?.url || null,
                },
                variant: item.variant
                  ? {
                      id: item.variant.id,
                      size: item.variant.size,
                      labelRu: item.variant.labelRu,
                      price: item.variant.price,
                    }
                  : null,
              })),
            }
          : null,
        stats: {
          totalOrders: customer.orders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: customer.orders.filter(o =>
            ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)
          ).length,
          totalSpent,
          averageOrderValue: customer.orders.length > 0 ? Math.round(totalSpent / customer.orders.length) : 0,
          favoritesCount: customer.favorites.length,
          cartItemsCount: customer.cart?.items.length || 0,
          firstOrderAt:
            customer.orders.length > 0 ? customer.orders[customer.orders.length - 1].createdAt : null,
          lastOrderAt: customer.orders[0]?.createdAt || null,
          ordersByMonth,
        },
      },
    })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/customers-export', async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      include: {
        orders: { select: { total: true } },
        addresses: { where: { isDefault: true }, take: 1 },
      },
    })

    const csvRows = [
      ['ID', 'Telegram ID', 'Имя', 'Фамилия', 'Username', 'Телефон', 'Заказов', 'Сумма покупок', 'Город', 'Дата регистрации'].join(','),
    ]

    customers.forEach(customer => {
      const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0)
      const address = customer.addresses[0]

      csvRows.push(
        [
          customer.id,
          customer.telegramId.toString(),
          customer.firstName || '',
          customer.lastName || '',
          customer.username || '',
          customer.phone || '',
          customer.orders.length.toString(),
          totalSpent.toString(),
          address?.city || '',
          customer.createdAt.toISOString().split('T')[0],
        ].join(',')
      )
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=customers_${new Date().toISOString().split('T')[0]}.csv`
    )
    res.send('\uFEFF' + csv)
  } catch (error) {
    console.error('Export customers error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})


export default router
