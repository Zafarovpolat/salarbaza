import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check } from 'lucide-react'
import { Product, ProductColor } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useLanguageStore } from '@/store/languageStore'
import { cn } from '@/utils/helpers'
import { Button } from '../ui/Button'

interface CartButtonProps {
    product: Product
    color?: ProductColor
    quantity?: number
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
}

export function CartButton({
    product,
    color,
    quantity = 1,
    size = 'md',
    fullWidth = false,
}: CartButtonProps) {
    const { t } = useLanguageStore()
    const { addItem, isInCart } = useCartStore()

    const inCart = isInCart(product.id, color?.id)

    const handleClick = () => {
        if (!inCart) {
            addItem(product, quantity, color)
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={!product.inStock}
            variant={inCart ? 'secondary' : 'primary'}
            size={size}
            fullWidth={fullWidth}
            leftIcon={
                <AnimatePresence mode="wait">
                    {inCart ? (
                        <motion.span
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Check className="w-5 h-5" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="bag"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </motion.span>
                    )}
                </AnimatePresence>
            }
        >
            {!product.inStock
                ? t('product.outOfStock')
                : inCart
                    ? t('product.inCart')
                    : t('product.addToCart')}
        </Button>
    )
}