import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

export async function getAllCategories() {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
            _count: {
                select: { products: { where: { isActive: true } } }
            }
        }
    })

    return categories.map(cat => ({
        ...cat,
        productCount: cat._count.products,
        _count: undefined,
    }))
}

export async function getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            _count: {
                select: { products: { where: { isActive: true } } }
            }
        }
    })

    if (!category) {
        throw new AppError('Category not found', 404)
    }

    return {
        ...category,
        productCount: category._count.products,
        _count: undefined,
    }
}

export async function getCategoryProducts(
    slug: string,
    page: number = 1,
    limit: number = 20
) {
    const category = await prisma.category.findUnique({
        where: { slug },
    })

    if (!category) {
        throw new AppError('Category not found', 404)
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: {
                categoryId: category.id,
                isActive: true,
            },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                colors: true,
                category: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.product.count({
            where: {
                categoryId: category.id,
                isActive: true,
            },
        }),
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