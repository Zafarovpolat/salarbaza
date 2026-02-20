import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, ArrowLeft, Plus, Trash2, Upload, Link, X, Loader2, Ruler } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import { uploadImage } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface ProductForm {
  code: string
  nameRu: string
  nameUz: string
  descriptionRu: string
  descriptionUz: string
  categoryId: string
  price: string
  oldPrice: string
  material: string
  stockQuantity: string
  isActive: boolean
  isNew: boolean
  isFeatured: boolean
  isSpecialOffer: boolean  // 🆕
}

interface VariantForm {
  id?: string
  size: string
  labelRu: string
  labelUz: string
  price: string
  oldPrice: string
  sku: string
  inStock: boolean
  stockQuantity: string
  dimensions: string
}

interface Category {
  id: string
  nameRu: string
  descriptionRu?: string
  descriptionUz?: string
  wholesaleTemplate?: { id: string; name: string; tiers: { minQuantity: number; discountPercent: number }[] } | null
}

interface ProductImage {
  id: string
  url: string
  isMain: boolean
}

const SAVED_DESCRIPTION_KEY = 'admin_last_description'
const SAVED_CATEGORY_KEY = 'admin_last_category'

const initialForm: ProductForm = {
  code: '',
  nameRu: '',
  nameUz: '',
  descriptionRu: '',
  descriptionUz: '',
  categoryId: '',
  price: '',
  oldPrice: '',
  material: '',
  stockQuantity: '0',
  isActive: true,
  isNew: false,
  isFeatured: false,
  isSpecialOffer: false,  // 🆕
}

const emptyVariant: VariantForm = {
  size: '',
  labelRu: '',
  labelUz: '',
  price: '',
  oldPrice: '',
  sku: '',
  inStock: true,
  stockQuantity: '0',
  dimensions: '',
}

