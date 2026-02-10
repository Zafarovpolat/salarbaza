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
      language === 'uz' ? 'Savatni tozalashni xohlaysizmi?' : 'Очистить корзину?'
    )
    if (confirmed) {
      haptic.notification('success')
      clearCart()
    }
  }

  const hasItems = items.length > 0

  return (
    <div className={hasItems ? 'pb-56' : 'pb-20'}>
      {/* Header Actions */}
      {hasItems && (
        <div className="py-3 border-b border-stone/30 bg-cream/95 backdrop-blur-[20px] sticky top-16 z-10">
          <Container>
            <div className="flex items-center justify-between">
              <span className="text-medium-gray text-sm">
                {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                {language === 'uz' ? 'ta mahsulot' : 'товаров'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="text-error hover:text-error hover:bg-error/10"
              >
                {language === 'uz' ? 'Tozalash' : 'Очистить'}
              </Button>
            </div>
          </Container>
        </div>
      )}

      {/* Items */}
      <section className="py-4">
        <Container>
          <CartList />
        </Container>
      </section>

      <CartSummary />
    </div>
  )
}