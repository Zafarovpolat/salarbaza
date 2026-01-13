import { useEffect, useState } from 'react'
import { Package, FolderTree, ShoppingCart, TrendingUp } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'

interface Stats {
    productsCount: number
    categoriesCount: number
    ordersCount: number
    totalRevenue: number
}

export function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const data = await adminService.getStats()
            setStats(data)
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' сум'
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </AdminLayout>
        )
    }

    const cards = [
        { label: 'Товары', value: stats?.productsCount || 0, icon: Package, color: 'bg-blue-500' },
        { label: 'Категории', value: stats?.categoriesCount || 0, icon: FolderTree, color: 'bg-green-500' },
        { label: 'Заказы', value: stats?.ordersCount || 0, icon: ShoppingCart, color: 'bg-purple-500' },
        { label: 'Выручка', value: formatPrice(stats?.totalRevenue || 0), icon: TrendingUp, color: 'bg-orange-500' },
    ]

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Дашборд</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{card.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </AdminLayout>
    )
}