import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

interface AddToCartData {
    productId: string
    quantity: number
    colorId?: string
}

export async function getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: { where: { isMain: true }, take: 1 },
                            colors: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: { where: { isMain: true }, take: 1 },
                                colors: true,
                            },
                        },
                    },
                },
            },
        })
    }

    // Calculate totals
    const items = cart.items.map(item => {
        const color = item.colorId
            ? item.product.colors.find(c => c.id === item.colorId)
            : null
        const priceModifier = color?.priceModifier || 0
        const unitPrice = item.product.price + priceModifier

        return {
            ...item,
            color,
            unitPrice,
            totalPrice: unitPrice * item.quantity,
        }
    })

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

    return {
        id: cart.id,
        items,
        itemCount,
        subtotal,
    }
}

export async function addToCart(userId: string, data: AddToCartData) {
    const { productId, quantity, colorId } = data

    // Verify product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })

    if (!product || !product.isActive) {
        throw new AppError('Product not found', 404)
    }

    if (!product.inStock) {
        throw new AppError('Product is out of stock', 400)
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
        where: { userId },
    })

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
        })
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            colorId: colorId || null,
        },
    })

    if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
        })
    } else {
        // Create new item
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                colorId,
                quantity,
            },
        })
    }

    return getCart(userId)
}

export async function updateCartItem(
    userId: string,
    itemId: string,
    quantity: number
) {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    })

    if (!cart) {
        throw new AppError('Cart not found', 404)
    }

    const item = await prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cartId: cart.id,
        },
    })

    if (!item) {
        throw new AppError('Cart item not found', 404)
    }

    if (quantity <= 0) {
        await prisma.cartItem.delete({
            where: { id: itemId },
        })
    } else {
        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        })
    }

    return getCart(userId)
}

export async function removeFromCart(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    })

    if (!cart) {
        throw new AppError('Cart not found', 404)
    }

    const item = await prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cartId: cart.id,
        },
    })

    if (!item) {
        throw new AppError('Cart item not found', 404)
    }

    await prisma.cartItem.delete({
        where: { id: itemId },
    })

    return getCart(userId)
}

export async function clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    })

    if (cart) {
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        })
    }
}