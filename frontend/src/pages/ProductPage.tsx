// frontend/src/pages/ProductPage.tsx

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share2, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useProduct } from '@/hooks/useProducts'
import { useTelegram } from '@/hooks/useTelegram'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { ProductColor, ProductVariant, WholesalePriceTier } from '@/types'
import { getProductName, getProductDescription, cn } from '@/utils/helpers'
import { formatPrice } from '@/utils/formatPrice'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ColorSelector } from '@/components/product/ColorSelector'
import { SizeSelector } from '@/components/product/SizeSelector'
import { PriceDisplay } from '@/components/product/PriceDisplay'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { ProductRecommendations } from '@/components/product/ProductRecommendations'
import toast from 'react-hot-toast'

export function ProductPage() {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { language, t } = useLanguageStore()
    const { haptic } = useTelegram()
    const { addItem, isInCart } = useCartStore()
    const { toggleFavorite, isFavorite } = useFavoritesStore()

    const { product, isLoading, error } = useProduct(slug || '')

    const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>()
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>()
    const [quantity, setQuantity] = useState(1)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const hasVariants = product?.variants && product.variants.length > 0

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [slug])

    // Сбрасываем выбор при смене товара
    useEffect(() => {
        setSelectedColor(undefined)
        setSelectedVariant(undefined)
        setQuantity(1)
        setCurrentImageIndex(0)
    }, [slug])

    // Инициализация цвета
    useEffect(() => {
        if (product?.colors && product.colors.length > 0) {
            setSelectedColor(product.colors[0])
        }
    }, [product])

    // Инициализация варианта
    useEffect(() => {
        if (product?.variants && product.variants.length > 0) {
            const firstInStock = product.variants.find(v => v.inStock) || product.variants[0]
            setSelectedVariant(firstInStock)
        } else {
            setSelectedVariant(undefined)
        }
    }, [product])

    // Актуальная цена
    const currentPrice = useMemo(() => {
        const basePrice = selectedVariant?.price || product?.price || 0
        const colorModifier = selectedColor?.priceModifier || 0
        return basePrice + colorModifier
    }, [selectedVariant, selectedColor, product])

    // Старая цена
    const currentOldPrice = useMemo(() => {
        if (selectedVariant?.oldPrice) {
            return selectedVariant.oldPrice + (selectedColor?.priceModifier || 0)
        }
        if (product?.oldPrice) {
            return product.oldPrice + (selectedColor?.priceModifier || 0)
        }
        return undefined
    }, [selectedVariant, selectedColor, product])

    // Оптовая скидка из категории
    const wholesaleTiers: WholesalePriceTier[] = useMemo(() => {
        return (product as any)?.category?.wholesaleTemplate?.tiers || []
    }, [product])

    const currentWholesaleDiscount = useMemo(() => {
        if (wholesaleTiers.length === 0) return 0
        const sorted = [...wholesaleTiers].sort((a, b) => b.minQuantity - a.minQuantity)
        for (const tier of sorted) {
            if (quantity >= tier.minQuantity) {
                return tier.discountPercent
            }
        }
        return 0
    }, [wholesaleTiers, quantity])

    const wholesalePrice = useMemo(() => {
        if (currentWholesaleDiscount === 0) return currentPrice
        return Math.round(currentPrice * (1 - currentWholesaleDiscount / 100))
    }, [currentPrice, currentWholesaleDiscount])

    // Финальная цена за единицу (с учётом оптовой скидки)
    const finalUnitPrice = currentWholesaleDiscount > 0 ? wholesalePrice : currentPrice
    const finalTotalPrice = finalUnitPrice * quantity

    if (isLoading) {
        return <ProductPageSkeleton />
    }

    if (error || !product) {
        return (
            <Container className="py-12 text-center">
                <p className="text-gray-500">{t('common.error')}</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                    {t('common.back')}
                </Button>
            </Container>
        )
    }

    const name = getProductName(product, language)
    const description = getProductDescription(product, language)
    const images = product.images || []
    const currentImage = images[currentImageIndex]?.url
    const isProductFavorite = isFavorite(product.id)
    const currency = language === 'uz' ? "so'm" : 'сум'

    // Проверка в корзине с учётом варианта
    const productInCart = isInCart(product.id, selectedColor?.id, selectedVariant?.id)

    // Можно ли добавить в корзину
    const canAddToCart = product.inStock &&
        (!hasVariants || (selectedVariant && selectedVariant.inStock))

    // Скидка в процентах
    const discountPercent = currentOldPrice
        ? Math.round((1 - currentPrice / currentOldPrice) * 100)
        : 0

    const handleFavorite = () => {
        haptic.impact('light')
        toggleFavorite(product)
        toast.success(
            !isProductFavorite
                ? (language === 'uz' ? "Sevimlilarga qo'shildi" : 'Добавлено в избранное')
                : (language === 'uz' ? "Sevimlilardan o'chirildi" : 'Удалено из избранного'),
            { duration: 1500 }
        )
    }

    const handleShare = async () => {
        haptic.impact('light')
        try {
            if (navigator.share) {
                await navigator.share({
                    title: name,
                    text: `${name} - DekorHouse`,
                    url: window.location.href,
                })
            } else {
                await navigator.clipboard.writeText(window.location.href)
                toast.success(
                    language === 'uz' ? 'Havola nusxalandi' : 'Ссылка скопирована',
                    { duration: 1500 }
                )
            }
        } catch {
            // cancelled
        }
    }

    const handleAddToCart = () => {
        if (productInCart) {
            navigate('/cart')
            return
        }

        if (hasVariants && !selectedVariant) {
            toast.error(
                language === 'uz'
                    ? "Iltimos, o'lchamni tanlang"
                    : 'Пожалуйста, выберите размер',
                { duration: 2000 }
            )
            return
        }

        if (!canAddToCart) return

        haptic.impact('light')
        addItem(product, quantity, selectedColor, selectedVariant)
        toast.success(
            language === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину',
            { duration: 1500 }
        )
    }

    return (
        <div className="pb-36">
            {/* ===== Image Gallery ===== */}
            <section className="relative bg-gray-100">
                <div className="aspect-square relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={currentImage || '/placeholder.png'}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    </AnimatePresence>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.isNew && <Badge variant="primary">NEW</Badge>}
                        {discountPercent > 0 && (
                            <Badge variant="danger">-{discountPercent}%</Badge>
                        )}
                        {hasVariants && (
                            <Badge variant="default">
                                {product.variants.length} {language === 'uz' ? "o'lcham" : 'размер.'}
                            </Badge>
                        )}
                    </div>

                    {/* Favorite & Share */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleFavorite}
                            className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center',
                                'bg-white/90 backdrop-blur-sm shadow-md',
                                isProductFavorite ? 'text-red-500' : 'text-gray-400'
                            )}
                        >
                            <Heart className="w-5 h-5" fill={isProductFavorite ? 'currentColor' : 'none'} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShare}
                            className="w-10 h-10 rounded-full flex items-center justify-center
                                bg-white/90 backdrop-blur-sm shadow-md text-gray-400"
                        >
                            <Share2 className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 
                                    bg-white/80 rounded-full flex items-center justify-center"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 
                                    bg-white/80 rounded-full flex items-center justify-center"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={cn(
                                    'w-2 h-2 rounded-full transition-colors',
                                    i === currentImageIndex ? 'bg-primary-500' : 'bg-white/60'
                                )}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ===== Product Info ===== */}
            <section className="py-6">
                <Container className="space-y-6">
                    {/* Name & Code */}
                    <div>
                        <p className="text-sm text-gray-500 mb-1">
                            {language === 'uz' ? 'Kod' : 'Код'}: {product.code}
                            {selectedVariant?.sku && ` / ${selectedVariant.sku}`}
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                    </div>

                    {/* Price Block */}
                    <div>
                        <PriceDisplay
                            price={currentPrice}
                            oldPrice={currentOldPrice}
                            size="lg"
                        />

                        {/* Price range for variants */}
                        {hasVariants && product.variants.length > 1 && (() => {
                            const min = Math.min(...product.variants.map(v => v.price))
                            const max = Math.max(...product.variants.map(v => v.price))
                            if (min === max) return null
                            return (
                                <p className="text-sm text-gray-500 mt-1">
                                    {language === 'uz' ? 'Narxlar' : 'Цены'}:{' '}
                                    {formatPrice(min)} — {formatPrice(max)} {currency}
                                </p>
                            )
                        })()}

                        {/* Active wholesale discount */}
                        {currentWholesaleDiscount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-2 flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2"
                            >
                                <Tag className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {language === 'uz'
                                        ? `Ulgurji: -${currentWholesaleDiscount}% = ${formatPrice(wholesalePrice)} ${currency}`
                                        : `Опт: -${currentWholesaleDiscount}% = ${formatPrice(wholesalePrice)} ${currency}`
                                    }
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* ===== SIZE SELECTOR ===== */}
                    {hasVariants && (
                        <SizeSelector
                            variants={product.variants}
                            selectedId={selectedVariant?.id}
                            onChange={setSelectedVariant}
                        />
                    )}

                    {/* ===== WHOLESALE TABLE ===== */}
                    {wholesaleTiers.length > 0 && (
                        <WholesaleCategoryPrices
                            tiers={wholesaleTiers}
                            basePrice={currentPrice}
                            currentQuantity={quantity}
                        />
                    )}

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">
                                {t('product.colors')}
                            </h3>
                            <ColorSelector
                                colors={product.colors}
                                selectedId={selectedColor?.id}
                                onChange={setSelectedColor}
                            />
                        </div>
                    )}

                    {/* Dimensions (only if no variants — variants show their own) */}
                    {!hasVariants && product.dimensions && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                {t('product.dimensions')}
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                {product.dimensions.size && (
                                    <p className="text-gray-700">{product.dimensions.size}</p>
                                )}
                                {product.dimensions.diameter_cm && (
                                    <p className="text-gray-700">
                                        {language === 'uz' ? 'Diametri' : 'Диаметр'}: {product.dimensions.diameter_cm} sm
                                    </p>
                                )}
                                {product.dimensions.height_cm && (
                                    <p className="text-gray-700">
                                        {language === 'uz' ? 'Balandligi' : 'Высота'}: {product.dimensions.height_cm} sm
                                    </p>
                                )}
                                {product.dimensions.volume_liters && (
                                    <p className="text-gray-700">
                                        {language === 'uz' ? 'Hajmi' : 'Объём'}: {product.dimensions.volume_liters} L
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                {t('product.description')}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">{description}</p>
                        </div>
                    )}

                    {/* Material */}
                    {product.material && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                {t('product.material')}
                            </h3>
                            <Badge variant="default">
                                {product.material === 'plastic' && (language === 'uz' ? 'Plastik' : 'Пластик')}
                                {product.material === 'metal' && (language === 'uz' ? 'Metall' : 'Металл')}
                                {product.material === 'woven' && (language === 'uz' ? "To'qilgan" : 'Плетёный')}
                            </Badge>
                        </div>
                    )}

                    {/* Recommendations */}
                    <ProductRecommendations productId={product.id} className="pt-4" />
                </Container>
            </section>

            {/* ===== Bottom Action Bar ===== */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
                <div className="p-4">
                    <Container>
                        <div className="flex items-center gap-3">
                            {/* Quantity */}
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                min={1}
                                max={selectedVariant?.stockQuantity || product.stockQuantity || 99}
                            />

                            {/* Add to Cart */}
                            <div className="flex-1">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart && !productInCart}
                                    fullWidth
                                    size="lg"
                                    variant={productInCart ? 'secondary' : 'primary'}
                                    className={cn(
                                        productInCart && 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                                    )}
                                >
                                    {productInCart ? (
                                        <span className="flex items-center gap-2">
                                            ✓ {language === 'uz' ? 'Savatda' : 'В корзине'}
                                        </span>
                                    ) : (
                                        <span>
                                            {formatPrice(finalTotalPrice)} {currency}
                                            {currentWholesaleDiscount > 0 && (
                                                <span className="text-xs opacity-75 ml-1">
                                                    (-{currentWholesaleDiscount}%)
                                                </span>
                                            )}
                                            <span className="mx-1">·</span>
                                            {language === 'uz' ? 'Savatga' : 'В корзину'}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    )
}

