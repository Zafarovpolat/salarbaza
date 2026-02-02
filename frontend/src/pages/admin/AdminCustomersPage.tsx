import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    Users,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ShoppingBag,
    UserPlus,
    Filter,
    ArrowUpDown,
    Phone,
    Eye,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface CustomerStats {
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    totalSpent: number
    averageOrderValue: number
    favoritesCount: number
    lastOrderAt: string | null
    lastOrderStatus: string | null
}

interface Customer {
    id: string
    telegramId: string
    firstName: string | null
    lastName: string | null
    username: string | null
    phone: string | null
    language: string
    createdAt: string
    stats: CustomerStats
}

interface StatsData {
    overview: {
        totalCustomers: number
        customersWithOrders: number
        customersWithoutOrders: number
        newCustomers30d: number
        newCustomers7d: number
        activeCustomers: number
        conversionRate: string
    }
    financial: {
        totalRevenue: number
        averageOrderValue: number
        totalOrders: number
    }
    topCustomers: Array<{
        id: string
        name: string
        username: string | null
        ordersCount: number
        totalSpent: number
    }>
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

export function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    // Фильтры и пагинация
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [hasOrders, setHasOrders] = useState<'all' | 'yes' | 'no'>('all')
    const [showFilters, setShowFilters] = useState(false)

    const limit = 20

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' сум'
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        })
    }

    // Загрузка данных
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [customersData, statsData] = await Promise.all([
                adminService.getCustomers({
                    page,
                    limit,
                    search: search || undefined,
                    sortBy,
                    sortOrder,
                    hasOrders,
                }),
                !stats ? adminService.getCustomersStats() : Promise.resolve(null),
            ])

            setCustomers(customersData.customers)
            setTotalPages(customersData.pagination.totalPages)
            setTotal(customersData.pagination.total)

            if (statsData) {
                setStats(statsData)
            }
        } catch (error) {
            toast.error('Ошибка загрузки данных')
        } finally {
            setLoading(false)
        }
    }, [page, search, sortBy, sortOrder, hasOrders, stats])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Debounced поиск
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) {
                setPage(1)
            } else {
                loadData()
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Экспорт в CSV
    const handleExport = async () => {
        setExporting(true)
        try {
            const blob = await adminService.exportCustomers()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Экспорт завершён')
        } catch {
            toast.error('Ошибка экспорта')
        } finally {
            setExporting(false)
        }
    }

    // Сортировка
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
        setPage(1)
    }

    const getCustomerName = (customer: Customer) => {
        return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Без имени'
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">База клиентов</h1>
                    <p className="text-sm text-gray-500 mt-1">{total} клиентов</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Экспорт...' : 'Экспорт CSV'}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.overview.totalCustomers}</p>
                                <p className="text-xs text-gray-500">Всего клиентов</p>
                            </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{stats.overview.newCustomers7d} за неделю
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.overview.customersWithOrders}</p>
                                <p className="text-xs text-gray-500">С заказами</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {stats.overview.conversionRate}% конверсия
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.overview.newCustomers30d}</p>
                                <p className="text-xs text-gray-500">За 30 дней</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{formatPrice(stats.financial.totalRevenue)}</p>
                                <p className="text-xs text-gray-500">Общий доход</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Поиск по имени, username или телефону..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showFilters ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Фильтры
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Наличие заказов
                            </label>
                            <select
                                value={hasOrders}
                                onChange={(e) => {
                                    setHasOrders(e.target.value as 'all' | 'yes' | 'no')
                                    setPage(1)
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="all">Все клиенты</option>
                                <option value="yes">С заказами</option>
                                <option value="no">Без заказов</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="py-3 px-4 text-left">
                                <button
                                    onClick={() => handleSort('createdAt')}
                                    className={`flex items-center gap-1 text-sm font-medium ${sortBy === 'createdAt' ? 'text-green-600' : 'text-gray-600'
                                        }`}
                                >
                                    Клиент
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                Телефон
                            </th>
                            <th className="py-3 px-4 text-center">
                                <button
                                    onClick={() => handleSort('totalOrders')}
                                    className={`flex items-center gap-1 text-sm font-medium mx-auto ${sortBy === 'totalOrders' ? 'text-green-600' : 'text-gray-600'
                                        }`}
                                >
                                    Заказы
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="py-3 px-4 text-right">
                                <button
                                    onClick={() => handleSort('totalSpent')}
                                    className={`flex items-center gap-1 text-sm font-medium ml-auto ${sortBy === 'totalSpent' ? 'text-green-600' : 'text-gray-600'
                                        }`}
                                >
                                    Сумма
                                    <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">
                                Посл. заказ
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                                Регистрация
                            </th>
                            <th className="py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500">
                                    Загрузка...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">Клиенты не найдены</p>
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className="border-b hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <Link to={`/admin/customers/${customer.id}`} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium">
                                                {getCustomerName(customer).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 hover:text-green-600">
                                                    {getCustomerName(customer)}
                                                </p>
                                                {customer.username && (
                                                    <p className="text-sm text-gray-500">@{customer.username}</p>
                                                )}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-4 px-4">
                                        {customer.phone ? (
                                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                                                <Phone className="w-4 h-4" />
                                                {customer.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                                            {customer.stats.totalOrders}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium">
                                        {formatPrice(customer.stats.totalSpent)}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {customer.stats.lastOrderAt ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm text-gray-600">
                                                    {formatDate(customer.stats.lastOrderAt)}
                                                </span>
                                                {customer.stats.lastOrderStatus && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[customer.stats.lastOrderStatus]}`}>
                                                        {statusLabels[customer.stats.lastOrderStatus]}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-500">
                                        {formatDate(customer.createdAt)}
                                    </td>
                                    <td className="py-4 px-4">
                                        <Link
                                            to={`/admin/customers/${customer.id}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Загрузка...
                    </div>
                ) : customers.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">Клиенты не найдены</p>
                    </div>
                ) : (
                    customers.map((customer) => (
                        <Link
                            key={customer.id}
                            to={`/admin/customers/${customer.id}`}
                            className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg font-medium shrink-0">
                                    {getCustomerName(customer).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {getCustomerName(customer)}
                                            </p>
                                            {customer.username && (
                                                <p className="text-sm text-gray-500">@{customer.username}</p>
                                            )}
                                        </div>
                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                            {customer.stats.totalOrders} заказов
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-4 text-sm">
                                        {customer.phone && (
                                            <span className="text-gray-600">{customer.phone}</span>
                                        )}
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-semibold text-green-600">
                                            {formatPrice(customer.stats.totalSpent)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(customer.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600">
                        {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} из {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Top Customers */}
            {stats && stats.topCustomers.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">🏆 Топ клиентов по сумме покупок</h2>
                    <div className="space-y-3">
                        {stats.topCustomers.slice(0, 5).map((customer, index) => (
                            <Link
                                key={customer.id}
                                to={`/admin/customers/${customer.id}`}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                            index === 2 ? 'bg-amber-600' :
                                                'bg-gray-300'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900">{customer.name}</p>
                                        {customer.username && (
                                            <p className="text-sm text-gray-500">@{customer.username}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatPrice(customer.totalSpent)}</p>
                                    <p className="text-sm text-gray-500">{customer.ordersCount} заказов</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}