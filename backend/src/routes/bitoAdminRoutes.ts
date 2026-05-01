// backend/src/routes/bitoAdminRoutes.ts
//
// Admin routes for Bito-imported data: customers (table bito_customers, prisma model Customer)
// and employees (table bito_employees, prisma model Employee). These are READ-ONLY: data is
// owned by Bito ERP and synced one-way; we never write back to Bito.

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { config } from '../config'

const router = Router()

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminPassword = req.headers['x-admin-password'] as string
  if (adminPassword !== config.adminPassword) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}

router.use(adminAuth)

// ==================== BITO CUSTOMERS ====================

// GET /api/admin/bito/customers
// Query: page, limit, search, sortBy, sortOrder, isActive (yes|no|all), hasBalance (debt|credit|zero|all)
router.get('/customers', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'totalSale',
      sortOrder = 'desc',
      isActive = 'all',
      hasBalance = 'all',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } },
        { bitoId: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive === 'yes') where.isActive = true
    else if (isActive === 'no') where.isActive = false

    if (hasBalance === 'debt') where.balance = { lt: 0 }
    else if (hasBalance === 'credit') where.balance = { gt: 0 }
    else if (hasBalance === 'zero') where.balance = 0

    const allowedSort = new Set([
      'name',
      'phone',
      'totalSale',
      'avgSale',
      'point',
      'balance',
      'createdAt',
      'updatedAt',
      'bitoCreatedAt',
    ])
    const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'totalSale'
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc'

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir },
        select: {
          id: true,
          bitoId: true,
          name: true,
          phone: true,
          extraPhones: true,
          cardNumber: true,
          type: true,
          totalSale: true,
          avgSale: true,
          point: true,
          balance: true,
          balanceCurrency: true,
          isActive: true,
          bitoCreatedAt: true,
          bitoUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    })
  } catch (error: any) {
    console.error('Get bito customers error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// GET /api/admin/bito/customers/stats
router.get('/customers/stats', async (req, res) => {
  try {
    const [total, active, inactive, debtors, creditors, balanceAgg, totalSaleAgg, topCustomers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: false } }),
      prisma.customer.count({ where: { balance: { lt: 0 } } }),
      prisma.customer.count({ where: { balance: { gt: 0 } } }),
      prisma.customer.aggregate({
        _sum: { balance: true },
        _min: { balance: true },
        _max: { balance: true },
      }),
      prisma.customer.aggregate({
        _sum: { totalSale: true, point: true },
        _avg: { totalSale: true },
      }),
      prisma.customer.findMany({
        take: 10,
        orderBy: { totalSale: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          totalSale: true,
          avgSale: true,
          balance: true,
          point: true,
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        overview: {
          total,
          active,
          inactive,
          debtors,
          creditors,
        },
        financial: {
          totalBalance: balanceAgg._sum.balance || 0,
          minBalance: balanceAgg._min.balance || 0,
          maxBalance: balanceAgg._max.balance || 0,
          totalSale: totalSaleAgg._sum.totalSale || 0,
          totalPoints: totalSaleAgg._sum.point || 0,
          averageSale: Math.round(totalSaleAgg._avg.totalSale || 0),
        },
        topCustomers,
      },
    })
  } catch (error: any) {
    console.error('Get bito customers stats error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// GET /api/admin/bito/customers/:id
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    })

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    res.json({ success: true, data: { customer } })
  } catch (error: any) {
    console.error('Get bito customer error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// GET /api/admin/bito/customers-export — CSV
router.get('/customers-export', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalSale: 'desc' },
      select: {
        bitoId: true,
        name: true,
        phone: true,
        cardNumber: true,
        type: true,
        totalSale: true,
        avgSale: true,
        balance: true,
        point: true,
        isActive: true,
        bitoCreatedAt: true,
      },
    })

    const csvRows = [
      [
        'Bito ID',
        'Имя',
        'Телефон',
        'Карта',
        'Тип',
        'Кол-во покупок',
        'Средний чек',
        'Баланс',
        'Бонусы',
        'Активен',
        'Создан в Bito',
      ].join(','),
    ]

    customers.forEach((c) => {
      const row = [
        c.bitoId,
        (c.name || '').replace(/"/g, '""'),
        c.phone || '',
        c.cardNumber || '',
        c.type || '',
        c.totalSale,
        c.avgSale,
        c.balance,
        c.point,
        c.isActive ? 'да' : 'нет',
        c.bitoCreatedAt ? c.bitoCreatedAt.toISOString().slice(0, 10) : '',
      ]
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v)))
        .join(',')
      csvRows.push(row)
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bito_customers_${new Date().toISOString().slice(0, 10)}.csv`
    )
    res.send('\uFEFF' + csv)
  } catch (error: any) {
    console.error('Export bito customers error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// ==================== BITO EMPLOYEES ====================

// GET /api/admin/bito/employees
router.get('/employees', async (req, res) => {
  try {
    const { page = '1', limit = '50', search, isActive = 'all', sortBy = 'fullName', sortOrder = 'asc' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50))
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search && typeof search === 'string') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { positionName: { contains: search, mode: 'insensitive' } },
        { roleName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive === 'yes') where.isActive = true
    else if (isActive === 'no') where.isActive = false

    const allowedSort = new Set(['fullName', 'phone', 'positionName', 'roleName', 'createdAt', 'bitoCreatedAt'])
    const sortField = allowedSort.has(String(sortBy)) ? String(sortBy) : 'fullName'
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc'

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir },
        select: {
          id: true,
          bitoId: true,
          fullName: true,
          phone: true,
          number: true,
          positionId: true,
          positionName: true,
          roleId: true,
          roleName: true,
          isActive: true,
          bitoCreatedAt: true,
          bitoUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.employee.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    })
  } catch (error: any) {
    console.error('Get bito employees error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// GET /api/admin/bito/employees/:id
router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } })
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }
    res.json({ success: true, data: { employee } })
  } catch (error: any) {
    console.error('Get bito employee error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

// GET /api/admin/bito/employees-export
router.get('/employees-export', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        bitoId: true,
        fullName: true,
        phone: true,
        number: true,
        positionName: true,
        roleName: true,
        isActive: true,
        bitoCreatedAt: true,
      },
    })

    const csvRows = [['Bito ID', 'ФИО', 'Телефон', 'Номер', 'Должность', 'Роль', 'Активен', 'Создан в Bito'].join(',')]

    employees.forEach((e) => {
      const row = [
        e.bitoId,
        (e.fullName || '').replace(/"/g, '""'),
        e.phone || '',
        e.number || '',
        e.positionName || '',
        e.roleName || '',
        e.isActive ? 'да' : 'нет',
        e.bitoCreatedAt ? e.bitoCreatedAt.toISOString().slice(0, 10) : '',
      ]
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v)))
        .join(',')
      csvRows.push(row)
    })

    const csv = csvRows.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bito_employees_${new Date().toISOString().slice(0, 10)}.csv`
    )
    res.send('\uFEFF' + csv)
  } catch (error: any) {
    console.error('Export bito employees error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
})

export default router
