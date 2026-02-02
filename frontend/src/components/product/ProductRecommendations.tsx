import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Sparkles } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useCartStore } from '@/store/cartStore'
import { getProductName, cn } from '@/utils/helpers'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

interface Product {
    id: string
    slug: string
    nameRu: string
    nameUz: string
    price: number
    oldPrice?: number
    images: { url: string }[]
}

interface ProductRecommendationsProps {
    productId: string
    className?: string
}

const API_URL = import.meta.env.VITE_API_URL

export function ProductRecommendations({ productId, className }: ProductRecommendationsProps) {
    const { language } = useLanguageStore()
    const { isFavorite, toggleFavorite } = useFavoritesStore()
    const { addItem } = useCartStore()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRecommendations()
    }, [productId])

    const loadRecommendations = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/products/${productId}/recommendations?limit=8`)
            const data = await res.json()
            if (data.success) {
                setProducts(data.data)
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU').format(price)
    }

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault()
        e.stopPropagation()
        addItem({
            id: product.id,
            slug: product.slug,
            nameRu: product.nameRu,
            nameUz: product.nameUz,
            price: product.price,
            image: product.images?.[0]?.url
        } as any, 1)
        toast.success(
            language === 'uz' ? 'Savatga qo\'shildi' : 'Добавлено в корзину',
            { duration: 1500, icon: '🛒' }
        )
    }

    const handleToggleFavorite = (e: React.MouseEvent, product: Product) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(product as any)
    }

    if (loading) {
        return (
            <div className={cn('', className)}>
                <Skeleton height={24} width={180} className="mb-4" />
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={220} width={150} className="flex-shrink-0 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (products.length === 0) return null

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                    {language === 'uz' ? 'Sizga yoqishi mumkin' : 'Вам может понравиться'}
                </h3>
            </div>

            {/* Products Carousel */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {products.map((product, index) => {
                    const name = getProductName(product, language)
                    const image = product.images?.[0]?.url
                    const isProductFavorite = isFavorite(product.id)
                    const discount = product.oldPrice
                        ? Math.round((1 - product.price / product.oldPrice) * 100)
                        : 0

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <Link
                                to={`/product/${product.slug}`}
                                className="flex-shrink-0 w-36 block group"
                            >
                                {/* Card */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                    {/* Image Container */}
                                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">
                                                🌿
                                            </div>
                                        )}

                                        {/* Discount Badge */}
                                        {discount > 0 && (
                                            <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                                                -{discount}%
                                            </span>
                                        )}

                                        {/* Favorite Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleToggleFavorite(e, product)}
                                            className={cn(
                                                'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                                                isProductFavorite
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white/80 text-gray-400 hover:text-green-500'
                                            )}
                                        >
                                            <Heart
                                                className="w-3.5 h-3.5"
                                                fill={isProductFavorite ? 'currentColor' : 'none'}
                                            />
                                        </motion.button>

                                        {/* Add to Cart Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className="absolute bottom-2 left-2 right-2 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-500 hover:text-white"
                                        >
                                            <ShoppingBag className="w-3 h-3" />
                                            {language === 'uz' ? 'Savatga' : 'В корзину'}
                                        </motion.button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-2.5">
                                        <h4 className="text-sm text-gray-900 line-clamp-2 leading-tight min-h-[2.25rem]">
                                            {name}
                                        </h4>
                                        <div className="mt-1.5 flex items-baseline gap-1.5">
                                            <span className="text-sm font-bold text-green-600">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.oldPrice && (
                                                <span className="text-[10px] text-gray-400 line-through">
                                                    {formatPrice(product.oldPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400">
                                            {language === 'uz' ? 'soʻm' : 'сўм'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}