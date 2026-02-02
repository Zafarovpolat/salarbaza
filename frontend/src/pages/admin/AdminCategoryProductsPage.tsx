// pages/admin/AdminCategoryProductsPage.tsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, ArrowLeft, Search, Package } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Product {
    id: string
    code: string
    nameRu: string
    price: number
    oldPrice?: number
    stockQuantity: number
    isActive: boolean
    isNew: boolean
    isFeatured: boolean
    images: { url: string; isMain: boolean }[]
}

interface Category {
    id: string
    nameRu: string
    nameUz: string
    slug: string
    _count?: { products: number }
}

export function AdminCategoryProductsPage() {
    const { categoryId } = useParams<{ categoryId: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<Category | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (categoryId) {
            loadData()
        }
    }, [categoryId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Загружаем данные категории
            const categories = await adminService.getCategories()
            const currentCategory = categories.find((c: Category) => c.id === categoryId)

            if (!currentCategory) {
                toast.error('Категория не найдена')
                navigate('/admin/categories')
                return
            }

            setCategory(currentCategory)

            // Загружаем товары этой категории
            const productsData = await adminService.getProducts({ categoryId })
            setProducts(productsData.products || productsData)
        } catch (error) {
            toast.error('Ошибка загрузки данных')
            navigate('/admin/categories')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить товар "${name}"?`)) return

        try {
            await adminService.deleteProduct(id)
            toast.success('Товар удалён')
            loadData()
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления')
        }
    }

    const getMainImage = (images: Product['images']) => {
        if (!images || images.length === 0) return null
        const main = images.find(img => img.isMain)
        return main?.url || images[0]?.url
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' сўм'
    }

    // Фильтрация товаров по поиску
    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            product.nameRu.toLowerCase().includes(query) ||
            product.code.toLowerCase().includes(query)
        )
    })

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
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/categories')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                            {category?.nameRu}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {filteredProducts.length} товаров
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Добавить</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по названию или коду..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-green-500 outline-none"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                            {searchQuery ? 'Товары не найдены' : 'В этой категории пока нет товаров'}
                        </p>
                        <button
                            onClick={() => navigate('/admin/products/new')}
                            className="mt-4 text-green-600 font-medium hover:underline"
                        >
                            Добавить первый товар
                        </button>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex gap-3">
                                {/* Image */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {getMainImage(product.images) ? (
                                        <img
                                            src={getMainImage(product.images)!}
                                            alt={product.nameRu}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image'
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Package className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {product.nameRu}
                                            </h3>
                                            <p className="text-sm text-gray-500">{product.code}</p>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1">
                                            {!product.isActive && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                                    Скрыт
                                                </span>
                                            )}
                                            {product.isNew && (
                                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                    NEW
                                                </span>
                                            )}
                                            {product.isFeatured && (
                                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                                    ⭐
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <span className="font-semibold text-green-600">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.oldPrice && (
                                                <span className="text-sm text-gray-400 line-through ml-2">
                                                    {formatPrice(product.oldPrice)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => navigate(`/admin/products/${product.id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Редактировать"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.nameRu)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    )
}