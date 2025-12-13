import { Request, Response, NextFunction } from 'express'
import * as productService from '../services/productService'

export async function getProducts(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const {
            page = '1',
            limit = '20',
            category,
            minPrice,
            maxPrice,
            sortBy = 'newest',
            inStock,
        } = req.query

        const result = await productService.getProducts({
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            categorySlug: category as string,
            minPrice: minPrice ? parseInt(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
            sortBy: sortBy as string,
            inStock: inStock === 'true' ? true : undefined,
        })

        res.json({
            success: true,
            ...result,
        })
    } catch (error) {
        next(error)
    }
}

export async function getProductBySlug(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { slug } = req.params
        const product = await productService.getProductBySlug(slug)

        // Increment view count
        await productService.incrementViewCount(product.id)

        res.json({
            success: true,
            data: product,
        })
    } catch (error) {
        next(error)
    }
}

export async function getFeaturedProducts(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { limit = '10' } = req.query
        const products = await productService.getFeaturedProducts(
            parseInt(limit as string)
        )

        res.json({
            success: true,
            data: products,
        })
    } catch (error) {
        next(error)
    }
}

export async function getNewProducts(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { limit = '10' } = req.query
        const products = await productService.getNewProducts(
            parseInt(limit as string)
        )

        res.json({
            success: true,
            data: products,
        })
    } catch (error) {
        next(error)
    }
}

export async function searchProducts(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { q, limit = '20' } = req.query

        if (!q || typeof q !== 'string') {
            return res.json({
                success: true,
                data: [],
            })
        }

        const products = await productService.searchProducts(
            q,
            parseInt(limit as string)
        )

        res.json({
            success: true,
            data: products,
        })
    } catch (error) {
        next(error)
    }
}