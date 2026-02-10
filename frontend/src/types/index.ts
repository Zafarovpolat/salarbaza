// frontend/src/types/index.ts

// ===== Product Types =====
export interface Product {
  id: string
  code: string
  slug: string
  nameRu: string
  nameUz: string
  descriptionRu?: string
  descriptionUz?: string
  categoryId: string
  category?: Category
  // Базовая цена (или минимальная из вариантов)
  price: number
  oldPrice?: number
  material?: string
  dimensions?: ProductDimensions
  inStock: boolean
  stockQuantity: number
  setQuantity: number
  packaging?: ProductPackaging
  images: ProductImage[]
  colors: ProductColor[]
  // ✅ НОВОЕ: варианты по размеру
  variants: ProductVariant[]
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

// ✅ НОВОЕ: вариант товара по размеру
export interface ProductVariant {
  id: string
  productId: string
  size: string        // "S", "M", "L"
  labelRu: string     // "Маленький"
  labelUz: string     // "Kichik"
  price: number       // Своя цена
  oldPrice?: number
  sku?: string
  inStock: boolean
  stockQuantity: number
  dimensions?: ProductDimensions
  sortOrder: number
}

export interface ProductFilters {
  categorySlug?: string
  categoryId?: string
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'name'
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  colors?: string[]
  materials?: string[]
}

export interface ProductDimensions {
  size?: string
  diameter_cm?: number
  height_cm?: number
  width_cm?: number
  length_cm?: number
  volume_liters?: number
}

export interface ProductPackaging {
  bags_per_box: number
  pcs_per_bag: number
  total_pcs: number
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  sortOrder: number
  isMain: boolean
}

export interface ProductColor {
  id: string
  nameRu: string
  nameUz: string
  hexCode?: string
  image?: string
  inStock: boolean
  priceModifier: number
}

// ===== Category Types =====
export interface Category {
  id: string
  slug: string
  nameRu: string
  nameUz: string
  descriptionRu?: string
  descriptionUz?: string
  image?: string
  icon?: string
  sortOrder: number
  isActive: boolean
  productCount?: number
  // ✅ НОВОЕ: оптовая информация категории
  wholesaleTemplateId?: string
  wholesaleTemplate?: WholesalePriceTemplate
}

// ✅ НОВОЕ: оптовый шаблон
export interface WholesalePriceTemplate {
  id: string
  name: string
  description?: string
  tiers: WholesalePriceTier[]
}

// ✅ НОВОЕ: уровень оптовой скидки
export interface WholesalePriceTier {
  id: string
  minQuantity: number
  discountPercent: number
}

// ===== Cart Types =====
export interface CartItem {
  id: string
  productId: string
  product: Product
  colorId?: string
  color?: ProductColor
  // ✅ НОВОЕ: выбранный вариант размера
  variantId?: string
  variant?: ProductVariant
  quantity: number
  // Рассчитанные цены
  unitPrice?: number
  totalPrice?: number
  // ✅ НОВОЕ: оптовая скидка (если применяется)
  wholesaleDiscount?: number
  wholesalePrice?: number
}

export interface Cart {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: number
  // ✅ НОВОЕ: сумма оптовой скидки
  wholesaleDiscount?: number
  totalWithWholesale?: number
}

// ===== Order Types =====
export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  deliveryType: DeliveryType
  deliveryAddress?: Address
  customerName: string
  customerPhone: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  customerNote?: string
  createdAt: string
  confirmedAt?: string
  shippedAt?: string
  deliveredAt?: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productCode: string
  productImage?: string
  colorName?: string
  // ✅ НОВОЕ: размер в заказе
  variantSize?: string
  price: number
  quantity: number
  total: number
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type DeliveryType = 'PICKUP' | 'DELIVERY'

export type PaymentMethod = 'CASH' | 'CARD' | 'PAYME' | 'CLICK' | 'UZUM'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

// ===== User Types =====
export interface User {
  id: string
  telegramId: number
  username?: string
  firstName?: string
  lastName?: string
  phone?: string
  language: 'uz' | 'ru'
  addresses: Address[]
}

export interface Address {
  id: string
  title: string
  city: string
  district: string
  street: string
  house: string
  apartment?: string
  landmark?: string
  isDefault: boolean
}

// ===== Utility Types =====

// Вспомогательная функция: получить актуальную цену товара
// с учётом выбранного варианта, цвета и оптовой скидки
export interface PriceCalculation {
  basePrice: number           // Цена варианта (или базовая)
  colorModifier: number       // Модификатор цвета
  unitPrice: number           // basePrice + colorModifier
  wholesaleDiscountPercent: number  // % скидки
  wholesalePrice: number      // Цена после оптовой скидки
  quantity: number
  totalPrice: number          // Итого
}

// ===== API Types =====
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}