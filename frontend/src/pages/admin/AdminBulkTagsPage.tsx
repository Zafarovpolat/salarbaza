import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import { Tag, Check, Search, RotateCcw, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  code: string
  nameRu: string
  price: number
  isNew: boolean
  isFeatured: boolean
  isSpecialOffer: boolean
  isActive: boolean
  category?: { nameRu: string }
  images: { url: string }[]
  variants?: { size: string }[]
}

type TagKey = 'isNew' | 'isFeatured' | 'isSpecialOffer' | 'isActive'

const TAGS: { key: TagKey; labelOn: string; labelOff: string; colorOn: string; colorOff: string; emoji: string }[] = [
  { key: 'isNew',          labelOn: 'Новинка',     labelOff: 'Не новинка',    colorOn: 'bg-blue-500',   colorOff: 'bg-gray-200',   emoji: '🆕' },
  { key: 'isFeatured',     labelOn: 'Популярное',  labelOff: 'Обычный',       colorOn: 'bg-orange-500', colorOff: 'bg-gray-200',   emoji: '🔥' },
  { key: 'isSpecialOffer', labelOn: 'Акция',        labelOff: 'Без акции',     colorOn: 'bg-red-500',    colorOff: 'bg-gray-200',   emoji: '🏷️' },
  { key: 'isActive',       labelOn: 'Активен',      labelOff: 'Скрыт',         colorOn: 'bg-green-500',  colorOff: 'bg-gray-300',   emoji: '👁️' },
]

const formatPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p)

export function AdminBulkTagsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<{ id: string; nameRu: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [activeTagFilter, setActiveTagFilter] = useState<TagKey | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        adminService.getProducts(),
        adminService.getCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.nameRu.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || p.category?.nameRu === categoryFilter
    const matchTag = activeTagFilter === 'all' || p[activeTagFilter]
    return matchSearch && matchCat && matchTag
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  const applyTag = async (key: TagKey, value: boolean) => {
    if (selected.size === 0) {
      toast.error('Выберите товары')
      return
    }

    setSaving(true)
    try {
      await adminService.bulkUpdateTags(Array.from(selected), { [key]: value })

      // Обновляем локально
      setProducts(prev => prev.map(p =>
        selected.has(p.id) ? { ...p, [key]: value } : p
      ))

      const tag = TAGS.find(t => t.key === key)
      toast.success(`${value ? tag?.labelOn : tag?.labelOff} — ${selected.size} товаров`)
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const resetSelection = () => setSelected(new Set())

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-green-600" />
            Массовые теги
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Кликайте на товары → выбирайте тег → применяйте
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              Выбрано: {selected.size}
            </span>
            <button
              onClick={resetSelection}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ===== ACTION PANEL ===== */}
      {selected.size > 0 && (
        <div className="bg-white border-2 border-green-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Применить тег к {selected.size} товарам:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TAGS.map(tag => (
              <div key={tag.key} className="flex flex-col gap-1.5">
                <button
                  onClick={() => applyTag(tag.key, true)}
                  disabled={saving}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${tag.colorOn} hover:opacity-90 active:scale-95`}
                >
                  {tag.emoji} {tag.labelOn}
                </button>
                <button
                  onClick={() => applyTag(tag.key, false)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 active:scale-95"
                >
                  ✕ Убрать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="bg-white rounded-xl p-3 mb-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию или коду..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-green-500 outline-none"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 outline-none"
          >
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.nameRu}>{c.nameRu}</option>
            ))}
          </select>

          {/* Tag filter */}
          <select
            value={activeTagFilter}
            onChange={e => setActiveTagFilter(e.target.value as TagKey | 'all')}
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 outline-none"
          >
            <option value="all">Все теги</option>
            {TAGS.map(t => (
              <option key={t.key} value={t.key}>{t.emoji} {t.labelOn}</option>
            ))}
          </select>

          {/* Select all */}
          <button
            onClick={selectAll}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {selected.size === filtered.length && filtered.length > 0 ? 'Снять всё' : `Выбрать все (${filtered.length})`}
          </button>
        </div>
      </div>

      {/* ===== PRODUCT GRID ===== */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Товары не найдены</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(product => {
            const isSelected = selected.has(product.id)
            const image = product.images?.[0]?.url

            return (
              <div
                key={product.id}
                onClick={() => toggleSelect(product.id)}
                className={`
                  relative rounded-2xl overflow-hidden cursor-pointer
                  transition-all duration-150 select-none
                  ${isSelected
                    ? 'ring-3 ring-green-500 shadow-lg scale-[0.97]'
                    : 'ring-1 ring-gray-200 hover:ring-green-300 hover:shadow-md'
                  }
                `}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {image ? (
                    <img
                      src={image}
                      alt={product.nameRu}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Tags badges */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        🆕
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        🔥
                      </span>
                    )}
                    {product.isSpecialOffer && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        🏷️
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="bg-gray-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        🚫
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white p-2">
                  <p className="text-[11px] text-gray-500 truncate">{product.code}</p>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mt-0.5">
                    {product.nameRu}
                  </p>
                  <p className="text-[11px] text-green-700 font-bold mt-1">
                    {formatPrice(product.price)} сум
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}