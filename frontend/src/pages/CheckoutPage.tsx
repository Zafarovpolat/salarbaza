import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Ruler } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { useTelegram } from '@/hooks/useTelegram'
import { orderService } from '@/services/orderService'
import { formatPrice } from '@/utils/formatPrice'
import { getProductName } from '@/utils/helpers'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/utils/constants'
import { Container } from '@/components/layout/Container'
import { OrderForm } from '@/components/order/OrderForm'
import { Button } from '@/components/ui/Button'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const { items, clearCart } = useCartStore()
  const { haptic, user } = useTelegram()
  const [isLoading, setIsLoading] = useState(false)

  const { subtotal, deliveryFee, total } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const priceModifier = item.color?.priceModifier || 0
      const basePrice = item.variant?.price || item.product.price
      return sum + (basePrice + priceModifier) * item.quantity
    }, 0)
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
    return { subtotal, deliveryFee, total: subtotal + deliveryFee }
  }, [items])

  const handleSubmit = async (formData: any) => {
    try {
      setIsLoading(true)
      haptic.impact('medium')

      const orderItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        colorId: item.color?.id,
        variantId: item.variant?.id,
      }))

      const order = await orderService.createOrder({
        deliveryType: 'DELIVERY',
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName || undefined,
        customerPhone: formData.phone,
        address: formData.address || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        customerNote: formData.comment || undefined,
        paymentMethod: 'CASH',
        items: orderItems,
      })

      haptic.notification('success')
      clearCart()
      navigate(`/order-success/${order.id}`, { replace: true })
    } catch (error: any) {
      haptic.notification('error')
      toast.error(language === 'uz' ? "Xatolik yuz berdi" : 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart', { replace: true })
    return null
  }

  const currency = language === 'uz' ? "so'm" : 'сум'

  return (
    <div className="pb-32">
      {/* Order Summary */}
      <section className="py-4 bg-ivory border-b border-stone/30">
        <Container>
          <div className="space-y-2.5">
            {items.map((item) => {
              const name = getProductName(item.product, language)
              const basePrice = item.variant?.price || item.product.price
              const priceModifier = item.color?.priceModifier || 0
              const unitPrice = basePrice + priceModifier

              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sand rounded-xl overflow-hidden flex-shrink-0 border border-stone/30">
                    {item.product.images?.[0]?.url ? (
                      <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🪴</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal truncate font-medium">{name}</p>
                    <div className="flex items-center gap-2 text-xs text-medium-gray">
                      {item.variant && (
                        <span className="flex items-center gap-0.5">
                          <Ruler className="w-3 h-3" /> {item.variant.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="flex items-center gap-0.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-stone" style={{ backgroundColor: item.color.hexCode || '#ccc' }} />
                          {language === 'uz' ? item.color.nameUz : item.color.nameRu}
                        </span>
                      )}
                      <span>×{item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-charcoal">
                    {formatPrice(unitPrice * item.quantity)}
                  </div>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Form */}
      <section className="py-6 pb-20">
        <Container>
          <h2 className="font-display text-xl font-medium text-charcoal mb-5">
            {language === 'uz' ? "Yetkazib berish ma'lumotlari" : 'Данные для доставки'}
          </h2>
          <OrderForm
            initialData={{ firstName: user?.first_name || '', lastName: user?.last_name || '' }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </Container>
      </section>

      {/* Bottom fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-[20px] border-t border-stone/50 p-4 z-30">
        <Container>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-medium-gray">
                {language === 'uz' ? 'Mahsulotlar' : 'Товары'} ({items.length})
              </span>
              <span className="text-charcoal font-medium">{formatPrice(subtotal)} {currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-medium-gray">
                {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
              </span>
              <span className={deliveryFee === 0 ? 'text-sage font-semibold' : 'text-charcoal font-medium'}>
                {deliveryFee === 0
                  ? (language === 'uz' ? 'Bepul' : 'Бесплатно')
                  : `${formatPrice(deliveryFee)} ${currency}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-stone/30">
              <span className="text-charcoal">{language === 'uz' ? 'Jami' : 'Итого'}</span>
              <span className="text-forest">{formatPrice(total)} {currency}</span>
            </div>
          </div>

          <Button type="submit" form="order-form" variant="green" fullWidth size="lg" isLoading={isLoading}>
            {language === 'uz' ? 'Buyurtma berish' : 'Оформить заказ'}
          </Button>
        </Container>
      </div>
    </div>
  )
}