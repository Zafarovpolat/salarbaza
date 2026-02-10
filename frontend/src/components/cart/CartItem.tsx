import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2, Ruler } from 'lucide-react'
import { CartItem as CartItemType } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/utils/formatPrice'
import { getProductName, getColorName } from '@/utils/helpers'
import { QuantitySelector } from '../ui/QuantitySelector'

interface CartItemProps {
  item: CartItemType
  index?: number
}

export const CartItem = memo(function CartItem({ item, index = 0 }: CartItemProps) {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const { updateQuantity, removeItem } = useCartStore()

  const { product, color, variant, quantity } = item
  const name = getProductName(product, language)
  const colorName = color ? getColorName(color, language) : null
  const mainImage = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url

  const priceModifier = color?.priceModifier || 0
  const basePrice = variant?.price || product.price
  const unitPrice = basePrice + priceModifier
  const totalPrice = unitPrice * quantity

  const sizeName = variant
    ? (language === 'uz' ? variant.labelUz : variant.labelRu)
    : null

  const currency = language === 'uz' ? "so'm" : 'сум'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-ivory rounded-2xl p-3.5 border border-stone/30"
    >
      <div className="flex gap-3">
        {/* Image */}
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="w-20 h-20 bg-sand rounded-xl overflow-hidden flex-shrink-0"
        >
          {mainImage ? (
            <img src={mainImage} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">🪴</span>
            </div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Delete */}
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => navigate(`/product/${product.slug}`)}
              className="text-left"
            >
              <h3 className="font-display text-sm font-medium text-charcoal line-clamp-2">
                {name}
              </h3>
            </button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => removeItem(item.id)}
              className="
                p-1.5 -mr-1.5
                text-light-gray hover:text-error
                hover:bg-error/10 rounded-xl
                transition-all duration-300
              "
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* Size & Color */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {variant && (
              <div className="flex items-center gap-1 bg-forest/8 rounded-lg px-2 py-0.5">
                <Ruler className="w-3 h-3 text-forest" />
                <span className="text-xs text-forest font-semibold">{variant.size}</span>
                {sizeName && (
                  <span className="text-xs text-sage">({sizeName})</span>
                )}
              </div>
            )}

            {colorName && (
              <div className="flex items-center gap-1">
                {color?.hexCode && (
                  <div
                    className="w-3 h-3 rounded-full border border-stone"
                    style={{ backgroundColor: color.hexCode }}
                  />
                )}
                <span className="text-xs text-medium-gray">{colorName}</span>
              </div>
            )}
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between mt-2.5">
            <div>
              <div className="font-bold text-charcoal">
                {formatPrice(totalPrice)}
                <span className="text-xs font-normal text-medium-gray ml-1">{currency}</span>
              </div>
              {quantity > 1 && (
                <div className="text-[11px] text-taupe">
                  {formatPrice(unitPrice)} × {quantity}
                </div>
              )}
            </div>

            <QuantitySelector
              value={quantity}
              onChange={(value) => updateQuantity(item.id, value)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
})