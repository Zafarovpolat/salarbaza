import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { Prisma } from '@prisma/client'

interface GetProductsParams {
    page?: number
    limit?: number
    categorySlug?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    inStock?: boolean
}

export async function getProducts(params: GetProductsParams) {
    const {
        page = 1,
        limit = 20,
        categorySlug,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        inStock,
    } = params

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProductWhereInput = {
        isActive: true,
    }

    if (categorySlug) {
        const category = await prisma.category.findUnique({
            where: { slug: categorySlug },
        })
        if (category) {
            where.categoryId = category.id
        }
    }

    if (minPrice !== undefined) {
        where.price = { ...where.price as object, gte: minPrice }
    }

    if (maxPrice !== undefined) {
        where.price = { ...where.price as object, lte: maxPrice }
    }

    if (inStock) {
        where.inStock = true
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }

    switch (sortBy) {
        case 'price_asc':
            orderBy = { price: 'asc' }
            break
        case 'price_desc':
            orderBy = { price: 'desc' }
            break
        case 'popular':
            orderBy = { viewCount: 'desc' }
            break
        case 'newest':
        default:
            orderBy = { createdAt: 'desc' }
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                colors: true,
                category: true,
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma.product.count({ where }),
    ])

    return {
        data: products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export async function getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            colors: true,
            category: true,
        },
    })

    if (!product || !product.isActive) {
        throw new AppError('Product not found', 404)
    }

    return product
}

export async function getFeaturedProducts(limit: number = 10) {
    return prisma.product.findMany({
        where: {
            isActive: true,
            isFeatured: true,
        },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            colors: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
    })
}

export async function getNewProducts(limit: number = 10) {
    return prisma.product.findMany({
        where: {
            isActive: true,
            isNew: true,
        },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            colors: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
}

export async function searchProducts(query: string, limit: number = 20) {
    const searchQuery = query.toLowerCase()

    return prisma.product.findMany({
        where: {
            isActive: true,
            OR: [
                { nameRu: { contains: searchQuery, mode: 'insensitive' } },
                { nameUz: { contains: searchQuery, mode: 'insensitive' } },
                { code: { contains: searchQuery, mode: 'insensitive' } },
                { descriptionRu: { contains: searchQuery, mode: 'insensitive' } },
                { descriptionUz: { contains: searchQuery, mode: 'insensitive' } },
            ],
        },
        include: {
            images: { orderBy: { sortOrder: 'asc' } },
            colors: true,
        },
        take: limit,
    })
}

export async function incrementViewCount(productId: string) {
    await prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
    })
}