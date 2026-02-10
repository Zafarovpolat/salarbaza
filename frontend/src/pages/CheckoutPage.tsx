// frontend/src/pages/CheckoutPage.tsx

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
            // ✅ Цена из варианта или базовая
            const basePrice = item.variant?.price || item.product.price
            const price = basePrice + priceModifier
            return sum + price * item.quantity
        }, 0)

        const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
        const total = subtotal + deliveryFee

        return { subtotal, deliveryFee, total }
    }, [items])

    const handleSubmit = async (formData: {
        firstName: string
        lastName: string
        phone: string
        address: string
        latitude?: number
        longitude?: number
        comment: string
    }) => {
        try {
            setIsLoading(true)
            haptic.impact('medium')

            // ✅ Включаем variantId в данные заказа
            const orderItems = items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                colorId: item.color?.id,
                variantId: item.variant?.id,  // ✅ НОВОЕ
            }))

            const orderData = {
                deliveryType: 'DELIVERY' as const,
                customerFirstName: formData.firstName,
                customerLastName: formData.lastName || undefined,
                customerPhone: formData.phone,
                address: formData.address || undefined,
                latitude: formData.latitude,
                longitude: formData.longitude,
                customerNote: formData.comment || undefined,
                paymentMethod: 'CASH' as const,
                items: orderItems,
            }

            console.log('📦 Sending order:', orderData)

            const order = await orderService.createOrder(orderData)

            haptic.notification('success')
            clearCart()

            navigate(`/order-success/${order.id}`, { replace: true })
        } catch (error: any) {
            console.error('❌ Order failed:', error)

            const errorMsg = error.message || 'Unknown error'
            alert(`Error: ${errorMsg}`)

            haptic.notification('error')
            toast.error(
                language === 'uz'
                    ? 'Xatolik yuz berdi. Qaytadan urinib ko\'ring'
                    : 'Произошла ошибка. Попробуйте снова'
            )
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
            {/* Order Items Summary */}
            <section className="py-4 bg-gray-50">
                <Container>
                    <div className="space-y-2 mb-2">
                        {items.map((item) => {
                            const name = getProductName(item.product, language)
                            const basePrice = item.variant?.price || item.product.price
                            const priceModifier = item.color?.priceModifier || 0
                            const unitPrice = basePrice + priceModifier

                            return (
                                <div key={item.id} className="flex items-center gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                        {item.product.images?.[0]?.url ? (
                                            <img
                                                src={item.product.images[0].url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">
                                                🪴
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 truncate">{name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {/* ✅ Размер */}
                                            {item.variant && (
                                                <span className="flex items-center gap-0.5">
                                                    <Ruler className="w-3 h-3" />
                                                    {item.variant.size}
                                                </span>
                                            )}
                                            {/* Цвет */}
                                            {item.color && (
                                                <span className="flex items-center gap-0.5">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full border"
                                                        style={{ backgroundColor: item.color.hexCode || '#ccc' }}
                                                    />
                                                    {language === 'uz' ? item.color.nameUz : item.color.nameRu}
                                                </span>
                                            )}
                                            <span>×{item.quantity}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatPrice(unitPrice * item.quantity)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Container>
            </section>

            {/* Order Form */}
            <section className="py-6 pb-20">
                <Container>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {language === 'uz' ? 'Yetkazib berish ma\'lumotlari' : 'Данные для доставки'}
                    </h2>
                    <OrderForm
                        initialData={{
                            firstName: user?.first_name || '',
                            lastName: user?.last_name || '',
                        }}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </Container>
            </section>

            {/* Bottom Summary & Submit */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-30">
                <Container>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                                {language === 'uz' ? 'Mahsulotlar' : 'Товары'} ({items.length})
                            </span>
                            <span className="text-gray-900">{formatPrice(subtotal)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                                {language === 'uz' ? 'Yetkazib berish' : 'Доставка'}
                            </span>
                            <span className={deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}>
                                {deliveryFee === 0
                                    ? (language === 'uz' ? 'Bepul' : 'Бесплатно')
                                    : `${formatPrice(deliveryFee)} ${currency}`}
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                            <span>{language === 'uz' ? 'Jami' : 'Итого'}</span>
                            <span className="text-primary-600">{formatPrice(total)} {currency}</span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        form="order-form"
                        fullWidth
                        size="lg"
                        isLoading={isLoading}
                    >
                        {language === 'uz' ? 'Buyurtma berish' : 'Оформить заказ'}
                    </Button>
                </Container>
            </div>
        </div>
    )
}