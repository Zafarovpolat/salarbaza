import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

interface UpdateProfileData {
    firstName?: string
    lastName?: string
    phone?: string
    language?: 'uz' | 'ru'
}

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            addresses: {
                orderBy: { isDefault: 'desc' },
            },
        },
    })

    if (!user) {
        throw new AppError('User not found', 404)
    }

    return user
}

export async function updateProfile(userId: string, data: UpdateProfileData) {
    return prisma.user.update({
        where: { id: userId },
        data,
        include: {
            addresses: true,
        },
    })
}

export async function getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
            product: {
                include: {
                    images: { orderBy: { sortOrder: 'asc' } },
                    colors: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return favorites.map(f => f.product)
}

export async function addToFavorites(userId: string, productId: string) {
    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })

    if (!product) {
        throw new AppError('Product not found', 404)
    }

    // Check if already in favorites
    const existing = await prisma.favorite.findUnique({
        where: {
            userId_productId: { userId, productId },
        },
    })

    if (existing) {
        return // Already in favorites
    }

    await prisma.favorite.create({
        data: { userId, productId },
    })
}

export async function removeFromFavorites(userId: string, productId: string) {
    await prisma.favorite.deleteMany({
        where: { userId, productId },
    })
}