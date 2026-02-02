// pages/admin/AdminCategoriesPage.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Save, X, ChevronRight, Package } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Category {
    id: string
    slug: string
    nameRu: string
    nameUz: string
    descriptionRu?: string
    descriptionUz?: string
    sortOrder: number
    isActive: boolean
    _count?: { products: number }
}

interface CategoryForm {
    slug: string
    nameRu: string
    nameUz: string
    descriptionRu: string
    descriptionUz: string
    image: string
    sortOrder: number
    isActive: boolean
}

const initialForm: CategoryForm = {
    slug: '',
    nameRu: '',
    nameUz: '',
    descriptionRu: '',
    descriptionUz: '',
    image: '',
    sortOrder: 0,
    isActive: true
}

export function AdminCategoriesPage() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<CategoryForm>(initialForm)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await adminService.getCategories()
            setCategories(data)
        } catch (error) {
            toast.error('Ошибка загрузки категорий')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (e: React.MouseEvent, category: Category) => {
        e.stopPropagation() // ✅ Предотвращаем переход на товары
        setEditingId(category.id)
        setForm({
            slug: category.slug,
            nameRu: category.nameRu,
            nameUz: category.nameUz || '',
            descriptionRu: category.descriptionRu || '',
            descriptionUz: category.descriptionUz || '',
            image: '',
            sortOrder: category.sortOrder,
            isActive: category.isActive
        })
        setShowForm(true)
    }

    const handleNew = () => {
        setEditingId(null)
        setForm(initialForm)
        setShowForm(true)
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(initialForm)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            if (editingId) {
                await adminService.updateCategory(editingId, form)
                toast.success('Категория обновлена')
            } else {
                await adminService.createCategory(form)
                toast.success('Категория создана')
            }
            loadCategories()
            handleCancel()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: string, name: string, productsCount: number) => {
        e.stopPropagation() // ✅ Предотвращаем переход на товары

        const message = productsCount > 0
            ? `Удалить категорию "${name}"?\n\n⚠️ ${productsCount} товаров останутся без категории.`
            : `Удалить категорию "${name}"?`

        if (!confirm(message)) return

        try {
            await adminService.deleteCategory(id)
            toast.success('Категория удалена')
            loadCategories()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления')
        }
    }

    // ✅ Переход к товарам категории
    const handleCategoryClick = (categoryId: string) => {
        navigate(`/admin/categories/${categoryId}/products`)
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Категории</h1>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Добавить</span>
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">
                                {editingId ? 'Редактировать' : 'Новая категория'}
                            </h2>
                            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={form.slug}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                    required
                                    disabled={!!editingId}
                                    placeholder="moss-panels"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU) *</label>
                                <input
                                    type="text"
                                    name="nameRu"
                                    value={form.nameRu}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
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
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон описания (RU)</label>
                                <textarea
                                    name="descriptionRu"
                                    value={form.descriptionRu}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none"
                                    placeholder="Шаблон описания для товаров этой категории"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон описания (UZ)</label>
                                <textarea
                                    name="descriptionUz"
                                    value={form.descriptionUz}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none"
                                    placeholder="Tovarlar uchun shablon tavsifi"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded"
                                    />
                                    <span className="text-gray-700">Активна</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? '...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Categories List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Загрузка...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Категории не найдены
                    </div>
                ) : (
                    categories.map((category) => (
                        <div
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all active:scale-[0.99]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-gray-900">{category.nameRu}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {category.isActive ? 'Активна' : 'Скрыта'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-gray-500">
                                            {category.slug}
                                        </p>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex items-center gap-1 text-sm text-blue-600">
                                            <Package className="w-3.5 h-3.5" />
                                            <span>{category._count?.products || 0} товаров</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={(e) => handleEdit(e, category)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Редактировать категорию"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, category.id, category.nameRu, category._count?.products || 0)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Удалить категорию"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    )
}