import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
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
    image?: string
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

    const handleEdit = (category: Category) => {
        setEditingId(category.id)
        setForm({
            slug: category.slug,
            nameRu: category.nameRu,
            nameUz: category.nameUz || '',
            descriptionRu: category.descriptionRu || '',
            descriptionUz: category.descriptionUz || '',
            image: category.image || '',
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

    const handleDelete = async (id: string, name: string, productsCount: number) => {
        if (productsCount > 0) {
            toast.error(`Нельзя удалить категорию с ${productsCount} товарами`)
            return
        }

        if (!confirm(`Удалить категорию "${name}"?`)) return

        try {
            await adminService.deleteCategory(id)
            toast.success('Категория удалена')
            loadCategories()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления')
        }
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Добавить категорию
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingId ? 'Редактировать категорию' : 'Новая категория'}
                            </h2>
                            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug (URL) *
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={form.slug}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                    required
                                    disabled={!!editingId}
                                    placeholder="moss-panels"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Название (RU) *
                                </label>
                                <input
                                    type="text"
                                    name="nameRu"
                                    value={form.nameRu}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Название (UZ)
                                </label>
                                <input
                                    type="text"
                                    name="nameUz"
                                    value={form.nameUz}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Описание (RU)
                                </label>
                                <textarea
                                    name="descriptionRu"
                                    value={form.descriptionRu}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL изображения
                                </label>
                                <input
                                    type="url"
                                    name="image"
                                    value={form.image}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Порядок сортировки
                                    </label>
                                    <input
                                        type="number"
                                        name="sortOrder"
                                        value={form.sortOrder}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none"
                                    />
                                </div>

                                <div className="flex items-end pb-2">
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
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Порядок</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Slug</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Название</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Товаров</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Статус</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Загрузка...
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Категории не найдены
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-600">{category.sortOrder}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{category.slug}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{category.nameRu}</div>
                                            {category.nameUz && (
                                                <div className="text-sm text-gray-500">{category.nameUz}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {category._count?.products || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {category.isActive ? 'Активна' : 'Скрыта'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category.nameRu, category._count?.products || 0)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}