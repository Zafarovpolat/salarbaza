import { Request, Response, NextFunction } from 'express'
import * as categoryService from '../services/categoryService'
import { logger } from '../utils/logger'

export async function getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        logger.info('📂 GET /categories — запрос получен')

        const categories = await categoryService.getAllCategories()

        logger.info(`📂 GET /categories — найдено ${categories.length} категорий`)

        // Логируем первую категорию для проверки
        if (categories.length > 0) {
            logger.info(`📂 Первая категория: ${JSON.stringify({
                id: categories[0].id,
                slug: categories[0].slug,
                nameRu: categories[0].nameRu,
                isActive: categories[0].isActive,
                productCount: categories[0].productCount,
            })}`)
        } else {
            logger.warn('⚠️ GET /categories — 0 категорий! Проверьте БД.')
        }

        res.json({
            success: true,
            data: categories,
        })
    } catch (error: any) {
        logger.error(`❌ GET /categories — ошибка: ${error.message}`)
        logger.error(`❌ Stack: ${error.stack}`)
        next(error)
    }
}

export async function getCategoryBySlug(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { slug } = req.params
        logger.info(`📂 GET /categories/${slug}`)

        const category = await categoryService.getCategoryBySlug(slug)

        logger.info(`📂 Категория найдена: ${category.nameRu} (${category.productCount} товаров)`)

        res.json({
            success: true,
            data: category,
        })
    } catch (error: any) {
        logger.error(`❌ GET /categories/${req.params.slug} — ошибка: ${error.message}`)
        next(error)
    }
}

export async function getCategoryProducts(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { slug } = req.params
        const { page = '1', limit = '20' } = req.query

        logger.info(`📂 GET /categories/${slug}/products — page=${page}, limit=${limit}`)

        const result = await categoryService.getCategoryProducts(
            slug,
            parseInt(page as string),
            parseInt(limit as string)
        )

        logger.info(`📂 Найдено ${result.data.length} товаров (всего ${result.pagination.total})`)

        res.json({
            success: true,
            ...result,
        })
    } catch (error: any) {
        logger.error(`❌ GET /categories/${req.params.slug}/products — ошибка: ${error.message}`)
        next(error)
    }
}