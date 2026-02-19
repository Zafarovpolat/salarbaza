// frontend/src/pages/admin/AdminPromotionsPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Tag, Calendar, Package, Trash2, Eye, EyeOff,
  Sparkles, Star, Gift, Clock, ChevronRight, Search, Filter
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import { Promotion, PromotionStatus, PromotionType } from '@/types'
import { AdminLayout } from '@/components/admin/AdminLayout'
import toast from 'react-hot-toast'

const statusConfig: Record<PromotionStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Черновик', color: 'text-gray-600', bg: 'bg-gray-100' },
  SCHEDULED: { label: 'Запланировано', color: 'text-blue-600', bg: 'bg-blue-50' },
  ACTIVE: { label: 'Активно', color: 'text-green-600', bg: 'bg-green-50' },
  INACTIVE: { label: 'Неактивно', color: 'text-red-600', bg: 'bg-red-50' },
}

const typeConfig: Record<PromotionType, { label: string; icon: any; color: string }> = {
  SALE: { label: 'Акция со скидкой', icon: Tag, color: 'text-red-500' },
  COLLECTION: { label: 'Подборка', icon: Star, color: 'text-green-500' },
  LIMITED: { label: 'Ограниченная серия', icon: Sparkles, color: 'text-amber-500' },
  NEW_ARRIVALS: { label: 'Новинки', icon: Gift, color: 'text-blue-500' },
}

export function AdminPromotionsPage() {
  const navigate = useNavigate()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPromotions()
  }, [])

  async function fetchPromotions() {
    try {
      setIsLoading(true)
      const data = await adminService.getPromotions()
      setPromotions(data)
    } catch (error) {
      toast.error('Ошибка загрузки акций')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleStatus(promo: Promotion) {
    try {
      const newStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await adminService.updatePromotionStatus(promo.id, newStatus)
      toast.success(newStatus === 'ACTIVE' ? 'Акция активирована' : 'Акция деактивирована')
      fetchPromotions()
    } catch (error) {
      toast.error('Ошибка изменения статуса')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить акцию? Это действие нельзя отменить.')) return
    try {
      await adminService.deletePromotion(id)
      toast.success('Акция удалена')
      fetchPromotions()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function getDaysLeft(endDate: string) {
    const end = new Date(endDate)
    const now = new Date()
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  function isExpired(endDate: string) {
    return new Date(endDate) < new Date()
  }

  // Фильтрация
  const filtered = promotions.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.nameRu.toLowerCase().includes(q) && !p.nameUz.toLowerCase().includes(q)) return false
    }
    return true
  })

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'ACTIVE').length,
    scheduled: promotions.filter(p => p.status === 'SCHEDULED').length,
    inactive: promotions.filter(p => p.status === 'INACTIVE' || p.status === 'DRAFT').length,
  }

  return (
    <AdminLayout title="Акции и спецпредложения">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Всего', value: stats.total, color: 'bg-gray-50 text-gray-700' },
          { label: 'Активные', value: stats.active, color: 'bg-green-50 text-green-700' },
          { label: 'Запланированные', value: stats.scheduled, color: 'bg-blue-50 text-blue-700' },
          { label: 'Неактивные', value: stats.inactive, color: 'bg-red-50 text-red-700' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs mt-1 opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск акций..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="SCHEDULED">Запланированные</option>
            <option value="DRAFT">Черновики</option>
            <option value="INACTIVE">Неактивные</option>
          </select>
        </div>

        <button
          onClick={() => navigate('/admin/promotions/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Создать акцию
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-gray-500 mb-1">Акций пока нет</p>
          <p className="text-sm text-gray-400 mb-4">Создайте первую маркетинговую акцию</p>
          <button
            onClick={() => navigate('/admin/promotions/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Создать акцию
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(promo => {
            const status = statusConfig[promo.status]
            const type = typeConfig[promo.type]
            const TypeIcon = type.icon
            const daysLeft = getDaysLeft(promo.endDate)
            const expired = isExpired(promo.endDate)
            const productsCount = promo._count?.products || 0

            return (
              <div
                key={promo.id}
                className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color} bg-opacity-10`}
                        style={{ backgroundColor: `currentColor`, opacity: 0.1 }}
                      >
                        <TypeIcon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-gray-900 truncate cursor-pointer hover:text-green-600 transition-colors"
                          onClick={() => navigate(`/admin/promotions/${promo.id}`)}
                        >
                          {promo.nameRu}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">{promo.nameUz}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} whitespace-nowrap`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Description */}
                  {promo.descriptionRu && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {promo.descriptionRu}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {productsCount} товаров
                    </span>

                    <span className="flex items-center gap-1">
                      <TypeIcon className={`w-3.5 h-3.5 ${type.color}`} />
                      {type.label}
                    </span>

                    {promo.status === 'ACTIVE' && !expired && (
                      <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-green-500'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {daysLeft} дн. осталось
                      </span>
                    )}

                    {expired && promo.status === 'ACTIVE' && (
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Истекла
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => navigate(`/admin/promotions/${promo.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Редактировать
                    </button>

                    <button
                      onClick={() => handleToggleStatus(promo)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                        promo.status === 'ACTIVE'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {promo.status === 'ACTIVE' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Деактивировать
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Активировать
                        </>
                      )}
                    </button>

                    <div className="flex-1" />

                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}