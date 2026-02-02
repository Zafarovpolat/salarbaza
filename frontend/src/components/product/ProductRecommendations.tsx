import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Heart, ShoppingBag, ChevronRight } from 'lucide-react'
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
    isNew?: boolean
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
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton height={24} width={24} className="rounded-lg" />
                    <Skeleton height={24} width={180} />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={240} width={160} className="flex-shrink-0 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (products.length === 0) return null

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {language === 'uz' ? 'Sizga yoqishi mumkin' : 'Вам может понравиться'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {language === 'uz' ? 'O\'xshash mahsulotlar' : 'Похожие товары'}
                        </p>
                    </div>
                </div>
                <Link
                    to="/catalog"
                    className="flex items-center gap-1 text-sm text-purple-600 font-medium hover:text-purple-700"
                >
                    {language === 'uz' ? 'Hammasi' : 'Все'}
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Products Carousel */}
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="snap-start"
                        >
                            <Link
                                to={`/product/${product.slug}`}
                                className="flex-shrink-0 w-40 block group"
                            >
                                {/* Card */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                                    {/* Image Container */}
                                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">
                                                🌿
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {product.isNew && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                                                    NEW
                                                </span>
                                            )}
                                            {discount > 0 && (
                                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                                    -{discount}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleToggleFavorite(e, product)}
                                                className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors',
                                                    isProductFavorite
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-white/90 text-gray-400 hover:text-red-500'
                                                )}
                                            >
                                                <Heart
                                                    className="w-4 h-4"
                                                    fill={isProductFavorite ? 'currentColor' : 'none'}
                                                />
                                            </motion.button>
                                        </div>

                                        {/* Add to Cart - Bottom */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className="absolute bottom-2 left-2 right-2 py-2 bg-white/95 backdrop-blur-sm rounded-xl text-xs font-semibold text-gray-900 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:bg-green-500 hover:text-white"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            {language === 'uz' ? 'Savatga' : 'В корзину'}
                                        </motion.button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-purple-600 transition-colors">
                                            {name}
                                        </h4>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-base font-bold text-gray-900">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.oldPrice && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    {formatPrice(product.oldPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {language === 'uz' ? 'soʻm' : 'сўм'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )
                })}

                {/* See All Card */}
                <Link
                    to="/catalog"
                    className="flex-shrink-0 w-40 snap-start"
                >
                    <div className="h-full min-h-[280px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:from-purple-100 hover:to-pink-100 transition-all group">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                            <ChevronRight className="w-6 h-6 text-purple-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-purple-600">
                                {language === 'uz' ? 'Barcha tovarlar' : 'Все товары'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {language === 'uz' ? 'Katalogga o\'tish' : 'Перейти в каталог'}
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}