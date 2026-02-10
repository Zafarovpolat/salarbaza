import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Heart, Check, Ruler } from 'lucide-react'
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
  index = 0,
}: ProductCardProps) {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const { addItem, isInCart } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { haptic } = useTelegram()

  const hasVariants = product.variants && product.variants.length > 0
  const inCart = isInCart(product.id)
  const isProductFavorite = isFavorite(product.id)
  const name = getProductName(product, language)
  const mainImage = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url

  // Ценовой диапазон
  const priceInfo = (() => {
    if (hasVariants) {
      const prices = product.variants.map(v => v.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      return { minPrice, maxPrice, isRange: minPrice !== maxPrice }
    }
    return { minPrice: product.price, maxPrice: product.price, isRange: false }
  })()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasVariants) {
      navigate(`/product/${product.slug}`)
      return
    }
    if (!inCart) {
      addItem(product, 1)
      haptic.impact('light')
      toast.success(
        language === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину',
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
        language === 'uz' ? "Sevimlilarga qo'shildi" : 'Добавлено в избранное',
        { duration: 1500 }
      )
    }
  }

  const currency = language === 'uz' ? "so'm" : 'сум'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/product/${product.slug}`)}
      className="
        bg-ivory rounded-2xl overflow-hidden
        transition-all duration-400 ease-smooth
        cursor-pointer group
        hover:shadow-card hover:-translate-y-1
      "
    >
      {/* Image */}
      <div className="relative aspect-square bg-sand m-2.5 rounded-xl overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sand">
            <span className="text-4xl">🪴</span>
          </div>
        )}

        {/* Badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge variant="new" size="sm">NEW</Badge>
          )}
          {product.oldPrice && !hasVariants && (
            <Badge variant="sale" size="sm">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </Badge>
          )}
          {hasVariants && (
            <Badge variant="forest" size="sm">
              <Ruler className="w-3 h-3 mr-0.5 inline" />
              {product.variants.length}
            </Badge>
          )}
        </div>

        {/* Heart — top right (показывается при hover на десктопе, всегда на мобиле) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleFavorite}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full',
            'flex items-center justify-center',
            'transition-all duration-300',
            'md:opacity-0 md:group-hover:opacity-100',
            isProductFavorite
              ? 'bg-terracotta/10 text-terracotta'
              : 'bg-white/85 text-dark-gray hover:scale-110'
          )}
        >
          <Heart
            className="w-4 h-4"
            strokeWidth={2}
            fill={isProductFavorite ? 'currentColor' : 'none'}
          />
        </motion.button>

        {/* Out of Stock */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-cream/70 flex items-center justify-center">
            <span className="text-medium-gray font-medium text-sm">
              {language === 'uz' ? "Sotuvda yo'q" : 'Нет в наличии'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3.5 pb-4 pt-1 text-center">
        {/* Name */}
        <h3 className="
          font-display text-[15px] font-medium
          text-charcoal leading-[1.3]
          line-clamp-2 mb-2
          min-h-[40px]
        ">
          {name}
        </h3>

        {/* Colors */}
        {product.colors && product.colors.length > 1 && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {product.colors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-stone"
                style={{ backgroundColor: color.hexCode || '#ccc' }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[11px] text-taupe font-medium">
                +{product.colors.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price + Cart button */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            {priceInfo.isRange ? (
              <>
                <div className="font-bold text-forest text-sm">
                  {language === 'uz' ? 'dan' : 'от'}{' '}
                  {formatPrice(priceInfo.minPrice)}
                </div>
                <div className="text-[11px] text-medium-gray">
                  {language === 'uz' ? 'gacha' : 'до'}{' '}
                  {formatPrice(priceInfo.maxPrice)} {currency}
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-forest text-base">
                  {formatPrice(priceInfo.minPrice)}
                  <span className="text-xs font-normal text-medium-gray ml-1">
                    {currency}
                  </span>
                </div>
                {product.oldPrice && (
                  <div className="text-xs text-light-gray line-through">
                    {formatPrice(product.oldPrice)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cart button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              hasVariants
                ? 'bg-forest/10 text-forest hover:bg-forest/20'
                : inCart
                  ? 'bg-forest text-white'
                  : 'bg-sand text-dark-gray hover:bg-forest hover:text-white',
              !product.inStock && 'opacity-50 cursor-not-allowed'
            )}
          >
            {hasVariants ? (
              <Ruler className="w-5 h-5" />
            ) : inCart ? (
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