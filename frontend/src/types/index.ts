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
  variants: ProductVariant[]
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  size: string
  labelRu: string
  labelUz: string
  price: number
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
  wholesaleTemplateId?: string
  wholesaleTemplate?: WholesalePriceTemplate
}

export interface WholesalePriceTemplate {
  id: string
  name: string
  description?: string
  tiers: WholesalePriceTier[]
}

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
  variantId?: string
  variant?: ProductVariant
  quantity: number
  unitPrice?: number
  totalPrice?: number
  wholesaleDiscount?: number
  wholesalePrice?: number
}

export interface Cart {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: number
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
export interface PriceCalculation {
  basePrice: number
  colorModifier: number
  unitPrice: number
  wholesaleDiscountPercent: number
  wholesalePrice: number
  quantity: number
  totalPrice: number
}

// =============================================
// 🆕 PROMOTION TYPES (Акции / Спецпредложения)
// =============================================

export type PromotionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE'

export type PromotionType = 'SALE' | 'COLLECTION' | 'LIMITED' | 'NEW_ARRIVALS'

export interface Promotion {
  id: string
  slug: string
  nameRu: string
  nameUz: string
  descriptionRu?: string
  descriptionUz?: string
  rulesRu?: string
  rulesUz?: string
  image?: string
  type: PromotionType
  status: PromotionStatus
  startDate: string
  endDate: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  // Товары (при получении полной акции)
  products?: Product[]
  // Счётчик товаров (при получении списка)
  _count?: {
    products: number
  }
}

export interface PromotionProduct {
  id: string
  promotionId: string
  productId: string
  sortOrder: number
  product: Product
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