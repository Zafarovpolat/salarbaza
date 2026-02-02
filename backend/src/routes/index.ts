import { Router } from 'express'
import categoryRoutes from './categoryRoutes'
import productRoutes from './productRoutes'
import cartRoutes from './cartRoutes'
import orderRoutes from './orderRoutes'
import userRoutes from './userRoutes'
import adminRoutes from './adminRoutes'
import testRoutes from './testRoutes'  // TEST endpoint

const router = Router()

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'DekorHouse API',
        version: '1.0.0',
        endpoints: {
            categories: '/api/categories',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders',
            user: '/api/user',
            test: '/api/test'  // TEST endpoint
        }
    })
})

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/admin', adminRoutes)
router.use('/user', userRoutes)
router.use('/test', testRoutes)  // TEST endpoint

export default router