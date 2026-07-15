import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { get } from '@/services/api'

interface AnalyticsData {
  period: number
  revenue: number
  orders: number
  avgOrderValue: number
  sessions: number
  productViews: number
  categoryViews: number
  searches: number
  noResultSearches: number
  conversion: any
  topProducts: any[]
  topCategories: any[]
  viewedNotOrdered: any[]
  topSearches: any[]
  telegramSources: any[]
}

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async (p: number) => {
    setLoading(true)
    try {
      const res = await get<{ success: boolean; data: AnalyticsData }>(`/admin/analytics?period=${p}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(period)
  }, [period])

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded text-sm ${period === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold">{fmt(data.revenue)} сум</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-xl font-bold">{data.orders}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Avg Order</p>
              <p className="text-xl font-bold">{fmt(data.avgOrderValue)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Sessions</p>
              <p className="text-xl font-bold">{data.sessions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Funnel</h3>
              <ul className="text-sm space-y-2">
                <li>Product views: {data.productViews}</li>
                <li>Add to cart: {data.conversion?.addToCart} ({data.conversion?.addToCartRate?.toFixed(1)}%)</li>
                <li>Checkout started: {data.conversion?.checkoutStarted} ({data.conversion?.checkoutRate?.toFixed(1)}%)</li>
                <li>Order created: {data.conversion?.orderCreated} ({data.conversion?.orderRate?.toFixed(1)}%)</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Search</h3>
              <ul className="text-sm space-y-2">
                <li>Total searches: {data.searches}</li>
                <li>No results: {data.noResultSearches}</li>
                <li>Category views: {data.categoryViews}</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Telegram Sources</h3>
              <ul className="text-xs max-h-40 overflow-auto space-y-1">
                {data.telegramSources?.map((s: any) => (
                  <li key={s.source} className="flex justify-between"><span className="truncate">{s.source}</span><span>{s._count?._all || s.count}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Top Products (views)</h3>
              <ul className="text-sm space-y-1">
                {data.topProducts?.map((p: any) => (
                  <li key={p.productId} className="flex justify-between">
                    <span>{p.product?.nameRu || p.productId?.slice(0, 8)}</span>
                    <span className="font-medium">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Top Categories</h3>
              <ul className="text-sm space-y-1">
                {data.topCategories?.map((c: any) => (
                  <li key={c.categoryId} className="flex justify-between">
                    <span>{c.category?.nameRu || c.categoryId?.slice(0, 8)}</span>
                    <span className="font-medium">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Viewed but not ordered</h3>
            <div className="flex flex-wrap gap-2">
              {data.viewedNotOrdered?.map((p: any) => (
                <span key={p.id} className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">{p.nameRu} ({p.code})</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
