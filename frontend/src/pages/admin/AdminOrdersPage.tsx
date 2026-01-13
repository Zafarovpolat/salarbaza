import { useEffect, useState } from 'react'
import { Eye, ChevronDown } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Order {
    id: string
    orderNumber: string
    status: string
    customerName: string
    customerPhone: string
    total: number
    deliveryType: string
    paymentMethod: string
    createdAt: string
    items: Array<{
        productName: string
        quantity: number
        price: number
    }>
}

const statusLabels: Record<string, string> = {
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждён',
    PROCESSING: 'Готовится',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
    RETURNED: 'Возврат'
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    RETURNED: 'bg-gray-100 text-gray-700'
}

const allStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [statusDropdown, setStatusDropdown] = useState<string | null>(null)

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        try {
            const data = await adminService.getOrders()
            setOrders(data)
        } catch (error) {
            toast.error('Ошибка загрузки заказов')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await adminService.updateOrderStatus(orderId, newStatus)
            toast.success('Статус обновлён')
            loadOrders()
            setStatusDropdown(null)
        } catch (error) {
            toast.error('Ошибка обновления статуса')
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' сум'
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Заказы</h1>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold">
                                Заказ #{selectedOrder.orderNumber}
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Клиент</p>
                                    <p className="font-medium">{selectedOrder.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Телефон</p>
                                    <p className="font-medium">{selectedOrder.customerPhone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Доставка</p>
                                    <p className="font-medium">
                                        {selectedOrder.deliveryType === 'DELIVERY' ? 'Доставка' : 'Самовывоз'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Оплата</p>
                                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-2">Товары</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-sm text-gray-500">× {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t">
                                <span className="font-semibold">Итого:</span>
                                <span className="font-bold text-lg">{formatPrice(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">№ Заказа</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Дата</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Клиент</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Сумма</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Статус</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Загрузка...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Заказов нет
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        #{order.orderNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {formatPrice(order.total)}
                                    </td>
                                    <td className="px-6 py-4 relative">
                                        <button
                                            onClick={() => setStatusDropdown(statusDropdown === order.id ? null : order.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[order.status]}`}
                                        >
                                            {statusLabels[order.status]}
                                            <ChevronDown className="w-3 h-3" />
                                        </button>

                                        {statusDropdown === order.id && (
                                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-10 min-w-[150px]">
                                                {allStatuses.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(order.id, status)}
                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${status === order.status ? 'bg-gray-100 font-medium' : ''
                                                            }`}
                                                    >
                                                        {statusLabels[status]}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}