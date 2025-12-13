// frontend/src/pages/ProductPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useProduct } from '@/hooks/useProducts'
import { useTelegram } from '@/hooks/useTelegram'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { ProductColor } from '@/types'
import { getProductName, getProductDescription, cn } from '@/utils/helpers'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ColorSelector } from '@/components/product/ColorSelector'
import { PriceDisplay } from '@/components/product/PriceDisplay'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { CartButton } from '@/components/cart/CartButton'
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
    const [quantity, setQuantity] = useState(1)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Set default color when product loads
    useEffect(() => {
        if (product?.colors && product.colors.length > 0) {
            setSelectedColor(product.colors[0])
        }
    }, [product])

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

    const handleFavorite = () => {
        haptic.impact('light')
        toggleFavorite(product)

        if (!isProductFavorite) {
            toast.success(
                language === 'uz' ? 'Sevimlilarga qo\'shildi' : 'Добавлено в избранное',
                { duration: 1500 }
            )
        } else {
            toast.success(
                language === 'uz' ? 'Sevimlilardan o\'chirildi' : 'Удалено из избранного',
                { duration: 1500 }
            )
        }
    }

    const handleShare = async () => {
        haptic.impact('light')

        const shareData = {
            title: name,
            text: `${name} - DekorHouse`,
            url: window.location.href,
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(window.location.href)
                toast.success(
                    language === 'uz' ? 'Havola nusxalandi' : 'Ссылка скопирована',
                    { duration: 1500 }
                )
            }
        } catch (err) {
            // User cancelled share
        }
    }

    const price = product.price + (selectedColor?.priceModifier || 0)

    return (
        <div className="pb-36">
            {/* Image Gallery */}
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
                        {product.oldPrice && (
                            <Badge variant="danger">
                                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                            </Badge>
                        )}
                    </div>

                    {/* Actions */}
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

                    {/* Image Navigation */}
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

                {/* Image Dots */}
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

            {/* Product Info */}
            <section className="py-6">
                <Container className="space-y-6">
                    {/* Name & Code */}
                    <div>
                        <p className="text-sm text-gray-500 mb-1">
                            {language === 'uz' ? 'Kod' : 'Код'}: {product.code}
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                    </div>

                    {/* Price */}
                    <PriceDisplay
                        price={price}
                        oldPrice={product.oldPrice}
                        size="lg"
                    />

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

                    {/* Dimensions */}
                    {product.dimensions && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                {t('product.dimensions')}
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4">
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
                </Container>
            </section>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
                <div className="p-4">
                    <Container>
                        <div className="flex items-center gap-3">
                            {/* Quantity */}
                            <QuantitySelector
                                value={quantity}
                                onChange={setQuantity}
                                min={1}
                                max={product.stockQuantity || 99}
                            />

                            {/* Add to Cart */}
                            <div className="flex-1">
                                <CartButton
                                    product={product}
                                    color={selectedColor}
                                    quantity={quantity}
                                    fullWidth
                                    size="lg"
                                />
                            </div>
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    )
}

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
                        <Skeleton key={i} height={40} width={80} className="rounded-xl" />
                    ))}
                </div>
                <Skeleton height={100} className="w-full rounded-xl" />
            </Container>
        </div>
    )
}