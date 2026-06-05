// frontend/src/pages/admin/AdminDashboardPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, FolderTree, ShoppingCart, TrendingUp, Tag,
  AlertTriangle, Users, Clock, ArrowRight, PackageX,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'

interface Stats {
  productsCount: number
  categoriesCount: number
  ordersCount: number
  totalRevenue: number
  activePromotions: number
}

interface DashboardData {
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    status: string
    total: number
    itemsCount: number
    createdAt: string
  }[]
  lowStockProducts: {
    id: string
    code: string
    nameRu: string
    stockQuantity: number
    price: number
  }[]
  outOfStockCount: number
  newCustomers7d: number
  ordersByStatus: Record<string, number>
  topCategories: { id: string; nameRu: string; productCount: number }[]
  revenueThisMonth: number
  ordersThisMonth: number
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Новый',      color: 'text-yellow-700', bg: 'bg-yellow-50' },
  CONFIRMED:  { label: 'Подтверждён', color: 'text-blue-700',   bg: 'bg-blue-50' },
  PROCESSING: { label: 'В работе',   color: 'text-indigo-700', bg: 'bg-indigo-50' },
  SHIPPED:    { label: 'Отправлен',  color: 'text-purple-700', bg: 'bg-purple-50' },
  DELIVERED:  { label: 'Доставлен',  color: 'text-green-700',  bg: 'bg-green-50' },
  CANCELLED:  { label: 'Отменён',    color: 'text-red-700',    bg: 'bg-red-50' },
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [s, d] = await Promise.all([
        adminService.getStats(),
        adminService.getDashboardData(),
      ])
      setStats(s)
      setDashboard(d)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n)

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} мин`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ч`
    return `${Math.floor(hrs / 24)} д`
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      </AdminLayout>
    )
  }

  const cards = [
    { label: 'Товары',          value: stats?.productsCount || 0,          icon: Package,      color: 'bg-blue-500',   link: '/admin/products' },
    { label: 'Категории',       value: stats?.categoriesCount || 0,        icon: FolderTree,   color: 'bg-green-500',  link: '/admin/categories' },
    { label: 'Заказы',          value: stats?.ordersCount || 0,            icon: ShoppingCart,  color: 'bg-purple-500', link: '/admin/orders' },
    { label: 'Выручка',         value: fmt(stats?.totalRevenue || 0),      icon: TrendingUp,   color: 'bg-orange-500', suffix: ' сум' },
    { label: 'Активные акции',  value: stats?.activePromotions || 0,       icon: Tag,          color: 'bg-red-500',    link: '/admin/promotions' },
  ]

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Дашборд</h1>

      {/* ── Stat cards ──────────────────────────────────────────── */}
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

      {/* ── Second row: month summary + new customers ────────── */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Выручка за месяц</p>
            <p className="text-xl font-bold text-forest">{fmt(dashboard.revenueThisMonth)} <span className="text-sm font-normal text-gray-400">сум</span></p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Заказов за месяц</p>
            <p className="text-xl font-bold text-charcoal">{dashboard.ordersThisMonth}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
               onClick={() => navigate('/admin/customers')}>
            <p className="text-xs text-gray-500 mb-1">Новых клиентов (7 д)</p>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sage" />
              <p className="text-xl font-bold text-charcoal">{dashboard.newCustomers7d}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────── */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

          {/* ── Recent orders ────────────────────────────────── */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Последние заказы
              </h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs text-sage hover:text-forest flex items-center gap-1 transition-colors"
              >
                Все <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {dashboard.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Заказов пока нет</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {dashboard.recentOrders.map((o) => {
                  const s = STATUS_MAP[o.status] || { label: o.status, color: 'text-gray-600', bg: 'bg-gray-50' }
                  return (
                    <div key={o.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-ivory/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-charcoal">#{o.orderNumber}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.color} ${s.bg}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {o.customerName} · {o.itemsCount} товар{o.itemsCount > 1 ? (o.itemsCount < 5 ? 'а' : 'ов') : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-charcoal">{fmt(o.total)}</p>
                        <p className="text-[11px] text-gray-400">{timeAgo(o.createdAt)} назад</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Stock alerts ─────────────────────────────────── */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Остатки на складе
              </h2>
              {dashboard.outOfStockCount > 0 && (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <PackageX className="w-3 h-3" />
                  {dashboard.outOfStockCount} нет в наличии
                </span>
              )}
            </div>

            {dashboard.lowStockProducts.length === 0 && dashboard.outOfStockCount === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Все товары в наличии ✅</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {dashboard.lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/admin/products`)}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 cursor-pointer hover:bg-ivory/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{p.nameRu}</p>
                      <p className="text-xs text-gray-400">{p.code}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-bold ${p.stockQuantity <= 2 ? 'text-red-500' : 'text-yellow-600'}`}>
                        {p.stockQuantity} шт
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Orders by status ─────────────────────────────── */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
              Заказы по статусу
            </h2>
            <div className="space-y-2">
              {Object.entries(dashboard.ordersByStatus).map(([status, count]) => {
                const s = STATUS_MAP[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-50' }
                const total = Object.values(dashboard.ordersByStatus).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-28 ${s.color}`}>{s.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${s.bg} ${s.color.replace('text-', 'bg-').replace('-700', '-400')}`}
                           style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Top categories ───────────────────────────────── */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-gray-400" />
              Топ категории по товарам
            </h2>
            <div className="space-y-2">
              {dashboard.topCategories.map((cat, i) => {
                const maxCount = dashboard.topCategories[0]?.productCount || 1
                const pct = Math.round((cat.productCount / maxCount) * 100)
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm text-charcoal truncate flex-1 min-w-0">{cat.nameRu}</span>
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden flex-shrink-0">
                      <div className="h-full rounded-full bg-sage/70" style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right font-medium">{cat.productCount}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  )
}
