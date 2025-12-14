import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
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

    const { product, color, quantity } = item
    const name = getProductName(product, language)
    const colorName = color ? getColorName(color, language) : null
    const mainImage = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url

    const priceModifier = color?.priceModifier || 0
    const unitPrice = product.price + priceModifier
    const totalPrice = unitPrice * quantity

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-3 border border-gray-100"
        >
            <div className="flex gap-3">
                {/* Image */}
                <button
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0"
                >
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
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
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                                {name}
                            </h3>
                        </button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 -mr-1.5 text-gray-400 hover:text-red-500 
                       hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </div>

                    {/* Color */}
                    {colorName && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {color?.hexCode && (
                                <div
                                    className="w-3 h-3 rounded-full border border-gray-200"
                                    style={{ backgroundColor: color.hexCode }}
                                />
                            )}
                            <span className="text-xs text-gray-500">{colorName}</span>
                        </div>
                    )}

                    {/* Price & Quantity */}
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <div className="font-bold text-gray-900">
                                {formatPrice(totalPrice)}
                                <span className="text-xs font-normal text-gray-500 ml-1">
                                    {language === 'uz' ? "so'm" : 'сум'}
                                </span>
                            </div>
                            {quantity > 1 && (
                                <div className="text-xs text-gray-400">
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