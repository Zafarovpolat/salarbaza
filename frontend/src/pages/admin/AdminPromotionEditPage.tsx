// frontend/src/pages/admin/AdminPromotionEditPage.tsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Save, ArrowLeft, Plus, X, Search, Tag, Star, Sparkles,
  Gift, Calendar, Package, Image, FileText, Eye
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import { Product, PromotionType, PromotionStatus } from '@/types'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { formatPrice } from '@/utils/formatPrice'
import toast from 'react-hot-toast'

const typeOptions: { value: PromotionType; label: string; icon: any }[] = [
  { value: 'SALE', label: 'Акция со скидкой', icon: Tag },
  { value: 'COLLECTION', label: 'Подборка', icon: Star },
  { value: 'LIMITED', label: 'Ограниченная серия', icon: Sparkles },
  { value: 'NEW_ARRIVALS', label: 'Новинки', icon: Gift },
]

const statusOptions: { value: PromotionStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'SCHEDULED', label: 'Запланировано' },
  { value: 'ACTIVE', label: 'Активно' },
  { value: 'INACTIVE', label: 'Неактивно' },
]

interface FormData {
  nameRu: string
  nameUz: string
  slug: string
  descriptionRu: string
  descriptionUz: string
  rulesRu: string
  rulesUz: string
  image: string
  type: PromotionType
  status: PromotionStatus
  startDate: string
  endDate: string
  sortOrder: number
}

