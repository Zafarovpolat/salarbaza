import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight } from 'lucide-react'
import { Order } from '@/types'
import { useLanguageStore } from '@/store/languageStore'
import { orderService } from '@/services/orderService'
import { formatPrice } from '@/utils/formatPrice'
import { Container } from '@/components/layout/Container'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { OrderStatusBadge } from '@/components/order/OrderStatus'

export function OrdersPage() {
    const navigate = useNavigate()
    const { language, t } = useLanguageStore()

    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchOrders() {
            try {
                const data = await orderService.getOrders()
                setOrders(data)
            } catch (error) {
                console.error('Failed to fetch orders:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrders()
    }, [])

    const currency = language === 'uz' ? "so'm" : 'сум'

    if (isLoading) {
        return (
            <Container className="py-6 space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} height={120} className="rounded-2xl" />
                ))}
            </Container>
        )
    }

    if (orders.length === 0) {
        return (
            <EmptyState
                icon={Package}
                title={t('orders.empty')}
                description={language === 'uz'
                    ? "Hali buyurtma bermagansiz"
                    : 'Вы еще не сделали ни одного заказа'}
                action={{
                    label: language === 'uz' ? 'Xarid qilish' : 'За покупками',
                    onClick: () => navigate('/catalog'),
                }}
            />
        )
    }

    return (
        <div className="pb-6">
            <Container className="py-4 space-y-4">
                {orders.map((order, index) => (
                    <motion.button
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-left
                     hover:shadow-md transition-shadow"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className="text-sm text-gray-500">
                                    #{order.orderNumber}
                                </span>
                                <p className="text-xs text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString(
                                        language === 'uz' ? 'uz-UZ' : 'ru-RU',
                                        { day: 'numeric', month: 'short', year: 'numeric' }
                                    )}
                                </p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                        </div>

                        {/* Items Preview */}
                        <div className="flex items-center gap-2 mb-3">
                            {order.items.slice(0, 3).map((item, i) => (
                                <div
                                    key={i}
                                    className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden"
                                >
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">
                                            🪴
                                        </div>
                                    )}
                                </div>
                            ))}
                            {order.items.length > 3 && (
                                <span className="text-sm text-gray-400">
                                    +{order.items.length - 3}
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <div className="font-bold text-gray-900">
                                {formatPrice(order.total)} {currency}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </motion.button>
                ))}
            </Container>
        </div>
    )
}