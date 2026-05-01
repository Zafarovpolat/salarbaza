// frontend/src/pages/admin/AdminBitoCustomersPage.tsx
//
// Список клиентов, импортированных из Bito ERP. Read-only — данные владеет Bito,
// мы только отображаем. Источник: таблица bito_customers (245 записей на момент
// первой синхронизации).

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  UserCircle2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Award,
  Filter,
  Phone,
  Eye,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface BitoCustomer {
  id: string
  bitoId: string
  name: string
  phone: string | null
  extraPhones: string[] | null
  cardNumber: string | null
  type: string | null
  totalSale: number
  avgSale: number
  point: number
  balance: number
  balanceCurrency: string | null
  isActive: boolean
  bitoCreatedAt: string | null
  bitoUpdatedAt: string | null
  createdAt: string
  updatedAt: string
}

interface BitoCustomersStats {
  overview: {
    total: number
    active: number
    inactive: number
    debtors: number
    creditors: number
  }
  financial: {
    totalBalance: number
    minBalance: number
    maxBalance: number
    totalSale: number
    totalPoints: number
    averageSale: number
  }
  topCustomers: Array<{
    id: string
    name: string
    phone: string | null
    totalSale: number
    avgSale: number
    balance: number
    point: number
  }>
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + ' сум'
}

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function AdminBitoCustomersPage() {
  const [customers, setCustomers] = useState<BitoCustomer[]>([])
  const [stats, setStats] = useState<BitoCustomersStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('totalSale')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isActive, setIsActive] = useState<'all' | 'yes' | 'no'>('all')
  const [hasBalance, setHasBalance] = useState<'all' | 'debt' | 'credit' | 'zero'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const limit = 20

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [customersData, statsData] = await Promise.all([
        adminService.getBitoCustomers({
          page,
          limit,
          search: search || undefined,
          sortBy,
          sortOrder,
          isActive,
          hasBalance,
        }),
        !stats ? adminService.getBitoCustomersStats() : Promise.resolve(null),
      ])

      setCustomers(customersData.customers)
      setTotalPages(customersData.pagination.totalPages)
      setTotal(customersData.pagination.total)

      if (statsData) {
        setStats(statsData)
      }
    } catch (error) {
      toast.error('Ошибка загрузки клиентов из Bito')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder, isActive, hasBalance])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await adminService.exportBitoCustomers()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bito_customers_${new Date().toISOString().slice(0, 10)}.csv`
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const balanceColor = (b: number) => {
    if (b < 0) return 'text-red-600'
    if (b > 0) return 'text-green-600'
    return 'text-gray-500'
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Клиенты Bito</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} клиентов · импорт из Bito ERP (read-only)
          </p>
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
                <UserCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overview.total}</p>
                <p className="text-xs text-gray-500">Всего клиентов</p>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.overview.active} активных
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatPrice(stats.financial.totalBalance)}</p>
                <p className="text-xs text-gray-500">Сумма балансов</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-red-600">{stats.overview.debtors}</span> должников ·{' '}
              <span className="text-green-600">{stats.overview.creditors}</span> переплат
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatPrice(stats.financial.totalSale)}</p>
                <p className="text-xs text-gray-500">Сумма покупок</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              средний чек: {formatPrice(stats.financial.averageSale)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.financial.totalPoints}</p>
                <p className="text-xs text-gray-500">Бонусных баллов</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top customers */}
      {stats && stats.topCustomers.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Топ-10 по покупкам</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {stats.topCustomers.slice(0, 10).map((c, i) => (
              <Link
                key={c.id}
                to={`/admin/bito-customers/${c.id}`}
                className="block p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <p className="text-xs text-gray-400">#{i + 1}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500">
                  {c.totalSale} зак · {formatPrice(c.avgSale)} ср
                </p>
                <p className={`text-xs ${balanceColor(c.balance)}`}>{formatPrice(c.balance)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, карте, Bito ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Фильтры
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Активность</label>
              <select
                value={isActive}
                onChange={(e) => {
                  setIsActive(e.target.value as 'all' | 'yes' | 'no')
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Все</option>
                <option value="yes">Только активные</option>
                <option value="no">Только неактивные</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Баланс</label>
              <select
                value={hasBalance}
                onChange={(e) => {
                  setHasBalance(e.target.value as 'all' | 'debt' | 'credit' | 'zero')
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Любой</option>
                <option value="debt">Должники (баланс &lt; 0)</option>
                <option value="credit">Переплата (баланс &gt; 0)</option>
                <option value="zero">Ноль</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Загрузка...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Клиенты не найдены</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Имя {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalSale')}
                    >
                      Заказов {sortBy === 'totalSale' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('avgSale')}
                    >
                      Ср. чек {sortBy === 'avgSale' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('balance')}
                    >
                      Баланс {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('point')}
                    >
                      Бонусы {sortBy === 'point' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('bitoCreatedAt')}
                    >
                      Создан {sortBy === 'bitoCreatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.name || 'Без имени'}</div>
                        {c.cardNumber && (
                          <div className="text-xs text-gray-400">карта: {c.cardNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{c.totalSale}</td>
                      <td className="px-4 py-3 text-right">{formatPrice(c.avgSale)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${balanceColor(c.balance)}`}>
                        {formatPrice(c.balance)}
                      </td>
                      <td className="px-4 py-3 text-right">{c.point}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            c.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {c.isActive ? 'активен' : 'неактивен'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(c.bitoCreatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/bito-customers/${c.id}`}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs"
                        >
                          <Eye className="w-3 h-3" /> Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Стр. {page} из {totalPages} · {total} клиентов
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
