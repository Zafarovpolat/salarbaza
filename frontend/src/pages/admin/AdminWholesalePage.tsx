// frontend/src/pages/admin/AdminWholesalePage.tsx

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Package, Star, FolderTree } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Tier {
    id?: string
    minQuantity: number
    discountPercent: number
}

interface Template {
    id: string
    name: string
    description?: string
    isDefault: boolean
    tiers: Tier[]
    // ✅ НОВОЕ: счётчик категорий вместо товаров
    _count?: { categories: number }
    categories?: { id: string; nameRu: string; nameUz: string; slug: string }[]
}

interface TemplateForm {
    name: string
    description: string
    isDefault: boolean
    tiers: Tier[]
}

const initialForm: TemplateForm = {
    name: '',
    description: '',
    isDefault: false,
    tiers: [
        { minQuantity: 5, discountPercent: 5 },
        { minQuantity: 10, discountPercent: 10 },
        { minQuantity: 20, discountPercent: 15 },
    ]
}

export function AdminWholesalePage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<TemplateForm>(initialForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const data = await adminService.getWholesaleTemplates()
            setTemplates(data)
        } catch (error) {
            toast.error('Ошибка загрузки шаблонов')
        } finally {
            setLoading(false)
        }
    }

    const handleNew = () => {
        setEditingId(null)
        setForm(initialForm)
        setShowForm(true)
    }

    const handleEdit = (template: Template) => {
        setEditingId(template.id)
        setForm({
            name: template.name,
            description: template.description || '',
            isDefault: template.isDefault,
            tiers: template.tiers.map(t => ({
                minQuantity: t.minQuantity,
                discountPercent: t.discountPercent
            }))
        })
        setShowForm(true)
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(initialForm)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (form.tiers.length === 0) {
            toast.error('Добавьте хотя бы один порог')
            return
        }

        setSaving(true)

        try {
            if (editingId) {
                await adminService.updateWholesaleTemplate(editingId, form)
                toast.success('Шаблон обновлён')
            } else {
                await adminService.createWholesaleTemplate(form)
                toast.success('Шаблон создан')
            }
            loadTemplates()
            handleCancel()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, name: string, categoriesCount: number) => {
        // ✅ Обновлённое сообщение
        const message = categoriesCount > 0
            ? `Удалить шаблон "${name}"?\n\n⚠️ ${categoriesCount} категорий потеряют оптовые скидки.`
            : `Удалить шаблон "${name}"?`

        if (!confirm(message)) return

        try {
            await adminService.deleteWholesaleTemplate(id)
            toast.success('Шаблон удалён')
            loadTemplates()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления')
        }
    }

    // Управление порогами
    const addTier = () => {
        const lastTier = form.tiers[form.tiers.length - 1]
        setForm(prev => ({
            ...prev,
            tiers: [
                ...prev.tiers,
                {
                    minQuantity: lastTier ? lastTier.minQuantity + 10 : 5,
                    discountPercent: lastTier ? lastTier.discountPercent + 5 : 5
                }
            ]
        }))
    }

    const removeTier = (index: number) => {
        setForm(prev => ({
            ...prev,
            tiers: prev.tiers.filter((_, i) => i !== index)
        }))
    }

    const updateTier = (index: number, field: 'minQuantity' | 'discountPercent', value: number) => {
        setForm(prev => ({
            ...prev,
            tiers: prev.tiers.map((tier, i) =>
                i === index ? { ...tier, [field]: value } : tier
            )
        }))
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Оптовые цены</h1>
                    {/* ✅ Обновлённое описание */}
                    <p className="text-sm text-gray-500 mt-1">
                        Шаблоны скидок для категорий товаров
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Создать</span>
                </button>
            </div>

            {/* ✅ Инфо-блок */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800">
                    <strong>Как работает:</strong> Привяжите шаблон к категории →
                    все товары в этой категории автоматически получат оптовые скидки.
                    Управлять привязкой можно на странице <strong>Категории</strong>.
                </p>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold">
                                {editingId ? 'Редактировать шаблон' : 'Новый шаблон'}
                            </h2>
                            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                    placeholder="Например: Скидки для деревьев"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Описание
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                    placeholder="Опционально"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                    className="w-5 h-5 rounded"
                                />
                                <span className="text-gray-700">Использовать по умолчанию</span>
                            </label>

                            {/* Tiers */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Пороги скидок
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addTier}
                                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                                    >
                                        + Добавить
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {form.tiers.map((tier, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500">От (шт)</label>
                                                <input
                                                    type="number"
                                                    value={tier.minQuantity}
                                                    onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-center"
                                                    min="1"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500">Скидка (%)</label>
                                                <input
                                                    type="number"
                                                    value={tier.discountPercent}
                                                    onChange={(e) => updateTier(index, 'discountPercent', parseInt(e.target.value) || 0)}
                                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-center"
                                                    min="1"
                                                    max="99"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeTier(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-4"
                                                disabled={form.tiers.length <= 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Превью расчёта */}
                            {form.tiers.length > 0 && (
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-green-800 mb-2">
                                        Пример для товара 1 000 000 сум:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.tiers
                                            .sort((a, b) => a.minQuantity - b.minQuantity)
                                            .map((tier, i) => {
                                                const price = Math.round(1000000 * (1 - tier.discountPercent / 100))
                                                return (
                                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                        {tier.minQuantity}+ шт → {new Intl.NumberFormat('uz-UZ').format(price)} сум
                                                    </span>
                                                )
                                            })}
                                    </div>
                                </div>
                            )}

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

            {/* Templates List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Загрузка...
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Шаблоны не найдены</p>
                        <button
                            onClick={handleNew}
                            className="mt-3 text-green-600 font-medium hover:underline"
                        >
                            Создать первый шаблон
                        </button>
                    </div>
                ) : (
                    templates.map((template) => (
                        <div key={template.id} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                                        {template.isDefault && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                <Star className="w-3 h-3" />
                                                По умолчанию
                                            </span>
                                        )}
                                    </div>
                                    {template.description && (
                                        <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                                    )}

                                    {/* Tiers preview */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {template.tiers.map((tier, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"
                                            >
                                                {tier.minQuantity}+ шт → -{tier.discountPercent}%
                                            </span>
                                        ))}
                                    </div>

                                    {/* ✅ НОВОЕ: показываем категории вместо товаров */}
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <FolderTree className="w-3.5 h-3.5" />
                                            {template._count?.categories || 0} категорий
                                        </span>

                                        {/* Показываем названия категорий если есть */}
                                        {template.categories && template.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {template.categories.map(cat => (
                                                    <span
                                                        key={cat.id}
                                                        className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                                                    >
                                                        {cat.nameRu}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(
                                            template.id,
                                            template.name,
                                            template._count?.categories || 0
                                        )}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        disabled={template.isDefault}
                                        title={template.isDefault ? 'Нельзя удалить дефолтный шаблон' : 'Удалить'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    )
}