export function AdminPromotionEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [form, setForm] = useState<FormData>({
    nameRu: '',
    nameUz: '',
    slug: '',
    descriptionRu: '',
    descriptionUz: '',
    rulesRu: '',
    rulesUz: '',
    image: '',
    type: 'SALE',
    status: 'DRAFT',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    sortOrder: 0,
  })

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Загрузка данных
  useEffect(() => {
    loadProducts()
    if (isEditing) loadPromotion()
  }, [id])

  async function loadProducts() {
    try {
      const data = await adminService.getProducts()
      setAllProducts(data)
    } catch {
      toast.error('Ошибка загрузки товаров')
    }
  }

  async function loadPromotion() {
    try {
      setIsLoading(true)
      const data = await adminService.getPromotion(id!)

      setForm({
        nameRu: data.nameRu || '',
        nameUz: data.nameUz || '',
        slug: data.slug || '',
        descriptionRu: data.descriptionRu || '',
        descriptionUz: data.descriptionUz || '',
        rulesRu: data.rulesRu || '',
        rulesUz: data.rulesUz || '',
        image: data.image || '',
        type: data.type || 'SALE',
        status: data.status || 'DRAFT',
        startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
        sortOrder: data.sortOrder || 0,
      })

      // Извлекаем productIds из связующей таблицы
      if (data.products && Array.isArray(data.products)) {
        const ids = data.products.map((pp: any) => pp.product?.id || pp.productId).filter(Boolean)
        setSelectedProductIds(ids)
      }
    } catch {
      toast.error('Ошибка загрузки акции')
      navigate('/admin/promotions')
    } finally {
      setIsLoading(false)
    }
  }

  // Автогенерация slug
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[а-яё]/g, (c) => {
        const map: Record<string, string> = {
          а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
          ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
          н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
          ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
          ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
        }
        return map[c] || c
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }

  function handleNameChange(value: string) {
    setForm(prev => ({
      ...prev,
      nameRu: value,
      slug: !isEditing || !prev.slug ? generateSlug(value) : prev.slug,
    }))
  }

  // Сохранение
  async function handleSave() {
    if (!form.nameRu.trim()) {
      toast.error('Введите название акции')
      return
    }
    if (!form.nameUz.trim()) {
      toast.error('Введите название на узбекском')
      return
    }
    if (!form.startDate || !form.endDate) {
      toast.error('Укажите даты начала и окончания')
      return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('Дата окончания должна быть позже даты начала')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        productIds: selectedProductIds,
      }

      if (isEditing) {
        await adminService.updatePromotion(id!, payload)
        toast.success('Акция обновлена')
      } else {
        await adminService.createPromotion(payload)
        toast.success('Акция создана')
      }

      navigate('/admin/promotions')
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  // Товары
  function toggleProduct(productId: string) {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }

  function removeProduct(productId: string) {
    setSelectedProductIds(prev => prev.filter(id => id !== productId))
  }

  const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id))

  const filteredProducts = allProducts.filter(p => {
    if (productSearch) {
      const q = productSearch.toLowerCase()
      return (
        p.nameRu.toLowerCase().includes(q) ||
        p.nameUz.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (isLoading) {
    return (
      <AdminLayout title="Загрузка...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={isEditing ? 'Редактирование акции' : 'Новая акция'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/promotions')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== LEFT COLUMN — Main info ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Основная информация
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название (рус) *
                  </label>
                  <input
                    type="text"
                    value={form.nameRu}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Неделя дизайнерских деревьев"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Название (узб) *
                  </label>
                  <input
                    type="text"
                    value={form.nameUz}
                    onChange={e => setForm(prev => ({ ...prev, nameUz: e.target.value }))}
                    placeholder="Dizayner daraxtlari haftasi"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="nedelya-dizaynerskih-derevev"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Краткое описание (рус)
                  </label>
                  <textarea
                    value={form.descriptionRu}
                    onChange={e => setForm(prev => ({ ...prev, descriptionRu: e.target.value }))}
                    placeholder="Скидки до 30% на дизайнерские деревья"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Краткое описание (узб)
                  </label>
                  <textarea
                    value={form.descriptionUz}
                    onChange={e => setForm(prev => ({ ...prev, descriptionUz: e.target.value }))}
                    placeholder="Dizayner daraxtlariga 30% gacha chegirma"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Правила акции
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Правила (рус)
                </label>
                <textarea
                  value={form.rulesRu}
                  onChange={e => setForm(prev => ({ ...prev, rulesRu: e.target.value }))}
                  placeholder={`Условия акции:\n- Срок действия: ...\n- Скидка применяется к ...\n- Не суммируется с другими скидками`}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Правила (узб)
                </label>
                <textarea
                  value={form.rulesUz}
                  onChange={e => setForm(prev => ({ ...prev, rulesUz: e.target.value }))}
                  placeholder={`Aksiya shartlari:\n- Amal qilish muddati: ...\n- Chegirma ... uchun amal qiladi`}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Товары в акции ({selectedProductIds.length})
              </h3>
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить товары
              </button>
            </div>

            {/* Selected products */}
            {selectedProducts.length > 0 ? (
              <div className="space-y-2 mb-4">
                {selectedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-xs text-gray-400 w-5 text-center">{index + 1}</span>

                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.nameRu}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🪴</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.nameRu}</p>
                      <p className="text-xs text-gray-400">{product.code} · {formatPrice(product.price)} сум</p>
                    </div>

                    <button
                      onClick={() => removeProduct(product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Нет товаров. Нажмите «Добавить товары» чтобы выбрать.
              </div>
            )}

            {/* Product picker */}
            {showProductPicker && (
              <div className="border border-gray-200 rounded-xl p-4 mt-2">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск товаров по названию или коду..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProductIds.includes(product.id)
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-green-50 border border-green-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">🪴</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{product.nameRu}</p>
                          <p className="text-xs text-gray-400">{product.code}</p>
                        </div>

                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatPrice(product.price)} сум
                        </span>
                      </div>
                    )
                  })}

                  {filteredProducts.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-6">Ничего не найдено</p>
                  )}
                </div>

                <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowProductPicker(false)
                      setProductSearch('')
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Готово ({selectedProductIds.length} выбрано)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN — Settings ===== */}
        <div className="space-y-6">

          {/* Status & Type */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Настройки</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Статус</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as PromotionStatus }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип</label>
                <div className="space-y-2">
                  {typeOptions.map(opt => {
                    const Icon = opt.icon
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.type === opt.value
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={opt.value}
                          checked={form.type === opt.value}
                          onChange={e => setForm(prev => ({ ...prev, type: e.target.value as PromotionType }))}
                          className="sr-only"
                        />
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Порядок сортировки
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Срок действия
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Дата начала *
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Дата окончания *
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>

              {form.startDate && form.endDate && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  Длительность:{' '}
                  {Math.ceil(
                    (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  дней
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-purple-500" />
              Баннер
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL изображения
              </label>
              <input
                type="url"
                value={form.image}
                onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
              />

              {form.image && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview link */}
          {isEditing && form.slug && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-500" />
                Предпросмотр
              </h3>
              <a
                href={`/promotion/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline break-all"
              >
                /promotion/{form.slug}
              </a>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}