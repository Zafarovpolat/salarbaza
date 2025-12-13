import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useLanguageStore } from '@/store/languageStore'
import { formatPrice } from '@/utils/formatPrice'
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/utils/constants'
import { Button } from '../ui/Button'
import { Container } from '../layout/Container'

export function CartSummary() {
    const navigate = useNavigate()
    const { language, t } = useLanguageStore()
    const items = useCartStore((state) => state.items)

    const { subtotal, itemCount, freeDeliveryProgress } = useMemo(() => {
        const subtotal = items.reduce((sum, item) => {
            const priceModifier = item.color?.priceModifier || 0
            const price = item.product.price + priceModifier
            return sum + price * item.quantity
        }, 0)

        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

        const freeDeliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)

        return { subtotal, itemCount, freeDeliveryProgress }
    }, [items])

    const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD
    const remainingForFree = FREE_DELIVERY_THRESHOLD - subtotal
    const currency = language === 'uz' ? "so'm" : 'сум'

    if (items.length === 0) return null

    return (
        // Фиксированная панель над меню (bottom-16 = 64px)
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
            <Container>
                <div className="py-4 space-y-3">
                    {/* Free Delivery Progress */}
                    {!isFreeDelivery && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center gap-2 text-sm">
                                <span className="text-gray-500 truncate flex-1 min-w-0">
                                    {language === 'uz'
                                        ? `Bepul yetkazib berishgacha`
                                        : `До бесплатной доставки`}
                                    <span className="font-medium text-gray-700 ml-1">
                                        {formatPrice(remainingForFree)} {currency}
                                    </span>
                                </span>
                                <span className="text-primary-600 font-medium flex-shrink-0">
                                    {Math.round(freeDeliveryProgress)}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${freeDeliveryProgress}%` }}
                                    className="h-full bg-primary-500 rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Summary Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-shrink-0">
                            <div className="text-sm text-gray-500">
                                {itemCount} {language === 'uz' ? 'ta' : 'шт'}
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {formatPrice(subtotal)}
                                <span className="text-sm font-normal text-gray-500 ml-1">{currency}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate('/checkout')}
                            size="lg"
                            className="flex-shrink-0"
                        >
                            <span className="whitespace-nowrap">
                                {language === 'uz' ? 'Buyurtma' : 'Заказать'}
                            </span>
                            <ChevronRight className="w-5 h-5 ml-1 flex-shrink-0" />
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    )
}