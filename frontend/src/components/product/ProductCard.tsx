// frontend/src/components/product/ProductCard.tsx
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Heart, Check } from 'lucide-react'
import { Product } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useTelegram } from '@/hooks/useTelegram'
import { formatPrice } from '@/utils/formatPrice'
import { getProductName, cn } from '@/utils/helpers'
import { Badge } from '../ui/Badge'
import toast from 'react-hot-toast'

interface ProductCardProps {
    product: Product
    index?: number
}

export const ProductCard = memo(function ProductCard({
    product,
    index = 0
}: ProductCardProps) {
    const navigate = useNavigate()
    const { language } = useLanguageStore()
    const { addItem, isInCart } = useCartStore()
    const { toggleFavorite, isFavorite } = useFavoritesStore()
    const { haptic } = useTelegram()

    const inCart = isInCart(product.id)
    const isProductFavorite = isFavorite(product.id)
    const name = getProductName(product, language)
    const mainImage = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!inCart) {
            addItem(product, 1)
            haptic.impact('light')
            toast.success(
                language === 'uz' ? 'Savatga qo\'shildi' : 'Добавлено в корзину',
                { duration: 1500 }
            )
        } else {
            navigate('/cart')
        }
    }

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation()
        haptic.impact('light')
        toggleFavorite(product)

        if (!isProductFavorite) {
            toast.success(
                language === 'uz' ? 'Sevimlilarga qo\'shildi' : 'Добавлено в избранное',
                { duration: 1500 }
            )
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/product/${product.slug}`)}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 
                 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
                {mainImage ? (
                    <img
                        src={mainImage}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🪴</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                        <Badge variant="primary" size="sm">NEW</Badge>
                    )}
                    {product.oldPrice && (
                        <Badge variant="danger" size="sm">
                            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                        </Badge>
                    )}
                </div>

                {/* Favorite Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleFavorite}
                    className={cn(
                        'absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors',
                        isProductFavorite
                            ? 'bg-red-50 text-red-500'
                            : 'bg-white/80 text-gray-400 hover:bg-white'
                    )}
                >
                    <Heart
                        className="w-4 h-4"
                        fill={isProductFavorite ? 'currentColor' : 'none'}
                    />
                </motion.button>

                {/* Out of Stock Overlay */}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                            {language === 'uz' ? "Sotuvda yo'q" : 'Нет в наличии'}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Name */}
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 min-h-[40px]">
                    {name}
                </h3>

                {/* Colors indicator */}
                {product.colors && product.colors.length > 1 && (
                    <div className="flex items-center gap-1 mb-2">
                        {product.colors.slice(0, 4).map((color, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color.hexCode || '#ccc' }}
                            />
                        ))}
                        {product.colors.length > 4 && (
                            <span className="text-xs text-gray-400">
                                +{product.colors.length - 4}
                            </span>
                        )}
                    </div>
                )}

                {/* Price & Add to Cart */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-gray-900">
                            {formatPrice(product.price)}
                            <span className="text-xs font-normal text-gray-500 ml-1">
                                {language === 'uz' ? "so'm" : 'сум'}
                            </span>
                        </div>
                        {product.oldPrice && (
                            <div className="text-xs text-gray-400 line-through">
                                {formatPrice(product.oldPrice)}
                            </div>
                        )}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                            inCart
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                            !product.inStock && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {inCart ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <ShoppingBag className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
})