import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { get } from '@/services/api'
import { LoadingScreen } from '@/components/common/LoadingScreen'

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
  const [error, setError] = useState<string | null>(null)

  const load = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await get<{ success: boolean; data: AnalyticsData }>(`/admin/analytics?period=${p}`)
      setData(res.data)
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Не удалось загрузить аналитику. Откройте через бота /admin — получите ссылку для браузера.')
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
        <LoadingScreen />
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-charcoal">Аналитика</h2>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <p className="mt-2 text-xs text-gray-500">Откройте Telegram → @DecorMarketUz_Bot → /admin → кнопка "Открыть в браузере (ПК)" — тогда сессия появится и страница заработает.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Аналитика</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded text-sm ${period === d ? 'bg-forest text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {d}д
            </button>
          ))}
        </div>
      </div>

      {!data || (data.productViews === 0 && data.orders === 0 && data.sessions === 0) ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-gray-500">Пока нет данных за {period} дней. Как только пользователи начнут просматривать товары, тут появится воронка.</p>
          <p className="mt-2 text-xs text-gray-400">События: product_view, add_to_cart, checkout_started, order_created и т.д. Собираются с сайта в реальном времени.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Выручка</p>
              <p className="text-xl font-bold text-forest">{fmt(data.revenue)} сум</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Заказы</p>
              <p className="text-xl font-bold">{data.orders}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Средний чек</p>
              <p className="text-xl font-bold">{fmt(data.avgOrderValue)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Сессий</p>
              <p className="text-xl font-bold">{data.sessions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Воронка</h3>
              <ul className="text-sm space-y-2">
                <li>Просмотры товаров: {data.productViews}</li>
                <li>Добавлено в корзину: {data.conversion?.addToCart} ({data.conversion?.addToCartRate?.toFixed(1)}%)</li>
                <li>Начало оформления: {data.conversion?.checkoutStarted} ({data.conversion?.checkoutRate?.toFixed(1)}%)</li>
                <li>Заказы созданы: {data.conversion?.orderCreated} ({data.conversion?.orderRate?.toFixed(1)}%)</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Поиск</h3>
              <ul className="text-sm space-y-2">
                <li>Всего поисков: {data.searches}</li>
                <li>Без результатов: {data.noResultSearches}</li>
                <li>Просмотров категорий: {data.categoryViews}</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Источники Telegram</h3>
              <ul className="text-xs max-h-40 overflow-auto space-y-1">
                {data.telegramSources?.length ? data.telegramSources.map((s: any) => (
                  <li key={s.source} className="flex justify-between"><span className="truncate">{s.source}</span><span>{s._count?._all || s.count}</span></li>
                )) : <li className="text-gray-400">Нет данных</li>}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Топ товары (просмотры)</h3>
              <ul className="text-sm space-y-1">
                {data.topProducts?.length ? data.topProducts.map((p: any) => (
                  <li key={p.productId} className="flex justify-between">
                    <span className="truncate">{p.product?.nameRu || p.productId?.slice(0, 8)}</span>
                    <span className="font-medium">{p.count}</span>
                  </li>
                )) : <li className="text-gray-400">Нет данных</li>}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Топ категории</h3>
              <ul className="text-sm space-y-1">
                {data.topCategories?.length ? data.topCategories.map((c: any) => (
                  <li key={c.categoryId} className="flex justify-between">
                    <span className="truncate">{c.category?.nameRu || c.categoryId?.slice(0, 8)}</span>
                    <span className="font-medium">{c.count}</span>
                  </li>
                )) : <li className="text-gray-400">Нет данных</li>}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Смотрели, но не заказали</h3>
            <div className="flex flex-wrap gap-2">
              {data.viewedNotOrdered?.length ? data.viewedNotOrdered.map((p: any) => (
                <span key={p.id} className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">{p.nameRu} ({p.code})</span>
              )) : <span className="text-xs text-gray-400">Нет таких товаров — отлично!</span>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
