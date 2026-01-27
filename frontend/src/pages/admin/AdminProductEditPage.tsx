import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Plus, Trash2, Upload, Link, X, Loader2 } from 'lucide-react'
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
}

interface Category {
    id: string
    nameRu: string
}

interface ProductImage {
    id: string
    url: string
    isMain: boolean
}

// ✅ Ключ для localStorage
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
    isFeatured: false
}

export function AdminProductEditPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isNew = !id || id === 'new'
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState<ProductForm>(initialForm)
    const [categories, setCategories] = useState<Category[]>([])
    const [images, setImages] = useState<ProductImage[]>([])
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [newImageUrl, setNewImageUrl] = useState('')

    useEffect(() => {
        loadCategories()
        if (!isNew) {
            loadProduct()
        } else {
            // ✅ Для нового товара — загружаем сохранённые данные
            loadSavedData()
        }
    }, [id])

    // ✅ Загрузка сохранённых данных для нового товара
    const loadSavedData = () => {
        const savedDescription = localStorage.getItem(SAVED_DESCRIPTION_KEY)
        const savedCategory = localStorage.getItem(SAVED_CATEGORY_KEY)

        if (savedDescription || savedCategory) {
            setForm(prev => ({
                ...prev,
                descriptionRu: savedDescription || '',
                categoryId: savedCategory || ''
            }))
        }
    }

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
                categoryId: product.categoryId,
                price: String(product.price),
                oldPrice: product.oldPrice ? String(product.oldPrice) : '',
                material: product.material || '',
                stockQuantity: String(product.stockQuantity),
                isActive: product.isActive,
                isNew: product.isNew,
                isFeatured: product.isFeatured
            })
            setImages(product.images || [])
        } catch (error) {
            toast.error('Ошибка загрузки товара')
            navigate('/admin/products')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const productData = {
                ...form,
                price: parseInt(form.price),
                oldPrice: form.oldPrice ? parseInt(form.oldPrice) : null,
                stockQuantity: parseInt(form.stockQuantity),
                slug: form.code.toLowerCase().replace(/\s+/g, '-'),
                images: isNew ? images.map(img => ({ url: img.url, alt: form.nameRu })) : undefined
            }

            if (isNew) {
                await adminService.createProduct(productData)

                // ✅ Сохраняем описание и категорию для следующего товара
                localStorage.setItem(SAVED_DESCRIPTION_KEY, form.descriptionRu)
                localStorage.setItem(SAVED_CATEGORY_KEY, form.categoryId)

                toast.success('Товар создан')
            } else {
                await adminService.updateProduct(id!, productData)
                toast.success('Товар обновлён')
            }

            navigate('/admin/products')
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    // ✅ Кнопка очистки сохранённых данных
    const handleClearSaved = () => {
        localStorage.removeItem(SAVED_DESCRIPTION_KEY)
        localStorage.removeItem(SAVED_CATEGORY_KEY)
        setForm(prev => ({
            ...prev,
            descriptionRu: '',
            categoryId: ''
        }))
        toast.success('Шаблон очищен')
    }

    // Загрузка файла с устройства
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploadingImage(true)

        for (const file of Array.from(files)) {
            try {
                const url = await uploadImage(file, 'products')

                if (url) {
                    if (isNew) {
                        const newImage: ProductImage = {
                            id: `temp-${Date.now()}`,
                            url,
                            isMain: images.length === 0
                        }
                        setImages(prev => [...prev, newImage])
                    } else {
                        const savedImage = await adminService.addProductImage(id!, url, images.length === 0)
                        setImages(prev => [...prev, savedImage])
                    }
                    toast.success('Фото загружено')
                } else {
                    toast.error('Ошибка загрузки файла')
                }
            } catch (error) {
                toast.error('Ошибка загрузки')
            }
        }

        setUploadingImage(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleAddImageUrl = async () => {
        if (!newImageUrl.trim()) return

        try {
            if (isNew) {
                const newImage: ProductImage = {
                    id: `temp-${Date.now()}`,
                    url: newImageUrl.trim(),
                    isMain: images.length === 0
                }
                setImages(prev => [...prev, newImage])
            } else {
                const savedImage = await adminService.addProductImage(id!, newImageUrl.trim(), images.length === 0)
                setImages(prev => [...prev, savedImage])
                toast.success('Фото добавлено')
            }

            setNewImageUrl('')
            setShowUrlInput(false)
        } catch (error) {
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
        } catch (error) {
            toast.error('Ошибка удаления фото')
        }
    }

    const handleSetMainImage = (imageId: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            isMain: img.id === imageId
        })))
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

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                            {isNew ? 'Новый товар' : 'Редактировать'}
                        </h1>
                    </div>

                    {/* ✅ Кнопка очистки шаблона для новых товаров */}
                    {isNew && (form.descriptionRu || form.categoryId) && (
                        <button
                            type="button"
                            onClick={handleClearSaved}
                            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                        >
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
                                <input
                                    type="text"
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
                                <select
                                    name="categoryId"
                                    value={form.categoryId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base bg-white"
                                    required
                                >
                                    <option value="">Выберите</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nameRu}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU) *</label>
                            <input
                                type="text"
                                name="nameRu"
                                value={form.nameRu}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название (UZ)</label>
                            <input
                                type="text"
                                name="nameUz"
                                value={form.nameUz}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                            />
                        </div>

                        {/* ✅ Описание с индикатором шаблона */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Описание (RU)</label>
                                {isNew && localStorage.getItem(SAVED_DESCRIPTION_KEY) && (
                                    <span className="text-xs text-green-600">📋 Из шаблона</span>
                                )}
                            </div>
                            <textarea
                                name="descriptionRu"
                                value={form.descriptionRu}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base resize-none"
                            />
                        </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                        <h2 className="font-semibold text-gray-900">Цена и наличие</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Старая цена</label>
                                <input
                                    type="number"
                                    name="oldPrice"
                                    value={form.oldPrice}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Остаток</label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={form.stockQuantity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Изображения</h2>
                            {uploadingImage && (
                                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                            )}
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {images.map(img => (
                                    <div key={img.id} className="relative aspect-square group">
                                        <img
                                            src={img.url}
                                            alt=""
                                            className={`w-full h-full object-cover rounded-lg border-2 ${img.isMain ? 'border-green-500' : 'border-gray-200'}`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Error'
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleSetMainImage(img.id)}
                                                className="p-1.5 bg-white rounded text-xs"
                                                title="Сделать главной"
                                            >
                                                ⭐
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(img.id)}
                                                className="p-1.5 bg-red-500 text-white rounded"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {img.isMain && (
                                            <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                Главная
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-5 h-5" />
                                <span>Загрузить фото</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Добавить по ссылке"
                            >
                                <Link className="w-5 h-5" />
                            </button>
                        </div>

                        {showUrlInput && (
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddImageUrl}
                                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUrlInput(false)
                                        setNewImageUrl('')
                                    }}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Flags */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-3">Настройки</h2>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={form.isActive}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-green-600"
                                />
                                <span className="text-gray-700">Активен</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isNew"
                                    checked={form.isNew}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-green-600"
                                />
                                <span className="text-gray-700">Новинка</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={form.isFeatured}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-green-600"
                                />
                                <span className="text-gray-700">Рекомендуемый</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 sticky bottom-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium bg-white"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    )
}