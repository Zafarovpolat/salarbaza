import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/store/languageStore'
import { getProductName, cn } from '@/utils/helpers'
import { Skeleton } from '@/components/ui/Skeleton'

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

    if (loading) {
        return (
            <div className={cn('space-y-4', className)}>
                <Skeleton height={24} width={200} />
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={200} width={150} className="flex-shrink-0 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (products.length === 0) return null

    return (
        <div className={className}>
            <h3 className="font-semibold text-gray-900 mb-3">
                {language === 'uz' ? 'O\'xshash mahsulotlar' : 'Похожие товары'}
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {products.map((product) => {
                    const name = getProductName(product, language)
                    const image = product.images?.[0]?.url

                    return (
                        <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            className="flex-shrink-0 w-36 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Image */}
                            <div className="aspect-square bg-gray-100">
                                {image ? (
                                    <img
                                        src={image}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        📦
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-2">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                                    {name}
                                </h4>
                                <div className="mt-1">
                                    <span className="text-sm font-bold text-green-600">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.oldPrice && (
                                        <span className="text-xs text-gray-400 line-through ml-1">
                                            {formatPrice(product.oldPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}