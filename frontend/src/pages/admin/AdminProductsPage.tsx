import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, ChevronRight } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { adminService } from '@/services/adminService'
import toast from 'react-hot-toast'

interface Product {
    id: string
    code: string
    nameRu: string
    price: number
    stockQuantity: number
    isActive: boolean
    category: { nameRu: string }
    images: { url: string }[]
}

export function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const data = await adminService.getProducts()
            setProducts(data)
        } catch (error) {
            toast.error('Ошибка загрузки товаров')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить товар "${name}"?`)) return

        try {
            await adminService.deleteProduct(id)
            toast.success('Товар удалён')
            loadProducts()
        } catch (error) {
            toast.error('Ошибка удаления')
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price)
    }

    const filteredProducts = products.filter(p =>
        p.nameRu.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Товары</h1>
                <Link
                    to="/admin/products/new"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span>Добавить</span>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-base"
                    />
                </div>
            </div>

            {/* Products List - Mobile Cards */}
            <div className="space-y-3 lg:hidden">
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Загрузка...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        Товары не найдены
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="flex gap-3">
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.images?.[0]?.url ? (
                                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">📷</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{product.nameRu}</h3>
                                            <p className="text-xs text-gray-500">{product.code}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {product.isActive ? 'Активен' : 'Скрыт'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">{formatPrice(product.price)} сум</p>
                                            <p className="text-xs text-gray-500">Остаток: {product.stockQuantity}</p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Link
                                                to={`/admin/products/${product.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id, product.nameRu)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

            {/* Products Table - Desktop */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Фото</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Код</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Название</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Категория</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Цена</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Остаток</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Статус</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        Загрузка...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        Товары не найдены
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                {product.images?.[0]?.url ? (
                                                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.code}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{product.nameRu}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.category?.nameRu}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(product.price)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.stockQuantity}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {product.isActive ? 'Активен' : 'Скрыт'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    to={`/admin/products/${product.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id, product.nameRu)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            </div>
        </AdminLayout>
    )
}