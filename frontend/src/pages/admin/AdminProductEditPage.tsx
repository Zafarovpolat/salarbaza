import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
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

    const [form, setForm] = useState<ProductForm>(initialForm)
    const [categories, setCategories] = useState<Category[]>([])
    const [images, setImages] = useState<ProductImage[]>([])
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [newImageUrl, setNewImageUrl] = useState('')

    useEffect(() => {
        loadCategories()
        if (!isNew) {
            loadProduct()
        }
    }, [id])

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

    const handleAddImage = () => {
        if (!newImageUrl.trim()) return

        const newImage: ProductImage = {
            id: `temp-${Date.now()}`,
            url: newImageUrl.trim(),
            isMain: images.length === 0
        }

        setImages(prev => [...prev, newImage])
        setNewImageUrl('')
    }

    const handleRemoveImage = (imageId: string) => {
        setImages(prev => prev.filter(img => img.id !== imageId))
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
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
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
                                    disabled={!isNew}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Описание (RU)</label>
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
                        <h2 className="font-semibold text-gray-900">Изображения</h2>

                        {/* Image Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {images.map(img => (
                                    <div key={img.id} className="relative aspect-square group">
                                        <img
                                            src={img.url}
                                            alt=""
                                            className={`w-full h-full object-cover rounded-lg border-2 ${img.isMain ? 'border-green-500' : 'border-gray-200'
                                                }`}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleSetMainImage(img.id)}
                                                className="p-1.5 bg-white rounded text-xs"
                                            >
                                                ⭐
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(img.id)}
                                                className="p-1.5 bg-red-500 text-white rounded"
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

                        {/* Add Image */}
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="URL изображения..."
                                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none text-base"
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
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