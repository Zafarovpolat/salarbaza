import { Router } from 'express'
import categoryRoutes from './categoryRoutes'
import productRoutes from './productRoutes'
import cartRoutes from './cartRoutes'
import orderRoutes from './orderRoutes'
import userRoutes from './userRoutes'

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
            user: '/api/user'
        }
    })
})

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/user', userRoutes)

export default router