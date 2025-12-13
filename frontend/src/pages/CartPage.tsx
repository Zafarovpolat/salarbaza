import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { useTelegram } from '@/hooks/useTelegram'
import { Container } from '@/components/layout/Container'
import { CartList } from '@/components/cart/CartList'
import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/Button'

export function CartPage() {
    const navigate = useNavigate()
    const { language } = useLanguageStore()
    const { items, clearCart } = useCartStore()
    const { showConfirm, haptic } = useTelegram()

    const handleClearCart = async () => {
        const confirmed = await showConfirm(
            language === 'uz'
                ? 'Savatni tozalashni xohlaysizmi?'
                : 'Очистить корзину?'
        )

        if (confirmed) {
            haptic.notification('success')
            clearCart()
        }
    }

    const hasItems = items.length > 0

    return (
        // pb-56 = CartSummary (~140px) + BottomNav (64px) + небольшой запас
        <div className={hasItems ? 'pb-56' : 'pb-20'}>
            {/* Header Actions */}
            {hasItems && (
                <div className="py-3 border-b border-gray-100 bg-white sticky top-14 z-10">
                    <Container>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">
                                {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                                {language === 'uz' ? 'ta mahsulot' : 'товаров'}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearCart}
                                leftIcon={<Trash2 className="w-4 h-4" />}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                {language === 'uz' ? 'Tozalash' : 'Очистить'}
                            </Button>
                        </div>
                    </Container>
                </div>
            )}

            {/* Cart Items */}
            <section className="py-4">
                <Container>
                    <CartList />
                </Container>
            </section>

            {/* Summary */}
            <CartSummary />
        </div>
    )
}