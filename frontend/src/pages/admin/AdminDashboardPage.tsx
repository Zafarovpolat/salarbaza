// frontend/src/pages/admin/AdminDashboardPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, FolderTree, ShoppingCart, TrendingUp, Tag } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'

interface Stats {
  productsCount: number
  categoriesCount: number
  ordersCount: number
  totalRevenue: number
  activePromotions: number  // 🆕
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
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
    return new Intl.NumberFormat('uz-UZ').format(price)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const cards = [
    { label: 'Товары', value: stats?.productsCount || 0, icon: Package, color: 'bg-blue-500', link: '/admin/products' },
    { label: 'Категории', value: stats?.categoriesCount || 0, icon: FolderTree, color: 'bg-green-500', link: '/admin/categories' },
    { label: 'Заказы', value: stats?.ordersCount || 0, icon: ShoppingCart, color: 'bg-purple-500', link: '/admin/orders' },
    { label: 'Выручка', value: formatPrice(stats?.totalRevenue || 0), icon: TrendingUp, color: 'bg-orange-500', suffix: ' сум' },
    { label: 'Активные акции', value: stats?.activePromotions || 0, icon: Tag, color: 'bg-red-500', link: '/admin/promotions' },  // 🆕
  ]

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Дашборд</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              onClick={() => card.link && navigate(card.link)}
              className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm ${
                card.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.color} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {card.value}{card.suffix || ''}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}