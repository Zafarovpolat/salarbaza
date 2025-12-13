import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'

const router = Router()

router.get('/', categoryController.getAllCategories)
router.get('/:slug', categoryController.getCategoryBySlug)
router.get('/:slug/products', categoryController.getCategoryProducts)

export default router