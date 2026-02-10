import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check, Ruler } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Product, ProductColor, ProductVariant } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useLanguageStore } from '@/store/languageStore'
import { useTelegram } from '@/hooks/useTelegram'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

interface CartButtonProps {
  product: Product
  color?: ProductColor
  variant?: ProductVariant
  quantity?: number
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function CartButton({
  product,
  color,
  variant,
  quantity = 1,
  size = 'md',
  fullWidth = false,
}: CartButtonProps) {
  const navigate = useNavigate()
  const { t, language } = useLanguageStore()
  const { addItem, isInCart } = useCartStore()
  const { haptic } = useTelegram()

  const hasVariants = product.variants && product.variants.length > 0
  const inCart = isInCart(product.id, color?.id, variant?.id)
  const needsSizeSelection = hasVariants && !variant

  const handleClick = () => {
    if (inCart) {
      navigate('/cart')
      return
    }

    if (needsSizeSelection) {
      toast.error(
        language === 'uz'
          ? "Iltimos, o'lchamni tanlang"
          : 'Пожалуйста, выберите размер',
        { duration: 2000 }
      )
      return
    }

    if (variant && !variant.inStock) {
      toast.error(
        language === 'uz'
          ? "Bu o'lcham sotuvda yo'q"
          : 'Этот размер не в наличии',
        { duration: 2000 }
      )
      return
    }

    haptic.impact('light')
    addItem(product, quantity, color, variant)
    toast.success(
      language === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину',
      { duration: 1500 }
    )
  }

  const getButtonText = () => {
    if (!product.inStock) return t('product.outOfStock')
    if (variant && !variant.inStock) return language === 'uz' ? "Sotuvda yo'q" : 'Нет в наличии'
    if (inCart) return t('product.inCart')
    if (needsSizeSelection) return language === 'uz' ? "O'lchamni tanlang" : 'Выберите размер'
    return t('product.addToCart')
  }

  const getIcon = () => {
    if (inCart) {
      return <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-5 h-5" /></motion.span>
    }
    if (needsSizeSelection) {
      return <motion.span key="ruler" initial={{ scale: 0 }} animate={{ scale: 1 }}><Ruler className="w-5 h-5" /></motion.span>
    }
    return <motion.span key="bag" initial={{ scale: 0 }} animate={{ scale: 1 }}><ShoppingBag className="w-5 h-5" /></motion.span>
  }

  const getVariant = (): 'green' | 'ghost' | 'outline' => {
    if (inCart) return 'ghost'
    if (needsSizeSelection) return 'outline'
    return 'green'
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!product.inStock || (variant !== undefined && !variant.inStock)}
      variant={getVariant()}
      size={size}
      fullWidth={fullWidth}
      leftIcon={
        <AnimatePresence mode="wait">
          {getIcon()}
        </AnimatePresence>
      }
    >
      {getButtonText()}
    </Button>
  )
}