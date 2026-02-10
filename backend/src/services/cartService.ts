// backend/src/services/cartService.ts

import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { getWholesaleDiscount } from './categoryService'

interface AddToCartData {
  productId: string
  quantity: number
  colorId?: string
  // ✅ НОВОЕ: ID варианта размера
  variantId?: string
}

// Стандартный include для корзины
const cartItemInclude = {
  product: {
    include: {
      images: { where: { isMain: true }, take: 1 },
      colors: true,
      variants: { orderBy: { sortOrder: 'asc' as const } },
      category: {
        include: {
          wholesaleTemplate: {
            include: {
              tiers: { orderBy: { minQuantity: 'asc' as const } },
            },
          },
        },
      },
    },
  },
  // ✅ НОВОЕ: загружаем вариант
  variant: true,
}

export async function getCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: cartItemInclude,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: cartItemInclude,
        },
      },
    })
  }

  // ✅ Рассчитываем цены с учётом вариантов, цветов и оптовых скидок
  let totalWholesaleDiscount = 0

  const items = cart.items.map((item) => {
    const color = item.colorId
      ? item.product.colors.find((c) => c.id === item.colorId)
      : null
    const priceModifier = color?.priceModifier || 0

    // ✅ НОВОЕ: цена берётся из варианта, если он выбран
    const basePrice = item.variant ? item.variant.price : item.product.price
    const unitPrice = basePrice + priceModifier

    // ✅ НОВОЕ: оптовая скидка из категории
    const wholesaleDiscountPercent = getWholesaleDiscount(
      item.product.category?.wholesaleTemplate,
      item.quantity
    )
    const discountAmount = Math.round(unitPrice * wholesaleDiscountPercent / 100)
    const wholesalePrice = unitPrice - discountAmount
    const itemWholesaleDiscount = discountAmount * item.quantity

    totalWholesaleDiscount += itemWholesaleDiscount

    return {
      ...item,
      color,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      // ✅ НОВОЕ: оптовые данные
      wholesaleDiscountPercent,
      wholesalePrice,
      wholesaleDiscount: itemWholesaleDiscount,
      totalWithWholesale: wholesalePrice * item.quantity,
    }
  })

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalWithWholesale = subtotal - totalWholesaleDiscount

  return {
    id: cart.id,
    items,
    itemCount,
    subtotal,
    // ✅ НОВОЕ
    wholesaleDiscount: totalWholesaleDiscount,
    totalWithWholesale,
  }
}

export async function addToCart(userId: string, data: AddToCartData) {
  const { productId, quantity, colorId, variantId } = data

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  })

  if (!product || !product.isActive) {
    throw new AppError('Product not found', 404)
  }

  if (!product.inStock) {
    throw new AppError('Product is out of stock', 400)
  }

  // ✅ НОВОЕ: проверяем вариант, если передан
  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (!variant) {
      throw new AppError('Product variant not found', 404)
    }
    if (!variant.inStock) {
      throw new AppError('This size is out of stock', 400)
    }
  }

  // ✅ Если у товара есть варианты, но variantId не передан — ошибка
  if (product.variants.length > 0 && !variantId) {
    throw new AppError('Please select a size', 400)
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

  // Check if item already exists (same product + color + variant)
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      colorId: colorId || null,
      variantId: variantId || null,
    },
  })

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        colorId,
        variantId,
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