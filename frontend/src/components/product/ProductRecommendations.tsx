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
      if (data.success) setProducts(data.data)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmtPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price)

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      id: product.id, slug: product.slug,
      nameRu: product.nameRu, nameUz: product.nameUz,
      price: product.price, image: product.images?.[0]?.url,
    } as any, 1)
    toast.success(
      language === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину',
      { duration: 1500 }
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
      <div className="flex items-center gap-2.5 mb-4">
        <div className="
          w-9 h-9
          bg-gradient-to-br from-forest to-sage
          rounded-xl
          flex items-center justify-center
        ">
          <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-lg font-medium text-charcoal">
          {language === 'uz' ? 'Sizga yoqishi mumkin' : 'Вам может понравиться'}
        </h3>
      </div>

      {/* Carousel */}
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
                className="flex-shrink-0 w-[150px] block group"
              >
                <div className="bg-ivory rounded-2xl overflow-hidden hover:shadow-card transition-all duration-400">
                  {/* Image */}
                  <div className="aspect-square bg-sand m-1.5 rounded-xl relative overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                    )}

                    {/* Discount */}
                    {discount > 0 && (
                      <span className="
                        absolute top-2 left-2
                        px-2 py-0.5
                        bg-terracotta text-white
                        text-[10px] font-bold
                        rounded-full
                      ">
                        -{discount}%
                      </span>
                    )}

                    {/* Heart */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleToggleFavorite(e, product)}
                      className={cn(
                        'absolute top-2 right-2 w-7 h-7 rounded-full',
                        'flex items-center justify-center transition-all duration-300',
                        isProductFavorite
                          ? 'bg-terracotta/10 text-terracotta'
                          : 'bg-white/85 text-medium-gray hover:text-terracotta'
                      )}
                    >
                      <Heart
                        className="w-3.5 h-3.5"
                        strokeWidth={2}
                        fill={isProductFavorite ? 'currentColor' : 'none'}
                      />
                    </motion.button>

                    {/* Add to cart on hover */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleAddToCart(e, product)}
                      className="
                        absolute bottom-2 left-2 right-2
                        py-1.5
                        bg-white/90 backdrop-blur-sm
                        rounded-xl
                        text-xs font-semibold text-dark-gray
                        flex items-center justify-center gap-1
                        opacity-0 group-hover:opacity-100
                        transition-all duration-300
                        hover:bg-forest hover:text-white
                      "
                    >
                      <ShoppingBag className="w-3 h-3" strokeWidth={2} />
                      {language === 'uz' ? 'Savatga' : 'В корзину'}
                    </motion.button>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 text-center">
                    <h4 className="text-sm text-charcoal line-clamp-2 leading-tight min-h-[2.25rem] font-display font-medium">
                      {name}
                    </h4>
                    <div className="mt-1.5 flex items-baseline justify-center gap-1">
                      <span className="text-sm font-bold text-forest">
                        {fmtPrice(product.price)}
                      </span>
                      <span className="text-[11px] text-medium-gray">
                        {language === 'uz' ? "so'm" : 'сум'}
                      </span>
                      {product.oldPrice && (
                        <span className="text-[10px] text-light-gray line-through ml-1">
                          {fmtPrice(product.oldPrice)}
                        </span>
                      )}
                    </div>
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