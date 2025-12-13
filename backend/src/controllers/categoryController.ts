import { Request, Response, NextFunction } from 'express'
import * as categoryService from '../services/categoryService'

export async function getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const categories = await categoryService.getAllCategories()

        res.json({
            success: true,
            data: categories,
        })
    } catch (error) {
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
        const category = await categoryService.getCategoryBySlug(slug)

        res.json({
            success: true,
            data: category,
        })
    } catch (error) {
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

        const result = await categoryService.getCategoryProducts(
            slug,
            parseInt(page as string),
            parseInt(limit as string)
        )

        res.json({
            success: true,
            ...result,
        })
    } catch (error) {
        next(error)
    }
}