// ===== Wholesale Category Prices Table =====
function WholesaleCategoryPrices({
    tiers,
    basePrice,
    currentQuantity,
}: {
    tiers: WholesalePriceTier[]
    basePrice: number
    currentQuantity: number
}) {
    const { language } = useLanguageStore()
    const currency = language === 'uz' ? "so'm" : 'сум'

    if (!tiers || tiers.length === 0) return null

    const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)

    // Находим текущий активный тир
    const activeTierId = (() => {
        const descTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
        for (const t of descTiers) {
            if (currentQuantity >= t.minQuantity) return t.id
        }
        return null
    })()

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {language === 'uz' ? 'Ulgurji narxlar' : 'Оптовые цены'}
            </h3>

            <div className="space-y-2">
                {sortedTiers.map((tier) => {
                    const discountedPrice = Math.round(basePrice * (1 - tier.discountPercent / 100))
                    const isCurrentTier = activeTierId === tier.id

                    return (
                        <div
                            key={tier.id}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                                isCurrentTier
                                    ? 'bg-green-100 border border-green-300 shadow-sm'
                                    : 'bg-white/50'
                            )}
                        >
                            <span className={cn(
                                'text-sm',
                                isCurrentTier ? 'font-semibold text-green-800' : 'text-gray-700'
                            )}>
                                {language === 'uz' ? '' : 'от'} {tier.minQuantity}{' '}
                                {language === 'uz' ? 'donadan' : 'шт'}
                                {isCurrentTier && ' ✓'}
                            </span>
                            <div className="text-right flex items-center gap-2">
                                <span className={cn(
                                    'text-sm font-bold',
                                    isCurrentTier ? 'text-green-700' : 'text-amber-800'
                                )}>
                                    {formatPrice(discountedPrice)} {currency}
                                </span>
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded-full',
                                    isCurrentTier
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-amber-100 text-amber-700'
                                )}>
                                    -{tier.discountPercent}%
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Hint */}
            {!activeTierId && sortedTiers.length > 0 && (
                <p className="text-xs text-amber-700 mt-3 text-center">
                    {language === 'uz'
                        ? `${sortedTiers[0].minQuantity} donadan boshlab chegirma`
                        : `Скидка от ${sortedTiers[0].minQuantity} шт`
                    }
                </p>
            )}
        </div>
    )
}

// ===== Skeleton =====
function ProductPageSkeleton() {
    return (
        <div>
            <Skeleton className="aspect-square w-full" />
            <Container className="py-6 space-y-4">
                <Skeleton height={16} className="w-24" />
                <Skeleton height={32} className="w-3/4" />
                <Skeleton height={28} className="w-32" />
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={70} width={90} className="rounded-xl" />
                    ))}
                </div>
                <Skeleton height={100} className="w-full rounded-xl" />
            </Container>
        </div>
    )
}