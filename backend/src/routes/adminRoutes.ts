import { Router } from 'express'
import { adminAuth } from '../middleware/adminSession'
import uploadsRoutes from './admin/uploadsRoutes'
import dashboardRoutes from './admin/dashboardRoutes'
import productRoutes from './admin/productRoutes'
import categoryRoutes from './admin/categoryRoutes'
import orderRoutes from './admin/orderRoutes'
import wholesaleRoutes from './admin/wholesaleRoutes'
import promotionRoutes from './admin/promotionRoutes'
import customerRoutes from './admin/customerRoutes'
import developerRoutes from './admin/developerRoutes'
const router = Router()
router.use(adminAuth)
router.use(uploadsRoutes)
router.use(dashboardRoutes)
router.use(productRoutes)
router.use(categoryRoutes)
router.use(orderRoutes)
router.use(wholesaleRoutes)
router.use(promotionRoutes)
router.use(customerRoutes)
router.use(developerRoutes)
export default router
