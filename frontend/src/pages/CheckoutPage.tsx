import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLanguageStore } from '@/store/languageStore'
import { useCartStore } from '@/store/cartStore'
import { useTelegram } from '@/hooks/useTelegram'
import { orderService } from '@/services/orderService'
import { formatPrice } from '@/utils/formatPrice'
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
            const price = item.product.price + priceModifier
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

            const order = await orderService.createOrder({
                deliveryType: 'DELIVERY',
                customerFirstName: formData.firstName,
                customerLastName: formData.lastName || undefined,
                customerPhone: formData.phone,
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
                customerNote: formData.comment || undefined,
                paymentMethod: 'CASH',
            })

            haptic.notification('success')
            clearCart()

            navigate(`/order-success/${order.id}`, { replace: true })
        } catch (error) {
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

    // Redirect if cart is empty
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
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                        {items.slice(0, 4).map((item) => (
                            <div
                                key={item.id}
                                className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100"
                            >
                                {item.product.images?.[0]?.url ? (
                                    <img
                                        src={item.product.images[0].url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                        🪴
                                    </div>
                                )}
                            </div>
                        ))}
                        {items.length > 4 && (
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-500 font-medium">
                                    +{items.length - 4}
                                </span>
                            </div>
                        )}
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
                    {/* Price Summary */}
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

                    {/* Submit Button */}
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