export function AdminProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNew = !id || id === 'new'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialCategoryId = searchParams.get('categoryId') || ''

  const [form, setForm] = useState<ProductForm>({
    ...initialForm,
    categoryId: initialCategoryId,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')

  const [variants, setVariants] = useState<VariantForm[]>([])
  const [showVariants, setShowVariants] = useState(false)

  useEffect(() => {
    loadCategories()
    if (!isNew) loadProduct()
  }, [id])

  useEffect(() => {
    if (isNew && initialCategoryId && categories.length > 0) {
      const category = categories.find(c => c.id === initialCategoryId)
      if (category) {
        setForm(prev => ({
          ...prev,
          categoryId: initialCategoryId,
          descriptionRu: prev.descriptionRu || category.descriptionRu || '',
          descriptionUz: prev.descriptionUz || category.descriptionUz || '',
        }))
      }
    } else if (isNew && !initialCategoryId) {
      const savedDescription = localStorage.getItem(SAVED_DESCRIPTION_KEY)
      const savedCategory = localStorage.getItem(SAVED_CATEGORY_KEY)
      if (savedDescription || savedCategory) {
        setForm(prev => ({
          ...prev,
          descriptionRu: prev.descriptionRu || savedDescription || '',
          categoryId: prev.categoryId || savedCategory || '',
        }))
      }
    }
  }, [categories, initialCategoryId, isNew])

  const loadCategories = async () => {
    try {
      const data = await adminService.getCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Ошибка загрузки категорий')
    }
  }

  const loadProduct = async () => {
    try {
      const product = await adminService.getProduct(id!)
      setForm({
        code: product.code,
        nameRu: product.nameRu,
        nameUz: product.nameUz || '',
        descriptionRu: product.descriptionRu || '',
        descriptionUz: product.descriptionUz || '',
        categoryId: product.categoryId || '',
        price: String(product.price),
        oldPrice: product.oldPrice ? String(product.oldPrice) : '',
        material: product.material || '',
        stockQuantity: String(product.stockQuantity),
        isActive: product.isActive,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isSpecialOffer: product.isSpecialOffer || false,  // 🆕
      })
      setImages(product.images || [])

      if (product.variants && product.variants.length > 0) {
        setVariants(
          product.variants.map((v: any) => ({
            id: v.id,
            size: v.size,
            labelRu: v.labelRu,
            labelUz: v.labelUz,
            price: String(v.price),
            oldPrice: v.oldPrice ? String(v.oldPrice) : '',
            sku: v.sku || '',
            inStock: v.inStock,
            stockQuantity: String(v.stockQuantity || 0),
            dimensions: v.dimensions ? JSON.stringify(v.dimensions) : '',
          }))
        )
        setShowVariants(true)
      }
    } catch (error) {
      toast.error('Ошибка загрузки товара')
      handleBack()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value
    const category = categories.find(c => c.id === categoryId)
    if (isNew && category) {
      setForm(prev => ({
        ...prev,
        categoryId,
        descriptionRu: category.descriptionRu || '',
        descriptionUz: category.descriptionUz || '',
      }))
    } else {
      setForm(prev => ({ ...prev, categoryId }))
    }
  }

  const handleBack = () => {
    if (initialCategoryId) {
      navigate(`/admin/categories/${initialCategoryId}/products`)
    } else if (form.categoryId) {
      navigate(`/admin/categories/${form.categoryId}/products`)
    } else {
      navigate('/admin/products')
    }
  }

  const handleAddVariant = () => {
    setVariants(prev => [...prev, { ...emptyVariant }])
    setShowVariants(true)
  }

  const handleRemoveVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const handleVariantChange = (index: number, field: keyof VariantForm, value: string | boolean) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const handleAddStandardSizes = () => {
    const basePrice = parseInt(form.price) || 0
    const standardVariants: VariantForm[] = [
      { size: 'S', labelRu: 'Маленький', labelUz: 'Kichik', price: String(basePrice), oldPrice: '', sku: `${form.code}-S`, inStock: true, stockQuantity: '0', dimensions: '' },
      { size: 'M', labelRu: 'Средний', labelUz: "O'rta", price: String(Math.round(basePrice * 1.3)), oldPrice: '', sku: `${form.code}-M`, inStock: true, stockQuantity: '0', dimensions: '' },
      { size: 'L', labelRu: 'Большой', labelUz: 'Katta', price: String(Math.round(basePrice * 1.7)), oldPrice: '', sku: `${form.code}-L`, inStock: true, stockQuantity: '0', dimensions: '' },
    ]
    setVariants(standardVariants)
    setShowVariants(true)
    toast.success('Добавлены стандартные размеры S/M/L')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (showVariants && variants.length > 0) {
        for (const v of variants) {
          if (!v.size || !v.labelRu || !v.price) {
            toast.error('Заполните все обязательные поля вариантов (размер, название, цена)')
            setSaving(false)
            return
          }
        }
      }

      const productData: any = {
        ...form,
        price: parseInt(form.price),
        oldPrice: form.oldPrice ? parseInt(form.oldPrice) : null,
        stockQuantity: parseInt(form.stockQuantity),
        slug: form.code
          .toLowerCase()
          .replace(/[\/\\]/g, '-')
          .replace(/[^a-z0-9\-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        images: isNew ? images.map(img => ({ url: img.url, alt: form.nameRu })) : undefined,
        variants:
          showVariants && variants.length > 0
            ? variants.map((v, index) => ({
                size: v.size,
                labelRu: v.labelRu,
                labelUz: v.labelUz || v.labelRu,
                price: parseInt(v.price),
                oldPrice: v.oldPrice ? parseInt(v.oldPrice) : null,
                sku: v.sku || null,
                inStock: v.inStock,
                stockQuantity: parseInt(v.stockQuantity) || 0,
                dimensions: v.dimensions ? JSON.parse(v.dimensions) : null,
                sortOrder: index,
              }))
            : [],
      }

      if (isNew) {
        await adminService.createProduct(productData)
        localStorage.setItem(SAVED_DESCRIPTION_KEY, form.descriptionRu)
        localStorage.setItem(SAVED_CATEGORY_KEY, form.categoryId)
        toast.success('Товар создан')
      } else {
        await adminService.updateProduct(id!, productData)
        toast.success('Товар обновлён')
      }

      handleBack()
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleClearSaved = () => {
    localStorage.removeItem(SAVED_DESCRIPTION_KEY)
    localStorage.removeItem(SAVED_CATEGORY_KEY)
    setForm(prev => ({ ...prev, descriptionRu: '', descriptionUz: '', categoryId: '' }))
    toast.success('Шаблон очищен')
  }

  // === Image handlers ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImage(true)
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file, 'products')
        if (url) {
          if (isNew) {
            setImages(prev => [...prev, { id: `temp-${Date.now()}-${Math.random()}`, url, isMain: prev.length === 0 }])
          } else {
            const savedImage = await adminService.addProductImage(id!, url, images.length === 0)
            setImages(prev => [...prev, savedImage])
          }
          toast.success('Фото загружено')
        }
      } catch {
        toast.error('Ошибка загрузки')
      }
    }
    setUploadingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return
    try {
      if (isNew) {
        setImages(prev => [...prev, { id: `temp-${Date.now()}`, url: newImageUrl.trim(), isMain: prev.length === 0 }])
      } else {
        const savedImage = await adminService.addProductImage(id!, newImageUrl.trim(), images.length === 0)
        setImages(prev => [...prev, savedImage])
        toast.success('Фото добавлено')
      }
      setNewImageUrl('')
      setShowUrlInput(false)
    } catch {
      toast.error('Ошибка добавления фото')
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    try {
      if (isNew || imageId.startsWith('temp-')) {
        setImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        await adminService.deleteProductImage(id!, imageId)
        setImages(prev => prev.filter(img => img.id !== imageId))
        toast.success('Фото удалено')
      }
    } catch {
      toast.error('Ошибка удаления фото')
    }
  }

  const handleSetMainImage = (imageId: string) => {
    setImages(prev => prev.map(img => ({ ...img, isMain: img.id === imageId })))
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId)
  const categoryWholesale = selectedCategory?.wholesaleTemplate

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {isNew ? 'Новый товар' : 'Редактировать'}
            </h1>
          </div>
          {isNew && (form.descriptionRu || form.categoryId) && !initialCategoryId && (
            <button type="button" onClick={handleClearSaved} className="text-sm text-gray-500 hover:text-red-500">
              Очистить шаблон
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Основная информация</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код *</label>
                <input type="text" name="code" value={form.code} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
                <select name="categoryId" value={form.categoryId} onChange={handleCategoryChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none bg-white" required>
                  <option value="">Выберите</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nameRu}</option>
                  ))}
                </select>
                {isNew && categories.find(c => c.id === form.categoryId)?.descriptionRu && (
                  <p className="text-xs text-green-600 mt-1">📋 Шаблон описания применён</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU) *</label>
              <input type="text" name="nameRu" value={form.nameRu} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название (UZ)</label>
              <input type="text" name="nameUz" value={form.nameUz} onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание (RU)</label>
              <textarea name="descriptionRu" value={form.descriptionRu} onChange={handleChange} rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание (UZ)</label>
              <textarea name="descriptionUz" value={form.descriptionUz} onChange={handleChange} rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none" />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">
              {showVariants && variants.length > 0 ? 'Базовая цена' : 'Цена и наличие'}
            </h2>
            {showVariants && variants.length > 0 && (
              <p className="text-sm text-amber-600 -mt-2">
                ⚠️ При наличии вариантов эта цена используется как базовая/минимальная.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цена *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" required min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Старая цена</label>
                <input type="number" name="oldPrice" value={form.oldPrice} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" min="0" />
                <p className="text-[10px] text-gray-400 mt-0.5">Необязательно для спецпредложений</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Остаток</label>
                <input type="number" name="stockQuantity" value={form.stockQuantity} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" min="0" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Варианты размеров
              </h2>
              <div className="flex gap-2">
                {variants.length === 0 && (
                  <button type="button" onClick={handleAddStandardSizes}
                    className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    + S / M / L
                  </button>
                )}
                <button type="button" onClick={handleAddVariant}
                  className="text-sm px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Ruler className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Нет вариантов размеров</p>
                <p className="text-xs text-gray-400 mt-1">Товар будет продаваться по одной цене без выбора размера</p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 relative">
                    <button type="button" onClick={() => handleRemoveVariant(index)}
                      className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-medium text-gray-500 mb-3">
                      Вариант #{index + 1}
                      {variant.size && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-700">{variant.size}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Размер *</label>
                        <input type="text" value={variant.size} onChange={e => handleVariantChange(index, 'size', e.target.value)}
                          placeholder="S / M / L" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Название RU *</label>
                        <input type="text" value={variant.labelRu} onChange={e => handleVariantChange(index, 'labelRu', e.target.value)}
                          placeholder="Маленький" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Название UZ</label>
                        <input type="text" value={variant.labelUz} onChange={e => handleVariantChange(index, 'labelUz', e.target.value)}
                          placeholder="Kichik" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Цена *</label>
                        <input type="number" value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="1000000" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" required min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Старая цена</label>
                        <input type="number" value={variant.oldPrice} onChange={e => handleVariantChange(index, 'oldPrice', e.target.value)}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Остаток</label>
                        <input type="number" value={variant.stockQuantity} onChange={e => handleVariantChange(index, 'stockQuantity', e.target.value)}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" min="0" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Артикул</label>
                        <input type="text" value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)}
                          placeholder={`${form.code}-${variant.size}`} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={variant.inStock} onChange={e => handleVariantChange(index, 'inStock', e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-700">В наличии</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wholesale */}
          {categoryWholesale && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h2 className="font-semibold text-purple-900 flex items-center gap-2 mb-2">📊 Оптовые цены (из категории)</h2>
              <p className="text-sm text-purple-700 mb-2">Шаблон: <strong>{categoryWholesale.name}</strong></p>
              <div className="flex flex-wrap gap-2">
                {categoryWholesale.tiers?.map((tier: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {tier.minQuantity}+ шт → -{tier.discountPercent}%
                  </span>
                ))}
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Эти скидки автоматически применяются ко всем товарам в категории "{selectedCategory?.nameRu}"
              </p>
            </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Изображения</h2>
              {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-green-600" />}
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative aspect-square group">
                    <img src={img.url} alt=""
                      className={`w-full h-full object-cover rounded-lg border-2 ${img.isMain ? 'border-green-500' : 'border-gray-200'}`}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Error' }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <button type="button" onClick={() => handleSetMainImage(img.id)} className="p-1.5 bg-white rounded text-xs">⭐</button>
                      <button type="button" onClick={() => handleRemoveImage(img.id)} className="p-1.5 bg-red-500 text-white rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {img.isMain && <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">Главная</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                <Upload className="w-5 h-5" /><span>Загрузить фото</span>
              </button>
              <button type="button" onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <Link className="w-5 h-5" />
              </button>
            </div>
            {showUrlInput && (
              <div className="flex gap-2">
                <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="https://..."
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none" />
                <button type="button" onClick={handleAddImageUrl} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => { setShowUrlInput(false); setNewImageUrl('') }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Flags — 🆕 с isSpecialOffer */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Настройки</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-5 h-5 rounded" />
                <span className="text-gray-700">Активен</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isNew" checked={form.isNew} onChange={handleChange} className="w-5 h-5 rounded" />
                <span className="text-gray-700">Новинка</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="w-5 h-5 rounded" />
                <span className="text-gray-700">Рекомендуемый</span>
              </label>
              {/* 🆕 Спецпредложение */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="isSpecialOffer" checked={form.isSpecialOffer} onChange={handleChange} className="w-5 h-5 rounded mt-0.5" />
                <div>
                  <span className="text-gray-700 font-medium">🔥 Спецпредложение</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Отображается в разделе «Спецпредложения». Старая цена необязательна.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 sticky bottom-4">
            <button type="button" onClick={handleBack}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium bg-white">
              Отмена
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}