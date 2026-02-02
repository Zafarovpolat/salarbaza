import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    ShoppingBag,
    Heart,
    ShoppingCart,
    Calendar,
    TrendingUp,
    Package,
    MessageCircle,
    ExternalLink,
    Copy,
    Check,
    Eye,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface CustomerData {
    customer: {
        id: string
        telegramId: string
        firstName: string | null
        lastName: string | null
        username: string | null
        phone: string | null
        language: string
        createdAt: string
    }
    addresses: Array<{
        id: string
        title: string
        city: string
        street: string
        house: string
        isDefault: boolean
    }>
    orders: Array<{
        id: string
        orderNumber: string
        status: string
        total: number
        createdAt: string
        items: Array<{
            productName: string
            quantity: number
            price: number
            productImage?: string
        }>
    }>
    favorites: Array<{
        id: string
        nameRu: string
        price: number
        image?: string
    }>
    cart: {
        id: string
        items: Array<{
            id: string
            quantity: number
            product: {
                id: string
                nameRu: string
                price: number
                image?: string
            }
        }>
    } | null
    stats: {
        totalOrders: number
        completedOrders: number
        cancelledOrders: number
        pendingOrders: number
        totalSpent: number
        averageOrderValue: number
        favoritesCount: number
        cartItemsCount: number
        firstOrderAt: string | null
        lastOrderAt: string | null
        ordersByMonth: Record<string, { count: number; amount: number }>
    }
}

const statusLabels: Record<string, string> = {
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждён',
    PROCESSING: 'Готовится',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
}

export function AdminCustomerDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [data, setData] = useState<CustomerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'cart'>('orders')

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' сум'
    }

    const formatDate = (date: string, full = false) => {
        return new Date(date).toLocaleDateString('ru-RU', full ? {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        } : {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        })
    }

    useEffect(() => {
        const loadCustomer = async () => {
            if (!id) return
            setLoading(true)
            try {
                const customerData = await adminService.getCustomer(id)
                setData(customerData)
            } catch (error) {
                toast.error('Ошибка загрузки данных клиента')
                navigate('/admin/customers')
            } finally {
                setLoading(false)
            }
        }
        loadCustomer()
    }, [id, navigate])

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopied(label)
        toast.success(`${label} скопирован`)
        setTimeout(() => setCopied(null), 2000)
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Загрузка...</div>
                </div>
            </AdminLayout>
        )
    }

    if (!data) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">Клиент не найден</p>
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Вернуться к списку
                    </button>
                </div>
            </AdminLayout>
        )
    }

    const { customer, addresses, orders, favorites, cart, stats } = data
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Без имени'

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/admin/customers')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                    {customer.username && (
                        <p className="text-sm text-gray-500">@{customer.username}</p>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0 mx-auto sm:mx-0">
                        {fullName.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4 text-center sm:text-left">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{fullName}</h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                                {customer.username && (
                                    <button
                                        onClick={() => copyToClipboard(`@${customer.username}`, 'Username')}
                                        className="flex items-center gap-1 text-gray-600 hover:text-green-600"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>@{customer.username}</span>
                                        {copied === 'Username' ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <Copy className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                )}
                                <a
                                    href={`https://t.me/${customer.username || customer.telegramId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Telegram
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {customer.phone && (
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <button
                                        onClick={() => copyToClipboard(customer.phone!, 'Телефон')}
                                        className="text-gray-700 hover:text-green-600 flex items-center gap-1"
                                    >
                                        {customer.phone}
                                        {copied === 'Телефон' ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <Copy className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">
                                    Клиент с {formatDate(customer.createdAt, true)}
                                </span>
                            </div>
                        </div>

                        {/* Addresses */}
                        {addresses.length > 0 && (
                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Адреса доставки
                                </h3>
                                <div className="space-y-2">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={`p-3 rounded-lg text-left ${address.isDefault ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">{address.city}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {address.street}, {address.house}
                                                    </p>
                                                </div>
                                                {address.isDefault && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                        По умолчанию
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <ShoppingBag className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-500">Заказов</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-lg font-bold">{formatPrice(stats.totalSpent)}</p>
                    <p className="text-sm text-gray-500">Потрачено</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <Package className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.completedOrders}</p>
                    <p className="text-sm text-gray-500">Завершено</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <Heart className="w-8 h-8 mx-auto text-red-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.favoritesCount}</p>
                    <p className="text-sm text-gray-500">В избранном</p>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">Средний чек</p>
                        <p className="text-lg font-bold">{formatPrice(stats.averageOrderValue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Первый заказ</p>
                        <p className="text-lg font-bold">
                            {stats.firstOrderAt ? formatDate(stats.firstOrderAt) : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Последний заказ</p>
                        <p className="text-lg font-bold">
                            {stats.lastOrderAt ? formatDate(stats.lastOrderAt) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-4">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'orders'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Заказы ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'favorites'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Избранное ({favorites.length})
                </button>
                <button
                    onClick={() => setActiveTab('cart')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cart'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Корзина ({cart?.items.length || 0})
                </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
                {activeTab === 'orders' && (
                    <>
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600">Заказов пока нет</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold">#{order.orderNumber}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                    {statusLabels[order.status]}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatDate(order.createdAt, true)}
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                                    </div>

                                    <div className="space-y-2">
                                        {order.items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                                    {item.productImage ? (
                                                        <img
                                                            src={item.productImage}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.productName}</p>
                                                    <p className="text-xs text-gray-500">× {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-medium">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className="text-sm text-gray-500 text-center pt-2">
                                                и ещё {order.items.length - 3} товаров...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'favorites' && (
                    <>
                        {favorites.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600">Избранных товаров нет</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {favorites.map((product) => (
                                    <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                                        <div className="aspect-square bg-gray-100">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="font-medium text-sm truncate">{product.nameRu}</p>
                                            <p className="text-green-600 font-bold mt-1">
                                                {formatPrice(product.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'cart' && (
                    <>
                        {!cart || cart.items.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600">Корзина пуста</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="space-y-4">
                                    {cart.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                {item.product.image ? (
                                                    <img
                                                        src={item.product.image}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{item.product.nameRu}</p>
                                                <p className="text-sm text-gray-500">
                                                    {item.quantity} × {formatPrice(item.product.price)}
                                                </p>
                                            </div>
                                            <p className="font-bold">
                                                {formatPrice(item.quantity * item.product.price)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Итого:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {formatPrice(
                                            cart.items.reduce(
                                                (sum, item) => sum + item.quantity * item.product.price,
                                                0
                                            )
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}