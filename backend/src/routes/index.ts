import { Router } from 'express'
import categoryRoutes from './categoryRoutes'
import productRoutes from './productRoutes'
import cartRoutes from './cartRoutes'
import orderRoutes from './orderRoutes'
import userRoutes from './userRoutes'
import adminRoutes from './adminRoutes'
import adminAuthRoutes from './adminAuthRoutes'
import bitoAdminRoutes from './bitoAdminRoutes'  // 🆕 Bito-импорт: клиенты + сотрудники
import promotionRoutes from './promotionRoutes'  // 🆕 Акции (клиентские)

const router = Router()

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Dekor Market API',
    version: '1.1.0',
    endpoints: {
      categories: '/api/categories',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      user: '/api/user',
      promotions: '/api/promotions',  // 🆕
      admin: '/api/admin',
    },
  })
})

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/admin/auth', adminAuthRoutes)
router.use('/admin', adminRoutes)
router.use('/admin/bito', bitoAdminRoutes)  // 🆕 /api/admin/bito/customers, /api/admin/bito/employees
router.use('/user', userRoutes)
router.use('/promotions', promotionRoutes)  // 🆕 Клиентские роуты акций

export default router